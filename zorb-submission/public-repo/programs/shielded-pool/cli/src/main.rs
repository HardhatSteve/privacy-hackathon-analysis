use anyhow::{anyhow, Result};
use borsh::BorshSerialize;
use clap::{Parser, Subcommand};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;
use std::path::PathBuf;
use std::str::FromStr;

// Account sizes (from Rust structs)
const COMMITMENT_MERKLE_TREE_SIZE: usize = 4128;
const GLOBAL_CONFIG_SIZE: usize = 40;
const RECEIPT_MERKLE_TREE_SIZE: usize = 912;
const TOKEN_CONFIG_SIZE: usize = 128;

/// CLI for interacting with the shielded pool program
#[derive(Parser)]
#[command(name = "shielded-pool")]
#[command(about = "CLI for interacting with the shielded pool program", long_about = None)]
struct Cli {
    /// Path to the payer keypair file
    #[arg(short, long, default_value = "~/.config/solana/id.json")]
    keypair: String,

    /// RPC URL
    #[arg(short, long, default_value = "http://localhost:8899")]
    url: String,

    /// Program ID (or path to program keypair)
    #[arg(short, long)]
    program_id: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize the shielded pool (creates merkle trees and global config)
    Initialize {
        /// Optional: Path to save account keypairs
        #[arg(short, long)]
        output: Option<PathBuf>,
    },

    /// Register a new asset (token mint) in the shielded pool
    RegisterAsset {
        /// Token mint address
        #[arg(short, long)]
        mint: String,

        /// Global config account address
        #[arg(short, long)]
        global_config: String,

        /// Maximum deposit amount per transaction
        #[arg(long, default_value = "1000000000000")]
        max_deposit: u64,
    },

    /// Show account information
    ShowAccounts {
        /// Commitment tree address
        #[arg(long)]
        tree: Option<String>,

        /// Global config address
        #[arg(long)]
        config: Option<String>,

        /// Receipt tree address
        #[arg(long)]
        receipt_tree: Option<String>,
    },
}

/// Borsh-serializable instruction enum matching the on-chain program
#[derive(BorshSerialize)]
enum ShieldedPoolInstruction {
    Initialize,
    Transact {
        // Simplified - not used in CLI
    },
    PoseidonHash {
        input: [u8; 32],
    },
    RegisterAsset {
        max_deposit_amount: u64,
    },
    UpdateTokenConfig {
        deposit_fee_rate: Option<u16>,
        withdrawal_fee_rate: Option<u16>,
        max_deposit_amount: Option<u64>,
        is_active: Option<bool>,
    },
}

fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

fn load_keypair(path: &str) -> Result<Keypair> {
    let expanded = expand_tilde(path);
    read_keypair_file(&expanded)
        .map_err(|e| anyhow!("Failed to read keypair from {:?}: {}", expanded, e))
}

fn get_program_id(program_id_str: &str) -> Result<Pubkey> {
    // Try to parse as pubkey first
    if let Ok(pubkey) = Pubkey::from_str(program_id_str) {
        return Ok(pubkey);
    }

    // Try to load as keypair file
    let keypair = load_keypair(program_id_str)?;
    Ok(keypair.pubkey())
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    let payer = load_keypair(&cli.keypair)?;
    let program_id = get_program_id(&cli.program_id)?;
    let client = RpcClient::new_with_commitment(&cli.url, CommitmentConfig::confirmed());

    println!("Program ID: {}", program_id);
    println!("Payer: {}", payer.pubkey());

    match cli.command {
        Commands::Initialize { output } => {
            initialize(&client, &payer, &program_id, output)?;
        }
        Commands::RegisterAsset {
            mint,
            global_config,
            max_deposit,
        } => {
            let mint_pubkey = Pubkey::from_str(&mint)?;
            let global_config_pubkey = Pubkey::from_str(&global_config)?;
            register_asset(
                &client,
                &payer,
                &program_id,
                &mint_pubkey,
                &global_config_pubkey,
                max_deposit,
            )?;
        }
        Commands::ShowAccounts {
            tree,
            config,
            receipt_tree,
        } => {
            show_accounts(&client, tree, config, receipt_tree)?;
        }
    }

    Ok(())
}

fn initialize(
    client: &RpcClient,
    payer: &Keypair,
    program_id: &Pubkey,
    output: Option<PathBuf>,
) -> Result<()> {
    println!("\n=== Initializing Shielded Pool ===\n");

    // Check payer balance
    let balance = client.get_balance(&payer.pubkey())?;
    println!("Payer balance: {} SOL", balance as f64 / 1e9);

    if balance < 1_000_000_000 {
        println!("Requesting airdrop...");
        let sig = client.request_airdrop(&payer.pubkey(), 2_000_000_000)?;
        loop {
            if client.confirm_transaction(&sig)? {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(500));
        }
        println!("Airdrop confirmed");
    }

    // Generate new account keypairs
    let tree_account = Keypair::new();
    let global_config_account = Keypair::new();
    let receipt_tree_account = Keypair::new();

    println!("Creating accounts:");
    println!("  Commitment Tree: {}", tree_account.pubkey());
    println!("  Global Config:   {}", global_config_account.pubkey());
    println!("  Receipt Tree:    {}", receipt_tree_account.pubkey());

    // Calculate rent
    let tree_rent = client.get_minimum_balance_for_rent_exemption(COMMITMENT_MERKLE_TREE_SIZE)?;
    let config_rent = client.get_minimum_balance_for_rent_exemption(GLOBAL_CONFIG_SIZE)?;
    let receipt_rent = client.get_minimum_balance_for_rent_exemption(RECEIPT_MERKLE_TREE_SIZE)?;

    println!("\nRent requirements:");
    println!("  Commitment Tree: {} SOL", tree_rent as f64 / 1e9);
    println!("  Global Config:   {} SOL", config_rent as f64 / 1e9);
    println!("  Receipt Tree:    {} SOL", receipt_rent as f64 / 1e9);

    // Build transaction
    let mut instructions = vec![];

    // Create commitment tree account
    instructions.push(system_instruction::create_account(
        &payer.pubkey(),
        &tree_account.pubkey(),
        tree_rent,
        COMMITMENT_MERKLE_TREE_SIZE as u64,
        program_id,
    ));

    // Create global config account
    instructions.push(system_instruction::create_account(
        &payer.pubkey(),
        &global_config_account.pubkey(),
        config_rent,
        GLOBAL_CONFIG_SIZE as u64,
        program_id,
    ));

    // Create receipt tree account
    instructions.push(system_instruction::create_account(
        &payer.pubkey(),
        &receipt_tree_account.pubkey(),
        receipt_rent,
        RECEIPT_MERKLE_TREE_SIZE as u64,
        program_id,
    ));

    // Initialize instruction
    let init_data = borsh::to_vec(&ShieldedPoolInstruction::Initialize)?;
    instructions.push(Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(tree_account.pubkey(), false),
            AccountMeta::new(global_config_account.pubkey(), false),
            AccountMeta::new(receipt_tree_account.pubkey(), false),
            AccountMeta::new_readonly(payer.pubkey(), true),
        ],
        data: init_data,
    });

    // Send transaction
    println!("\nSending transaction...");
    let recent_blockhash = client.get_latest_blockhash()?;
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer, &tree_account, &global_config_account, &receipt_tree_account],
        recent_blockhash,
    );

    let signature = client.send_and_confirm_transaction(&tx)?;

    println!("\n=== Initialization Complete ===");
    println!("Transaction: {}", signature);
    println!("\nAccount addresses:");
    println!("  COMMITMENT_TREE={}", tree_account.pubkey());
    println!("  GLOBAL_CONFIG={}", global_config_account.pubkey());
    println!("  RECEIPT_TREE={}", receipt_tree_account.pubkey());
    println!("  AUTHORITY={}", payer.pubkey());

    // Save to output file if specified
    if let Some(output_path) = output {
        let accounts_json = serde_json::json!({
            "program_id": program_id.to_string(),
            "commitment_tree": tree_account.pubkey().to_string(),
            "global_config": global_config_account.pubkey().to_string(),
            "receipt_tree": receipt_tree_account.pubkey().to_string(),
            "authority": payer.pubkey().to_string(),
            "transaction": signature.to_string(),
        });
        std::fs::write(&output_path, serde_json::to_string_pretty(&accounts_json)?)?;
        println!("\nAccounts saved to {:?}", output_path);
    }

    Ok(())
}

fn register_asset(
    client: &RpcClient,
    payer: &Keypair,
    program_id: &Pubkey,
    mint: &Pubkey,
    global_config: &Pubkey,
    max_deposit_amount: u64,
) -> Result<()> {
    println!("\n=== Registering Asset ===\n");
    println!("Mint: {}", mint);
    println!("Global Config: {}", global_config);
    println!("Max Deposit: {}", max_deposit_amount);

    // Derive token config PDA
    let (token_config_pda, _bump) = Pubkey::find_program_address(
        &[b"token_config", mint.as_ref()],
        program_id,
    );
    println!("Token Config PDA: {}", token_config_pda);

    // Get vault token account (ATA owned by payer for now)
    let vault = get_associated_token_address(&payer.pubkey(), mint);
    println!("Vault Token Account: {}", vault);

    // Check if vault exists, if not create it
    if client.get_account(&vault).is_err() {
        println!("Creating vault token account...");
        let create_ata_ix = spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &payer.pubkey(),
            mint,
            &spl_token::id(),
        );
        let recent_blockhash = client.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(
            &[create_ata_ix],
            Some(&payer.pubkey()),
            &[payer],
            recent_blockhash,
        );
        client.send_and_confirm_transaction(&tx)?;
        println!("Vault created");
    }

    // Create token config account
    let config_rent = client.get_minimum_balance_for_rent_exemption(TOKEN_CONFIG_SIZE)?;
    let token_config_account = Keypair::new();

    let create_config_ix = system_instruction::create_account(
        &payer.pubkey(),
        &token_config_account.pubkey(),
        config_rent,
        TOKEN_CONFIG_SIZE as u64,
        program_id,
    );

    // Register asset instruction
    let register_data = borsh::to_vec(&ShieldedPoolInstruction::RegisterAsset {
        max_deposit_amount,
    })?;

    let register_ix = Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new_readonly(*global_config, false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new_readonly(vault, false),
            AccountMeta::new(token_config_account.pubkey(), false),
            AccountMeta::new_readonly(payer.pubkey(), true),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: register_data,
    };

    println!("\nNote: Creating token config at regular account address.");
    println!("The program expects PDA at: {}", token_config_pda);
    println!("This may require program modification to work correctly.\n");

    let recent_blockhash = client.get_latest_blockhash()?;
    let tx = Transaction::new_signed_with_payer(
        &[create_config_ix, register_ix],
        Some(&payer.pubkey()),
        &[payer, &token_config_account],
        recent_blockhash,
    );

    println!("Sending transaction...");
    match client.send_and_confirm_transaction(&tx) {
        Ok(signature) => {
            println!("\n=== Asset Registration Complete ===");
            println!("Transaction: {}", signature);
            println!("Token Config Account: {}", token_config_account.pubkey());
        }
        Err(e) => {
            println!("\nTransaction failed: {}", e);
            println!("\nThis may be due to PDA validation. The program expects the token");
            println!("config account to be at PDA address: {}", token_config_pda);
            return Err(e.into());
        }
    }

    Ok(())
}

fn show_accounts(
    client: &RpcClient,
    tree: Option<String>,
    config: Option<String>,
    receipt_tree: Option<String>,
) -> Result<()> {
    println!("\n=== Account Information ===\n");

    if let Some(tree_addr) = tree {
        let pubkey = Pubkey::from_str(&tree_addr)?;
        match client.get_account(&pubkey) {
            Ok(account) => {
                println!("Commitment Tree: {}", pubkey);
                println!("  Owner: {}", account.owner);
                println!("  Lamports: {}", account.lamports);
                println!("  Data len: {}", account.data.len());
            }
            Err(e) => println!("Commitment Tree not found: {}", e),
        }
    }

    if let Some(config_addr) = config {
        let pubkey = Pubkey::from_str(&config_addr)?;
        match client.get_account(&pubkey) {
            Ok(account) => {
                println!("Global Config: {}", pubkey);
                println!("  Owner: {}", account.owner);
                println!("  Lamports: {}", account.lamports);
                println!("  Data len: {}", account.data.len());
            }
            Err(e) => println!("Global Config not found: {}", e),
        }
    }

    if let Some(receipt_addr) = receipt_tree {
        let pubkey = Pubkey::from_str(&receipt_addr)?;
        match client.get_account(&pubkey) {
            Ok(account) => {
                println!("Receipt Tree: {}", pubkey);
                println!("  Owner: {}", account.owner);
                println!("  Lamports: {}", account.lamports);
                println!("  Data len: {}", account.data.len());
            }
            Err(e) => println!("Receipt Tree not found: {}", e),
        }
    }

    Ok(())
}

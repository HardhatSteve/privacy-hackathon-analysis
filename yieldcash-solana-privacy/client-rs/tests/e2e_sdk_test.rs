//! End-to-End Integration Tests using the client-rs SDK
//!
//! These tests exercise the FULL pipeline:
//! 1. Client SDK computes notes, commitments, and generates Prover.toml
//! 2. nargo execute produces witness
//! 3. sunspot prove generates Groth16 proof + public witness
//! 4. Client SDK computes merkle insertion proof inside the ZK circuit
//! 5. Client SDK encodes the transaction instruction
//! 6. Transaction is submitted on-chain with CPI to Sunspot verifier
//! 7. On-chain program verifies proof, validates public witness, updates state
//!
//! Prerequisites:
//! - solana-test-validator running with both programs:
//!   solana-test-validator \
//!     --bpf-program 8Xr5vvjshTFqVtkMzrWNV2ZCw4pKqxNdoir1B1KdrNWR target/deploy/yieldcash.so \
//!     --bpf-program 8wT5a8Wog8VeWta3hmghJDngqDkRbFNN1xj619mmgZkW circuits/join_split/target/join_split.so \
//!     --reset
//!
//! Run with: cargo test --test e2e_sdk_test -- --nocapture

use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    compute_budget::ComputeBudgetInstruction,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use std::str::FromStr;

use acir::FieldElement;
use yieldcash_client::{
    crypto::{bytes_to_field, field_to_bytes},
    merkle::ClientMerkleTree,
    proof_gen::ProofGenConfig,
    solana::{
        encode_deposit_instruction, encode_withdraw_instruction,
        prepare_deposit_tx, prepare_withdraw_tx,
        program, PoolState,
    },
    types::{SCALE, VALID_DENOMINATIONS},
};

const LOCAL_RPC: &str = "http://localhost:8899";

fn get_program_id() -> Pubkey {
    Pubkey::from_str(program::PROGRAM_ID).unwrap()
}

fn get_verifier_id() -> Pubkey {
    Pubkey::from_str(program::VERIFIER_ID).unwrap()
}

fn derive_pda(seed: &[u8], program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[seed], program_id)
}

fn get_proof_gen_config() -> ProofGenConfig {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let home = std::env::var("HOME").unwrap();
    ProofGenConfig {
        circuit_dir: std::path::PathBuf::from(format!("{}/../circuits/join_split", manifest_dir)),
        nargo_bin: std::path::PathBuf::from("nargo"),
        sunspot_bin: std::path::PathBuf::from(format!("{}/sunspot/go/sunspot", home)),
    }
}

/// Parse pool state from account data
fn parse_pool_state(data: &[u8]) -> Option<PoolState> {
    if data.len() < 8 + 32 * 32 + 1 + 4 + 4 + 16 {
        return None;
    }

    let mut offset = 8; // Skip Anchor discriminator

    let mut root_history = [[0u8; 32]; 32];
    for i in 0..32 {
        root_history[i].copy_from_slice(&data[offset..offset + 32]);
        offset += 32;
    }

    let current_root_index = data[offset];
    offset += 1;

    let leaf_count = u32::from_le_bytes([
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
    ]);
    offset += 4;

    // Skip bumps (3 bytes) and buffer_ratio (1 byte)
    offset += 4;

    let mut shares_bytes = [0u8; 16];
    shares_bytes.copy_from_slice(&data[offset..offset + 16]);
    let total_shares = u128::from_le_bytes(shares_bytes);

    Some(PoolState {
        root_history,
        current_root_index,
        leaf_count,
        total_shares,
        index: SCALE,
    })
}

/// Initialize the pool on localnet
fn initialize_pool(client: &RpcClient, payer: &Keypair) -> bool {
    let program_id = get_program_id();
    let (pool_pda, _) = derive_pda(program::POOL_SEED, &program_id);

    if client.get_account(&pool_pda).is_ok() {
        println!("Pool already initialized");
        return true;
    }

    let (merkle_pda, _) = derive_pda(program::MERKLE_SEED, &program_id);
    let (nullifier_pda, _) = derive_pda(program::NULLIFIER_SEED, &program_id);
    let (sol_vault_pda, _) = derive_pda(program::SOL_VAULT_SEED, &program_id);
    let (msol_vault_pda, _) = derive_pda(program::MSOL_VAULT_SEED, &program_id);

    // Anchor discriminator for "initialize"
    let discriminator: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];

    let accounts = vec![
        AccountMeta::new(pool_pda, false),
        AccountMeta::new(merkle_pda, false),
        AccountMeta::new(nullifier_pda, false),
        AccountMeta::new(sol_vault_pda, false),       // SolVault is init (writable)
        AccountMeta::new_readonly(msol_vault_pda, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(system_program::id(), false),
    ];

    let instruction = Instruction {
        program_id,
        accounts,
        data: discriminator.to_vec(),
    };

    let blockhash = client.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&payer.pubkey()),
        &[payer],
        blockhash,
    );

    match client.send_and_confirm_transaction(&tx) {
        Ok(sig) => {
            println!("Pool initialized: {}", sig);
            true
        }
        Err(e) => {
            println!("Failed to initialize pool: {}", e);
            false
        }
    }
}

/// Get chain timestamp from Clock sysvar
fn get_chain_timestamp(client: &RpcClient) -> u64 {
    let clock = client
        .get_account(&solana_sdk::sysvar::clock::id())
        .expect("Failed to get clock sysvar");
    i64::from_le_bytes(clock.data[32..40].try_into().unwrap()) as u64
}

/// =======================================================================
/// TEST: Full deposit flow using client-rs SDK
/// =======================================================================
#[test]
fn test_e2e_deposit_via_sdk() {
    println!("\n{}", "=".repeat(60));
    println!("E2E TEST: Deposit via client-rs SDK");
    println!("{}\n", "=".repeat(60));

    let client = RpcClient::new_with_commitment(LOCAL_RPC, CommitmentConfig::confirmed());
    let program_id = get_program_id();
    let verifier_id = get_verifier_id();
    let config = get_proof_gen_config();

    // Load payer keypair
    let home = std::env::var("HOME").unwrap();
    let payer = read_keypair_file(format!("{}/.config/solana/id.json", home))
        .expect("Failed to read keypair");

    // Fund account
    match client.request_airdrop(&payer.pubkey(), 10_000_000_000) {
        Ok(sig) => {
            println!("[1/7] Airdrop requested: {}", sig);
            std::thread::sleep(std::time::Duration::from_secs(2));
        }
        Err(e) => println!("[1/7] Airdrop skipped: {}", e),
    }

    let balance = client.get_balance(&payer.pubkey()).unwrap_or(0);
    println!("[2/7] Balance: {} SOL", balance as f64 / 1e9);
    assert!(balance >= 100_000_000, "Need at least 0.1 SOL");

    // Initialize pool
    println!("[3/7] Initializing pool...");
    assert!(initialize_pool(&client, &payer), "Pool init failed");

    // Get chain state
    let chain_timestamp = get_chain_timestamp(&client);
    let (pool_pda, _) = derive_pda(program::POOL_SEED, &program_id);
    let pool_account = client.get_account(&pool_pda).expect("Pool not found");
    let pool_state = parse_pool_state(&pool_account.data).expect("Parse pool state failed");

    println!("[4/7] Chain timestamp: {}", chain_timestamp);
    println!("       Leaf count before: {}", pool_state.leaf_count);
    println!("       Total shares before: {}", pool_state.total_shares);

    // === KEY PART: Use the SDK to prepare the deposit ===
    let master_secret = FieldElement::from(99999u128);
    let deposit_amount = VALID_DENOMINATIONS[0]; // 0.05 SOL

    // Create client-side merkle tree (mirrors on-chain state)
    let mut tree = ClientMerkleTree::new().unwrap();

    // Get insertion path BEFORE generating proof
    let insertion_path = tree.get_insertion_path();
    println!("[5/7] Generating ZK proof via client-rs SDK...");
    println!("       deposit_amount = {} lamports", deposit_amount);
    println!("       insertion_leaf_index = {}", insertion_path.leaf_index);

    let prepared = prepare_deposit_tx(
        deposit_amount,
        SCALE,
        master_secret,
        chain_timestamp,
        &insertion_path,
        &config,
    )
    .expect("prepare_deposit_tx failed");

    println!("       Proof size: {} bytes", prepared.params.proof.len());
    println!("       Public witness size: {} bytes", prepared.params.public_witness.len());
    println!(
        "       Output commitment: 0x{}...",
        &hex::encode(&prepared.output_commitment)[0..16]
    );

    // Encode the instruction
    let instruction_data = encode_deposit_instruction(&prepared.params);
    println!("[6/7] Instruction data: {} bytes", instruction_data.len());

    // Build transaction
    let (merkle_pda, _) = derive_pda(program::MERKLE_SEED, &program_id);
    let (sol_vault_pda, _) = derive_pda(program::SOL_VAULT_SEED, &program_id);

    let accounts = vec![
        AccountMeta::new(pool_pda, false),
        AccountMeta::new(merkle_pda, false),
        AccountMeta::new(sol_vault_pda, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(verifier_id, false), // zk_verifier
    ];

    let instruction = Instruction {
        program_id,
        accounts,
        data: instruction_data,
    };

    let compute_ix = ComputeBudgetInstruction::set_compute_unit_limit(1_400_000);
    let blockhash = client.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[compute_ix, instruction],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );

    // Submit
    println!("[7/7] Submitting deposit transaction...");
    match client.send_and_confirm_transaction(&tx) {
        Ok(sig) => {
            println!("\n*** DEPOSIT SUCCESS ***");
            println!("    Transaction: {}", sig);

            // Update local tree after successful deposit
            let commitment_field = bytes_to_field(&prepared.output_commitment);
            let new_root = tree.insert(commitment_field).unwrap();
            let new_root_bytes = field_to_bytes(&new_root);

            // Verify state changed
            let new_account = client.get_account(&pool_pda).expect("Pool gone?");
            let new_state = parse_pool_state(&new_account.data).expect("Parse failed");

            println!("    Leaf count: {} -> {}", pool_state.leaf_count, new_state.leaf_count);
            println!("    Total shares: {} -> {}", pool_state.total_shares, new_state.total_shares);
            assert_eq!(
                new_state.leaf_count,
                pool_state.leaf_count + 1,
                "Leaf count should increment by 1"
            );
            assert!(
                new_state.total_shares > pool_state.total_shares,
                "Total shares should increase"
            );

            // Verify the stored root matches our client-computed root
            let stored_root = new_state.root_history[new_state.current_root_index as usize];
            assert_eq!(
                stored_root,
                new_root_bytes,
                "On-chain root should match client-computed Poseidon2 root"
            );
            println!(
                "    On-chain root matches client Poseidon2 root: VERIFIED"
            );

            println!("\n*** ZK PROOF GENERATED BY SDK AND VERIFIED ON-CHAIN ***");
            println!("*** MERKLE INSERTION VERIFIED INSIDE ZK CIRCUIT ***");
        }
        Err(e) => {
            panic!("Deposit FAILED: {}", e);
        }
    }
}

/// =======================================================================
/// TEST: Full deposit then withdraw flow using client-rs SDK
/// =======================================================================
#[test]
fn test_e2e_deposit_then_withdraw_via_sdk() {
    println!("\n{}", "=".repeat(60));
    println!("E2E TEST: Deposit + Withdraw via client-rs SDK");
    println!("{}\n", "=".repeat(60));

    let client = RpcClient::new_with_commitment(LOCAL_RPC, CommitmentConfig::confirmed());
    let program_id = get_program_id();
    let verifier_id = get_verifier_id();
    let config = get_proof_gen_config();

    let home = std::env::var("HOME").unwrap();
    let payer = read_keypair_file(format!("{}/.config/solana/id.json", home))
        .expect("Failed to read keypair");

    // Fund
    match client.request_airdrop(&payer.pubkey(), 10_000_000_000) {
        Ok(_) => std::thread::sleep(std::time::Duration::from_secs(2)),
        Err(_) => {}
    }

    assert!(
        client.get_balance(&payer.pubkey()).unwrap_or(0) >= 200_000_000,
        "Need at least 0.2 SOL"
    );

    // Initialize pool
    assert!(initialize_pool(&client, &payer), "Pool init failed");

    // Derive PDAs
    let (pool_pda, _) = derive_pda(program::POOL_SEED, &program_id);
    let (merkle_pda, _) = derive_pda(program::MERKLE_SEED, &program_id);
    let (sol_vault_pda, _) = derive_pda(program::SOL_VAULT_SEED, &program_id);
    let (nullifier_pda, _) = derive_pda(program::NULLIFIER_SEED, &program_id);

    let master_secret = FieldElement::from(77777u128);
    let deposit_amount = VALID_DENOMINATIONS[0]; // 0.05 SOL

    // Create client-side merkle tree (mirrors on-chain state)
    let mut tree = ClientMerkleTree::new().unwrap();

    // ===== STEP 1: DEPOSIT =====
    println!("--- STEP 1: DEPOSIT {} lamports ---", deposit_amount);

    let chain_timestamp = get_chain_timestamp(&client);

    // Get insertion path from local tree (matches on-chain state)
    let insertion_path = tree.get_insertion_path();

    let deposit_prepared = prepare_deposit_tx(
        deposit_amount,
        SCALE,
        master_secret,
        chain_timestamp,
        &insertion_path,
        &config,
    )
    .expect("prepare_deposit_tx failed");

    println!("  Proof generated: {} bytes", deposit_prepared.params.proof.len());
    println!("  PW generated: {} bytes", deposit_prepared.params.public_witness.len());

    let deposit_instruction_data = encode_deposit_instruction(&deposit_prepared.params);

    let deposit_accounts = vec![
        AccountMeta::new(pool_pda, false),
        AccountMeta::new(merkle_pda, false),
        AccountMeta::new(sol_vault_pda, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(verifier_id, false),
    ];

    let deposit_ix = Instruction {
        program_id,
        accounts: deposit_accounts,
        data: deposit_instruction_data,
    };

    let compute_ix = ComputeBudgetInstruction::set_compute_unit_limit(1_400_000);
    let blockhash = client.get_latest_blockhash().unwrap();
    let deposit_tx = Transaction::new_signed_with_payer(
        &[compute_ix, deposit_ix],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );

    let deposit_sig = client
        .send_and_confirm_transaction(&deposit_tx)
        .expect("Deposit transaction failed");
    println!("  DEPOSIT SUCCESS: {}", deposit_sig);

    // Update local merkle tree after successful deposit
    let commitment_field = bytes_to_field(&deposit_prepared.output_commitment);
    tree.insert(commitment_field).unwrap();

    // Verify deposit state
    let post_deposit = client.get_account(&pool_pda).expect("Pool gone");
    let post_deposit_state = parse_pool_state(&post_deposit.data).expect("Parse failed");
    println!("  Leaf count after deposit: {}", post_deposit_state.leaf_count);

    // Verify client tree root matches on-chain root
    assert_eq!(
        tree.root_bytes(),
        post_deposit_state.root_history[post_deposit_state.current_root_index as usize],
        "Client tree root must match on-chain root after deposit"
    );
    println!("  Client tree root matches on-chain root: VERIFIED");

    // ===== STEP 2: WITHDRAW =====
    println!("\n--- STEP 2: WITHDRAW {} lamports ---", deposit_amount);

    let stored_note = deposit_prepared.note;
    let withdraw_timestamp = get_chain_timestamp(&client);

    // Read the current merkle root from the updated pool
    let updated_pool = client.get_account(&pool_pda).expect("Pool");
    let updated_state = parse_pool_state(&updated_pool.data).expect("Parse");
    let current_root = bytes_to_field(
        &updated_state.root_history[updated_state.current_root_index as usize],
    );

    // Generate merkle proof using client-side tree (Poseidon2)
    let merkle_proof = tree.get_proof(stored_note.leaf_index).unwrap();
    println!("  Merkle proof generated for leaf index {}", stored_note.leaf_index);
    println!("  Tree root: 0x{}...", &hex::encode(tree.root_bytes())[0..16]);
    println!(
        "  On-chain root: 0x{}...",
        &hex::encode(&updated_state.root_history[updated_state.current_root_index as usize])[0..16]
    );

    // Recipient is the payer (withdraw to self)
    let recipient_bytes = payer.pubkey().to_bytes();

    // Full withdrawal: no change note, so no insertion path needed
    let withdraw_prepared = prepare_withdraw_tx(
        &stored_note,
        &merkle_proof,
        deposit_amount,
        SCALE,
        master_secret,
        withdraw_timestamp,
        current_root,
        recipient_bytes,
        None, // No insertion path for full withdrawal
        &config,
    )
    .expect("prepare_withdraw_tx failed");

    println!("  Proof generated: {} bytes", withdraw_prepared.params.proof.len());
    println!("  PW generated: {} bytes", withdraw_prepared.params.public_witness.len());
    println!(
        "  Nullifier: 0x{}...",
        &hex::encode(&withdraw_prepared.nullifier)[0..16]
    );

    let withdraw_instruction_data = encode_withdraw_instruction(&withdraw_prepared.params);

    // Withdraw accounts: no system_program needed (direct lamport manipulation)
    let withdraw_accounts = vec![
        AccountMeta::new(pool_pda, false),
        AccountMeta::new(merkle_pda, false),
        AccountMeta::new(nullifier_pda, false),
        AccountMeta::new(sol_vault_pda, false),
        AccountMeta::new(payer.pubkey(), false), // recipient
        AccountMeta::new(payer.pubkey(), true),  // withdrawer (signer)
        AccountMeta::new_readonly(verifier_id, false),
    ];

    let withdraw_ix = Instruction {
        program_id,
        accounts: withdraw_accounts,
        data: withdraw_instruction_data,
    };

    let compute_ix2 = ComputeBudgetInstruction::set_compute_unit_limit(1_400_000);
    let blockhash2 = client.get_latest_blockhash().unwrap();
    let withdraw_tx = Transaction::new_signed_with_payer(
        &[compute_ix2, withdraw_ix],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash2,
    );

    println!("  Submitting withdraw transaction...");
    match client.send_and_confirm_transaction(&withdraw_tx) {
        Ok(sig) => {
            println!("  WITHDRAW SUCCESS: {}", sig);

            let post_withdraw = client.get_account(&pool_pda).expect("Pool");
            let post_withdraw_state = parse_pool_state(&post_withdraw.data).expect("Parse");
            println!(
                "  Total shares: {} -> {}",
                post_deposit_state.total_shares, post_withdraw_state.total_shares
            );

            println!("\n*** FULL DEPOSIT + WITHDRAW FLOW VERIFIED ON-CHAIN ***");
            println!("*** ZK PROOFS WITH MERKLE INSERTION VERIFIED BY SUNSPOT ***");
            println!("*** MERKLE TREE COMPUTED CLIENT-SIDE WITH POSEIDON2 ***");
        }
        Err(e) => {
            panic!("Withdraw FAILED: {}", e);
        }
    }
}

/// =======================================================================
/// TEST: Verify tampered SDK proof is rejected
/// =======================================================================
#[test]
fn test_e2e_tampered_proof_rejected() {
    println!("\n{}", "=".repeat(60));
    println!("E2E TEST: Tampered proof rejection via SDK");
    println!("{}\n", "=".repeat(60));

    let client = RpcClient::new_with_commitment(LOCAL_RPC, CommitmentConfig::confirmed());
    let program_id = get_program_id();
    let verifier_id = get_verifier_id();
    let config = get_proof_gen_config();

    let home = std::env::var("HOME").unwrap();
    let payer = read_keypair_file(format!("{}/.config/solana/id.json", home))
        .expect("Failed to read keypair");

    match client.request_airdrop(&payer.pubkey(), 10_000_000_000) {
        Ok(_) => std::thread::sleep(std::time::Duration::from_secs(2)),
        Err(_) => {}
    }

    assert!(initialize_pool(&client, &payer), "Pool init failed");

    let chain_timestamp = get_chain_timestamp(&client);
    let (pool_pda, _) = derive_pda(program::POOL_SEED, &program_id);

    // Create client-side merkle tree
    let tree = ClientMerkleTree::new().unwrap();
    let insertion_path = tree.get_insertion_path();

    // Generate valid proof via SDK
    let master_secret = FieldElement::from(55555u128);
    let mut prepared = prepare_deposit_tx(
        VALID_DENOMINATIONS[0],
        SCALE,
        master_secret,
        chain_timestamp,
        &insertion_path,
        &config,
    )
    .expect("prepare_deposit_tx failed");

    println!("Generated valid proof via SDK ({} bytes)", prepared.params.proof.len());

    // Tamper with the proof
    println!("Tampering with proof bytes...");
    for i in 0..10 {
        prepared.params.proof[i] ^= 0xFF;
    }

    let instruction_data = encode_deposit_instruction(&prepared.params);

    let (merkle_pda, _) = derive_pda(program::MERKLE_SEED, &program_id);
    let (sol_vault_pda, _) = derive_pda(program::SOL_VAULT_SEED, &program_id);

    let accounts = vec![
        AccountMeta::new(pool_pda, false),
        AccountMeta::new(merkle_pda, false),
        AccountMeta::new(sol_vault_pda, false),
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(verifier_id, false),
    ];

    let instruction = Instruction {
        program_id,
        accounts,
        data: instruction_data,
    };

    let compute_ix = ComputeBudgetInstruction::set_compute_unit_limit(1_400_000);
    let blockhash = client.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[compute_ix, instruction],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );

    println!("Submitting tampered proof...");
    match client.send_and_confirm_transaction(&tx) {
        Ok(_) => {
            panic!("ERROR: Tampered proof was ACCEPTED! ZK verification is broken!");
        }
        Err(e) => {
            println!("CORRECT: Tampered proof rejected: {}", e);
            println!("\n*** ZK VERIFICATION WORKING - INVALID SDK-GENERATED PROOFS REJECTED ***");
        }
    }
}

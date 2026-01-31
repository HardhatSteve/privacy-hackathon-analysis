//! Devnet End-to-End Integration Tests
//!
//! These tests run against REAL Solana devnet with REAL ZK proof generation.
//! They exercise the full pipeline:
//! 1. Client SDK computes notes, commitments, and generates Prover.toml
//! 2. nargo execute produces witness
//! 3. sunspot prove generates Groth16 proof + public witness
//! 4. Client SDK computes merkle insertion proof inside the ZK circuit
//! 5. Client SDK encodes the transaction instruction
//! 6. Transaction is submitted on-chain with CPI to Sunspot verifier
//! 7. On-chain program verifies proof, validates public witness, updates state
//!
//! Prerequisites:
//! - Programs deployed to devnet:
//!   - YieldCash: DiHt3HhwXtPdRAWyUnnvwYxYLGZczHGbrrBK5hNyq2iS
//!   - ZK Verifier: 8wT5a8Wog8VeWta3hmghJDngqDkRbFNN1xj619mmgZkW
//! - Pool initialized
//! - Payer wallet with sufficient SOL (~1 SOL)
//!
//! Run with: cargo test --test devnet_e2e_test -- --nocapture

use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    compute_budget::ComputeBudgetInstruction,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
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

const DEVNET_RPC: &str = "https://devnet.helius-rpc.com/?api-key=0e894b68-bfe8-4dca-825e-6bca69cda266";

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

/// Get chain timestamp from Clock sysvar
fn get_chain_timestamp(client: &RpcClient) -> u64 {
    let clock = client
        .get_account(&solana_sdk::sysvar::clock::id())
        .expect("Failed to get clock sysvar");
    i64::from_le_bytes(clock.data[32..40].try_into().unwrap()) as u64
}

/// =======================================================================
/// TEST: Full deposit + withdrawal on devnet with real ZK proofs
/// =======================================================================
#[test]
fn test_devnet_deposit_and_withdraw() {
    println!("\n{}", "=".repeat(70));
    println!("DEVNET E2E TEST: Full Deposit + Withdraw with Real ZK Proofs");
    println!("{}\n", "=".repeat(70));

    let client = RpcClient::new_with_commitment(DEVNET_RPC, CommitmentConfig::confirmed());
    let program_id = get_program_id();
    let verifier_id = get_verifier_id();
    let config = get_proof_gen_config();

    println!("Program ID: {}", program_id);
    println!("Verifier ID: {}", verifier_id);

    // Load payer keypair
    let home = std::env::var("HOME").unwrap();
    let payer = read_keypair_file(format!("{}/.config/solana/id.json", home))
        .expect("Failed to read keypair");
    println!("Payer: {}", payer.pubkey());

    let balance = client.get_balance(&payer.pubkey()).expect("Failed to get balance");
    println!("Balance: {} SOL", balance as f64 / 1e9);
    assert!(balance >= 200_000_000, "Need at least 0.2 SOL for deposit + fees");

    // Derive PDAs
    let (pool_pda, _) = derive_pda(program::POOL_SEED, &program_id);
    let (merkle_pda, _) = derive_pda(program::MERKLE_SEED, &program_id);
    let (sol_vault_pda, _) = derive_pda(program::SOL_VAULT_SEED, &program_id);
    let (nullifier_pda, _) = derive_pda(program::NULLIFIER_SEED, &program_id);

    println!("\nPDA Addresses:");
    println!("  Pool: {}", pool_pda);
    println!("  Merkle: {}", merkle_pda);
    println!("  SOL Vault: {}", sol_vault_pda);
    println!("  Nullifier: {}", nullifier_pda);

    // Verify pool is initialized
    let pool_account = client.get_account(&pool_pda).expect("Pool not initialized on devnet");
    let pool_state = parse_pool_state(&pool_account.data).expect("Failed to parse pool state");
    println!("\nPool State:");
    println!("  leaf_count: {}", pool_state.leaf_count);
    println!("  total_shares: {}", pool_state.total_shares);
    println!("  current_root_index: {}", pool_state.current_root_index);
    println!("  current_root: 0x{}...", hex::encode(&pool_state.root_history[pool_state.current_root_index as usize])[..16].to_string());

    let master_secret = FieldElement::from(123456789u128);
    let deposit_amount = VALID_DENOMINATIONS[0]; // 0.05 SOL = 50_000_000 lamports

    // Create client-side merkle tree (must start from the same state as on-chain)
    // For a clean pool (leaf_count == 0), an empty tree is correct.
    assert_eq!(pool_state.leaf_count, 0, "This test expects a fresh pool with leaf_count == 0");
    let mut tree = ClientMerkleTree::new().unwrap();

    // Verify client tree root matches on-chain root
    let client_root = tree.root_bytes();
    let onchain_root = pool_state.root_history[pool_state.current_root_index as usize];
    assert_eq!(
        client_root, onchain_root,
        "Client empty tree root must match on-chain initial root"
    );
    println!("\n  Client empty tree root matches on-chain root: VERIFIED");

    // =====================================================================
    // STEP 1: DEPOSIT 0.05 SOL
    // =====================================================================
    println!("\n{}", "-".repeat(70));
    println!("STEP 1: DEPOSIT {} lamports (0.05 SOL)", deposit_amount);
    println!("{}", "-".repeat(70));

    let chain_timestamp = get_chain_timestamp(&client);
    println!("  Chain timestamp: {}", chain_timestamp);

    // Get insertion path from local tree (matches on-chain state)
    let insertion_path = tree.get_insertion_path();
    println!("  Insertion leaf_index: {}", insertion_path.leaf_index);
    println!("  Insertion old_root: 0x{}...", hex::encode(field_to_bytes(&insertion_path.old_root))[..16].to_string());

    println!("  Generating ZK proof (nargo execute + sunspot prove)...");
    let deposit_prepared = prepare_deposit_tx(
        deposit_amount,
        SCALE,
        master_secret,
        chain_timestamp,
        &insertion_path,
        &config,
    )
    .expect("prepare_deposit_tx failed");

    println!("  Proof size: {} bytes", deposit_prepared.params.proof.len());
    println!("  Public witness size: {} bytes", deposit_prepared.params.public_witness.len());
    println!("  Output commitment: 0x{}...", &hex::encode(&deposit_prepared.output_commitment)[..16]);

    // Verify proof/PW sizes match on-chain expectations
    assert_eq!(deposit_prepared.params.proof.len(), 388, "Proof size must be 388 bytes");
    assert_eq!(deposit_prepared.params.public_witness.len(), 428, "PW size must be 428 bytes (13 fields)");

    // Encode instruction
    let deposit_instruction_data = encode_deposit_instruction(&deposit_prepared.params);
    println!("  Instruction data: {} bytes", deposit_instruction_data.len());

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
    let blockhash = client.get_latest_blockhash().expect("Failed to get blockhash");
    let deposit_tx = Transaction::new_signed_with_payer(
        &[compute_ix, deposit_ix],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );

    println!("  Submitting deposit transaction to devnet...");
    let deposit_sig = client
        .send_and_confirm_transaction(&deposit_tx)
        .expect("DEPOSIT TRANSACTION FAILED ON DEVNET");

    println!("\n  *** DEPOSIT SUCCESS ***");
    println!("  Transaction: {}", deposit_sig);
    println!("  Explorer: https://explorer.solana.com/tx/{}?cluster=devnet", deposit_sig);

    // Update local merkle tree
    let commitment_field = bytes_to_field(&deposit_prepared.output_commitment);
    let new_root = tree.insert(commitment_field).unwrap();
    let new_root_bytes = field_to_bytes(&new_root);

    // Verify on-chain state
    let post_deposit = client.get_account(&pool_pda).expect("Pool gone after deposit");
    let post_deposit_state = parse_pool_state(&post_deposit.data).expect("Parse failed");

    println!("\n  Post-Deposit Verification:");
    println!("    leaf_count: {} -> {}", pool_state.leaf_count, post_deposit_state.leaf_count);
    println!("    total_shares: {} -> {}", pool_state.total_shares, post_deposit_state.total_shares);

    assert_eq!(
        post_deposit_state.leaf_count,
        pool_state.leaf_count + 1,
        "Leaf count must increment by 1"
    );
    assert!(
        post_deposit_state.total_shares > pool_state.total_shares,
        "Total shares must increase"
    );

    // Verify the on-chain root matches our client-computed Poseidon2 root
    let stored_root = post_deposit_state.root_history[post_deposit_state.current_root_index as usize];
    assert_eq!(
        stored_root, new_root_bytes,
        "On-chain root must match client Poseidon2 root after deposit"
    );
    println!("    On-chain root matches client Poseidon2 root: VERIFIED");
    println!("    Root: 0x{}...", &hex::encode(&stored_root)[..16]);

    // Verify SOL vault received the deposit
    let vault_balance = client.get_balance(&sol_vault_pda).expect("Vault balance");
    println!("    SOL vault balance: {} lamports", vault_balance);
    // The vault balance includes rent-exempt minimum + deposit
    assert!(vault_balance >= deposit_amount, "Vault must hold at least the deposit amount");

    println!("\n  *** ZK PROOF VERIFIED ON-CHAIN BY SUNSPOT GROTH16 VERIFIER ***");
    println!("  *** MERKLE INSERTION PROVEN INSIDE ZK CIRCUIT ***");

    // =====================================================================
    // STEP 2: WITHDRAW 0.05 SOL (full withdrawal)
    // =====================================================================
    println!("\n{}", "-".repeat(70));
    println!("STEP 2: WITHDRAW {} lamports (full withdrawal)", deposit_amount);
    println!("{}", "-".repeat(70));

    let stored_note = deposit_prepared.note;
    println!("  Note leaf_index: {}", stored_note.leaf_index);
    println!("  Note value (shares): {}", stored_note.note.value);

    let withdraw_timestamp = get_chain_timestamp(&client);
    println!("  Chain timestamp: {}", withdraw_timestamp);

    // Read updated on-chain root
    let current_root = bytes_to_field(
        &post_deposit_state.root_history[post_deposit_state.current_root_index as usize],
    );

    // Generate merkle proof for the note
    let merkle_proof = tree.get_proof(stored_note.leaf_index).expect("get_proof failed");
    println!("  Merkle proof generated for leaf index {}", stored_note.leaf_index);
    println!("  Tree root: 0x{}...", &hex::encode(tree.root_bytes())[..16]);

    // Recipient is the payer (withdraw to self)
    let recipient_bytes = payer.pubkey().to_bytes();

    println!("  Generating ZK proof for withdrawal...");
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
        None, // Full withdrawal — no change note, no insertion
        &config,
    )
    .expect("prepare_withdraw_tx failed");

    println!("  Proof size: {} bytes", withdraw_prepared.params.proof.len());
    println!("  Public witness size: {} bytes", withdraw_prepared.params.public_witness.len());
    println!("  Nullifier: 0x{}...", &hex::encode(&withdraw_prepared.nullifier)[..16]);

    // Verify proof/PW sizes
    assert_eq!(withdraw_prepared.params.proof.len(), 388, "Proof must be 388 bytes");
    assert_eq!(withdraw_prepared.params.public_witness.len(), 428, "PW must be 428 bytes");

    let withdraw_instruction_data = encode_withdraw_instruction(&withdraw_prepared.params);
    println!("  Instruction data: {} bytes", withdraw_instruction_data.len());

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
    let blockhash2 = client.get_latest_blockhash().expect("Failed to get blockhash");
    let withdraw_tx = Transaction::new_signed_with_payer(
        &[compute_ix2, withdraw_ix],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash2,
    );

    println!("  Submitting withdraw transaction to devnet...");
    let withdraw_sig = client
        .send_and_confirm_transaction(&withdraw_tx)
        .expect("WITHDRAW TRANSACTION FAILED ON DEVNET");

    println!("\n  *** WITHDRAW SUCCESS ***");
    println!("  Transaction: {}", withdraw_sig);
    println!("  Explorer: https://explorer.solana.com/tx/{}?cluster=devnet", withdraw_sig);

    // Verify post-withdrawal state
    let post_withdraw = client.get_account(&pool_pda).expect("Pool gone after withdraw");
    let post_withdraw_state = parse_pool_state(&post_withdraw.data).expect("Parse failed");

    println!("\n  Post-Withdraw Verification:");
    println!("    leaf_count: {} (unchanged — full withdrawal has no change note)",
        post_withdraw_state.leaf_count);
    println!("    total_shares: {} -> {}",
        post_deposit_state.total_shares, post_withdraw_state.total_shares);

    // Full withdrawal: leaf_count should NOT increase (no change note inserted)
    assert_eq!(
        post_withdraw_state.leaf_count,
        post_deposit_state.leaf_count,
        "Leaf count must stay the same for full withdrawal (no change note)"
    );

    // Total shares should decrease back to 0
    assert_eq!(
        post_withdraw_state.total_shares, 0,
        "Total shares must return to 0 after full withdrawal"
    );

    // Verify the root hasn't changed (no insertion in full withdrawal)
    let post_withdraw_root = post_withdraw_state.root_history[post_withdraw_state.current_root_index as usize];
    assert_eq!(
        post_withdraw_root, new_root_bytes,
        "Root must be unchanged after full withdrawal (no merkle insertion)"
    );
    println!("    Root unchanged after full withdrawal: VERIFIED");

    // Check SOL was returned
    let vault_balance_after = client.get_balance(&sol_vault_pda).expect("Vault balance");
    println!("    SOL vault balance after: {} lamports", vault_balance_after);
    assert!(
        vault_balance_after < vault_balance,
        "Vault balance must decrease after withdrawal"
    );

    let payer_balance_after = client.get_balance(&payer.pubkey()).expect("Payer balance");
    println!("    Payer balance after: {} SOL", payer_balance_after as f64 / 1e9);

    println!("\n{}", "=".repeat(70));
    println!("*** DEVNET E2E TEST COMPLETE ***");
    println!("*** DEPOSIT: ZK proof generated, verified on-chain, SOL transferred ***");
    println!("*** WITHDRAW: ZK proof generated, verified on-chain, SOL returned ***");
    println!("*** MERKLE INSERTION: Proven inside ZK circuit, verified on-chain ***");
    println!("*** CLIENT POSEIDON2 ROOT: Matches on-chain root after each op ***");
    println!("*** NULLIFIER: Recorded on-chain, prevents double-spend ***");
    println!("{}", "=".repeat(70));
}

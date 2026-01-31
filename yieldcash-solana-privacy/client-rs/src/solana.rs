//! Solana client for interacting with the YieldCash on-chain program
//!
//! This module provides the interface between the Rust client and the deployed
//! Solana program, handling transaction building, signing, and submission.
//!
//! The on-chain instruction params are intentionally slim: only proof and
//! public_witness. All other values (amounts, commitments, nullifiers, merkle
//! insertion) are extracted on-chain from the ZK proof's public witness.

use crate::crypto::{
    compute_nullifier, compute_owner_pubkey, field_to_bytes, random_field, CryptoError,
};
use crate::merkle::InsertionPath;
use crate::note::{compute_commitment, create_stored_note};
use crate::proof_gen::{
    generate_deposit_proof, generate_transfer_proof, generate_withdraw_proof, DepositProofInput,
    ProofGenConfig, ProofGenError, TransferProofInput, WithdrawProofInput,
};
use crate::types::{
    get_denomination_index, lamports_to_shares, AssetType, MerkleProof, Note, StoredNote,
};
use acir::{AcirField, FieldElement};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SolanaClientError {
    #[error("Crypto error: {0}")]
    Crypto(#[from] CryptoError),
    #[error("Proof generation error: {0}")]
    ProofGen(#[from] ProofGenError),
    #[error("Invalid denomination: {0}")]
    InvalidDenomination(u64),
    #[error("Pool not initialized")]
    PoolNotInitialized,
    #[error("Insufficient balance")]
    InsufficientBalance,
    #[error("RPC error: {0}")]
    RpcError(String),
}

/// Program IDs and seeds
pub mod program {
    pub const PROGRAM_ID: &str = "82RejKJaycBWQqzwsHY6wPnXmvikDR9xbAjJARrPQth7";
    pub const VERIFIER_ID: &str = "8wT5a8Wog8VeWta3hmghJDngqDkRbFNN1xj619mmgZkW";
    pub const POOL_SEED: &[u8] = b"shielded_pool";
    pub const MERKLE_SEED: &[u8] = b"merkle_tree";
    pub const NULLIFIER_SEED: &[u8] = b"nullifier_registry";
    pub const SOL_VAULT_SEED: &[u8] = b"sol_vault";
    pub const MSOL_VAULT_SEED: &[u8] = b"msol_vault";
}

/// Pool state fetched from on-chain
#[derive(Debug, Clone)]
pub struct PoolState {
    pub root_history: [[u8; 32]; 32],
    pub current_root_index: u8,
    pub leaf_count: u32,
    pub total_shares: u128,
    pub index: u64,
}

/// Unified transaction parameters (matching on-chain TransactParams).
#[derive(Debug, Clone)]
pub struct TransactParams {
    pub proof: Vec<u8>,
    pub public_witness: Vec<u8>,
}

/// Result of preparing any transaction (deposit, transfer, or withdraw)
#[derive(Debug)]
pub struct PreparedTransact {
    pub params: TransactParams,
    /// The output note (deposit note, transfer note for recipient, or change note)
    pub output_note: Option<StoredNote>,
    /// Output commitment bytes (needed for client-side merkle tree insertion)
    pub output_commitment: [u8; 32],
    /// Nullifier of the spent input note (None for deposits)
    pub nullifier: Option<[u8; 32]>,
}

/// Prepare a deposit transaction with real ZK proof generation.
///
/// This function:
/// 1. Computes the output note and commitment
/// 2. Generates a Groth16 proof via nargo + sunspot (includes merkle insertion proof)
/// 3. Returns all parameters needed to build the on-chain instruction
///
/// The `insertion_path` must be obtained from `ClientMerkleTree::get_insertion_path()`
/// before calling this function. After the deposit succeeds on-chain, the caller
/// must update their local tree with `tree.insert(output_commitment)`.
pub fn prepare_deposit_tx(
    deposit_amount: u64,
    current_index: u64,
    master_secret: FieldElement,
    current_timestamp: u64,
    insertion_path: &InsertionPath,
    proof_gen_config: &ProofGenConfig,
) -> Result<PreparedTransact, SolanaClientError> {
    let output_randomness = random_field();

    // Generate the ZK proof using nargo + sunspot
    let proof_input = DepositProofInput {
        deposit_amount,
        current_index,
        current_timestamp,
        master_secret,
        output_randomness,
        insertion_siblings: insertion_path.siblings,
        insertion_indices: insertion_path.indices,
        insertion_old_root: insertion_path.old_root,
        insertion_leaf_index: insertion_path.leaf_index,
    };

    let generated = generate_deposit_proof(&proof_input, proof_gen_config)?;

    // Create stored note with leaf index from insertion path
    let owner = compute_owner_pubkey(master_secret)?;
    let deposit_shares = lamports_to_shares(deposit_amount, current_index);
    let note = Note {
        value: deposit_shares,
        asset_type: AssetType::YcSol,
        owner,
        randomness: output_randomness,
        denomination: get_denomination_index(deposit_amount).unwrap_or(0),
        timestamp: current_timestamp,
    };
    let stored_note = create_stored_note(note, insertion_path.leaf_index)?;

    let params = TransactParams {
        proof: generated.proof,
        public_witness: generated.public_witness,
    };

    Ok(PreparedTransact {
        params,
        output_note: Some(stored_note),
        output_commitment: generated.output_commitment_0,
        nullifier: None,
    })
}

/// Prepare a shielded transfer transaction with real ZK proof generation.
///
/// Transfers ownership of a note inside the pool without moving SOL.
/// The sender's note is nullified and a new note is created for the recipient.
///
/// - `input_note`: Sender's note to spend
/// - `merkle_proof`: Merkle proof for the input note
/// - `recipient_owner_pubkey`: Recipient's shielded address owner pubkey (hash(secret, 0))
/// - `insertion_path`: Where to insert the output commitment in the merkle tree
pub fn prepare_transfer_tx(
    input_note: &StoredNote,
    merkle_proof: &MerkleProof,
    current_index: u64,
    master_secret: FieldElement,
    current_timestamp: u64,
    merkle_root: FieldElement,
    recipient_owner_pubkey: FieldElement,
    insertion_path: &InsertionPath,
    proof_gen_config: &ProofGenConfig,
) -> Result<PreparedTransact, SolanaClientError> {
    let output_randomness = random_field();

    let proof_input = TransferProofInput {
        input_note: input_note.clone(),
        merkle_proof: merkle_proof.clone(),
        current_index,
        current_timestamp,
        master_secret,
        merkle_root,
        recipient_owner_pubkey,
        output_randomness,
        insertion_siblings: insertion_path.siblings,
        insertion_indices: insertion_path.indices,
        insertion_old_root: insertion_path.old_root,
        insertion_leaf_index: insertion_path.leaf_index,
    };

    let generated = generate_transfer_proof(&proof_input, proof_gen_config)?;

    // Compute nullifier for the spent input
    let input_commitment = compute_commitment(&input_note.note)?;
    let nullifier = compute_nullifier(input_commitment, master_secret)?;
    let nullifier_bytes = field_to_bytes(&nullifier);

    // Create the output note for the recipient
    let output_note = Note {
        value: input_note.note.value, // same value (full transfer)
        asset_type: input_note.note.asset_type,
        owner: recipient_owner_pubkey,
        randomness: output_randomness,
        denomination: input_note.note.denomination,
        timestamp: current_timestamp,
    };
    let stored_output = create_stored_note(output_note, insertion_path.leaf_index)?;

    let params = TransactParams {
        proof: generated.proof,
        public_witness: generated.public_witness,
    };

    Ok(PreparedTransact {
        params,
        output_note: Some(stored_output),
        output_commitment: generated.output_commitment_0,
        nullifier: Some(nullifier_bytes),
    })
}

/// Prepare a withdrawal transaction with real ZK proof generation.
///
/// The `insertion_path` is required for partial withdrawals (where a change note
/// is created). Pass `None` for full withdrawals with no change note.
pub fn prepare_withdraw_tx(
    input_note: &StoredNote,
    merkle_proof: &MerkleProof,
    withdraw_amount: u64,
    current_index: u64,
    master_secret: FieldElement,
    current_timestamp: u64,
    merkle_root: FieldElement,
    recipient: [u8; 32],
    insertion_path: Option<&InsertionPath>,
    proof_gen_config: &ProofGenConfig,
) -> Result<PreparedTransact, SolanaClientError> {
    let change_randomness = random_field();
    let recipient_field = FieldElement::from_be_bytes_reduce(&recipient);

    // Generate the ZK proof
    let proof_input = WithdrawProofInput {
        input_note: input_note.clone(),
        merkle_proof: merkle_proof.clone(),
        withdraw_amount,
        current_index,
        current_timestamp,
        master_secret,
        merkle_root,
        recipient: recipient_field,
        change_randomness,
        insertion_siblings: insertion_path.map(|p| p.siblings),
        insertion_indices: insertion_path.map(|p| p.indices),
        insertion_old_root: insertion_path.map(|p| p.old_root),
        insertion_leaf_index: insertion_path.map(|p| p.leaf_index),
    };

    let generated = generate_withdraw_proof(&proof_input, proof_gen_config)?;

    // Compute nullifier
    let input_commitment = compute_commitment(&input_note.note)?;
    let nullifier = compute_nullifier(input_commitment, master_secret)?;
    let nullifier_bytes = field_to_bytes(&nullifier);

    // Create change note if partial withdrawal
    let withdraw_shares = lamports_to_shares(withdraw_amount, current_index);
    let change_note = if input_note.note.value > withdraw_shares {
        let change_value = input_note.note.value - withdraw_shares;
        let owner = compute_owner_pubkey(master_secret)?;
        let note = Note {
            value: change_value,
            asset_type: AssetType::YcSol,
            owner,
            randomness: change_randomness,
            denomination: input_note.note.denomination,
            timestamp: current_timestamp,
        };
        let leaf_idx = insertion_path.map(|p| p.leaf_index).unwrap_or(0);
        Some(create_stored_note(note, leaf_idx)?)
    } else {
        None
    };

    let params = TransactParams {
        proof: generated.proof,
        public_witness: generated.public_witness,
    };

    Ok(PreparedTransact {
        params,
        output_note: change_note,
        output_commitment: generated.output_commitment_0,
        nullifier: Some(nullifier_bytes),
    })
}

/// sha256("global:transact")[..8]
const TRANSACT_DISCRIMINATOR: [u8; 8] = [0xd9, 0x95, 0x82, 0x8f, 0xdd, 0x34, 0xfc, 0x77];

/// Encode an Anchor instruction: discriminator + Vec<u8> proof + Vec<u8> public_witness
fn encode_anchor_instruction(discriminator: [u8; 8], proof: &[u8], pw: &[u8]) -> Vec<u8> {
    let mut data = Vec::with_capacity(8 + 4 + proof.len() + 4 + pw.len());
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&(proof.len() as u32).to_le_bytes());
    data.extend_from_slice(proof);
    data.extend_from_slice(&(pw.len() as u32).to_le_bytes());
    data.extend_from_slice(pw);
    data
}

/// Encode transact instruction data (Anchor discriminator + TransactParams)
pub fn encode_transact_instruction(params: &TransactParams) -> Vec<u8> {
    encode_anchor_instruction(TRANSACT_DISCRIMINATOR, &params.proof, &params.public_witness)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_anchor_instruction() {
        let proof = vec![1, 2, 3];
        let pw = vec![4, 5, 6, 7];
        let encoded = encode_anchor_instruction(TRANSACT_DISCRIMINATOR, &proof, &pw);

        assert_eq!(&encoded[0..8], &TRANSACT_DISCRIMINATOR);
        // proof: len=3
        assert_eq!(u32::from_le_bytes(encoded[8..12].try_into().unwrap()), 3);
        assert_eq!(&encoded[12..15], &[1, 2, 3]);
        // pw: len=4
        assert_eq!(u32::from_le_bytes(encoded[15..19].try_into().unwrap()), 4);
        assert_eq!(&encoded[19..23], &[4, 5, 6, 7]);
        // total: 8 + 4 + 3 + 4 + 4 = 23
        assert_eq!(encoded.len(), 23);
    }
}

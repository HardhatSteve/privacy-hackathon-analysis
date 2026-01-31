//! ZK proof generation using nargo + sunspot
//!
//! This module generates Groth16 proofs for the join-split circuit by:
//! 1. Building Prover.toml from structured inputs
//! 2. Running `nargo execute` to produce a witness
//! 3. Running `sunspot prove` to produce a Groth16 proof + public witness
//! 4. Reading back the binary artifacts

use std::fs;
use std::path::PathBuf;
use std::process::Command;

use acir::{AcirField, FieldElement};
use thiserror::Error;

use crate::crypto::{compute_merkle_root, compute_owner_pubkey, field_to_bytes, CryptoError};
use crate::note::{compute_commitment, create_dummy_note};
use crate::types::{AssetType, MerkleProof, Note, StoredNote, SCALE};

#[derive(Error, Debug)]
pub enum ProofGenError {
    #[error("Crypto error: {0}")]
    Crypto(#[from] CryptoError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("nargo execute failed: {0}")]
    NargoFailed(String),
    #[error("sunspot prove failed: {0}")]
    SunspotFailed(String),
    #[error("Missing artifact: {0}")]
    MissingArtifact(String),
    #[error("Invalid proof size: expected {expected}, got {actual}")]
    InvalidProofSize { expected: usize, actual: usize },
    #[error("Invalid public witness size: expected {expected}, got {actual}")]
    InvalidPwSize { expected: usize, actual: usize },
}

/// Expected sizes for Groth16 artifacts
pub const PROOF_SIZE: usize = 388;
/// 12-byte header + 13 × 32-byte field elements = 428 bytes
pub const PUBLIC_WITNESS_SIZE: usize = 428;

/// Result of generating a ZK proof
#[derive(Debug)]
pub struct GeneratedProof {
    /// Groth16 proof bytes (388 bytes)
    pub proof: Vec<u8>,
    /// Public witness bytes (428 bytes: 12-byte header + 13 × 32-byte fields)
    pub public_witness: Vec<u8>,
    /// Output commitment 0
    pub output_commitment_0: [u8; 32],
    /// Output commitment 1
    pub output_commitment_1: [u8; 32],
}

/// Configuration for the proof generation pipeline
#[derive(Debug, Clone)]
pub struct ProofGenConfig {
    /// Path to the circuit directory (contains Nargo.toml, src/main.nr)
    pub circuit_dir: PathBuf,
    /// Path to the nargo binary (default: "nargo" from PATH)
    pub nargo_bin: PathBuf,
    /// Path to the sunspot binary
    pub sunspot_bin: PathBuf,
}

impl Default for ProofGenConfig {
    fn default() -> Self {
        let home = std::env::var("HOME").unwrap_or_default();
        Self {
            circuit_dir: PathBuf::from(format!(
                "{}/solana-privacy-hack/circuits/join_split",
                home
            )),
            nargo_bin: PathBuf::from("nargo"),
            sunspot_bin: PathBuf::from(format!("{}/sunspot/go/sunspot", home)),
        }
    }
}

// ── TOML formatting helpers ──────────────────────────────────────────

fn field_to_hex(f: &FieldElement) -> String {
    format!("0x{}", hex::encode(field_to_bytes(f)))
}

fn fmt_field_array(fields: &[FieldElement]) -> String {
    fields
        .iter()
        .map(|f| format!("\"{}\"", field_to_hex(f)))
        .collect::<Vec<_>>()
        .join(", ")
}

fn fmt_index_array(indices: &[u8]) -> String {
    indices
        .iter()
        .map(|i| format!("\"{}\"", i))
        .collect::<Vec<_>>()
        .join(", ")
}

/// Format a Note as a TOML section: `[label]\nvalue = ...\n...`
fn note_toml(label: &str, n: &Note) -> String {
    format!(
        "[{label}]\n\
         value = \"{value}\"\n\
         asset_type = \"{asset}\"\n\
         owner = \"{owner}\"\n\
         randomness = \"{rand}\"\n\
         denomination = \"{denom}\"\n\
         timestamp = \"{ts}\"",
        value = n.value,
        asset = n.asset_type as u8,
        owner = field_to_hex(&n.owner),
        rand = field_to_hex(&n.randomness),
        denom = n.denomination,
        ts = n.timestamp,
    )
}

/// Format a real input (merkle proof + note) as TOML sections.
fn input_toml(label: &str, proof: &MerkleProof, note: &Note) -> String {
    format!(
        "[{label}]\n\
         indices = [{indices}]\n\
         path = [{path}]\n\
         \n\
         {note_section}",
        indices = fmt_index_array(&proof.indices),
        path = fmt_field_array(&proof.path),
        note_section = note_toml(&format!("{label}.note"), note),
    )
}

const ZERO_16: &str = "\"0\", \"0\", \"0\", \"0\", \"0\", \"0\", \"0\", \"0\", \
                        \"0\", \"0\", \"0\", \"0\", \"0\", \"0\", \"0\", \"0\"";

/// Format a dummy (all-zero) input as TOML sections.
fn dummy_input_toml(label: &str) -> String {
    format!(
        "[{label}]\n\
         indices = [{ZERO_16}]\n\
         path = [{ZERO_16}]\n\
         \n\
         [{label}.note]\n\
         value = \"0\"\n\
         asset_type = \"0\"\n\
         owner = \"0\"\n\
         randomness = \"0\"\n\
         denomination = \"0\"\n\
         timestamp = \"0\"",
    )
}

// ── Input structs ────────────────────────────────────────────────────

/// Input data for a deposit proof
#[derive(Debug, Clone)]
pub struct DepositProofInput {
    pub deposit_amount: u64,
    pub current_index: u64,
    pub current_timestamp: u64,
    pub master_secret: FieldElement,
    /// Deterministic randomness for the output note (use random_field() in production)
    pub output_randomness: FieldElement,
    /// Insertion path from ClientMerkleTree::get_insertion_path()
    pub insertion_siblings: [FieldElement; 16],
    pub insertion_indices: [u8; 16],
    pub insertion_old_root: FieldElement,
    pub insertion_leaf_index: u32,
}

/// Input data for a withdraw proof
#[derive(Debug, Clone)]
pub struct WithdrawProofInput {
    pub input_note: StoredNote,
    pub merkle_proof: MerkleProof,
    pub withdraw_amount: u64,
    pub current_index: u64,
    pub current_timestamp: u64,
    pub master_secret: FieldElement,
    pub merkle_root: FieldElement,
    pub recipient: FieldElement,
    /// Deterministic randomness for the change note (use random_field() in production)
    pub change_randomness: FieldElement,
    /// Insertion path for the change note (None = full withdrawal, no insertion)
    pub insertion_siblings: Option<[FieldElement; 16]>,
    pub insertion_indices: Option<[u8; 16]>,
    pub insertion_old_root: Option<FieldElement>,
    pub insertion_leaf_index: Option<u32>,
}

/// Input data for a shielded transfer proof
#[derive(Debug, Clone)]
pub struct TransferProofInput {
    pub input_note: StoredNote,
    pub merkle_proof: MerkleProof,
    pub current_index: u64,
    pub current_timestamp: u64,
    pub master_secret: FieldElement,
    pub merkle_root: FieldElement,
    /// Recipient's owner pubkey (hash(recipient_secret, 0))
    pub recipient_owner_pubkey: FieldElement,
    /// Randomness for the output note
    pub output_randomness: FieldElement,
    /// Insertion path from ClientMerkleTree::get_insertion_path()
    pub insertion_siblings: [FieldElement; 16],
    pub insertion_indices: [u8; 16],
    pub insertion_old_root: FieldElement,
    pub insertion_leaf_index: u32,
}

// ── Proof generation ─────────────────────────────────────────────────

/// Generate a Groth16 proof for a deposit transaction.
pub fn generate_deposit_proof(
    input: &DepositProofInput,
    config: &ProofGenConfig,
) -> Result<GeneratedProof, ProofGenError> {
    let owner_pubkey = compute_owner_pubkey(input.master_secret)?;
    let deposit_shares =
        ((input.deposit_amount as u128 * SCALE as u128) / input.current_index as u128) as u64;

    let out_0 = Note {
        value: deposit_shares,
        asset_type: AssetType::YcSol,
        owner: owner_pubkey,
        randomness: input.output_randomness,
        denomination: 0,
        timestamp: input.current_timestamp,
    };
    let out_0_commitment = compute_commitment(&out_0)?;

    let dummy = create_dummy_note();
    let out_1_commitment = compute_commitment(&dummy)?;

    let insertion_new_root = compute_merkle_root(
        out_0_commitment,
        &input.insertion_siblings,
        &input.insertion_indices,
    )?;

    let prover_toml = build_deposit_prover_toml(
        &out_0_commitment,
        &out_1_commitment,
        input.deposit_amount,
        input.current_index,
        input.current_timestamp,
        &input.master_secret,
        &out_0,
        &input.insertion_siblings,
        &input.insertion_indices,
        &input.insertion_old_root,
        &insertion_new_root,
        input.insertion_leaf_index,
    );

    let (proof, pw) = run_proof_pipeline(&prover_toml, config)?;

    Ok(GeneratedProof {
        proof,
        public_witness: pw,
        output_commitment_0: field_to_bytes(&out_0_commitment),
        output_commitment_1: field_to_bytes(&out_1_commitment),
    })
}

/// Generate a Groth16 proof for a withdraw transaction.
pub fn generate_withdraw_proof(
    input: &WithdrawProofInput,
    config: &ProofGenConfig,
) -> Result<GeneratedProof, ProofGenError> {
    let owner_pubkey = compute_owner_pubkey(input.master_secret)?;
    let input_commitment = compute_commitment(&input.input_note.note)?;
    let nullifier = crate::crypto::compute_nullifier(input_commitment, input.master_secret)?;

    let withdraw_shares =
        ((input.withdraw_amount as u128 * SCALE as u128) / input.current_index as u128) as u64;

    let change_value = input.input_note.note.value.saturating_sub(withdraw_shares);
    let (change_note, change_commitment) = if change_value > 0 {
        let change = Note {
            value: change_value,
            asset_type: AssetType::YcSol,
            owner: owner_pubkey,
            randomness: input.change_randomness,
            denomination: input.input_note.note.denomination,
            timestamp: input.current_timestamp,
        };
        let commit = compute_commitment(&change)?;
        (Some(change), commit)
    } else {
        let dummy = create_dummy_note();
        let commit = compute_commitment(&dummy)?;
        (None, commit)
    };

    let dummy = create_dummy_note();
    let out_1_commitment = compute_commitment(&dummy)?;

    let (ins_siblings, ins_indices, ins_old_root, ins_new_root, ins_leaf_index) =
        if let (Some(siblings), Some(indices), Some(old_root), Some(leaf_idx)) = (
            input.insertion_siblings.as_ref(),
            input.insertion_indices.as_ref(),
            input.insertion_old_root,
            input.insertion_leaf_index,
        ) {
            let new_root = compute_merkle_root(change_commitment, siblings, indices)?;
            (*siblings, *indices, old_root, new_root, leaf_idx)
        } else {
            (
                [FieldElement::zero(); 16],
                [0u8; 16],
                FieldElement::zero(),
                FieldElement::zero(),
                0u32,
            )
        };

    let prover_toml = build_withdraw_prover_toml(
        &input.merkle_root,
        &nullifier,
        &change_commitment,
        &out_1_commitment,
        input.withdraw_amount,
        input.current_index,
        input.current_timestamp,
        &input.master_secret,
        &input.recipient,
        &input.input_note,
        &input.merkle_proof,
        change_note.as_ref(),
        &ins_siblings,
        &ins_indices,
        &ins_old_root,
        &ins_new_root,
        ins_leaf_index,
    );

    let (proof, pw) = run_proof_pipeline(&prover_toml, config)?;

    Ok(GeneratedProof {
        proof,
        public_witness: pw,
        output_commitment_0: field_to_bytes(&change_commitment),
        output_commitment_1: field_to_bytes(&out_1_commitment),
    })
}

/// Generate a Groth16 proof for a shielded transfer transaction.
///
/// Transfer: spend sender's note, create new note owned by recipient.
/// No SOL moves (public_value_in = 0, public_value_out = 0).
pub fn generate_transfer_proof(
    input: &TransferProofInput,
    config: &ProofGenConfig,
) -> Result<GeneratedProof, ProofGenError> {
    // owner_pubkey verified inside circuit via master_secret
    let _owner_pubkey = compute_owner_pubkey(input.master_secret)?;
    let input_commitment = compute_commitment(&input.input_note.note)?;
    let nullifier = crate::crypto::compute_nullifier(input_commitment, input.master_secret)?;

    // Output note: same value, owned by recipient
    let out_0 = Note {
        value: input.input_note.note.value,
        asset_type: input.input_note.note.asset_type,
        owner: input.recipient_owner_pubkey,
        randomness: input.output_randomness,
        denomination: input.input_note.note.denomination,
        timestamp: input.current_timestamp,
    };
    let out_0_commitment = compute_commitment(&out_0)?;

    let dummy = create_dummy_note();
    let out_1_commitment = compute_commitment(&dummy)?;

    // Compute insertion new root
    let insertion_new_root = compute_merkle_root(
        out_0_commitment,
        &input.insertion_siblings,
        &input.insertion_indices,
    )?;

    let prover_toml = build_transfer_prover_toml(
        &input.merkle_root,
        &nullifier,
        &out_0_commitment,
        &out_1_commitment,
        input.current_index,
        input.current_timestamp,
        &input.master_secret,
        &input.recipient_owner_pubkey,
        &input.input_note,
        &input.merkle_proof,
        &out_0,
        &input.insertion_siblings,
        &input.insertion_indices,
        &input.insertion_old_root,
        &insertion_new_root,
        input.insertion_leaf_index,
    );

    let (proof, pw) = run_proof_pipeline(&prover_toml, config)?;

    Ok(GeneratedProof {
        proof,
        public_witness: pw,
        output_commitment_0: field_to_bytes(&out_0_commitment),
        output_commitment_1: field_to_bytes(&out_1_commitment),
    })
}

// ── Prover.toml builders ─────────────────────────────────────────────

fn build_deposit_prover_toml(
    out_0_commitment: &FieldElement,
    out_1_commitment: &FieldElement,
    deposit_amount: u64,
    current_index: u64,
    current_timestamp: u64,
    master_secret: &FieldElement,
    out_0: &Note,
    insertion_siblings: &[FieldElement; 16],
    insertion_indices: &[u8; 16],
    insertion_old_root: &FieldElement,
    insertion_new_root: &FieldElement,
    insertion_leaf_index: u32,
) -> String {
    let dummy = create_dummy_note();

    let mut toml = format!(
        r#"# Auto-generated by client-rs SDK
merkle_root = "0"
nullifier_0 = "0"
nullifier_1 = "0"
output_commitment_0 = "{out_0_commit}"
output_commitment_1 = "{out_1_commit}"
public_value_in = "{deposit_amount}"
public_value_out = "0"
current_index = "{current_index}"
current_timestamp = "{current_timestamp}"
recipient = "0"
insertion_old_root = "{ins_old_root}"
insertion_new_root = "{ins_new_root}"
insertion_leaf_index = "{ins_leaf_index}"

master_secret = "{ms}"
insertion_siblings = [{ins_s}]
insertion_indices = [{ins_i}]
"#,
        out_0_commit = field_to_hex(out_0_commitment),
        out_1_commit = field_to_hex(out_1_commitment),
        deposit_amount = deposit_amount,
        current_index = current_index,
        current_timestamp = current_timestamp,
        ins_old_root = field_to_hex(insertion_old_root),
        ins_new_root = field_to_hex(insertion_new_root),
        ins_leaf_index = insertion_leaf_index,
        ms = field_to_hex(master_secret),
        ins_s = fmt_field_array(insertion_siblings),
        ins_i = fmt_index_array(insertion_indices),
    );

    toml.push_str("\n");
    toml.push_str(&dummy_input_toml("in_0"));
    toml.push_str("\n\n");
    toml.push_str(&dummy_input_toml("in_1"));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_0", out_0));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_1", &dummy));
    toml.push('\n');
    toml
}

#[allow(clippy::too_many_arguments)]
fn build_withdraw_prover_toml(
    merkle_root: &FieldElement,
    nullifier: &FieldElement,
    change_commitment: &FieldElement,
    out_1_commitment: &FieldElement,
    withdraw_amount: u64,
    current_index: u64,
    current_timestamp: u64,
    master_secret: &FieldElement,
    recipient: &FieldElement,
    input_note: &StoredNote,
    merkle_proof: &MerkleProof,
    change_note: Option<&Note>,
    insertion_siblings: &[FieldElement; 16],
    insertion_indices: &[u8; 16],
    insertion_old_root: &FieldElement,
    insertion_new_root: &FieldElement,
    insertion_leaf_index: u32,
) -> String {
    let dummy = create_dummy_note();
    let out_0_note = change_note.cloned().unwrap_or_else(create_dummy_note);

    let mut toml = format!(
        r#"# Auto-generated by client-rs SDK (withdraw)
merkle_root = "{merkle_root}"
nullifier_0 = "{nullifier}"
nullifier_1 = "0"
output_commitment_0 = "{change_commit}"
output_commitment_1 = "{out_1_commit}"
public_value_in = "0"
public_value_out = "{withdraw_amount}"
current_index = "{current_index}"
current_timestamp = "{current_timestamp}"
recipient = "{recipient}"
insertion_old_root = "{ins_old_root}"
insertion_new_root = "{ins_new_root}"
insertion_leaf_index = "{ins_leaf_index}"

master_secret = "{ms}"
insertion_siblings = [{ins_s}]
insertion_indices = [{ins_i}]
"#,
        merkle_root = field_to_hex(merkle_root),
        nullifier = field_to_hex(nullifier),
        change_commit = field_to_hex(change_commitment),
        out_1_commit = field_to_hex(out_1_commitment),
        withdraw_amount = withdraw_amount,
        current_index = current_index,
        current_timestamp = current_timestamp,
        recipient = field_to_hex(recipient),
        ins_old_root = field_to_hex(insertion_old_root),
        ins_new_root = field_to_hex(insertion_new_root),
        ins_leaf_index = insertion_leaf_index,
        ms = field_to_hex(master_secret),
        ins_s = fmt_field_array(insertion_siblings),
        ins_i = fmt_index_array(insertion_indices),
    );

    toml.push_str("\n");
    toml.push_str(&input_toml("in_0", merkle_proof, &input_note.note));
    toml.push_str("\n\n");
    toml.push_str(&dummy_input_toml("in_1"));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_0", &out_0_note));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_1", &dummy));
    toml.push('\n');
    toml
}

#[allow(clippy::too_many_arguments)]
fn build_transfer_prover_toml(
    merkle_root: &FieldElement,
    nullifier: &FieldElement,
    out_0_commitment: &FieldElement,
    out_1_commitment: &FieldElement,
    current_index: u64,
    current_timestamp: u64,
    master_secret: &FieldElement,
    recipient: &FieldElement,
    input_note: &StoredNote,
    merkle_proof: &MerkleProof,
    out_0: &Note,
    insertion_siblings: &[FieldElement; 16],
    insertion_indices: &[u8; 16],
    insertion_old_root: &FieldElement,
    insertion_new_root: &FieldElement,
    insertion_leaf_index: u32,
) -> String {
    let dummy = create_dummy_note();

    let mut toml = format!(
        r#"# Auto-generated by client-rs SDK (transfer)
merkle_root = "{merkle_root}"
nullifier_0 = "{nullifier}"
nullifier_1 = "0"
output_commitment_0 = "{out_0_commit}"
output_commitment_1 = "{out_1_commit}"
public_value_in = "0"
public_value_out = "0"
current_index = "{current_index}"
current_timestamp = "{current_timestamp}"
recipient = "{recipient}"
insertion_old_root = "{ins_old_root}"
insertion_new_root = "{ins_new_root}"
insertion_leaf_index = "{ins_leaf_index}"

master_secret = "{ms}"
insertion_siblings = [{ins_s}]
insertion_indices = [{ins_i}]
"#,
        merkle_root = field_to_hex(merkle_root),
        nullifier = field_to_hex(nullifier),
        out_0_commit = field_to_hex(out_0_commitment),
        out_1_commit = field_to_hex(out_1_commitment),
        current_index = current_index,
        current_timestamp = current_timestamp,
        recipient = field_to_hex(recipient),
        ins_old_root = field_to_hex(insertion_old_root),
        ins_new_root = field_to_hex(insertion_new_root),
        ins_leaf_index = insertion_leaf_index,
        ms = field_to_hex(master_secret),
        ins_s = fmt_field_array(insertion_siblings),
        ins_i = fmt_index_array(insertion_indices),
    );

    toml.push_str("\n");
    toml.push_str(&input_toml("in_0", merkle_proof, &input_note.note));
    toml.push_str("\n\n");
    toml.push_str(&dummy_input_toml("in_1"));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_0", out_0));
    toml.push_str("\n\n");
    toml.push_str(&note_toml("out_1", &dummy));
    toml.push('\n');
    toml
}

// ── Proof pipeline ───────────────────────────────────────────────────

/// Write Prover.toml, run nargo execute + sunspot prove, read back artifacts
fn run_proof_pipeline(
    prover_toml: &str,
    config: &ProofGenConfig,
) -> Result<(Vec<u8>, Vec<u8>), ProofGenError> {
    let circuit_dir = &config.circuit_dir;
    let target_dir = circuit_dir.join("target");

    fs::write(circuit_dir.join("Prover.toml"), prover_toml)?;

    let nargo_output = Command::new(&config.nargo_bin)
        .args(["execute"])
        .current_dir(circuit_dir)
        .output()?;

    if !nargo_output.status.success() {
        return Err(ProofGenError::NargoFailed(
            String::from_utf8_lossy(&nargo_output.stderr).to_string(),
        ));
    }

    let prove_output = Command::new(&config.sunspot_bin)
        .args([
            "prove",
            "join_split.json",
            "join_split.gz",
            "join_split.ccs",
            "join_split.pk",
        ])
        .current_dir(&target_dir)
        .output()?;

    if !prove_output.status.success() {
        return Err(ProofGenError::SunspotFailed(
            String::from_utf8_lossy(&prove_output.stderr).to_string(),
        ));
    }

    let proof_path = target_dir.join("join_split.proof");
    let proof = fs::read(&proof_path).map_err(|_| {
        ProofGenError::MissingArtifact(proof_path.display().to_string())
    })?;

    if proof.len() != PROOF_SIZE {
        return Err(ProofGenError::InvalidProofSize {
            expected: PROOF_SIZE,
            actual: proof.len(),
        });
    }

    let pw_path = target_dir.join("join_split.pw");
    let pw = fs::read(&pw_path).map_err(|_| {
        ProofGenError::MissingArtifact(pw_path.display().to_string())
    })?;

    if pw.len() != PUBLIC_WITNESS_SIZE {
        return Err(ProofGenError::InvalidPwSize {
            expected: PUBLIC_WITNESS_SIZE,
            actual: pw.len(),
        });
    }

    Ok((proof, pw))
}

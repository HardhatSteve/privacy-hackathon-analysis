//! Proves total shielded balance meets a threshold without revealing exact amounts.
//!
//! Useful for KYC/AML compliance, governance voting thresholds, and tiered access.
//! The verifier learns only that `total_balance >= threshold` -- not the exact balance,
//! note count, individual values, or tree positions.

use dep::poseidon::poseidon2::Poseidon2;

/// Hash two field elements using noir-lang/poseidon's Poseidon2 (sponge construction)
fn hash_2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

// ============================================================================
// Constants
// ============================================================================

/// Precision multiplier for share-to-lamport math (1e9).
global SCALE: u64 = 1_000_000_000;

/// Upper bound on aggregated notes per proof.
global MAX_NOTES: u32 = 8;

/// Ceiling for note values to prevent u128 overflow (2^63 - 1).
global MAX_VALUE: u64 = 9_223_372_036_854_775_807;

// ============================================================================
// Data Structures
// ============================================================================

/// UTXO preimage for balance aggregation. Must match `join_split::Note` layout.
struct NoteData {
    value: u64,
    asset_type: u8,
    owner: Field,
    randomness: Field,
    denomination: u8,
    timestamp: u64,
}

// ============================================================================
// Cryptographic Functions
// ============================================================================

/// Walks a 16-level Merkle path from `leaf` to root.
/// `indices[i] == 1` means `leaf` is the right child at level `i`.
fn compute_merkle_root(leaf: Field, path: [Field; 16], indices: [u1; 16]) -> Field {
    let mut current = leaf;
    for i in 0..16 {
        if indices[i] == 1 {
            current = hash_2(path[i], current);
        } else {
            current = hash_2(current, path[i]);
        }
    }
    current
}

/// Produces a hiding commitment via chained `hash_2`:
/// ```text
/// value_commit = hash_2(hash_2(value, asset_type), hash_2(denomination, timestamp))
/// commitment   = hash_2(hash_2(value_commit, owner), randomness)
/// ```
fn compute_commitment(note: NoteData) -> Field {
    let value_hash = hash_2(note.value as Field, note.asset_type as Field);
    let time_hash = hash_2(note.denomination as Field, note.timestamp as Field);
    let value_commit = hash_2(value_hash, time_hash);

    let owner_hash = hash_2(value_commit, note.owner);
    hash_2(owner_hash, note.randomness)
}

/// Derives a public key from a master secret: `hash_2(secret, 0)`.
fn compute_owner_pubkey(master_secret: Field) -> Field {
    hash_2(master_secret, 0)
}

// ============================================================================
// Main Circuit
// ============================================================================

/// Aggregates up to 8 notes and asserts their total lamport value >= `threshold_lamports`.
///
/// # Panics
/// - `note_count` outside `[1, 8]`
/// - `current_index == 0` (division by zero)
/// - Any note value or `threshold_lamports` exceeds `MAX_VALUE`
/// - Ownership mismatch or Merkle proof failure on any active note
fn main(
    // Private inputs
    notes: [NoteData; 8],
    note_count: u8,
    merkle_paths: [[Field; 16]; 8],
    path_indices: [[u1; 16]; 8],
    master_secret: Field,
    // Public inputs
    merkle_root: pub Field,
    owner_pubkey: pub Field,
    threshold_lamports: pub u64,
    current_index: pub u64,
) {
    assert(note_count > 0);
    assert(note_count <= MAX_NOTES as u8);
    assert(current_index != 0);
    assert(threshold_lamports <= MAX_VALUE);

    let computed_owner = compute_owner_pubkey(master_secret);
    assert(computed_owner == owner_pubkey);

    let mut total_value: u128 = 0;

    for i in 0..8 {
        if (i as u8) < note_count {
            let note = notes[i];

            assert(note.value <= MAX_VALUE);
            assert(note.owner == owner_pubkey);

            let commitment = compute_commitment(note);
            let computed_root = compute_merkle_root(commitment, merkle_paths[i], path_indices[i]);
            assert(computed_root == merkle_root);

            let note_value = (note.value as u128 * current_index as u128) / SCALE as u128;
            total_value = total_value + note_value;
        }
    }

    assert(total_value >= threshold_lamports as u128);
}

// ============================================================================
// Tests
// ============================================================================

#[test]
fn test_owner_pubkey_derivation() {
    let secret = 12345;
    let pubkey = compute_owner_pubkey(secret);
    assert(pubkey != 0);
}

#[test]
fn test_commitment_deterministic() {
    let note = NoteData {
        value: 1_000_000_000,
        asset_type: 1,
        owner: 0x1234,
        randomness: 0xabcd,
        denomination: 3,
        timestamp: 1700000000,
    };

    let c1 = compute_commitment(note);
    let c2 = compute_commitment(note);
    assert(c1 == c2);
}

#[test]
fn test_commitment_different_for_different_notes() {
    let note1 = NoteData {
        value: 1_000_000_000,
        asset_type: 1,
        owner: 0x1234,
        randomness: 0xabcd,
        denomination: 3,
        timestamp: 1700000000,
    };

    let note2 = NoteData {
        value: 2_000_000_000, // Different value
        asset_type: 1,
        owner: 0x1234,
        randomness: 0xabcd,
        denomination: 3,
        timestamp: 1700000000,
    };

    let c1 = compute_commitment(note1);
    let c2 = compute_commitment(note2);
    assert(c1 != c2);
}

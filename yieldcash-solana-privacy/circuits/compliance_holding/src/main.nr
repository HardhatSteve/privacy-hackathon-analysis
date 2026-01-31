//! Proves a note has been held for at least N days without revealing the exact deposit date.
//!
//! Useful for vesting schedules, AML cooling-off periods, loyalty programs, and
//! long-term capital-gains eligibility. The verifier learns only that
//! `holding_period >= min_holding_days` -- not the note's value, position, or creation time.

use dep::poseidon::poseidon2::Poseidon2;

/// Hash two field elements using noir-lang/poseidon's Poseidon2 (sponge construction)
fn hash_2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

// ============================================================================
// Constants
// ============================================================================

global SECONDS_PER_DAY: u64 = 86400;

/// Year 3000 in Unix time; sanity ceiling.
global MAX_TIMESTAMP: u64 = 32503680000;

/// Year 2020 in Unix time; floor before YieldCash existed.
global MIN_TIMESTAMP: u64 = 1577836800;

// ============================================================================
// Data Structures
// ============================================================================

/// UTXO preimage. Must match `join_split::Note` layout.
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

/// Asserts that `current_timestamp - note.timestamp >= min_holding_days * 86400`.
///
/// `current_timestamp` should come from a trusted on-chain clock (Solana sysvar).
///
/// # Panics
/// - Timestamps outside `[MIN_TIMESTAMP, MAX_TIMESTAMP]`
/// - `note.timestamp > current_timestamp` (future-dated note)
/// - `min_holding_days > 10000` (~27 years; prevents overflow)
/// - Ownership mismatch or Merkle proof failure
fn main(
    // Private inputs
    note: NoteData,
    merkle_path: [Field; 16],
    path_indices: [u1; 16],
    master_secret: Field,
    // Public inputs
    merkle_root: pub Field,
    owner_pubkey: pub Field,
    current_timestamp: pub u64,
    min_holding_days: pub u64,
) {
    // Timestamp sanity bounds
    assert(note.timestamp >= MIN_TIMESTAMP);
    assert(note.timestamp <= MAX_TIMESTAMP);
    assert(current_timestamp >= MIN_TIMESTAMP);
    assert(current_timestamp <= MAX_TIMESTAMP);
    assert(current_timestamp >= note.timestamp);
    assert(min_holding_days <= 10000);

    // Ownership
    let computed_owner = compute_owner_pubkey(master_secret);
    assert(computed_owner == owner_pubkey);
    assert(note.owner == owner_pubkey);

    // Merkle membership
    let commitment = compute_commitment(note);
    let computed_root = compute_merkle_root(commitment, merkle_path, path_indices);
    assert(computed_root == merkle_root);

    // Holding period check
    let holding_seconds = current_timestamp - note.timestamp;
    let min_holding_seconds = min_holding_days * SECONDS_PER_DAY;
    assert(holding_seconds >= min_holding_seconds);
}

// ============================================================================
// Tests
// ============================================================================

#[test]
fn test_holding_period_calculation() {
    let thirty_days_seconds = 30 * SECONDS_PER_DAY;
    assert(thirty_days_seconds == 2592000);
}

#[test]
fn test_owner_derivation() {
    let secret = 98765;
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
fn test_90_days_in_seconds() {
    let ninety_days = 90 * SECONDS_PER_DAY;
    assert(ninety_days == 7776000);
}

#[test]
fn test_365_days_in_seconds() {
    let one_year = 365 * SECONDS_PER_DAY;
    assert(one_year == 31536000);
}

#[test]
fn test_timestamp_bounds() {
    // MIN_TIMESTAMP is 2020-01-01
    assert(MIN_TIMESTAMP == 1577836800);
    // MAX_TIMESTAMP is year 3000
    assert(MAX_TIMESTAMP == 32503680000);
}

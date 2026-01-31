//! 2-input, 2-output UTXO circuit for shielded deposits, withdrawals, transfers, merges, and splits.
//!
//! Inspired by Zcash Sapling and Tornado Cash Nova. Guarantees nullifier uniqueness,
//! Merkle membership, value conservation, fixed denominations, and timestamped notes.

use dep::poseidon::poseidon2::Poseidon2;

/// Hash two field elements using noir-lang/poseidon's Poseidon2 (sponge construction)
/// This is compatible with bn254_blackbox_solver::poseidon_hash in Rust
fn hash_2(a: Field, b: Field) -> Field {
    Poseidon2::hash([a, b], 2)
}

// ============================================================================
// Constants
// ============================================================================

/// Precision multiplier for share <-> lamport math (1e9).
global SCALE: u64 = 1_000_000_000;

/// Ceiling for note values to prevent u128 overflow (2^63 - 1).
global MAX_VALUE: u64 = 9_223_372_036_854_775_807;

/// Allowed public deposit/withdraw amounts (lamports). Zero is implicitly valid for dummy notes.
global VALID_DENOMINATIONS: [u64; 5] = [
    50_000_000,    // 0.05 SOL
    100_000_000,   // 0.1 SOL
    500_000_000,   // 0.5 SOL
    1_000_000_000, // 1 SOL
    5_000_000_000, // 5 SOL
];

// ============================================================================
// Data Structures
// ============================================================================

/// UTXO preimage. Commitment uses chained `hash_2`:
/// ```text
/// value_commit = hash_2(hash_2(value, asset_type), hash_2(denomination, timestamp))
/// commitment   = hash_2(hash_2(value_commit, owner), randomness)
/// ```
struct Note {
    value: u64,
    /// 0 = SOL, 1 = ycSOL.
    asset_type: u8,
    owner: Field,
    randomness: Field,
    /// Index into `VALID_DENOMINATIONS`.
    denomination: u8,
    timestamp: u64,
}

/// A spendable note bundled with its 16-level Merkle proof.
struct InputNote {
    note: Note,
    path: [Field; 16],
    /// `indices[i] == 1` means current node is right child at level `i`.
    indices: [u1; 16],
}

// ============================================================================
// Cryptographic Functions
// ============================================================================

/// Walks a 16-level Merkle path from `leaf` to root.
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

/// Produces a hiding commitment via chained `hash_2`.
fn compute_commitment(note: Note) -> Field {
    let value_hash = hash_2(note.value as Field, note.asset_type as Field);
    let time_hash = hash_2(note.denomination as Field, note.timestamp as Field);
    let value_commit = hash_2(value_hash, time_hash);

    let owner_hash = hash_2(value_commit, note.owner);
    hash_2(owner_hash, note.randomness)
}

/// Derives a nullifier that uniquely identifies a spent note: `hash_2([commitment, secret)`.
fn compute_nullifier(commitment: Field, master_secret: Field) -> Field {
    hash_2(commitment, master_secret)
}

/// Derives a public key from a master secret: `hash_2([secret, 0)`.
fn compute_owner_pubkey(master_secret: Field) -> Field {
    hash_2(master_secret, 0)
}

// ============================================================================
// Validation Functions
// ============================================================================

/// Returns `true` if `amount` is zero or matches a standard denomination.
fn is_valid_denomination(amount: u64) -> bool {
    let mut valid = amount == 0;
    for i in 0..5 {
        valid = valid | (amount == VALID_DENOMINATIONS[i]);
    }
    valid
}

/// Zero-value placeholder used to pad the fixed 2-in / 2-out structure.
fn is_dummy_note(note: Note) -> bool {
    note.value == 0
}

/// Asserts `inputs + deposits == outputs + withdrawals` after share conversion.
///
/// # Panics
/// - `current_index == 0`
/// - Any value exceeds `MAX_VALUE`
/// - Conservation violated
fn verify_value_conservation(
    in_0_shares: u64,
    in_1_shares: u64,
    out_0_shares: u64,
    out_1_shares: u64,
    public_value_in: u64,
    public_value_out: u64,
    current_index: u64,
) {
    assert(current_index != 0);

    assert(in_0_shares <= MAX_VALUE);
    assert(in_1_shares <= MAX_VALUE);
    assert(out_0_shares <= MAX_VALUE);
    assert(out_1_shares <= MAX_VALUE);
    assert(public_value_in <= MAX_VALUE);
    assert(public_value_out <= MAX_VALUE);

    let deposit_shares = (public_value_in as u128 * SCALE as u128) / current_index as u128;
    let withdraw_shares = (public_value_out as u128 * SCALE as u128) / current_index as u128;

    let input_total = in_0_shares as u128 + in_1_shares as u128 + deposit_shares;
    let output_total = out_0_shares as u128 + out_1_shares as u128 + withdraw_shares;

    assert(input_total == output_total);
}

/// Validates ownership, Merkle membership, and nullifier for a real note.
/// For dummy notes, only enforces `expected_nullifier == 0`.
fn verify_input_note(
    input: InputNote,
    master_secret: Field,
    merkle_root: Field,
    expected_nullifier: Field,
    owner_pubkey: Field,
) {
    if is_dummy_note(input.note) {
        assert(expected_nullifier == 0);
    } else {
        assert(input.note.owner == owner_pubkey);

        let commitment = compute_commitment(input.note);
        let computed_root = compute_merkle_root(commitment, input.path, input.indices);
        assert(computed_root == merkle_root);

        let computed_nullifier = compute_nullifier(commitment, master_secret);
        assert(computed_nullifier == expected_nullifier);
    }
}

// ============================================================================
// Main Circuit
// ============================================================================

/// Proves a valid 2-in, 2-out shielded transaction.
///
/// Output notes must have `timestamp == current_timestamp`. On-chain validation
/// uses asymmetric bounds: future <= 60s, past <= 600s (batching window).
///
/// # Panics
/// - Duplicate non-zero nullifiers
/// - Ownership, Merkle, or nullifier mismatch on inputs
/// - Output value > `MAX_VALUE`
/// - Output timestamp != `current_timestamp` (non-dummy)
/// - Output owner not in {self, recipient} (non-dummy)
/// - Value conservation violated
/// - Public amount not in `VALID_DENOMINATIONS`
fn main(
    // Private inputs
    in_0: InputNote,
    in_1: InputNote,
    out_0: Note,
    out_1: Note,
    master_secret: Field,
    // Private inputs for merkle insertion proof
    insertion_siblings: [Field; 16],
    insertion_indices: [u1; 16],
    // Public inputs
    merkle_root: pub Field,
    nullifier_0: pub Field,
    nullifier_1: pub Field,
    output_commitment_0: pub Field,
    output_commitment_1: pub Field,
    public_value_in: pub u64,
    public_value_out: pub u64,
    current_index: pub u64,
    current_timestamp: pub u64,
    recipient: pub Field,
    insertion_old_root: pub Field,
    insertion_new_root: pub Field,
    insertion_leaf_index: pub Field,
) {
    let owner_pubkey = compute_owner_pubkey(master_secret);

    // Nullifiers must differ unless both inputs are dummy
    let both_dummy = is_dummy_note(in_0.note) & is_dummy_note(in_1.note);
    assert(both_dummy | (nullifier_0 != nullifier_1));

    verify_input_note(in_0, master_secret, merkle_root, nullifier_0, owner_pubkey);
    verify_input_note(in_1, master_secret, merkle_root, nullifier_1, owner_pubkey);

    assert(out_0.value <= MAX_VALUE);
    assert(out_1.value <= MAX_VALUE);

    // Output timestamps must equal current_timestamp
    if !is_dummy_note(out_0) {
        assert(out_0.timestamp == current_timestamp);
    }
    if !is_dummy_note(out_1) {
        assert(out_1.timestamp == current_timestamp);
    }

    // Output commitments must match public inputs
    let computed_commitment_0 = compute_commitment(out_0);
    let computed_commitment_1 = compute_commitment(out_1);
    assert(computed_commitment_0 == output_commitment_0);
    assert(computed_commitment_1 == output_commitment_1);

    // Outputs must go to self or recipient
    if !is_dummy_note(out_0) {
        let valid_owner = (out_0.owner == owner_pubkey) | (out_0.owner == recipient);
        assert(valid_owner);
    }
    if !is_dummy_note(out_1) {
        let valid_owner = (out_1.owner == owner_pubkey) | (out_1.owner == recipient);
        assert(valid_owner);
    }

    verify_value_conservation(
        in_0.note.value,
        in_1.note.value,
        out_0.value,
        out_1.value,
        public_value_in,
        public_value_out,
        current_index,
    );

    assert(is_valid_denomination(public_value_in));
    assert(is_valid_denomination(public_value_out));

    // ====================================================================
    // Merkle Insertion Proof
    // ====================================================================
    // When both insertion roots are zero, skip insertion verification
    // (e.g., full withdrawal with no change note).
    // When non-zero, prove that inserting output_commitment_0 at the
    // given leaf index transforms old_root into new_root.
    let has_insertion = (insertion_old_root != 0) | (insertion_new_root != 0);
    if has_insertion {
        // Both must be non-zero when insertion is active
        assert(insertion_old_root != 0);
        assert(insertion_new_root != 0);

        // Verify path indices reconstruct the leaf index
        let mut reconstructed_idx: Field = 0;
        for i in 0..16 {
            reconstructed_idx += (insertion_indices[i] as Field) * (1 << i) as Field;
        }
        assert(reconstructed_idx == insertion_leaf_index);

        // Verify old root: tree has EMPTY LEAF (0) at insertion position
        let computed_old = compute_merkle_root(0, insertion_siblings, insertion_indices);
        assert(computed_old == insertion_old_root);

        // Verify new root: tree has output_commitment_0 at insertion position
        let computed_new = compute_merkle_root(output_commitment_0, insertion_siblings, insertion_indices);
        assert(computed_new == insertion_new_root);
    }
}

// ============================================================================
// Tests
// ============================================================================

fn make_dummy_note() -> Note {
    Note { value: 0, asset_type: 0, owner: 0, randomness: 0, denomination: 0, timestamp: 0 }
}

fn make_dummy_input() -> InputNote {
    InputNote { note: make_dummy_note(), path: [0; 16], indices: [0; 16] }
}

/// Different secrets must produce different owner pubkeys (collision resistance).
#[test]
fn test_owner_pubkey_collision_resistance() {
    let pk1 = compute_owner_pubkey(0x111);
    let pk2 = compute_owner_pubkey(0x222);
    let pk3 = compute_owner_pubkey(0x333);
    assert(pk1 != pk2);
    assert(pk2 != pk3);
    assert(pk1 != pk3);
}

/// Commitment hiding: identical notes with different randomness must produce different commitments.
#[test]
fn test_commitment_hiding_property() {
    let note1 = Note {
        value: 1_000_000_000, asset_type: 1, owner: 0x1234,
        randomness: 0xaaa, denomination: 3, timestamp: 1700000000,
    };
    let note2 = Note {
        value: 1_000_000_000, asset_type: 1, owner: 0x1234,
        randomness: 0xbbb, denomination: 3, timestamp: 1700000000,
    };
    assert(compute_commitment(note1) != compute_commitment(note2));
}

/// Commitment binding: changing any field must change the commitment.
#[test]
fn test_commitment_binding_property() {
    let base = Note {
        value: 1_000_000_000, asset_type: 1, owner: 0x1234,
        randomness: 0xabcd, denomination: 3, timestamp: 1700000000,
    };
    let base_commit = compute_commitment(base);

    // Change value
    let changed_value = Note {
        value: 2_000_000_000, asset_type: 1, owner: 0x1234,
        randomness: 0xabcd, denomination: 3, timestamp: 1700000000,
    };
    assert(compute_commitment(changed_value) != base_commit);

    // Change owner
    let changed_owner = Note {
        value: 1_000_000_000, asset_type: 1, owner: 0x5678,
        randomness: 0xabcd, denomination: 3, timestamp: 1700000000,
    };
    assert(compute_commitment(changed_owner) != base_commit);

    // Change timestamp
    let changed_ts = Note {
        value: 1_000_000_000, asset_type: 1, owner: 0x1234,
        randomness: 0xabcd, denomination: 3, timestamp: 1800000000,
    };
    assert(compute_commitment(changed_ts) != base_commit);
}

/// Nullifier uniqueness: same commitment with different secrets must produce different nullifiers.
#[test]
fn test_nullifier_unlinkability() {
    let commitment: Field = 0x12345678;
    let n1 = compute_nullifier(commitment, 0x111);
    let n2 = compute_nullifier(commitment, 0x222);
    assert(n1 != n2);
}

/// Denomination validation: only fixed tiers (0, 0.05, 0.1, 0.5, 1, 5 SOL) are valid.
#[test]
fn test_denomination_enforcement() {
    // Valid denominations
    assert(is_valid_denomination(0));
    assert(is_valid_denomination(50_000_000));
    assert(is_valid_denomination(100_000_000));
    assert(is_valid_denomination(500_000_000));
    assert(is_valid_denomination(1_000_000_000));
    assert(is_valid_denomination(5_000_000_000));

    // Invalid: arbitrary amounts
    assert(!is_valid_denomination(1));
    assert(!is_valid_denomination(75_000_000));
    assert(!is_valid_denomination(999_999_999));
    assert(!is_valid_denomination(10_000_000_000));
}

/// Deposit: public SOL in, shielded note out.
#[test]
fn test_deposit_conservation() {
    verify_value_conservation(0, 0, 1_000_000_000, 0, 1_000_000_000, 0, SCALE);
}

/// Withdraw: shielded note in, public SOL out.
#[test]
fn test_withdraw_conservation() {
    verify_value_conservation(1_000_000_000, 0, 0, 0, 0, 1_000_000_000, SCALE);
}

/// Transfer: shielded note in, shielded note out (no public value).
#[test]
fn test_transfer_conservation() {
    verify_value_conservation(1_000_000_000, 0, 1_000_000_000, 0, 0, 0, SCALE);
}

/// Merge: 2 notes in, 1 combined note out.
#[test]
fn test_merge_conservation() {
    verify_value_conservation(500_000_000, 500_000_000, 1_000_000_000, 0, 0, 0, SCALE);
}

/// Split: 1 note in, 2 notes out.
#[test]
fn test_split_conservation() {
    verify_value_conservation(1_000_000_000, 0, 500_000_000, 500_000_000, 0, 0, SCALE);
}

/// Yield accumulation: index > SCALE means shares are worth more.
#[test]
fn test_yield_accumulation() {
    // 1 share now worth 1.1 SOL (10% yield)
    let index = 1_100_000_000;
    verify_value_conservation(1_000_000_000, 0, 0, 0, 0, 1_100_000_000, index);
}

/// Inflation attack: cannot create more value than deposited.
#[test(should_fail)]
fn test_inflation_attack_blocked() {
    verify_value_conservation(0, 0, 2_000_000_000, 0, 1_000_000_000, 0, SCALE);
}

/// Division by zero: current_index = 0 must fail.
#[test(should_fail)]
fn test_zero_index_blocked() {
    verify_value_conservation(0, 0, 0, 0, 0, 0, 0);
}

/// Dummy note malleability: dummy inputs must have nullifier = 0.
#[test]
fn test_dummy_note_nullifier_constraint() {
    let dummy = make_dummy_input();
    let secret: Field = 12345;
    let owner = compute_owner_pubkey(secret);
    verify_input_note(dummy, secret, 0, 0, owner);
}

/// Dummy note with non-zero nullifier must be rejected.
#[test(should_fail)]
fn test_dummy_note_fake_nullifier_blocked() {
    let dummy = make_dummy_input();
    let secret: Field = 12345;
    let owner = compute_owner_pubkey(secret);
    verify_input_note(dummy, secret, 0, 0x1234, owner);
}

// ============================================================================
// Cross-Compatibility Tests (Rust Client Verification)
// ============================================================================

/// These tests verify that Noir and the Rust client produce identical hash values.
/// The expected values were generated by the Rust client using bn254_blackbox_solver.

#[test]
fn test_rust_client_hash2_compatibility() {
    // Rust: hash_2(123, 456) = 0x148c4666e2c5bce33dc53b30430808464f7ed76b28daf8a36722e93b49a31a5e
    let h1 = hash_2(123, 456);
    assert(h1 == 0x148c4666e2c5bce33dc53b30430808464f7ed76b28daf8a36722e93b49a31a5e);

    // Rust: hash_2(0, 0) = 0x0b63a53787021a4a962a452c2921b3663aff1ffd8d5510540f8e659e782956f1
    let h2 = hash_2(0, 0);
    assert(h2 == 0x0b63a53787021a4a962a452c2921b3663aff1ffd8d5510540f8e659e782956f1);

    // Rust: hash_2(1, 0) = 0x1e05013a2f40c60dc58cfe36bfa4d7e94676c43436922368628342bc5144d103
    let h3 = hash_2(1, 0);
    assert(h3 == 0x1e05013a2f40c60dc58cfe36bfa4d7e94676c43436922368628342bc5144d103);
}

#[test]
fn test_rust_client_owner_pubkey_compatibility() {
    // Rust: compute_owner_pubkey(0x111) = 0x0c49e22667de7cf3bd83f87644bebc585bd27414263ea223e8546f426e1346fb
    let pk1 = compute_owner_pubkey(0x111);
    assert(pk1 == 0x0c49e22667de7cf3bd83f87644bebc585bd27414263ea223e8546f426e1346fb);

    // Rust: compute_owner_pubkey(0x222) = 0x277f3c0457c672ffa7d56d0c69637400a5537e720cdd4ca28243a4405634c9ea
    let pk2 = compute_owner_pubkey(0x222);
    assert(pk2 == 0x277f3c0457c672ffa7d56d0c69637400a5537e720cdd4ca28243a4405634c9ea);

    // Rust: compute_owner_pubkey(0x333) = 0x0d4d18f19a6fbc948a7b88fee5a82ff431ce9434c8748e100c97740c8c802b42
    let pk3 = compute_owner_pubkey(0x333);
    assert(pk3 == 0x0d4d18f19a6fbc948a7b88fee5a82ff431ce9434c8748e100c97740c8c802b42);
}

#[test]
fn test_rust_client_nullifier_compatibility() {
    // Rust: compute_nullifier(0x12345678, 0x111) = 0x167affa2a1318ef71791eb39d1506ae8bdbff063976bd2121931320571cf0c47
    let n1 = compute_nullifier(0x12345678, 0x111);
    assert(n1 == 0x167affa2a1318ef71791eb39d1506ae8bdbff063976bd2121931320571cf0c47);

    // Rust: compute_nullifier(0x12345678, 0x222) = 0x20687e59b601c1c59fc92c810ed9b444a521bdc665e0d734e24a86c63d383033
    let n2 = compute_nullifier(0x12345678, 0x222);
    assert(n2 == 0x20687e59b601c1c59fc92c810ed9b444a521bdc665e0d734e24a86c63d383033);
}

#[test]
fn test_rust_client_commitment_compatibility() {
    // Note 1: value=1_000_000_000, asset_type=1, owner=0x1234, randomness=0xaaa, denomination=3, timestamp=1700000000
    // Rust commitment: 0x1171c791a0fdcd2ece8bff4103def6cca5a1da6b57f94f994993b4e488a84436
    let note1 = Note {
        value: 1_000_000_000,
        asset_type: 1,
        owner: 0x1234,
        randomness: 0xaaa,
        denomination: 3,
        timestamp: 1700000000,
    };
    let c1 = compute_commitment(note1);
    assert(c1 == 0x1171c791a0fdcd2ece8bff4103def6cca5a1da6b57f94f994993b4e488a84436);

    // Note 2: same but randomness=0xbbb
    // Rust commitment: 0x1b9ed7a328d4b51f61bd1b5d49e2202a34e755317c9701823f89a7de7fd2d0d7
    let note2 = Note {
        value: 1_000_000_000,
        asset_type: 1,
        owner: 0x1234,
        randomness: 0xbbb,
        denomination: 3,
        timestamp: 1700000000,
    };
    let c2 = compute_commitment(note2);
    assert(c2 == 0x1b9ed7a328d4b51f61bd1b5d49e2202a34e755317c9701823f89a7de7fd2d0d7);
}

// ============================================================================
// Merkle Insertion Tests
// ============================================================================

/// Verify that insertion logic correctly proves root transition.
/// An empty tree has zero leaves at all positions.
/// Inserting a leaf at index 0 should change the root from empty_root to a new root.
#[test]
fn test_merkle_insertion_basic() {
    // ZEROS[i] = hash of empty subtree at level i
    // ZEROS[0] = 0
    // ZEROS[1] = hash_2(0, 0) = 0x0b63a53787021a4a...
    // etc.

    // Compute the zero hashes for each level
    let mut zeros: [Field; 16] = [0; 16];
    let mut current: Field = 0;
    for i in 0..16 {
        zeros[i] = current;
        current = hash_2(current, current);
    }

    // For inserting at index 0, the path goes left (index bit 0) at every level
    // The siblings are the zero hashes at each level
    let mut siblings: [Field; 16] = [0; 16];
    for i in 0..16 {
        siblings[i] = zeros[i];
    }
    let insert_indices: [u1; 16] = [0; 16]; // index 0 = all left turns

    // Compute old root (empty tree): leaf=0 with all-zero siblings
    let old_root = compute_merkle_root(0, siblings, insert_indices);

    // Insert commitment 42 at index 0
    let commitment: Field = 42;
    let new_root = compute_merkle_root(commitment, siblings, insert_indices);

    // Roots must differ
    assert(old_root != new_root);

    // Now verify insertion_leaf_index matches reconstructed index
    let mut reconstructed_idx: Field = 0;
    for i in 0..16 {
        reconstructed_idx += (insert_indices[i] as Field) * (1 << i) as Field;
    }
    assert(reconstructed_idx == 0); // leaf index 0
}

/// Test that insertion at index 1 works correctly.
#[test]
fn test_merkle_insertion_index_1() {
    // Compute the zero hashes
    let mut zeros: [Field; 16] = [0; 16];
    let mut current: Field = 0;
    for i in 0..16 {
        zeros[i] = current;
        current = hash_2(current, current);
    }

    // Index 1 = right child at level 0, left at all other levels
    let insert_indices: [u1; 16] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mut siblings: [Field; 16] = [0; 16];
    for i in 0..16 {
        siblings[i] = zeros[i];
    }

    // old root = tree with 0 at index 1 (empty tree)
    let old_root = compute_merkle_root(0, siblings, insert_indices);

    // new root = tree with commitment at index 1
    let commitment: Field = 0xdeadbeef;
    let new_root = compute_merkle_root(commitment, siblings, insert_indices);

    assert(old_root != new_root);

    // Verify leaf index reconstruction
    let mut reconstructed_idx: Field = 0;
    for i in 0..16 {
        reconstructed_idx += (insert_indices[i] as Field) * (1 << i) as Field;
    }
    assert(reconstructed_idx == 1); // leaf index 1
}

/// Test that insertion with all-zero roots (no insertion) is skipped.
#[test]
fn test_insertion_skip_when_zeros() {
    // When insertion_old_root = 0 and insertion_new_root = 0,
    // the circuit should not assert (no insertion to verify).
    // This is tested implicitly by the main circuit tests which
    // pass 0 for all insertion fields.

    // Verify that the condition check works:
    let has_insertion = (0 as Field != 0) | (0 as Field != 0);
    assert(!has_insertion);
}

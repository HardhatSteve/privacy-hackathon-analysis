pragma circom 2.0.0;

// =============================================================================
// NULLIFIER NON-MEMBERSHIP PROOF
// =============================================================================
//
// Proves that a nullifier is NOT in the indexed merkle tree by showing a low
// element where: low_value < nullifier < low_next_value
//
// This is the core verification for transaction privacy - we prove the
// nullifier hasn't been used before without revealing which one it is.
//
// =============================================================================

include "./common.circom";

// =============================================================================
// NULLIFIER NON-MEMBERSHIP
// =============================================================================
// Proves nullifier is NOT in the indexed tree
// Returns 1 if valid non-membership proof, constrains to fail otherwise
template NullifierNonMembership(HEIGHT) {
    signal input nullifier;
    signal input nullifier_tree_root;

    // Low element data
    signal input low_index;
    signal input low_value;
    signal input low_next_value;
    signal input low_next_index;
    signal input low_merkle_proof[HEIGHT];

    // -------- CONSTRAINT 1: ORDERING --------
    // low_value < nullifier < low_next_value (or low_next_value == 0)
    component ordering = OrderingCheck();
    ordering.low_value <== low_value;
    ordering.nullifier <== nullifier;
    ordering.low_next_value <== low_next_value;

    // -------- CONSTRAINT 2: LOW ELEMENT EXISTS IN TREE --------
    // Compute low element hash
    component low_leaf = IndexedLeafHash();
    low_leaf.value <== low_value;
    low_leaf.next_value <== low_next_value;
    low_leaf.next_index <== low_next_index;

    // Verify merkle proof
    component merkle = MerkleProof(HEIGHT);
    merkle.leaf <== low_leaf.hash;
    merkle.pathIndices <== low_index;
    for (var h = 0; h < HEIGHT; h++) {
        merkle.pathElements[h] <== low_merkle_proof[h];
    }

    // Computed root must match provided root
    merkle.root === nullifier_tree_root;
}

// =============================================================================
// BATCH NULLIFIER NON-MEMBERSHIP
// =============================================================================
// Proves multiple nullifiers are not in the indexed tree
// Used for transaction verification with multiple inputs
template BatchNullifierNonMembership(HEIGHT, N_NULLIFIERS) {
    // IMPORTANT: Declaration order determines public signals order in snarkjs output
    // Must be: nullifier_tree_root, then nullifiers
    signal input nullifier_tree_root;
    signal input nullifiers[N_NULLIFIERS];

    // Low element data for each nullifier
    signal input low_indices[N_NULLIFIERS];
    signal input low_values[N_NULLIFIERS];
    signal input low_next_values[N_NULLIFIERS];
    signal input low_next_indices[N_NULLIFIERS];
    signal input low_merkle_proofs[N_NULLIFIERS][HEIGHT];

    component nonMembership[N_NULLIFIERS];

    for (var i = 0; i < N_NULLIFIERS; i++) {
        nonMembership[i] = NullifierNonMembership(HEIGHT);
        nonMembership[i].nullifier <== nullifiers[i];
        nonMembership[i].nullifier_tree_root <== nullifier_tree_root;
        nonMembership[i].low_index <== low_indices[i];
        nonMembership[i].low_value <== low_values[i];
        nonMembership[i].low_next_value <== low_next_values[i];
        nonMembership[i].low_next_index <== low_next_indices[i];
        for (var h = 0; h < HEIGHT; h++) {
            nonMembership[i].low_merkle_proof[h] <== low_merkle_proofs[i][h];
        }
    }
}

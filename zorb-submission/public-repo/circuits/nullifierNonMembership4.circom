pragma circom 2.0.0;

// =============================================================================
// NULLIFIER NON-MEMBERSHIP CIRCUIT - 4 Nullifiers
// Proves nullifiers don't exist in indexed merkle tree (epoch-stable)
// =============================================================================
//
// This circuit instantiates BatchNullifierNonMembership with:
//   - HEIGHT = 26 (tree depth, supports ~67M leaves)
//   - BATCH_SIZE = 4 (number of nullifiers to check per proof)
//
// Server-side circuit for proving nullifiers haven't been spent.
// Verified on-chain during transaction submission.
//
// Estimated constraints: ~29k
//
// =============================================================================

include "./lib/nullifier/nullifier-non-membership.circom";

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Public Inputs:
//   nullifier_tree_root - Merkle root of the nullifier indexed tree (epoch root)
//   nullifiers          - Array of 4 nullifiers to prove non-membership
// =============================================================================
component main {
    public [
        nullifier_tree_root,  // Merkle root of the nullifier indexed tree
        nullifiers            // Array of 4 nullifiers to prove non-membership
    ]
} = BatchNullifierNonMembership(26, 4);

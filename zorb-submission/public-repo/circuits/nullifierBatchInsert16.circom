pragma circom 2.0.0;

// =============================================================================
// NULLIFIER BATCH INSERT CIRCUIT - 16 Nullifiers
// Proves batch insertion of 16 nullifiers into indexed merkle tree
// =============================================================================
//
// This circuit instantiates NullifierBatchInsertSimple with:
//   - HEIGHT = 26 (tree depth, supports ~67M leaves)
//   - BATCH_SIZE = 16 (number of nullifiers per batch)
//
// Estimated constraints: ~850k
//
// =============================================================================

include "./lib/nullifier/nullifier-batch-insert.circom";

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Public Inputs:
//   old_root       - Merkle root before batch insertion
//   new_root       - Merkle root after batch insertion
//   starting_index - Index where first nullifier will be appended
//   nullifiers     - Array of 16 nullifiers to insert
// =============================================================================
component main {
    public [
        old_root,        // Merkle root before batch insertion
        new_root,        // Merkle root after batch insertion
        starting_index,  // Index where first nullifier will be appended
        nullifiers       // Array of 16 nullifiers to insert
    ]
} = NullifierBatchInsertSimple(26, 16);

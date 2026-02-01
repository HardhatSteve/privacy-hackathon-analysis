pragma circom 2.0.0;

// =============================================================================
// NULLIFIER BATCH INSERT CIRCUIT
// Indexed Merkle Tree Batch Insertion with Low Element Updates
// =============================================================================
//
// This circuit proves the correct insertion of a batch of nullifiers into an
// indexed merkle tree (Aztec-style). Each insertion involves TWO operations:
//   1. UPDATE the low element at its existing position (change pointers)
//   2. APPEND the new nullifier leaf (inherits low's old pointers)
//
// Root chaining per insertion:
//   root[i] -> (update low) -> intermediate -> (append) -> root[i+1]
//
// Key invariant: low_value < nullifier < low_next_value
//
// =============================================================================

// Use the library implementation to avoid code duplication
include "./lib/nullifier/nullifier-batch-insert.circom";

// =============================================================================
// BATCH SIZE VARIANTS
// =============================================================================
// Use separate files for each batch size:
//   - nullifierBatchInsert4.circom  (4 nullifiers)
//   - nullifierBatchInsert16.circom (16 nullifiers)
//   - nullifierBatchInsert64.circom (64 nullifiers)
//
// Each variant instantiates NullifierBatchInsertSimple(26, BATCH_SIZE)
// where 26 is the tree height (supports ~67M leaves).

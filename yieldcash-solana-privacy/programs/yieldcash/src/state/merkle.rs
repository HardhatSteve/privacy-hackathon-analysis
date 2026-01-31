//! Merkle tree and nullifier registry for the YieldCash shielded pool.

use anchor_lang::prelude::*;

/// Depth of the Merkle tree (2^16 = 65,536 leaves).
pub const TREE_DEPTH: usize = 16;

/// Maximum number of leaves the tree can hold.
pub const MAX_LEAVES: u32 = 65536;

/// Incremental Merkle tree using the Tornado Cash pattern.
///
/// Instead of storing all leaves (which would require 2MB+), this stores
/// only the filled subtree hashes at each level. When a new leaf is inserted,
/// we walk up the tree, hashing with either the sibling from `filled_subtrees`
/// (if it exists) or a zero hash (for empty subtrees).
///
/// Space complexity: O(depth) instead of O(2^depth).
#[account]
pub struct IncrementalMerkleTree {
    /// Hash of the rightmost filled subtree at each level.
    /// `filled_subtrees[0]` = most recent leaf commitment.
    /// `filled_subtrees[i]` = hash of rightmost complete subtree at level i.
    pub filled_subtrees: [[u8; 32]; TREE_DEPTH],

    /// Current root of the Merkle tree.
    pub current_root: [u8; 32],

    /// Index where the next leaf will be inserted (0-indexed).
    pub next_index: u32,
}

impl IncrementalMerkleTree {
    /// Account space: discriminator + filled_subtrees + current_root + next_index.
    pub const SIZE: usize = 8 + (32 * TREE_DEPTH) + 32 + 4;

    /// Returns true if the tree has reached maximum capacity.
    pub fn is_full(&self) -> bool {
        self.next_index >= MAX_LEAVES
    }
}

/// Registry of spent nullifiers to prevent double-spending.
///
/// Each note has a unique nullifier derived from `hash(commitment, master_secret)`.
/// When a note is spent, its nullifier is added here. Any attempt to spend
/// the same note again will fail the nullifier uniqueness check.
#[account]
pub struct NullifierRegistry {
    /// Set of spent nullifiers (32 bytes each).
    pub nullifiers: Vec<[u8; 32]>,
}

impl NullifierRegistry {
    /// Checks if a nullifier has already been spent.
    pub fn contains(&self, nullifier: &[u8; 32]) -> bool {
        self.nullifiers.iter().any(|n| n == nullifier)
    }

    /// Records a nullifier as spent.
    pub fn insert(&mut self, nullifier: [u8; 32]) {
        self.nullifiers.push(nullifier);
    }
}

//! Client-side incremental Merkle tree using Poseidon2 (Noir-compatible).
//!
//! Mirrors the on-chain IncrementalMerkleTree structure but performs
//! hash computations using the real Poseidon2 function from
//! `bn254_blackbox_solver`, matching the Noir circuit.
//!
//! The on-chain program cannot run Poseidon2 (BPF doesn't support arkworks),
//! so the client computes merkle roots and proofs off-chain and passes
//! the results to the program.

use acir::{AcirField, FieldElement};
use crate::crypto::{hash_2, field_to_bytes, CryptoError};
use crate::types::{MerkleProof, TREE_DEPTH};

/// Client-side incremental Merkle tree with Poseidon2 hashing.
///
/// Tracks all inserted leaves and filled subtrees to support:
/// - Computing new roots after leaf insertion
/// - Generating merkle proofs for any inserted leaf
pub struct ClientMerkleTree {
    /// Hash of the rightmost filled subtree at each level (same as on-chain).
    filled_subtrees: [FieldElement; TREE_DEPTH],
    /// Precomputed zero hashes for each level.
    zeros: [FieldElement; TREE_DEPTH],
    /// Current root of the tree.
    pub current_root: FieldElement,
    /// Next leaf index.
    pub next_index: u32,
    /// All inserted leaves (needed for merkle proof generation).
    leaves: Vec<FieldElement>,
}

impl ClientMerkleTree {
    /// Reconstruct a Merkle tree from on-chain state.
    ///
    /// Reads `filled_subtrees`, `next_index`, and `current_root` from the
    /// on-chain `IncrementalMerkleTree` account. This is sufficient for:
    /// - Computing insertion paths for new leaves
    /// - Generating merkle proofs for leaves inserted AFTER reconstruction
    ///
    /// Pre-existing leaves are represented as zero placeholders in the `leaves`
    /// vec so that index arithmetic stays correct for `get_proof()`.
    pub fn from_onchain_state(
        filled_subtrees_bytes: &[[u8; 32]; TREE_DEPTH],
        next_index: u32,
        current_root_bytes: [u8; 32],
    ) -> Result<Self, CryptoError> {
        let zeros = Self::compute_zeros()?;
        let mut filled_subtrees = [FieldElement::zero(); TREE_DEPTH];
        for i in 0..TREE_DEPTH {
            filled_subtrees[i] = FieldElement::from_be_bytes_reduce(&filled_subtrees_bytes[i]);
        }
        let current_root = FieldElement::from_be_bytes_reduce(&current_root_bytes);

        // Placeholder leaves for pre-existing entries (we don't know their values,
        // but get_proof will return zeros for them — only call get_proof on
        // leaves inserted after reconstruction).
        let leaves = vec![FieldElement::zero(); next_index as usize];

        Ok(ClientMerkleTree {
            filled_subtrees,
            zeros,
            current_root,
            next_index,
            leaves,
        })
    }

    /// Create a new empty Merkle tree.
    pub fn new() -> Result<Self, CryptoError> {
        let zeros = Self::compute_zeros()?;
        // Empty root = hash_2(zeros[15], zeros[15])
        let empty_root = hash_2(zeros[TREE_DEPTH - 1], zeros[TREE_DEPTH - 1])?;

        Ok(ClientMerkleTree {
            filled_subtrees: zeros,
            zeros,
            current_root: empty_root,
            next_index: 0,
            leaves: Vec::new(),
        })
    }

    /// Compute the zero hashes for each level using Poseidon2.
    fn compute_zeros() -> Result<[FieldElement; TREE_DEPTH], CryptoError> {
        let mut zeros = [FieldElement::zero(); TREE_DEPTH];
        let mut current = FieldElement::zero();
        for i in 0..TREE_DEPTH {
            zeros[i] = current;
            current = hash_2(current, current)?;
        }
        Ok(zeros)
    }

    /// Insert a leaf and return the new root.
    ///
    /// Uses the same incremental insertion algorithm as the on-chain tree
    /// (Tornado Cash pattern), but with real Poseidon2 hashing.
    pub fn insert(&mut self, leaf: FieldElement) -> Result<FieldElement, CryptoError> {
        self.leaves.push(leaf);

        let mut current_index = self.next_index;
        let mut current_hash = leaf;

        for level in 0..TREE_DEPTH {
            if current_index % 2 == 0 {
                self.filled_subtrees[level] = current_hash;
                current_hash = hash_2(current_hash, self.zeros[level])?;
            } else {
                current_hash = hash_2(self.filled_subtrees[level], current_hash)?;
            }
            current_index /= 2;
        }

        self.next_index += 1;
        self.current_root = current_hash;
        Ok(current_hash)
    }

    /// Get the current root as bytes.
    pub fn root_bytes(&self) -> [u8; 32] {
        field_to_bytes(&self.current_root)
    }

    /// Get the insertion path for inserting at the current `next_index` position.
    ///
    /// Returns the sibling hashes and bit-indices needed by the circuit to prove
    /// that inserting a leaf at `next_index` transforms old_root into new_root.
    ///
    /// The key insight: in the incremental Merkle tree, the siblings at the
    /// insertion position are either zero hashes (if the current node is a
    /// left child) or filled subtree hashes (if it's a right child).
    pub fn get_insertion_path(&self) -> InsertionPath {
        let mut siblings = [FieldElement::zero(); TREE_DEPTH];
        let mut indices = [0u8; TREE_DEPTH];
        let mut idx = self.next_index;

        for level in 0..TREE_DEPTH {
            if idx % 2 == 0 {
                // Left child: sibling is the zero hash at this level
                siblings[level] = self.zeros[level];
                indices[level] = 0;
            } else {
                // Right child: sibling is the filled subtree hash
                siblings[level] = self.filled_subtrees[level];
                indices[level] = 1;
            }
            idx /= 2;
        }

        InsertionPath {
            siblings,
            indices,
            leaf_index: self.next_index,
            old_root: self.current_root,
        }
    }

    /// Generate a merkle proof for the leaf at the given index.
    ///
    /// Returns the path (sibling hashes) and indices (left/right position)
    /// needed by the Noir circuit to verify membership.
    pub fn get_proof(&self, leaf_index: u32) -> Result<MerkleProof, CryptoError> {
        let mut path = [FieldElement::zero(); TREE_DEPTH];
        let mut indices = [0u8; TREE_DEPTH];

        for level in 0..TREE_DEPTH {
            let node_pos = (leaf_index as usize) >> level;
            indices[level] = (node_pos & 1) as u8;
            let sibling_pos = node_pos ^ 1;
            path[level] = self.compute_node(level, sibling_pos)?;
        }

        Ok(MerkleProof { path, indices })
    }

    /// Compute the hash value of a node at a given (level, index) in the tree.
    ///
    /// Uses the optimization that entirely empty subtrees equal the
    /// precomputed zero hash at that level, avoiding unnecessary computation.
    fn compute_node(&self, level: usize, index: usize) -> Result<FieldElement, CryptoError> {
        if level == 0 {
            // Leaf level
            if index < self.leaves.len() {
                Ok(self.leaves[index])
            } else {
                Ok(self.zeros[0])
            }
        } else {
            // Check if entire subtree is empty (optimization)
            let first_leaf_in_subtree = index * (1 << level);
            if first_leaf_in_subtree >= self.leaves.len() {
                return Ok(self.zeros[level]);
            }

            let left = self.compute_node(level - 1, index * 2)?;
            let right = self.compute_node(level - 1, index * 2 + 1)?;
            hash_2(left, right)
        }
    }
}

/// Data needed for the circuit's merkle insertion proof.
///
/// Contains the sibling hashes and bit-indices for the insertion position,
/// plus the current root (before insertion) and the leaf index.
pub struct InsertionPath {
    /// Sibling hashes at each level of the merkle path.
    pub siblings: [FieldElement; TREE_DEPTH],
    /// Bit-indices (0 = left child, 1 = right child) at each level.
    pub indices: [u8; TREE_DEPTH],
    /// The leaf index where insertion will occur.
    pub leaf_index: u32,
    /// The current root before insertion.
    pub old_root: FieldElement,
}

/// Convenience function: create an empty root as bytes.
pub fn empty_root_bytes() -> Result<[u8; 32], CryptoError> {
    let tree = ClientMerkleTree::new()?;
    Ok(tree.root_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_tree_root_matches_on_chain() {
        let tree = ClientMerkleTree::new().unwrap();
        // Must match EMPTY_ROOT in programs/yieldcash/src/utils.rs
        assert_eq!(tree.root_bytes(), [
            0x14, 0xf4, 0x4d, 0x67, 0x2e, 0xb3, 0x57, 0x73,
            0x9e, 0x42, 0x46, 0x34, 0x97, 0xf9, 0xfd, 0xac,
            0x46, 0x62, 0x3a, 0xf8, 0x63, 0xee, 0xa4, 0xd9,
            0x47, 0xca, 0x00, 0xa4, 0x97, 0xdc, 0xde, 0xb3,
        ]);
    }

    #[test]
    fn test_merkle_proof_verifies() {
        let mut tree = ClientMerkleTree::new().unwrap();
        let leaf = FieldElement::from(12345u128);
        tree.insert(leaf).unwrap();

        let proof = tree.get_proof(0).unwrap();
        let computed_root = crate::crypto::compute_merkle_root(leaf, &proof.path, &proof.indices).unwrap();
        assert_eq!(computed_root, tree.current_root);
    }

    #[test]
    fn test_insertion_path_produces_correct_root() {
        let tree = ClientMerkleTree::new().unwrap();
        let path = tree.get_insertion_path();

        assert_eq!(path.leaf_index, 0);
        assert_eq!(path.old_root, tree.current_root);

        // Zero leaf at insertion position should reproduce current root
        let computed_old = crate::crypto::compute_merkle_root(
            FieldElement::zero(), &path.siblings, &path.indices,
        ).unwrap();
        assert_eq!(computed_old, tree.current_root);

        // Inserting a commitment should match actual tree insertion
        let commitment = FieldElement::from(42u128);
        let computed_new = crate::crypto::compute_merkle_root(
            commitment, &path.siblings, &path.indices,
        ).unwrap();

        let mut tree2 = ClientMerkleTree::new().unwrap();
        assert_eq!(computed_new, tree2.insert(commitment).unwrap());
    }
}

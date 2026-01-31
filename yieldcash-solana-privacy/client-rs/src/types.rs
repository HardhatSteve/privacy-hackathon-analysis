//! Type definitions matching the Noir circuit

use acir::FieldElement;
use serde::{Deserialize, Serialize};

/// Precision multiplier for share <-> lamport math (1e9)
pub const SCALE: u64 = 1_000_000_000;

/// Maximum value for notes to prevent overflow
pub const MAX_VALUE: u64 = 9_223_372_036_854_775_807;

/// Merkle tree depth
pub const TREE_DEPTH: usize = 16;

/// Valid deposit/withdraw denominations in lamports
pub const VALID_DENOMINATIONS: [u64; 5] = [
    50_000_000,     // 0.05 SOL
    100_000_000,    // 0.1 SOL
    500_000_000,    // 0.5 SOL
    1_000_000_000,  // 1 SOL
    5_000_000_000,  // 5 SOL
];

/// Asset types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum AssetType {
    Sol = 0,
    YcSol = 1,
}

impl From<u8> for AssetType {
    fn from(v: u8) -> Self {
        match v {
            0 => AssetType::Sol,
            _ => AssetType::YcSol,
        }
    }
}

/// Note structure matching the Noir circuit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub value: u64,
    pub asset_type: AssetType,
    pub owner: FieldElement,
    pub randomness: FieldElement,
    pub denomination: u8,
    pub timestamp: u64,
}

/// Stored note with additional metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredNote {
    pub note: Note,
    pub commitment: [u8; 32],
    pub leaf_index: u32,
    pub spent: bool,
}

/// Merkle proof for a note
#[derive(Debug, Clone)]
pub struct MerkleProof {
    pub path: [FieldElement; TREE_DEPTH],
    pub indices: [u8; TREE_DEPTH],
}

/// Check if amount is a valid denomination
pub fn is_valid_denomination(amount: u64) -> bool {
    amount == 0 || VALID_DENOMINATIONS.contains(&amount)
}

/// Get denomination index for amount
pub fn get_denomination_index(amount: u64) -> Option<u8> {
    VALID_DENOMINATIONS.iter().position(|&d| d == amount).map(|i| i as u8)
}

/// Convert lamports to shares based on current index
pub fn lamports_to_shares(lamports: u64, index: u64) -> u64 {
    ((lamports as u128 * SCALE as u128) / index as u128) as u64
}

/// Convert shares to lamports based on current index
pub fn shares_to_lamports(shares: u64, index: u64) -> u64 {
    ((shares as u128 * index as u128) / SCALE as u128) as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_share_conversion_at_scale() {
        let shares = lamports_to_shares(1_000_000_000, SCALE);
        assert_eq!(shares, 1_000_000_000);
        assert_eq!(shares_to_lamports(shares, SCALE), 1_000_000_000);
    }

    #[test]
    fn test_share_conversion_with_yield() {
        let index = 1_100_000_000; // 10% yield
        assert_eq!(lamports_to_shares(1_100_000_000, index), 1_000_000_000);
        assert_eq!(shares_to_lamports(1_000_000_000, index), 1_100_000_000);
    }
}

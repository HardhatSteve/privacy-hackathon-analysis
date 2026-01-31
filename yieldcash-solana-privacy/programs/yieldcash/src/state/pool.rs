//! Shielded pool state for the YieldCash protocol.

use anchor_lang::prelude::*;
use crate::constants::ZERO_HASH;

/// Number of recent Merkle roots to store in the ring buffer.
/// Allows proofs against slightly stale roots to remain valid,
/// preventing race conditions when multiple users transact concurrently.
/// Tornado Cash uses 30; we use 32 for alignment.
pub const ROOT_HISTORY_SIZE: usize = 32;

/// Main state account for the YieldCash shielded pool.
///
/// Stores the Merkle root history, share accounting, and PDA bumps
/// for deterministic vault addresses.
#[account]
#[derive(Default)]
pub struct ShieldedPool {
    /// Ring buffer of recent Merkle roots.
    /// Proofs can verify against any root in this history.
    pub root_history: [[u8; 32]; ROOT_HISTORY_SIZE],

    /// Current index in the root history ring buffer (0..31).
    pub current_root_index: u8,

    /// Number of leaves (note commitments) in the Merkle tree.
    pub leaf_count: u32,

    /// PDA bump seed for the pool account.
    pub bump: u8,

    /// PDA bump seed for the SOL vault.
    pub sol_vault_bump: u8,

    /// PDA bump seed for the mSOL vault.
    pub msol_vault_bump: u8,

    /// Target SOL buffer ratio as percentage (e.g., 15 = 15%).
    /// Determines how much SOL to keep liquid vs staked to Marinade.
    pub buffer_ratio: u8,

    /// Total shares across all depositors.
    /// Used with the index to compute TVL: `tvl = total_shares * index / SCALE`.
    pub total_shares: u128,

    /// Whether the pool is immutable (no admin).
    /// Set to true at initialization for trustless operation.
    pub immutable: bool,
}

impl ShieldedPool {
    /// Account space: discriminator + all fields.
    pub const SIZE: usize = 8 + (32 * ROOT_HISTORY_SIZE) + 1 + 4 + 1 + 1 + 1 + 1 + 16 + 1;

    /// Returns the current (most recent) Merkle root.
    pub fn current_root(&self) -> [u8; 32] {
        self.root_history[self.current_root_index as usize]
    }

    /// Checks if a given root exists in the recent history.
    /// Zero root is only valid for an empty tree.
    pub fn is_known_root(&self, root: &[u8; 32]) -> bool {
        if *root == ZERO_HASH {
            return self.leaf_count == 0;
        }
        self.root_history.contains(root)
    }

    /// Pushes a new root to the history ring buffer.
    /// Overwrites the oldest root when buffer is full.
    pub fn push_root(&mut self, root: [u8; 32]) {
        self.current_root_index = (self.current_root_index + 1) % ROOT_HISTORY_SIZE as u8;
        self.root_history[self.current_root_index as usize] = root;
    }
}

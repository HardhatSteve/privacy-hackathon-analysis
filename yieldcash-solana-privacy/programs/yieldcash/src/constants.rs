//! Protocol constants for the YieldCash shielded pool.

/// Precision multiplier for share calculations (1e9).
/// Matches the SCALE constant in the Noir circuits.
pub const SCALE: u128 = 1_000_000_000;

/// Valid deposit/withdrawal denominations in lamports.
/// Fixed denominations preserve anonymity by making all transactions
/// of the same size indistinguishable.
pub const DENOM_0_05_SOL: u64 = 50_000_000;
pub const DENOM_0_1_SOL: u64 = 100_000_000;
pub const DENOM_0_5_SOL: u64 = 500_000_000;
pub const DENOM_1_SOL: u64 = 1_000_000_000;
pub const DENOM_5_SOL: u64 = 5_000_000_000;

/// Array of all valid denominations for iteration.
pub const VALID_DENOMINATIONS: [u64; 5] = [
    DENOM_0_05_SOL,
    DENOM_0_1_SOL,
    DENOM_0_5_SOL,
    DENOM_1_SOL,
    DENOM_5_SOL,
];

/// Default SOL buffer ratio (15%).
/// Determines how much SOL to keep liquid for instant withdrawals.
pub const DEFAULT_BUFFER_RATIO: u8 = 15;

/// PDA seed for the main pool account.
pub const POOL_SEED: &[u8] = b"shielded_pool";

/// PDA seed for the incremental Merkle tree account.
pub const MERKLE_SEED: &[u8] = b"merkle_tree";

/// PDA seed for the nullifier registry account.
pub const NULLIFIER_SEED: &[u8] = b"nullifier_registry";

/// PDA seed for the SOL vault.
pub const SOL_VAULT_SEED: &[u8] = b"sol_vault";

/// PDA seed for the mSOL vault (Marinade staked SOL).
pub const MSOL_VAULT_SEED: &[u8] = b"msol_vault";

/// Zero hash constant for comparisons and dummy values.
pub const ZERO_HASH: [u8; 32] = [0u8; 32];

/// Commitment value representing a dummy/empty note.
/// Used for padding in the 2-in, 2-out join-split pattern.
pub const DUMMY_COMMITMENT: [u8; 32] = ZERO_HASH;

/// Maximum time a proof timestamp can be in the future (60 seconds).
/// Allows for clock skew between client and validator.
pub const TIMESTAMP_MAX_FUTURE: i64 = 60;

/// Maximum time a proof timestamp can be in the past (600 seconds).
/// Allows for batching window and transaction delays.
pub const TIMESTAMP_MAX_PAST: i64 = 600;

/// Checks if an amount is a valid denomination (0 or one of the fixed tiers).
pub fn is_valid_denomination(amount: u64) -> bool {
    amount == 0 || VALID_DENOMINATIONS.contains(&amount)
}

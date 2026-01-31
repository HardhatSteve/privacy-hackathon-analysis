//! Custom error codes for the YieldCash protocol.

use anchor_lang::prelude::*;

/// Protocol-specific errors for the YieldCash shielded pool.
#[error_code]
pub enum YieldCashError {
    /// Deposit or withdrawal amount is not a valid fixed denomination.
    #[msg("Invalid denomination amount")]
    InvalidDenomination,

    /// The nullifier has already been recorded, indicating a double-spend attempt.
    #[msg("Nullifier has already been spent")]
    NullifierAlreadySpent,

    /// The provided Merkle root is not in the recent root history.
    #[msg("Unknown Merkle root")]
    UnknownMerkleRoot,

    /// The ZK proof failed verification.
    #[msg("Proof verification failed")]
    ProofVerificationFailed,

    /// The proof timestamp is too far in the future (> 60 seconds).
    #[msg("Timestamp too far in the future")]
    TimestampInFuture,

    /// The proof timestamp is too old (> 600 seconds in the past).
    #[msg("Timestamp too old")]
    TimestampTooOld,

    /// The Merkle tree has reached its maximum capacity of 65,536 leaves.
    #[msg("Merkle tree is full")]
    MerkleTreeFull,

    /// The SOL vault does not have enough balance for the withdrawal.
    #[msg("Insufficient SOL in vault")]
    InsufficientVaultBalance,

    /// A mathematical operation would overflow.
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}

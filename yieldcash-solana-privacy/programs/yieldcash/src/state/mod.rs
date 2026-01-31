//! State account definitions for the YieldCash protocol.
//!
//! This module contains all on-chain account structures:
//! - [`ShieldedPool`]: Main pool state with root history and share accounting
//! - [`IncrementalMerkleTree`]: Merkle tree for note commitments
//! - [`NullifierRegistry`]: Registry for spent nullifiers

pub mod pool;
pub mod merkle;

pub use pool::*;
pub use merkle::*;

//! YieldCash Rust Client SDK
//!
//! Provides Noir-compatible cryptographic primitives for the YieldCash privacy pool.
//! Uses the same Poseidon2 implementation as Noir's bn254 blackbox solver.

pub mod crypto;
pub mod encryption;
pub mod merkle;
pub mod note;
pub mod proof_gen;
pub mod solana;
pub mod types;

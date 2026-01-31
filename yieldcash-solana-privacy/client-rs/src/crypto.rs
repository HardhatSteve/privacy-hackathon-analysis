//! Cryptographic primitives using Noir-compatible Poseidon2
//!
//! This module provides hash functions that are 100% compatible with
//! the Noir circuit's poseidon2::bn254::hash_2 implementation.

use acir::{AcirField, FieldElement};
use bn254_blackbox_solver::poseidon_hash;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Poseidon hash failed: {0}")]
    HashError(String),
    #[error("Invalid field element")]
    InvalidField,
}

/// Hash two field elements using Poseidon2 (Noir-compatible)
/// Equivalent to: poseidon2::bn254::hash_2([a, b]) in Noir
pub fn hash_2(a: FieldElement, b: FieldElement) -> Result<FieldElement, CryptoError> {
    let inputs = vec![a, b];
    poseidon_hash(&inputs, false)
        .map_err(|e| CryptoError::HashError(format!("{:?}", e)))
}

/// Hash a single field element
pub fn hash_1(a: FieldElement) -> Result<FieldElement, CryptoError> {
    let inputs = vec![a];
    poseidon_hash(&inputs, false)
        .map_err(|e| CryptoError::HashError(format!("{:?}", e)))
}

/// Compute owner public key from master secret
/// Equivalent to: poseidon2::bn254::hash_2([master_secret, 0]) in Noir
pub fn compute_owner_pubkey(master_secret: FieldElement) -> Result<FieldElement, CryptoError> {
    hash_2(master_secret, FieldElement::zero())
}

/// Compute nullifier from commitment and master secret
/// Equivalent to: poseidon2::bn254::hash_2([commitment, master_secret]) in Noir
pub fn compute_nullifier(
    commitment: FieldElement,
    master_secret: FieldElement,
) -> Result<FieldElement, CryptoError> {
    hash_2(commitment, master_secret)
}

/// Compute Merkle root by walking up the tree
/// Equivalent to the compute_merkle_root function in the Noir circuit
pub fn compute_merkle_root(
    leaf: FieldElement,
    path: &[FieldElement; 16],
    indices: &[u8; 16],
) -> Result<FieldElement, CryptoError> {
    let mut current = leaf;
    for i in 0..16 {
        if indices[i] == 1 {
            current = hash_2(path[i], current)?;
        } else {
            current = hash_2(current, path[i])?;
        }
    }
    Ok(current)
}

/// Convert bytes to FieldElement (big-endian)
pub fn bytes_to_field(bytes: &[u8; 32]) -> FieldElement {
    FieldElement::from_be_bytes_reduce(bytes)
}

/// Convert FieldElement to bytes (big-endian)
pub fn field_to_bytes(field: &FieldElement) -> [u8; 32] {
    let vec = field.to_be_bytes();
    let mut arr = [0u8; 32];
    let len = vec.len().min(32);
    // Right-align the bytes (big-endian padding)
    arr[32 - len..].copy_from_slice(&vec[vec.len() - len..]);
    arr
}

/// Generate random field element
pub fn random_field() -> FieldElement {
    let mut bytes = [0u8; 32];
    getrandom::getrandom(&mut bytes).expect("getrandom failed");
    // Reduce to ensure it's in the field
    FieldElement::from_be_bytes_reduce(&bytes)
}

/// A shielded address that can be shared publicly for receiving transfers.
///
/// Contains the owner's circuit-level identity (for note ownership) and
/// an encryption public key (for encrypting notes to the recipient).
#[derive(Debug, Clone)]
pub struct ShieldedAddress {
    /// owner_pubkey = poseidon2(master_secret, 0) — used in circuit for note ownership
    pub owner_pubkey: FieldElement,
    /// X25519 encryption public key — used to encrypt notes for the recipient
    pub encryption_pk: [u8; 32],
}

/// Derive a shielded address from a master secret.
///
/// The shielded address is the public part that gets shared with senders:
/// - `owner_pubkey`: hash(master_secret, 0) — circuit-level identity
/// - `encryption_pk`: X25519 public key derived from SHA256(master_secret || "encryption")
pub fn derive_shielded_address(master_secret: FieldElement) -> Result<ShieldedAddress, CryptoError> {
    let owner_pubkey = compute_owner_pubkey(master_secret)?;
    let enc_kp = crate::encryption::derive_encryption_keypair(&master_secret);
    Ok(ShieldedAddress {
        owner_pubkey,
        encryption_pk: enc_kp.public.to_bytes(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_bytes_roundtrip() {
        let original = random_field();
        let bytes = field_to_bytes(&original);
        let recovered = bytes_to_field(&bytes);
        assert_eq!(original, recovered);
    }
}

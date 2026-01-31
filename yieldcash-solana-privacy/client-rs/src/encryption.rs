//! Note encryption: X25519 ECDH + HKDF-SHA256 + AES-256-GCM
//!
//! Scheme: ephemeral X25519 keypair → ECDH → HKDF(44 bytes) → AES-256-GCM.
//! Each encrypted note carries the ephemeral public key so the recipient can
//! derive the same shared secret using their static X25519 secret.

use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
use hkdf::Hkdf;
use sha2::{Digest, Sha256};
use x25519_dalek::{PublicKey, StaticSecret};

use acir::{AcirField, FieldElement};
use crate::crypto::field_to_bytes;
use crate::types::{AssetType, Note};
use thiserror::Error;

const HKDF_INFO: &[u8] = b"yieldcash-note-encryption";
const PREIMAGE_LEN: usize = 86; // 8+1+32+32+1+8+4

#[derive(Error, Debug)]
pub enum EncryptionError {
    #[error("Invalid preimage length: expected {PREIMAGE_LEN}, got {0}")]
    InvalidLength(usize),
    #[error("AEAD operation failed")]
    AeadFailed,
    #[error("HKDF expand failed")]
    HkdfFailed,
}

pub struct EncryptionKeypair {
    pub secret: StaticSecret,
    pub public: PublicKey,
}

pub struct EncryptedNote {
    pub ciphertext: Vec<u8>,
    pub ephemeral_pubkey: [u8; 32],
}

/// Derive X25519 encryption keypair: SHA256(master_secret_bytes || "encryption")
pub fn derive_encryption_keypair(master_secret: &FieldElement) -> EncryptionKeypair {
    let mut h = Sha256::new();
    h.update(field_to_bytes(master_secret));
    h.update(b"encryption");
    let hash: [u8; 32] = h.finalize().into();
    let secret = StaticSecret::from(hash);
    let public = PublicKey::from(&secret);
    EncryptionKeypair { secret, public }
}

/// Serialize: value(8) + asset_type(1) + owner(32) + randomness(32) + denomination(1) + timestamp(8) + leaf_index(4)
pub fn serialize_note_preimage(note: &Note, leaf_index: u32) -> Vec<u8> {
    let mut buf = Vec::with_capacity(PREIMAGE_LEN);
    buf.extend_from_slice(&note.value.to_le_bytes());
    buf.push(note.asset_type as u8);
    buf.extend_from_slice(&field_to_bytes(&note.owner));
    buf.extend_from_slice(&field_to_bytes(&note.randomness));
    buf.push(note.denomination);
    buf.extend_from_slice(&note.timestamp.to_le_bytes());
    buf.extend_from_slice(&leaf_index.to_le_bytes());
    buf
}

/// Deserialize note preimage back to (Note, leaf_index)
pub fn deserialize_note_preimage(bytes: &[u8]) -> Result<(Note, u32), EncryptionError> {
    if bytes.len() != PREIMAGE_LEN {
        return Err(EncryptionError::InvalidLength(bytes.len()));
    }
    Ok((
        Note {
            value: u64::from_le_bytes(bytes[0..8].try_into().unwrap()),
            asset_type: AssetType::from(bytes[8]),
            owner: FieldElement::from_be_bytes_reduce(&bytes[9..41]),
            randomness: FieldElement::from_be_bytes_reduce(&bytes[41..73]),
            denomination: bytes[73],
            timestamp: u64::from_le_bytes(bytes[74..82].try_into().unwrap()),
        },
        u32::from_le_bytes(bytes[82..86].try_into().unwrap()),
    ))
}

/// ECDH shared secret → HKDF-SHA256 → (AES-256-GCM cipher, 12-byte nonce)
fn ecdh_cipher(shared: &[u8; 32]) -> Result<(Aes256Gcm, [u8; 12]), EncryptionError> {
    let hk = Hkdf::<Sha256>::new(None, shared);
    let mut okm = [0u8; 44]; // 32-byte key + 12-byte nonce
    hk.expand(HKDF_INFO, &mut okm).map_err(|_| EncryptionError::HkdfFailed)?;
    let cipher = Aes256Gcm::new_from_slice(&okm[..32]).unwrap();
    let mut nonce = [0u8; 12];
    nonce.copy_from_slice(&okm[32..]);
    Ok((cipher, nonce))
}

/// Encrypt a note for a recipient's X25519 public key
pub fn encrypt_note(
    note: &Note,
    leaf_index: u32,
    recipient_pk: &PublicKey,
) -> Result<EncryptedNote, EncryptionError> {
    let eph_secret = StaticSecret::random_from_rng(rand::rngs::OsRng);
    let eph_public = PublicKey::from(&eph_secret);
    let shared = eph_secret.diffie_hellman(recipient_pk);
    let (cipher, nonce) = ecdh_cipher(shared.as_bytes())?;
    let plaintext = serialize_note_preimage(note, leaf_index);
    let ciphertext = cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext.as_ref())
        .map_err(|_| EncryptionError::AeadFailed)?;
    Ok(EncryptedNote {
        ciphertext,
        ephemeral_pubkey: eph_public.to_bytes(),
    })
}

/// Try to decrypt an encrypted note. Returns None if the key doesn't match.
pub fn try_decrypt_note(
    encrypted: &EncryptedNote,
    our_secret: &StaticSecret,
) -> Option<(Note, u32)> {
    let eph_pk = PublicKey::from(encrypted.ephemeral_pubkey);
    let shared = our_secret.diffie_hellman(&eph_pk);
    let (cipher, nonce) = ecdh_cipher(shared.as_bytes()).ok()?;
    let plaintext = cipher
        .decrypt(Nonce::from_slice(&nonce), encrypted.ciphertext.as_ref())
        .ok()?;
    deserialize_note_preimage(&plaintext).ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::random_field;

    #[test]
    fn test_serialize_roundtrip() {
        let note = Note {
            value: 1_000_000_000,
            asset_type: AssetType::YcSol,
            owner: random_field(),
            randomness: random_field(),
            denomination: 3,
            timestamp: 1_700_000_000,
        };
        let bytes = serialize_note_preimage(&note, 42);
        assert_eq!(bytes.len(), PREIMAGE_LEN);
        let (recovered, idx) = deserialize_note_preimage(&bytes).unwrap();
        assert_eq!(recovered.value, note.value);
        assert_eq!(recovered.asset_type, note.asset_type);
        assert_eq!(recovered.owner, note.owner);
        assert_eq!(recovered.randomness, note.randomness);
        assert_eq!(recovered.denomination, note.denomination);
        assert_eq!(recovered.timestamp, note.timestamp);
        assert_eq!(idx, 42);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let master = random_field();
        let kp = derive_encryption_keypair(&master);
        let note = Note {
            value: 500_000_000,
            asset_type: AssetType::YcSol,
            owner: random_field(),
            randomness: random_field(),
            denomination: 2,
            timestamp: 1_700_000_000,
        };
        let encrypted = encrypt_note(&note, 7, &kp.public).unwrap();
        let (decrypted, idx) = try_decrypt_note(&encrypted, &kp.secret).unwrap();
        assert_eq!(decrypted.value, note.value);
        assert_eq!(decrypted.owner, note.owner);
        assert_eq!(decrypted.randomness, note.randomness);
        assert_eq!(idx, 7);
    }

    #[test]
    fn test_wrong_key_returns_none() {
        let kp1 = derive_encryption_keypair(&random_field());
        let kp2 = derive_encryption_keypair(&random_field());
        let note = Note {
            value: 100,
            asset_type: AssetType::Sol,
            owner: random_field(),
            randomness: random_field(),
            denomination: 0,
            timestamp: 0,
        };
        let encrypted = encrypt_note(&note, 0, &kp1.public).unwrap();
        assert!(try_decrypt_note(&encrypted, &kp2.secret).is_none());
    }
}

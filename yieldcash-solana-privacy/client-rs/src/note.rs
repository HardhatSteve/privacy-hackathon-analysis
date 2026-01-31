//! Note operations with Noir-compatible commitment computation
//!
//! The commitment scheme matches exactly what the Noir circuit uses:
//! ```text
//! value_hash    = hash_2(value, asset_type)
//! time_hash     = hash_2(denomination, timestamp)
//! value_commit  = hash_2(value_hash, time_hash)
//! owner_hash    = hash_2(value_commit, owner)
//! commitment    = hash_2(owner_hash, randomness)
//! ```

use acir::{AcirField, FieldElement};
use crate::crypto::{hash_2, field_to_bytes, CryptoError};
use crate::types::{Note, StoredNote, AssetType};

/// Compute note commitment using the exact same algorithm as the Noir circuit
pub fn compute_commitment(note: &Note) -> Result<FieldElement, CryptoError> {
    let value_hash = hash_2(
        FieldElement::from(note.value),
        FieldElement::from(note.asset_type as u64),
    )?;
    let time_hash = hash_2(
        FieldElement::from(note.denomination as u64),
        FieldElement::from(note.timestamp),
    )?;
    let value_commit = hash_2(value_hash, time_hash)?;
    let owner_hash = hash_2(value_commit, note.owner)?;
    hash_2(owner_hash, note.randomness)
}

/// Create a stored note with commitment
pub fn create_stored_note(
    note: Note,
    leaf_index: u32,
) -> Result<StoredNote, CryptoError> {
    let commitment = field_to_bytes(&compute_commitment(&note)?);
    Ok(StoredNote {
        note,
        commitment,
        leaf_index,
        spent: false,
    })
}

/// Create a dummy (zero-value) note for padding
pub fn create_dummy_note() -> Note {
    Note {
        value: 0,
        asset_type: AssetType::Sol,
        owner: FieldElement::zero(),
        randomness: FieldElement::zero(),
        denomination: 0,
        timestamp: 0,
    }
}

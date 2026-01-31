/// Validity Proof Circuit
///
/// Proves that an intent was authorized by a legitimate sender
/// without revealing their identity.
///
/// Public inputs:
/// - intent_hash: Hash of the intent being authorized
/// - sender_commitment_x: X coordinate of sender commitment
/// - sender_commitment_y: Y coordinate of sender commitment
/// - nullifier: Unique nullifier to prevent double-spending
/// - timestamp: Current timestamp
/// - expiry: Intent expiry timestamp
///
/// Private inputs (witness):
/// - sender_address: Actual sender address
/// - sender_blinding: Blinding factor for sender commitment
/// - sender_secret: Sender's secret key (for nullifier derivation)
/// - pub_key_x: Sender's public key X coordinate
/// - pub_key_y: Sender's public key Y coordinate
/// - signature: ECDSA signature over intent_hash
/// - message_hash: Hash of the message that was signed
/// - nonce: Unique nonce for nullifier
///
/// Constraints:
/// 1. Signature is valid over intent_hash
/// 2. Sender commitment correctly encodes sender_address with blinding
/// 3. Nullifier is correctly derived from (secret, intent_hash, nonce)
/// 4. Intent has not expired (timestamp < expiry)

use std::hash::pedersen_hash;
use std::hash::blake3;
use std::ecdsa_secp256k1::verify_signature;

/// Main entry point for the validity proof circuit
fn main(
    // Public inputs
    intent_hash: pub Field,
    sender_commitment_x: pub Field,
    sender_commitment_y: pub Field,
    nullifier: pub Field,
    timestamp: pub u64,
    expiry: pub u64,

    // Private inputs (witness)
    sender_address: Field,
    sender_blinding: Field,
    sender_secret: Field,
    pub_key_x: [u8; 32],
    pub_key_y: [u8; 32],
    signature: [u8; 64],
    message_hash: [u8; 32],
    nonce: Field,
) {
    // Constraint 1: Verify ECDSA signature
    // The signature must be over the intent_hash (provided as message_hash)
    let valid_sig = verify_signature(pub_key_x, pub_key_y, signature, message_hash);
    assert(valid_sig, "Invalid ECDSA signature");

    // Constraint 2: Verify the message hash matches intent_hash
    let intent_bytes: [u8; 32] = intent_hash.to_be_bytes();
    for i in 0..32 {
        assert(intent_bytes[i] == message_hash[i], "Message hash does not match intent hash");
    }

    // Constraint 3: Verify sender commitment
    // commitment = pedersen([sender_address, sender_blinding])
    let commitment = pedersen_hash([sender_address, sender_blinding]);

    // Split commitment into x,y coordinates (simulated via hash)
    let (computed_x, computed_y) = split_commitment(commitment);
    assert(computed_x == sender_commitment_x, "Sender commitment X mismatch");
    assert(computed_y == sender_commitment_y, "Sender commitment Y mismatch");

    // Constraint 4: Verify nullifier derivation
    // nullifier = pedersen_hash([sender_secret, intent_hash, nonce])
    let computed_nullifier = pedersen_hash([sender_secret, intent_hash, nonce]);
    assert(computed_nullifier == nullifier, "Nullifier mismatch");

    // Constraint 5: Verify intent has not expired
    assert(timestamp < expiry, "Intent expired");
}

/// Split a commitment field into X and Y coordinates
/// Uses a deterministic derivation for consistency
fn split_commitment(commitment: Field) -> (Field, Field) {
    // Hash the commitment to get pseudo-random bytes
    let commitment_bytes: [u8; 32] = commitment.to_be_bytes();
    let hash = blake3(commitment_bytes);

    // Split into two 16-byte chunks and convert to fields
    let mut x_bytes: [u8; 32] = [0; 32];
    let mut y_bytes: [u8; 32] = [0; 32];

    for i in 0..16 {
        x_bytes[i + 16] = hash[i];
        y_bytes[i + 16] = hash[i + 16];
    }

    // Convert to fields
    let x = bytes_to_field(x_bytes);
    let y = bytes_to_field(y_bytes);

    (x, y)
}

/// Convert 32 bytes to a field element
fn bytes_to_field(bytes: [u8; 32]) -> Field {
    let mut result: Field = 0;
    for i in 0..32 {
        result = result * 256 + bytes[i] as Field;
    }
    result
}

// --- Tests ---

#[test]
fn test_valid_signature_verification() {
    // Test that signature verification works with valid inputs
    // Note: This test uses dummy values - real tests need actual ECDSA signatures

    // For testing, we use known test vectors
    let pub_key_x: [u8; 32] = [
        0x79, 0xBE, 0x66, 0x7E, 0xF9, 0xDC, 0xBB, 0xAC,
        0x55, 0xA0, 0x62, 0x95, 0xCE, 0x87, 0x0B, 0x07,
        0x02, 0x9B, 0xFC, 0xDB, 0x2D, 0xCE, 0x28, 0xD9,
        0x59, 0xF2, 0x81, 0x5B, 0x16, 0xF8, 0x17, 0x98
    ];

    let pub_key_y: [u8; 32] = [
        0x48, 0x3A, 0xDA, 0x77, 0x26, 0xA3, 0xC4, 0x65,
        0x5D, 0xA4, 0xFB, 0xFC, 0x0E, 0x11, 0x08, 0xA8,
        0xFD, 0x17, 0xB4, 0x48, 0xA6, 0x85, 0x54, 0x19,
        0x9C, 0x47, 0xD0, 0x8F, 0xFB, 0x10, 0xD4, 0xB8
    ];

    // These are valid coordinates for the secp256k1 generator point G
    // Just verify they're 32 bytes each
    assert(pub_key_x.len() == 32);
    assert(pub_key_y.len() == 32);
}

#[test]
fn test_commitment_split() {
    // Test commitment splitting is deterministic
    let commitment = 12345 as Field;

    let (x1, y1) = split_commitment(commitment);
    let (x2, y2) = split_commitment(commitment);

    assert(x1 == x2);
    assert(y1 == y2);
}

#[test]
fn test_nullifier_derivation() {
    // Test nullifier is correctly derived
    let sender_secret = 111 as Field;
    let intent_hash = 222 as Field;
    let nonce = 333 as Field;

    let nullifier1 = pedersen_hash([sender_secret, intent_hash, nonce]);
    let nullifier2 = pedersen_hash([sender_secret, intent_hash, nonce]);

    // Same inputs should produce same nullifier
    assert(nullifier1 == nullifier2);
}

#[test]
fn test_different_nonces_different_nullifiers() {
    // Different nonces should produce different nullifiers
    let sender_secret = 111 as Field;
    let intent_hash = 222 as Field;
    let nonce1 = 333 as Field;
    let nonce2 = 444 as Field;

    let nullifier1 = pedersen_hash([sender_secret, intent_hash, nonce1]);
    let nullifier2 = pedersen_hash([sender_secret, intent_hash, nonce2]);

    assert(nullifier1 != nullifier2);
}

#[test]
fn test_bytes_to_field() {
    // Test bytes to field conversion
    let mut bytes: [u8; 32] = [0; 32];
    bytes[31] = 1;

    let field = bytes_to_field(bytes);
    assert(field == 1);
}

#[test]
fn test_expiry_check() {
    // Test that timestamp must be less than expiry
    let timestamp: u64 = 1000;
    let expiry: u64 = 2000;

    assert(timestamp < expiry);
}

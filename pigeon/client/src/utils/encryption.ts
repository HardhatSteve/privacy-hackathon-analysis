import { x25519 } from "@noble/curves/ed25519.js";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Encryption utilities for end-to-end encrypted messaging
 * 
 * Architecture:
 * 1. ECDH key agreement using X25519 (Curve25519)
 * 2. HKDF key derivation for per-message encryption keys
 * 3. ChaCha20-Poly1305 AEAD for message encryption
 * 4. Nonce format: timestamp (8 bytes) + counter (4 bytes)
 */

const NONCE_LENGTH = 12; // ChaCha20-Poly1305 standard
const AUTH_TAG_LENGTH = 16; // Poly1305 tag
const INFO_MESSAGE = new TextEncoder().encode("pigeon-message-encryption-v1");

/**
 * Derive shared secret using ECDH
 * Both parties compute the same secret without transmitting it
 * 
 * @param myPrivateKey - My X25519 private key (32 bytes)
 * @param theirPublicKeyBytes - Their X25519 public key (32 bytes) as Uint8Array
 * @returns 32-byte shared secret
 */
export function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKeyBytes: Uint8Array
): Uint8Array {
  // Take first 32 bytes of private key and apply RFC 7748 clamping
  const privateScalar = myPrivateKey.slice(0, 32);
  privateScalar[0] &= 248;
  privateScalar[31] &= 127;
  privateScalar[31] |= 64;

  // Perform X25519 ECDH directly (no Ed25519 conversion needed)
  const sharedSecret = x25519.scalarMult(privateScalar, theirPublicKeyBytes);

  // Apply HKDF to derive a proper symmetric key
  // This ensures we get a uniformly random key suitable for encryption
  const derivedKey = hkdf(sha256, sharedSecret, undefined, INFO_MESSAGE, 32);

  return derivedKey;
}

/**
 * Generate a unique nonce for message encryption
 * Format: timestamp (8 bytes) + counter (4 bytes) = 12 bytes total
 * 
 * @param counter - Message counter to prevent nonce reuse
 * @returns 12-byte nonce
 */
export function generateNonce(counter: number): Uint8Array {
  const nonce = new Uint8Array(NONCE_LENGTH);
  const view = new DataView(nonce.buffer);

  // First 8 bytes: current timestamp in milliseconds
  const timestamp = Date.now();
  view.setBigUint64(0, BigInt(timestamp), false); // Big-endian

  // Last 4 bytes: counter
  view.setUint32(8, counter, false); // Big-endian

  return nonce;
}

/**
 * Encrypt a message using ChaCha20-Poly1305 AEAD
 * 
 * @param plaintext - Message to encrypt
 * @param sharedSecret - Shared secret from ECDH
 * @param nonce - Unique 12-byte nonce
 * @returns Encrypted message (nonce + ciphertext + auth_tag)
 */
export function encryptMessage(
  plaintext: string,
  sharedSecret: Uint8Array,
  nonce: Uint8Array
): Uint8Array {
  if (nonce.length !== NONCE_LENGTH) {
    throw new Error(`Nonce must be ${NONCE_LENGTH} bytes`);
  }

  // Convert plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // Create ChaCha20-Poly1305 cipher
  const cipher = chacha20poly1305(sharedSecret, nonce);

  // Encrypt (returns ciphertext + auth tag appended)
  const encrypted = cipher.encrypt(plaintextBytes);

  // Format: nonce || encrypted (which includes auth tag)
  const result = new Uint8Array(NONCE_LENGTH + encrypted.length);
  result.set(nonce, 0);
  result.set(encrypted, NONCE_LENGTH);

  return result;
}

/**
 * Decrypt a message using ChaCha20-Poly1305 AEAD
 * 
 * @param encryptedData - Encrypted message (nonce + ciphertext + auth_tag)
 * @param sharedSecret - Shared secret from ECDH
 * @returns Decrypted plaintext message
 * @throws Error if authentication fails (message tampered)
 */
export function decryptMessage(
  encryptedData: Uint8Array,
  sharedSecret: Uint8Array
): string {
  if (encryptedData.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted data too short");
  }

  // Extract nonce and ciphertext
  const nonce = encryptedData.slice(0, NONCE_LENGTH);
  const ciphertextWithTag = encryptedData.slice(NONCE_LENGTH);

  // Create ChaCha20-Poly1305 cipher
  const cipher = chacha20poly1305(sharedSecret, nonce);

  try {
    // Decrypt and verify authentication tag
    const decrypted = cipher.decrypt(ciphertextWithTag);

    // Convert bytes to string
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Decryption failed - message may be corrupted or tampered with");
  }
}

/**
 * Convert encrypted data to Base64 for storage/transmission
 */
export function encryptedDataToBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Convert Base64 back to encrypted data
 */
export function base64ToEncryptedData(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Validate that a message can be safely encrypted
 * @param message - Message to validate
 * @param maxLength - Maximum allowed plaintext length
 * @returns true if valid, throws error otherwise
 */
export function validateMessageForEncryption(message: string, maxLength: number = 280): boolean {
  if (!message || message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  if (message.length > maxLength) {
    throw new Error(`Message too long (${message.length}/${maxLength} chars)`);
  }

  // Check if message contains only valid UTF-8
  try {
    new TextEncoder().encode(message);
  } catch {
    throw new Error("Message contains invalid characters");
  }

  return true;
}

/**
 * Estimate encrypted size for a plaintext message
 * Useful for calculating blockchain storage requirements
 */
export function estimateEncryptedSize(plaintextLength: number): number {
  return NONCE_LENGTH + plaintextLength + AUTH_TAG_LENGTH;
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Securely clear sensitive data from memory
   * Note: JavaScript doesn't provide guaranteed memory wiping,
   * but this is best effort
   */
  clearSensitiveData(data: Uint8Array): void {
    data.fill(0);
  },

  /**
   * Check if we're in a secure context (HTTPS or localhost)
   */
  isSecureContext(): boolean {
    return window.isSecureContext;
  },

  /**
   * Warn if running in insecure context
   */
  checkSecureContext(): void {
    if (!SecurityUtils.isSecureContext()) {
      console.warn(
        "⚠️ SECURITY WARNING: Running in insecure context. " +
        "Encryption requires HTTPS in production."
      );
    }
  }
};

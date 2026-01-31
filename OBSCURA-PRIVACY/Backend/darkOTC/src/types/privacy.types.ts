/**
 * Privacy Types and Cryptographic Primitives
 * 
 * Types for privacy-preserving operations including stealth addresses,
 * Pedersen commitments, nullifiers, and encryption.
 */

import { z } from 'zod';
import {
  StealthAddress,
  PedersenCommitment,
  Nullifier,
  NullifierHash,
  EncryptedContent,
  WOTSPublicKey,
  PedersenCommitmentSchema,
  EncryptedContentSchema,
} from './common.types';

/**
 * Stealth Address Pair
 * 
 * Generated stealth address with its corresponding private key.
 * Requirement 1.2: Generate stealth address for taker
 */
export interface StealthAddressPair {
  /** One-time stealth address (public) */
  address: StealthAddress;
  
  /** Private key for the stealth address (secret) */
  privateKey: string;
  
  /** Ephemeral public key used in generation */
  ephemeralPublicKey: string;
}

/**
 * Pedersen Commitment Data
 * 
 * Commitment with its blinding factor for verification.
 * Requirements 1.3, 2.4: Create Pedersen commitment to hide amounts/prices
 */
export interface PedersenCommitmentData {
  /** The commitment value (public) */
  commitment: PedersenCommitment;
  
  /** The committed value (secret) */
  value: bigint;
  
  /** The blinding factor (secret) */
  blinding: bigint;
}

/**
 * Nullifier Data
 * 
 * Nullifier with its hash for double-spend protection.
 * Requirement 3.4: Generate nullifier to prevent double-acceptance
 */
export interface NullifierData {
  /** The nullifier (secret, only taker knows) */
  nullifier: Nullifier;
  
  /** The nullifier hash (public, prevents double-spending) */
  nullifierHash: NullifierHash;
}

/**
 * Encrypted Message Data
 * 
 * Encrypted message with metadata for decryption.
 * Requirement 26.3: Encrypt message using recipient's stealth address
 */
export interface EncryptedMessageData {
  /** Encrypted content (base64 encoded) */
  encryptedContent: EncryptedContent;
  
  /** Recipient's stealth address */
  recipientStealthAddress: StealthAddress;
  
  /** Ephemeral public key used for encryption */
  ephemeralPublicKey: string;
  
  /** Initialization vector (IV) for encryption */
  iv: string;
  
  /** Authentication tag (for AEAD encryption) */
  authTag?: string;
}

/**
 * Decrypted Message Data
 * 
 * Decrypted message content.
 * Requirement 26.6: Decrypt message using user's private key
 */
export interface DecryptedMessageData {
  /** Decrypted message content (plaintext) */
  content: string;
  
  /** Sender's public key (for verification) */
  senderPublicKey: WOTSPublicKey;
}

/**
 * Commitment Verification Request
 * 
 * Request to verify a Pedersen commitment.
 */
export interface CommitmentVerificationRequest {
  /** The commitment to verify */
  commitment: PedersenCommitment;
  
  /** The claimed value */
  value: bigint;
  
  /** The blinding factor */
  blinding: bigint;
}

/**
 * Commitment Verification Response
 * 
 * Result of commitment verification.
 */
export interface CommitmentVerificationResponse {
  /** Whether the commitment is valid */
  isValid: boolean;
  
  /** The commitment that was verified */
  commitment: PedersenCommitment;
}

/**
 * Encryption Parameters
 * 
 * Parameters for message encryption.
 */
export interface EncryptionParameters {
  /** Recipient's public key or stealth address */
  recipientKey: string;
  
  /** Message to encrypt */
  message: string;
  
  /** Optional: Encryption algorithm (default: ECIES) */
  algorithm?: 'ECIES' | 'AES-256-GCM';
}

/**
 * Decryption Parameters
 * 
 * Parameters for message decryption.
 */
export interface DecryptionParameters {
  /** Encrypted content */
  encryptedContent: EncryptedContent;
  
  /** Private key for decryption */
  privateKey: string;
  
  /** Optional: Ephemeral public key (for ECIES) */
  ephemeralPublicKey?: string;
  
  /** Optional: IV (for AES) */
  iv?: string;
  
  /** Optional: Auth tag (for AEAD) */
  authTag?: string;
}

/**
 * Cryptographic Key Pair
 * 
 * Generic key pair for cryptographic operations.
 */
export interface CryptoKeyPair {
  /** Public key (hex encoded) */
  publicKey: string;
  
  /** Private key (hex encoded) */
  privateKey: string;
}

/**
 * Elliptic Curve Point
 * 
 * Point on an elliptic curve (for Pedersen commitments).
 */
export interface ECPoint {
  /** X coordinate (hex encoded) */
  x: string;
  
  /** Y coordinate (hex encoded) */
  y: string;
}

/**
 * Pedersen Commitment Parameters
 * 
 * Parameters for creating a Pedersen commitment.
 */
export interface PedersenCommitmentParameters {
  /** Value to commit (as bigint) */
  value: bigint;
  
  /** Optional: Blinding factor (generated if not provided) */
  blinding?: bigint;
  
  /** Optional: Generator point G */
  generatorG?: ECPoint;
  
  /** Optional: Generator point H */
  generatorH?: ECPoint;
}

// Zod Validation Schemas

/**
 * Commitment Verification validation schema
 */
export const CommitmentVerificationSchema = z.object({
  commitment: PedersenCommitmentSchema,
  value: z.string().regex(/^\d+$/, 'Value must be a positive integer string'),
  blinding: z.string().regex(/^\d+$/, 'Blinding must be a positive integer string'),
});

/**
 * Encryption Parameters validation schema
 */
export const EncryptionParametersSchema = z.object({
  recipientKey: z.string().min(32, 'Recipient key must be at least 32 characters'),
  message: z.string().min(1, 'Message cannot be empty'),
  algorithm: z.enum(['ECIES', 'AES-256-GCM']).optional(),
});

/**
 * Decryption Parameters validation schema
 */
export const DecryptionParametersSchema = z.object({
  encryptedContent: EncryptedContentSchema,
  privateKey: z.string().min(32, 'Private key must be at least 32 characters'),
  ephemeralPublicKey: z.string().optional(),
  iv: z.string().optional(),
  authTag: z.string().optional(),
});

/**
 * Type inference from Zod schemas
 */
export type CommitmentVerificationInput = z.infer<typeof CommitmentVerificationSchema>;
export type EncryptionParametersInput = z.infer<typeof EncryptionParametersSchema>;
export type DecryptionParametersInput = z.infer<typeof DecryptionParametersSchema>;

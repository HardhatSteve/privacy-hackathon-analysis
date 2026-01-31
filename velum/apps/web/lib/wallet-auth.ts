import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Wallet Authentication Utilities
 *
 * Server-side verification of Solana wallet signatures.
 * Used to prove wallet ownership without requiring a blockchain transaction.
 */

/**
 * Verify that a Solana wallet signature is valid for the given message.
 *
 * @param walletAddress - The base58-encoded wallet public key
 * @param signature - The base58-encoded ed25519 signature
 * @param message - The original message that was signed
 * @returns true if the signature is valid, false otherwise
 */
export function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    // Validate wallet address is a valid public key
    const publicKey = new PublicKey(walletAddress);
    if (!PublicKey.isOnCurve(publicKey.toBytes())) {
      return false;
    }

    // Decode base58 signature
    const signatureBytes = bs58.decode(signature);

    // Signatures must be 64 bytes for ed25519
    if (signatureBytes.length !== 64) {
      return false;
    }

    // Encode message as UTF-8 bytes (same as wallet adapter does)
    const messageBytes = new TextEncoder().encode(message);

    // Verify using nacl ed25519
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

/**
 * Validate that a timestamp is recent (within max age) to prevent replay attacks.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns true if timestamp is valid, false otherwise
 */
export function isValidTimestamp(
  timestamp: number,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  const now = Date.now();
  // Allow 30s future for clock skew
  return timestamp > now - maxAgeMs && timestamp <= now + 30000;
}

/**
 * Generate a nonce for signing messages to prevent replay attacks.
 * Uses crypto.randomUUID() for uniqueness.
 */
export function generateNonce(): string {
  return crypto.randomUUID();
}

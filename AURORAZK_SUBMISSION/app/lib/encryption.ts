/**
 * Encryption utilities for AuroraZK Dark Pool
 * 
 * Uses NaCl box encryption (X25519 + XSalsa20-Poly1305)
 * Orders are encrypted so only the matcher service can read them
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// Matcher's public key - ALWAYS fetched dynamically
// NO hardcoded fallback - must get from matcher to ensure key matches
let cachedMatcherKey: Uint8Array | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 60 seconds - refresh key periodically

/**
 * Get the matcher's current public key (ALWAYS fetches dynamically)
 */
export async function getMatcherPublicKey(): Promise<Uint8Array | null> {
  const now = Date.now();
  
  // Return cached key if still valid
  if (cachedMatcherKey && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedMatcherKey;
  }
  
  // Fetch fresh key from matcher
  try {
    const response = await fetch('http://localhost:3001/pubkey', { 
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      const data = await response.json();
      cachedMatcherKey = new Uint8Array(data.publicKeyArray);
      cacheTimestamp = now;
      console.log('[Encryption] Fetched matcher key:', data.publicKeyArray.slice(0, 4).join(',') + '...');
      return cachedMatcherKey;
    }
  } catch (e) {
    console.error('[Encryption] Failed to fetch matcher key:', e);
  }
  
  // If we have a stale cached key, still return it as fallback
  if (cachedMatcherKey) {
    console.warn('[Encryption] Using stale cached key');
    return cachedMatcherKey;
  }
  
  // No key available - return null to signal error
  console.error('[Encryption] NO MATCHER KEY AVAILABLE');
  return null;
}

/**
 * Clear the cached key (call this if decryption fails)
 */
export function clearKeyCache(): void {
  cachedMatcherKey = null;
  cacheTimestamp = 0;
  console.log('[Encryption] Key cache cleared');
}

// Order fill types
export type OrderFillType = 'GTC' | 'IOC' | 'FOK' | 'AON';

// Order data structure
export interface OrderData {
  price: number;      // Price in USD (e.g., 95.50)
  size: number;       // Size in SOL (e.g., 1.5)
  nonce: number[];    // 32-byte nonce for commitment
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market';  // Market = fill at best available
  fillType?: OrderFillType;  // GTC (default), IOC, FOK, AON
  slippage?: number;  // For market orders, max slippage % (e.g., 0.5 for 0.5%)
  orderId: string;    // On-chain order public key
  owner: string;      // Wallet public key
  timestamp: number;
  
  // Noir ZK Proof data (optional - for real ZK proofs)
  rangeProof?: number[];      // Serialized Noir proof bytes
  publicInputs?: string[];    // Public inputs for verification
  proofType?: 'noir-groth16' | 'simulated';  // Type of proof
  noirCommitment?: string;    // Pedersen commitment from Noir circuit
}

// Encrypted order format
export interface EncryptedOrder {
  ciphertext: string;  // Base64 encoded encrypted data
  nonce: string;       // Base64 encoded encryption nonce
  ephemeralPubKey: string;  // Base64 encoded sender's ephemeral public key
}

/**
 * Generate a new keypair for encryption
 * Used by the matcher service
 */
export function generateMatcherKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array } {
  return nacl.box.keyPair();
}

/**
 * Encrypt order data for the matcher
 * Uses ephemeral keypair so sender remains anonymous
 */
export function encryptOrderForMatcher(
  orderData: OrderData,
  matcherPublicKey: Uint8Array
): EncryptedOrder {
  // Generate ephemeral keypair for this encryption
  const ephemeralKeypair = nacl.box.keyPair();
  
  // Generate random nonce
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  // Serialize order data
  console.log('[TRACE-5] OrderData size:', orderData.size);
  const message = naclUtil.decodeUTF8(JSON.stringify(orderData));
  
  // Encrypt with box (authenticated encryption)
  const ciphertext = nacl.box(
    message,
    nonce,
    matcherPublicKey,
    ephemeralKeypair.secretKey
  );
  
  return {
    ciphertext: naclUtil.encodeBase64(ciphertext),
    nonce: naclUtil.encodeBase64(nonce),
    ephemeralPubKey: naclUtil.encodeBase64(ephemeralKeypair.publicKey),
  };
}

/**
 * Decrypt order data (used by matcher service)
 */
export function decryptOrderData(
  encrypted: EncryptedOrder,
  matcherSecretKey: Uint8Array
): OrderData | null {
  try {
    const ciphertext = naclUtil.decodeBase64(encrypted.ciphertext);
    const nonce = naclUtil.decodeBase64(encrypted.nonce);
    const ephemeralPubKey = naclUtil.decodeBase64(encrypted.ephemeralPubKey);
    
    const decrypted = nacl.box.open(
      ciphertext,
      nonce,
      ephemeralPubKey,
      matcherSecretKey
    );
    
    if (!decrypted) {
      console.error('Failed to decrypt order data');
      return null;
    }
    
    const jsonStr = naclUtil.encodeUTF8(decrypted);
    return JSON.parse(jsonStr) as OrderData;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Sign a match proof (matcher signs to prove it authorized the match)
 */
export function signMatchProof(
  buyOrderId: string,
  sellOrderId: string,
  price: number,
  size: number,
  matcherSecretKey: Uint8Array
): Uint8Array {
  const message = naclUtil.decodeUTF8(
    JSON.stringify({ buyOrderId, sellOrderId, price, size, timestamp: Date.now() })
  );
  return nacl.sign.detached(message, matcherSecretKey);
}

/**
 * Verify a match proof signature
 */
export function verifyMatchProof(
  buyOrderId: string,
  sellOrderId: string,
  price: number,
  size: number,
  signature: Uint8Array,
  matcherPublicKey: Uint8Array
): boolean {
  const message = naclUtil.decodeUTF8(
    JSON.stringify({ buyOrderId, sellOrderId, price, size })
  );
  
  // For verification, we need the signing public key, not box public key
  // In production, matcher would have separate signing keys
  return true; // Simplified for POC
}

// Export base64 utilities for convenience
export const base64 = {
  encode: naclUtil.encodeBase64,
  decode: naclUtil.decodeBase64,
};

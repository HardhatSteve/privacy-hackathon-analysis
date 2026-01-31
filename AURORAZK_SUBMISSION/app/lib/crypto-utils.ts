/**
 * AuroraZK Crypto Utilities
 * 
 * Cryptographic functions for order commitments and hashing.
 * Replaces ShadowWire functions with local implementations.
 */

/**
 * Generate a random nonce for order privacy (returns bigint)
 */
export function generateNonce(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let nonce = 0n;
  for (let i = 0; i < 32; i++) {
    nonce = (nonce << 8n) | BigInt(bytes[i]);
  }
  // Limit to ~64 bits to avoid field overflow issues
  return nonce & ((1n << 64n) - 1n);
}

/**
 * Generate a random nonce as Uint8Array (for ZK proofs)
 */
export function generateNonceBytes(length: number = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Create a commitment hash for an order
 * Uses Web Crypto SHA-256
 * 
 * MUST match on-chain compute_commitment() in lib.rs:
 *   hasher.update(price.to_le_bytes());  // u64 little-endian
 *   hasher.update(size.to_le_bytes());   // u64 little-endian
 *   hasher.update(nonce);                // raw 32 bytes
 * 
 * @param price - Order price (u64)
 * @param size - Order size (u64)
 * @param nonce - Random nonce (bigint that will be converted to 32 bytes little-endian)
 * @returns Commitment hash as Uint8Array
 */
export async function createCommitment(
  price: number | bigint,
  size: number | bigint,
  nonce: number | bigint
): Promise<Uint8Array> {
  // Convert price and size to 8-byte little-endian (matches Rust u64.to_le_bytes())
  const priceBytes = bigIntToBytes(BigInt(price), 8);
  const sizeBytes = bigIntToBytes(BigInt(size), 8);
  // Convert nonce to 32-byte little-endian (matches on-chain expectation)
  const nonceBytes = bigIntToBytes(BigInt(nonce), 32);
  
  // Concatenate: price || size || nonce (same order as on-chain)
  const data = new Uint8Array(8 + 8 + 32); // 48 bytes total
  data.set(priceBytes, 0);
  data.set(sizeBytes, 8);
  data.set(nonceBytes, 16);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Create commitment with raw nonce bytes (preferred method)
 * Use this when you have the nonce as Uint8Array
 */
export async function createCommitmentFromBytes(
  price: number | bigint,
  size: number | bigint,
  nonceBytes: Uint8Array
): Promise<Uint8Array> {
  if (nonceBytes.length !== 32) {
    throw new Error('Nonce must be exactly 32 bytes');
  }
  
  // Convert price and size to 8-byte little-endian
  const priceBytes = bigIntToBytes(BigInt(price), 8);
  const sizeBytes = bigIntToBytes(BigInt(size), 8);
  
  // Concatenate: price || size || nonce
  const data = new Uint8Array(8 + 8 + 32);
  data.set(priceBytes, 0);
  data.set(sizeBytes, 8);
  data.set(nonceBytes, 16);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Create commitment synchronously (for compatibility)
 */
export function createCommitmentSync(
  price: number | bigint,
  size: number | bigint,
  nonce: number | bigint
): Uint8Array {
  // Simple hash combining for sync version
  // For production, use proper hash
  const data = `${price.toString()}-${size.toString()}-${nonce.toString()}`;
  return stringToBytes(data);
}

/**
 * SHA-256 hash function
 */
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  // @ts-ignore - TypeScript version compatibility issue with BufferSource
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(hashBuffer);
}

/**
 * Synchronous hash (simpler, for non-critical use)
 */
export function hashSync(data: string): string {
  // Simple hash for local use
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Convert BigInt to bytes (LITTLE-ENDIAN to match Solana on-chain program)
 * CRITICAL: Must match lib.rs compute_commitment() which uses to_le_bytes()
 */
function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let remaining = value;
  // LITTLE-ENDIAN: least significant byte first
  for (let i = 0; i < length; i++) {
    bytes[i] = Number(remaining & 0xFFn);
    remaining = remaining >> 8n;
  }
  return bytes;
}

/**
 * Convert string to bytes
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Compare two byte arrays for equality
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

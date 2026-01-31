/**
 * Validation Utilities
 * Common validation functions
 */

/**
 * Validate a Solana wallet address (base58, 32-44 chars)
 */
export function isValidSolanaAddress(address: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate an EVM address (0x-prefixed, 40 hex chars)
 */
export function isValidEvmAddress(address: string): boolean {
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmRegex.test(address);
}

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a handle (3-20 chars, lowercase letters, numbers, underscores)
 */
export function isValidHandle(handle: string): boolean {
  const handleRegex = /^[a-z0-9_]{3,20}$/;
  return handleRegex.test(handle);
}

/**
 * Validate a hex string (0x-prefixed)
 */
export function isValidHexString(value: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(value);
}

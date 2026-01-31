/**
 * Normalization Utilities
 * String normalization functions
 */

/**
 * Normalize an email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize a handle (lowercase, trim)
 */
export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

/**
 * Normalize a search query (lowercase, trim)
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Ensure a hex string is properly prefixed
 */
export function ensureHexPrefix(value: string): `0x${string}` {
  if (value.startsWith('0x')) {
    return value as `0x${string}`;
  }
  return `0x${value}`;
}

/**
 * Remove hex prefix if present
 */
export function removeHexPrefix(value: string): string {
  if (value.startsWith('0x')) {
    return value.slice(2);
  }
  return value;
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Shorten a Solana address for display
 * @param address - The full Solana address
 * @param startChars - Number of characters to show at the start (default: 4)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @returns Shortened address (e.g., "AbCd...XyZ1")
 */
export function shortenAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format a Solana address for display
 * @param address - The full Solana address
 * @returns Formatted address with ellipsis in the middle
 */
export function formatAddress(address: string): string {
  if (!address) return ""
  if (address.length <= 12) return address
  return shortenAddress(address, 6, 6)
}

/**
 * Validate if a string is a valid Solana address
 * Solana addresses are base58 encoded and typically 32-44 characters long
 * @param address - The address to validate
 * @returns true if the address appears to be a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false
  }

  // Remove whitespace
  const trimmed = address.trim()

  // Basic length check (Solana addresses are typically 32-44 chars)
  if (trimmed.length < 32 || trimmed.length > 44) {
    return false
  }

  // Check if it's base58 encoded (no 0, O, I, l characters)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
  if (!base58Regex.test(trimmed)) {
    return false
  }

  return true
}

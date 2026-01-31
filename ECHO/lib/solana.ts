import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Validates a Solana wallet address
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Check if the string is 32-44 characters (typical base58 range)
    if (address.length < 32 || address.length > 44) {
      return false;
    }

    // Try to decode as base58 and create a PublicKey
    const decoded = bs58.decode(address);
    if (decoded.length !== 32) {
      return false;
    }

    // Verify it can be constructed as a PublicKey
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncates a Solana address for display
 * @param address - The full address
 * @param chars - Number of characters to show on each side
 * @returns Truncated address like "8xR7...g3Ks"
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format SOL amount with appropriate decimals
export function formatSOL(lamports: number, decimals: number = 4): string {
  const sol = lamports / 1e9;
  return sol.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Format USD price
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Truncate public key for display
export function truncatePubkey(pubkey: string, chars: number = 4): string {
  if (pubkey.length <= chars * 2) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

// Convert basis points to percentage
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate random hex string
export function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Uint8Array to hex string
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
export function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array();
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

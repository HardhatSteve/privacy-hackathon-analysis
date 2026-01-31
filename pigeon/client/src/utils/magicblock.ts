import { PublicKey, Connection } from "@solana/web3.js";

/**
 * MagicBlock Private Ephemeral Rollups Configuration
 * 
 * Note: Private SPL Token API is currently under testing.
 * This module provides the foundation for private transfers
 * once the API is publicly available.
 */

// TEE Endpoint - for authenticated private state access
export const TEE_ENDPOINT = "https://tee.magicblock.app";

// Ephemeral Rollup validators
export const VALIDATORS = {
  TEE: new PublicKey("FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA"),
  ASIA: new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57"),
  EU: new PublicKey("MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e"),
  US: new PublicKey("MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd"),
} as const;

// Access control program (for permission groups)
export const ACCESS_CONTROL_PROGRAM = new PublicKey("ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1");

// Delegation program 
export const DELEGATION_PROGRAM = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

// Check if private transfers are available
// TODO: Update when MagicBlock Private SPL Token API is publicly available
export const isPrivateTransfersAvailable = (): boolean => {
  return false; // Currently under testing
};

// Get appropriate connection for transfers
export const getTransferConnection = (): { connection: Connection; isPrivate: boolean } => {
  // For now, use standard Solana connection
  // Will upgrade to TEE endpoint when private transfers are available
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  return {
    connection,
    isPrivate: false,
  };
};

// Tip amount presets in SOL
export const TIP_PRESETS = [
  { label: "0.01 SOL", lamports: 0.01 * 1e9 },
  { label: "0.05 SOL", lamports: 0.05 * 1e9 },
  { label: "0.1 SOL", lamports: 0.1 * 1e9 },
] as const;

// Convert lamports to SOL string
export const lamportsToSol = (lamports: number): string => {
  return (lamports / 1e9).toFixed(4);
};

// Convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1e9);
};

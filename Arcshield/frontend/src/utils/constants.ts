import { PublicKey } from '@solana/web3.js';

// Program ID - Update this after deploying your program
export const PROGRAM_ID = new PublicKey('ArcShield1111111111111111111111111111111');

// Arcium cluster configuration
export const ARCIUM_CLUSTER = 'devnet'; // or 'localnet' for local development

// RPC endpoint - can be overridden via environment variable
export const RPC_ENDPOINT = process.env.REACT_APP_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Transaction status polling interval (ms)
export const POLL_INTERVAL = 2000;

// Default slippage tolerance (basis points, e.g., 100 = 1%)
export const DEFAULT_SLIPPAGE_BPS = 100;

// Default interest rate for lending (basis points, e.g., 500 = 5%)
export const DEFAULT_INTEREST_RATE_BPS = 500;

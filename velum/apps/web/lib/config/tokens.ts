/**
 * Centralized token configuration for Privacy Paylink
 * Reads mint addresses from environment variables configured in Vercel
 *
 * REQUIRED env vars (must be set in both production and development):
 * - NEXT_PUBLIC_SOL_MINT
 * - NEXT_PUBLIC_USDC_MINT
 * - NEXT_PUBLIC_USDT_MINT
 *
 * IMPORTANT: Next.js requires STATIC access to process.env.NEXT_PUBLIC_* variables
 * for build-time inlining. Dynamic access (process.env[varName]) will NOT work.
 */

export interface SupportedToken {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
}

/**
 * Static access to env vars - Next.js inlines these at build time
 * DO NOT refactor to use dynamic access (process.env[name]) - it will break!
 */
const ENV_SOL_MINT = process.env.NEXT_PUBLIC_SOL_MINT;
const ENV_USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
const ENV_USDT_MINT = process.env.NEXT_PUBLIC_USDT_MINT;

// Validate at module load - fails fast if env vars are missing
if (!ENV_SOL_MINT || !ENV_USDC_MINT || !ENV_USDT_MINT) {
  const missing = [
    !ENV_SOL_MINT && "NEXT_PUBLIC_SOL_MINT",
    !ENV_USDC_MINT && "NEXT_PUBLIC_USDC_MINT",
    !ENV_USDT_MINT && "NEXT_PUBLIC_USDT_MINT",
  ].filter(Boolean);
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
      `Please set in your .env file or Vercel environment variables.`
  );
}

/**
 * Array of supported tokens for deposits and withdrawals
 * All mint addresses are configured via environment variables
 */
export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "SOL",
    name: "Solana",
    mintAddress: ENV_SOL_MINT,
    decimals: 9,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    mintAddress: ENV_USDC_MINT,
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    mintAddress: ENV_USDT_MINT,
    decimals: 6,
  },
];

/**
 * Common decimal constants for token conversions
 */
export const TOKEN_DECIMALS = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  ANY: 6, // Default for "ANY" token type
} as const;

/**
 * Multipliers for converting between base units and display units
 */
export const TOKEN_MULTIPLIERS = {
  SOL: 1e9,
  USDC: 1e6,
  USDT: 1e6,
  ANY: 1e6,
} as const;

/**
 * Get decimals for a token symbol
 */
export function getTokenDecimals(symbol: string): number {
  const token = SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
  return token?.decimals ?? TOKEN_DECIMALS.ANY;
}

/**
 * Convert base units to display units
 */
export function toDisplayAmount(baseUnits: bigint | number, symbol: string): number {
  const decimals = getTokenDecimals(symbol);
  return Number(baseUnits) / Math.pow(10, decimals);
}

/**
 * Convert display units to base units
 */
export function toBaseUnits(displayAmount: number, symbol: string): bigint {
  const decimals = getTokenDecimals(symbol);
  return BigInt(Math.floor(displayAmount * Math.pow(10, decimals)));
}

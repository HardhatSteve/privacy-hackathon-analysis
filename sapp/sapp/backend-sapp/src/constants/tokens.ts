/**
 * Token Constants
 * Token addresses and metadata
 */

// Solana token addresses
export const SOLANA_TOKENS = {
  // Native
  SOL: 'So11111111111111111111111111111111111111112',

  // Stablecoins
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',

  // Liquid staking
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  STSOL: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
  BSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',

  // Meme/other
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
} as const;

// Ethereum token addresses
export const ETHEREUM_TOKENS = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
} as const;

// Avalanche token addresses
export const AVALANCHE_TOKENS = {
  USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
  WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
} as const;

// Token metadata
export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

export const TOKEN_METADATA: Record<string, TokenMetadata> = {
  // Solana
  [SOLANA_TOKENS.SOL]: { symbol: 'SOL', name: 'Solana', decimals: 9 },
  [SOLANA_TOKENS.USDC]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  [SOLANA_TOKENS.USDT]: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  [SOLANA_TOKENS.MSOL]: { symbol: 'mSOL', name: 'Marinade Staked SOL', decimals: 9 },
  [SOLANA_TOKENS.JITOSOL]: { symbol: 'JitoSOL', name: 'Jito Staked SOL', decimals: 9 },
  [SOLANA_TOKENS.STSOL]: { symbol: 'stSOL', name: 'Lido Staked SOL', decimals: 9 },
  [SOLANA_TOKENS.BSOL]: { symbol: 'bSOL', name: 'BlazeStake Staked SOL', decimals: 9 },
  [SOLANA_TOKENS.BONK]: { symbol: 'BONK', name: 'Bonk', decimals: 5 },
  [SOLANA_TOKENS.JUP]: { symbol: 'JUP', name: 'Jupiter', decimals: 6 },

  // Ethereum
  [ETHEREUM_TOKENS.USDC]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  [ETHEREUM_TOKENS.USDT]: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  [ETHEREUM_TOKENS.WETH]: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },

  // Avalanche
  [AVALANCHE_TOKENS.USDC]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  [AVALANCHE_TOKENS.USDT]: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  [AVALANCHE_TOKENS.WAVAX]: { symbol: 'WAVAX', name: 'Wrapped AVAX', decimals: 18 },
};

/**
 * Get token metadata by address
 */
export function getTokenMetadata(address: string): TokenMetadata {
  return TOKEN_METADATA[address] || {
    symbol: address.slice(0, 4) + '...',
    name: 'Unknown Token',
    decimals: 9,
  };
}

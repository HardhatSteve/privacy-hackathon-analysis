/**
 * Chain Constants
 * Chain IDs and network configuration
 */

// EVM Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  AVALANCHE: 43114,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
} as const;

// Solana Chain IDs (for cross-chain protocols)
export const SOLANA_CHAIN_IDS = {
  MAINNET: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  DEVNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
} as const;

// Supported chains for swaps
export const SUPPORTED_CHAINS = ['solana', 'ethereum', 'avalanche'] as const;
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

// Chain display names
export const CHAIN_NAMES: Record<string, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  avalanche: 'Avalanche',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
};

// RPC endpoints (defaults)
export const DEFAULT_RPC_URLS = {
  SOLANA_MAINNET: 'https://api.mainnet-beta.solana.com',
  SOLANA_DEVNET: 'https://api.devnet.solana.com',
  ETHEREUM_MAINNET: 'https://eth.llamarpc.com',
  AVALANCHE_MAINNET: 'https://api.avax.network/ext/bc/C/rpc',
};

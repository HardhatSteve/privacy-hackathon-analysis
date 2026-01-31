import { PublicKey } from '@solana/web3.js';

// Program IDs
export const AURORAZK_PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');

// Noir ZK Verifier Program (deployed via Sunspot)
export const NOIR_VERIFIER_PROGRAM_ID = new PublicKey('Ef8SgV5RCp4e7g3tKKQHwvpYcPoGXqZkoTTVTrhnG2MZ');

// Token Mints
export const TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: null, // Native SOL, no mint
    decimals: 9,
    logoURI: '/tokens/sol.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    // Our mock USDC for testing - replace with Circle's devnet USDC for production testing
    mint: new PublicKey('6QMo13mtRuUhcRtFReCKUfuNd5GVkdAg9oz2tNGzaufy'),
    decimals: 6,
    logoURI: '/tokens/usdc.svg',
  },
  // Circle's official devnet USDC (alternative)
  USDC_CIRCLE: {
    symbol: 'USDC',
    name: 'USD Coin (Circle)',
    mint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
    decimals: 6,
    logoURI: '/tokens/usdc.svg',
  },
} as const;

// Trading Pairs
export const TRADING_PAIRS = [
  {
    id: 'SOL/USDC',
    base: TOKENS.SOL,
    quote: TOKENS.USDC,
    minOrderSize: 0.01, // 0.01 SOL minimum
    tickSize: 0.01, // $0.01 price increments
  },
] as const;

// Network Configuration
export const NETWORK = {
  devnet: {
    rpcEndpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
    cluster: 'devnet' as const,
  },
  mainnet: {
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    cluster: 'mainnet-beta' as const,
  },
} as const;

// Default to devnet for development
export const ACTIVE_NETWORK = NETWORK.devnet;

// Explorer URLs - Using Solscan for better UX
export const EXPLORER = {
  // Get transaction URL
  tx: (signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet') => 
    `https://solscan.io/tx/${signature}${cluster === 'devnet' ? '?cluster=devnet' : ''}`,
  
  // Get account/address URL
  address: (address: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet') => 
    `https://solscan.io/account/${address}${cluster === 'devnet' ? '?cluster=devnet' : ''}`,
  
  // Get token URL
  token: (mint: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet') => 
    `https://solscan.io/token/${mint}${cluster === 'devnet' ? '?cluster=devnet' : ''}`,
};

// Order Configuration
export const ORDER_CONFIG = {
  defaultExpiration: 48 * 60 * 60, // 48 hours in seconds
  maxRangeProofSize: 256, // bytes
} as const;

// ZK Range Proof Configuration
export const ZK_RANGES = {
  price: {
    min: 1_000_000n,        // $1.00 USDC (6 decimals)
    max: 10_000_000_000n,   // $10,000.00 USDC
  },
  size: {
    min: 10_000_000n,       // 0.01 SOL (9 decimals)
    max: 1_000_000_000_000n, // 1000 SOL
  },
} as const;

// ZK Proof Configuration (full config)
export const ZK_PROOF_CONFIG = {
  enabled: true,
  verifierProgramId: 'Ef8SgV5RCp4e7g3tKKQHwvpYcPoGXqZkoTTVTrhnG2MZ',
  priceRange: ZK_RANGES.price,
  sizeRange: ZK_RANGES.size,
} as const;

// Light Protocol Configuration
// Helius supports Light Protocol compression on devnet
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
const HELIUS_RPC = HELIUS_API_KEY 
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.devnet.solana.com';

export const LIGHT_PROTOCOL_CONFIG = {
  enabled: true,
  // Helius RPC with compression support
  rpcEndpoint: HELIUS_RPC,
  compressionEndpoint: HELIUS_RPC,
  // Light Protocol programs on devnet
  systemProgram: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq',
  compressedTokenProgram: 'cTokenmWW8bLPjZEBAUgYy3zKxQZW6VKi7bqNFEVv3m',
  accountCompressionProgram: 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq',
  registryProgram: 'Lighton6oQpVkeewmo2mcPTQQp7kYHr4fWpAgJyEmDX',
} as const;

// Fee Configuration - DISABLED for hackathon demo
export const FEE_CONFIG = {
  // All fees set to 0 for hackathon
  marketOrderFeeBps: 0,
  limitOrderFeeBps: 0,
  treasuryWallet: null as any,
  getFeeBps: (_orderType?: 'limit' | 'market') => 0,
  getFeePercent: (_orderType?: 'limit' | 'market') => 0,
  calculateFee: (_amount?: number, _orderType?: 'limit' | 'market') => 0,
} as const;

// Formatting helpers
export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toFixed(decimals > 6 ? 6 : decimals);
}

export function parseTokenAmount(amount: string, decimals: number): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

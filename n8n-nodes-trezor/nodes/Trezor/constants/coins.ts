/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface CoinInfo {
  name: string;
  shortcut: string;
  slip44: number;
  segwit: boolean;
  decimals: number;
  explorerUrl?: string;
  testnet?: boolean;
  supportedModels: string[];
}

export interface EvmChainInfo {
  name: string;
  shortcut: string;
  chainId: number;
  slip44: number;
  decimals: number;
  rpcUrl?: string;
  explorerUrl?: string;
  supportedModels: string[];
  isL2?: boolean;
  nativeToken?: string;
}

export const SLIP44_COIN_TYPES: Record<string, number> = {
  bitcoin: 0,
  btc: 0,
  testnet: 1,
  litecoin: 2,
  ltc: 2,
  dogecoin: 3,
  doge: 3,
  dash: 5,
  ethereum: 60,
  eth: 60,
  ethereumclassic: 61,
  etc: 61,
  ripple: 144,
  xrp: 144,
  bitcoincash: 145,
  bch: 145,
  stellar: 148,
  xlm: 148,
  cardano: 1815,
  ada: 1815,
  solana: 501,
  sol: 501,
  tezos: 1729,
  xtz: 1729,
  eos: 194,
  binance: 714,
  bnb: 714,
  zcash: 133,
  zec: 133,
  digibyte: 20,
  dgb: 20,
  vertcoin: 28,
  vtc: 28,
  monacoin: 22,
  mona: 22,
  groestlcoin: 17,
  grs: 17,
};

export const BITCOIN_LIKE_COINS: CoinInfo[] = [
  {
    name: 'Bitcoin',
    shortcut: 'BTC',
    slip44: 0,
    segwit: true,
    decimals: 8,
    explorerUrl: 'https://blockstream.info',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Bitcoin Testnet',
    shortcut: 'TEST',
    slip44: 1,
    segwit: true,
    decimals: 8,
    testnet: true,
    explorerUrl: 'https://blockstream.info/testnet',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Litecoin',
    shortcut: 'LTC',
    slip44: 2,
    segwit: true,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/litecoin',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Dogecoin',
    shortcut: 'DOGE',
    slip44: 3,
    segwit: false,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/dogecoin',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Dash',
    shortcut: 'DASH',
    slip44: 5,
    segwit: false,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/dash',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Bitcoin Cash',
    shortcut: 'BCH',
    slip44: 145,
    segwit: false,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/bitcoin-cash',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Zcash',
    shortcut: 'ZEC',
    slip44: 133,
    segwit: false,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/zcash',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'DigiByte',
    shortcut: 'DGB',
    slip44: 20,
    segwit: true,
    decimals: 8,
    explorerUrl: 'https://digiexplorer.info',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Vertcoin',
    shortcut: 'VTC',
    slip44: 28,
    segwit: true,
    decimals: 8,
    explorerUrl: 'https://insight.vertcoin.org',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
  {
    name: 'Groestlcoin',
    shortcut: 'GRS',
    slip44: 17,
    segwit: true,
    decimals: 8,
    explorerUrl: 'https://blockchair.com/groestlcoin',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
  },
];

export const EVM_CHAINS: EvmChainInfo[] = [
  {
    name: 'Ethereum Mainnet',
    shortcut: 'ETH',
    chainId: 1,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    nativeToken: 'ETH',
  },
  {
    name: 'Ethereum Sepolia',
    shortcut: 'ETH',
    chainId: 11155111,
    slip44: 1,
    decimals: 18,
    explorerUrl: 'https://sepolia.etherscan.io',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    nativeToken: 'ETH',
  },
  {
    name: 'Polygon',
    shortcut: 'MATIC',
    chainId: 137,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    nativeToken: 'MATIC',
  },
  {
    name: 'BNB Smart Chain',
    shortcut: 'BNB',
    chainId: 56,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    nativeToken: 'BNB',
  },
  {
    name: 'Avalanche C-Chain',
    shortcut: 'AVAX',
    chainId: 43114,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    nativeToken: 'AVAX',
  },
  {
    name: 'Arbitrum One',
    shortcut: 'ETH',
    chainId: 42161,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    isL2: true,
    nativeToken: 'ETH',
  },
  {
    name: 'Optimism',
    shortcut: 'ETH',
    chainId: 10,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    isL2: true,
    nativeToken: 'ETH',
  },
  {
    name: 'Base',
    shortcut: 'ETH',
    chainId: 8453,
    slip44: 60,
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    supportedModels: ['1', 'T', 'Safe3', 'Safe5'],
    isL2: true,
    nativeToken: 'ETH',
  },
];

export function getCoinByShortcut(shortcut: string): CoinInfo | undefined {
  return BITCOIN_LIKE_COINS.find(
    (coin) => coin.shortcut.toUpperCase() === shortcut.toUpperCase(),
  );
}

export function getEvmChainById(chainId: number): EvmChainInfo | undefined {
  return EVM_CHAINS.find((chain) => chain.chainId === chainId);
}

export function getSlip44CoinType(coin: string): number {
  return SLIP44_COIN_TYPES[coin.toLowerCase()] ?? 0;
}

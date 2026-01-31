import { Cluster } from "@solana/web3.js";

export interface SolanaNetworkConfig {
  name: string;
  cluster: Cluster;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const SOLANA_NETWORKS: Record<string, SolanaNetworkConfig> = {
  mainnet: {
    name: "Solana Mainnet",
    cluster: "mainnet-beta",
    rpcUrl:
      process.env.SOLANA_MAINNET_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    blockExplorer: "https://solscan.io",
    isTestnet: false,
  },
  devnet: {
    name: "Solana Devnet",
    cluster: "devnet",
    rpcUrl:
      process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com",
    blockExplorer: "https://solscan.io",
    isTestnet: true,
  },
  testnet: {
    name: "Solana Testnet",
    cluster: "testnet",
    rpcUrl:
      process.env.SOLANA_TESTNET_RPC_URL || "https://api.testnet.solana.com",
    blockExplorer: "https://solscan.io",
    isTestnet: true,
  },
};

export function getSolanaNetworkConfig(network: string): SolanaNetworkConfig {
  const config = SOLANA_NETWORKS[network.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown Solana network: ${network}`);
  }
  return config;
}

export function getAvailableSolanaNetworks(): string[] {
  return Object.keys(SOLANA_NETWORKS);
}

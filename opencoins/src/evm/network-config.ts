export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const EVM_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  bsc: {
    name: "BNB Smart Chain",
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    isTestnet: false,
  },
  bscTestnet: {
    name: "BSC Testnet",
    chainId: 97,
    rpcUrl:
      process.env.BSC_TESTNET_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    isTestnet: true,
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    isTestnet: false,
  },
  mumbai: {
    name: "Mumbai Testnet",
    chainId: 80001,
    rpcUrl: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com",
    isTestnet: true,
  },
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    isTestnet: false,
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    isTestnet: false,
  },
  base: {
    name: "Base",
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    isTestnet: false,
  },
};

export function getNetworkConfig(network: string): NetworkConfig {
  const config = EVM_NETWORKS[network.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return config;
}

export function getAvailableNetworks(): string[] {
  return Object.keys(EVM_NETWORKS);
}

export function isTestnet(network: string): boolean {
  return getNetworkConfig(network).isTestnet;
}

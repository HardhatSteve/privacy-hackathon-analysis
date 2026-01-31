interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
}

const NETWORKS: Record<string, NetworkConfig> = {
  fuji: {
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: 43113,
    explorerUrl: "https://testnet.snowtrace.io",
  },
  mainnet: {
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    explorerUrl: "https://snowtrace.io",
  },
};

export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network.toLowerCase()];
  if (!config) {
    throw new Error(
      `Unsupported network: ${network}. Supported networks are: ${Object.keys(NETWORKS).join(", ")}`,
    );
  }
  return config;
}

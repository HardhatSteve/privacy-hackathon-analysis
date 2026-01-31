import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
}

interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
}

type NetworkName = "fuji" | "mainnet";

const DEFAULT_CONFIG = {
  networks: {
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
  } as Record<NetworkName, NetworkConfig>,
};

/**
 * Gets the Hardhat configuration
 * @returns The Hardhat configuration object
 */
export function getHardhatConfig() {
  const configPath = path.join(process.cwd(), "hardhat.config.ts");
  if (!fs.existsSync(configPath)) {
    throw new Error("Hardhat configuration file not found");
  }
  return require(configPath);
}

/**
 * Gets the network configuration
 * @param network The network name
 * @returns The network configuration
 */
export function getNetworkConfig(network: NetworkName): NetworkConfig {
  const config = DEFAULT_CONFIG.networks[network];
  if (!config) {
    throw new Error(`Network ${network} not supported`);
  }
  return config;
}

/**
 * Loads the token configuration
 * @returns The token configuration
 */
export function loadTokenConfig(): TokenConfig {
  const configPath = path.join(process.cwd(), "token.config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("Token configuration file not found");
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

/**
 * Saves the token configuration
 * @param config The token configuration to save
 */
export function saveTokenConfig(config: TokenConfig): void {
  const configPath = path.join(process.cwd(), "token.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Validates the token configuration
 * @param config The token configuration to validate
 */
export function validateTokenConfig(config: TokenConfig): void {
  if (!config.name) throw new Error("Token name is required");
  if (!config.symbol) throw new Error("Token symbol is required");
  if (!config.totalSupply) throw new Error("Total supply is required");
  if (config.decimals < 0 || config.decimals > 18) {
    throw new Error("Decimals must be between 0 and 18");
  }

  try {
    ethers.parseEther(config.totalSupply);
  } catch {
    throw new Error("Invalid total supply format");
  }
}

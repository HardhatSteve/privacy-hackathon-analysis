import * as fs from "fs";
import * as path from "path";
import { saveTokenConfig, validateTokenConfig } from "../utils/config";

interface InitOptions {
  name?: string;
  symbol?: string;
  totalSupply?: string;
  decimals?: number;
}

/**
 * Initializes the project configuration
 * @param options Initialization options
 */
export async function initConfig(options: InitOptions = {}): Promise<void> {
  // Create .env file if it doesn't exist
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    const envContent = `PRIVATE_KEY=
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
`;
    fs.writeFileSync(envPath, envContent);
  }

  // Create token configuration
  const config = {
    name: options.name || "Privacy Token",
    symbol: options.symbol || "PRIV",
    totalSupply: options.totalSupply || "1000000",
    decimals: options.decimals || 18,
  };

  // Validate configuration
  validateTokenConfig(config);

  // Save configuration
  saveTokenConfig(config);

  // Create hardhat.config.ts if it doesn't exist
  const hardhatConfigPath = path.join(process.cwd(), "hardhat.config.ts");
  if (!fs.existsSync(hardhatConfigPath)) {
    const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    fuji: {
      url: process.env.FUJI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
`;
    fs.writeFileSync(hardhatConfigPath, hardhatConfig);
  }

  // Create contracts directory if it doesn't exist
  const contractsDir = path.join(process.cwd(), "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  // Create scripts directory if it doesn't exist
  const scriptsDir = path.join(process.cwd(), "scripts");
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
  }

  // // Create test directory if it doesn't exist
  // const testDir = path.join(process.cwd(), 'test');
  // if (!fs.existsSync(testDir)) {
  //   fs.mkdirSync(testDir);
  // }
}

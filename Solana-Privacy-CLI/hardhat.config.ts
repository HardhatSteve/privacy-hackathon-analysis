import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@solarity/chai-zkit";
import "@solarity/hardhat-zkit";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    fuji: {
      url: RPC_URL,
      chainId: 43113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: RPC_URL,
      chainId: 43114,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      forking: {
        url: RPC_URL,
        blockNumber: 59121339,
        enabled: !!process.env.FORKING,
      },
    },
  },
  zkit: {
    compilerVersion: "2.1.9",
    circuitsDir: "circom",
    compilationSettings: {
      artifactsDir: "zkit/artifacts",
      onlyFiles: [],
      skipFiles: [],
      c: false,
      json: false,
      optimization: "O2",
    },
    setupSettings: {
      contributionSettings: {
        provingSystem: "groth16",
        contributions: 0,
      },
      onlyFiles: [],
      skipFiles: [],
      ptauDir: undefined,
      ptauDownload: true,
    },
    verifiersSettings: {
      verifiersDir: "contracts/verifiers",
      verifiersType: "sol",
    },
    typesDir: "generated-types/zkit",
    quiet: false,
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      avalancheFuji: process.env.SNOWTRACE_API_KEY || "",
    },
  },
};

export default config; 
import { ethers } from "ethers";
import { getNetworkConfig } from "./network-config.js";
import { Logger } from "../utils/logger.js";

// Uniswap V2 Router ABI (only the functions we need)
const UNISWAP_V2_ROUTER_ABI = [
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
];

// Uniswap V2 Factory ABI
const UNISWAP_V2_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
];

// ERC20 ABI for approval
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

// Token ABI for fee exclusion (LaunchpadToken specific)
const TOKEN_ABI = [
  "function setFeeExclusion(address account, bool excluded) external",
  "function isExcludedFromFee(address account) external view returns (bool)",
  "function owner() external view returns (address)",
];

// Router addresses for different networks
const ROUTER_ADDRESSES: Record<string, string> = {
  ethereum: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  sepolia: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 on Sepolia
  bsc: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap
  bscTestnet: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1", // PancakeSwap Testnet
  polygon: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
  mumbai: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap Testnet
  arbitrum: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap
  optimism: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap
  base: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24", // BaseSwap
};

export interface PoolCreationParams {
  tokenAddress: string;
  tokenAmount: string;
  ethAmount: string;
  network: string;
  privateKey: string;
  slippageBps?: number; // Basis points (100 = 1%)
}

export interface PoolCreationResult {
  pairAddress: string;
  transactionHash: string;
  liquidityTokens: string;
  tokenAmount: string;
  ethAmount: string;
  blockExplorer: string;
}

export class UniswapPoolManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a liquidity pool on Uniswap V2 or compatible DEX
   */
  async createPool(params: PoolCreationParams): Promise<PoolCreationResult> {
    await this.logger.info(
      `Creating liquidity pool for token ${params.tokenAddress} on ${params.network}`,
    );

    // Validate router exists for network
    const routerAddress = ROUTER_ADDRESSES[params.network];
    if (!routerAddress) {
      throw new Error(
        `No DEX router configured for network: ${params.network}`,
      );
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(params.network);
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(params.privateKey, provider);

    // Connect to router and token contracts
    const router = new ethers.Contract(
      routerAddress,
      UNISWAP_V2_ROUTER_ABI,
      wallet,
    );
    const token = new ethers.Contract(params.tokenAddress, ERC20_ABI, wallet);

    // Parse amounts
    const tokenAmount = ethers.parseUnits(params.tokenAmount, 18);
    const ethAmount = ethers.parseEther(params.ethAmount);

    // Validate balances
    await this.logger.info("Validating balances...");
    const tokenBalance = await token.balanceOf(wallet.address);
    const ethBalance = await provider.getBalance(wallet.address);

    if (tokenBalance < tokenAmount) {
      throw new Error(
        `Insufficient token balance. Have: ${ethers.formatUnits(tokenBalance, 18)}, Need: ${params.tokenAmount}`,
      );
    }

    if (ethBalance < ethAmount) {
      throw new Error(
        `Insufficient ETH balance. Have: ${ethers.formatEther(ethBalance)}, Need: ${params.ethAmount}`,
      );
    }

    // Check if pair exists
    const factoryAddress = await router.factory();
    const factory = new ethers.Contract(
      factoryAddress,
      UNISWAP_V2_FACTORY_ABI,
      wallet,
    );
    const wethAddress = await router.WETH();
    let pairAddress = await factory.getPair(params.tokenAddress, wethAddress);

    if (pairAddress === ethers.ZeroAddress) {
      await this.logger.info("Pair doesn't exist, it will be created...");
    } else {
      await this.logger.info(`Pair already exists at: ${pairAddress}`);
    }

    // Approve router to spend tokens
    await this.logger.info("Approving token transfer...");
    const currentAllowance = await token.allowance(
      wallet.address,
      routerAddress,
    );

    if (currentAllowance < tokenAmount) {
      const approveTx = await token.approve(routerAddress, tokenAmount);
      await this.logger.info(`Approval transaction sent: ${approveTx.hash}`);
      await approveTx.wait();
      await this.logger.info("Tokens approved");
    } else {
      await this.logger.info("Token already approved");
    }

    // Calculate minimum amounts with slippage
    const slippageBps = params.slippageBps || 100; // Default 1%
    const tokenAmountMin = (tokenAmount * BigInt(10000 - slippageBps)) / 10000n;
    const ethAmountMin = (ethAmount * BigInt(10000 - slippageBps)) / 10000n;

    // Add liquidity
    await this.logger.info("Adding liquidity to pool...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    const liquidityTx = await router.addLiquidityETH(
      params.tokenAddress,
      tokenAmount,
      tokenAmountMin,
      ethAmountMin,
      wallet.address,
      deadline,
      { value: ethAmount },
    );

    await this.logger.info(`Liquidity transaction sent: ${liquidityTx.hash}`);
    const receipt = await liquidityTx.wait();
    await this.logger.info("Liquidity added successfully!");

    // Get pair address after creation
    pairAddress = await factory.getPair(params.tokenAddress, wethAddress);

    // Exclude pool from fees if the token supports it
    await this.logger.info("Attempting to exclude pool from fees...");
    try {
      const tokenWithFeeControl = new ethers.Contract(
        params.tokenAddress,
        TOKEN_ABI,
        wallet,
      );

      // Check if wallet is the owner (only owner can exclude from fees)
      const tokenOwner = await tokenWithFeeControl.owner();

      if (tokenOwner.toLowerCase() === wallet.address.toLowerCase()) {
        // Check if pool is already excluded
        const isExcluded =
          await tokenWithFeeControl.isExcludedFromFee(pairAddress);

        if (!isExcluded) {
          await this.logger.info(
            `Excluding pool ${pairAddress} from transfer fees...`,
          );
          const excludeTx = await tokenWithFeeControl.setFeeExclusion(
            pairAddress,
            true,
          );
          await excludeTx.wait();
          await this.logger.info(
            "✅ Pool excluded from fees - no fee on swaps!",
          );
        } else {
          await this.logger.info("Pool already excluded from fees");
        }
      } else {
        await this.logger.info(
          `Cannot exclude pool from fees - wallet is not token owner (owner: ${tokenOwner})`,
        );
      }
    } catch (error) {
      await this.logger.info(
        `Could not exclude pool from fees (token may not support fee exclusion): ${(error as Error).message}`,
      );
    }

    // Find the liquidity amount from logs (simplified)
    const liquidityTokens = "Unknown"; // Would need to parse logs for exact amount

    return {
      pairAddress,
      transactionHash: liquidityTx.hash,
      liquidityTokens,
      tokenAmount: params.tokenAmount,
      ethAmount: params.ethAmount,
      blockExplorer: `${networkConfig.blockExplorer}/tx/${liquidityTx.hash}`,
    };
  }

  /**
   * Validate that user has sufficient balances
   */
  async validateBalances(params: {
    tokenAddress: string;
    tokenAmount: string;
    ethAmount: string;
    network: string;
    address: string;
  }): Promise<{ hasEnoughTokens: boolean; hasEnoughEth: boolean }> {
    const networkConfig = getNetworkConfig(params.network);
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    const token = new ethers.Contract(params.tokenAddress, ERC20_ABI, provider);

    const tokenBalance = await token.balanceOf(params.address);
    const ethBalance = await provider.getBalance(params.address);

    const tokenAmount = ethers.parseUnits(params.tokenAmount, 18);
    const ethAmount = ethers.parseEther(params.ethAmount);

    return {
      hasEnoughTokens: tokenBalance >= tokenAmount,
      hasEnoughEth: ethBalance >= ethAmount,
    };
  }

  /**
   * Get pool information
   */
  async getPoolInfo(params: {
    tokenAddress: string;
    network: string;
  }): Promise<{ exists: boolean; pairAddress?: string }> {
    const routerAddress = ROUTER_ADDRESSES[params.network];
    if (!routerAddress) {
      throw new Error(
        `No DEX router configured for network: ${params.network}`,
      );
    }

    const networkConfig = getNetworkConfig(params.network);
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    const router = new ethers.Contract(
      routerAddress,
      UNISWAP_V2_ROUTER_ABI,
      provider,
    );
    const factoryAddress = await router.factory();
    const factory = new ethers.Contract(
      factoryAddress,
      UNISWAP_V2_FACTORY_ABI,
      provider,
    );

    const wethAddress = await router.WETH();
    const pairAddress = await factory.getPair(params.tokenAddress, wethAddress);

    if (pairAddress === ethers.ZeroAddress) {
      return { exists: false };
    }

    return { exists: true, pairAddress };
  }
}

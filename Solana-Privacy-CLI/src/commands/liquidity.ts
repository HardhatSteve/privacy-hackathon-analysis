import { HardhatRuntimeEnvironment } from "hardhat/types";

interface LiquidityOptions {
  token: string;
  amount: string;
  slippage?: string;
}

/**
 * Adds liquidity to Trader Joe DEX
 * @param options Liquidity options
 */
export async function addLiquidity(options: LiquidityOptions): Promise<void> {
  const hre: HardhatRuntimeEnvironment = require("hardhat");
  const { ethers } = hre;

  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", deployer.address);

  // Get Trader Joe Router contract
  const routerAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"; // Trader Joe Router
  const router = await ethers.getContractAt("IJoeRouter02", routerAddress);

  // Get token contract
  const token = await ethers.getContractAt("IERC20", options.token);

  // Get AVAX balance
  const avaxBalance = await ethers.provider.getBalance(deployer.address);
  const avaxAmount = avaxBalance / 2n; // Use half of AVAX balance

  // Approve router to spend tokens
  const tokenAmount = ethers.parseEther(options.amount);
  const approveTx = await token.approve(routerAddress, tokenAmount);
  await approveTx.wait();

  // Add liquidity
  const slippage = options.slippage ? parseFloat(options.slippage) : 0.5;
  const slippageMultiplier = 1000n - BigInt(Math.floor(slippage * 10));
  const minTokenAmount = (tokenAmount * slippageMultiplier) / 1000n;
  const minAvaxAmount = (avaxAmount * slippageMultiplier) / 1000n;

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const addLiquidityTx = await router.addLiquidityAVAX(
    options.token,
    tokenAmount,
    minTokenAmount,
    minAvaxAmount,
    deployer.address,
    deadline,
    { value: avaxAmount },
  );

  await addLiquidityTx.wait();

  console.log("Liquidity added successfully");
  console.log("Token Amount:", ethers.formatEther(tokenAmount));
  console.log("AVAX Amount:", ethers.formatEther(avaxAmount));
}

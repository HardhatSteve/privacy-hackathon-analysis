import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
import { expect } from "chai";
// import type {
//   CalldataMintCircuitGroth16,
//   CalldataRegistrationCircuitGroth16,
//   RegistrationCircuit,
// } from "../generated-types/zkit";
import { BN254_SCALAR_FIELD } from "../constants";
import { decryptPoint } from "../jub";
// import type {
//   EncryptedERC,
//   MintProofStruct,
//   TransferProofStruct,
// } from "../typechain-types/contracts/EncryptedERC";
// import type {
//   RegisterProofStruct,
//   Registrar,
// } from "../typechain-types/contracts/Registrar";
// import {
//   EncryptedERC__factory,
//   Registrar__factory,
// } from "../typechain-types/factories/contracts";
// import {
//   decryptPCT,
//   deployLibrary,
//   deployVerifiers,
//   getDecryptedBalance,
//   privateBurn,
//   privateMint,
//   privateTransfer,
// } from "./helpers";
// import { User } from "./user";


dotenv.config();

interface DeployOptions {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: string;
  factory?: string;
}

/**
 * Deploys a new PrivERC20 token
 * @param options Deployment options
 * @returns Promise<string> The deployed token address
 */
export async function deployToken(options: DeployOptions): Promise<string> {
  const hre = require("hardhat") as HardhatRuntimeEnvironment & {
    ethers: typeof ethers;
  };
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const totalSupply = hre.ethers.parseEther(options.totalSupply);
  const decimals = options.decimals ? parseInt(options.decimals) : 18;

  let tokenAddress: string;

  if (options.factory) {
    // Deploy using factory
    const factory = await hre.ethers.getContractAt(
      "PrivERC20Factory",
      options.factory,
    );
    const tx = await factory.deployToken(
      options.name,
      options.symbol,
      totalSupply,
      decimals,
    );
    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (log: any) => log.fragment?.name === "TokenDeployed",
    );
    tokenAddress = event?.args[0];
  } else {
    // Deploy directly
    const Token = await hre.ethers.getContractFactory("PrivERC20");
    const token = await Token.deploy(
      options.name,
      options.symbol,
      totalSupply,
      decimals,
    );
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
  }

  return tokenAddress;
}

/**
 * Deploys the PrivERC20Factory contract
 * @returns Promise<string> The deployed factory address
 */
export async function deployFactory(): Promise<string> {
  const hre = require("hardhat") as HardhatRuntimeEnvironment & {
    ethers: typeof ethers;
  };
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying factory with account:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("PrivERC20Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  return await factory.getAddress();
}

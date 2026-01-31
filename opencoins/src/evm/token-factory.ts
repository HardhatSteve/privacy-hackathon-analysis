import { ethers } from "ethers";
import { readFileSync } from "fs";
import { join } from "path";
import { getNetworkConfig } from "./network-config.js";
import { Logger } from "../utils/logger.js";
import {
  validateEvmAddress,
  validateTokenName,
  validateTokenSymbol,
  validateDecimals,
  validateAndParseSupply,
  validateEvmPrivateKey,
} from "../utils/validation.js";

// ABI for the LaunchpadToken contract
const TOKEN_ABI = [
  "constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _feeCollector)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function feeCollector() view returns (address)",
  "function isExcludedFromFee(address) view returns (bool)",
  "function setFeeExclusion(address account, bool excluded)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event FeeCollected(address indexed from, address indexed to, uint256 amount)",
];

// Bytecode will be loaded from compiled contract
// For now, this is a placeholder - you need to compile Token.sol first
const TOKEN_BYTECODE =
  "0x608060405234801561000f575f80fd5b50604051611a38380380611a3883398181016040528101906100319190610356565b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036100a0576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161009790610477565b60405180910390fd5b5f8403156100e3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100da906104df565b60405180910390fd5b8460019081610f29919061072f565b508360029081610139919061072f565b508260035f6101000a81548160ff021916908360ff160217905550816004819055508060055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555033600a5f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081600660033373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055506001600960008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055506001600960033373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055503373ffffffffffffffffffffffffffffffffffffffff165f73ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161032d9190610838565b60405180910390a350505050506108f7565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6103a28261035c565b810181811067ffffffffffffffff821117156103c1576103c061036c565b5b80604052505050565b5f6103d3610338565b90506103df8282610399565b919050565b5f67ffffffffffffffff8211156103fe576103fd61036c565b5b6104078261035c565b9050602081019050919050565b5f5b83811015610431578082015181840152602081019050610416565b5f8484015250505050565b5f61044e610449846103e4565b6103ca565b90508281526020810184848401111561046a57610469610358565b5b610475848285610414565b509392505050565b5f82601f83011261049157610490610354565b5b81516104a184826020860161043c565b91505092915050565b5f60ff82169050919050565b6104bf816104aa565b81146104c9575f80fd5b50565b5f815190506104da816104b6565b92915050565b5f819050919050565b6104f2816104e0565b81146104fc575f80fd5b50565b5f8151905061050d816104e9565b92915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61053c82610513565b9050919050565b61054c81610532565b8114610556575f80fd5b50565b5f8151905061056781610543565b92915050565b5f805f805f60a0868803121561058657610585610341565b5b5f86015167ffffffffffffffff8111156105a3576105a2610345565b5b6105af8882890161047d565b955050602086015167ffffffffffffffff8111156105d0576105cf610345565b5b6105dc8882890161047d565b94505060406105ed888289016104cc565b93505060606105fe888289016104ff565b925050608061060f88828901610559565b9150509295509295909350565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061066957607f821691505b60208210810361067c5761067b610625565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106de7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826106a3565b6106e886836106a3565b95508019841693508086168417925050509392505050565b5f819050919050565b5f61072361071e610719846104e0565b610700565b6104e0565b9050919050565b5f819050919050565b61073c83610709565b6107506107488261072a565b8484546106af565b825550505050565b5f90565b610764610758565b61076f818484610733565b505050565b5b818110156107925761078782825f61075c565b600181019050610775565b5050565b601f8211156107d7576107a881610682565b6107b184610694565b810160208510156107c0578190505b6107d46107cc85610694565b830182610774565b50505b505050565b5f82821c905092915050565b5f6107f75f19846008026107dc565b1980831691505092915050565b5f61080f83836107e8565b9150826002028217905092915050565b6108288261061c565b67ffffffffffffffff8111156108415761084061036c565b5b61084b8254610652565b610856828285610796565b5f60209050601f831160018114610887575f8415610875578287015190505b61087f8582610804565b8655506108e6565b601f19841661089586610682565b5f5b828110156108bc57848901518255600182019150602085019450602081019050610897565b868310156108d957848901516108d5601f8916826107e8565b8355505b6001600288020188555050505b505050505050565b61113281610906565b5f81565b670de0b6b3a7640000";

export interface DeploymentResult {
  tokenAddress: string;
  transactionHash: string;
  blockExplorer: string;
  network: string;
  deployer: string;
}

export interface TokenDeploymentParams {
  network: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  privateKey: string;
  feeCollector: string;
}

export class EvmTokenFactory {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Deploy a token on an EVM network
   */
  async deployToken(params: TokenDeploymentParams): Promise<DeploymentResult> {
    await this.logger.info("Starting EVM token deployment", {
      network: params.network,
      name: params.name,
      symbol: params.symbol,
    });

    // Validate inputs
    this.validateParams(params);

    // Get network configuration
    const networkConfig = getNetworkConfig(params.network);

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = new ethers.Wallet(params.privateKey, provider);

    await this.logger.debug("Connected to network", {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      deployer: wallet.address,
    });

    // Parse total supply
    const totalSupplyBigInt = validateAndParseSupply(
      params.totalSupply,
      params.decimals,
    );

    // Create contract factory
    const factory = new ethers.ContractFactory(
      TOKEN_ABI,
      TOKEN_BYTECODE,
      wallet,
    );

    await this.logger.info("Deploying contract...", {
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals,
      supply: params.totalSupply,
      feeCollector: params.feeCollector,
    });

    // Deploy contract
    const contract = await factory.deploy(
      params.name,
      params.symbol,
      params.decimals,
      totalSupplyBigInt,
      params.feeCollector,
    );

    // Wait for deployment
    await contract.waitForDeployment();
    const tokenAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error("Deployment transaction not found");
    }

    const txHash = deploymentTx.hash;

    await this.logger.logDeployment(
      "evm",
      params.network,
      tokenAddress,
      params.name,
      params.symbol,
      txHash,
    );

    const result: DeploymentResult = {
      tokenAddress,
      transactionHash: txHash,
      blockExplorer: `${networkConfig.blockExplorer}/address/${tokenAddress}`,
      network: networkConfig.name,
      deployer: wallet.address,
    };

    await this.logger.info("Token deployment successful", result);

    return result;
  }

  /**
   * Validate deployment parameters
   */
  private validateParams(params: TokenDeploymentParams): void {
    validateTokenName(params.name);
    validateTokenSymbol(params.symbol);
    validateDecimals(params.decimals, "evm");
    validateEvmPrivateKey(params.privateKey);

    if (!validateEvmAddress(params.feeCollector)) {
      throw new Error("Invalid fee collector address");
    }

    // Validate network exists
    getNetworkConfig(params.network);
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string, network: string) {
    const networkConfig = getNetworkConfig(network);
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

    const [name, symbol, decimals, totalSupply, feeCollector] =
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.feeCollector(),
      ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
      feeCollector,
      address: tokenAddress,
      network: networkConfig.name,
      blockExplorer: `${networkConfig.blockExplorer}/address/${tokenAddress}`,
    };
  }
}

import { JsonRpcProvider } from 'ethers';
import { config } from './index';

/**
 * Sepolia Testnet Configuration
 * 
 * This configuration connects to Sepolia Testnet for real EVM blockchain operations.
 * All transactions are verifiable on Sepolia Etherscan.
 */
export class EVMConfig {
  private static instance: EVMConfig;
  public readonly provider: JsonRpcProvider;
  public readonly chainId: number;
  public readonly network: string = 'sepolia';
  
  private constructor() {
    this.chainId = config.sepolia.chainId;
    
    if (!config.sepolia.rpcUrl) {
      throw new Error('SEPOLIA_RPC_URL is required for EVM configuration');
    }
    
    // Create provider for Sepolia testnet
    this.provider = new JsonRpcProvider(config.sepolia.rpcUrl, {
      chainId: this.chainId,
      name: 'sepolia',
    });
  }
  
  public static getInstance(): EVMConfig {
    if (!EVMConfig.instance) {
      EVMConfig.instance = new EVMConfig();
    }
    return EVMConfig.instance;
  }
  
  /**
   * Get Sepolia Etherscan URL for transaction
   */
  public getExplorerUrl(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  
  /**
   * Verify connection to Sepolia network
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      console.log(`Connected to Sepolia testnet:`, {
        chainId: network.chainId.toString(),
        name: network.name,
      });
      return true;
    } catch (error) {
      console.error('Failed to connect to Sepolia:', error);
      return false;
    }
  }
  
  /**
   * Get current block number
   */
  public async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }
}

export const evmConfig = EVMConfig.getInstance();

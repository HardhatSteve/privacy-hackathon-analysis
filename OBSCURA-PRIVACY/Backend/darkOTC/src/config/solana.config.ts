import { Connection, clusterApiUrl } from '@solana/web3.js';
import { config } from './index';

/**
 * Solana Devnet Configuration
 * 
 * This configuration connects to Solana Devnet for real blockchain operations.
 * All transactions are verifiable on Solana Explorer.
 */
export class SolanaConfig {
  private static instance: SolanaConfig;
  public readonly connection: Connection;
  public readonly network: string;
  
  private constructor() {
    this.network = config.solana.network;
    
    // Use custom RPC URL or default to Solana Devnet
    const rpcUrl = config.solana.rpcUrl || clusterApiUrl('devnet');
    
    // Create connection with commitment level for finality
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  
  public static getInstance(): SolanaConfig {
    if (!SolanaConfig.instance) {
      SolanaConfig.instance = new SolanaConfig();
    }
    return SolanaConfig.instance;
  }
  
  /**
   * Get Solana Explorer URL for transaction
   */
  public getExplorerUrl(signature: string): string {
    return `https://explorer.solana.com/tx/${signature}?cluster=${this.network}`;
  }
  
  /**
   * Verify connection to Solana network
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log(`Connected to Solana ${this.network}:`, version);
      return true;
    } catch (error) {
      console.error('Failed to connect to Solana:', error);
      return false;
    }
  }
}

export const solanaConfig = SolanaConfig.getInstance();

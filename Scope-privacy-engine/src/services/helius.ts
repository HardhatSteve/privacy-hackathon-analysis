/**
 * Helius Service 
 * Also integrates QuickNode RPC for balance fetching
 */

import * as dotenv from "dotenv";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Load environment variables
dotenv.config();

// Transaction types from Helius
export interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
  fee: number;
  feePayer: string;
  accountData: AccountData[];
  tokenTransfers: TokenTransfer[];
  nativeTransfers: NativeTransfer[];
  events: TransactionEvent;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  tokenAccount: string;
  userAccount: string;
}

export interface TokenTransfer {
  mint: string;
  tokenAmount: number;
  fromUserAccount: string;
  toUserAccount: string;
  tokenStandard: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface TransactionEvent {
  nft?: {
    description: string;
    type: string;
    source: string;
    amount: number;
    fee: number;
    feePayer: string;
    buyer?: string | undefined;
    seller?: string | undefined;
    nfts?: Array<{
      mint: string;
      tokenStandard: string;
    }> | undefined;
  } | undefined;
  swap?: {
    nativeInput?: {
      account: string;
      amount: number;
    } | undefined;
    nativeOutput?: {
      account: string;
      amount: number;
    } | undefined;
    tokenInputs?: Array<{
      mint: string;
      amount: number;
    }> | undefined;
    tokenOutputs?: Array<{
      mint: string;
      amount: number;
    }> | undefined;
  } | undefined;
}

export class HeliusService {
  private apiKey: string | null = null;
  private isInitialized: boolean = false;
  private quickNodeUrl: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.apiKey = process.env.HELIUS_API_KEY ?? null;
      this.quickNodeUrl = process.env.QUICKNODE_RPC_URL ?? null;

      if (!this.apiKey) {
        console.warn(
          "⚠️  HELIUS_API_KEY not found in environment variables. Using mock data."
        );
        this.isInitialized = false;
        return;
      }

      this.isInitialized = true;
      console.log("✅ Helius API key loaded successfully");
      
      if (this.quickNodeUrl) {
        console.log("✅ QuickNode RPC URL loaded successfully");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Helius:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Get parsed transaction history for a wallet address
   * Falls back to mock data if Helius is not available
   */
  async getHistory(
    address: string,
    limit: number = 100
  ): Promise<ParsedTransaction[]> {
    // Validate address format (basic check)
    if (!address || address.length < 32 || address.length > 44) {
      console.error("❌ Invalid Solana address format:", address);
      return [];
    }

    console.log(`📡 Fetching transaction history for: ${address}`);
    console.log(`   Limit: ${limit} transactions`);

    if (!this.isInitialized || !this.apiKey) {
      console.warn("⚠️  Helius not initialized. Using mock transaction data.");
      return this.getMockTransactions(address);
    }

    try {
      // Use Helius REST API directly
      const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const transactions = await response.json() as ParsedTransaction[];
      console.log(`✅ Retrieved ${transactions.length} transactions`);
      
      return transactions;
    } catch (error) {
      console.error("❌ Error fetching transaction history:", error);
      console.log("   Falling back to mock data...");
      return this.getMockTransactions(address);
    }
  }

  /**
   * Get mock transactions for demo purposes
   */
  private getMockTransactions(walletAddress: string): ParsedTransaction[] {
    console.log("   📝 Generating mock transaction data for demo...");
    
    // Mock transactions simulating CEX activity and various patterns
    return [
      // CEX Deposit simulation
      {
        signature: "mock_cex_deposit_1",
        timestamp: Date.now() / 1000 - 86400,
        type: "TRANSFER",
        source: "SYSTEM_PROGRAM",
        description: "Transferred 2.5 SOL to Binance",
        fee: 5000,
        feePayer: walletAddress,
        accountData: [],
        tokenTransfers: [],
        nativeTransfers: [
          {
            fromUserAccount: walletAddress,
            toUserAccount: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", // Mock Binance
            amount: 2500000000,
          },
        ],
        events: {},
      },
      // CEX Withdrawal simulation
      {
        signature: "mock_cex_withdrawal_1",
        timestamp: Date.now() / 1000 - 172800,
        type: "TRANSFER",
        source: "SYSTEM_PROGRAM",
        description: "Received 1 SOL from Coinbase",
        fee: 5000,
        feePayer: "2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm", // Mock Coinbase
        accountData: [],
        tokenTransfers: [],
        nativeTransfers: [
          {
            fromUserAccount: "2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm", // Mock Coinbase
            toUserAccount: walletAddress,
            amount: 1000000000,
          },
        ],
        events: {},
      },
      // Regular transfer showing clustering
      {
        signature: "mock_regular_1",
        timestamp: Date.now() / 1000 - 259200,
        type: "TRANSFER",
        source: "SYSTEM_PROGRAM",
        description: "Transferred 0.5 SOL",
        fee: 5000,
        feePayer: walletAddress,
        accountData: [],
        tokenTransfers: [],
        nativeTransfers: [
          {
            fromUserAccount: walletAddress,
            toUserAccount: "FriendWallet1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            amount: 500000000,
          },
        ],
        events: {},
      },
      // POAP/Badge receipt
      {
        signature: "mock_poap_1",
        timestamp: Date.now() / 1000 - 345600,
        type: "NFT_MINT",
        source: "MAGIC_EDEN",
        description: "Received Solana Hackathon 2024 Attendance Badge",
        fee: 5000,
        feePayer: walletAddress,
        accountData: [],
        tokenTransfers: [
          {
            mint: "HackathonBadgeMint123456789012345678901234",
            tokenAmount: 1,
            fromUserAccount: "MinterAddress12345678901234567890123456",
            toUserAccount: walletAddress,
            tokenStandard: "NonFungible",
          },
        ],
        nativeTransfers: [],
        events: {
          nft: {
            description: "Minted Solana Hackathon 2024 Attendance Badge",
            type: "NFT_MINT",
            source: "MAGIC_EDEN",
            amount: 0,
            fee: 5000,
            feePayer: walletAddress,
            buyer: walletAddress,
            nfts: [
              {
                mint: "HackathonBadgeMint123456789012345678901234",
                tokenStandard: "NonFungible",
              },
            ],
          },
        },
      },
      // Repeated interaction showing clustering pattern
      {
        signature: "mock_cluster_1",
        timestamp: Date.now() / 1000 - 432000,
        type: "TRANSFER",
        source: "SYSTEM_PROGRAM",
        description: "Transferred 0.1 SOL",
        fee: 5000,
        feePayer: walletAddress,
        accountData: [],
        tokenTransfers: [],
        nativeTransfers: [
          {
            fromUserAccount: walletAddress,
            toUserAccount: "FriendWallet1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            amount: 100000000,
          },
        ],
        events: {},
      },
      {
        signature: "mock_cluster_2",
        timestamp: Date.now() / 1000 - 518400,
        type: "TRANSFER",
        source: "SYSTEM_PROGRAM",
        description: "Received 0.2 SOL",
        fee: 5000,
        feePayer: "FriendWallet1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        accountData: [],
        tokenTransfers: [],
        nativeTransfers: [
          {
            fromUserAccount: "FriendWallet1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            toUserAccount: walletAddress,
            amount: 200000000,
          },
        ],
        events: {},
      },
    ];
  }

  /**
   * Get all addresses that interacted with a wallet
   */
  getInteractingAddresses(
    transactions: ParsedTransaction[],
    walletAddress: string
  ): Map<string, number> {
    const addressCounts = new Map<string, number>();

    for (const tx of transactions) {
      // Check native transfers
      for (const transfer of tx.nativeTransfers ?? []) {
        const otherAddress =
          transfer.fromUserAccount === walletAddress
            ? transfer.toUserAccount
            : transfer.fromUserAccount;

        if (otherAddress && otherAddress !== walletAddress) {
          addressCounts.set(
            otherAddress,
            (addressCounts.get(otherAddress) ?? 0) + 1
          );
        }
      }

      // Check token transfers
      for (const transfer of tx.tokenTransfers ?? []) {
        const otherAddress =
          transfer.fromUserAccount === walletAddress
            ? transfer.toUserAccount
            : transfer.fromUserAccount;

        if (otherAddress && otherAddress !== walletAddress) {
          addressCounts.set(
            otherAddress,
            (addressCounts.get(otherAddress) ?? 0) + 1
          );
        }
      }
    }

    return addressCounts;
  }

  /**
   * Check if Helius service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get SOL balance for a wallet address using QuickNode RPC
   * Falls back to public mainnet RPC if QuickNode URL is not set
   */
  async getBalance(address: string): Promise<number> {
    try {
      const rpcUrl = this.quickNodeUrl || "https://api.mainnet-beta.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");
      const publicKey = new PublicKey(address);
      const balanceLamports = await connection.getBalance(publicKey);
      const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
      
      console.log(`   💰 Balance fetched via ${this.quickNodeUrl ? 'QuickNode' : 'public RPC'}: ${balanceSol.toFixed(4)} SOL`);
      return balanceSol;
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const heliusService = new HeliusService();

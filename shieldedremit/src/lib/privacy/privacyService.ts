/**
 * Unified Privacy Service
 * Combines ShadowWire (ZK proofs) and SilentSwap (obfuscated routing)
 * for comprehensive privacy-preserving transfers
 */

import { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  getShadowWireService,
  ShadowWireService,
  type ShadowWireTransferParams,
  type ShadowWireTransferResult,
} from "./shadowwire";
import {
  getSilentSwapService,
  SilentSwapService,
  type PrivateTransferParams as SilentSwapTransferParams,
} from "./silentswap";
import { sendTransaction, type SendTransactionParams } from "../solana/transaction";
import {
  PrivacyLevel,
  TOKEN_ADDRESSES,
  type PrivacyRoute,
  type FeeBreakdown,
  type TransferParams,
  type TransferResult,
  type Currency,
  type ZKProofData,
  type ShieldedBalance,
} from "@/types";

interface PrivacyConfig {
  level: PrivacyLevel;
  minHops?: number;
  maxDelay?: number;
  enableMixing?: boolean;
  transferType?: "internal" | "external";
}

interface PrivacyScore {
  overall: number;
  amountPrivacy: number;
  senderPrivacy: number;
  recipientPrivacy: number;
  timingPrivacy: number;
}

// Use WalletContextState from Solana wallet adapter
type WalletAdapter = WalletContextState;

export class PrivacyService {
  private shadowWire: ShadowWireService;
  private silentSwap: SilentSwapService;
  private connection: Connection;
  private initialized: boolean = false;

  constructor(connection: Connection) {
    this.connection = connection;
    this.shadowWire = getShadowWireService();
    this.silentSwap = getSilentSwapService();
  }

  /**
   * Initialize privacy services (WASM, SDK auth, etc.)
   */
  async initialize(walletAddress?: string): Promise<boolean> {
    try {
      // Initialize ShadowWire WASM for client-side proofs
      await this.shadowWire.initializeWASM();

      // Initialize SilentSwap SDK
      if (walletAddress) {
        await this.silentSwap.initialize(walletAddress);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize privacy services:", error);
      return false;
    }
  }

  /**
   * Execute a private transfer based on privacy level
   */
  async executePrivateTransfer(
    params: TransferParams,
    wallet: WalletAdapter
  ): Promise<TransferResult> {
    const { recipient, amount, currency, privacyLevel, memo, transferType } = params;

    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    if (!this.initialized) {
      await this.initialize(wallet.publicKey.toString());
    }

    try {
      switch (privacyLevel) {
        case PrivacyLevel.NONE:
          return await this.executeDirectTransfer(params, wallet);

        case PrivacyLevel.MEDIUM:
          // Use ShadowWire for amount privacy
          return await this.executeShadowWireTransfer(params, wallet);

        case PrivacyLevel.HIGH:
          // Use SilentSwap + ShadowWire for full anonymity
          return await this.executeFullPrivacyTransfer(params, wallet);

        default:
          throw new Error("Invalid privacy level");
      }
    } catch (error) {
      console.error("Privacy transfer failed:", error);
      throw error;
    }
  }

  /**
   * Direct transfer without privacy features
   */
  private async executeDirectTransfer(
    params: TransferParams,
    wallet: WalletAdapter
  ): Promise<TransferResult> {
    const sendParams: SendTransactionParams = {
      connection: this.connection,
      wallet: wallet as SendTransactionParams["wallet"],
      recipient: params.recipient,
      amount: params.amount,
      currency: params.currency,
    };

    const result = await sendTransaction(sendParams);

    return {
      signature: result.signature,
      status: result.success ? "confirmed" : "failed",
      privacyScore: 0,
      fees: await this.estimateTotalFees({
        ...params,
        privacyLevel: PrivacyLevel.NONE,
      }),
    };
  }

  /**
   * ShadowWire transfer for amount privacy
   */
  private async executeShadowWireTransfer(
    params: TransferParams,
    wallet: WalletAdapter
  ): Promise<TransferResult> {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Wallet must support message signing for ShadowWire");
    }

    const transferType = params.transferType || "external";

    const shadowParams: ShadowWireTransferParams = {
      sender: wallet.publicKey.toString(),
      recipient: params.recipient,
      amount: params.amount,
      token: params.currency,
      type: transferType,
      signMessage: wallet.signMessage,
    };

    const result = await this.shadowWire.transfer(shadowParams);

    if (!result.success) {
      throw new Error(result.error || "ShadowWire transfer failed");
    }

    const fees = await this.estimateTotalFees(params);

    return {
      signature: result.signature || "",
      status: "confirmed",
      privacyScore: this.calculatePrivacyScore({ level: PrivacyLevel.MEDIUM }).overall,
      fees,
      proof: result.proof,
      route: {
        hops: 1,
        mixingEnabled: false,
        estimatedTime: 30,
        privacyScore: 50,
      },
    };
  }

  /**
   * Full privacy transfer using both SilentSwap and ShadowWire
   */
  private async executeFullPrivacyTransfer(
    params: TransferParams,
    wallet: WalletAdapter
  ): Promise<TransferResult> {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Wallet must support message signing for privacy transfers");
    }

    // Step 1: Create obfuscated route via SilentSwap
    const silentSwapParams: SilentSwapTransferParams = {
      fromToken: params.currency,
      toToken: params.currency,
      amount: params.amount,
      recipient: params.recipient,
      privacyLevel: PrivacyLevel.HIGH,
      solanaAddress: wallet.publicKey.toString(),
    };

    const transfer = await this.silentSwap.createPrivateTransfer(silentSwapParams);

    if (!transfer) {
      throw new Error("Failed to create SilentSwap transfer");
    }

    // Step 2: Generate ZK proof via ShadowWire for amount privacy
    const shadowParams: ShadowWireTransferParams = {
      sender: wallet.publicKey.toString(),
      recipient: params.recipient,
      amount: params.amount,
      token: params.currency,
      type: "internal",
      signMessage: wallet.signMessage,
    };

    const proofResult = await this.shadowWire.transfer(shadowParams);

    const fees = await this.estimateTotalFees(params);

    return {
      signature: transfer.id,
      status: "processing",
      privacyScore: this.calculatePrivacyScore({ level: PrivacyLevel.HIGH }).overall,
      fees,
      proof: proofResult.proof,
      route: {
        hops: transfer.route.hops.length,
        mixingEnabled: true,
        estimatedTime: transfer.route.estimatedTime,
        privacyScore: 95,
      },
    };
  }

  /**
   * Deposit funds into ShadowWire shielded pool
   */
  async deposit(
    wallet: WalletAdapter,
    amount: number,
    token: Currency
  ): Promise<ShadowWireTransferResult> {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Wallet must support message signing");
    }

    return this.shadowWire.deposit({
      wallet: wallet.publicKey.toString(),
      amount,
      token,
      signMessage: wallet.signMessage,
    });
  }

  /**
   * Withdraw funds from ShadowWire shielded pool
   */
  async withdraw(
    wallet: WalletAdapter,
    amount: number,
    token: Currency
  ): Promise<ShadowWireTransferResult> {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Wallet must support message signing");
    }

    return this.shadowWire.withdraw({
      wallet: wallet.publicKey.toString(),
      amount,
      token,
      signMessage: wallet.signMessage,
    });
  }

  /**
   * Get shielded balance from ShadowWire
   */
  async getShieldedBalance(
    wallet: string,
    token: Currency
  ): Promise<ShieldedBalance> {
    return this.shadowWire.getBalance(wallet, token);
  }

  /**
   * Calculate privacy score for a configuration
   */
  calculatePrivacyScore(config: PrivacyConfig): PrivacyScore {
    const { level } = config;

    const scores: Record<PrivacyLevel, PrivacyScore> = {
      [PrivacyLevel.NONE]: {
        overall: 0,
        amountPrivacy: 0,
        senderPrivacy: 0,
        recipientPrivacy: 0,
        timingPrivacy: 0,
      },
      [PrivacyLevel.MEDIUM]: {
        overall: 50,
        amountPrivacy: 95,
        senderPrivacy: 20,
        recipientPrivacy: 20,
        timingPrivacy: 30,
      },
      [PrivacyLevel.HIGH]: {
        overall: 95,
        amountPrivacy: 100,
        senderPrivacy: 95,
        recipientPrivacy: 95,
        timingPrivacy: 85,
      },
    };

    return scores[level];
  }

  /**
   * Estimate total fees for a transfer
   */
  async estimateTotalFees(params: TransferParams): Promise<FeeBreakdown> {
    const { amount, privacyLevel, currency } = params;

    // Base network fee
    const networkFee = 0.000005; // SOL

    let privacyFee = 0;
    let serviceFee = 0;

    if (privacyLevel === PrivacyLevel.MEDIUM) {
      // ShadowWire fees
      const fees = await this.shadowWire.calculateFees(amount, currency);
      privacyFee = fees.feeAmount;
    } else if (privacyLevel === PrivacyLevel.HIGH) {
      // Combined SilentSwap + ShadowWire fees
      const silentSwapFees = await this.silentSwap.estimateFees(amount, privacyLevel);
      const shadowWireFees = await this.shadowWire.calculateFees(amount, currency);

      privacyFee = silentSwapFees.privacyFee + shadowWireFees.feeAmount;
      serviceFee = silentSwapFees.serviceFee;
    }

    return {
      networkFee,
      privacyFee,
      serviceFee,
      total: networkFee + privacyFee + serviceFee,
      currency: "SOL",
    };
  }

  /**
   * Get detailed information about a privacy level
   */
  getPrivacyLevelInfo(level: PrivacyLevel): {
    name: string;
    description: string;
    features: string[];
    estimatedTime: string;
    sdksUsed: string[];
  } {
    const info: Record<
      PrivacyLevel,
      {
        name: string;
        description: string;
        features: string[];
        estimatedTime: string;
        sdksUsed: string[];
      }
    > = {
      [PrivacyLevel.NONE]: {
        name: "No Privacy",
        description: "Standard transfer visible on-chain",
        features: ["Fastest transfer", "Lowest fees", "Full transparency"],
        estimatedTime: "~5 seconds",
        sdksUsed: ["Solana Web3.js"],
      },
      [PrivacyLevel.MEDIUM]: {
        name: "Amount Privacy",
        description:
          "Transaction amounts are hidden using zero-knowledge proofs (Bulletproofs)",
        features: [
          "Hidden amounts via ZK proofs",
          "Moderate fees",
          "Sender/recipient visible",
          "Internal/external transfer options",
        ],
        estimatedTime: "~15 seconds",
        sdksUsed: ["ShadowWire SDK"],
      },
      [PrivacyLevel.HIGH]: {
        name: "Full Anonymity",
        description:
          "Complete transaction obfuscation through multi-hop routing and ZK proofs",
        features: [
          "Hidden amounts",
          "Anonymous sender",
          "Anonymous recipient",
          "Timing obfuscation",
          "Multi-hop routing",
        ],
        estimatedTime: "~2 minutes",
        sdksUsed: ["SilentSwap SDK", "ShadowWire SDK"],
      },
    };

    return info[level];
  }

  /**
   * Get supported tokens for privacy transfers
   */
  getSupportedTokens(): Currency[] {
    return this.shadowWire.getSupportedTokens();
  }

  /**
   * Check if a token is supported for privacy transfers
   */
  isTokenSupported(token: Currency): boolean {
    return this.shadowWire.isTokenSupported(token);
  }

  /**
   * Get privacy guarantees
   */
  getPrivacyGuarantees(): string[] {
    return this.shadowWire.getPrivacyGuarantees();
  }
}

// Singleton instance
let privacyServiceInstance: PrivacyService | null = null;

export function getPrivacyService(connection: Connection): PrivacyService {
  if (!privacyServiceInstance) {
    privacyServiceInstance = new PrivacyService(connection);
  }
  return privacyServiceInstance;
}

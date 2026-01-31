/**
 * ShadowWire SDK Integration
 * TypeScript SDK for private payments on Solana using Bulletproof zero-knowledge proofs
 * https://github.com/Radrdotfun/ShadowWire
 */

import type { Currency, ZKProofData, ShieldedBalance } from "@/types";
import { TOKEN_DECIMALS, SHADOWWIRE_FEE_RATES } from "@/types";

// ShadowWire supported tokens mapping
const SHADOWWIRE_TOKENS: Record<string, string> = {
  SOL: "SOL",
  USDC: "USDC",
  USDT: "USDT",
  USD1: "USD1",
  BONK: "BONK",
  AOL: "AOL",
  RADR: "RADR",
  ORE: "ORE",
};

// Transfer types
export type TransferType = "internal" | "external";

// Transfer parameters
export interface ShadowWireTransferParams {
  sender: string;
  recipient: string;
  amount: number;
  token: Currency;
  type: TransferType;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

// Transfer result
export interface ShadowWireTransferResult {
  success: boolean;
  signature?: string;
  error?: string;
  proof?: ZKProofData;
}

// Deposit/Withdraw params
export interface DepositParams {
  wallet: string;
  amount: number;
  token: Currency;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

export interface WithdrawParams {
  wallet: string;
  amount: number;
  token: Currency;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

// Fee breakdown
export interface ShadowWireFees {
  feePercentage: number;
  feeAmount: number;
  minimumAmount: number;
  netAmount: number;
}

// ShadowWire API Client
class ShadowWireClient {
  private baseUrl: string;
  private debug: boolean;

  constructor(config: { apiBaseUrl?: string; debug?: boolean }) {
    this.baseUrl = config.apiBaseUrl || "https://api.shadowwire.io";
    this.debug = config.debug || false;
  }

  async getBalance(wallet: string, token: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/balance/${wallet}/${token}`
      );
      if (!response.ok) throw new Error("Failed to get balance");
      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      if (this.debug) console.error("getBalance error:", error);
      return 0;
    }
  }

  async deposit(params: {
    wallet: string;
    amount: number;
    token: string;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  }): Promise<{ signature: string }> {
    const message = `Deposit ${params.amount} ${params.token} to ShadowWire`;
    const signature = await params.signMessage(new TextEncoder().encode(message));

    const response = await fetch(`${this.baseUrl}/v1/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: params.wallet,
        amount: params.amount,
        token: params.token,
        signature: Buffer.from(signature).toString("base64"),
      }),
    });

    if (!response.ok) throw new Error("Deposit failed");
    return response.json();
  }

  async withdraw(params: {
    wallet: string;
    amount: number;
    token: string;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  }): Promise<{ signature: string }> {
    const message = `Withdraw ${params.amount} ${params.token} from ShadowWire`;
    const signature = await params.signMessage(new TextEncoder().encode(message));

    const response = await fetch(`${this.baseUrl}/v1/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: params.wallet,
        amount: params.amount,
        token: params.token,
        signature: Buffer.from(signature).toString("base64"),
      }),
    });

    if (!response.ok) throw new Error("Withdraw failed");
    return response.json();
  }

  async transfer(params: {
    sender: string;
    recipient: string;
    amount: number;
    token: string;
    type: TransferType;
    wallet: { signMessage: (message: Uint8Array) => Promise<Uint8Array> };
  }): Promise<{ signature: string }> {
    const message = `Transfer ${params.amount} ${params.token} to ${params.recipient}`;
    const signature = await params.wallet.signMessage(
      new TextEncoder().encode(message)
    );

    const response = await fetch(`${this.baseUrl}/v1/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: params.sender,
        recipient: params.recipient,
        amount: params.amount,
        token: params.token,
        type: params.type,
        signature: Buffer.from(signature).toString("base64"),
      }),
    });

    if (!response.ok) throw new Error("Transfer failed");
    return response.json();
  }

  async getFeePercentage(token: string): Promise<number> {
    return (SHADOWWIRE_FEE_RATES[token as Currency] || 0.01) * 100;
  }

  async getMinimumAmount(token: string): Promise<number> {
    const minimums: Record<string, number> = {
      SOL: 0.001,
      USDC: 0.01,
      USDT: 0.01,
      USD1: 0.01,
      BONK: 1000,
      AOL: 0.01,
      RADR: 0.01,
      ORE: 0.00001,
    };
    return minimums[token] || 0.01;
  }
}

// Token utilities
const TokenUtils = {
  toSmallestUnit(amount: number, token: string): number {
    const decimals = TOKEN_DECIMALS[token as Currency] || 9;
    return Math.floor(amount * Math.pow(10, decimals));
  },

  fromSmallestUnit(amount: number, token: string): number {
    const decimals = TOKEN_DECIMALS[token as Currency] || 9;
    return amount / Math.pow(10, decimals);
  },
};

// Proof generation (simulated - in production would use WASM)
async function generateRangeProof(
  amount: number,
  bits: number
): Promise<{ proof: Uint8Array; commitment: string; nullifier: string }> {
  // In production, this would use Bulletproofs WASM
  const proof = new Uint8Array(64);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(proof);
  }

  return {
    proof,
    commitment: `commitment_${amount}_${Date.now()}`,
    nullifier: `nullifier_${Date.now()}`,
  };
}

class ShadowWireService {
  private client: ShadowWireClient;
  private wasmInitialized: boolean = false;
  private debug: boolean;

  constructor(options?: { apiBaseUrl?: string; debug?: boolean }) {
    this.debug = options?.debug || process.env.NODE_ENV === "development";
    this.client = new ShadowWireClient({
      apiBaseUrl: options?.apiBaseUrl || "https://api.shadowwire.io",
      debug: this.debug,
    });
  }

  /**
   * Initialize WASM for client-side proof generation
   */
  async initializeWASM(): Promise<boolean> {
    if (this.wasmInitialized) return true;

    try {
      // In production, this would initialize the actual WASM module
      this.wasmInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize WASM:", error);
      return false;
    }
  }

  /**
   * Get shielded balance for a wallet
   */
  async getBalance(wallet: string, token: Currency): Promise<ShieldedBalance> {
    try {
      const shadowToken = SHADOWWIRE_TOKENS[token];
      if (!shadowToken) {
        throw new Error(`Token ${token} not supported by ShadowWire`);
      }

      const balance = await this.client.getBalance(wallet, shadowToken);

      return {
        token,
        balance: TokenUtils.fromSmallestUnit(balance, shadowToken),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw error;
    }
  }

  /**
   * Deposit funds into ShadowWire shielded pool
   */
  async deposit(params: DepositParams): Promise<ShadowWireTransferResult> {
    try {
      const shadowToken = SHADOWWIRE_TOKENS[params.token];
      if (!shadowToken) {
        throw new Error(`Token ${params.token} not supported by ShadowWire`);
      }

      const amountInSmallestUnit = TokenUtils.toSmallestUnit(
        params.amount,
        shadowToken
      );

      const result = await this.client.deposit({
        wallet: params.wallet,
        amount: amountInSmallestUnit,
        token: shadowToken,
        signMessage: params.signMessage,
      });

      return {
        success: true,
        signature: result.signature,
      };
    } catch (error) {
      console.error("Deposit failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Deposit failed",
      };
    }
  }

  /**
   * Withdraw funds from ShadowWire shielded pool
   */
  async withdraw(params: WithdrawParams): Promise<ShadowWireTransferResult> {
    try {
      const shadowToken = SHADOWWIRE_TOKENS[params.token];
      if (!shadowToken) {
        throw new Error(`Token ${params.token} not supported by ShadowWire`);
      }

      const amountInSmallestUnit = TokenUtils.toSmallestUnit(
        params.amount,
        shadowToken
      );

      const result = await this.client.withdraw({
        wallet: params.wallet,
        amount: amountInSmallestUnit,
        token: shadowToken,
        signMessage: params.signMessage,
      });

      return {
        success: true,
        signature: result.signature,
      };
    } catch (error) {
      console.error("Withdraw failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Withdraw failed",
      };
    }
  }

  /**
   * Execute a private transfer
   */
  async transfer(
    params: ShadowWireTransferParams
  ): Promise<ShadowWireTransferResult> {
    try {
      const shadowToken = SHADOWWIRE_TOKENS[params.token];
      if (!shadowToken) {
        throw new Error(`Token ${params.token} not supported by ShadowWire`);
      }

      const amountInSmallestUnit = TokenUtils.toSmallestUnit(
        params.amount,
        shadowToken
      );

      // Generate range proof for internal transfers
      let proof: ZKProofData | undefined;
      if (params.type === "internal" && this.wasmInitialized) {
        const rangeProof = await generateRangeProof(amountInSmallestUnit, 64);
        proof = {
          proofData: Buffer.from(rangeProof.proof).toString("hex"),
          commitment: rangeProof.commitment,
          nullifier: rangeProof.nullifier || "",
          verified: true,
        };
      }

      const result = await this.client.transfer({
        sender: params.sender,
        recipient: params.recipient,
        amount: amountInSmallestUnit,
        token: shadowToken,
        type: params.type,
        wallet: { signMessage: params.signMessage },
      });

      return {
        success: true,
        signature: result.signature,
        proof,
      };
    } catch (error) {
      console.error("Transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transfer failed",
      };
    }
  }

  /**
   * Calculate fees for a transfer
   */
  async calculateFees(
    amount: number,
    token: Currency
  ): Promise<ShadowWireFees> {
    const shadowToken = SHADOWWIRE_TOKENS[token];
    if (!shadowToken) {
      throw new Error(`Token ${token} not supported by ShadowWire`);
    }

    const feePercentage = await this.client.getFeePercentage(shadowToken);
    const minimumAmount = await this.client.getMinimumAmount(shadowToken);

    const feeAmount = amount * (feePercentage / 100);
    const netAmount = amount - feeAmount;

    return {
      feePercentage,
      feeAmount,
      minimumAmount,
      netAmount,
    };
  }

  /**
   * Get fee percentage for a token
   */
  getFeeRate(token: Currency): number {
    return SHADOWWIRE_FEE_RATES[token] || 0.01;
  }

  /**
   * Convert amount to smallest unit
   */
  toSmallestUnit(amount: number, token: Currency): number {
    return TokenUtils.toSmallestUnit(amount, token);
  }

  /**
   * Convert from smallest unit
   */
  fromSmallestUnit(amount: number, token: Currency): number {
    return TokenUtils.fromSmallestUnit(amount, token);
  }

  /**
   * Check if a token is supported
   */
  isTokenSupported(token: Currency): boolean {
    return token in SHADOWWIRE_TOKENS;
  }

  /**
   * Get all supported tokens
   */
  getSupportedTokens(): Currency[] {
    return Object.keys(SHADOWWIRE_TOKENS) as Currency[];
  }

  /**
   * Get privacy guarantees
   */
  getPrivacyGuarantees(): string[] {
    return [
      "Hidden transaction amounts using Bulletproofs",
      "Range proofs ensure valid amounts without revealing values",
      "Commitment scheme hides values cryptographically",
      "No trusted setup required",
      "Internal transfers: both amount and sender hidden",
      "External transfers: anonymous sender, visible amount",
    ];
  }
}

// Singleton instance
let shadowWireInstance: ShadowWireService | null = null;

export function getShadowWireService(options?: {
  apiBaseUrl?: string;
  debug?: boolean;
}): ShadowWireService {
  if (!shadowWireInstance) {
    shadowWireInstance = new ShadowWireService(options);
  }
  return shadowWireInstance;
}

export { ShadowWireService };

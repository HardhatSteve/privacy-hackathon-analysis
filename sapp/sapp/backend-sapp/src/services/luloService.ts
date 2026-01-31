// Lulo API Service
// Provides yield farming functionality through Lulo protocol

// Import types from dedicated type files
import type {
  LuloPool,
  LuloRate,
  LuloPoolWithRate,
  LuloPosition,
  LuloPendingWithdrawal,
  LuloAccount,
  LuloDepositRequest,
  LuloWithdrawRequest,
  LuloTransactionResponse,
} from '../types/lulo.types.js';

// Import constants and utilities
import { getTokenMetadata } from '../constants/tokens.js';
import { LULO_API_URL, LULO_DEFAULT_REFERRER } from '../constants/api.js';
import { formatAPY, formatTVL } from '../utils/formatting.js';

// Re-export types for consumers
export type {
  LuloPool,
  LuloRate,
  LuloPoolWithRate,
  LuloPosition,
  LuloPendingWithdrawal,
  LuloAccount,
  LuloDepositRequest,
  LuloWithdrawRequest,
  LuloTransactionResponse,
};

// MARK: - Service Class

class LuloService {
  private readonly apiKey: string;
  private readonly referrer: string;

  // Cache for pools (refresh every 5 minutes)
  private poolsCache: LuloPoolWithRate[] | null = null;
  private poolsCacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.LULO_API_KEY || '';
    this.referrer = process.env.LULO_REFERRER || LULO_DEFAULT_REFERRER;

    if (!this.apiKey) {
      console.warn('[LuloService] LULO_API_KEY not configured');
    }

    console.log('[LuloService] Initialized');
  }

  // MARK: - Private Helpers

  private getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async fetchLulo<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${LULO_API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options?.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lulo API error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`[LuloService] Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private getTokenMeta(mintAddress: string) {
    return getTokenMetadata(mintAddress);
  }

  // MARK: - Pool Operations

  /**
   * Fetch pool data from Lulo API
   * Note: Lulo API returns a single USDC pool object, not an array of pools
   * Response format: { regular: { type, apy, ... }, protected: { type, apy, ... }, totalLiquidity, ... }
   */
  async getPoolsWithRates(): Promise<LuloPoolWithRate[]> {
    // Check cache
    const now = Date.now();
    if (this.poolsCache && now - this.poolsCacheTime < this.CACHE_TTL) {
      console.log('[LuloService] Returning cached pools');
      return this.poolsCache;
    }

    try {
      const response = await this.fetchLulo<any>('/pool.getPools');
      console.log('[LuloService] Raw pool response:', JSON.stringify(response).slice(0, 500));

      const poolsWithRates: LuloPoolWithRate[] = [];

      // Lulo API returns a single pool object for USDC with this structure:
      // { regular: { type, apy, maxWithdrawalAmount, price },
      //   protected: { type, apy, openCapacity, price },
      //   averagePoolRate, totalLiquidity, ... }
      if (response && (response.regular || response.protected)) {
        // USDC is the primary pool supported by Lulo
        const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const metadata = this.getTokenMeta(usdcMint);

        // APY from Lulo is in decimal form (e.g., 0.06 = 6%)
        // Convert to percentage for display
        const regularApy = (response.regular?.apy || 0) * 100;
        const protectedApy = (response.protected?.apy || 0) * 100;

        const pool: LuloPool = {
          mintAddress: usdcMint,
          tokenSymbol: metadata.symbol,
          tokenName: metadata.name,
          decimals: metadata.decimals,
          tvl: response.totalLiquidity?.toString() || '0',
          isActive: true,
        };

        const rate: LuloRate = {
          mintAddress: usdcMint,
          apy: regularApy,
          apyProtected: protectedApy,
        };

        poolsWithRates.push({ pool, rate });

        console.log(
          `[LuloService] Parsed USDC pool - Regular APY: ${regularApy.toFixed(2)}%, Protected APY: ${protectedApy.toFixed(2)}%, TVL: $${response.totalLiquidity?.toLocaleString()}`
        );
      } else {
        console.warn('[LuloService] Unexpected pool response format:', response);
      }

      // Update cache
      this.poolsCache = poolsWithRates;
      this.poolsCacheTime = now;

      console.log(`[LuloService] Loaded ${poolsWithRates.length} pool(s)`);
      return poolsWithRates;
    } catch (error) {
      console.error('[LuloService] Error fetching pools:', error);
      throw error;
    }
  }

  async getRates(): Promise<LuloRate[]> {
    // Get rates from the pools endpoint since it includes APY data
    const pools = await this.getPoolsWithRates();
    return pools.map((p) => p.rate);
  }

  async getPool(mintAddress: string): Promise<LuloPoolWithRate | null> {
    const pools = await this.getPoolsWithRates();
    return pools.find((p) => p.pool.mintAddress === mintAddress) || null;
  }

  // MARK: - Account Operations

  async getAccount(walletAddress: string): Promise<LuloAccount> {
    const response = await this.fetchLulo<any>(
      `/account.getAccount?owner=${encodeURIComponent(walletAddress)}`
    );

    const positions: LuloPosition[] = [];

    if (response && Array.isArray(response.deposits)) {
      for (const deposit of response.deposits) {
        const metadata = this.getTokenMeta(deposit.mintAddress || deposit.mint);
        const regularBalance = parseFloat(deposit.regularBalance || deposit.balance || '0');
        const protectedBalance = parseFloat(deposit.protectedBalance || '0');

        positions.push({
          mintAddress: deposit.mintAddress || deposit.mint,
          tokenSymbol: metadata.symbol,
          regularBalance: regularBalance.toString(),
          protectedBalance: protectedBalance.toString(),
          totalBalance: (regularBalance + protectedBalance).toString(),
          earnings: deposit.earnings?.toString() || '0',
        });
      }
    }

    return {
      owner: walletAddress,
      positions,
      totalValueUsd: response?.totalValueUsd?.toString() || '0',
    };
  }

  async getPendingWithdrawals(walletAddress: string): Promise<LuloPendingWithdrawal[]> {
    const response = await this.fetchLulo<any>(
      `/account.withdrawals.listPendingWithdrawals?owner=${encodeURIComponent(walletAddress)}`
    );

    const withdrawals: LuloPendingWithdrawal[] = [];

    if (response && Array.isArray(response.withdrawals)) {
      for (const withdrawal of response.withdrawals) {
        withdrawals.push({
          id: withdrawal.id || withdrawal.withdrawalId,
          mintAddress: withdrawal.mintAddress || withdrawal.mint,
          amount: withdrawal.amount?.toString() || '0',
          requestedAt: withdrawal.requestedAt || withdrawal.createdAt,
          estimatedCompletionAt: withdrawal.estimatedCompletionAt || withdrawal.expectedAt,
        });
      }
    }

    return withdrawals;
  }

  // MARK: - Transaction Generation

  async generateDepositTransaction(request: LuloDepositRequest): Promise<LuloTransactionResponse> {
    const body = {
      owner: request.owner,
      feePayer: request.feePayer || request.owner,
      mintAddress: request.mintAddress,
      regularAmount: request.regularAmount || 0,
      protectedAmount: request.protectedAmount || 0,
      referrer: request.referrer || this.referrer,
    };

    console.log('[LuloService] Generating deposit transaction:', body);

    const response = await this.fetchLulo<any>('/generate.transactions.deposit', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      transaction: response.transaction || response.tx,
      message: response.message,
    };
  }

  async generateWithdrawTransaction(request: LuloWithdrawRequest): Promise<LuloTransactionResponse> {
    const body = {
      owner: request.owner,
      feePayer: request.feePayer || request.owner,
      mintAddress: request.mintAddress,
      amount: request.amount,
    };

    console.log('[LuloService] Generating withdraw transaction:', body);

    const response = await this.fetchLulo<any>('/generate.transactions.withdrawProtected', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      transaction: response.transaction || response.tx,
      message: response.message,
    };
  }

  // MARK: - Utility Methods (delegate to shared utils)

  formatPoolAPY(apy: number): string {
    return formatAPY(apy);
  }

  formatPoolTVL(tvl: string): string {
    return formatTVL(tvl);
  }
}

// Export singleton instance
export const luloService = new LuloService();

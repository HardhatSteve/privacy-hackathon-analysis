/**
 * Lulo Types
 * Yield farming/lending protocol integration
 */

/**
 * Pool information
 */
export interface LuloPool {
  mintAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: number;
  tvl: string;
  isActive: boolean;
}

/**
 * APY rates for a pool
 */
export interface LuloRate {
  mintAddress: string;
  apy: number;
  apyProtected: number;
}

/**
 * Pool with rate information combined
 */
export interface LuloPoolWithRate {
  pool: LuloPool;
  rate: LuloRate;
}

/**
 * User position in a pool
 */
export interface LuloPosition {
  mintAddress: string;
  tokenSymbol: string;
  regularBalance: string;
  protectedBalance: string;
  totalBalance: string;
  earnings: string;
}

/**
 * Pending withdrawal information
 */
export interface LuloPendingWithdrawal {
  id: string;
  mintAddress: string;
  amount: string;
  requestedAt: string;
  estimatedCompletionAt: string;
}

/**
 * User account information
 */
export interface LuloAccount {
  owner: string;
  positions: LuloPosition[];
  totalValueUsd: string;
}

/**
 * Deposit request
 */
export interface LuloDepositRequest {
  owner: string;
  feePayer?: string;
  mintAddress: string;
  regularAmount?: number;
  protectedAmount?: number;
  referrer?: string;
}

/**
 * Withdraw request
 */
export interface LuloWithdrawRequest {
  owner: string;
  feePayer?: string;
  mintAddress: string;
  amount: number;
}

/**
 * Transaction response (unsigned for client-side signing)
 */
export interface LuloTransactionResponse {
  transaction: string; // Base64 encoded transaction
  message?: string;
}

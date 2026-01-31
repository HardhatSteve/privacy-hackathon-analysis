/**
 * ShadowWire Types
 * Privacy-preserving transfer functionality
 */

// Transfer types
export type TransferType = 'internal' | 'external';

/**
 * Transfer request with server-side signing via Privy
 */
export interface TransferRequest {
  senderWallet: string;
  recipientWallet: string;
  amount: number;
  token: string;
  type: TransferType;
  /** Privy wallet ID for server-side signing */
  walletId: string;
  /** User's Privy JWT for authorization */
  userJwt: string;
}

/**
 * Transfer response returned to client
 */
export interface TransferResponse {
  success: boolean;
  signature: string;
  amount: number | null; // null for internal transfers
  token: string;
  type: TransferType;
  fee: number;
  timestamp: Date;
}

/**
 * Fee breakdown for UI display
 */
export interface FeeBreakdown {
  amount: number;
  feePercentage: number;
  feeAmount: number;
  netAmount: number;
  minimumAmount: number;
}

/**
 * Deposit response
 */
export interface DepositResponse {
  success: boolean;
  txHash: string;
}

/**
 * Withdraw response
 */
export interface WithdrawResponse {
  success: boolean;
  txHash: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

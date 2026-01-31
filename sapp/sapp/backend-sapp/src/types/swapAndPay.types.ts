/**
 * Swap And Pay Types
 * Combined swap and payment functionality for fulfilling payment requests
 */

import { TransferType } from './shadowWire.types';

/**
 * Swap suggestion representing a token the user can swap from
 */
export interface SwapSuggestion {
  fromToken: string;
  fromAmount: number;
  toToken: string;
  toAmount: number;
  estimatedFee: number;
  userBalance: number;
  isRecommended: boolean;
  priority: number;
}

/**
 * Request to get swap suggestions for a payment
 */
export interface SwapSuggestionsRequest {
  walletAddress: string;
  targetToken: string;
  targetAmount: number;
}

/**
 * Response with swap suggestions
 */
export interface SwapSuggestionsResponse {
  suggestions: SwapSuggestion[];
  targetToken: string;
  targetAmount: number;
}

/**
 * Request to execute combined swap and payment
 */
export interface SwapAndPayRequest {
  // Swap parameters
  fromToken: string;
  fromChain: string;
  swapAmount: string;
  evmAddress: string;
  entropy: string;

  // Payment parameters
  paymentToken: string;
  paymentAmount: number;
  recipientHandle: string;
  paymentType: TransferType;
  paymentRequestId?: string;

  // Auth
  senderWallet: string;
  walletId: string;
  userJwt: string;
}

/**
 * Result of swap operation
 */
export interface SwapResult {
  orderId: string;
  amountSwapped: string;
  amountReceived: string;
  signature?: string;
}

/**
 * Result of payment operation
 */
export interface PaymentResult {
  signature: string;
  amount: number;
  token: string;
  type: TransferType;
  recipientHandle: string;
}

/**
 * Error information for swap and pay operations
 */
export interface SwapAndPayErrorInfo {
  stage: 'swap' | 'payment';
  code: string;
  message: string;
  swapCompleted?: boolean;
}

/**
 * Response from swap and pay operation
 */
export interface SwapAndPayResponse {
  success: boolean;
  swapResult?: SwapResult;
  paymentResult?: PaymentResult;
  error?: SwapAndPayErrorInfo;
}

/**
 * Operation status for tracking
 */
export interface SwapAndPayOperationStatus {
  operationId: string;
  status: 'pending' | 'swap_executing' | 'swap_complete' | 'payment_executing' | 'complete' | 'failed';
  progress: number;
  message: string;
  swapResult?: SwapResult;
  paymentResult?: PaymentResult;
  error?: SwapAndPayErrorInfo;
}

/**
 * SilentSwap Types
 * Cross-chain swap functionality via SilentSwap SDK
 */

// Supported chains for swaps
export type SupportedChain = 'solana' | 'ethereum' | 'avalanche';

// Swap status
export type SwapStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Bridge providers
export type BridgeProvider = 'relay' | 'debridge';

/**
 * Quote request for a SilentSwap
 */
export interface SilentSwapQuoteRequest {
  fromToken: string; // CAIP-19 format or token symbol
  toToken: string; // CAIP-19 format or token symbol
  amount: string; // Human-readable amount
  fromChain: SupportedChain;
  toChain: SupportedChain;
  recipientAddress: string; // Address on destination chain
  senderAddress: string; // Address on source chain (Solana or EVM)
  evmAddress: string; // User's EVM wallet address (for facilitator group)
  entropy: string; // User's entropy (0x-prefixed hex string)
}

/**
 * Quote response from SilentSwap
 */
export interface SilentSwapQuoteResponse {
  quoteId: string;
  estimatedOutput: string; // Human-readable amount
  estimatedFee: string; // In USDC
  bridgeProvider: BridgeProvider;
  route: {
    sourceChain: string;
    destinationChain: string;
    bridgeViaUsdc: boolean;
  };
  rawQuote: any; // Full quote for iOS to sign authorizations
}

/**
 * Signed authorization from iOS
 */
export interface SignedAuthorization {
  type: string;
  signature: string;
  [key: string]: any;
}

/**
 * Execute swap request
 */
export interface SilentSwapExecuteRequest {
  quoteId: string;
  evmAddress: string;
  entropy: string;
  signedAuthorizations: SignedAuthorization[];
  orderSignature: string;
  eip712Domain: any;
  rawQuote: any;
}

/**
 * Execute swap response
 */
export interface SilentSwapExecuteResponse {
  orderId: string;
  status: SwapStatus;
  transaction: any; // Transaction to be sent by iOS
  estimatedCompletionTime: number; // seconds
}

/**
 * Swap status response
 */
export interface SilentSwapStatusResponse {
  orderId: string;
  status: SwapStatus;
  depositTxHash?: string;
  completionTxHash?: string;
  error?: string;
}

/**
 * Nonce response for SIWE authentication
 */
export interface NonceResponse {
  nonce: string;
}

/**
 * Auth response with secret token
 */
export interface AuthResponse {
  secretToken: string;
}

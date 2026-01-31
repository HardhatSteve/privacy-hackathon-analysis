/**
 * Quote Request Types and Validation Schemas
 * 
 * Types for quote request creation, management, and lifecycle.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1-10.8
 */

import { z } from 'zod';
import {
  AssetPair,
  TradeDirection,
  QuoteRequestStatus,
  PedersenCommitment,
  StealthAddress,
  WOTSSignature,
  WOTSPublicKey,
  Nullifier,
  Timestamp,
  AmountString,
  AssetPairSchema,
  TradeDirectionSchema,
  AmountSchema,
  FutureTimestampSchema,
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
} from './common.types';

/**
 * Quote Request Interface
 * 
 * Represents a private request from a taker to buy or sell assets.
 * Uses Pedersen commitments to hide amounts and stealth addresses for privacy.
 */
export interface QuoteRequest {
  /** Unique identifier for the quote request */
  id: string;
  
  /** Asset pair (e.g., "SOL/USDC") */
  assetPair: AssetPair;
  
  /** Trade direction (buy or sell) */
  direction: TradeDirection;
  
  /** Pedersen commitment hiding the actual amount */
  amountCommitment: PedersenCommitment;
  
  /** Stealth address for receiving responses */
  stealthAddress: StealthAddress;
  
  /** Taker's public key for signature verification */
  takerPublicKey: WOTSPublicKey;
  
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: Timestamp;
  
  /** Expiration timestamp (milliseconds since epoch) */
  expiresAt: Timestamp;
  
  /** Current status of the quote request */
  status: QuoteRequestStatus;
  
  /** Nullifier (set when quote request is filled) */
  nullifier?: Nullifier;
}

/**
 * Create Quote Request Request
 * 
 * Request body for creating a new quote request.
 * Requirement 1.1: Taker submits quote request with asset pair, direction, amount, timeout
 */
export interface CreateQuoteRequestRequest {
  /** Asset pair in format TOKEN1/TOKEN2 */
  assetPair: AssetPair;
  
  /** Trade direction (buy or sell) */
  direction: TradeDirection;
  
  /** Amount as string (to avoid precision issues) */
  amount: AmountString;
  
  /** Expiration timestamp (milliseconds since epoch) */
  timeout: Timestamp;
  
  /** WOTS+ signature for authentication */
  signature: WOTSSignature;
  
  /** Taker's public key */
  publicKey: WOTSPublicKey;
  
  /** Original message that was signed (for verification) */
  message: string;
}

/**
 * Create Quote Request Response
 * 
 * Response after successfully creating a quote request.
 * Requirement 1.6: Return quote_request_id and stealth_address
 */
export interface CreateQuoteRequestResponse {
  /** Success indicator */
  success: true;
  
  /** Unique identifier for the created quote request */
  quoteRequestId: string;
  
  /** Stealth address for receiving responses */
  stealthAddress: StealthAddress;
  
  /** Pedersen commitment for the amount */
  commitment: PedersenCommitment;
  
  /** Expiration timestamp */
  expiresAt: Timestamp;
}

/**
 * Cancel Quote Request Request
 * 
 * Request body for cancelling a quote request.
 * Requirement 10.5: Taker requests to cancel their quote request
 */
export interface CancelQuoteRequestRequest {
  /** WOTS+ signature for authentication */
  signature: WOTSSignature;
  
  /** Taker's public key */
  publicKey: WOTSPublicKey;
}

/**
 * Cancel Quote Request Response
 * 
 * Response after successfully cancelling a quote request.
 * Requirement 10.8: Return confirmation to taker
 */
export interface CancelQuoteRequestResponse {
  /** Success indicator */
  success: true;
  
  /** Quote request ID that was cancelled */
  quoteRequestId: string;
  
  /** New status (should be "cancelled") */
  status: QuoteRequestStatus.CANCELLED;
}

/**
 * Get Quote Request Response
 * 
 * Response when retrieving a quote request by ID.
 */
export interface GetQuoteRequestResponse {
  /** Success indicator */
  success: true;
  
  /** Quote request data */
  quoteRequest: QuoteRequest;
}

// Zod Validation Schemas

/**
 * Create Quote Request validation schema
 * 
 * Validates all fields for quote request creation.
 * Requirements: 1.1, 1.7, 37.1, 37.2
 */
export const CreateQuoteRequestSchema = z.object({
  assetPair: AssetPairSchema,
  direction: TradeDirectionSchema,
  amount: AmountSchema,
  timeout: FutureTimestampSchema.refine(
    (val) => val <= Date.now() + 24 * 60 * 60 * 1000,
    { message: 'Timeout cannot exceed 24 hours from now' }
  ),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  message: z.string().min(1, 'Message is required'),
});

/**
 * Cancel Quote Request validation schema
 * 
 * Validates fields for quote request cancellation.
 * Requirements: 10.5, 37.1, 37.2
 */
export const CancelQuoteRequestSchema = z.object({
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * Quote Request ID parameter validation schema
 */
export const QuoteRequestIdSchema = z.object({
  id: z.string().uuid('Invalid quote request ID format'),
});

/**
 * Type inference from Zod schemas
 */
export type CreateQuoteRequestInput = z.infer<typeof CreateQuoteRequestSchema>;
export type CancelQuoteRequestInput = z.infer<typeof CancelQuoteRequestSchema>;
export type QuoteRequestIdInput = z.infer<typeof QuoteRequestIdSchema>;

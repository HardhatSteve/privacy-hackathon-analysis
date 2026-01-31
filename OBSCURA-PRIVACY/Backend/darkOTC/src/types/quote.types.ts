/**
 * Quote Types and Validation Schemas
 * 
 * Types for market maker quote submission and acceptance.
 * Validates: Requirements 2.1-2.8, 3.1-3.9
 */

import { z } from 'zod';
import {
  QuoteStatus,
  PedersenCommitment,
  WOTSSignature,
  WOTSPublicKey,
  Nullifier,
  TransactionHash,
  Timestamp,
  AmountString,
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
  FutureTimestampSchema,
  AmountSchema,
} from './common.types';

/**
 * Quote Interface
 * 
 * Represents a price offer from a market maker in response to a quote request.
 * Uses Pedersen commitments to hide the actual price.
 */
export interface Quote {
  /** Unique identifier for the quote */
  id: string;
  
  /** Reference to the quote request */
  quoteRequestId: string;
  
  /** Pedersen commitment hiding the actual price */
  priceCommitment: PedersenCommitment;
  
  /** Market maker's public key */
  marketMakerPublicKey: WOTSPublicKey;
  
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: Timestamp;
  
  /** Expiration timestamp (milliseconds since epoch) */
  expiresAt: Timestamp;
  
  /** Current status of the quote */
  status: QuoteStatus;
}

/**
 * Submit Quote Request
 * 
 * Request body for submitting a quote.
 * Requirement 2.1: Market maker submits quote with quote_request_id, price, expiration
 */
export interface SubmitQuoteRequest {
  /** Quote request ID this quote is responding to */
  quoteRequestId: string;
  
  /** Price as string (to avoid precision issues) */
  price: AmountString;
  
  /** Quote expiration timestamp (milliseconds since epoch) */
  expirationTime: Timestamp;
  
  /** WOTS+ signature for authentication */
  signature: WOTSSignature;
  
  /** Market maker's public key */
  publicKey: WOTSPublicKey;
}

/**
 * Submit Quote Response
 * 
 * Response after successfully submitting a quote.
 * Requirement 2.7: Return quote_id to market maker
 */
export interface SubmitQuoteResponse {
  /** Success indicator */
  success: true;
  
  /** Unique identifier for the created quote */
  quoteId: string;
  
  /** Pedersen commitment for the price */
  priceCommitment: PedersenCommitment;
  
  /** Expiration timestamp */
  expiresAt: Timestamp;
}

/**
 * Quote Summary
 * 
 * Summary information about a quote (for listing quotes).
 * Requirement 3.1: Return all valid non-expired quotes
 */
export interface QuoteSummary {
  /** Quote ID */
  quoteId: string;
  
  /** Price commitment (actual price is hidden) */
  priceCommitment: PedersenCommitment;
  
  /** Expiration timestamp */
  expiresAt: Timestamp;
  
  /** Current status */
  status: QuoteStatus;
}

/**
 * Get Quotes Response
 * 
 * Response when retrieving all quotes for a quote request.
 * Requirement 3.1: Return all valid non-expired quotes with commitments
 */
export interface GetQuotesResponse {
  /** Success indicator */
  success: true;
  
  /** Array of quote summaries */
  quotes: QuoteSummary[];
}

/**
 * Accept Quote Request
 * 
 * Request body for accepting a quote.
 * Requirement 3.2: Taker selects a quote by quote_id
 */
export interface AcceptQuoteRequest {
  /** Quote request ID (for verification) */
  quoteRequestId: string;
  
  /** WOTS+ signature for authentication */
  signature: WOTSSignature;
  
  /** Taker's public key */
  publicKey: WOTSPublicKey;
}

/**
 * Accept Quote Response
 * 
 * Response after successfully accepting a quote.
 * Requirement 3.8: Return confirmation with nullifier
 */
export interface AcceptQuoteResponse {
  /** Success indicator */
  success: true;
  
  /** Nullifier for double-spend protection */
  nullifier: Nullifier;
  
  /** Transaction hash from settlement */
  txHash: TransactionHash;
  
  /** Whether ZK compression was used (Solana only) */
  zkCompressed: boolean;
  
  /** Compression signature (Solana only, if zkCompressed is true) */
  compressionSignature?: string;
}

/**
 * Get Quote Response
 * 
 * Response when retrieving a single quote by ID.
 */
export interface GetQuoteResponse {
  /** Success indicator */
  success: true;
  
  /** Quote data */
  quote: Quote;
}

// Zod Validation Schemas

/**
 * Submit Quote validation schema
 * 
 * Validates all fields for quote submission.
 * Requirements: 2.1, 2.8, 37.1, 37.2
 */
export const SubmitQuoteSchema = z.object({
  quoteRequestId: z.string().uuid('Invalid quote request ID format'),
  price: AmountSchema,
  expirationTime: FutureTimestampSchema,
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * Accept Quote validation schema
 * 
 * Validates fields for quote acceptance.
 * Requirements: 3.2, 3.9, 37.1, 37.2
 */
export const AcceptQuoteSchema = z.object({
  quoteRequestId: z.string().uuid('Invalid quote request ID format'),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * Quote ID parameter validation schema
 */
export const QuoteIdSchema = z.object({
  id: z.string().uuid('Invalid quote ID format'),
});

/**
 * Type inference from Zod schemas
 */
export type SubmitQuoteInput = z.infer<typeof SubmitQuoteSchema>;
export type AcceptQuoteInput = z.infer<typeof AcceptQuoteSchema>;
export type QuoteIdInput = z.infer<typeof QuoteIdSchema>;

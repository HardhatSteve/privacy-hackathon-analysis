/**
 * Message Types and Validation Schemas
 * 
 * Types for private messaging between takers and market makers.
 * Validates: Requirements 26.1-26.7
 */

import { z } from 'zod';
import {
  StealthAddress,
  EncryptedContent,
  WOTSSignature,
  WOTSPublicKey,
  Timestamp,
  StealthAddressSchema,
  EncryptedContentSchema,
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
} from './common.types';

/**
 * Message Interface
 * 
 * Represents a private encrypted message between taker and market maker.
 * Messages are encrypted using the recipient's stealth address.
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  
  /** Quote request this message is associated with */
  quoteRequestId: string;
  
  /** Sender's public key */
  senderPublicKey: WOTSPublicKey;
  
  /** Recipient's stealth address */
  recipientStealthAddress: StealthAddress;
  
  /** Encrypted message content (base64 encoded) */
  encryptedContent: EncryptedContent;
  
  /** Message timestamp (milliseconds since epoch) */
  timestamp: Timestamp;
}

/**
 * Send Message Request
 * 
 * Request body for sending a private message.
 * Requirement 26.1: Send message with quote_request_id, recipient stealth address, content
 */
export interface SendMessageRequest {
  /** Quote request ID this message is associated with */
  quoteRequestId: string;
  
  /** Recipient's stealth address */
  recipientStealthAddress: StealthAddress;
  
  /** Encrypted message content (base64 encoded) */
  encryptedContent: EncryptedContent;
  
  /** WOTS+ signature for authentication */
  signature: WOTSSignature;
  
  /** Sender's public key */
  publicKey: WOTSPublicKey;
}

/**
 * Send Message Response
 * 
 * Response after successfully sending a message.
 * Requirement 26.1: Return message_id and timestamp
 */
export interface SendMessageResponse {
  /** Success indicator */
  success: true;
  
  /** Unique identifier for the created message */
  messageId: string;
  
  /** Message timestamp */
  timestamp: Timestamp;
}

/**
 * Message Summary
 * 
 * Summary information about a message (for listing messages).
 * Requirement 26.5: Return messages where user is sender or recipient
 */
export interface MessageSummary {
  /** Message ID */
  messageId: string;
  
  /** Encrypted content */
  encryptedContent: EncryptedContent;
  
  /** Message timestamp */
  timestamp: Timestamp;
  
  /** Sender's public key (for identification) */
  senderPublicKey?: WOTSPublicKey;
  
  /** Recipient's stealth address (for identification) */
  recipientStealthAddress?: StealthAddress;
}

/**
 * Get Messages Response
 * 
 * Response when retrieving messages for a quote request.
 * Requirement 26.5: Return only messages where user is sender or recipient
 */
export interface GetMessagesResponse {
  /** Success indicator */
  success: true;
  
  /** Array of message summaries */
  messages: MessageSummary[];
}

/**
 * Decrypted Message
 * 
 * Message with decrypted content (for client-side use).
 * Requirement 26.6: Decrypt messages using user's private key
 */
export interface DecryptedMessage {
  /** Message ID */
  messageId: string;
  
  /** Decrypted message content */
  content: string;
  
  /** Message timestamp */
  timestamp: Timestamp;
  
  /** Sender's public key */
  senderPublicKey: WOTSPublicKey;
  
  /** Whether the current user is the sender */
  isSender: boolean;
}

// Zod Validation Schemas

/**
 * Send Message validation schema
 * 
 * Validates all fields for sending a message.
 * Requirements: 26.1, 26.7, 37.1, 37.2
 */
export const SendMessageSchema = z.object({
  quoteRequestId: z.string().uuid('Invalid quote request ID format'),
  recipientStealthAddress: StealthAddressSchema,
  encryptedContent: EncryptedContentSchema.refine(
    (val) => val.length > 0,
    { message: 'Message content cannot be empty' }
  ),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * Get Messages query parameter validation schema
 */
export const GetMessagesQuerySchema = z.object({
  /** Optional: Filter by sender public key */
  senderPublicKey: WOTSPublicKeySchema.optional(),
  
  /** Optional: Filter by recipient stealth address */
  recipientStealthAddress: StealthAddressSchema.optional(),
  
  /** Optional: Limit number of messages returned */
  limit: z.number().int().positive().max(100).optional(),
  
  /** Optional: Offset for pagination */
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Type inference from Zod schemas
 */
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type GetMessagesQueryInput = z.infer<typeof GetMessagesQuerySchema>;

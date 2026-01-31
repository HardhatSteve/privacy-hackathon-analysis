/**
 * Whitelist Types and Validation Schemas
 * 
 * Types for market maker authorization and whitelist management.
 * Validates: Requirements 33.1-33.6
 */

import { z } from 'zod';
import {
  BlockchainAddress,
  WOTSSignature,
  Timestamp,
  BlockchainAddressSchema,
  WOTSSignatureSchema,
} from './common.types';

/**
 * Whitelist Entry Interface
 * 
 * Represents an authorized market maker in the whitelist.
 * Requirement 33.1: Store address as authorized market maker
 */
export interface WhitelistEntry {
  /** Market maker's blockchain address */
  address: BlockchainAddress;
  
  /** Timestamp when address was added (milliseconds since epoch) */
  addedAt: Timestamp;
  
  /** Admin address that added this market maker */
  addedBy: BlockchainAddress;
}

/**
 * Add to Whitelist Request
 * 
 * Request body for adding a market maker to the whitelist.
 * Requirement 33.1: Administrator adds address to whitelist
 */
export interface AddToWhitelistRequest {
  /** Market maker's address to add */
  address: BlockchainAddress;
  
  /** Admin signature for authorization */
  signature: WOTSSignature;
}

/**
 * Add to Whitelist Response
 * 
 * Response after successfully adding a market maker to the whitelist.
 * Requirement 33.1: Confirm address added with timestamp
 */
export interface AddToWhitelistResponse {
  /** Success indicator */
  success: true;
  
  /** Address that was added */
  address: BlockchainAddress;
  
  /** Timestamp when added */
  addedAt: Timestamp;
}

/**
 * Remove from Whitelist Request
 * 
 * Request body for removing a market maker from the whitelist.
 * Requirement 33.2: Administrator removes address from whitelist
 */
export interface RemoveFromWhitelistRequest {
  /** Market maker's address to remove */
  address: BlockchainAddress;
  
  /** Admin signature for authorization */
  signature: WOTSSignature;
}

/**
 * Remove from Whitelist Response
 * 
 * Response after successfully removing a market maker from the whitelist.
 * Requirement 33.2: Confirm address removed with timestamp
 */
export interface RemoveFromWhitelistResponse {
  /** Success indicator */
  success: true;
  
  /** Address that was removed */
  address: BlockchainAddress;
  
  /** Timestamp when removed */
  removedAt: Timestamp;
}

/**
 * Get Whitelist Response
 * 
 * Response when retrieving the current whitelist.
 * Requirement 33.5: Return all authorized market maker addresses
 */
export interface GetWhitelistResponse {
  /** Success indicator */
  success: true;
  
  /** Array of whitelisted addresses */
  addresses: BlockchainAddress[];
  
  /** Optional: Full whitelist entries with metadata */
  entries?: WhitelistEntry[];
}

/**
 * Check Whitelist Request
 * 
 * Request to check if an address is whitelisted.
 * Requirement 33.3: Verify address exists in whitelist
 */
export interface CheckWhitelistRequest {
  /** Address to check */
  address: BlockchainAddress;
}

/**
 * Check Whitelist Response
 * 
 * Response indicating if an address is whitelisted.
 * Requirement 33.3: Return whitelist status
 */
export interface CheckWhitelistResponse {
  /** Success indicator */
  success: true;
  
  /** Address that was checked */
  address: BlockchainAddress;
  
  /** Whether the address is whitelisted */
  isWhitelisted: boolean;
  
  /** Optional: Whitelist entry details if whitelisted */
  entry?: WhitelistEntry;
}

/**
 * Whitelist Audit Log Entry
 * 
 * Represents a whitelist change for audit purposes.
 * Requirement 33.6: Log whitelist changes for audit
 */
export interface WhitelistAuditLog {
  /** Unique identifier for the audit log entry */
  id: string;
  
  /** Action performed (add or remove) */
  action: 'add' | 'remove';
  
  /** Address that was added or removed */
  address: BlockchainAddress;
  
  /** Admin who performed the action */
  adminAddress: BlockchainAddress;
  
  /** Timestamp of the action */
  timestamp: Timestamp;
  
  /** Optional: Reason for the action */
  reason?: string;
}

// Zod Validation Schemas

/**
 * Add to Whitelist validation schema
 * 
 * Validates fields for adding a market maker to the whitelist.
 * Requirements: 33.1, 37.1, 37.2
 */
export const AddToWhitelistSchema = z.object({
  address: BlockchainAddressSchema,
  signature: WOTSSignatureSchema,
});

/**
 * Remove from Whitelist validation schema
 * 
 * Validates fields for removing a market maker from the whitelist.
 * Requirements: 33.2, 37.1, 37.2
 */
export const RemoveFromWhitelistSchema = z.object({
  address: BlockchainAddressSchema,
  signature: WOTSSignatureSchema,
});

/**
 * Check Whitelist validation schema
 * 
 * Validates address for whitelist check.
 * Requirements: 33.3, 37.2
 */
export const CheckWhitelistSchema = z.object({
  address: BlockchainAddressSchema,
});

/**
 * Whitelist address parameter validation schema
 */
export const WhitelistAddressSchema = z.object({
  address: BlockchainAddressSchema,
});

/**
 * Type inference from Zod schemas
 */
export type AddToWhitelistInput = z.infer<typeof AddToWhitelistSchema>;
export type RemoveFromWhitelistInput = z.infer<typeof RemoveFromWhitelistSchema>;
export type CheckWhitelistInput = z.infer<typeof CheckWhitelistSchema>;
export type WhitelistAddressInput = z.infer<typeof WhitelistAddressSchema>;

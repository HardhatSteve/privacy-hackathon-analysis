/**
 * Common Types and Enums
 * 
 * Shared types used across the application.
 */

import { z } from 'zod';

/**
 * Direction of a trade (buy or sell)
 */
export enum TradeDirection {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Status of a quote request
 */
export enum QuoteRequestStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
}

/**
 * Status of a quote
 */
export enum QuoteStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ACCEPTED = 'accepted',
}

/**
 * Supported blockchain networks
 */
export enum Network {
  SOLANA_DEVNET = 'solana-devnet',
  SEPOLIA = 'sepolia',
}

/**
 * Supported tokens
 */
export enum Token {
  NATIVE = 'native', // SOL or ETH
  USDC = 'usdc',
  USDT = 'usdt',
}

/**
 * Asset pair format: TOKEN1/TOKEN2
 * Examples: "SOL/USDC", "ETH/USDT"
 */
export type AssetPair = string;

/**
 * Solana public key (base58 encoded)
 */
export type SolanaPublicKey = string;

/**
 * Ethereum address (0x prefixed hex)
 */
export type EthereumAddress = string;

/**
 * Generic blockchain address (Solana or Ethereum)
 */
export type BlockchainAddress = SolanaPublicKey | EthereumAddress;

/**
 * Transaction hash (blockchain specific format)
 */
export type TransactionHash = string;

/**
 * Pedersen commitment (hex encoded)
 */
export type PedersenCommitment = string;

/**
 * Stealth address (one-time address for privacy)
 */
export type StealthAddress = string;

/**
 * Nullifier (32 bytes, hex encoded)
 */
export type Nullifier = string;

/**
 * Nullifier hash (SHA256 of nullifier, hex encoded)
 */
export type NullifierHash = string;

/**
 * WOTS+ signature (post-quantum signature)
 */
export type WOTSSignature = string;

/**
 * Public key for WOTS+ signature verification
 */
export type WOTSPublicKey = string;

/**
 * Encrypted content (base64 encoded)
 */
export type EncryptedContent = string;

/**
 * Timestamp in milliseconds since epoch
 */
export type Timestamp = number;

/**
 * Amount as string (to avoid precision issues with large numbers)
 */
export type AmountString = string;

// Zod validation schemas for common types

/**
 * Asset pair validation schema
 * Format: TOKEN1/TOKEN2 (e.g., "SOL/USDC")
 */
export const AssetPairSchema = z
  .string()
  .regex(/^[A-Z]{2,10}\/[A-Z]{2,10}$/, 'Asset pair must be in format TOKEN1/TOKEN2')
  .describe('Asset pair in format TOKEN1/TOKEN2');

/**
 * Trade direction validation schema
 */
export const TradeDirectionSchema = z
  .enum(['buy', 'sell'])
  .describe('Trade direction (buy or sell)');

/**
 * Amount validation schema
 * Must be positive and at least 0.0003
 */
export const AmountSchema = z
  .string()
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num >= 0.0003;
    },
    { message: 'Amount must be a positive number >= 0.0003' }
  )
  .describe('Amount as string (minimum 0.0003)');

/**
 * Timestamp validation schema
 * Must be a positive integer
 */
export const TimestampSchema = z
  .number()
  .int()
  .positive()
  .describe('Timestamp in milliseconds since epoch');

/**
 * Future timestamp validation schema
 * Must be in the future
 */
export const FutureTimestampSchema = z
  .number()
  .int()
  .positive()
  .refine((val) => val > Date.now(), {
    message: 'Timestamp must be in the future',
  })
  .describe('Future timestamp in milliseconds');

/**
 * Solana public key validation schema
 * Base58 encoded, 32-44 characters
 */
export const SolanaPublicKeySchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana public key format')
  .describe('Solana public key (base58 encoded)');

/**
 * Ethereum address validation schema
 * 0x prefixed hex, 42 characters total
 */
export const EthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
  .describe('Ethereum address (0x prefixed hex)');

/**
 * Blockchain address validation schema
 * Accepts either Solana or Ethereum format
 */
export const BlockchainAddressSchema = z
  .string()
  .refine(
    (val) => {
      // Check if it's a valid Solana public key
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val)) return true;
      // Check if it's a valid Ethereum address
      if (/^0x[a-fA-F0-9]{40}$/.test(val)) return true;
      return false;
    },
    { message: 'Invalid blockchain address (must be Solana or Ethereum format)' }
  )
  .describe('Blockchain address (Solana or Ethereum)');

/**
 * Transaction hash validation schema
 * Hex encoded string
 */
export const TransactionHashSchema = z
  .string()
  .min(32)
  .describe('Transaction hash (blockchain specific format)');

/**
 * Pedersen commitment validation schema
 * Hex encoded string
 */
export const PedersenCommitmentSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, 'Invalid Pedersen commitment format')
  .describe('Pedersen commitment (hex encoded)');

/**
 * Stealth address validation schema
 */
export const StealthAddressSchema = z
  .string()
  .min(32)
  .describe('Stealth address (one-time address)');

/**
 * Nullifier validation schema
 * 32 bytes hex encoded (64 hex characters + 0x prefix)
 */
export const NullifierSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid nullifier format (must be 32 bytes hex)')
  .describe('Nullifier (32 bytes hex encoded)');

/**
 * Nullifier hash validation schema
 * SHA256 hash (32 bytes hex encoded)
 */
export const NullifierHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid nullifier hash format (must be 32 bytes hex)')
  .describe('Nullifier hash (SHA256, 32 bytes hex)');

/**
 * Wallet signature validation schema
 * WOTS+ signature is 2144 bytes = 4288 hex characters (with 0x prefix = 4290)
 */
export const WOTSSignatureSchema = z
  .string()
  .min(4288, 'WOTS+ signature must be at least 4288 characters (2144 bytes in hex)')
  .regex(/^(0x)?[a-fA-F0-9]+$/, 'WOTS+ signature must be valid hex string')
  .describe('WOTS+ signature (post-quantum, 2144 bytes)');

/**
 * Wallet public key validation schema
 * WOTS+ public key is 2208 bytes = 4416 hex characters (with 0x prefix = 4418)
 */
export const WOTSPublicKeySchema = z
  .string()
  .min(4416, 'WOTS+ public key must be at least 4416 characters (2208 bytes in hex)')
  .regex(/^(0x)?[a-fA-F0-9]+$/, 'WOTS+ public key must be valid hex string')
  .describe('WOTS+ public key (2208 bytes)');

/**
 * Encrypted content validation schema
 * Base64 encoded
 */
export const EncryptedContentSchema = z
  .string()
  .min(1)
  .describe('Encrypted content (base64 encoded)');

/**
 * Network validation schema
 */
export const NetworkSchema = z
  .enum(['solana-devnet', 'sepolia'])
  .describe('Blockchain network');

/**
 * Token validation schema
 */
export const TokenSchema = z
  .enum(['native', 'usdc', 'usdt'])
  .describe('Token type');

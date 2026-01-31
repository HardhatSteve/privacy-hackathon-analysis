/**
 * Obscura-LLMS Client Types
 * 
 * Types for integration with Obscura-LLMS backend API.
 * Base URL: https://obscura-api.daemonprotocol.com
 * 
 * Validates: Requirements 34.1-34.7, 36.1-36.5
 */

import { z } from 'zod';
import {
  Network,
  Token,
  TransactionHash,
  Timestamp,
  AmountString,
  NullifierHash,
  PedersenCommitment,
  BlockchainAddress,
  NetworkSchema,
  TokenSchema,
  AmountSchema,
  NullifierHashSchema,
  PedersenCommitmentSchema,
  BlockchainAddressSchema,
} from './common.types';

/**
 * Deposit Note
 * 
 * Cryptographic note for tracking deposits.
 * Requirement 34.1: Query off-chain balance using Arcium cSPL
 */
export interface DepositNote {
  /** Pedersen commitment for the deposit */
  commitment: PedersenCommitment;
  
  /** Nullifier for the deposit */
  nullifier: string;
  
  /** Nullifier hash */
  nullifierHash: NullifierHash;
  
  /** Secret for reconstructing the note */
  secret: string;
  
  /** Deposit amount */
  amount: AmountString;
  
  /** Token type */
  token: Token;
  
  /** Chain ID */
  chainId: Network;
  
  /** Deposit timestamp */
  timestamp: Timestamp;
}

/**
 * Deposit Request
 * 
 * Request to deposit funds for off-chain balance tracking.
 * Requirement 34.1: Deposit via Arcium cSPL
 */
export interface DepositRequest {
  /** Network (solana-devnet or sepolia) */
  network: Network;
  
  /** Token type */
  token: Token;
  
  /** Amount to deposit */
  amount: AmountString;
}

/**
 * Deposit Response
 * 
 * Response after successful deposit.
 * Requirement 34.1: Return deposit note and transaction hash
 */
export interface DepositResponse {
  /** Success indicator */
  success: boolean;
  
  /** Deposit note with cryptographic data */
  depositNote: DepositNote;
  
  /** Transaction hash (verifiable on blockchain explorer) */
  txHash: TransactionHash;
  
  /** Vault address (where funds are held) */
  vaultAddress: BlockchainAddress;
}

/**
 * Withdrawal Request Status
 * 
 * Status of a withdrawal request.
 */
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Withdraw Request
 * 
 * Request to withdraw funds via relayer network.
 * Requirement 34.5: Update balances atomically using Arcium cSPL
 * Requirement 36.1: Route through relayer network
 */
export interface WithdrawRequest {
  /** Commitment from deposit note */
  commitment: PedersenCommitment;
  
  /** Nullifier hash to prevent double-spending */
  nullifierHash: NullifierHash;
  
  /** Recipient address */
  recipient: BlockchainAddress;
  
  /** Amount to withdraw */
  amount: AmountString;
  
  /** Chain ID */
  chainId: Network;
}

/**
 * Withdraw Response
 * 
 * Response after initiating withdrawal.
 * Requirement 34.5: Return transaction hash and status
 * Requirement 36.4: Ensure user address not in public logs
 */
export interface WithdrawResponse {
  /** Success indicator */
  success: boolean;
  
  /** Unique request ID for tracking */
  requestId: string;
  
  /** Transaction hash (verifiable on blockchain explorer) */
  txHash: TransactionHash;
  
  /** Current status */
  status: WithdrawalStatus;
  
  /** Whether ZK compression was used (Solana only) */
  zkCompressed: boolean;
  
  /** Compression signature (Solana only) */
  compressionSignature?: string;
}

/**
 * Withdrawal Request Details
 * 
 * Detailed information about a withdrawal request.
 */
export interface WithdrawalRequestDetails {
  /** Request ID */
  requestId: string;
  
  /** Current status */
  status: WithdrawalStatus;
  
  /** Commitment */
  commitment: PedersenCommitment;
  
  /** Recipient address */
  recipient: BlockchainAddress;
  
  /** Amount */
  amount: AmountString;
  
  /** Chain ID */
  chainId: Network;
  
  /** Transaction hash (if completed) */
  txHash?: TransactionHash;
  
  /** Completion timestamp (if completed) */
  completedAt?: Timestamp;
}

/**
 * Privacy Status
 * 
 * Status of privacy infrastructure components.
 * Requirement 34.7: Query privacy layer status
 */
export interface PrivacyStatus {
  /** Overall status */
  status: 'operational' | 'degraded' | 'down';
  
  /** Arcium MPC status */
  arcium: {
    /** Whether Arcium is configured */
    configured: boolean;
    
    /** Cluster offset */
    clusterOffset: string;
    
    /** SDK version */
    version: string;
    
    /** Program ID */
    programId: string;
  };
  
  /** Light Protocol status */
  lightProtocol: {
    /** Whether Light Protocol is configured */
    configured: boolean;
    
    /** Whether ZK compression is enabled */
    zkCompression: boolean;
  };
}

/**
 * Relayer Stats
 * 
 * Statistics about relayer network operations.
 * Requirement 36.1: Monitor relayer network
 */
export interface RelayerStats {
  /** Total number of deposits */
  totalDeposits: number;
  
  /** Total number of withdrawals */
  totalWithdrawals: number;
  
  /** Total volume (as string) */
  totalVolume: AmountString;
  
  /** Number of pending requests */
  pendingRequests: number;
  
  /** Number of used nullifiers */
  usedNullifiers: number;
}

/**
 * Balance Verification Request
 * 
 * Request to verify sufficient balance.
 * Requirement 34.2: Verify sufficient off-chain balance
 */
export interface BalanceVerificationRequest {
  /** User's address */
  address: BlockchainAddress;
  
  /** Required amount */
  requiredAmount: AmountString;
  
  /** Token type */
  token: Token;
  
  /** Network */
  network: Network;
}

/**
 * Balance Verification Response
 * 
 * Response indicating if balance is sufficient.
 * Requirement 34.2: Return verification result without exposing balance
 */
export interface BalanceVerificationResponse {
  /** Success indicator */
  success: boolean;
  
  /** Whether balance is sufficient */
  hasSufficientBalance: boolean;
  
  /** User's address */
  address: BlockchainAddress;
}

// Zod Validation Schemas

/**
 * Deposit Request validation schema
 */
export const DepositRequestSchema = z.object({
  network: NetworkSchema,
  token: TokenSchema,
  amount: AmountSchema,
});

/**
 * Withdraw Request validation schema
 */
export const WithdrawRequestSchema = z.object({
  commitment: PedersenCommitmentSchema,
  nullifierHash: NullifierHashSchema,
  recipient: BlockchainAddressSchema,
  amount: AmountSchema,
  chainId: NetworkSchema,
});

/**
 * Balance Verification Request validation schema
 */
export const BalanceVerificationRequestSchema = z.object({
  address: BlockchainAddressSchema,
  requiredAmount: AmountSchema,
  token: TokenSchema,
  network: NetworkSchema,
});

/**
 * Withdrawal Request ID validation schema
 */
export const WithdrawalRequestIdSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
});

/**
 * Type inference from Zod schemas
 */
export type DepositRequestInput = z.infer<typeof DepositRequestSchema>;
export type WithdrawRequestInput = z.infer<typeof WithdrawRequestSchema>;
export type BalanceVerificationRequestInput = z.infer<typeof BalanceVerificationRequestSchema>;
export type WithdrawalRequestIdInput = z.infer<typeof WithdrawalRequestIdSchema>;

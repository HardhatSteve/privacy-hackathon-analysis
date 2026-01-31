import type { PublicKey } from '@solana/web3.js';
import type { Label } from './label.js';

/**
 * Normalized transfer data
 */
export interface Transfer {
  from: string;
  to: string;
  amount: number;
  token?: string; // undefined for SOL, mint address for SPL
  signature: string;
  blockTime: number | null;
}

/**
 * Categorized instruction type
 */
export type InstructionCategory = 
  | 'transfer'
  | 'swap'
  | 'stake'
  | 'vote'
  | 'program_interaction'
  | 'token_operation'
  | 'unknown';

/**
 * Normalized instruction data
 */
export interface NormalizedInstruction {
  programId: string;
  category: InstructionCategory;
  signature: string;
  blockTime: number | null;
  data?: Record<string, unknown>;
  // Solana-specific: accounts involved in instruction
  accounts?: string[];
}

/**
 * Transaction-level Solana metadata
 */
export interface TransactionMetadata {
  signature: string;
  blockTime: number | null;
  feePayer: string;
  signers: string[];
  computeUnitsUsed?: number;
  priorityFee?: number;
  memo?: string;
}

/**
 * Token account lifecycle event
 */
export interface TokenAccountEvent {
  type: 'create' | 'close';
  tokenAccount: string;
  owner: string;
  mint?: string;
  signature: string;
  blockTime: number | null;
  rentRefund?: number; // SOL refunded on close
}

/**
 * Program-Derived Address (PDA) interaction
 */
export interface PDAInteraction {
  pda: string;
  programId: string;
  signature: string;
  seeds?: string[]; // if derivable
}

/**
 * Context object containing all normalized data for heuristic evaluation
 */
export interface ScanContext {
  /**
   * The target being scanned
   */
  target: string;

  /**
   * Type of scan
   */
  targetType: 'wallet' | 'transaction' | 'program';

  /**
   * All normalized transfers
   */
  transfers: Transfer[];

  /**
   * All normalized instructions
   */
  instructions: NormalizedInstruction[];

  /**
   * Unique counterparty addresses
   */
  counterparties: Set<string>;

  /**
   * Labeled entities encountered
   */
  labels: Map<string, Label>;

  /**
   * Token accounts (for wallet scans)
   */
  tokenAccounts: Array<{
    mint: string;
    address: string;
    balance: number;
  }>;

  /**
   * Time range of analyzed activity
   */
  timeRange: {
    earliest: number | null;
    latest: number | null;
  };

  /**
   * Total number of transactions analyzed
   */
  transactionCount: number;

  // ===== SOLANA-SPECIFIC FIELDS =====

  /**
   * Transaction metadata (fee payers, signers, memos)
   */
  transactions: TransactionMetadata[];

  /**
   * Token account lifecycle events
   */
  tokenAccountEvents: TokenAccountEvent[];

  /**
   * PDA interactions detected
   */
  pdaInteractions: PDAInteraction[];

  /**
   * Unique fee payers across all transactions
   */
  feePayers: Set<string>;

  /**
   * Unique signers across all transactions
   */
  signers: Set<string>;

  /**
   * Program IDs interacted with
   */
  programs: Set<string>;
}

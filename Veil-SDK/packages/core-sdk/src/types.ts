export enum PrivacyLevel {
  /** Standard transaction, fully visible on-chain. */
  Public = 'Public',
  /** Obfuscates the sender identity. */
  Confidential = 'Confidential',
  /** Maximum privacy, obfuscating sender, receiver, and amount where possible. */
  Private = 'Private',
}

export interface VeilConfig {
  rpcUrl: string;
  network: 'mainnet-beta' | 'devnet' | 'localnet';
  apiKey?: string;
  defaultAdapter?: string;
  wallet?: AdapterWallet;
}

/**
 * Minimal wallet interface compatible with standard Solana wallet adapters.
 * Defined structurally to avoid hard dependency on @solana/web3.js.
 */
export interface AdapterWallet {
  publicKey: { toBase58(): string } | null;
  signTransaction<T>(transaction: T): Promise<T>;
  signAllTransactions<T>(transactions: T[]): Promise<T[]>;
}

export interface AdapterContext {
  wallet: AdapterWallet;
  config: VeilConfig;
}

export interface AdapterMetadata {
  name: string;
  supportedFeatures: {
    hideSender: boolean;
    hideRecipient: boolean;
    hideAmount: boolean;
    hideToken: boolean;
  };
  supportedNetworks: ('mainnet-beta' | 'devnet' | 'localnet')[];
}

export class AdapterError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AdapterError';
  }
}

export interface PrivacyTransactionInput {
  to: string;
  /** Amount in smallest unit (e.g., lamports). */
  amount: bigint;
  token?: string;
  privacyLevel: PrivacyLevel;
  memo?: string;
}

export interface PrivacyTransactionResult {
  txId: string;
  privacyLevel: PrivacyLevel;
  timestamp: number;
}

export interface SimulationResult {
  success: boolean;
  estimatedFee: bigint;
  logs: string[];
  unitsConsumed: number;
}

export interface InspectionReport {
  /** 0 to 100 indicating privacy strength (100 is best). */
  privacyScore: number;
  publiclyVisibleData: string[];
  warnings: string[];
}
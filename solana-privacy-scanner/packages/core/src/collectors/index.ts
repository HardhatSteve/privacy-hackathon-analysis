import type { RPCClient } from '../rpc/client.js';
import type { 
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  TokenAccountBalancePair,
} from '@solana/web3.js';

/**
 * Raw transaction data fetched from RPC
 */
export interface RawTransaction {
  signature: string;
  transaction: ParsedTransactionWithMeta | null;
  blockTime: number | null;
}

/**
 * Raw wallet data collection result
 */
export interface RawWalletData {
  address: string;
  signatures: ConfirmedSignatureInfo[];
  transactions: RawTransaction[];
  tokenAccounts: TokenAccountBalancePair[];
}

/**
 * Raw transaction scan result
 */
export interface RawTransactionData {
  signature: string;
  transaction: ParsedTransactionWithMeta | null;
  blockTime: number | null;
}

/**
 * Raw program data collection result
 */
export interface RawProgramData {
  programId: string;
  accounts: Array<{
    pubkey: string;
    account: any;
  }>;
  relatedTransactions: RawTransaction[];
}

/**
 * Options for wallet data collection
 */
export interface WalletCollectionOptions {
  /**
   * Maximum number of signatures to fetch
   * @default 100
   */
  maxSignatures?: number;

  /**
   * Fetch token accounts
   * @default true
   */
  includeTokenAccounts?: boolean;
}

/**
 * Options for program data collection
 */
export interface ProgramCollectionOptions {
  /**
   * Maximum number of accounts to fetch
   * @default 100
   */
  maxAccounts?: number;

  /**
   * Maximum number of related transactions to fetch
   * @default 50
   */
  maxTransactions?: number;
}

/**
 * Collects raw wallet data from Solana RPC
 */
export async function collectWalletData(
  client: RPCClient,
  address: string,
  options: WalletCollectionOptions = {}
): Promise<RawWalletData> {
  const maxSignatures = options.maxSignatures ?? 100;
  const includeTokenAccounts = options.includeTokenAccounts ?? true;

  // Fetch recent signatures (bounded)
  let signatures = [];
  try {
    signatures = await client.getSignaturesForAddress(address, {
      limit: maxSignatures,
    });
  } catch (error) {
    console.warn(`Failed to fetch signatures for ${address}:`, error);
  }

  // Fetch transactions for all signatures
  const transactions: RawTransaction[] = [];
  
  // Process in batches to avoid overwhelming the RPC
  const BATCH_SIZE = 10;
  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    const batch = signatures.slice(i, i + BATCH_SIZE);
    const batchSignatures = batch.map((sig) => sig.signature);
    
    try {
      const txs = await client.getTransactions(batchSignatures, {
        maxSupportedTransactionVersion: 0,
      });

      for (let j = 0; j < batch.length; j++) {
        transactions.push({
          signature: batch[j].signature,
          transaction: txs[j] as ParsedTransactionWithMeta | null,
          blockTime: batch[j].blockTime,
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch transaction batch for ${address}:`, error);
    }
  }

  // Fetch token accounts
  let tokenAccounts: TokenAccountBalancePair[] = [];
  if (includeTokenAccounts) {
    try {
      const response = await client.getTokenAccountsByOwner(address);
      tokenAccounts = response.value;
    } catch (error) {
      // Token accounts might not exist or query might fail - that's okay
      console.warn(`Failed to fetch token accounts for ${address}:`, error);
    }
  }

  return {
    address,
    signatures,
    transactions,
    tokenAccounts,
  };
}

/**
 * Collects raw transaction data from Solana RPC
 */
export async function collectTransactionData(
  client: RPCClient,
  signature: string
): Promise<RawTransactionData> {
  // Fetch full transaction with metadata
  let transaction = null;
  try {
    transaction = await client.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  } catch (error) {
    console.warn(`Failed to fetch transaction ${signature}:`, error);
  }

  return {
    signature,
    transaction: transaction as ParsedTransactionWithMeta | null,
    blockTime: transaction?.blockTime ?? null,
  };
}

/**
 * Collects raw program data from Solana RPC
 */
export async function collectProgramData(
  client: RPCClient,
  programId: string,
  options: ProgramCollectionOptions = {}
): Promise<RawProgramData> {
  const maxAccounts = options.maxAccounts ?? 100;
  const maxTransactions = options.maxTransactions ?? 50;

  // Fetch program accounts (limited)
  let accounts: Array<{ pubkey: string; account: any }> = [];
  try {
    const response = await client.getProgramAccounts(programId, {
      encoding: 'jsonParsed',
      dataSlice: { offset: 0, length: 0 }, // Don't fetch full account data
    });

    accounts = response.slice(0, maxAccounts).map((acc) => ({
      pubkey: acc.pubkey.toString(),
      account: acc.account,
    }));
  } catch (error) {
    console.warn(`Failed to fetch program accounts for ${programId}:`, error);
  }

  // Fetch recent signatures for the program
  let signatures: ConfirmedSignatureInfo[] = [];
  try {
    signatures = await client.getSignaturesForAddress(programId, {
      limit: maxTransactions,
    });
  } catch (error) {
    console.warn(`Failed to fetch signatures for program ${programId}:`, error);
  }

  // Fetch transactions for those signatures
  const relatedTransactions: RawTransaction[] = [];
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < Math.min(signatures.length, maxTransactions); i += BATCH_SIZE) {
    const batch = signatures.slice(i, i + BATCH_SIZE);
    const batchSignatures = batch.map((sig) => sig.signature);
    
    try {
      const txs = await client.getTransactions(batchSignatures, {
        maxSupportedTransactionVersion: 0,
      });

      for (let j = 0; j < batch.length; j++) {
        relatedTransactions.push({
          signature: batch[j].signature,
          transaction: txs[j] as ParsedTransactionWithMeta | null,
          blockTime: batch[j].blockTime,
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch transaction batch for program ${programId}:`, error);
    }
  }

  return {
    programId,
    accounts,
    relatedTransactions,
  };
}

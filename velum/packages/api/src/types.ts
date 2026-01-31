export interface VelumClientConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

// Paylink types
export interface CreatePaylinkParams {
  recipientUtxoPubkey: string;
  recipientEncryptionKey: string;
  token?: "ANY" | "SOL" | "USDC" | "USDT";
  amountLamports?: string;
  memo?: string;
  expiresAt?: string;
}

export interface CreatePaylinkResponse {
  id: string;
  url: string;
}

export interface Paylink {
  id: string;
  recipientUtxoPubkey: string;
  recipientEncryptionKey: string;
  token: string;
  amountLamports: string | null;
  memo: string | null;
  createdAt: string;
}

// Transaction types
export type TransactionType = "deposit" | "withdraw";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface LogTransactionParams {
  type: TransactionType;
  token: string;
  amountLamports: string;
  signature: string;
  status?: TransactionStatus;
  utxoPubkey?: string;
  paylinkId?: string;
}

export interface LogTransactionResponse {
  id: string;
  signature: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface ListTransactionsParams {
  utxoPubkey?: string;
  type?: TransactionType;
  token?: string;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  token: string;
  amountLamports: string;
  signature: string;
  status: TransactionStatus;
  utxoPubkey: string | null;
  paylinkId: string | null;
  paylinkMemo: string | null;
  createdAt: string;
}

export interface ListTransactionsResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateTransactionStatusResponse {
  signature: string;
  status: TransactionStatus;
  updatedAt: string;
}

// API error response shape
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

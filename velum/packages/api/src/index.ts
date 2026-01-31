import type { VelumClientConfig } from "./types.js";
import { PaylinksEndpoint } from "./endpoints/paylinks.js";
import { TransactionsEndpoint } from "./endpoints/transactions.js";

export { VelumApiError } from "./errors.js";
export type {
  VelumClientConfig,
  CreatePaylinkParams,
  CreatePaylinkResponse,
  Paylink,
  LogTransactionParams,
  LogTransactionResponse,
  ListTransactionsParams,
  ListTransactionsResponse,
  Transaction,
  TransactionType,
  TransactionStatus,
  UpdateTransactionStatusResponse,
  ApiErrorBody,
} from "./types.js";

const DEFAULT_BASE_URL = "https://velum.cash/api";

export class VelumClient {
  public readonly paylinks: PaylinksEndpoint;
  public readonly transactions: TransactionsEndpoint;

  constructor(config: VelumClientConfig) {
    const resolvedConfig = {
      apiKey: config.apiKey,
      baseUrl: (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    };

    this.paylinks = new PaylinksEndpoint(resolvedConfig);
    this.transactions = new TransactionsEndpoint(resolvedConfig);
  }
}

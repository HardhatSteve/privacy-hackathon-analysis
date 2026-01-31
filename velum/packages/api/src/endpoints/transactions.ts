import type {
  LogTransactionParams,
  LogTransactionResponse,
  ListTransactionsParams,
  ListTransactionsResponse,
  TransactionStatus,
  UpdateTransactionStatusResponse,
  VelumClientConfig,
} from "../types.js";
import { VelumApiError } from "../errors.js";

export class TransactionsEndpoint {
  private config: Required<Pick<VelumClientConfig, "apiKey" | "baseUrl">> & {
    fetch: typeof globalThis.fetch;
  };

  constructor(
    config: Required<Pick<VelumClientConfig, "apiKey" | "baseUrl">> & {
      fetch: typeof globalThis.fetch;
    }
  ) {
    this.config = config;
  }

  async log(params: LogTransactionParams): Promise<LogTransactionResponse> {
    const response = await this.config.fetch(
      `${this.config.baseUrl}/v1/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw await VelumApiError.fromResponse(response);
    }

    return response.json();
  }

  async list(
    params?: ListTransactionsParams
  ): Promise<ListTransactionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.utxoPubkey) searchParams.set("utxoPubkey", params.utxoPubkey);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.token) searchParams.set("token", params.token);
    if (params?.limit !== undefined)
      searchParams.set("limit", String(params.limit));
    if (params?.offset !== undefined)
      searchParams.set("offset", String(params.offset));

    const qs = searchParams.toString();
    const url = `${this.config.baseUrl}/v1/transactions${qs ? `?${qs}` : ""}`;

    const response = await this.config.fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": this.config.apiKey,
      },
    });

    if (!response.ok) {
      throw await VelumApiError.fromResponse(response);
    }

    return response.json();
  }

  async updateStatus(
    signature: string,
    status: TransactionStatus
  ): Promise<UpdateTransactionStatusResponse> {
    const response = await this.config.fetch(
      `${this.config.baseUrl}/v1/transactions/${encodeURIComponent(signature)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw await VelumApiError.fromResponse(response);
    }

    return response.json();
  }
}

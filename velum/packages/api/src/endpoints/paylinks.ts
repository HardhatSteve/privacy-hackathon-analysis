import type {
  CreatePaylinkParams,
  CreatePaylinkResponse,
  Paylink,
  VelumClientConfig,
} from "../types.js";
import { VelumApiError } from "../errors.js";

export class PaylinksEndpoint {
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

  async create(params: CreatePaylinkParams): Promise<CreatePaylinkResponse> {
    const response = await this.config.fetch(
      `${this.config.baseUrl}/v1/paylinks`,
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

  async get(id: string): Promise<Paylink> {
    const response = await this.config.fetch(
      `${this.config.baseUrl}/v1/paylinks/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": this.config.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw await VelumApiError.fromResponse(response);
    }

    return response.json();
  }
}

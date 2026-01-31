import type { ApiErrorBody } from "./types.js";

export class VelumApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "VelumApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static async fromResponse(response: Response): Promise<VelumApiError> {
    try {
      const body: ApiErrorBody = await response.json();
      return new VelumApiError(
        body.error.code,
        body.error.message,
        response.status,
        body.error.details
      );
    } catch {
      return new VelumApiError(
        "UNKNOWN_ERROR",
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
  }
}

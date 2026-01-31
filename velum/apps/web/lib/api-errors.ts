import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "EXPIRED"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL_ERROR";

interface ApiErrorOptions {
  details?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  options?: ApiErrorOptions
): NextResponse {
  const body = {
    error: {
      code,
      message,
      ...(options?.details && { details: options.details }),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}

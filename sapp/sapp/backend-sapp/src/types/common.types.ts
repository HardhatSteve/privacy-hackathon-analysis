/**
 * Common Types
 * Shared types used across multiple services
 */

/**
 * Hex string type (0x-prefixed)
 */
export type HexString = `0x${string}`;

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API error response wrapper
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
}

/**
 * API response (union type)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

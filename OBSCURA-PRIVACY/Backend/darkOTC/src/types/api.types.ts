/**
 * API Request and Response Types
 * 
 * Common types for API endpoints including error handling and pagination.
 * Validates: Requirement 37.1-37.7
 */

import { z } from 'zod';

/**
 * API Success Response
 * 
 * Standard success response format.
 */
export interface ApiSuccessResponse<T = any> {
  /** Success indicator (always true) */
  success: true;
  
  /** Response data */
  data?: T;
  
  /** Optional metadata */
  meta?: {
    /** Timestamp of response */
    timestamp?: number;
    
    /** Request ID for tracing */
    requestId?: string;
    
    /** API version */
    version?: string;
  };
}

/**
 * API Error Response
 * 
 * Standard error response format.
 * Requirement 37.7: Consistent JSON error format
 */
export interface ApiErrorResponse {
  /** Success indicator (always false) */
  success: false;
  
  /** Error code (for programmatic handling) */
  code: string;
  
  /** Human-readable error message */
  error: string;
  
  /** Optional error details */
  details?: any;
  
  /** Optional field-specific errors (for validation) */
  fieldErrors?: Record<string, string[]>;
  
  /** Optional metadata */
  meta?: {
    /** Timestamp of error */
    timestamp?: number;
    
    /** Request ID for tracing */
    requestId?: string;
  };
}

/**
 * API Response (union of success and error)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Error Codes
 * 
 * Standard error codes for the API.
 * Requirements: 37.1-37.6
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  
  // Authorization errors (403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_WHITELISTED = 'NOT_WHITELISTED',
  ALREADY_WHITELISTED = 'ALREADY_WHITELISTED',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',
  SIGNATURE_REUSED = 'SIGNATURE_REUSED',
  NOT_OWNER = 'NOT_OWNER',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  QUOTE_REQUEST_NOT_FOUND = 'QUOTE_REQUEST_NOT_FOUND',
  QUOTE_NOT_FOUND = 'QUOTE_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  
  // Business logic errors (400/409)
  QUOTE_REQUEST_EXPIRED = 'QUOTE_REQUEST_EXPIRED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  QUOTE_REQUEST_FILLED = 'QUOTE_REQUEST_FILLED',
  QUOTE_REQUEST_CANCELLED = 'QUOTE_REQUEST_CANCELLED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_QUOTE_EXPIRATION = 'INVALID_QUOTE_EXPIRATION',
  
  // Cryptographic errors (400/500)
  COMMITMENT_VERIFICATION_FAILED = 'COMMITMENT_VERIFICATION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  NULLIFIER_GENERATION_FAILED = 'NULLIFIER_GENERATION_FAILED',
  
  // External service errors (503)
  RELAYER_UNAVAILABLE = 'RELAYER_UNAVAILABLE',
  OBSCURA_LLMS_UNAVAILABLE = 'OBSCURA_LLMS_UNAVAILABLE',
  BLOCKCHAIN_UNAVAILABLE = 'BLOCKCHAIN_UNAVAILABLE',
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
  
  // Internal errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SETTLEMENT_FAILED = 'SETTLEMENT_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * HTTP Status Codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Pagination Parameters
 * 
 * Standard pagination parameters for list endpoints.
 */
export interface PaginationParams {
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  
  /** Offset for pagination (default: 0) */
  offset?: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination Metadata
 * 
 * Metadata for paginated responses.
 */
export interface PaginationMeta {
  /** Total number of items */
  total: number;
  
  /** Current limit */
  limit: number;
  
  /** Current offset */
  offset: number;
  
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Paginated Response
 * 
 * Standard paginated response format.
 */
export interface PaginatedResponse<T> {
  /** Success indicator */
  success: true;
  
  /** Array of items */
  items: T[];
  
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Health Check Response
 * 
 * Response for health check endpoint.
 */
export interface HealthCheckResponse {
  /** Success indicator */
  success: true;
  
  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Timestamp */
  timestamp: number;
  
  /** API version */
  version: string;
  
  /** Optional: Component health status */
  components?: {
    database?: 'up' | 'down';
    solana?: 'up' | 'down';
    ethereum?: 'up' | 'down';
    obscuraLLMS?: 'up' | 'down';
  };
}

/**
 * API Info Response
 * 
 * Response for API information endpoint.
 */
export interface ApiInfoResponse {
  /** API name */
  name: string;
  
  /** API version */
  version: string;
  
  /** API description */
  description: string;
  
  /** Available endpoints */
  endpoints: Record<string, string>;
  
  /** Infrastructure information */
  infrastructure: {
    solana: string;
    ethereum: string;
    arcium: string;
    lightProtocol: string;
    wots: string;
    obscuraLLMS: string;
  };
}

// Zod Validation Schemas

/**
 * Pagination parameters validation schema
 */
export const PaginationParamsSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Request ID parameter validation schema
 */
export const RequestIdSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
});

/**
 * Type inference from Zod schemas
 */
export type PaginationParamsInput = z.infer<typeof PaginationParamsSchema>;
export type RequestIdInput = z.infer<typeof RequestIdSchema>;

/**
 * Error Response Builder
 * 
 * Helper function to build consistent error responses.
 * Requirement 37.7: Consistent error format
 */
export function buildErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  fieldErrors?: Record<string, string[]>
): ApiErrorResponse {
  return {
    success: false,
    code,
    error: message,
    details,
    fieldErrors,
    meta: {
      timestamp: Date.now(),
    },
  };
}

/**
 * Success Response Builder
 * 
 * Helper function to build consistent success responses.
 */
export function buildSuccessResponse<T>(data?: T, meta?: any): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: Date.now(),
      ...meta,
    },
  };
}

/**
 * Map Error Code to HTTP Status
 * 
 * Maps error codes to appropriate HTTP status codes.
 * Requirements: 37.1-37.5
 */
export function getHttpStatusForErrorCode(code: ErrorCode): HttpStatus {
  switch (code) {
    // Validation errors (400)
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.MISSING_FIELD:
    case ErrorCode.INVALID_FORMAT:
    case ErrorCode.INVALID_AMOUNT:
    case ErrorCode.INVALID_TIMESTAMP:
    case ErrorCode.INVALID_ADDRESS:
    case ErrorCode.INVALID_SIGNATURE:
    case ErrorCode.QUOTE_REQUEST_EXPIRED:
    case ErrorCode.QUOTE_EXPIRED:
    case ErrorCode.INSUFFICIENT_BALANCE:
    case ErrorCode.INVALID_QUOTE_EXPIRATION:
    case ErrorCode.COMMITMENT_VERIFICATION_FAILED:
    case ErrorCode.ENCRYPTION_FAILED:
    case ErrorCode.DECRYPTION_FAILED:
    case ErrorCode.NULLIFIER_GENERATION_FAILED:
      return HttpStatus.BAD_REQUEST;
    
    // Authorization errors (403)
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.NOT_WHITELISTED:
    case ErrorCode.SIGNATURE_VERIFICATION_FAILED:
    case ErrorCode.SIGNATURE_REUSED:
    case ErrorCode.NOT_OWNER:
      return HttpStatus.FORBIDDEN;
    
    // Not found errors (404)
    case ErrorCode.NOT_FOUND:
    case ErrorCode.QUOTE_REQUEST_NOT_FOUND:
    case ErrorCode.QUOTE_NOT_FOUND:
    case ErrorCode.MESSAGE_NOT_FOUND:
      return HttpStatus.NOT_FOUND;
    
    // Conflict errors (409)
    case ErrorCode.QUOTE_REQUEST_FILLED:
    case ErrorCode.QUOTE_REQUEST_CANCELLED:
      return HttpStatus.CONFLICT;
    
    // Service unavailable (503)
    case ErrorCode.RELAYER_UNAVAILABLE:
    case ErrorCode.OBSCURA_LLMS_UNAVAILABLE:
    case ErrorCode.BLOCKCHAIN_UNAVAILABLE:
    case ErrorCode.DATABASE_UNAVAILABLE:
      return HttpStatus.SERVICE_UNAVAILABLE;
    
    // Internal errors (500)
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.SETTLEMENT_FAILED:
    case ErrorCode.DATABASE_ERROR:
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

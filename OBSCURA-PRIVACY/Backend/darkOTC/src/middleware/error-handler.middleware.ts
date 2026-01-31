/**
 * Error Handler Middleware
 * 
 * Provides centralized error handling for all API endpoints with consistent
 * error response format and proper HTTP status code mapping.
 * 
 * Requirements: 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7
 */

import { Request, Response, NextFunction } from 'express';
import { ObscuraError, ErrorCategory } from '../utils/errors';

/**
 * Standard error response format
 * 
 * Requirements: 37.7
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

/**
 * Custom application errors with HTTP status codes
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public resourceType?: string,
    public resourceId?: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class CryptographicError extends Error {
  constructor(
    message: string,
    public operation?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CryptographicError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(
    message: string,
    public required?: string,
    public available?: string
  ) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class SignatureError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SignatureError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public expiresAt?: Date
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Map error to HTTP status code
 * 
 * Requirements: 37.1, 37.2, 37.3, 37.4, 37.5
 */
function getStatusCode(error: Error): number {
  // Validation errors (400)
  if (error instanceof ValidationError) {
    return 400;
  }
  
  // Not found errors (404)
  if (error instanceof NotFoundError) {
    return 404;
  }
  
  // Authorization errors (403)
  if (error instanceof AuthorizationError) {
    return 403;
  }
  
  // Signature errors (401)
  if (error instanceof SignatureError) {
    return 401;
  }
  
  // Timeout errors (410 Gone)
  if (error instanceof TimeoutError) {
    return 410;
  }
  
  // Insufficient balance errors (402 Payment Required)
  if (error instanceof InsufficientBalanceError) {
    return 402;
  }
  
  // Cryptographic errors (500)
  if (error instanceof CryptographicError) {
    return 500;
  }
  
  // Obscura errors
  if (error instanceof ObscuraError) {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return 502; // Bad Gateway
      case ErrorCategory.RELAYER_UNAVAILABLE:
        return 503; // Service Unavailable
      case ErrorCategory.INSUFFICIENT_BALANCE:
        return 402; // Payment Required
      case ErrorCategory.INVALID_INPUT:
        return 400; // Bad Request
      case ErrorCategory.TIMEOUT:
        return 504; // Gateway Timeout
      default:
        return 500; // Internal Server Error
    }
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Build error response object
 * 
 * Requirements: 37.6, 37.7
 */
function buildErrorResponse(error: Error, statusCode: number): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: error.message,
  };
  
  // Add error code
  response.code = error.name;
  
  // Add details for specific error types (without exposing internal details for 500 errors)
  if (statusCode !== 500) {
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    } else if (error instanceof NotFoundError) {
      response.details = {
        resourceType: error.resourceType,
        resourceId: error.resourceId,
      };
    } else if (error instanceof AuthorizationError && error.details) {
      response.details = error.details;
    } else if (error instanceof SignatureError && error.details) {
      response.details = error.details;
    } else if (error instanceof TimeoutError && error.expiresAt) {
      response.details = {
        expiresAt: error.expiresAt.toISOString(),
      };
    } else if (error instanceof InsufficientBalanceError) {
      response.details = {
        required: error.required,
        available: error.available,
      };
    } else if (error instanceof ObscuraError) {
      response.details = {
        category: error.category,
        isRetryable: error.isRetryable,
      };
    }
  } else {
    // For 500 errors, don't expose internal details
    // Requirements: 37.5
    if (error instanceof CryptographicError) {
      response.error = `Cryptographic operation failed: ${error.operation || 'unknown'}`;
      // Don't include error.details to avoid exposing internal crypto details
    } else {
      response.error = 'Internal server error';
    }
  }
  
  return response;
}

/**
 * Error handler middleware
 * 
 * This middleware catches all errors thrown in route handlers and
 * converts them to consistent JSON error responses.
 * 
 * Requirements: 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7
 * 
 * @example
 * app.use(errorHandler);
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (without sensitive data)
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    path: req.path,
    method: req.method,
    // Don't log request body as it may contain signatures/keys
  });
  
  // Get status code
  const statusCode = getStatusCode(error);
  
  // Build error response
  const errorResponse = buildErrorResponse(error, statusCode);
  
  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * 
 * This wrapper ensures that errors thrown in async functions are
 * properly caught and passed to the error handler middleware.
 * 
 * @example
 * router.post('/endpoint', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * 
 * This middleware handles requests to non-existent routes.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(
    `Route not found: ${req.method} ${req.path}`,
    'route',
    req.path
  );
  next(error);
}

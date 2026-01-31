/**
 * Error Helper Utilities
 * 
 * Provides helper functions for throwing consistent errors across services.
 * 
 * Requirements: 37.6
 */

import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  TimeoutError,
  InsufficientBalanceError,
  SignatureError,
  CryptographicError,
} from '../middleware/error-handler.middleware';

/**
 * Throw signature verification error
 * 
 * Requirements: 37.6
 */
export function throwSignatureError(
  operation: string,
  error?: string
): never {
  throw new SignatureError(
    `Signature verification failed: ${error || 'Invalid signature'}`,
    { operation }
  );
}

/**
 * Throw signature reuse error
 * 
 * Requirements: 35.4, 35.5, 37.6
 */
export function throwSignatureReuseError(): never {
  throw new SignatureError(
    'Signature has already been used',
    { reason: 'signature_reuse' }
  );
}

/**
 * Throw insufficient balance error
 * 
 * Requirements: 34.2, 37.6
 */
export function throwInsufficientBalanceError(
  error?: string,
  required?: string,
  available?: string
): never {
  throw new InsufficientBalanceError(
    `Insufficient balance: ${error || 'Balance verification failed'}`,
    required,
    available
  );
}

/**
 * Throw not found error
 * 
 * Requirements: 37.3
 */
export function throwNotFoundError(
  resourceType: string,
  resourceId?: string
): never {
  throw new NotFoundError(
    `${resourceType} not found`,
    resourceType,
    resourceId
  );
}

/**
 * Throw authorization error
 * 
 * Requirements: 37.4
 */
export function throwAuthorizationError(
  message: string,
  details?: any
): never {
  throw new AuthorizationError(message, details);
}

/**
 * Throw timeout/expiration error
 * 
 * Requirements: 10.2, 10.3, 10.4, 37.6
 */
export function throwTimeoutError(
  message: string,
  expiresAt?: Date
): never {
  throw new TimeoutError(message, expiresAt);
}

/**
 * Throw validation error
 * 
 * Requirements: 37.1, 37.2
 */
export function throwValidationError(
  message: string,
  details?: any
): never {
  throw new ValidationError(message, details);
}

/**
 * Throw cryptographic operation error
 * 
 * Requirements: 37.6
 */
export function throwCryptographicError(
  operation: string,
  error?: string,
  details?: any
): never {
  throw new CryptographicError(
    `Cryptographic operation failed: ${operation}${error ? ` - ${error}` : ''}`,
    operation,
    details
  );
}

/**
 * Throw database error (as internal error)
 * 
 * Requirements: 37.5
 */
export function throwDatabaseError(
  operation: string,
  _error: Error
): never {
  // Don't expose internal database details
  throw new Error(`Database operation failed: ${operation}`);
}

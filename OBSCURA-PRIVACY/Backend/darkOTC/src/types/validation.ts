/**
 * Validation Utilities
 * 
 * Helper functions for validating data using Zod schemas.
 * Provides consistent validation error handling across the application.
 */

import { z, ZodError } from 'zod';
import { ApiErrorResponse, ErrorCode, buildErrorResponse } from './api.types';

/**
 * Validation Result
 * 
 * Result of a validation operation.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorResponse };

/**
 * Validate data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or error response
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      
      return {
        success: false,
        error: buildErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          { issues: error.issues },
          fieldErrors
        ),
      };
    }
    
    return {
      success: false,
      error: buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        { error: String(error) }
      ),
    };
  }
}

/**
 * Validate data asynchronously against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Promise of validation result
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      
      return {
        success: false,
        error: buildErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          { issues: error.issues },
          fieldErrors
        ),
      };
    }
    
    return {
      success: false,
      error: buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        { error: String(error) }
      ),
    };
  }
}

/**
 * Safe parse data against a Zod schema
 * 
 * Similar to validate() but returns undefined on error instead of error response.
 * Useful for optional validation where you want to handle errors differently.
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or undefined
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Check if data is valid against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns True if valid, false otherwise
 */
export function isValid<T>(schema: z.ZodSchema<T>, data: unknown): boolean {
  const result = schema.safeParse(data);
  return result.success;
}

/**
 * Extract validation errors from ZodError
 * 
 * @param error - ZodError instance
 * @returns Field errors map
 */
export function extractFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  
  return fieldErrors;
}

/**
 * Format validation error for logging
 * 
 * @param error - ZodError instance
 * @returns Formatted error string
 */
export function formatValidationError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
}

/**
 * Validate required fields
 * 
 * Checks if all required fields are present in an object.
 * 
 * @param data - Object to check
 * @param requiredFields - Array of required field names
 * @returns Validation result
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult<Record<string, any>> {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    const fieldErrors: Record<string, string[]> = {};
    for (const field of missingFields) {
      fieldErrors[field] = ['This field is required'];
    }
    
    return {
      success: false,
      error: buildErrorResponse(
        ErrorCode.MISSING_FIELD,
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields },
        fieldErrors
      ),
    };
  }
  
  return { success: true, data };
}

/**
 * Validate asset pair format
 * 
 * Checks if asset pair is in correct format (TOKEN1/TOKEN2).
 * 
 * @param assetPair - Asset pair string
 * @returns True if valid, false otherwise
 */
export function isValidAssetPair(assetPair: string): boolean {
  return /^[A-Z]{2,10}\/[A-Z]{2,10}$/.test(assetPair);
}

/**
 * Validate Solana public key format
 * 
 * @param publicKey - Public key string
 * @returns True if valid, false otherwise
 */
export function isValidSolanaPublicKey(publicKey: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(publicKey);
}

/**
 * Validate Ethereum address format
 * 
 * @param address - Address string
 * @returns True if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate blockchain address (Solana or Ethereum)
 * 
 * @param address - Address string
 * @returns True if valid, false otherwise
 */
export function isValidBlockchainAddress(address: string): boolean {
  return isValidSolanaPublicKey(address) || isValidEthereumAddress(address);
}

/**
 * Validate amount
 * 
 * Checks if amount is a valid positive number >= minimum.
 * 
 * @param amount - Amount string
 * @param minimum - Minimum allowed amount (default: 0.0003)
 * @returns True if valid, false otherwise
 */
export function isValidAmount(amount: string, minimum: number = 0.0003): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num >= minimum;
}

/**
 * Validate timestamp
 * 
 * Checks if timestamp is a valid future timestamp.
 * 
 * @param timestamp - Timestamp in milliseconds
 * @param mustBeFuture - Whether timestamp must be in the future
 * @returns True if valid, false otherwise
 */
export function isValidTimestamp(
  timestamp: number,
  mustBeFuture: boolean = false
): boolean {
  if (!Number.isInteger(timestamp) || timestamp <= 0) {
    return false;
  }
  
  if (mustBeFuture && timestamp <= Date.now()) {
    return false;
  }
  
  return true;
}

/**
 * Validate hex string
 * 
 * @param hex - Hex string (with or without 0x prefix)
 * @param expectedLength - Expected length in bytes (optional)
 * @returns True if valid, false otherwise
 */
export function isValidHex(hex: string, expectedLength?: number): boolean {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  if (!/^[a-fA-F0-9]+$/.test(cleanHex)) {
    return false;
  }
  
  if (expectedLength !== undefined) {
    return cleanHex.length === expectedLength * 2;
  }
  
  return true;
}

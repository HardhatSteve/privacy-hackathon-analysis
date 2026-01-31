/**
 * Admin Authentication Middleware
 * 
 * Verifies that the request is from an authorized admin by checking
 * the public key against the list of authorized admin public keys.
 * 
 * Requirements: 33.1, 33.2, 33.6 (Admin authorization)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from './error-handler.middleware';

/**
 * Get authorized admin public keys from environment
 * 
 * Supports multiple admin keys separated by commas.
 * 
 * @returns Array of authorized admin public keys (hex strings)
 */
function getAuthorizedAdminKeys(): string[] {
  const adminKey = process.env.ADMIN_PUBLIC_KEY;
  
  if (!adminKey) {
    console.warn('[Admin Auth] ADMIN_PUBLIC_KEY not configured in environment');
    return [];
  }
  
  // Support comma-separated list of admin keys
  return adminKey
    .split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0);
}

/**
 * Verify that the public key belongs to an authorized admin
 * 
 * This middleware checks if the publicKey in the request body matches
 * one of the authorized admin public keys from the environment.
 * 
 * Requirements: 33.6
 * 
 * @throws {AuthorizationError} If publicKey is missing or not authorized
 * 
 * @example
 * router.post('/admin/whitelist/add', verifyAdminPublicKey, async (req, res) => {
 *   // Only authorized admins can reach here
 * });
 */
export function verifyAdminPublicKey(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get public key from request body
    const { publicKey } = req.body;
    
    if (!publicKey) {
      throw new AuthorizationError(
        'Public key is required for admin operations',
        { reason: 'missing_public_key' }
      );
    }
    
    // Get authorized admin keys
    const authorizedKeys = getAuthorizedAdminKeys();
    
    if (authorizedKeys.length === 0) {
      throw new AuthorizationError(
        'Admin authentication is not configured',
        { reason: 'no_admin_keys_configured' }
      );
    }
    
    // Check if public key is authorized
    const isAuthorized = authorizedKeys.some(
      authorizedKey => authorizedKey === publicKey
    );
    
    if (!isAuthorized) {
      throw new AuthorizationError(
        'Not authorized: Public key is not an authorized admin',
        { reason: 'unauthorized_public_key' }
      );
    }
    
    // Public key is authorized, continue to next middleware
    next();
    
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}

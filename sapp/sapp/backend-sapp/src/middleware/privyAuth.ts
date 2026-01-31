/**
 * Privy Authentication Middleware
 *
 * Verifies Privy JWT access tokens and extracts user information.
 * Uses the @privy-io/server-auth SDK for token verification.
 */

import type { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { env } from '../config/env.js';

// ===========================================
// Privy Server Auth Client (Singleton)
// ===========================================

let privyServerAuth: PrivyClient | null = null;

function getPrivyServerAuth(): PrivyClient {
  if (!privyServerAuth) {
    console.log(`[PrivyAuth] Initializing PrivyClient with App ID: ${env.PRIVY_APP_ID}`);
    console.log(`[PrivyAuth] App Secret starts with: ${env.PRIVY_APP_SECRET?.substring(0, 25)}...`);
    privyServerAuth = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }
  return privyServerAuth;
}

// ===========================================
// Type Augmentation
// ===========================================

declare global {
  namespace Express {
    interface Request {
      /** Privy user ID extracted from verified JWT */
      privyUserId?: string;
      /** Original Privy access token for forwarding to wallet operations */
      privyAccessToken?: string;
    }
  }
}

// ===========================================
// Middleware Functions
// ===========================================

/**
 * Middleware to verify Privy JWT and extract user ID
 * Requires valid Bearer token in Authorization header
 *
 * @example
 * ```typescript
 * router.post('/create', verifyPrivyToken, (req, res) => {
 *   const userId = req.privyUserId;
 *   const token = req.privyAccessToken;
 *   // ...
 * });
 * ```
 */
export async function verifyPrivyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Missing authorization header',
        code: 'MISSING_AUTH_HEADER',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Invalid authorization format. Expected: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT',
      });
      return;
    }

    const accessToken = authHeader.substring(7);

    if (!accessToken) {
      res.status(401).json({
        error: 'Empty access token',
        code: 'EMPTY_TOKEN',
      });
      return;
    }

    try {
      // Verify the token using Privy server-auth SDK
      // Pass verification key as second param to avoid API call to fetch it
      const privy = getPrivyServerAuth();
      const verifiedClaims = await privy.verifyAuthToken(
        accessToken,
        env.PRIVY_VERIFICATION_KEY
      );

      // Extract user ID and attach to request
      req.privyUserId = verifiedClaims.userId;
      req.privyAccessToken = accessToken;

      console.log(`[PrivyAuth] Verified token for user: ${verifiedClaims.userId}`);
      next();
    } catch (verifyError) {
      console.warn('[PrivyAuth] Invalid token:', verifyError);
      res.status(401).json({
        error: 'Invalid or expired access token',
        code: 'INVALID_TOKEN',
      });
      return;
    }
  } catch (error) {
    console.error('[PrivyAuth] Middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional authentication middleware
 * Attempts to verify token but continues even if missing/invalid
 * Useful for endpoints that work with or without authentication
 *
 * @example
 * ```typescript
 * router.get('/public', optionalPrivyToken, (req, res) => {
 *   if (req.privyUserId) {
 *     // Authenticated user
 *   } else {
 *     // Anonymous user
 *   }
 * });
 * ```
 */
export async function optionalPrivyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    next();
    return;
  }

  const accessToken = authHeader.substring(7);

  if (!accessToken) {
    next();
    return;
  }

  try {
    const privy = getPrivyServerAuth();
    const verifiedClaims = await privy.verifyAuthToken(
      accessToken,
      env.PRIVY_VERIFICATION_KEY
    );

    req.privyUserId = verifiedClaims.userId;
    req.privyAccessToken = accessToken;

    console.log(`[PrivyAuth] Optional auth: verified user ${verifiedClaims.userId}`);
  } catch {
    // Token invalid but we continue anyway for optional auth
    console.log('[PrivyAuth] Optional auth: invalid token, continuing unauthenticated');
  }

  next();
}

/**
 * Middleware to ensure user owns the resource they're accessing
 * Must be used after verifyPrivyToken
 *
 * @param getUserIdFromRequest - Function to extract target user ID from request
 */
export function requireSameUser(
  getUserIdFromRequest: (req: Request) => string | undefined
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = getUserIdFromRequest(req);
    const authenticatedUserId = req.privyUserId;

    if (!authenticatedUserId) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!targetUserId) {
      res.status(400).json({
        error: 'Target user ID not provided',
        code: 'MISSING_USER_ID',
      });
      return;
    }

    if (targetUserId !== authenticatedUserId) {
      res.status(403).json({
        error: 'Access denied. You can only access your own resources.',
        code: 'ACCESS_DENIED',
      });
      return;
    }

    next();
  };
}

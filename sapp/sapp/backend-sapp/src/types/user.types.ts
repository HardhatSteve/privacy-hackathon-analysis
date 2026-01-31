/**
 * User & Auth Types
 * User management and authentication
 */

/**
 * User registration input
 */
export interface RegisterUserInput {
  email: string; // From Privy auth
  handle: string; // User-chosen handle (e.g., johndoe)
  privyUserId?: string; // Privy user ID
}

/**
 * Public user info (safe to expose to other users)
 */
export interface PublicUserInfo {
  handle: string;
}

/**
 * User with wallet info
 */
export interface UserWithWallet extends PublicUserInfo {
  solanaAddress?: string;
}

/**
 * Handle validation result
 */
export interface HandleValidation {
  valid: boolean;
  available?: boolean;
  error?: string;
}

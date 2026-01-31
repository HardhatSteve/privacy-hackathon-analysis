/**
 * Privy Client Service
 *
 * Singleton wrapper around the Privy Node.js SDK.
 * Provides centralized access to the Privy client for wallet operations.
 */

import { PrivyClient } from '@privy-io/node';
import { env } from '../config/env.js';

class PrivyClientService {
  private client: PrivyClient | null = null;
  private static instance: PrivyClientService;
  private initializationError: Error | null = null;

  private constructor() {
    this.initialize();
  }

  /**
   * Initialize the Privy client with app credentials
   */
  private initialize(): void {
    try {
      // Validate required environment variables
      if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
        throw new Error(
          'Missing required Privy configuration. Set PRIVY_APP_ID and PRIVY_APP_SECRET environment variables.'
        );
      }

      this.client = new PrivyClient({
        appId: env.PRIVY_APP_ID,
        appSecret: env.PRIVY_APP_SECRET,
        // Provide verification key to avoid API calls during token verification
        ...(env.PRIVY_VERIFICATION_KEY && { jwtVerificationKey: env.PRIVY_VERIFICATION_KEY }),
        // Authorization key for server wallet operations (create, sign, etc.)
        ...(env.PRIVY_AUTHORIZATION_KEY && { authorizationPrivateKey: env.PRIVY_AUTHORIZATION_KEY }),
      });

      console.log('[PrivyClientService] Initialized successfully');
    } catch (error) {
      this.initializationError = error as Error;
      console.error('[PrivyClientService] Initialization failed:', error);
    }
  }

  /**
   * Get the singleton instance of PrivyClientService
   */
  static getInstance(): PrivyClientService {
    if (!PrivyClientService.instance) {
      PrivyClientService.instance = new PrivyClientService();
    }
    return PrivyClientService.instance;
  }

  /**
   * Get the Privy client instance
   * @throws Error if client is not initialized
   */
  getClient(): PrivyClient {
    if (this.initializationError) {
      throw this.initializationError;
    }

    if (!this.client) {
      throw new Error('[PrivyClientService] Client not initialized');
    }

    return this.client;
  }

  /**
   * Check if the Privy client is initialized and ready
   */
  isReady(): boolean {
    return this.client !== null && this.initializationError === null;
  }

  /**
   * Get initialization error if any
   */
  getInitializationError(): Error | null {
    return this.initializationError;
  }
}

// Export singleton instance
export const privyClientService = PrivyClientService.getInstance();

// Export convenience function to get client directly
export function getPrivyClient(): PrivyClient {
  return privyClientService.getClient();
}

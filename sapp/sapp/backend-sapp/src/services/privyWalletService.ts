/**
 * Privy Wallet Service
 *
 * Handles all server-side wallet operations using Privy Node.js SDK.
 * Uses authorization key for all wallet operations (app-controlled wallets).
 */

import { getPrivyClient } from './privyClientService.js';
import { env } from '../config/env.js';
import type {
  ChainType,
  SolanaCluster,
  WalletCreateResponse,
  WalletInfo,
  CreateWalletParams,
  SignSolanaMessageParams,
  SignSolanaTransactionParams,
  SignAndSendSolanaTransactionParams,
  SignEthereumMessageParams,
  SignEip712Params,
  ExportWalletParams,
} from '../types/privy.types.js';

// Helper to get authorization context with the app's authorization key
function getAuthorizationContext() {
  if (!env.PRIVY_AUTHORIZATION_KEY) {
    throw new Error('PRIVY_AUTHORIZATION_KEY is required for wallet operations');
  }
  return {
    authorization_private_keys: [env.PRIVY_AUTHORIZATION_KEY],
  };
}

// CAIP-2 chain identifiers for Solana
const SOLANA_CAIP2: Record<SolanaCluster, string> = {
  'mainnet-beta': 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  devnet: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  testnet: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
};

class PrivyWalletService {
  // ===========================================
  // Wallet Creation
  // ===========================================

  /**
   * Create a new server-side wallet (app-controlled)
   * @param params.userId - Privy user ID for tracking purposes (stored in metadata)
   * @param params.chainType - Blockchain type (solana or ethereum)
   *
   * Note: Wallets are created with the authorization key as owner.
   * The authorization key is used for all operations (signing, export, etc.)
   */
  async createWallet(params: CreateWalletParams): Promise<WalletCreateResponse> {
    const privy = getPrivyClient();

    try {
      // Require authorization public key to create wallets with proper ownership
      if (!env.PRIVY_AUTHORIZATION_PUBLIC_KEY) {
        throw new Error(
          'PRIVY_AUTHORIZATION_PUBLIC_KEY is required for wallet creation. ' +
            'Get it from Privy Dashboard -> Wallets -> Authorization keys'
        );
      }

      // Create wallet with authorization key's public key as owner
      const wallet = await privy.wallets().create({
        chain_type: params.chainType,
        owner: {
          public_key: env.PRIVY_AUTHORIZATION_PUBLIC_KEY,
        },
      });

      console.log(
        `[PrivyWalletService] Created ${params.chainType} wallet for user ${params.userId}: ${wallet.address}`
      );

      return {
        walletId: wallet.id,
        address: wallet.address,
        chainType: wallet.chain_type as ChainType,
        publicKey: wallet.public_key ?? '',
      };
    } catch (error) {
      console.error('[PrivyWalletService] Failed to create wallet:', error);
      throw this.handleError(error, 'create wallet');
    }
  }

  // ===========================================
  // Wallet Retrieval
  // ===========================================

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<WalletInfo> {
    const privy = getPrivyClient();

    try {
      const wallet = await privy.wallets().get(walletId);

      return {
        id: wallet.id,
        address: wallet.address,
        publicKey: wallet.public_key ?? '',
        chainType: wallet.chain_type as ChainType,
        createdAt: wallet.created_at,
        ownerId: wallet.owner_id ?? undefined,
      };
    } catch (error) {
      console.error('[PrivyWalletService] Failed to get wallet:', error);
      throw this.handleError(error, 'get wallet');
    }
  }

  /**
   * List all wallets for a user
   * @param userId - Privy user ID
   */
  async listUserWallets(userId: string): Promise<WalletInfo[]> {
    const privy = getPrivyClient();

    try {
      const wallets: WalletInfo[] = [];

      // Use the list method with user_id filter
      for await (const wallet of privy.wallets().list({ user_id: userId })) {
        wallets.push({
          id: wallet.id,
          address: wallet.address,
          publicKey: wallet.public_key ?? '',
          chainType: wallet.chain_type as ChainType,
          createdAt: wallet.created_at,
          ownerId: wallet.owner_id ?? undefined,
        });
      }

      return wallets;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to list wallets:', error);
      throw this.handleError(error, 'list wallets');
    }
  }

  // ===========================================
  // Solana Signing Operations
  // ===========================================

  /**
   * Sign a message with a Solana wallet
   * @param params.walletId - Privy wallet ID
   * @param params.message - Base64-encoded message
   * @returns Base64-encoded signature
   */
  async signSolanaMessage(params: SignSolanaMessageParams): Promise<string> {
    const privy = getPrivyClient();

    try {
      const response = await privy.wallets().solana().signMessage(params.walletId, {
        message: params.message,
        authorization_context: getAuthorizationContext(),
      });

      console.log(`[PrivyWalletService] Signed Solana message for wallet ${params.walletId}`);
      return response.signature;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to sign Solana message:', error);
      throw this.handleError(error, 'sign Solana message');
    }
  }

  /**
   * Sign a Solana transaction
   * @param params.walletId - Privy wallet ID
   * @param params.transaction - Base64-encoded serialized transaction
   * @returns Base64-encoded signed transaction
   */
  async signSolanaTransaction(params: SignSolanaTransactionParams): Promise<string> {
    const privy = getPrivyClient();

    try {
      const response = await privy.wallets().solana().signTransaction(params.walletId, {
        transaction: params.transaction,
        authorization_context: getAuthorizationContext(),
      });

      console.log(`[PrivyWalletService] Signed Solana transaction for wallet ${params.walletId}`);
      return response.signed_transaction;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to sign Solana transaction:', error);
      throw this.handleError(error, 'sign Solana transaction');
    }
  }

  /**
   * Sign and send a Solana transaction
   * @param params.walletId - Privy wallet ID
   * @param params.transaction - Base64-encoded serialized transaction
   * @param params.cluster - Solana cluster (mainnet-beta, devnet, testnet)
   * @returns Transaction signature (hash)
   */
  async signAndSendSolanaTransaction(
    params: SignAndSendSolanaTransactionParams
  ): Promise<string> {
    const privy = getPrivyClient();

    try {
      const caip2 = SOLANA_CAIP2[params.cluster];

      const response = await privy.wallets().solana().signAndSendTransaction(params.walletId, {
        caip2,
        transaction: params.transaction,
        authorization_context: getAuthorizationContext(),
      });

      console.log(
        `[PrivyWalletService] Sent Solana transaction for wallet ${params.walletId}: ${response.hash}`
      );
      return response.hash;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to sign and send Solana transaction:', error);
      throw this.handleError(error, 'sign and send Solana transaction');
    }
  }

  // ===========================================
  // Ethereum Signing Operations
  // ===========================================

  /**
   * Sign a message with an Ethereum wallet (personal_sign)
   * @param params.walletId - Privy wallet ID
   * @param params.message - Message to sign (UTF-8 string)
   * @returns Hex signature
   */
  async signEthereumMessage(params: SignEthereumMessageParams): Promise<string> {
    const privy = getPrivyClient();

    try {
      const response = await privy.wallets().ethereum().signMessage(params.walletId, {
        message: params.message,
        authorization_context: getAuthorizationContext(),
      });

      console.log(`[PrivyWalletService] Signed Ethereum message for wallet ${params.walletId}`);
      return response.signature;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to sign Ethereum message:', error);
      throw this.handleError(error, 'sign Ethereum message');
    }
  }

  /**
   * Sign EIP-712 typed data with an Ethereum wallet
   * @param params.walletId - Privy wallet ID
   * @param params.typedData - EIP-712 typed data object
   * @returns Hex signature
   */
  async signEip712TypedData(params: SignEip712Params): Promise<string> {
    const privy = getPrivyClient();

    try {
      // Parse typed data if it's a string
      const typedDataObject =
        typeof params.typedData === 'string' ? JSON.parse(params.typedData) : params.typedData;

      const response = await privy.wallets().ethereum().signTypedData(params.walletId, {
        params: {
          typed_data: typedDataObject,
        },
        authorization_context: getAuthorizationContext(),
      });

      console.log(`[PrivyWalletService] Signed EIP-712 for wallet ${params.walletId}`);
      return response.signature;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to sign EIP-712 typed data:', error);
      throw this.handleError(error, 'sign EIP-712 typed data');
    }
  }

  // ===========================================
  // Wallet Export
  // ===========================================

  /**
   * Export wallet private key
   * The Privy SDK handles HPKE encryption/decryption internally
   * @param params.walletId - Privy wallet ID
   * @returns Decrypted private key
   */
  async exportWallet(params: ExportWalletParams): Promise<string> {
    const privy = getPrivyClient();

    try {
      // The Privy SDK handles HPKE encryption/decryption internally
      const response = await privy.wallets().export(params.walletId, {
        authorization_context: getAuthorizationContext(),
      });

      console.log(`[PrivyWalletService] Exported wallet ${params.walletId}`);
      return response.private_key;
    } catch (error) {
      console.error('[PrivyWalletService] Failed to export wallet:', error);
      throw this.handleError(error, 'export wallet');
    }
  }

  // ===========================================
  // Error Handling
  // ===========================================

  /**
   * Handle and transform Privy API errors
   */
  private handleError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      // Check for specific Privy error types
      const errorName = error.name || '';
      const errorMessage = error.message || '';

      if (errorName === 'NotFoundError' || errorMessage.includes('not found')) {
        return new WalletNotFoundError(`Wallet not found during ${operation}`);
      }

      if (errorName === 'AuthenticationError' || errorMessage.includes('unauthorized')) {
        return new WalletAuthorizationError(`Authorization failed during ${operation}`);
      }

      if (errorName === 'RateLimitError' || errorMessage.includes('rate limit')) {
        return new WalletRateLimitError(`Rate limit exceeded during ${operation}`);
      }

      return new WalletOperationError(`Failed to ${operation}: ${errorMessage}`);
    }

    return new WalletOperationError(`Unknown error during ${operation}`);
  }
}

// ===========================================
// Custom Error Classes
// ===========================================

export class WalletOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletOperationError';
  }
}

export class WalletNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletNotFoundError';
  }
}

export class WalletAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletAuthorizationError';
  }
}

export class WalletRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletRateLimitError';
  }
}

// Export singleton instance
export const privyWalletService = new PrivyWalletService();

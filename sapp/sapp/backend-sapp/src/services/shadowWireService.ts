import {
  ShadowWireClient,
  type TokenSymbol,
  type TransferType,
  type PoolBalance,
  type DepositResponse as SDKDepositResponse,
  type WithdrawResponse as SDKWithdrawResponse,
  type TransferResponse as SDKTransferResponse,
  type WalletAdapter,
} from '@radr/shadowwire';

// Import types from dedicated type files
import type {
  TransferRequest,
  TransferResponse,
  FeeBreakdown,
  ValidationResult,
} from '../types/shadowWire.types.js';

// Import utilities
import { isValidSolanaAddress } from '../utils/validation.js';

// Import Privy wallet service for server-side signing
import { privyWalletService } from './privyWalletService.js';

// Re-export types for consumers
export type { TransferRequest, TransferResponse, FeeBreakdown, ValidationResult };

/**
 * ShadowWire service - Handles all private transfer operations
 * This service wraps the ShadowWire SDK and provides a clean API for transfers
 */
class ShadowWireService {
  private client: ShadowWireClient;

  constructor() {
    this.client = new ShadowWireClient({
      apiBaseUrl: process.env.SHADOWWIRE_API_URL || 'https://api.shadowwire.io',
      debug: process.env.NODE_ENV === 'development',
    });

    console.log('[ShadowWire] Service initialized');
  }

  /**
   * Get ShadowWire balance for a wallet
   */
  async getBalance(walletAddress: string, token: string = 'SOL'): Promise<number> {
    try {
      const balanceData: PoolBalance = await this.client.getBalance(walletAddress, token as TokenSymbol);
      const balance = balanceData.available || 0;
      console.log(`[ShadowWire] Balance for ${walletAddress}: ${balance} ${token}`);
      return balance;
    } catch (error) {
      console.error('[ShadowWire] Failed to get balance:', error);
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a wallet adapter that uses Privy for server-side signing
   */
  private createPrivyWalletAdapter(walletId: string, userJwt: string): WalletAdapter {
    return {
      signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
        // Convert Uint8Array to base64 for Privy API
        const messageBase64 = Buffer.from(message).toString('base64');

        // Sign using Privy server-side wallet
        const signatureBase64 = await privyWalletService.signSolanaMessage({
          walletId,
          message: messageBase64,
          userJwt,
        });

        // Convert base64 signature back to Uint8Array
        return Buffer.from(signatureBase64, 'base64');
      },
    };
  }

  /**
   * Execute a ShadowWire transfer
   * Uses Privy server-side wallet signing for authorization
   */
  async executeTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      console.log(`[ShadowWire] Transfer: ${request.senderWallet} → ${request.recipientWallet} | ${request.amount} ${request.token} (${request.type})`);

      // Create wallet adapter using Privy for signing
      const walletAdapter = this.createPrivyWalletAdapter(request.walletId, request.userJwt);

      // Execute transfer through ShadowWire SDK
      const result: SDKTransferResponse = await this.client.transfer({
        sender: request.senderWallet,
        recipient: request.recipientWallet,
        amount: request.amount,
        token: request.token as TokenSymbol,
        type: request.type as TransferType,
        wallet: walletAdapter,
      });

      const response: TransferResponse = {
        success: result.success,
        signature: result.tx_signature || '',
        amount: result.amount_sent,  // null for internal transfers
        token: request.token,
        type: request.type,
        fee: this.calculateFeeAmount(request.amount, request.token),
        timestamp: new Date(),
      };

      console.log(`[ShadowWire] Transfer successful: ${response.signature}`);
      return response;
    } catch (error) {
      console.error('[ShadowWire] Transfer failed:', error);

      // Handle specific ShadowWire errors
      if (error instanceof Error) {
        if (error.message.includes('recipient not found')) {
          throw new Error('RECIPIENT_NOT_FOUND');
        }
        if (error.message.includes('insufficient balance')) {
          throw new Error('INSUFFICIENT_BALANCE');
        }
        throw new Error(`Transfer failed: ${error.message}`);
      }

      throw new Error('Transfer failed: Unknown error');
    }
  }

  /**
   * Deposit funds into ShadowWire
   */
  async deposit(walletAddress: string, amount: number): Promise<{ success: boolean; txHash: string }> {
    try {
      console.log(`[ShadowWire] Deposit: ${walletAddress} | ${amount} lamports`);

      const response: SDKDepositResponse = await this.client.deposit({
        wallet: walletAddress,
        amount,
      });

      return {
        success: response.success,
        txHash: response.unsigned_tx_base64 || '',  // Returns unsigned tx for client-side signing
      };
    } catch (error) {
      console.error('[ShadowWire] Deposit failed:', error);
      throw new Error(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Withdraw funds from ShadowWire
   */
  async withdraw(walletAddress: string, amount: number): Promise<{ success: boolean; txHash: string }> {
    try {
      console.log(`[ShadowWire] Withdraw: ${walletAddress} | ${amount} lamports`);

      const response: SDKWithdrawResponse = await this.client.withdraw({
        wallet: walletAddress,
        amount,
      });

      return {
        success: response.success,
        txHash: response.tx_signature || '',
      };
    } catch (error) {
      console.error('[ShadowWire] Withdraw failed:', error);
      throw new Error(`Withdraw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get fee percentage for a token
   */
  getFeePercentage(token: string): number {
    return this.client.getFeePercentage(token as TokenSymbol);
  }

  /**
   * Get minimum transfer amount for a token
   */
  getMinimumAmount(token: string): number {
    return this.client.getMinimumAmount(token as TokenSymbol);
  }

  /**
   * Calculate fee breakdown for a transfer
   */
  calculateFeeBreakdown(amount: number, token: string): FeeBreakdown {
    const breakdown = this.client.calculateFee(amount, token as TokenSymbol);

    return {
      amount,
      feePercentage: this.getFeePercentage(token),
      feeAmount: breakdown.fee,
      netAmount: breakdown.netAmount,
      minimumAmount: this.getMinimumAmount(token),
    };
  }

  /**
   * Calculate just the fee amount
   */
  private calculateFeeAmount(amount: number, token: string): number {
    const breakdown = this.client.calculateFee(amount, token as TokenSymbol);
    return breakdown.fee;
  }

  /**
   * Validate transfer request
   */
  validateTransferRequest(request: TransferRequest): ValidationResult {
    // Validate sender address
    if (!isValidSolanaAddress(request.senderWallet)) {
      return { valid: false, error: 'Invalid sender wallet address' };
    }

    // Validate recipient address
    if (!isValidSolanaAddress(request.recipientWallet)) {
      return { valid: false, error: 'Invalid recipient wallet address' };
    }

    // Validate amount
    const minimumAmount = this.getMinimumAmount(request.token);
    if (request.amount < minimumAmount) {
      return {
        valid: false,
        error: `Amount must be at least ${minimumAmount} ${request.token}`,
      };
    }

    // Validate transfer type
    if (request.type !== 'internal' && request.type !== 'external') {
      return { valid: false, error: 'Transfer type must be "internal" or "external"' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const shadowWireService = new ShadowWireService();

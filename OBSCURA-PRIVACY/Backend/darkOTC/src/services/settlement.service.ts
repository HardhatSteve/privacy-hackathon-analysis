/**
 * Settlement Service
 * 
 * Handles settlement execution via Obscura-LLMS backend.
 * Provides atomic balance updates and transaction submission through relayer network.
 * 
 * Features:
 * - Comprehensive error handling with categorization
 * - Automatic retry for transient failures
 * - Circuit breaker protection
 * - Detailed error logging (without sensitive data)
 * 
 * Requirements:
 * - 34.5: Update balances atomically using Arcium cSPL
 * - 34.6: Rollback on failure
 * - 36.1: Route through relayer network
 * - 36.3: Error handling for Obscura-LLMS integration
 * - 36.4: User address not visible in transaction logs
 */

import { obscuraLLMSClient } from '../clients/obscura-llms.client';
import { ObscuraError, ErrorCategory } from '../utils/errors';

export interface SettlementParams {
  /**
   * Commitment from deposit note
   */
  commitment: string;
  
  /**
   * Nullifier hash for double-spend protection
   */
  nullifierHash: string;
  
  /**
   * Recipient address (can be stealth address)
   */
  recipient: string;
  
  /**
   * Amount to settle (in smallest units: lamports for SOL, wei for ETH)
   */
  amount: string;
  
  /**
   * Chain ID for settlement
   */
  chainId: 'solana-devnet' | 'sepolia';
}

export interface SettlementResult {
  /**
   * Whether settlement was successful
   */
  success: boolean;
  
  /**
   * Transaction hash (verifiable on blockchain explorer)
   */
  txHash?: string;
  
  /**
   * Request ID for tracking
   */
  requestId?: string;
  
  /**
   * Whether ZK compression was used (Solana only)
   */
  zkCompressed?: boolean;
  
  /**
   * Compression signature (Solana only)
   */
  compressionSignature?: string;
  
  /**
   * Settlement status
   */
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  
  /**
   * Error message if settlement failed
   */
  error?: string;
}

export class SettlementService {
  /**
   * Execute settlement via Obscura-LLMS backend
   * 
   * This method handles the complete settlement flow:
   * 1. Submit withdrawal request to Obscura-LLMS
   * 2. Obscura-LLMS performs atomic balance updates (Arcium cSPL)
   * 3. Relayer submits transaction (direct transfer, NO vault PDA)
   * 4. ZK compression applied (Solana only, Light Protocol)
   * 5. Return transaction hash and status
   * 
   * Privacy guarantees:
   * - User address NOT visible in transaction (relayer submits)
   * - Balances updated off-chain (Arcium cSPL)
   * - Direct transfer method (no vault PDA in transaction)
   * - Graph tracing prevention (cannot link depositor → recipient)
   * 
   * Atomicity:
   * - Balance updates are atomic (both parties or neither)
   * - If settlement fails, balances are NOT updated
   * - Obscura-LLMS handles rollback internally
   * 
   * Requirements:
   * - 34.5: Atomic balance updates via Arcium cSPL
   * - 34.6: Rollback on failure
   * - 36.1: Route through relayer network
   * - 36.4: User address not visible
   * 
   * @param params - Settlement parameters
   * @returns Settlement result with transaction hash
   */
  async executeSettlement(params: SettlementParams): Promise<SettlementResult> {
    try {
      // Validate inputs
      if (!params.commitment || params.commitment.length === 0) {
        return {
          success: false,
          error: 'Invalid commitment: commitment is required',
        };
      }
      
      if (!params.nullifierHash || params.nullifierHash.length === 0) {
        return {
          success: false,
          error: 'Invalid nullifierHash: nullifierHash is required',
        };
      }
      
      if (!params.recipient || params.recipient.length === 0) {
        return {
          success: false,
          error: 'Invalid recipient: recipient address is required',
        };
      }
      
      if (!params.amount || params.amount === '0') {
        return {
          success: false,
          error: 'Invalid amount: amount must be positive',
        };
      }
      
      // Log settlement attempt (without sensitive data)
      console.log(
        `[SettlementService] Executing settlement on ${params.chainId} ` +
        `for amount ${params.amount}`
      );
      
      // Submit withdrawal request to Obscura-LLMS
      // This triggers:
      // 1. Off-chain balance verification (Arcium cSPL)
      // 2. Atomic balance updates (both parties)
      // 3. Relayer submission (direct transfer)
      // 4. ZK compression (Solana only)
      const withdrawalResponse = await obscuraLLMSClient.withdraw({
        commitment: params.commitment,
        nullifierHash: params.nullifierHash,
        recipient: params.recipient,
        amount: params.amount,
        chainId: params.chainId,
      });
      
      // Check if withdrawal was successful
      if (!withdrawalResponse.success) {
        console.error('[SettlementService] Settlement rejected by Obscura-LLMS');
        return {
          success: false,
          error: 'Settlement failed: withdrawal request rejected',
        };
      }
      
      // Log success (without sensitive data)
      console.log(
        `[SettlementService] Settlement successful: ` +
        `txHash=${withdrawalResponse.txHash}, ` +
        `zkCompressed=${withdrawalResponse.zkCompressed}`
      );
      
      // Return settlement result
      return {
        success: true,
        txHash: withdrawalResponse.txHash,
        requestId: withdrawalResponse.requestId,
        zkCompressed: withdrawalResponse.zkCompressed,
        compressionSignature: withdrawalResponse.compressionSignature,
        status: withdrawalResponse.status,
      };
      
    } catch (error) {
      // Handle categorized errors
      if (error instanceof ObscuraError) {
        // Log error (without sensitive data)
        console.error(
          `[SettlementService] Settlement failed: ${error.category} - ${error.message}`
        );
        
        // Map error categories to user-friendly messages
        switch (error.category) {
          case ErrorCategory.NETWORK:
            return {
              success: false,
              error: 'Network error: Unable to connect to settlement service',
            };
          case ErrorCategory.TIMEOUT:
            return {
              success: false,
              error: 'Request timeout: Settlement took too long',
            };
          case ErrorCategory.RELAYER_UNAVAILABLE:
            return {
              success: false,
              error: 'Relayer service unavailable: Please try again later',
            };
          case ErrorCategory.INSUFFICIENT_BALANCE:
            return {
              success: false,
              error: 'Insufficient balance for settlement',
            };
          case ErrorCategory.INVALID_INPUT:
            return {
              success: false,
              error: `Invalid input: ${error.message}`,
            };
          default:
            return {
              success: false,
              error: `Settlement failed: ${error.message}`,
            };
        }
      }
      
      // Handle unknown errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SettlementService] Unexpected error:`, error);
      
      // Check for specific error patterns (legacy error handling)
      if (errorMessage.includes('Insufficient balance')) {
        return {
          success: false,
          error: 'Settlement failed: insufficient balance',
        };
      }
      
      if (errorMessage.includes('Nullifier already used')) {
        return {
          success: false,
          error: 'Settlement failed: nullifier already used (double-spend attempt)',
        };
      }
      
      if (errorMessage.includes('Service unavailable') || errorMessage.includes('503')) {
        return {
          success: false,
          error: 'Settlement failed: relayer service unavailable',
        };
      }
      
      // Generic error
      return {
        success: false,
        error: `Settlement failed: ${errorMessage}`,
      };
    }
  }
  
  /**
   * Get settlement status by request ID
   * 
   * @param requestId - Request ID from settlement
   * @returns Settlement status
   */
  async getSettlementStatus(requestId: string): Promise<SettlementResult> {
    try {
      if (!requestId || requestId.length === 0) {
        return {
          success: false,
          error: 'Invalid requestId: requestId is required',
        };
      }
      
      const request = await obscuraLLMSClient.getWithdrawalRequest(requestId);
      
      return {
        success: request.status === 'completed',
        txHash: request.txHash,
        requestId: request.requestId,
        status: request.status,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: `Failed to get settlement status: ${errorMessage}`,
      };
    }
  }
  
  /**
   * Verify settlement transaction on blockchain
   * 
   * This method provides the blockchain explorer URL for verification.
   * All transactions are verifiable on public explorers.
   * 
   * @param txHash - Transaction hash
   * @param chainId - Chain identifier
   * @returns Explorer URL
   */
  getExplorerUrl(txHash: string, chainId: 'solana-devnet' | 'sepolia'): string {
    if (chainId === 'solana-devnet') {
      return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
    } else {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    }
  }
  
  /**
   * Check if settlement service is available
   * 
   * @returns True if service is operational
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const status = await obscuraLLMSClient.getPrivacyStatus();
      return status.status === 'operational';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const settlementService = new SettlementService();

/**
 * SwapAndPay Service
 * Orchestrates combined swap and payment operations for fulfilling payment requests
 */

import type {
  SwapSuggestion,
  SwapSuggestionsRequest,
  SwapSuggestionsResponse,
  SwapAndPayRequest,
  SwapAndPayResponse,
  SwapResult,
  PaymentResult,
} from '../types/swapAndPay.types.js';
import type { SupportedChain } from '../types/silentSwap.types.js';

import { shadowWireService } from './shadowWireService.js';
import { silentSwapService } from './silentSwapService.js';
import { User } from '../models/User.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Well-known token mint addresses (Solana mainnet)
const TOKEN_MINTS: Record<string, string> = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  SOL: 'native',
};

// Token decimals
const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
};

class SwapAndPayService {
  private solanaConnection: Connection;

  constructor() {
    const solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');
    console.log('[SwapAndPayService] Initialized');
  }

  /**
   * Get swap suggestions for fulfilling a payment
   */
  async getSwapSuggestions(request: SwapSuggestionsRequest): Promise<SwapSuggestionsResponse> {
    const { walletAddress, targetToken, targetAmount } = request;

    console.log(`[SwapAndPayService] Getting swap suggestions for ${targetAmount} ${targetToken}`);

    // Get all balances for the wallet
    const balances = await this.getAllBalances(walletAddress);

    // Calculate total needed (including fees)
    const feeBreakdown = shadowWireService.calculateFeeBreakdown(targetAmount, targetToken);
    const totalNeeded = feeBreakdown.netAmount + feeBreakdown.feeAmount;

    // Check if user already has enough
    const currentBalance = balances[targetToken] || 0;
    if (currentBalance >= totalNeeded) {
      console.log(`[SwapAndPayService] User has sufficient ${targetToken} balance`);
      return {
        suggestions: [],
        targetToken,
        targetAmount,
      };
    }

    // Build suggestions from available tokens
    const suggestions: SwapSuggestion[] = [];
    let priority = 1;

    for (const [token, balance] of Object.entries(balances)) {
      // Skip the target token and tokens with negligible balances
      if (token === targetToken || balance < 0.0001) continue;

      // Keep some SOL for gas fees
      const availableBalance = token === 'SOL' ? Math.max(0, balance - 0.01) : balance;
      if (availableBalance <= 0) continue;

      // Estimate swap amount needed
      const estimatedFromAmount = await this.estimateSwapAmount(token, targetToken, targetAmount);
      if (estimatedFromAmount <= 0) continue;

      // Check if user has enough of this token
      if (availableBalance < estimatedFromAmount) continue;

      // Prioritize stablecoins
      const isStablecoin = token === 'USDC' || token === 'USDT';
      const suggestionPriority = isStablecoin ? 1 : priority++;

      suggestions.push({
        fromToken: token,
        fromAmount: estimatedFromAmount,
        toToken: targetToken,
        toAmount: targetAmount,
        estimatedFee: 0.5, // Approximate swap fee in USD
        userBalance: balance,
        isRecommended: suggestionPriority === 1,
        priority: suggestionPriority,
      });
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    // Mark the first one as recommended
    if (suggestions.length > 0) {
      suggestions[0].isRecommended = true;
    }

    console.log(`[SwapAndPayService] Found ${suggestions.length} swap suggestions`);

    return {
      suggestions,
      targetToken,
      targetAmount,
    };
  }

  /**
   * Execute combined swap and payment
   */
  async executeSwapAndPay(request: SwapAndPayRequest): Promise<SwapAndPayResponse> {
    console.log(`[SwapAndPayService] Executing swap and pay: ${request.swapAmount} ${request.fromToken} → ${request.paymentAmount} ${request.paymentToken} to @${request.recipientHandle}`);

    let swapResult: SwapResult | undefined;

    try {
      // Step 1: Execute swap via SilentSwap
      console.log('[SwapAndPayService] Step 1: Executing swap...');

      // Get quote
      const quoteRequest = {
        evmAddress: request.evmAddress,
        entropy: request.entropy,
        fromToken: TOKEN_MINTS[request.fromToken] || request.fromToken,
        toToken: TOKEN_MINTS[request.paymentToken] || request.paymentToken,
        amount: String(request.swapAmount),
        fromChain: request.fromChain as SupportedChain,
        toChain: 'solana' as SupportedChain,
        recipientAddress: request.senderWallet, // Swap to self first
        senderAddress: request.senderWallet,
      };

      const quote = await silentSwapService.getQuote(quoteRequest);

      // Execute swap
      const executeRequest = {
        quoteId: quote.quoteId,
        evmAddress: request.evmAddress,
        entropy: request.entropy,
        signedAuthorizations: [], // Will be populated by the client
        orderSignature: '', // Will be populated by the client
        eip712Domain: null, // Will be populated by the client
        rawQuote: quote.rawQuote,
      };

      const swapExecution = await silentSwapService.executeSwap(executeRequest);

      swapResult = {
        orderId: swapExecution.orderId,
        amountSwapped: request.swapAmount,
        amountReceived: quote.estimatedOutput,
        signature: swapExecution.transaction || undefined,
      };

      console.log(`[SwapAndPayService] Swap completed: ${swapResult.orderId}`);

      // Step 2: Wait for swap completion
      console.log('[SwapAndPayService] Step 2: Waiting for swap confirmation...');
      await this.waitForSwapCompletion(swapResult.orderId);

    } catch (error) {
      console.error('[SwapAndPayService] Swap failed:', error);
      return {
        success: false,
        error: {
          stage: 'swap',
          code: 'SWAP_FAILED',
          message: error instanceof Error ? error.message : 'Swap failed',
          swapCompleted: false,
        },
      };
    }

    // Step 3: Execute payment via ShadowWire
    console.log('[SwapAndPayService] Step 3: Executing payment...');

    let paymentResult: PaymentResult | undefined;

    try {
      // Look up recipient's wallet address
      const recipient = await User.findOne({
        handle: { $regex: new RegExp(`^${request.recipientHandle}$`, 'i') },
      });

      if (!recipient || !recipient.solanaAddress) {
        throw new Error('Recipient not found or has no wallet');
      }

      // Execute transfer
      const transferResponse = await shadowWireService.executeTransfer({
        senderWallet: request.senderWallet,
        recipientWallet: recipient.solanaAddress,
        amount: request.paymentAmount,
        token: request.paymentToken,
        type: request.paymentType,
        walletId: request.walletId,
        userJwt: request.userJwt,
      });

      paymentResult = {
        signature: transferResponse.signature,
        amount: request.paymentAmount,
        token: request.paymentToken,
        type: request.paymentType,
        recipientHandle: request.recipientHandle,
      };

      console.log(`[SwapAndPayService] Payment completed: ${paymentResult.signature}`);

    } catch (error) {
      console.error('[SwapAndPayService] Payment failed after swap:', error);
      return {
        success: false,
        swapResult,
        error: {
          stage: 'payment',
          code: 'PAYMENT_FAILED',
          message: error instanceof Error ? error.message : 'Payment failed',
          swapCompleted: true,
        },
      };
    }

    // Success!
    return {
      success: true,
      swapResult,
      paymentResult,
    };
  }

  /**
   * Get all token balances for a wallet
   */
  private async getAllBalances(walletAddress: string): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};

    try {
      const pubkey = new PublicKey(walletAddress);

      // Get SOL balance
      const solBalance = await this.solanaConnection.getBalance(pubkey);
      balances['SOL'] = solBalance / LAMPORTS_PER_SOL;

      // Get SPL token balances
      for (const [symbol, mint] of Object.entries(TOKEN_MINTS)) {
        if (mint === 'native') continue;

        try {
          const mintPubkey = new PublicKey(mint);
          const ata = await getAssociatedTokenAddress(mintPubkey, pubkey);
          const account = await getAccount(this.solanaConnection, ata);
          const decimals = TOKEN_DECIMALS[symbol] || 6;
          balances[symbol] = Number(account.amount) / Math.pow(10, decimals);
        } catch {
          // Token account doesn't exist, balance is 0
          balances[symbol] = 0;
        }
      }

      console.log(`[SwapAndPayService] Balances for ${walletAddress}:`, balances);

    } catch (error) {
      console.error('[SwapAndPayService] Failed to get balances:', error);
    }

    return balances;
  }

  /**
   * Estimate amount needed to swap for target amount
   * Uses the quote API for accurate real-time pricing
   */
  private async estimateSwapAmount(
    fromToken: string,
    toToken: string,
    toAmount: number
  ): Promise<number> {
    try {
      // Get actual quote from SilentSwap for accurate pricing
      const fromMint = TOKEN_MINTS[fromToken] || fromToken;
      const toMint = TOKEN_MINTS[toToken] || toToken;

      // Use a test amount to get exchange rate, then scale
      const testAmount = 1.0;
      const quoteRequest = {
        evmAddress: '0x0000000000000000000000000000000000000000', // Placeholder for quote
        entropy: 'estimate',
        fromToken: fromMint,
        toToken: toMint,
        amount: String(testAmount),
        fromChain: 'solana' as SupportedChain,
        toChain: 'solana' as SupportedChain,
        recipientAddress: 'So11111111111111111111111111111111111111112', // Placeholder
        senderAddress: 'So11111111111111111111111111111111111111112',
      };

      const quote = await silentSwapService.getQuote(quoteRequest);

      if (quote.estimatedOutput && parseFloat(quote.estimatedOutput) > 0) {
        const rate = parseFloat(quote.estimatedOutput) / testAmount;
        const estimatedInput = (toAmount / rate) * 1.02; // Add 2% buffer for slippage
        console.log(`[SwapAndPayService] Dynamic estimate: ${estimatedInput} ${fromToken} for ${toAmount} ${toToken} (rate: ${rate})`);
        return estimatedInput;
      }
    } catch (error) {
      console.log(`[SwapAndPayService] Quote API unavailable, using fallback: ${error}`);
    }

    // Fallback estimation when quote API is unavailable
    return this.fallbackEstimate(fromToken, toToken, toAmount);
  }

  /**
   * Fallback estimation when quote API is unavailable
   */
  private fallbackEstimate(fromToken: string, toToken: string, toAmount: number): number {
    // Stablecoin swaps have minimal slippage
    if ((fromToken === 'USDC' || fromToken === 'USDT') &&
        (toToken === 'USDC' || toToken === 'USDT')) {
      return toAmount * 1.001;
    }

    // For other pairs, use a conservative 15% buffer
    // This is only a fallback - the quote API should be used for accuracy
    console.log(`[SwapAndPayService] Using fallback estimate for ${fromToken} -> ${toToken}`);
    return toAmount * 1.15;
  }

  /**
   * Wait for swap to complete
   */
  private async waitForSwapCompletion(orderId: string, maxAttempts: number = 60): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await silentSwapService.getSwapStatus(orderId);

        switch (status.status) {
          case 'completed':
            console.log(`[SwapAndPayService] Swap confirmed on attempt ${attempt}`);
            return;
          case 'failed':
            throw new Error(status.error || 'Swap failed');
          case 'pending':
          case 'processing':
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          default:
            // Unknown status, wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Swap timed out waiting for confirmation');
  }
}

// Export singleton instance
export const swapAndPayService = new SwapAndPayService();

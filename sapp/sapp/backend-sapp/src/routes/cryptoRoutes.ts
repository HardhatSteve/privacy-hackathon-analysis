import { Router, type Request, type Response } from 'express';
import { shadowWireService, type TransferRequest } from '../services/shadowWireService.js';
import { swapAndPayService } from '../services/swapAndPayService.js';
import { User } from '../models/User.js';
import { isValidSolanaAddress } from '../utils/validation.js';
import { verifyPrivyToken } from '../middleware/privyAuth.js';
import type { SwapSuggestionsRequest, SwapAndPayRequest } from '../types/swapAndPay.types.js';

const router = Router();

/**
 * GET /api/sapp/crypto/balance/:walletAddress
 * Get ShadowWire balance for a wallet
 */
router.get('/balance/:walletAddress', async (req: Request, res: Response) => {
  try {
    const walletAddressParam = req.params.walletAddress;
    const walletAddress = typeof walletAddressParam === 'string' ? walletAddressParam : walletAddressParam[0];
    const tokenParam = req.query.token;
    const token = typeof tokenParam === 'string' ? tokenParam : 'SOL';

    // Validate wallet address
    if (!isValidSolanaAddress(walletAddress)) {
      res.status(400).json({
        error: 'INVALID_ADDRESS',
        message: 'Invalid Solana wallet address',
      });
      return;
    }

    const balance = await shadowWireService.getBalance(walletAddress, token);

    res.json({
      walletAddress,
      token,
      balance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Crypto Routes] Failed to get balance:', error);
    res.status(500).json({
      error: 'BALANCE_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch balance',
    });
  }
});

/**
 * POST /api/sapp/crypto/transfer
 * Execute a ShadowWire transfer
 * Requires authentication for wallet signing
 * Body: { senderWallet, recipientWallet, amount, token, type }
 */
router.post('/transfer', verifyPrivyToken, async (req: Request, res: Response) => {
  try {
    // Look up sender's wallet info for signing
    const senderUser = await User.findOne({ solanaAddress: req.body.senderWallet });

    if (!senderUser || !senderUser.solanaWalletId) {
      res.status(400).json({
        error: 'WALLET_NOT_FOUND',
        message: 'Sender wallet not found or not a server-managed wallet',
      });
      return;
    }

    // Verify the authenticated user owns this wallet
    if (senderUser.privyUserId !== req.privyUserId) {
      res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'You can only transfer from your own wallet',
      });
      return;
    }

    const transferRequest: TransferRequest = {
      senderWallet: req.body.senderWallet,
      recipientWallet: req.body.recipientWallet,
      amount: parseFloat(req.body.amount),
      token: req.body.token || 'SOL',
      type: req.body.type || 'internal',
      // Pass wallet signing authorization
      walletId: senderUser.solanaWalletId,
      userJwt: req.privyAccessToken!,
    };

    // Validate request
    const validation = shadowWireService.validateTransferRequest(transferRequest);
    if (!validation.valid) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: validation.error,
      });
      return;
    }

    // Execute transfer
    const result = await shadowWireService.executeTransfer(transferRequest);

    res.json({
      success: true,
      transfer: result,
    });
  } catch (error) {
    console.error('[Crypto Routes] Transfer failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'RECIPIENT_NOT_FOUND') {
        res.status(404).json({
          error: 'RECIPIENT_NOT_FOUND',
          message: 'Recipient wallet not found in ShadowWire network',
        });
        return;
      }

      if (error.message === 'INSUFFICIENT_BALANCE') {
        res.status(400).json({
          error: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient balance for transfer including fees',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'TRANSFER_FAILED',
      message: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
});

/**
 * POST /api/sapp/crypto/transfer/to-handle
 * Execute transfer to a Sapp user by handle
 * Requires authentication for wallet signing
 * Body: { senderWallet, recipientHandle, amount, token, type }
 */
router.post('/transfer/to-handle', verifyPrivyToken, async (req: Request, res: Response) => {
  try {
    const { senderWallet, recipientHandle, amount, token = 'SOL', type = 'internal' } = req.body;

    // Validate required fields
    if (!senderWallet || !recipientHandle || !amount) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: senderWallet, recipientHandle, amount',
      });
      return;
    }

    // Look up sender's wallet info for signing
    const senderUser = await User.findOne({ solanaAddress: senderWallet });

    if (!senderUser || !senderUser.solanaWalletId) {
      res.status(400).json({
        error: 'WALLET_NOT_FOUND',
        message: 'Sender wallet not found or not a server-managed wallet',
      });
      return;
    }

    // Verify the authenticated user owns this wallet
    if (senderUser.privyUserId !== req.privyUserId) {
      res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'You can only transfer from your own wallet',
      });
      return;
    }

    // Look up recipient's Solana address by handle
    const recipientUser = await User.findOne({ handle: recipientHandle.toLowerCase() });

    if (!recipientUser || !recipientUser.solanaAddress) {
      res.status(404).json({
        error: 'RECIPIENT_NOT_FOUND',
        message: `User @${recipientHandle} not found or has no wallet connected`,
      });
      return;
    }

    // Execute transfer
    const transferRequest: TransferRequest = {
      senderWallet,
      recipientWallet: recipientUser.solanaAddress,
      amount: parseFloat(amount),
      token,
      type,
      walletId: senderUser.solanaWalletId,
      userJwt: req.privyAccessToken!,
    };

    const validation = shadowWireService.validateTransferRequest(transferRequest);
    if (!validation.valid) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: validation.error,
      });
      return;
    }

    const result = await shadowWireService.executeTransfer(transferRequest);

    res.json({
      success: true,
      transfer: result,
      recipientHandle,
      recipientWallet: recipientUser.solanaAddress,
    });
  } catch (error) {
    console.error('[Crypto Routes] Transfer to handle failed:', error);

    if (error instanceof Error) {
      if (error.message === 'RECIPIENT_NOT_FOUND') {
        res.status(404).json({
          error: 'RECIPIENT_NOT_FOUND',
          message: 'Recipient wallet not found in ShadowWire network',
        });
        return;
      }

      if (error.message === 'INSUFFICIENT_BALANCE') {
        res.status(400).json({
          error: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient balance for transfer including fees',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'TRANSFER_FAILED',
      message: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
});

/**
 * POST /api/sapp/crypto/deposit
 * Deposit funds into ShadowWire
 * Body: { wallet, amount }
 */
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { wallet, amount } = req.body;

    if (!wallet || !amount) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: wallet, amount',
      });
      return;
    }

    if (!isValidSolanaAddress(wallet)) {
      res.status(400).json({
        error: 'INVALID_ADDRESS',
        message: 'Invalid Solana wallet address',
      });
      return;
    }

    const result = await shadowWireService.deposit(wallet, parseInt(amount));

    res.json({
      success: true,
      txHash: result.txHash,
      wallet,
      amount: parseInt(amount),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Crypto Routes] Deposit failed:', error);
    res.status(500).json({
      error: 'DEPOSIT_FAILED',
      message: error instanceof Error ? error.message : 'Deposit failed',
    });
  }
});

/**
 * POST /api/sapp/crypto/withdraw
 * Withdraw funds from ShadowWire
 * Body: { wallet, amount }
 */
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { wallet, amount } = req.body;

    if (!wallet || !amount) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: wallet, amount',
      });
      return;
    }

    if (!isValidSolanaAddress(wallet)) {
      res.status(400).json({
        error: 'INVALID_ADDRESS',
        message: 'Invalid Solana wallet address',
      });
      return;
    }

    const result = await shadowWireService.withdraw(wallet, parseInt(amount));

    res.json({
      success: true,
      txHash: result.txHash,
      wallet,
      amount: parseInt(amount),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Crypto Routes] Withdraw failed:', error);
    res.status(500).json({
      error: 'WITHDRAW_FAILED',
      message: error instanceof Error ? error.message : 'Withdraw failed',
    });
  }
});

/**
 * GET /api/sapp/crypto/fee/:token
 * Get fee information for a token
 */
router.get('/fee/:token', (req: Request, res: Response) => {
  try {
    const tokenParam = req.params.token;
    const token = typeof tokenParam === 'string' ? tokenParam : tokenParam[0];
    const amountParam = req.query.amount;

    const feePercentage = shadowWireService.getFeePercentage(token);
    const minimumAmount = shadowWireService.getMinimumAmount(token);

    let breakdown = null;
    if (amountParam && typeof amountParam === 'string') {
      breakdown = shadowWireService.calculateFeeBreakdown(parseFloat(amountParam), token);
    }

    res.json({
      token,
      feePercentage,
      minimumAmount,
      breakdown,
    });
  } catch (error) {
    console.error('[Crypto Routes] Failed to get fee info:', error);
    res.status(500).json({
      error: 'FEE_CALCULATION_FAILED',
      message: error instanceof Error ? error.message : 'Failed to calculate fee',
    });
  }
});

/**
 * GET /api/sapp/crypto/tokens
 * Get list of supported tokens
 */
router.get('/tokens', (_req: Request, res: Response) => {
  const supportedTokens = [
    { symbol: 'SOL', decimals: 9, fee: 0.5 },
    { symbol: 'RADR', decimals: 9, fee: 0.3 },
    { symbol: 'USDC', decimals: 6, fee: 1.0 },
    { symbol: 'ORE', decimals: 11, fee: 0.3 },
    { symbol: 'BONK', decimals: 5, fee: 1.0 },
    { symbol: 'JIM', decimals: 9, fee: 1.0 },
    { symbol: 'GODL', decimals: 11, fee: 1.0 },
    { symbol: 'HUSTLE', decimals: 9, fee: 0.3 },
    { symbol: 'ZEC', decimals: 9, fee: 1.0 },
    { symbol: 'CRT', decimals: 9, fee: 1.0 },
    { symbol: 'BLACKCOIN', decimals: 6, fee: 1.0 },
    { symbol: 'GIL', decimals: 6, fee: 1.0 },
    { symbol: 'ANON', decimals: 9, fee: 1.0 },
    { symbol: 'WLFI', decimals: 6, fee: 1.0 },
    { symbol: 'USD1', decimals: 6, fee: 1.0 },
    { symbol: 'AOL', decimals: 6, fee: 1.0 },
    { symbol: 'IQLABS', decimals: 9, fee: 0.5 },
    { symbol: 'SANA', decimals: 6, fee: 1.0 },
    { symbol: 'POKI', decimals: 9, fee: 1.0 },
    { symbol: 'RAIN', decimals: 6, fee: 2.0 },
    { symbol: 'HOSICO', decimals: 9, fee: 1.0 },
    { symbol: 'SKR', decimals: 6, fee: 0.5 },
  ];

  res.json({
    tokens: supportedTokens,
    count: supportedTokens.length,
  });
});

/**
 * POST /api/sapp/crypto/swap-suggestions
 * Get swap suggestions for fulfilling a payment
 * Body: { walletAddress, targetToken, targetAmount }
 */
router.post('/swap-suggestions', verifyPrivyToken, async (req: Request, res: Response) => {
  try {
    const { walletAddress, targetToken, targetAmount } = req.body;

    // Validate wallet address
    if (!isValidSolanaAddress(walletAddress)) {
      res.status(400).json({
        error: 'INVALID_ADDRESS',
        message: 'Invalid Solana wallet address',
      });
      return;
    }

    // Validate inputs
    if (!targetToken || typeof targetToken !== 'string') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Target token is required',
      });
      return;
    }

    if (!targetAmount || typeof targetAmount !== 'number' || targetAmount <= 0) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Target amount must be a positive number',
      });
      return;
    }

    const request: SwapSuggestionsRequest = {
      walletAddress,
      targetToken,
      targetAmount,
    };

    const result = await swapAndPayService.getSwapSuggestions(request);

    res.json(result);
  } catch (error) {
    console.error('[Crypto Routes] Failed to get swap suggestions:', error);
    res.status(500).json({
      error: 'SWAP_SUGGESTIONS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get swap suggestions',
    });
  }
});

/**
 * POST /api/sapp/crypto/swap-and-pay
 * Execute combined swap and payment operation
 * Body: SwapAndPayRequest
 */
router.post('/swap-and-pay', verifyPrivyToken, async (req: Request, res: Response) => {
  try {
    // Look up sender's wallet info for signing
    const senderUser = await User.findOne({ solanaAddress: req.body.senderWallet });

    if (!senderUser || !senderUser.solanaWalletId) {
      res.status(400).json({
        error: 'WALLET_NOT_FOUND',
        message: 'Sender wallet not found or not a server-managed wallet',
      });
      return;
    }

    // Verify the authenticated user owns this wallet
    if (senderUser.privyUserId !== req.privyUserId) {
      res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'You can only execute transactions from your own wallet',
      });
      return;
    }

    // Validate required fields
    const requiredFields = ['fromToken', 'swapAmount', 'paymentToken', 'paymentAmount', 'recipientHandle', 'senderWallet'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: `Missing required field: ${field}`,
        });
        return;
      }
    }

    const request: SwapAndPayRequest = {
      // Swap parameters
      fromToken: req.body.fromToken,
      fromChain: req.body.fromChain || 'solana',
      swapAmount: req.body.swapAmount,
      evmAddress: req.body.evmAddress || '',
      entropy: req.body.entropy || '',

      // Payment parameters
      paymentToken: req.body.paymentToken,
      paymentAmount: parseFloat(req.body.paymentAmount),
      recipientHandle: req.body.recipientHandle,
      paymentType: req.body.paymentType || 'internal',
      paymentRequestId: req.body.paymentRequestId,

      // Auth
      senderWallet: req.body.senderWallet,
      walletId: senderUser.solanaWalletId,
      userJwt: req.privyAccessToken!,
    };

    const result = await swapAndPayService.executeSwapAndPay(request);

    if (result.success) {
      res.json(result);
    } else {
      // Return error with appropriate status code
      const statusCode = result.error?.stage === 'payment' && result.error?.swapCompleted ? 200 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('[Crypto Routes] Swap and pay failed:', error);
    res.status(500).json({
      success: false,
      error: {
        stage: 'swap',
        code: 'SWAP_AND_PAY_FAILED',
        message: error instanceof Error ? error.message : 'Swap and pay failed',
        swapCompleted: false,
      },
    });
  }
});

export default router;

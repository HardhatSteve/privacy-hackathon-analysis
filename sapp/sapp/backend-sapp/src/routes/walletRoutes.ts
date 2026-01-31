/**
 * Wallet API Routes
 *
 * RESTful API endpoints for server-side wallet operations.
 * All routes require Privy JWT authentication.
 */

import { Router, type Request, type Response } from 'express';
import { privyWalletService, WalletNotFoundError, WalletAuthorizationError, WalletRateLimitError } from '../services/privyWalletService.js';
import { verifyPrivyToken } from '../middleware/privyAuth.js';
import { UserRegistrationService } from '../services/authService.js';
import type {
  WalletCreateRequest,
  SignMessageRequest,
  SignTransactionRequest,
  SignAndSendRequest,
  SignTypedDataRequest,
  ExportWalletRequest,
  ChainType,
  SolanaCluster,
} from '../types/privy.types.js';

const router = Router();

// ===========================================
// Apply authentication to all wallet routes
// ===========================================

router.use(verifyPrivyToken);

// ===========================================
// Wallet Creation
// ===========================================

/**
 * POST /api/sapp/wallet/create
 * Create a new server-side wallet for the authenticated user
 *
 * @body chainType - 'solana' or 'ethereum'
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { chainType } = req.body as WalletCreateRequest;

    // Validate chain type
    if (!chainType || !['solana', 'ethereum'].includes(chainType)) {
      res.status(400).json({
        error: 'Invalid chainType. Must be "solana" or "ethereum"',
        code: 'INVALID_CHAIN_TYPE',
      });
      return;
    }

    // Create the wallet (user JWT required for authorization)
    const wallet = await privyWalletService.createWallet({
      userId: req.privyUserId!,
      chainType: chainType as ChainType,
      userJwt: req.privyAccessToken!,
    });

    // Update user record with wallet address AND wallet ID
    try {
      if (chainType === 'solana') {
        await UserRegistrationService.updateWalletIds(req.privyUserId!, {
          solanaWalletId: wallet.walletId,
          solanaAddress: wallet.address,
        });
      } else if (chainType === 'ethereum') {
        await UserRegistrationService.updateWalletIds(req.privyUserId!, {
          ethereumWalletId: wallet.walletId,
          ethereumAddress: wallet.address,
        });
      }
    } catch (updateError) {
      // Log but don't fail the request if user update fails
      console.warn('[WalletRoutes] Failed to update user record:', updateError);
    }

    res.status(201).json(wallet);
  } catch (error) {
    handleWalletError(res, error, 'create wallet');
  }
});

// ===========================================
// Wallet Retrieval
// ===========================================

/**
 * GET /api/sapp/wallet/user/list
 * List all wallets for the authenticated user
 */
router.get('/user/list', async (req: Request, res: Response) => {
  try {
    const wallets = await privyWalletService.listUserWallets(req.privyUserId!);
    res.json({ wallets });
  } catch (error) {
    handleWalletError(res, error, 'list wallets');
  }
});

/**
 * GET /api/sapp/wallet/:walletId
 * Get details for a specific wallet
 */
router.get('/:walletId', async (req: Request, res: Response) => {
  try {
    const walletId = req.params.walletId as string;

    if (!walletId) {
      res.status(400).json({
        error: 'Wallet ID is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    const wallet = await privyWalletService.getWallet(walletId);
    res.json(wallet);
  } catch (error) {
    handleWalletError(res, error, 'get wallet');
  }
});

// ===========================================
// Message Signing
// ===========================================

/**
 * POST /api/sapp/wallet/sign-message
 * Sign a message with the specified wallet
 *
 * @body walletId - Privy wallet ID
 * @body message - Message to sign (base64 for Solana, UTF-8 for Ethereum)
 * @body chainType - Optional: 'solana' or 'ethereum' (defaults to solana)
 */
router.post('/sign-message', async (req: Request, res: Response) => {
  try {
    const { walletId, message, chainType = 'solana' } = req.body as SignMessageRequest & { chainType?: ChainType };

    // Validate required fields
    if (!walletId) {
      res.status(400).json({
        error: 'walletId is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    if (!message) {
      res.status(400).json({
        error: 'message is required',
        code: 'MISSING_MESSAGE',
      });
      return;
    }

    let signature: string;

    if (chainType === 'ethereum') {
      signature = await privyWalletService.signEthereumMessage({
        walletId,
        message,
        userJwt: req.privyAccessToken!,
      });
    } else {
      signature = await privyWalletService.signSolanaMessage({
        walletId,
        message,
        userJwt: req.privyAccessToken!,
      });
    }

    res.json({ signature });
  } catch (error) {
    handleWalletError(res, error, 'sign message');
  }
});

// ===========================================
// Transaction Signing
// ===========================================

/**
 * POST /api/sapp/wallet/sign-transaction
 * Sign a Solana transaction
 *
 * @body walletId - Privy wallet ID
 * @body transaction - Base64-encoded serialized transaction
 */
router.post('/sign-transaction', async (req: Request, res: Response) => {
  try {
    const { walletId, transaction } = req.body as SignTransactionRequest;

    // Validate required fields
    if (!walletId) {
      res.status(400).json({
        error: 'walletId is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    if (!transaction) {
      res.status(400).json({
        error: 'transaction is required',
        code: 'MISSING_TRANSACTION',
      });
      return;
    }

    const signedTransaction = await privyWalletService.signSolanaTransaction({
      walletId,
      transaction,
      userJwt: req.privyAccessToken!,
    });

    res.json({ signedTransaction });
  } catch (error) {
    handleWalletError(res, error, 'sign transaction');
  }
});

/**
 * POST /api/sapp/wallet/sign-and-send
 * Sign and broadcast a Solana transaction
 *
 * @body walletId - Privy wallet ID
 * @body transaction - Base64-encoded serialized transaction
 * @body cluster - Optional: 'mainnet-beta', 'devnet', or 'testnet' (defaults to devnet)
 */
router.post('/sign-and-send', async (req: Request, res: Response) => {
  try {
    const { walletId, transaction, cluster = 'devnet' } = req.body as SignAndSendRequest;

    // Validate required fields
    if (!walletId) {
      res.status(400).json({
        error: 'walletId is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    if (!transaction) {
      res.status(400).json({
        error: 'transaction is required',
        code: 'MISSING_TRANSACTION',
      });
      return;
    }

    // Validate cluster
    const validClusters: SolanaCluster[] = ['mainnet-beta', 'devnet', 'testnet'];
    if (!validClusters.includes(cluster as SolanaCluster)) {
      res.status(400).json({
        error: 'Invalid cluster. Must be "mainnet-beta", "devnet", or "testnet"',
        code: 'INVALID_CLUSTER',
      });
      return;
    }

    const transactionHash = await privyWalletService.signAndSendSolanaTransaction({
      walletId,
      transaction,
      userJwt: req.privyAccessToken!,
      cluster: cluster as SolanaCluster,
    });

    res.json({ transactionHash });
  } catch (error) {
    handleWalletError(res, error, 'sign and send transaction');
  }
});

// ===========================================
// EIP-712 Signing (Ethereum)
// ===========================================

/**
 * POST /api/sapp/wallet/sign-typed-data
 * Sign EIP-712 typed data with an Ethereum wallet
 *
 * @body walletId - Privy wallet ID
 * @body typedData - EIP-712 typed data (JSON string or object)
 */
router.post('/sign-typed-data', async (req: Request, res: Response) => {
  try {
    const { walletId, typedData } = req.body as SignTypedDataRequest;

    // Validate required fields
    if (!walletId) {
      res.status(400).json({
        error: 'walletId is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    if (!typedData) {
      res.status(400).json({
        error: 'typedData is required',
        code: 'MISSING_TYPED_DATA',
      });
      return;
    }

    const typedDataString = typeof typedData === 'string' ? typedData : JSON.stringify(typedData);

    const signature = await privyWalletService.signEip712TypedData({
      walletId,
      typedData: typedDataString,
      userJwt: req.privyAccessToken!,
    });

    res.json({ signature });
  } catch (error) {
    handleWalletError(res, error, 'sign typed data');
  }
});

// ===========================================
// Wallet Export
// ===========================================

/**
 * POST /api/sapp/wallet/export
 * Export wallet private key (requires user authorization)
 *
 * @body walletId - Privy wallet ID to export
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { walletId } = req.body as ExportWalletRequest;

    // Validate required fields
    if (!walletId) {
      res.status(400).json({
        error: 'walletId is required',
        code: 'MISSING_WALLET_ID',
      });
      return;
    }

    const privateKey = await privyWalletService.exportWallet({
      walletId,
      userJwt: req.privyAccessToken!,
    });

    // Log export for audit purposes (don't log the actual key!)
    console.log(`[WalletRoutes] Wallet exported: ${walletId} by user ${req.privyUserId}`);

    res.json({ privateKey });
  } catch (error) {
    handleWalletError(res, error, 'export wallet');
  }
});

// ===========================================
// Error Handler
// ===========================================

function handleWalletError(res: Response, error: unknown, operation: string): void {
  console.error(`[WalletRoutes] Error during ${operation}:`, error);

  if (error instanceof WalletNotFoundError) {
    res.status(404).json({
      error: error.message,
      code: 'WALLET_NOT_FOUND',
    });
    return;
  }

  if (error instanceof WalletAuthorizationError) {
    res.status(403).json({
      error: error.message,
      code: 'WALLET_AUTH_FAILED',
    });
    return;
  }

  if (error instanceof WalletRateLimitError) {
    res.status(429).json({
      error: error.message,
      code: 'RATE_LIMIT_EXCEEDED',
    });
    return;
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({
    error: `Failed to ${operation}: ${message}`,
    code: 'WALLET_OPERATION_FAILED',
  });
}

export default router;

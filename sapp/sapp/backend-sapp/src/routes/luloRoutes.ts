import { Router, type Request, type Response, type NextFunction } from 'express';
import { luloService, type LuloDepositRequest, type LuloWithdrawRequest } from '../services/luloService.js';
import { isValidSolanaAddress } from '../utils/validation.js';

const router = Router();

// MARK: - Validation Helpers

function getStringParam(param: string | string[] | undefined): string | undefined {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
}

function validateWalletAddress(address: string | string[] | undefined, fieldName: string): string {
  const addr = getStringParam(address);
  if (!addr) {
    throw new Error(`${fieldName} is required`);
  }
  if (!isValidSolanaAddress(addr)) {
    throw new Error(`Invalid ${fieldName}: must be a valid Solana address`);
  }
  return addr;
}

// MARK: - Pool Routes

/**
 * GET /pools
 * Get all available yield pools with their current APY rates
 */
router.get('/pools', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pools = await luloService.getPoolsWithRates();
    res.json({
      success: true,
      data: pools,
      count: pools.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:mintAddress
 * Get a specific pool by mint address
 */
router.get('/pools/:mintAddress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mintAddress = getStringParam(req.params.mintAddress);

    if (!mintAddress || !isValidSolanaAddress(mintAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mint address',
      });
    }

    const pool = await luloService.getPool(mintAddress);

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    res.json({
      success: true,
      data: pool,
    });
  } catch (error) {
    next(error);
  }
});

// MARK: - Account Routes

/**
 * GET /account/:walletAddress
 * Get user's positions and earnings
 */
router.get('/account/:walletAddress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletAddress = validateWalletAddress(req.params.walletAddress, 'walletAddress');

    const account = await luloService.getAccount(walletAddress);

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /account/:walletAddress/withdrawals
 * Get pending withdrawals for a user
 */
router.get('/account/:walletAddress/withdrawals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletAddress = validateWalletAddress(req.params.walletAddress, 'walletAddress');

    const withdrawals = await luloService.getPendingWithdrawals(walletAddress);

    res.json({
      success: true,
      data: withdrawals,
      count: withdrawals.length,
    });
  } catch (error) {
    next(error);
  }
});

// MARK: - Transaction Routes

/**
 * POST /deposit
 * Generate a deposit transaction
 *
 * Body:
 * - owner: string (required) - Wallet address
 * - mintAddress: string (required) - Token mint address
 * - regularAmount: number (optional) - Amount for regular deposit
 * - protectedAmount: number (optional) - Amount for protected deposit
 * - referrer: string (optional) - Referrer address
 */
router.post('/deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, mintAddress, regularAmount, protectedAmount, referrer } = req.body;

    // Validation
    validateWalletAddress(owner, 'owner');
    validateWalletAddress(mintAddress, 'mintAddress');

    const regularAmt = parseFloat(regularAmount) || 0;
    const protectedAmt = parseFloat(protectedAmount) || 0;

    if (regularAmt <= 0 && protectedAmt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one of regularAmount or protectedAmount must be greater than 0',
      });
    }

    if (regularAmt < 0 || protectedAmt < 0) {
      return res.status(400).json({
        success: false,
        error: 'Amounts cannot be negative',
      });
    }

    const request: LuloDepositRequest = {
      owner,
      mintAddress,
      regularAmount: regularAmt,
      protectedAmount: protectedAmt,
      referrer,
    };

    const result = await luloService.generateDepositTransaction(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /withdraw
 * Generate a withdraw transaction
 *
 * Body:
 * - owner: string (required) - Wallet address
 * - mintAddress: string (required) - Token mint address
 * - amount: number (required) - Amount to withdraw
 */
router.post('/withdraw', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, mintAddress, amount } = req.body;

    // Validation
    validateWalletAddress(owner, 'owner');
    validateWalletAddress(mintAddress, 'mintAddress');

    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    const request: LuloWithdrawRequest = {
      owner,
      mintAddress,
      amount: withdrawAmount,
    };

    const result = await luloService.generateWithdrawTransaction(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// MARK: - Utility Routes

/**
 * GET /rates
 * Get current APY rates for all supported tokens
 */
router.get('/rates', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await luloService.getRates();
    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

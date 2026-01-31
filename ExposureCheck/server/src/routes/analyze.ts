import { Router } from 'express';
import { isValidSolanaAddress } from '../services/solanaService.js';
import { analyzeWallet } from '../services/analysisService.js';
import { getCachedResult, setCachedResult } from '../services/cacheService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const skipCache = req.query.refresh === 'true';

    // Validate address
    if (!isValidSolanaAddress(address)) {
      throw createError('Invalid Solana address', 400, 'INVALID_ADDRESS');
    }

    // Check cache first (unless refresh requested)
    if (!skipCache) {
      const cached = getCachedResult(address);
      if (cached) {
        return res.json(cached);
      }
    }

    // Perform analysis
    const result = await analyzeWallet(address);

    // Cache the result
    setCachedResult(address, result);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

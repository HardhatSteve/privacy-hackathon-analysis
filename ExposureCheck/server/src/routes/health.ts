import { Router } from 'express';
import { getCacheStats } from '../services/cacheService.js';

const router = Router();

router.get('/', (_req, res) => {
  const cacheStats = getCacheStats();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cacheStats,
  });
});

export default router;

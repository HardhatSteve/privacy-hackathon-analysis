import express from 'express';
import orderbook from '../services/orderbook.js';
import matchingEngine from '../services/matchingEngine.js';
import arciumService from '../services/arciumService.js';
import { getConnection } from '../utils/solana.js';

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now()
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const health = {
    server: 'healthy',
    redis: 'unknown',
    solana: 'unknown',
    arcium: 'unknown',
    matchingEngine: 'unknown'
  };

  try {
    // Check Redis
    if (orderbook.initialized) {
      health.redis = 'healthy';
    } else {
      health.redis = 'unhealthy';
    }
  } catch (error) {
    health.redis = 'unhealthy';
  }

  try {
    // Check Solana RPC
    const connection = getConnection();
    await connection.getSlot();
    health.solana = 'healthy';
  } catch (error) {
    health.solana = 'unhealthy';
  }

  try {
    // Check Arcium service
    if (arciumService.initialized) {
      health.arcium = 'healthy';
    } else {
      health.arcium = 'unhealthy';
    }
  } catch (error) {
    health.arcium = 'unhealthy';
  }

  try {
    // Check matching engine
    if (matchingEngine.isRunning) {
      health.matchingEngine = 'healthy';
    } else {
      health.matchingEngine = 'stopped';
    }
  } catch (error) {
    health.matchingEngine = 'unhealthy';
  }

  const allHealthy = Object.values(health).every(status => status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    health,
    timestamp: Date.now()
  });
});

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const matchingStats = matchingEngine.getStats();
    const arciumStats = arciumService.getStats();

    res.json({
      success: true,
      data: {
        matchingEngine: matchingStats,
        arcium: arciumStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

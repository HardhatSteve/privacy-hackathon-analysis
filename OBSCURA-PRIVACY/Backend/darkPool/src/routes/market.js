import express from 'express';
import orderbook from '../services/orderbook.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get order book for token pair
router.get('/orderbook/:tokenPair', async (req, res, next) => {
  try {
    const { tokenPair } = req.params;
    const depth = parseInt(req.query.depth) || 20;

    const orderbookData = await orderbook.getOrderBook(tokenPair, depth);

    res.json({
      success: true,
      data: orderbookData
    });
  } catch (error) {
    next(error);
  }
});

// Get recent trades
router.get('/trades/:tokenPair', async (req, res, next) => {
  try {
    const { tokenPair } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // In production, fetch from trade history
    const trades = [];

    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    next(error);
  }
});

// Get market statistics
router.get('/stats/:tokenPair', async (req, res, next) => {
  try {
    const { tokenPair } = req.params;

    // In production, calculate from trade history
    const stats = {
      volume24h: '0',
      high24h: '0',
      low24h: '0',
      open24h: '0',
      close24h: '0',
      change24h: '0',
      changePercent24h: '0'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Get all active token pairs
router.get('/pairs', async (req, res, next) => {
  try {
    // In production, fetch from configuration or database
    const pairs = [
      { symbol: 'SOL/USDC', baseToken: 'SOL', quoteToken: 'USDC' },
      { symbol: 'BTC/USDC', baseToken: 'BTC', quoteToken: 'USDC' },
      { symbol: 'ETH/USDC', baseToken: 'ETH', quoteToken: 'USDC' }
    ];

    res.json({
      success: true,
      data: pairs
    });
  } catch (error) {
    next(error);
  }
});

export default router;

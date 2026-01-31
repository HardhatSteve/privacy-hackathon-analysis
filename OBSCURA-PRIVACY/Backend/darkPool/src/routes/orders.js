import express from 'express';
import orderbook from '../services/orderbook.js';
import arciumService from '../services/arciumService.js';
import logger from '../utils/logger.js';
import { broadcast } from '../server.js';

const router = express.Router();

// Submit new order
router.post('/submit', async (req, res, next) => {
  try {
    const { type, side, tokenPair, price, amount, timeInForce, userAddress } = req.body;

    // Validate required fields
    if (!type || !side || !tokenPair || !amount || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create order object
    const order = {
      type,
      side,
      tokenPair,
      price: price || null,
      amount,
      timeInForce: timeInForce || 'GTC',
      userAddress
    };

    // Submit to orderbook
    const submittedOrder = await orderbook.submitOrder(order);

    // Submit to Arcium MPC for encrypted processing
    const arciumResult = await arciumService.submitOrder(submittedOrder);

    // Broadcast order update
    broadcast('orderbook', tokenPair, {
      action: 'order_added',
      order: {
        id: submittedOrder.id,
        type: submittedOrder.type,
        side: submittedOrder.side,
        tokenPair: submittedOrder.tokenPair
      }
    });

    logger.info('Order submitted successfully', {
      orderId: submittedOrder.id,
      userAddress
    });

    res.json({
      success: true,
      data: {
        order: submittedOrder,
        arcium: arciumResult
      }
    });
  } catch (error) {
    next(error);
  }
});

// Cancel order
router.delete('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address required'
      });
    }

    // Cancel in orderbook
    const cancelledOrder = await orderbook.cancelOrder(orderId, userAddress);

    // Cancel via Arcium MPC
    const arciumResult = await arciumService.cancelOrder(
      orderId,
      userAddress
    );

    // Broadcast cancellation
    broadcast('orderbook', cancelledOrder.tokenPair, {
      action: 'order_cancelled',
      orderId
    });

    logger.info('Order cancelled successfully', { orderId, userAddress });

    res.json({
      success: true,
      data: {
        order: cancelledOrder,
        arcium: arciumResult
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get order status
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await orderbook.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// Get user orders
router.get('/user/:userAddress', async (req, res, next) => {
  try {
    const { userAddress } = req.params;

    const orders = await orderbook.getUserOrders(userAddress);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
});

// Get settlement status
router.get('/settlement/:settlementId', async (req, res, next) => {
  try {
    const { settlementId } = req.params;

    const settlement = await arciumService.getSettlementStatus(settlementId);

    res.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    next(error);
  }
});

export default router;

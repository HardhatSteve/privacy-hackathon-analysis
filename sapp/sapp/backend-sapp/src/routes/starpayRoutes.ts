import { Router, type Request, type Response } from 'express';
import { starpayService, type CardOrderRequest } from '../services/starpayService.js';

const router = Router();

/**
 * POST /api/sapp/starpay/order
 * Create a new card order with payment address
 * Body: { amount, cardType, email }
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    // Check if service is configured
    if (!starpayService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Card ordering service is not configured',
      });
      return;
    }

    const orderRequest: CardOrderRequest = {
      amount: req.body.amount,
      cardType: req.body.cardType,
      email: req.body.email,
    };

    // Validate required fields
    if (!orderRequest.amount || !orderRequest.cardType || !orderRequest.email) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: amount, cardType, email',
      });
      return;
    }

    const order = await starpayService.createOrder(orderRequest);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[StarPay Routes] Create order failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Map specific errors
    switch (errorMessage) {
      case 'INVALID_AMOUNT':
        res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Amount must be between $5 and $10,000',
        });
        return;
      case 'INVALID_CARD_TYPE':
        res.status(400).json({
          success: false,
          error: 'INVALID_CARD_TYPE',
          message: 'Card type must be "visa" or "mastercard"',
        });
        return;
      case 'INVALID_EMAIL':
        res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: 'Valid customer email required',
        });
        return;
      case 'UNAUTHORIZED':
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Card service authentication failed',
        });
        return;
      case 'ACCOUNT_SUSPENDED':
        res.status(403).json({
          success: false,
          error: 'ACCOUNT_SUSPENDED',
          message: 'Card service account is suspended',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'ORDER_FAILED',
          message: 'Failed to create card order',
        });
    }
  }
});

/**
 * GET /api/sapp/starpay/order/status
 * Check order status
 * Query: orderId
 */
router.get('/order/status', async (req: Request, res: Response) => {
  try {
    // Check if service is configured
    if (!starpayService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Card ordering service is not configured',
      });
      return;
    }

    const orderIdParam = req.query.orderId;
    const orderId = typeof orderIdParam === 'string' ? orderIdParam : '';

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_ORDER_ID',
        message: 'Order ID is required',
      });
      return;
    }

    const status = await starpayService.getOrderStatus(orderId);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('[StarPay Routes] Get order status failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    switch (errorMessage) {
      case 'ORDER_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        });
        return;
      case 'UNAUTHORIZED':
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Card service authentication failed',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'STATUS_CHECK_FAILED',
          message: 'Failed to check order status',
        });
    }
  }
});

/**
 * GET /api/sapp/starpay/price
 * Get pricing breakdown for an amount (without creating order)
 * Query: amount
 */
router.get('/price', async (req: Request, res: Response) => {
  try {
    // Check if service is configured
    if (!starpayService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Card ordering service is not configured',
      });
      return;
    }

    const amountParam = req.query.amount;
    const amount = typeof amountParam === 'string' ? parseFloat(amountParam) : 0;

    if (!amount || isNaN(amount)) {
      res.status(400).json({
        success: false,
        error: 'MISSING_AMOUNT',
        message: 'Amount is required',
      });
      return;
    }

    if (amount < 5 || amount > 10000) {
      res.status(400).json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Amount must be between $5 and $10,000',
      });
      return;
    }

    const pricing = await starpayService.getPrice(amount);

    res.json({
      success: true,
      ...pricing,
    });
  } catch (error) {
    console.error('[StarPay Routes] Get price failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    switch (errorMessage) {
      case 'INVALID_AMOUNT':
        res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Amount must be between $5 and $10,000',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'PRICE_CHECK_FAILED',
          message: 'Failed to get pricing',
        });
    }
  }
});

/**
 * GET /api/sapp/starpay/status
 * Check if StarPay service is available
 */
router.get('/status', (_req: Request, res: Response) => {
  const isConfigured = starpayService.isConfigured();

  res.json({
    success: true,
    available: isConfigured,
    message: isConfigured ? 'Card ordering service is available' : 'Card ordering service is not configured',
  });
});

export default router;

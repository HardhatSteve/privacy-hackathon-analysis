import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class OrderBook {
  constructor() {
    this.redis = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.redis = createClient({
        url: config.redis.url,
        password: config.redis.password
      });

      this.redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
      this.redis.on('connect', () => logger.info('Redis connected'));

      await this.redis.connect();
      this.initialized = true;
      logger.info('OrderBook initialized');
    } catch (error) {
      logger.error('Failed to initialize OrderBook', { error: error.message });
      throw error;
    }
  }

  async submitOrder(order) {
    const orderId = uuidv4();
    const timestamp = Date.now();

    const orderData = {
      id: orderId,
      ...order,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: timestamp + (config.darkPool.orderExpirySeconds * 1000)
    };

    // Validate order
    this._validateOrder(orderData);

    // Store order
    const orderKey = `order:${orderId}`;
    await this.redis.set(orderKey, JSON.stringify(orderData));
    await this.redis.expire(orderKey, config.darkPool.orderExpirySeconds);

    // Add to user orders
    await this.redis.sAdd(`user:${order.userAddress}:orders`, orderId);

    // Add to order book
    const bookKey = `orderbook:${order.tokenPair}:${order.side}`;
    await this.redis.zAdd(bookKey, {
      score: order.type === 'market' ? 0 : parseFloat(order.price),
      value: orderId
    });

    // Add to pending queue
    await this.redis.lPush('orders:pending', orderId);

    logger.info('Order submitted', { orderId, type: order.type, side: order.side });
    return orderData;
  }

  async cancelOrder(orderId, userAddress) {
    const order = await this.getOrder(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userAddress !== userAddress) {
      throw new Error('Unauthorized to cancel this order');
    }

    if (order.status !== 'pending') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Update order status
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await this.redis.set(`order:${orderId}`, JSON.stringify(order));

    // Remove from order book
    const bookKey = `orderbook:${order.tokenPair}:${order.side}`;
    await this.redis.zRem(bookKey, orderId);

    logger.info('Order cancelled', { orderId });
    return order;
  }

  async getOrder(orderId) {
    const orderData = await this.redis.get(`order:${orderId}`);
    return orderData ? JSON.parse(orderData) : null;
  }

  async getUserOrders(userAddress) {
    const orderIds = await this.redis.sMembers(`user:${userAddress}:orders`);
    const orders = await Promise.all(
      orderIds.map(id => this.getOrder(id))
    );
    return orders.filter(order => order !== null);
  }

  async getOrderBook(tokenPair, depth = 20) {
    const [bids, asks] = await Promise.all([
      this._getOrderBookSide(tokenPair, 'buy', depth),
      this._getOrderBookSide(tokenPair, 'sell', depth)
    ]);

    return {
      bids: this._aggregateOrders(bids),
      asks: this._aggregateOrders(asks),
      lastUpdate: Date.now()
    };
  }

  async _getOrderBookSide(tokenPair, side, depth) {
    const bookKey = `orderbook:${tokenPair}:${side}`;
    const orderIds = side === 'buy'
      ? await this.redis.zRange(bookKey, 0, depth - 1, { REV: true })
      : await this.redis.zRange(bookKey, 0, depth - 1);

    const orders = await Promise.all(
      orderIds.map(id => this.getOrder(id))
    );

    return orders.filter(order => order && order.status === 'pending');
  }

  _aggregateOrders(orders) {
    const priceMap = new Map();

    for (const order of orders) {
      const price = order.price;
      const amount = new BigNumber(order.amount);

      if (priceMap.has(price)) {
        priceMap.set(price, priceMap.get(price).plus(amount));
      } else {
        priceMap.set(price, amount);
      }
    }

    return Array.from(priceMap.entries())
      .map(([price, totalAmount]) => ({
        price,
        totalAmount: totalAmount.toString()
      }))
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  async getPendingOrders() {
    const orderIds = await this.redis.lRange('orders:pending', 0, -1);
    const orders = await Promise.all(
      orderIds.map(id => this.getOrder(id))
    );
    return orders.filter(order => order && order.status === 'pending');
  }

  async updateOrderStatus(orderId, status, metadata = {}) {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = Date.now();
    Object.assign(order, metadata);

    await this.redis.set(`order:${orderId}`, JSON.stringify(order));

    // Remove from pending if filled or cancelled
    if (status === 'filled' || status === 'cancelled') {
      await this.redis.lRem('orders:pending', 0, orderId);
      const bookKey = `orderbook:${order.tokenPair}:${order.side}`;
      await this.redis.zRem(bookKey, orderId);
    }

    return order;
  }

  _validateOrder(order) {
    // Validate required fields
    if (!order.type || !order.side || !order.tokenPair || !order.amount || !order.userAddress) {
      throw new Error('Missing required order fields');
    }

    // Validate order type
    if (!['market', 'limit', 'stop_loss', 'iceberg'].includes(order.type)) {
      throw new Error('Invalid order type');
    }

    // Validate side
    if (!['buy', 'sell'].includes(order.side)) {
      throw new Error('Invalid order side');
    }

    // Validate amount
    const amount = new BigNumber(order.amount);
    if (amount.isNaN() || amount.lte(0)) {
      throw new Error('Invalid order amount');
    }

    if (amount.lt(config.darkPool.minOrderSize)) {
      throw new Error(`Order amount below minimum: ${config.darkPool.minOrderSize}`);
    }

    if (amount.gt(config.darkPool.maxOrderSize)) {
      throw new Error(`Order amount exceeds maximum: ${config.darkPool.maxOrderSize}`);
    }

    // Validate price for limit orders
    if (order.type === 'limit' && (!order.price || new BigNumber(order.price).lte(0))) {
      throw new Error('Limit orders require a valid price');
    }
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.initialized = false;
      logger.info('OrderBook closed');
    }
  }
}

export default new OrderBook();

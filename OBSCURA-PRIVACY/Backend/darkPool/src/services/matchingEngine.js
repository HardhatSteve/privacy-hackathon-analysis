import BigNumber from 'bignumber.js';
import orderbook from './orderbook.js';
import arciumService from './arciumService.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class MatchingEngine {
  constructor() {
    this.isRunning = false;
    this.matchingInterval = null;
    this.stats = {
      totalMatches: 0,
      totalVolume: new BigNumber(0),
      averageMatchTime: 0
    };
  }

  start() {
    if (this.isRunning) {
      logger.warn('Matching engine already running');
      return;
    }

    this.isRunning = true;
    this.matchingInterval = setInterval(
      () => this.matchOrders(),
      config.darkPool.matchingIntervalMs
    );

    logger.info('Matching engine started', {
      interval: config.darkPool.matchingIntervalMs
    });
  }

  stop() {
    if (this.matchingInterval) {
      clearInterval(this.matchingInterval);
      this.matchingInterval = null;
    }
    this.isRunning = false;
    logger.info('Matching engine stopped');
  }

  async matchOrders() {
    try {
      const startTime = Date.now();
      const pendingOrders = await orderbook.getPendingOrders();

      if (pendingOrders.length === 0) {
        return;
      }

      // Group orders by token pair
      const ordersByPair = this._groupOrdersByPair(pendingOrders);

      // Match orders for each pair
      for (const [tokenPair, orders] of Object.entries(ordersByPair)) {
        await this._matchTokenPair(tokenPair, orders);
      }

      const matchTime = Date.now() - startTime;
      this._updateStats(matchTime);

      logger.debug('Matching cycle completed', {
        duration: matchTime,
        ordersProcessed: pendingOrders.length
      });
    } catch (error) {
      logger.error('Matching engine error', { error: error.message });
    }
  }

  async _matchTokenPair(tokenPair, orders) {
    const buyOrders = orders
      .filter(o => o.side === 'buy')
      .sort((a, b) => {
        // Market orders first, then by price (highest first)
        if (a.type === 'market' && b.type !== 'market') return -1;
        if (a.type !== 'market' && b.type === 'market') return 1;
        return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      });

    const sellOrders = orders
      .filter(o => o.side === 'sell')
      .sort((a, b) => {
        // Market orders first, then by price (lowest first)
        if (a.type === 'market' && b.type !== 'market') return -1;
        if (a.type !== 'market' && b.type === 'market') return 1;
        return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      });

    // Match orders
    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        if (this._canMatch(buyOrder, sellOrder)) {
          await this._executeMatch(buyOrder, sellOrder);
        }
      }
    }
  }

  _canMatch(buyOrder, sellOrder) {
    // Check if orders can be matched
    if (buyOrder.userAddress === sellOrder.userAddress) {
      return false; // Self-trading prevention
    }

    if (buyOrder.status !== 'pending' || sellOrder.status !== 'pending') {
      return false;
    }

    // Market orders can always match
    if (buyOrder.type === 'market' || sellOrder.type === 'market') {
      return true;
    }

    // Limit orders match if buy price >= sell price
    const buyPrice = new BigNumber(buyOrder.price);
    const sellPrice = new BigNumber(sellOrder.price);
    return buyPrice.gte(sellPrice);
  }

  async _executeMatch(buyOrder, sellOrder) {
    try {
      // Calculate match details
      const matchPrice = this._calculateMatchPrice(buyOrder, sellOrder);
      const matchAmount = this._calculateMatchAmount(buyOrder, sellOrder);

      logger.info('Executing match', {
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        price: matchPrice.toString(),
        amount: matchAmount.toString()
      });

      // Submit to Arcium for encrypted settlement
      const settlement = await arciumService.submitSettlement({
        buyOrder,
        sellOrder,
        matchPrice: matchPrice.toString(),
        matchAmount: matchAmount.toString()
      });

      // Update order statuses
      await this._updateMatchedOrders(buyOrder, sellOrder, matchAmount, settlement);

      // Update stats
      this.stats.totalMatches++;
      this.stats.totalVolume = this.stats.totalVolume.plus(
        matchAmount.times(matchPrice)
      );

      logger.info('Match executed successfully', {
        settlementId: settlement.id,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id
      });
    } catch (error) {
      logger.error('Failed to execute match', {
        error: error.message,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id
      });
    }
  }

  _calculateMatchPrice(buyOrder, sellOrder) {
    // If either is a market order, use the limit order price
    if (buyOrder.type === 'market') {
      return new BigNumber(sellOrder.price);
    }
    if (sellOrder.type === 'market') {
      return new BigNumber(buyOrder.price);
    }

    // For limit orders, use the midpoint
    const buyPrice = new BigNumber(buyOrder.price);
    const sellPrice = new BigNumber(sellOrder.price);
    return buyPrice.plus(sellPrice).div(2);
  }

  _calculateMatchAmount(buyOrder, sellOrder) {
    const buyAmount = new BigNumber(buyOrder.amount).minus(
      buyOrder.filledAmount || 0
    );
    const sellAmount = new BigNumber(sellOrder.amount).minus(
      sellOrder.filledAmount || 0
    );

    return BigNumber.min(buyAmount, sellAmount);
  }

  async _updateMatchedOrders(buyOrder, sellOrder, matchAmount, settlement) {
    // Update buy order
    const buyFilledAmount = new BigNumber(buyOrder.filledAmount || 0).plus(matchAmount);
    const buyStatus = buyFilledAmount.gte(buyOrder.amount) ? 'filled' : 'partial';

    await orderbook.updateOrderStatus(buyOrder.id, buyStatus, {
      filledAmount: buyFilledAmount.toString(),
      settlementId: settlement.id
    });

    // Update sell order
    const sellFilledAmount = new BigNumber(sellOrder.filledAmount || 0).plus(matchAmount);
    const sellStatus = sellFilledAmount.gte(sellOrder.amount) ? 'filled' : 'partial';

    await orderbook.updateOrderStatus(sellOrder.id, sellStatus, {
      filledAmount: sellFilledAmount.toString(),
      settlementId: settlement.id
    });
  }

  _groupOrdersByPair(orders) {
    return orders.reduce((acc, order) => {
      if (!acc[order.tokenPair]) {
        acc[order.tokenPair] = [];
      }
      acc[order.tokenPair].push(order);
      return acc;
    }, {});
  }

  _updateStats(matchTime) {
    const alpha = 0.1; // Exponential moving average factor
    this.stats.averageMatchTime =
      alpha * matchTime + (1 - alpha) * this.stats.averageMatchTime;
  }

  getStats() {
    return {
      ...this.stats,
      totalVolume: this.stats.totalVolume.toString(),
      isRunning: this.isRunning
    };
  }
}

export default new MatchingEngine();

import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import arciumClient from './arciumClient.js';

class ArciumService {
  constructor() {
    this.settlements = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await arciumClient.initialize();
      this.initialized = true;
      logger.info('Arcium service initialized');
    } catch (error) {
      logger.error('Failed to initialize Arcium service', { error: error.message });
      throw error;
    }
  }

  async submitOrder(order) {
    try {
      logger.info('Submitting order to Arcium MPC', { orderId: order.id });

      // Submit encrypted order to Arcium
      const result = await arciumClient.submitAddOrder(order);

      // Wait for computation to finalize
      const computation = await arciumClient.awaitComputationFinalization(
        result.computationOffset
      );

      logger.info('Order submitted to Arcium', {
        orderId: order.id,
        computationOffset: result.computationOffset,
        txSignature: result.txSignature
      });

      return {
        orderId: order.id,
        computationOffset: result.computationOffset,
        txSignature: result.txSignature,
        status: 'submitted'
      };
    } catch (error) {
      logger.error('Failed to submit order to Arcium', {
        error: error.message,
        orderId: order.id
      });
      throw error;
    }
  }

  async submitSettlement(matchData) {
    const settlementId = uuidv4();
    
    try {
      logger.info('Submitting settlement to Arcium', { settlementId });

      // Submit match orders computation to Arcium MPC
      const result = await arciumClient.submitMatchOrders();

      const settlement = {
        id: settlementId,
        buyOrderId: matchData.buyOrder.id,
        sellOrderId: matchData.sellOrder.id,
        matchPrice: matchData.matchPrice,
        matchAmount: matchData.matchAmount,
        computationOffset: result.computationOffset,
        txSignature: result.txSignature,
        status: 'pending',
        createdAt: Date.now()
      };

      this.settlements.set(settlementId, settlement);

      // Wait for computation finalization in background
      this._finalizeSettlement(settlementId, result.computationOffset);

      return settlement;
    } catch (error) {
      logger.error('Failed to submit settlement', {
        error: error.message,
        settlementId
      });
      throw error;
    }
  }

  async _finalizeSettlement(settlementId, computationOffset) {
    try {
      // Wait for Arcium computation to complete
      const computation = await arciumClient.awaitComputationFinalization(computationOffset);

      const settlement = this.settlements.get(settlementId);
      if (!settlement) return;

      // Decrypt match result
      const matchResult = arciumClient.decryptMatchResult(
        computation.result,
        computation.nonce
      );

      settlement.status = 'completed';
      settlement.completedAt = Date.now();
      settlement.matchResult = matchResult;

      this.settlements.set(settlementId, settlement);

      logger.info('Settlement finalized', {
        settlementId,
        matchResult
      });
    } catch (error) {
      logger.error('Failed to finalize settlement', {
        error: error.message,
        settlementId
      });

      const settlement = this.settlements.get(settlementId);
      if (settlement) {
        settlement.status = 'failed';
        settlement.error = error.message;
        this.settlements.set(settlementId, settlement);
      }
    }
  }

  async cancelOrder(orderId, userId) {
    try {
      logger.info('Cancelling order via Arcium', { orderId, userId });

      const result = await arciumClient.submitCancelOrder(orderId, userId);

      // Wait for computation to finalize
      await arciumClient.awaitComputationFinalization(result.computationOffset);

      logger.info('Order cancelled via Arcium', {
        orderId,
        computationOffset: result.computationOffset,
        txSignature: result.txSignature
      });

      return {
        orderId,
        computationOffset: result.computationOffset,
        txSignature: result.txSignature,
        status: 'cancelled'
      };
    } catch (error) {
      logger.error('Failed to cancel order via Arcium', {
        error: error.message,
        orderId
      });
      throw error;
    }
  }

  async getSettlement(settlementId) {
    return this.settlements.get(settlementId);
  }

  async getSettlementStatus(settlementId) {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    return {
      id: settlement.id,
      status: settlement.status,
      txSignature: settlement.txSignature,
      computationOffset: settlement.computationOffset,
      matchResult: settlement.matchResult,
      createdAt: settlement.createdAt,
      completedAt: settlement.completedAt
    };
  }

  getStats() {
    const settlements = Array.from(this.settlements.values());
    return {
      total: settlements.length,
      pending: settlements.filter(s => s.status === 'pending').length,
      completed: settlements.filter(s => s.status === 'completed').length,
      failed: settlements.filter(s => s.status === 'failed').length
    };
  }
}

export default new ArciumService();

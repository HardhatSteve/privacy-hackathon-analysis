/**
 * Order History Persistence for AuroraZK
 * 
 * Maintains a complete history of orders with real transaction signatures
 * stored locally and optionally synced to a backend service.
 */

import { PublicKey } from '@solana/web3.js';

// Order lifecycle states
export type OrderState = 
  | 'pending'      // Created locally, not yet on-chain
  | 'committed'    // On-chain with commitment hash
  | 'matching'     // Sent to matcher, awaiting match
  | 'matched'      // Match found, awaiting settlement
  | 'settling'     // Settlement in progress
  | 'filled'       // Fully filled and settled
  | 'partial'      // Partially filled
  | 'cancelled'    // Cancelled by user
  | 'expired'      // Expired (past expiration time)
  | 'failed';      // Failed (error during processing)

// Complete order record
export interface OrderRecord {
  // Identifiers
  id: string;                    // Unique local ID
  orderId: string;               // On-chain order account pubkey
  orderBookId: string;           // Order book PDA
  
  // Order details (hidden on-chain)
  price: number;                 // Price in USDC
  size: number;                  // Size in SOL
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market';
  slippage?: number;             // For market orders
  
  // Cryptographic data
  nonce: number[];               // 32-byte nonce for commitment
  commitmentHash: number[];      // SHA256(price, size, nonce)
  rangeProof?: number[];         // Serialized range proof
  
  // Ownership
  owner: string;                 // Wallet pubkey
  
  // Timestamps
  createdAt: number;             // Local creation time
  committedAt?: number;          // When placed on-chain
  matchedAt?: number;            // When matched
  settledAt?: number;            // When settlement complete
  cancelledAt?: number;          // When cancelled
  expiredAt?: number;            // When expired
  expiresAt: number;             // Expiration timestamp
  
  // State tracking
  state: OrderState;
  previousStates: { state: OrderState; timestamp: number }[];
  
  // Transaction signatures (REAL on-chain evidence)
  transactions: {
    type: 'placement' | 'match' | 'settlement' | 'cancel' | 'expire';
    signature: string;
    timestamp: number;
    blockSlot?: number;
    error?: string;
  }[];
  
  // Match details (filled when matched)
  match?: {
    counterpartyOrderId: string;
    executionPrice: number;
    executionSize: number;
    matcherProposalId?: string;
    matcherSignatures?: string[];
  };
  
  // Fill tracking (for partial fills)
  fills: {
    fillId: string;
    price: number;
    size: number;
    timestamp: number;
    txSignature: string;
  }[];
  
  // Metadata
  totalFilled: number;           // Total size filled
  remainingSize: number;         // Size left to fill
  averagePrice: number;          // VWAP of fills
  fees: number;                  // Total fees paid
  
  // Error tracking
  errors: {
    message: string;
    code?: string;
    timestamp: number;
  }[];
}

// Storage keys
const ORDER_HISTORY_KEY = 'aurorazk_order_history';
const ORDER_INDEX_KEY = 'aurorazk_order_index';

/**
 * Order History Service
 */
class OrderHistoryService {
  private orders: Map<string, OrderRecord> = new Map();
  private loaded = false;

  constructor() {
    this.load();
  }

  /**
   * Load orders from local storage
   */
  private load(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = localStorage.getItem(ORDER_HISTORY_KEY);
      if (data) {
        const records: OrderRecord[] = JSON.parse(data);
        records.forEach(record => {
          this.orders.set(record.id, record);
        });
      }
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load order history:', error);
      this.orders = new Map();
    }
  }

  /**
   * Save orders to local storage
   */
  private save(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const records = Array.from(this.orders.values());
      localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(records));
      
      // Update index for quick lookup by owner
      const index: { [owner: string]: string[] } = {};
      records.forEach(record => {
        if (!index[record.owner]) {
          index[record.owner] = [];
        }
        index[record.owner].push(record.id);
      });
      localStorage.setItem(ORDER_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save order history:', error);
    }
  }

  /**
   * Create a new order record
   */
  createOrder(params: {
    price: number;
    size: number;
    side: 'buy' | 'sell';
    orderType: 'limit' | 'market';
    slippage?: number;
    owner: string;
    nonce: number[];
    commitmentHash: number[];
    rangeProof?: number[];
    expiresAt: number;
  }): OrderRecord {
    const id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record: OrderRecord = {
      id,
      orderId: '', // Set when committed
      orderBookId: '',
      price: params.price,
      size: params.size,
      side: params.side,
      orderType: params.orderType,
      slippage: params.slippage,
      nonce: params.nonce,
      commitmentHash: params.commitmentHash,
      rangeProof: params.rangeProof,
      owner: params.owner,
      createdAt: Date.now(),
      expiresAt: params.expiresAt,
      state: 'pending',
      previousStates: [],
      transactions: [],
      fills: [],
      totalFilled: 0,
      remainingSize: params.size,
      averagePrice: 0,
      fees: 0,
      errors: [],
    };

    this.orders.set(id, record);
    this.save();
    
    return record;
  }

  /**
   * Update order state
   */
  updateState(orderId: string, newState: OrderState): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.previousStates.push({
      state: order.state,
      timestamp: Date.now(),
    });
    order.state = newState;

    // Update timestamps based on state
    switch (newState) {
      case 'committed':
        order.committedAt = Date.now();
        break;
      case 'matched':
        order.matchedAt = Date.now();
        break;
      case 'filled':
        order.settledAt = Date.now();
        break;
      case 'cancelled':
        order.cancelledAt = Date.now();
        break;
      case 'expired':
        order.expiredAt = Date.now();
        break;
    }

    this.save();
  }

  /**
   * Record a transaction for an order
   */
  recordTransaction(
    orderId: string,
    type: OrderRecord['transactions'][0]['type'],
    signature: string,
    blockSlot?: number,
    error?: string
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.transactions.push({
      type,
      signature,
      timestamp: Date.now(),
      blockSlot,
      error,
    });

    this.save();
  }

  /**
   * Set the on-chain order ID after commitment
   */
  setOnChainId(localId: string, onChainId: string): void {
    const order = this.orders.get(localId);
    if (!order) return;

    order.orderId = onChainId;
    this.save();
  }

  /**
   * Record a fill (for partial fills)
   */
  recordFill(
    orderId: string,
    fill: {
      price: number;
      size: number;
      txSignature: string;
    }
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    const fillId = `fill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    order.fills.push({
      fillId,
      price: fill.price,
      size: fill.size,
      timestamp: Date.now(),
      txSignature: fill.txSignature,
    });

    // Update totals
    order.totalFilled += fill.size;
    order.remainingSize = Math.max(0, order.size - order.totalFilled);
    
    // Calculate VWAP
    const totalValue = order.fills.reduce((sum, f) => sum + f.price * f.size, 0);
    order.averagePrice = totalValue / order.totalFilled;

    // Update state
    if (order.remainingSize <= 0.0001) {
      this.updateState(orderId, 'filled');
    } else {
      this.updateState(orderId, 'partial');
    }

    this.save();
  }

  /**
   * Record match details
   */
  recordMatch(
    orderId: string,
    match: OrderRecord['match']
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.match = match;
    this.updateState(orderId, 'matched');
    this.save();
  }

  /**
   * Record an error
   */
  recordError(orderId: string, message: string, code?: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.errors.push({
      message,
      code,
      timestamp: Date.now(),
    });

    this.save();
  }

  /**
   * Get order by local ID
   */
  getOrder(orderId: string): OrderRecord | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Get order by on-chain ID
   */
  getOrderByOnChainId(onChainId: string): OrderRecord | null {
    for (const order of this.orders.values()) {
      if (order.orderId === onChainId) {
        return order;
      }
    }
    return null;
  }

  /**
   * Get all orders for a wallet
   */
  getOrdersByOwner(owner: string): OrderRecord[] {
    const orders: OrderRecord[] = [];
    this.orders.forEach(order => {
      if (order.owner === owner) {
        orders.push(order);
      }
    });
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get orders by state
   */
  getOrdersByState(owner: string, states: OrderState[]): OrderRecord[] {
    return this.getOrdersByOwner(owner).filter(o => states.includes(o.state));
  }

  /**
   * Get active orders (not filled, cancelled, or expired)
   */
  getActiveOrders(owner: string): OrderRecord[] {
    return this.getOrdersByState(owner, ['pending', 'committed', 'matching', 'matched', 'settling', 'partial']);
  }

  /**
   * Get filled orders
   */
  getFilledOrders(owner: string): OrderRecord[] {
    return this.getOrdersByState(owner, ['filled']);
  }

  /**
   * Get order statistics for a wallet
   */
  getStats(owner: string): {
    totalOrders: number;
    activeOrders: number;
    filledOrders: number;
    cancelledOrders: number;
    totalVolume: number;
    totalFees: number;
    avgFillPrice: number;
  } {
    const orders = this.getOrdersByOwner(owner);
    
    const filled = orders.filter(o => o.state === 'filled' || o.totalFilled > 0);
    const totalVolume = filled.reduce((sum, o) => sum + o.totalFilled * o.averagePrice, 0);
    const totalFilled = filled.reduce((sum, o) => sum + o.totalFilled, 0);

    return {
      totalOrders: orders.length,
      activeOrders: this.getActiveOrders(owner).length,
      filledOrders: this.getFilledOrders(owner).length,
      cancelledOrders: orders.filter(o => o.state === 'cancelled').length,
      totalVolume,
      totalFees: orders.reduce((sum, o) => sum + o.fees, 0),
      avgFillPrice: totalFilled > 0 ? totalVolume / totalFilled : 0,
    };
  }

  /**
   * Export order history as JSON
   */
  export(owner?: string): string {
    const orders = owner 
      ? this.getOrdersByOwner(owner)
      : Array.from(this.orders.values());
    
    return JSON.stringify(orders, null, 2);
  }

  /**
   * Import order history from JSON
   */
  import(json: string, merge = true): number {
    try {
      const records: OrderRecord[] = JSON.parse(json);
      let imported = 0;

      records.forEach(record => {
        if (!merge || !this.orders.has(record.id)) {
          this.orders.set(record.id, record);
          imported++;
        }
      });

      this.save();
      return imported;
    } catch (error) {
      console.error('Failed to import order history:', error);
      return 0;
    }
  }

  /**
   * Clear all order history (dangerous!)
   */
  clearAll(): void {
    this.orders.clear();
    this.save();
  }

  /**
   * Migrate from old storage format
   */
  migrateFromLegacy(): number {
    if (typeof window === 'undefined') return 0;

    try {
      const legacyData = localStorage.getItem('aurorazk_orders');
      if (!legacyData) return 0;

      const legacyOrders = JSON.parse(legacyData);
      let migrated = 0;

      legacyOrders.forEach((legacy: any) => {
        // Check if already migrated
        if (this.getOrderByOnChainId(legacy.orderId)) return;

        const record: OrderRecord = {
          id: `migrated_${legacy.orderId}`,
          orderId: legacy.orderId,
          orderBookId: '',
          price: legacy.price,
          size: legacy.size,
          side: legacy.side,
          orderType: legacy.orderType || 'limit',
          slippage: legacy.slippage,
          nonce: legacy.nonce,
          commitmentHash: [],
          owner: legacy.owner || '',
          createdAt: legacy.timestamp,
          committedAt: legacy.timestamp,
          expiresAt: legacy.timestamp + 48 * 60 * 60 * 1000, // Default 48h
          state: legacy.filled ? 'filled' : (legacy.isSimulatedMatch ? 'filled' : 'committed'),
          previousStates: [],
          transactions: [],
          fills: [],
          totalFilled: legacy.filled ? legacy.size : 0,
          remainingSize: legacy.filled ? 0 : legacy.size,
          averagePrice: legacy.price,
          fees: 0,
          errors: [],
        };

        // Add placement transaction
        if (legacy.placementTx) {
          record.transactions.push({
            type: 'placement',
            signature: legacy.placementTx,
            timestamp: legacy.timestamp,
          });
        }

        // Add match transaction
        if (legacy.matchTx) {
          record.transactions.push({
            type: 'match',
            signature: legacy.matchTx,
            timestamp: legacy.filledAt || legacy.timestamp,
          });
        }

        this.orders.set(record.id, record);
        migrated++;
      });

      this.save();
      return migrated;
    } catch (error) {
      console.error('Failed to migrate legacy orders:', error);
      return 0;
    }
  }
}

// Singleton instance
export const orderHistory = new OrderHistoryService();

// Auto-migrate on load
if (typeof window !== 'undefined') {
  const migrated = orderHistory.migrateFromLegacy();
  if (migrated > 0) {
    console.log(`📦 Migrated ${migrated} legacy orders`);
  }
}

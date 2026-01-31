/**
 * Matcher Client for AuroraZK
 * Handles communication with the matcher service
 */

import { encryptOrderForMatcher, getMatcherPublicKey, type OrderData, type EncryptedOrder } from './encryption';
import { 
  calculateImbalance, 
  calculateMomentum, 
  type ImbalanceMetric, 
  type MomentumMetric,
  type OrderActivity 
} from './market-metrics';

// Matcher service configuration
const MATCHER_URL = process.env.NEXT_PUBLIC_MATCHER_URL || 'http://localhost:3001';

export interface MatcherStats {
  totalOrders: number;
  buyOrders: number;
  sellOrders: number;
  pendingMatches: number;
  completedMatches: number;
  hasLiquidity: boolean;
  spreadTier: 'tight' | 'normal' | 'wide' | null;
  activityLog?: OrderActivity[];
}

export interface MarketMetrics {
  imbalance: ImbalanceMetric;
  momentum: MomentumMetric;
}

export interface MatchEvent {
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  size: number;
  txSignature: string;
  timestamp: number;
  // Extended match details
  executionPrice?: number;
  executedSize?: number;
  slippage?: number;
  fee?: number;
  feeRecipient?: string;
  orderType?: 'market' | 'limit';
}

type MatchCallback = (match: MatchEvent) => void;
type StatsCallback = (stats: MatcherStats) => void;

class MatcherClient {
  private ws: WebSocket | null = null;
  private matchCallbacks: MatchCallback[] = [];
  private statsCallbacks: StatsCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  /**
   * Get the matcher's public encryption key
   */
  async getMatcherPublicKey(): Promise<Uint8Array | null> {
    try {
      const response = await fetch(`${MATCHER_URL}/pubkey`);
      if (!response.ok) {
        console.warn('Matcher service not available');
        return null;
      }
      const data = await response.json();
      return new Uint8Array(data.publicKeyArray);
    } catch (error) {
      console.warn('Failed to fetch matcher public key:', error);
      return null;
    }
  }

  /**
   * Submit an encrypted order to the matcher
   */
  async submitOrder(orderData: OrderData): Promise<{
    success: boolean;
    orderId: string;
    matchesFound: number;
    error?: string;
    stats?: {
      buyOrders: number;
      sellOrders: number;
      hasLiquidity: boolean;
      bestBid?: number;
      bestAsk?: number;
      spread?: number;
    };
  }> {
    try {
      // Get matcher's public key
      const matcherPubKey = await this.getMatcherPublicKey();
      
      if (!matcherPubKey) {
        console.error('❌ CRITICAL: Cannot get matcher public key - order NOT submitted');
        return {
          success: false, // FIX: This must be FALSE!
          orderId: orderData.orderId,
          matchesFound: 0,
          error: 'Matcher offline - cannot submit order',
        };
      }

      // Encrypt the order
      const encrypted = encryptOrderForMatcher(orderData, matcherPubKey);

      // Submit to matcher
      const response = await fetch(`${MATCHER_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encrypted),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit order');
      }

      const result = await response.json();
      return {
        success: true,
        orderId: result.orderId,
        matchesFound: result.matchesFound,
        stats: result.stats,
      };
    } catch (error: any) {
      console.error('Order submission failed:', error);
      return {
        success: false,
        orderId: orderData.orderId,
        matchesFound: 0,
        error: error.message,
      };
    }
  }

  /**
   * Cancel an order with the matcher
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${MATCHER_URL}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * Get current matcher stats
   */
  async getStats(): Promise<MatcherStats | null> {
    try {
      const response = await fetch(`${MATCHER_URL}/stats`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Check if matcher service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${MATCHER_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Request withdrawal from dark pool vault
   * This performs a REAL on-chain token transfer from the vault
   */
  async withdraw(params: {
    token: 'SOL' | 'USDC';
    amount: number;
    recipientWallet: string;
    requestingWallet: string;
  }): Promise<{
    success: boolean;
    txSignature?: string;
    explorer?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${MATCHER_URL}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Withdrawal failed',
        };
      }

      return {
        success: true,
        txSignature: result.txSignature,
        explorer: result.explorer,
      };
    } catch (error: any) {
      console.error('Withdrawal request failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to vault service',
      };
    }
  }

  /**
   * Get vault balances for transparency
   */
  async getVaultBalance(): Promise<{
    sol: number;
    usdc: number;
    vault: string;
  } | null> {
    try {
      const response = await fetch(`${MATCHER_URL}/vault-balance`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Connect to matcher WebSocket for real-time updates
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = MATCHER_URL.replace('http', 'ws');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 Connected to matcher service');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'match') {
            this.matchCallbacks.forEach(cb => cb(message.data));
          } else if (message.type === 'stats') {
            this.statsCallbacks.forEach(cb => cb(message.data));
          }
        } catch (e) {
          console.error('Failed to parse matcher message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('Matcher connection closed');
        this.isConnecting = false;
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        // WebSocket errors are usually followed by onclose, so we handle reconnection there
        // Suppress verbose error logging for common connection issues
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to connect to matcher:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting to matcher in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }

  /**
   * Disconnect from matcher
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.matchCallbacks = [];
    this.statsCallbacks = [];
  }

  /**
   * Subscribe to match events
   */
  onMatch(callback: MatchCallback): () => void {
    this.matchCallbacks.push(callback);
    return () => {
      this.matchCallbacks = this.matchCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to stats updates
   */
  onStats(callback: StatsCallback): () => void {
    this.statsCallbacks.push(callback);
    return () => {
      this.statsCallbacks = this.statsCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Fetch market metrics (imbalance and momentum)
   * Privacy-preserving: only returns aggregate counts, no individual order details
   */
  async getMarketMetrics(): Promise<MarketMetrics | null> {
    try {
      const stats = await this.getStats();
      if (!stats) return null;

      // Calculate imbalance from order counts
      const imbalance = calculateImbalance(stats.buyOrders || 0, stats.sellOrders || 0);

      // Calculate momentum from activity log
      const momentum = calculateMomentum(stats.activityLog || [], 15);

      return { imbalance, momentum };
    } catch (error) {
      console.error('Failed to fetch market metrics:', error);
      return null;
    }
  }
}

// Singleton instance
export const matcherClient = new MatcherClient();

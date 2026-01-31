/**
 * Price Oracle Service for AuroraZK
 * 
 * Uses Pyth Network for real-time SOL/USDC price data
 * with fallback mechanisms and staleness checks
 */

import { HermesClient } from '@pythnetwork/hermes-client';

// Pyth Price Feed IDs (Mainnet/Devnet compatible)
export const PRICE_FEEDS = {
  // SOL/USD price feed
  'SOL/USD': 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  // USDC/USD price feed (should be ~$1)
  'USDC/USD': 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
} as const;

// Price update interval (ms)
const UPDATE_INTERVAL = 5000; // 5 seconds

// Staleness threshold (seconds)
const STALENESS_THRESHOLD = 60; // 1 minute

export interface PriceData {
  price: number;
  confidence: number;
  publishTime: Date;
  isStale: boolean;
  source: 'pyth' | 'fallback' | 'cached';
}

export interface OracleStatus {
  connected: boolean;
  lastUpdate: Date | null;
  priceFeeds: {
    [key: string]: PriceData | null;
  };
}

class PriceOracleService {
  private hermesClient: HermesClient;
  private prices: Map<string, PriceData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(prices: Map<string, PriceData>) => void> = new Set();
  private isConnected = false;
  private lastUpdate: Date | null = null;

  constructor() {
    // Hermes endpoint (Pyth's price service)
    this.hermesClient = new HermesClient('https://hermes.pyth.network');
  }

  /**
   * Start the price oracle service
   */
  async start(): Promise<void> {
    console.log('🔮 Starting Price Oracle Service...');
    
    try {
      // Initial price fetch
      await this.fetchPrices();
      this.isConnected = true;
      console.log('✅ Price Oracle connected to Pyth Network');
      
      // Set up periodic updates
      this.updateInterval = setInterval(async () => {
        await this.fetchPrices();
      }, UPDATE_INTERVAL);
      
    } catch (error) {
      console.error('Failed to start price oracle:', error);
      this.isConnected = false;
      
      // Try again in 10 seconds
      setTimeout(() => this.start(), 10000);
    }
  }

  /**
   * Stop the price oracle service
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isConnected = false;
    console.log('⏹️ Price Oracle stopped');
  }

  /**
   * Fetch latest prices from Pyth
   */
  private async fetchPrices(): Promise<void> {
    try {
      const feedIds = Object.values(PRICE_FEEDS);
      
      const priceUpdates = await this.hermesClient.getLatestPriceUpdates(feedIds);
      
      if (priceUpdates?.parsed) {
        for (const update of priceUpdates.parsed) {
          const feedId = update.id;
          const feedName = Object.entries(PRICE_FEEDS).find(
            ([_, id]) => id === feedId
          )?.[0];
          
          if (feedName && update.price) {
            const price = Number(update.price.price) * Math.pow(10, update.price.expo);
            const confidence = Number(update.price.conf) * Math.pow(10, update.price.expo);
            const publishTime = new Date(Number(update.price.publish_time) * 1000);
            const isStale = (Date.now() - publishTime.getTime()) / 1000 > STALENESS_THRESHOLD;
            
            this.prices.set(feedName, {
              price,
              confidence,
              publishTime,
              isStale,
              source: 'pyth',
            });
          }
        }
        
        this.lastUpdate = new Date();
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      
      // Mark existing prices as potentially stale
      this.prices.forEach((data, key) => {
        if (data.publishTime) {
          const age = (Date.now() - data.publishTime.getTime()) / 1000;
          if (age > STALENESS_THRESHOLD) {
            this.prices.set(key, { ...data, isStale: true });
          }
        }
      });
    }
  }

  /**
   * Get current SOL/USD price
   */
  getSolPrice(): PriceData | null {
    return this.prices.get('SOL/USD') || null;
  }

  /**
   * Get current USDC/USD price (should be ~$1)
   */
  getUsdcPrice(): PriceData | null {
    return this.prices.get('USDC/USD') || null;
  }

  /**
   * Get SOL/USDC price (derived from SOL/USD and USDC/USD)
   */
  getSolUsdcPrice(): PriceData | null {
    const solUsd = this.getSolPrice();
    const usdcUsd = this.getUsdcPrice();
    
    if (!solUsd || !usdcUsd) return null;
    
    // SOL/USDC = SOL/USD / USDC/USD
    const price = solUsd.price / usdcUsd.price;
    const confidence = Math.sqrt(
      Math.pow(solUsd.confidence / solUsd.price, 2) +
      Math.pow(usdcUsd.confidence / usdcUsd.price, 2)
    ) * price;
    
    return {
      price,
      confidence,
      publishTime: new Date(Math.min(
        solUsd.publishTime.getTime(),
        usdcUsd.publishTime.getTime()
      )),
      isStale: solUsd.isStale || usdcUsd.isStale,
      source: 'pyth',
    };
  }

  /**
   * Get oracle status
   */
  getStatus(): OracleStatus {
    return {
      connected: this.isConnected,
      lastUpdate: this.lastUpdate,
      priceFeeds: {
        'SOL/USD': this.getSolPrice(),
        'USDC/USD': this.getUsdcPrice(),
        'SOL/USDC': this.getSolUsdcPrice(),
      },
    };
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: (prices: Map<string, PriceData>) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately send current prices
    if (this.prices.size > 0) {
      callback(this.prices);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of price updates
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.prices);
      } catch (error) {
        console.error('Error in price subscriber:', error);
      }
    });
  }

  /**
   * Check if a price is within acceptable slippage for market orders
   */
  isPriceAcceptable(
    orderPrice: number,
    currentPrice: number,
    slippagePercent: number,
    side: 'buy' | 'sell'
  ): boolean {
    if (side === 'buy') {
      // For buys, current price must be <= order price + slippage
      const maxPrice = orderPrice * (1 + slippagePercent / 100);
      return currentPrice <= maxPrice;
    } else {
      // For sells, current price must be >= order price - slippage
      const minPrice = orderPrice * (1 - slippagePercent / 100);
      return currentPrice >= minPrice;
    }
  }

  /**
   * Get execution price for market orders
   * Uses mid-point of bid/ask spread (approximated by confidence interval)
   */
  getMarketExecutionPrice(side: 'buy' | 'sell'): number | null {
    const priceData = this.getSolUsdcPrice();
    if (!priceData || priceData.isStale) return null;
    
    // Use confidence as spread approximation
    // Buy at price + half confidence, sell at price - half confidence
    const halfSpread = priceData.confidence / 2;
    
    if (side === 'buy') {
      return priceData.price + halfSpread;
    } else {
      return priceData.price - halfSpread;
    }
  }
}

// Singleton instance
export const priceOracle = new PriceOracleService();

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  priceOracle.start();
}

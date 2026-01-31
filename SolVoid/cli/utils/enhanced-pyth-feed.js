// ============================================================================
// ENHANCED PYTH PRICE FEED INTEGRATION
// Real-time on-chain price oracle integration
// ============================================================================

const { Connection, PublicKey } = require('@solana/web3.js');
const { PythHttpClient, getPythProgramKeyForCluster } = require('@pythnetwork/client');

class EnhancedPythPriceFeed {
  constructor(connection) {
    this.connection = connection;
    this.pythConnection = null;
    this.priceCache = new Map();
    this.cacheExpiry = 30000; // 30 seconds
    this.lastUpdate = 0;
    
    // Known Pyth price feed mappings
    this.priceFeedMappings = new Map([
      // SOL
      ['So11111111111111111111111111111111111111112', '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c27bcde8'],
      
      // Major stablecoins
      ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', '0xeaa020c61cc479712813461ce153894a96a6c003b1a9d3b8bd7c9070d06068e30'], // USDC
      ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'], // USDT
      
      // Major tokens
      ['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', '0xd2aeea1b1016cd6453782546b7c0de2af3ebba6d5a2a0ecb12baa1b6bd3a5d5'], // Bonk
      ['mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', '0x385f64a31bb69e4e301c2c59d247c18c33dee6a7b1f466c3a7a4b0c0e6c0ab7'], // Marinade SOL
      ['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', '0x13b6430b3624e0c7b0e4b7a4a0e6e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e'], // Jupiter
      
      // Additional mappings can be added here
    ]);
    
    this.initializePyth();
  }

  /**
   * Initialize Pyth connection
   */
  async initializePyth() {
    try {
      const pythPublicKey = getPythProgramKeyForCluster('mainnet-beta');
      this.pythConnection = new PythHttpClient(this.connection, pythPublicKey);
      
      console.log(' Pyth price feed initialized');
    } catch (error) {
      console.warn('  Failed to initialize Pyth:', error.message);
    }
  }

  /**
   * Get real-time price for any token using Pyth on-chain feeds
   */
  async getPrice(mintAddress) {
    const cacheKey = mintAddress.toString();
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.price;
    }

    try {
      const price = await this._getPythPrice(mintAddress);
      this._updateCache(cacheKey, price);
      return price;
    } catch (error) {
      console.warn('Pyth price fetch failed:', error.message);
      
      // Return cached price if available
      if (cached) {
        console.log('Using cached price for', cacheKey);
        return cached.price;
      }
      
      // Return zero price as last resort
      return {
        usd: 0,
        source: 'pyth_fallback',
        timestamp: Date.now(),
        confidence: 0
      };
    }
  }

  /**
   * Get Pyth price for a specific token
   */
  async _getPythPrice(mintAddress) {
    if (!this.pythConnection) {
      await this.initializePyth();
    }

    const priceFeedAddress = this.priceFeedMappings.get(mintAddress.toString());
    
    if (!priceFeedAddress) {
      throw new Error(`No Pyth price feed found for ${mintAddress.toString()}`);
    }

    try {
      // Get price feed data
      const priceFeed = await this.pythConnection.getPriceFeed(priceFeedAddress);
      const price = priceFeed.getPrice();
      
      if (!price || price.price === undefined) {
        throw new Error('Invalid price data from Pyth');
      }

      // Calculate confidence level based on price age
      const priceAge = Date.now() - price.publishTime * 1000;
      const confidence = Math.max(0, 1 - (priceAge / 60000)); // Decay over 1 minute

      return {
        usd: price.price,
        source: 'pyth',
        timestamp: Date.now(),
        confidence,
        priceFeed: priceFeedAddress.toString(),
        publishTime: price.publishTime * 1000,
        confidenceInterval: price.confidence || 0
      };
    } catch (error) {
      throw new Error(`Pyth price fetch failed: ${error.message}`);
    }
  }

  /**
   * Get batch prices for multiple tokens
   */
  async getBatchPrices(mintAddresses) {
    const prices = new Map();
    const batchSize = 10; // Process in batches to avoid overwhelming RPC

    for (let i = 0; i < mintAddresses.length; i += batchSize) {
      const batch = mintAddresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (mint) => {
        try {
          const price = await this.getPrice(mint);
          return { mint: mint.toString(), price };
        } catch (error) {
          console.warn(`Failed to get price for ${mint.toString()}:`, error.message);
          return { 
            mint: mint.toString(), 
            price: { 
              usd: 0, 
              source: 'pyth_fallback', 
              timestamp: Date.now(),
              confidence: 0 
            } 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          prices.set(result.value.mint, result.value.price);
        }
      });
    }

    return prices;
  }

  /**
   * Get all available price feeds from Pyth
   */
  async getAllPriceFeeds() {
    if (!this.pythConnection) {
      await this.initializePyth();
    }

    try {
      const priceFeeds = await this.pythConnection.getPriceFeeds();
      
      const feedData = priceFeeds.map(feed => ({
        symbol: feed.symbol,
        priceFeed: feed.priceFeedAddress.toString(),
        price: feed.getPrice()?.price || 0,
        confidence: feed.getPrice()?.confidence || 0,
        publishTime: feed.getPrice()?.publishTime || 0,
        assetType: this._classifyAsset(feed.symbol)
      }));

      return feedData;
    } catch (error) {
      console.error('Failed to fetch all price feeds:', error);
      return [];
    }
  }

  /**
   * Add custom price feed mapping
   */
  addPriceFeedMapping(mintAddress, priceFeedAddress) {
    this.priceFeedMappings.set(mintAddress.toString(), priceFeedAddress);
    console.log(`Added price feed mapping: ${mintAddress.toString()} -> ${priceFeedAddress}`);
  }

  /**
   * Remove price feed mapping
   */
  removePriceFeedMapping(mintAddress) {
    this.priceFeedMappings.delete(mintAddress.toString());
    console.log(`Removed price feed mapping: ${mintAddress.toString()}`);
  }

  /**
   * Get price feed health status
   */
  async getHealthStatus() {
    try {
      const feeds = await this.getAllPriceFeeds();
      const activeFeeds = feeds.filter(feed => feed.price > 0);
      const staleFeeds = feeds.filter(feed => {
        const age = Date.now() - feed.publishTime * 1000;
        return age > 60000; // Older than 1 minute
      });

      return {
        totalFeeds: feeds.length,
        activeFeeds: activeFeeds.length,
        staleFeeds: staleFeeds.length,
        healthScore: activeFeeds.length / feeds.length,
        lastUpdate: Date.now()
      };
    } catch (error) {
      return {
        totalFeeds: 0,
        activeFeeds: 0,
        staleFeeds: 0,
        healthScore: 0,
        lastUpdate: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Refresh price data
   */
  async refreshPrices() {
    try {
      // Clear cache to force fresh fetch
      this.priceCache.clear();
      
      // Reinitialize Pyth connection
      await this.initializePyth();
      
      console.log(' Pyth price data refreshed');
    } catch (error) {
      console.error('Failed to refresh Pyth prices:', error);
    }
  }

  /**
   * Classify asset type based on symbol
   */
  _classifyAsset(symbol) {
    if (symbol.includes('USD') || symbol.includes('USDC') || symbol.includes('USDT')) {
      return 'stablecoin';
    }
    if (symbol.includes('SOL')) {
      return 'solana';
    }
    if (symbol.includes('BTC')) {
      return 'bitcoin';
    }
    if (symbol.includes('ETH')) {
      return 'ethereum';
    }
    return 'other';
  }

  /**
   * Update price cache
   */
  _updateCache(key, price) {
    this.priceCache.set(key, {
      price,
      timestamp: Date.now()
    });
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.priceCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.priceCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.priceCache.size,
      expiryTime: this.cacheExpiry,
      lastUpdate: this.lastUpdate
    };
  }
}

module.exports = { EnhancedPythPriceFeed };

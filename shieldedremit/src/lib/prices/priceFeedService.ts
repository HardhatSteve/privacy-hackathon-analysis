import type { PriceData, Currency } from "@/types";

interface PriceCache {
  data: PriceData;
  expiry: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Token mint addresses for Jupiter API
const TOKEN_MINTS: Record<Currency, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  USD1: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1", // World Liberty Financial USD1
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  AOL: "3hL4EYRdhW3oNvRwPdRsXAJgPSrsNpytTfzBCnjLVKSz", // AOL token
  RADR: "E8A7PfCDkynqT5nxdVpM2SvLrFLdP6ABWK6Vhxv3Q3Ls", // RADR token
  ORE: "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp",
};

export class PriceFeedService {
  private cache: Map<string, PriceCache> = new Map();
  private subscribers: Map<string, Set<(price: number) => void>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start price update loop
    this.startPriceUpdates();
  }

  async getPrice(symbol: Currency): Promise<number> {
    const cached = this.getFromCache(symbol);
    if (cached) {
      return cached.price;
    }

    const priceData = await this.fetchPrice(symbol);
    this.setCache(symbol, priceData);
    return priceData.price;
  }

  async getPrices(symbols: Currency[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    await Promise.all(
      symbols.map(async (symbol) => {
        const price = await this.getPrice(symbol);
        prices.set(symbol, price);
      })
    );

    return prices;
  }

  async getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;

    const [fromPrice, toPrice] = await Promise.all([
      this.getPrice(from),
      this.getPrice(to),
    ]);

    return fromPrice / toPrice;
  }

  async convertAmount(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  async convertToUSD(amount: number, currency: Currency): Promise<number> {
    if (currency === "USDC" || currency === "USDT" || currency === "USD1") {
      return amount; // Stablecoins are 1:1 with USD
    }

    const price = await this.getPrice(currency);
    return amount * price;
  }

  subscribeToPrice(symbol: Currency, callback: (price: number) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }

    this.subscribers.get(symbol)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(symbol)?.delete(callback);
    };
  }

  private async fetchPrice(symbol: Currency): Promise<PriceData> {
    try {
      // Try Jupiter Price API first
      const jupiterPrice = await this.fetchFromJupiter(symbol);
      if (jupiterPrice) {
        return jupiterPrice;
      }
    } catch (error) {
      console.warn("Jupiter price fetch failed:", error);
    }

    // Fallback to hardcoded prices for development
    return this.getFallbackPrice(symbol);
  }

  private async fetchFromJupiter(symbol: Currency): Promise<PriceData | null> {
    const mint = TOKEN_MINTS[symbol];
    if (!mint) return null;

    try {
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${mint}`
      );

      if (!response.ok) {
        throw new Error("Jupiter API error");
      }

      const data = await response.json();
      const priceData = data.data[mint];

      if (!priceData) {
        throw new Error("Price not found");
      }

      return {
        symbol,
        price: priceData.price,
        change24h: 0, // Jupiter doesn't provide 24h change
        timestamp: Date.now(),
        source: "jupiter",
      };
    } catch {
      return null;
    }
  }

  private getFallbackPrice(symbol: Currency): PriceData {
    // Fallback prices for development/offline mode
    const fallbackPrices: Record<Currency, number> = {
      SOL: 100.0, // Approximate SOL price
      USDC: 1.0,
      USDT: 1.0,
      USD1: 1.0, // USD1 stablecoin
      BONK: 0.00001, // BONK meme token
      AOL: 0.001, // AOL token
      RADR: 0.01, // RADR token
      ORE: 1.0, // ORE token
    };

    return {
      symbol,
      price: fallbackPrices[symbol] || 0,
      change24h: 0,
      timestamp: Date.now(),
      source: "coingecko", // Fallback marker
    };
  }

  private getFromCache(symbol: string): PriceData | null {
    const cached = this.cache.get(symbol);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache(symbol: string, data: PriceData): void {
    this.cache.set(symbol, {
      data,
      expiry: Date.now() + CACHE_TTL,
    });
  }

  private startPriceUpdates(): void {
    // Update prices every 30 seconds
    this.updateInterval = setInterval(async () => {
      const symbols: Currency[] = ["SOL", "USDC", "USDT", "USD1", "BONK", "AOL", "RADR", "ORE"];

      for (const symbol of symbols) {
        try {
          const priceData = await this.fetchPrice(symbol);
          this.setCache(symbol, priceData);

          // Notify subscribers
          const callbacks = this.subscribers.get(symbol);
          if (callbacks) {
            callbacks.forEach((callback) => callback(priceData.price));
          }
        } catch (error) {
          console.error(`Failed to update price for ${symbol}:`, error);
        }
      }
    }, 30000);
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.cache.clear();
    this.subscribers.clear();
  }
}

// Singleton instance
let priceFeedInstance: PriceFeedService | null = null;

export function getPriceFeedService(): PriceFeedService {
  if (!priceFeedInstance) {
    priceFeedInstance = new PriceFeedService();
  }
  return priceFeedInstance;
}

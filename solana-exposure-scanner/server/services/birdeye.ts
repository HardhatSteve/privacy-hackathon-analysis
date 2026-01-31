// Birdeye API Service (Optional)
// Provides methods to fetch wallet PnL and token pricing data

const BIRDEYE_API_BASE = 'https://public-api.birdeye.so';

export interface BirdeyePnLToken {
    address: string;
    symbol: string;
    name: string;
    buyCount: number;
    sellCount: number;
    buyAmount: number;
    sellAmount: number;
    buyValue: number;
    sellValue: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;
    avgBuyPrice: number;
    avgSellPrice: number;
    currentPrice: number;
    holdingAmount: number;
    holdingValue: number;
}

export interface BirdeyeWalletPnL {
    totalRealizedPnl: number;
    totalUnrealizedPnl: number;
    totalPnl: number;
    tokens: BirdeyePnLToken[];
}

class BirdeyeService {
    private apiKey: string;
    private enabled: boolean;

    constructor() {
        this.apiKey = process.env.BIRDEYE_API_KEY || '';
        this.enabled = !!this.apiKey;

        if (!this.enabled) {
            console.info('BIRDEYE_API_KEY not set. Birdeye features will be disabled.');
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get wallet PnL data for all tokens
     */
    async getWalletPnL(address: string): Promise<BirdeyeWalletPnL | null> {
        if (!this.enabled) {
            return null;
        }

        try {
            const url = `${BIRDEYE_API_BASE}/wallet/v2/pnl?wallet=${address}`;

            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'x-chain': 'solana',
                },
            });

            if (!response.ok) {
                console.error(`Birdeye API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (!data.success || !data.data) {
                return null;
            }

            // Aggregate PnL data
            const tokens: BirdeyePnLToken[] = data.data.items || [];

            const totalRealizedPnl = tokens.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
            const totalUnrealizedPnl = tokens.reduce((sum, t) => sum + (t.unrealizedPnl || 0), 0);

            return {
                totalRealizedPnl,
                totalUnrealizedPnl,
                totalPnl: totalRealizedPnl + totalUnrealizedPnl,
                tokens,
            };
        } catch (error) {
            console.error('Birdeye API error:', error);
            return null;
        }
    }

    /**
     * Get token price by mint address
     */
    async getTokenPrice(mint: string): Promise<number | null> {
        if (!this.enabled) {
            return null;
        }

        try {
            const url = `${BIRDEYE_API_BASE}/defi/price?address=${mint}`;

            const response = await fetch(url, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'x-chain': 'solana',
                },
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.data?.value || null;
        } catch (error) {
            console.error('Birdeye price error:', error);
            return null;
        }
    }
}

export const birdeyeService = new BirdeyeService();

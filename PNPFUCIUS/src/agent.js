import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';
import { getConfig, validateConfig } from './config.js';
import { generatePrivacyMarket, generateMultipleMarkets } from './privacy-markets.js';

export class PrivacyOracleAgent {
    constructor(options = {}) {
        this.config = options.config || getConfig();
        this.client = null;
        this.initialized = false;
        this.verbose = options.verbose || false;
    }

    log(message, level = 'info') {
        if (this.verbose || level === 'error') {
            const prefix = level === 'error' ? '[ERROR]' : '[INFO]';
            console.log(`${prefix} ${message}`);
        }
    }

    async initialize() {
        if (this.initialized) return;

        const validation = validateConfig(this.config);
        
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(w => this.log(w, 'warn'));
        }

        if (!validation.valid && this.config.walletKey) {
            throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
        }

        this.log(`Connecting to ${this.config.network} via Helius RPC...`);
        
        if (this.config.walletKey) {
            let privateKey = this.config.walletKey;
            
            if (typeof privateKey === 'string') {
                if (privateKey.startsWith('[')) {
                    privateKey = Uint8Array.from(JSON.parse(privateKey));
                }
            }
            
            this.client = new PNPClient(this.config.rpcUrl, privateKey);
            this.log('Client initialized with signer');
        } else {
            this.client = new PNPClient(this.config.rpcUrl);
            this.log('Client initialized in read-only mode');
        }

        this.initialized = true;
    }

    async createMarket(options) {
        await this.initialize();

        if (!this.client.market) {
            throw new Error('Market module not available. Ensure wallet is configured.');
        }

        const question = options.question;
        const durationDays = options.durationDays || this.config.defaultDurationDays;
        const liquidity = options.liquidity || this.config.defaultLiquidity;

        const endTime = BigInt(Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60));

        this.log(`Creating market: "${question}"`);
        this.log(`Duration: ${durationDays} days, Liquidity: ${liquidity}`);

        const result = await this.client.market.createMarket({
            question,
            initialLiquidity: liquidity,
            endTime,
            baseMint: this.config.collateralMint
        });

        return {
            success: true,
            signature: result.signature,
            market: result.market?.toBase58?.() || result.market?.toString?.() || result.market,
            question,
            durationDays,
            liquidity: liquidity.toString()
        };
    }

    async createP2PMarket(options) {
        await this.initialize();

        const question = options.question;
        const side = options.side || 'yes';
        const amount = options.amount || this.config.defaultLiquidity;
        const cap = options.cap || amount * 5n;
        const durationDays = options.durationDays || this.config.defaultDurationDays;

        const endTime = BigInt(Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60));

        this.log(`Creating P2P market: "${question}"`);
        this.log(`Side: ${side}, Amount: ${amount}, Cap: ${cap}`);

        const result = await this.client.createP2PMarketGeneral({
            question,
            initialAmount: amount,
            side,
            creatorSideCap: cap,
            endTime,
            collateralTokenMint: this.config.collateralMint
        });

        return {
            success: true,
            signature: result.signature,
            market: result.market,
            yesTokenMint: result.yesTokenMint,
            noTokenMint: result.noTokenMint,
            question,
            side,
            durationDays
        };
    }

    async createPrivacyMarket(options = {}) {
        const marketIdea = generatePrivacyMarket();
        
        this.log(`Generated market idea: ${marketIdea.category}`);
        
        return this.createMarket({
            question: options.question || marketIdea.question,
            durationDays: options.durationDays || marketIdea.durationDays,
            liquidity: options.liquidity || marketIdea.suggestedLiquidity
        });
    }

    async createBatchMarkets(count = 3) {
        await this.initialize();

        const ideas = generateMultipleMarkets(count);
        const results = [];

        for (const idea of ideas) {
            try {
                this.log(`Creating: "${idea.question}"`);
                
                const result = await this.createMarket({
                    question: idea.question,
                    durationDays: idea.durationDays,
                    liquidity: idea.suggestedLiquidity
                });
                
                results.push({ ...result, category: idea.category });
                
                await this.sleep(2000);
                
            } catch (error) {
                results.push({
                    success: false,
                    question: idea.question,
                    error: error.message
                });
            }
        }

        return results;
    }

    async fetchMarkets() {
        await this.initialize();
        
        try {
            const response = await this.client.fetchMarkets();
            return response;
        } catch (error) {
            this.log(`Error fetching markets: ${error.message}`, 'error');
            throw error;
        }
    }

    async fetchMarketInfo(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);
        const info = await this.client.fetchMarket(market);

        return {
            address: marketAddress,
            question: info.account.question,
            creator: new PublicKey(info.account.creator).toBase58(),
            resolved: info.account.resolved,
            resolvable: info.account.resolvable,
            endTime: new Date(Number(info.account.end_time) * 1000),
            winningToken: info.account.winning_token_id || null
        };
    }

    async getMarketAddresses() {
        await this.initialize();
        return this.client.fetchMarketAddresses();
    }

    // ========== TRADING METHODS ==========

    async buyTokens(options) {
        await this.initialize();

        const { marketAddress, side, amountUsdc } = options;
        const market = new PublicKey(marketAddress);

        this.log(`Buying ${side.toUpperCase()} tokens for ${amountUsdc} USDC on ${marketAddress}`);

        if (!this.client.trading) {
            throw new Error('Trading module not available. Ensure wallet is configured.');
        }

        const result = await this.client.trading.buyTokensUsdc({
            market,
            usdcAmount: BigInt(Math.floor(amountUsdc * 1_000_000)),
            tokenId: side === 'yes' ? 0 : 1
        });

        return {
            success: true,
            signature: result.signature,
            market: marketAddress,
            side,
            amountUsdc,
            tokensReceived: result.tokensReceived?.toString() || 'unknown'
        };
    }

    async sellTokens(options) {
        await this.initialize();

        const { marketAddress, side, amount } = options;
        const market = new PublicKey(marketAddress);

        this.log(`Selling ${amount} ${side.toUpperCase()} tokens on ${marketAddress}`);

        if (!this.client.trading) {
            throw new Error('Trading module not available. Ensure wallet is configured.');
        }

        const result = await this.client.trading.sellTokensBase({
            market,
            tokenAmount: BigInt(Math.floor(amount * 1_000_000)),
            tokenId: side === 'yes' ? 0 : 1
        });

        return {
            success: true,
            signature: result.signature,
            market: marketAddress,
            side,
            amount,
            usdcReceived: result.usdcReceived?.toString() || 'unknown'
        };
    }

    async getMarketPrices(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        if (this.client.trading?.getPrices) {
            const prices = await this.client.trading.getPrices(market);
            return {
                market: marketAddress,
                yesPrice: prices.yesPrice || prices[0],
                noPrice: prices.noPrice || prices[1],
                timestamp: new Date().toISOString()
            };
        }

        // Fallback: fetch market info and calculate from pool
        const info = await this.client.fetchMarket(market);
        return {
            market: marketAddress,
            yesPrice: 'N/A - use fetchMarket for pool data',
            noPrice: 'N/A - use fetchMarket for pool data',
            raw: info
        };
    }

    async getBalances(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        if (this.client.trading?.getBalances) {
            const balances = await this.client.trading.getBalances(market);
            return {
                market: marketAddress,
                yesBalance: balances.yesBalance?.toString() || '0',
                noBalance: balances.noBalance?.toString() || '0'
            };
        }

        return {
            market: marketAddress,
            yesBalance: '0',
            noBalance: '0',
            note: 'Balance check requires wallet connection'
        };
    }

    // ========== REDEMPTION METHODS ==========

    async redeemPosition(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        this.log(`Redeeming position on ${marketAddress}`);

        const result = await this.client.redeemPosition(market);

        return {
            success: true,
            signature: result.signature,
            market: marketAddress,
            amountRedeemed: result.amount?.toString() || 'unknown'
        };
    }

    async claimRefund(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        this.log(`Claiming refund on ${marketAddress}`);

        const result = await this.client.claimMarketRefund(market);

        return {
            success: true,
            signature: result.signature,
            market: marketAddress,
            amountRefunded: result.amount?.toString() || 'unknown'
        };
    }

    // ========== URL-AWARE MARKET CREATION ==========

    async createMarketFromSource(options) {
        await this.initialize();

        const { question, sourceUrl, sourceType, durationDays, liquidity } = options;
        const endTime = BigInt(Math.floor(Date.now() / 1000) + ((durationDays || 30) * 24 * 60 * 60));
        const amount = liquidity || this.config.defaultLiquidity;

        this.log(`Creating ${sourceType || 'standard'} market: "${question}"`);

        let result;

        if (sourceType === 'twitter' && this.client.createMarketTwitter) {
            result = await this.client.createMarketTwitter({
                question,
                tweetUrl: sourceUrl,
                initialLiquidity: amount,
                endTime,
                baseMint: this.config.collateralMint
            });
        } else if (sourceType === 'youtube' && this.client.createMarketYoutube) {
            result = await this.client.createMarketYoutube({
                question,
                youtubeUrl: sourceUrl,
                initialLiquidity: amount,
                endTime,
                baseMint: this.config.collateralMint
            });
        } else if (sourceType === 'defi' && this.client.createMarketDefiLlama) {
            result = await this.client.createMarketDefiLlama({
                question,
                metric: sourceUrl,
                initialLiquidity: amount,
                endTime,
                baseMint: this.config.collateralMint
            });
        } else {
            // Fallback to standard market creation
            result = await this.client.market.createMarket({
                question,
                initialLiquidity: amount,
                endTime,
                baseMint: this.config.collateralMint
            });
        }

        return {
            success: true,
            signature: result.signature,
            market: result.market?.toBase58?.() || result.market?.toString?.() || result.market,
            question,
            sourceType: sourceType || 'standard',
            sourceUrl
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== PNP ORACLE/SETTLEMENT METHODS ==========

    /**
     * Fetch settlement criteria from PNP's LLM oracle
     * This returns the AI-generated criteria for how the market should be resolved
     */
    async fetchSettlementCriteria(marketAddress, options = {}) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        this.log(`Fetching settlement criteria for ${market}`);

        try {
            const criteria = await this.client.fetchSettlementCriteria(market, options.baseUrl);
            return {
                success: true,
                market,
                criteria
            };
        } catch (error) {
            this.log(`Error fetching settlement criteria: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get settlement data (resolution result) from PNP's LLM oracle
     */
    async getSettlementData(marketAddress, options = {}) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        this.log(`Fetching settlement data for ${market}`);

        try {
            const data = await this.client.getSettlementData(market, options.baseUrl);
            return {
                success: true,
                market,
                data
            };
        } catch (error) {
            this.log(`Error fetching settlement data: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Wait for settlement criteria to become available (with retries)
     */
    async waitForSettlementCriteria(marketAddress, options = {}) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();
        const { retryDelayMs = 2000, maxRetryTimeMs = 30000, baseUrl } = options;

        this.log(`Waiting for settlement criteria for ${market}...`);

        try {
            const result = await this.client.waitForSettlementCriteria(market, baseUrl, {
                retryDelayMs,
                maxRetryTimeMs
            });
            return {
                success: true,
                market,
                resolvable: result.resolvable,
                answer: result.answer,
                criteria: result.criteria
            };
        } catch (error) {
            this.log(`Error waiting for settlement criteria: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Settle a market using the oracle (set the winning outcome)
     * NOTE: This requires oracle authority
     */
    async settleMarket(marketAddress, yesWinner) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        this.log(`Settling market ${marketAddress} with outcome: ${yesWinner ? 'YES' : 'NO'}`);

        try {
            const result = await this.client.settleMarket({
                market,
                yesWinner
            });
            return {
                success: true,
                signature: result.signature,
                market: marketAddress,
                outcome: yesWinner ? 'yes' : 'no'
            };
        } catch (error) {
            this.log(`Error settling market: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Set market as resolvable (devnet only)
     */
    async setMarketResolvable(marketAddress, resolvable = true, forceResolve = false) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        this.log(`Setting market ${market} resolvable: ${resolvable}`);

        try {
            const result = await this.client.setMarketResolvable(market, resolvable, forceResolve);
            return {
                success: true,
                signature: result.signature,
                market,
                resolvable
            };
        } catch (error) {
            this.log(`Error setting resolvable: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== MARKET DISCOVERY METHODS ==========

    /**
     * Discover all markets on PNP Exchange (not just created by this agent)
     */
    async discoverMarkets(options = {}) {
        await this.initialize();

        this.log('Discovering all PNP markets...');

        try {
            const markets = await this.client.fetchMarkets();
            return {
                success: true,
                markets: markets,
                count: Array.isArray(markets) ? markets.length : Object.keys(markets).length
            };
        } catch (error) {
            this.log(`Error discovering markets: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Fetch all market addresses (V2)
     */
    async fetchAllMarketAddresses(baseUrl) {
        await this.initialize();

        try {
            const addresses = await this.client.fetchMarketAddresses(baseUrl);
            return {
                success: true,
                addresses,
                count: addresses.length
            };
        } catch (error) {
            this.log(`Error fetching market addresses: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Fetch all V3 market addresses
     */
    async fetchV3MarketAddresses(baseUrl) {
        await this.initialize();

        try {
            const addresses = await this.client.fetchV3MarketAddresses(baseUrl);
            return {
                success: true,
                addresses,
                count: addresses.length
            };
        } catch (error) {
            this.log(`Error fetching V3 market addresses: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get market metadata (volume, image, etc.)
     */
    async getMarketMetadata(marketAddress, baseUrl) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        try {
            const meta = await this.client.getMarketMeta(market, baseUrl);
            return {
                success: true,
                market,
                metadata: meta
            };
        } catch (error) {
            this.log(`Error fetching market metadata: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get metadata for multiple markets at once
     */
    async getMarketMetadataBatch(marketAddresses, baseUrl) {
        await this.initialize();

        const markets = marketAddresses.map(m => typeof m === 'string' ? m : m.toString());

        try {
            const metas = await this.client.getMarketMetaBatch(markets, baseUrl);
            return {
                success: true,
                markets: metas,
                count: metas.length
            };
        } catch (error) {
            this.log(`Error fetching batch metadata: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get detailed V2 market info
     */
    async getV2MarketInfo(marketAddress, options = {}) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        try {
            const info = await this.client.getV2MarketInfo(market, options);
            return {
                success: true,
                market,
                info
            };
        } catch (error) {
            this.log(`Error fetching V2 market info: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get detailed P2P market info
     */
    async getP2PMarketInfo(marketAddress, options = {}) {
        await this.initialize();

        const market = typeof marketAddress === 'string' ? marketAddress : marketAddress.toString();

        try {
            const info = await this.client.getP2PMarketInfo(market, options);
            return {
                success: true,
                market,
                info
            };
        } catch (error) {
            this.log(`Error fetching P2P market info: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== P2P MARKET WITH CUSTOM ODDS ==========

    /**
     * Create a simple P2P market (UI-friendly with USDC amounts)
     */
    async createP2PMarketSimple(options) {
        await this.initialize();

        const {
            question,
            side = 'yes',
            amountUsdc = 1,
            durationDays = 30,
            capMultiplier = 5,
            maxPotRatio
        } = options;

        this.log(`Creating simple P2P market: "${question}"`);
        this.log(`Side: ${side}, Amount: ${amountUsdc} USDC, Cap multiplier: ${capMultiplier}x`);

        try {
            const result = await this.client.createP2PMarketSimple({
                question,
                side,
                amountUsdc,
                daysUntilEnd: durationDays,
                creatorSideCapMultiplier: capMultiplier,
                collateralTokenMint: this.config.collateralMint,
                maxPotRatio
            });

            return {
                success: true,
                signature: result.signature,
                market: result.market,
                yesTokenMint: result.yesTokenMint,
                noTokenMint: result.noTokenMint,
                question,
                side,
                amountUsdc,
                durationDays
            };
        } catch (error) {
            this.log(`Error creating simple P2P market: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Create a P2P market with custom odds
     */
    async createP2PMarketWithOdds(options) {
        await this.initialize();

        const {
            question,
            side = 'yes',
            amount,
            cap,
            durationDays = 30,
            oddsBps,  // Odds in basis points (e.g., 7000 = 70%)
            maxPotRatio
        } = options;

        const endTime = BigInt(Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60));
        const initialAmount = amount || this.config.defaultLiquidity;
        const creatorSideCap = cap || initialAmount * 5n;

        this.log(`Creating P2P market with odds: "${question}"`);
        this.log(`Side: ${side}, Odds: ${oddsBps / 100}%`);

        try {
            const result = await this.client.createMarketP2PWithCustomOdds({
                question,
                initialAmount,
                side,
                creatorSideCap,
                endTime,
                oddsBps,
                maxPotRatio,
                collateralTokenMint: this.config.collateralMint
            });

            return {
                success: true,
                signature: result.signature,
                market: result.market,
                yesTokenMint: result.yesTokenMint,
                noTokenMint: result.noTokenMint,
                question,
                side,
                oddsBps,
                durationDays
            };
        } catch (error) {
            this.log(`Error creating P2P market with odds: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Create an AMM market with custom starting odds
     */
    async createAMMMarketWithOdds(options) {
        await this.initialize();

        const {
            question,
            liquidity,
            durationDays = 30,
            yesOddsBps  // Starting YES odds in basis points (e.g., 5000 = 50%)
        } = options;

        const endTime = BigInt(Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60));
        const initialLiquidity = liquidity || this.config.defaultLiquidity;

        this.log(`Creating AMM market with odds: "${question}"`);
        this.log(`YES odds: ${yesOddsBps / 100}%, Liquidity: ${initialLiquidity}`);

        try {
            const result = await this.client.createMarketV2WithCustomOdds({
                question,
                initialLiquidity,
                endTime,
                collateralTokenMint: this.config.collateralMint,
                yesOddsBps
            });

            return {
                success: true,
                signature: result.signature,
                market: result.market,
                question,
                yesOddsBps,
                durationDays
            };
        } catch (error) {
            this.log(`Error creating AMM market with odds: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== CUSTOM ORACLE SUPPORT ==========

    /**
     * Create a market with a custom oracle/settler address
     */
    async createMarketWithCustomOracle(options) {
        await this.initialize();

        const {
            question,
            liquidity,
            durationDays = 30,
            settlerAddress,  // The address that will resolve this market
            yesOddsBps = 5000  // Default 50/50
        } = options;

        const endTime = BigInt(Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60));
        const initialLiquidity = liquidity || this.config.defaultLiquidity;
        const settler = new PublicKey(settlerAddress);

        this.log(`Creating market with custom oracle: "${question}"`);
        this.log(`Oracle: ${settlerAddress}`);

        try {
            const result = await this.client.createMarketWithCustomOracle({
                question,
                initialLiquidity,
                endTime,
                collateralMint: this.config.collateralMint,
                settlerAddress: settler,
                yesOddsBps
            });

            return {
                success: true,
                signature: result.signature,
                market: result.market?.toBase58?.() || result.market?.toString?.() || result.market,
                question,
                settlerAddress,
                durationDays
            };
        } catch (error) {
            this.log(`Error creating market with custom oracle: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== V3 MARKET SUPPORT ==========

    /**
     * Buy tokens on a V3 market
     */
    async buyV3Tokens(options) {
        await this.initialize();

        const { marketAddress, side, amountUsdc } = options;
        const market = new PublicKey(marketAddress);

        this.log(`Buying V3 ${side.toUpperCase()} tokens for ${amountUsdc} USDC on ${marketAddress}`);

        try {
            const result = await this.client.buyV3TokensUsdc({
                market,
                buyYesToken: side === 'yes',
                amountUsdc
            });

            return {
                success: true,
                signature: result.signature,
                market: marketAddress,
                side,
                amountUsdc
            };
        } catch (error) {
            this.log(`Error buying V3 tokens: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Redeem position on a V3 market
     */
    async redeemV3Position(marketAddress) {
        await this.initialize();

        const market = new PublicKey(marketAddress);

        this.log(`Redeeming V3 position on ${marketAddress}`);

        try {
            const result = await this.client.redeemV3Position(market);
            return {
                success: true,
                signature: result.signature,
                market: marketAddress
            };
        } catch (error) {
            this.log(`Error redeeming V3 position: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Redeem P2P market position
     */
    async redeemP2PPosition(marketAddress) {
        await this.initialize();

        this.log(`Redeeming P2P position on ${marketAddress}`);

        try {
            const result = await this.client.redeemP2PPosition(marketAddress);
            return {
                success: true,
                signature: result.signature,
                market: marketAddress
            };
        } catch (error) {
            this.log(`Error redeeming P2P position: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Claim P2P market refund
     */
    async claimP2PRefund(marketAddress) {
        await this.initialize();

        this.log(`Claiming P2P refund on ${marketAddress}`);

        try {
            const result = await this.client.claimP2PMarketRefund(marketAddress);
            return {
                success: true,
                signature: result.signature,
                market: marketAddress
            };
        } catch (error) {
            this.log(`Error claiming P2P refund: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== URL DETECTION HELPERS ==========

    /**
     * Detect Twitter URL in question text
     */
    detectTwitterUrl(questionText) {
        if (this.client.detectTwitterUrl) {
            return this.client.detectTwitterUrl(questionText);
        }
        // Fallback regex
        const twitterRegex = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
        const match = questionText.match(twitterRegex);
        return {
            question: questionText,
            twitterUrl: match ? match[0] : undefined
        };
    }

    /**
     * Detect YouTube URL in question text
     */
    detectYoutubeUrl(questionText) {
        if (this.client.detectYoutubeUrl) {
            return this.client.detectYoutubeUrl(questionText);
        }
        // Fallback regex
        const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/i;
        const match = questionText.match(youtubeRegex);
        return {
            question: questionText,
            youtubeUrl: match ? match[0] : undefined
        };
    }

    /**
     * Detect DeFi Llama metric in question text
     */
    detectDefiLlamaUrl(questionText) {
        if (this.client.detectDefiLlamaUrl) {
            return this.client.detectDefiLlamaUrl(questionText);
        }
        return { question: questionText };
    }

    // ========== GLOBAL CONFIG ==========

    /**
     * Fetch PNP global configuration
     */
    async fetchGlobalConfig() {
        await this.initialize();

        try {
            const config = await this.client.fetchGlobalConfig();
            return {
                success: true,
                config: {
                    publicKey: config.publicKey?.toBase58?.() || config.publicKey,
                    account: config.account
                }
            };
        } catch (error) {
            this.log(`Error fetching global config: ${error.message}`, 'error');
            throw error;
        }
    }
}

export async function createAgent(options = {}) {
    const agent = new PrivacyOracleAgent(options);
    await agent.initialize();
    return agent;
}

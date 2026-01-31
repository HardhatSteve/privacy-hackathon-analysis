// Market tool definitions and implementations for PNPFUCIUS

import { createAgent } from '../../agent.js';
import { createMarketStore } from '../../storage/market-store.js';
import { getConfig } from '../../config.js';

// Tool definitions for PNPFUCIUS
export const marketToolDefinitions = [
    {
        name: 'create_market',
        description: 'Create a prediction market on Solana. Returns market address and transaction signature.',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                },
                liquidity_usdc: {
                    type: 'number',
                    description: 'Initial liquidity in USDC (default: 1)'
                },
                type: {
                    type: 'string',
                    enum: ['amm', 'p2p'],
                    description: 'Market type (default: amm)'
                }
            },
            required: ['question']
        }
    },
    {
        name: 'list_markets',
        description: 'List existing prediction markets with optional filters',
        input_schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['active', 'resolved', 'all'],
                    description: 'Filter by market status'
                },
                category: {
                    type: 'string',
                    description: 'Filter by category'
                },
                limit: {
                    type: 'number',
                    description: 'Max markets to return (default: 10)'
                }
            }
        }
    },
    {
        name: 'get_market_info',
        description: 'Get detailed information about a specific market',
        input_schema: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'Market address on Solana'
                }
            },
            required: ['address']
        }
    },
    // ========== TRADING TOOLS ==========
    {
        name: 'buy_tokens',
        description: 'Buy YES or NO tokens on a prediction market using USDC',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                },
                side: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'Which token to buy (yes or no)'
                },
                amount_usdc: {
                    type: 'number',
                    description: 'Amount of USDC to spend'
                }
            },
            required: ['market_address', 'side', 'amount_usdc']
        }
    },
    {
        name: 'sell_tokens',
        description: 'Sell YES or NO tokens from a prediction market for USDC',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                },
                side: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'Which token to sell (yes or no)'
                },
                amount: {
                    type: 'number',
                    description: 'Amount of tokens to sell'
                }
            },
            required: ['market_address', 'side', 'amount']
        }
    },
    {
        name: 'get_market_prices',
        description: 'Get current YES and NO token prices for a market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'get_balances',
        description: 'Get your YES and NO token balances for a market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    // ========== REDEMPTION TOOLS ==========
    {
        name: 'redeem_position',
        description: 'Redeem winning tokens from a resolved market for USDC',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The resolved market address'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'claim_refund',
        description: 'Claim creator refund from an unresolved/cancelled market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address'
                }
            },
            required: ['market_address']
        }
    },
    // ========== URL-AWARE MARKET CREATION ==========
    {
        name: 'create_market_from_source',
        description: 'Create a market linked to a verifiable source (Twitter, YouTube, or DeFi metric)',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                source_url: {
                    type: 'string',
                    description: 'URL of the source (tweet, video, or DeFi metric identifier)'
                },
                source_type: {
                    type: 'string',
                    enum: ['twitter', 'youtube', 'defi'],
                    description: 'Type of source for verification'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                },
                liquidity_usdc: {
                    type: 'number',
                    description: 'Initial liquidity in USDC (default: 1)'
                }
            },
            required: ['question', 'source_url', 'source_type']
        }
    },

    // ========== PNP ORACLE/SETTLEMENT TOOLS ==========
    {
        name: 'get_settlement_criteria',
        description: 'Get AI-generated settlement criteria from PNP\'s LLM oracle. Returns how the market should be evaluated for resolution.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'get_settlement_data',
        description: 'Get the resolution result from PNP\'s LLM oracle. Returns the answer and reasoning for market resolution.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'wait_for_settlement',
        description: 'Wait for settlement criteria to become available (with automatic retries). Useful for newly created markets.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                },
                timeout_seconds: {
                    type: 'number',
                    description: 'Maximum time to wait in seconds (default: 30)'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'settle_market',
        description: 'Settle a market with a specific outcome (requires oracle authority). Use this to resolve a market.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                },
                outcome: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'The winning outcome'
                }
            },
            required: ['market_address', 'outcome']
        }
    },

    // ========== MARKET DISCOVERY TOOLS ==========
    {
        name: 'discover_all_markets',
        description: 'Discover ALL prediction markets on PNP Exchange (not just ones you created). Returns a list of all available markets.',
        input_schema: {
            type: 'object',
            properties: {
                version: {
                    type: 'string',
                    enum: ['v2', 'v3', 'all'],
                    description: 'Market version to fetch (default: all)'
                }
            }
        }
    },
    {
        name: 'get_market_metadata',
        description: 'Get metadata for a market including volume, image, and other analytics.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'get_v2_market_info',
        description: 'Get detailed V2 (AMM) market information including token mints, multipliers, and settlement criteria.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The V2 market address on Solana'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'get_p2p_market_info',
        description: 'Get detailed P2P market information including reserves, mints, and settlement criteria.',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The P2P market address on Solana'
                }
            },
            required: ['market_address']
        }
    },

    // ========== P2P MARKET TOOLS WITH CUSTOM ODDS ==========
    {
        name: 'create_p2p_market_simple',
        description: 'Create a simple P2P prediction market with USDC. Easier to use than the standard P2P creation.',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                side: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'Which side you are betting on (default: yes)'
                },
                amount_usdc: {
                    type: 'number',
                    description: 'Amount of USDC to put up (default: 1)'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                },
                cap_multiplier: {
                    type: 'number',
                    description: 'How much more the other side can bet (default: 5x)'
                }
            },
            required: ['question']
        }
    },
    {
        name: 'create_p2p_market_with_odds',
        description: 'Create a P2P market with custom starting odds. Specify exact odds in basis points.',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                side: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'Which side you are betting on'
                },
                amount_usdc: {
                    type: 'number',
                    description: 'Amount of USDC to put up'
                },
                odds_percent: {
                    type: 'number',
                    description: 'Your side\'s odds as a percentage (e.g., 70 for 70%)'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                }
            },
            required: ['question', 'side', 'odds_percent']
        }
    },
    {
        name: 'create_amm_market_with_odds',
        description: 'Create an AMM market with custom starting odds. The YES price will start at the specified percentage.',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                yes_odds_percent: {
                    type: 'number',
                    description: 'Starting YES odds as a percentage (e.g., 60 for 60%)'
                },
                liquidity_usdc: {
                    type: 'number',
                    description: 'Initial liquidity in USDC (default: 1)'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                }
            },
            required: ['question', 'yes_odds_percent']
        }
    },

    // ========== CUSTOM ORACLE TOOLS ==========
    {
        name: 'create_market_with_oracle',
        description: 'Create a market with a custom oracle/settler address. You specify who can resolve the market.',
        input_schema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The YES/NO market question'
                },
                settler_address: {
                    type: 'string',
                    description: 'Solana address that will have authority to settle this market'
                },
                liquidity_usdc: {
                    type: 'number',
                    description: 'Initial liquidity in USDC (default: 1)'
                },
                yes_odds_percent: {
                    type: 'number',
                    description: 'Starting YES odds as a percentage (default: 50)'
                },
                duration_days: {
                    type: 'number',
                    description: 'Market duration in days (default: 30)'
                }
            },
            required: ['question', 'settler_address']
        }
    },

    // ========== V3/P2P REDEMPTION TOOLS ==========
    {
        name: 'redeem_v3_position',
        description: 'Redeem winning tokens from a resolved V3 market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The resolved V3 market address'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'redeem_p2p_position',
        description: 'Redeem winning tokens from a resolved P2P market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The resolved P2P market address'
                }
            },
            required: ['market_address']
        }
    },
    {
        name: 'claim_p2p_refund',
        description: 'Claim creator refund from an unresolved/cancelled P2P market',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The P2P market address'
                }
            },
            required: ['market_address']
        }
    },

    // ========== BUY V3 TOKENS ==========
    {
        name: 'buy_v3_tokens',
        description: 'Buy YES or NO tokens on a V3 prediction market using USDC',
        input_schema: {
            type: 'object',
            properties: {
                market_address: {
                    type: 'string',
                    description: 'The V3 market address on Solana'
                },
                side: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    description: 'Which token to buy (yes or no)'
                },
                amount_usdc: {
                    type: 'number',
                    description: 'Amount of USDC to spend'
                }
            },
            required: ['market_address', 'side', 'amount_usdc']
        }
    },

    // ========== GLOBAL CONFIG ==========
    {
        name: 'get_pnp_config',
        description: 'Get PNP Exchange global configuration including program addresses and settings',
        input_schema: {
            type: 'object',
            properties: {}
        }
    }
];

// Tool implementations
export async function executeMarketTool(name, input) {
    const config = getConfig();

    switch (name) {
        case 'create_market': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.createMarket({
                question: input.question,
                durationDays: input.duration_days || 30,
                liquidity: BigInt(Math.floor((input.liquidity_usdc || 1) * 1_000_000)),
                marketType: input.type || 'amm'
            });

            return {
                success: true,
                market: result.market,
                signature: result.signature,
                question: input.question,
                duration_days: input.duration_days || 30,
                liquidity_usdc: input.liquidity_usdc || 1,
                type: input.type || 'amm',
                network: config.network
            };
        }

        case 'list_markets': {
            const store = createMarketStore();
            let markets = store.getAllMarkets();

            // Apply filters
            if (input.status && input.status !== 'all') {
                markets = markets.filter(m => m.status === input.status);
            }
            if (input.category) {
                markets = markets.filter(m => m.category === input.category);
            }

            // Apply limit
            const limit = input.limit || 10;
            markets = markets.slice(0, limit);

            return {
                markets,
                total: markets.length,
                filters: {
                    status: input.status || 'all',
                    category: input.category || 'all'
                }
            };
        }

        case 'get_market_info': {
            const agent = await createAgent({ verbose: false });
            const info = await agent.fetchMarketInfo(input.address);
            return info;
        }

        // ========== TRADING TOOLS ==========

        case 'buy_tokens': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.buyTokens({
                marketAddress: input.market_address,
                side: input.side,
                amountUsdc: input.amount_usdc
            });
            return result;
        }

        case 'sell_tokens': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.sellTokens({
                marketAddress: input.market_address,
                side: input.side,
                amount: input.amount
            });
            return result;
        }

        case 'get_market_prices': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getMarketPrices(input.market_address);
            return result;
        }

        case 'get_balances': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getBalances(input.market_address);
            return result;
        }

        // ========== REDEMPTION TOOLS ==========

        case 'redeem_position': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.redeemPosition(input.market_address);
            return result;
        }

        case 'claim_refund': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.claimRefund(input.market_address);
            return result;
        }

        // ========== URL-AWARE MARKET CREATION ==========

        case 'create_market_from_source': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.createMarketFromSource({
                question: input.question,
                sourceUrl: input.source_url,
                sourceType: input.source_type,
                durationDays: input.duration_days || 30,
                liquidity: BigInt(Math.floor((input.liquidity_usdc || 1) * 1_000_000))
            });
            return {
                ...result,
                duration_days: input.duration_days || 30,
                liquidity_usdc: input.liquidity_usdc || 1,
                network: config.network
            };
        }

        // ========== PNP ORACLE/SETTLEMENT TOOLS ==========

        case 'get_settlement_criteria': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.fetchSettlementCriteria(input.market_address);
            return result;
        }

        case 'get_settlement_data': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getSettlementData(input.market_address);
            return result;
        }

        case 'wait_for_settlement': {
            const agent = await createAgent({ verbose: false });
            const timeoutMs = (input.timeout_seconds || 30) * 1000;
            const result = await agent.waitForSettlementCriteria(input.market_address, {
                maxRetryTimeMs: timeoutMs
            });
            return result;
        }

        case 'settle_market': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.settleMarket(
                input.market_address,
                input.outcome === 'yes'
            );
            return result;
        }

        // ========== MARKET DISCOVERY TOOLS ==========

        case 'discover_all_markets': {
            const agent = await createAgent({ verbose: false });
            const version = input.version || 'all';

            if (version === 'v2') {
                const result = await agent.fetchAllMarketAddresses();
                return { ...result, version: 'v2' };
            } else if (version === 'v3') {
                const result = await agent.fetchV3MarketAddresses();
                return { ...result, version: 'v3' };
            } else {
                // Fetch both
                const [v2Result, v3Result] = await Promise.all([
                    agent.fetchAllMarketAddresses().catch(e => ({ addresses: [], error: e.message })),
                    agent.fetchV3MarketAddresses().catch(e => ({ addresses: [], error: e.message }))
                ]);
                return {
                    success: true,
                    v2_markets: v2Result.addresses || [],
                    v3_markets: v3Result.addresses || [],
                    total: (v2Result.addresses?.length || 0) + (v3Result.addresses?.length || 0)
                };
            }
        }

        case 'get_market_metadata': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getMarketMetadata(input.market_address);
            return result;
        }

        case 'get_v2_market_info': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getV2MarketInfo(input.market_address);
            return result;
        }

        case 'get_p2p_market_info': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.getP2PMarketInfo(input.market_address);
            return result;
        }

        // ========== P2P MARKET TOOLS WITH CUSTOM ODDS ==========

        case 'create_p2p_market_simple': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.createP2PMarketSimple({
                question: input.question,
                side: input.side || 'yes',
                amountUsdc: input.amount_usdc || 1,
                durationDays: input.duration_days || 30,
                capMultiplier: input.cap_multiplier || 5
            });
            return {
                ...result,
                network: config.network
            };
        }

        case 'create_p2p_market_with_odds': {
            const agent = await createAgent({ verbose: false });
            const oddsBps = Math.floor((input.odds_percent || 50) * 100);
            const result = await agent.createP2PMarketWithOdds({
                question: input.question,
                side: input.side,
                amount: BigInt(Math.floor((input.amount_usdc || 1) * 1_000_000)),
                durationDays: input.duration_days || 30,
                oddsBps
            });
            return {
                ...result,
                odds_percent: input.odds_percent,
                network: config.network
            };
        }

        case 'create_amm_market_with_odds': {
            const agent = await createAgent({ verbose: false });
            const yesOddsBps = Math.floor((input.yes_odds_percent || 50) * 100);
            const result = await agent.createAMMMarketWithOdds({
                question: input.question,
                liquidity: BigInt(Math.floor((input.liquidity_usdc || 1) * 1_000_000)),
                durationDays: input.duration_days || 30,
                yesOddsBps
            });
            return {
                ...result,
                yes_odds_percent: input.yes_odds_percent,
                liquidity_usdc: input.liquidity_usdc || 1,
                network: config.network
            };
        }

        // ========== CUSTOM ORACLE TOOLS ==========

        case 'create_market_with_oracle': {
            const agent = await createAgent({ verbose: false });
            const yesOddsBps = Math.floor((input.yes_odds_percent || 50) * 100);
            const result = await agent.createMarketWithCustomOracle({
                question: input.question,
                settlerAddress: input.settler_address,
                liquidity: BigInt(Math.floor((input.liquidity_usdc || 1) * 1_000_000)),
                durationDays: input.duration_days || 30,
                yesOddsBps
            });
            return {
                ...result,
                liquidity_usdc: input.liquidity_usdc || 1,
                network: config.network
            };
        }

        // ========== V3/P2P REDEMPTION TOOLS ==========

        case 'redeem_v3_position': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.redeemV3Position(input.market_address);
            return result;
        }

        case 'redeem_p2p_position': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.redeemP2PPosition(input.market_address);
            return result;
        }

        case 'claim_p2p_refund': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.claimP2PRefund(input.market_address);
            return result;
        }

        // ========== BUY V3 TOKENS ==========

        case 'buy_v3_tokens': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.buyV3Tokens({
                marketAddress: input.market_address,
                side: input.side,
                amountUsdc: input.amount_usdc
            });
            return result;
        }

        // ========== GLOBAL CONFIG ==========

        case 'get_pnp_config': {
            const agent = await createAgent({ verbose: false });
            const result = await agent.fetchGlobalConfig();
            return result;
        }

        default:
            return { error: `Unknown market tool: ${name}` };
    }
}

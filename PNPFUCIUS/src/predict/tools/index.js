// Tool registry and executor for PNPFUCIUS - The PNP Exchange CLI

import { marketToolDefinitions, executeMarketTool } from './market-tools.js';
import { analyticsToolDefinitions, executeAnalyticsTool } from './analytics-tools.js';

// Combine all tool definitions
export const tools = [
    ...marketToolDefinitions,
    ...analyticsToolDefinitions
];

// Tool name to executor mapping
const toolExecutors = {
    // Market tools
    create_market: executeMarketTool,
    list_markets: executeMarketTool,
    get_market_info: executeMarketTool,
    // Trading tools
    buy_tokens: executeMarketTool,
    sell_tokens: executeMarketTool,
    get_market_prices: executeMarketTool,
    get_balances: executeMarketTool,
    // Redemption tools
    redeem_position: executeMarketTool,
    claim_refund: executeMarketTool,
    // URL-aware market creation
    create_market_from_source: executeMarketTool,
    // PNP Oracle/Settlement tools
    get_settlement_criteria: executeMarketTool,
    get_settlement_data: executeMarketTool,
    wait_for_settlement: executeMarketTool,
    settle_market: executeMarketTool,
    // Market Discovery tools
    discover_all_markets: executeMarketTool,
    get_market_metadata: executeMarketTool,
    get_v2_market_info: executeMarketTool,
    get_p2p_market_info: executeMarketTool,
    // P2P Market tools with custom odds
    create_p2p_market_simple: executeMarketTool,
    create_p2p_market_with_odds: executeMarketTool,
    create_amm_market_with_odds: executeMarketTool,
    // Custom Oracle tools
    create_market_with_oracle: executeMarketTool,
    // V3/P2P Redemption tools
    redeem_v3_position: executeMarketTool,
    redeem_p2p_position: executeMarketTool,
    claim_p2p_refund: executeMarketTool,
    // V3 Trading tools
    buy_v3_tokens: executeMarketTool,
    // Global config
    get_pnp_config: executeMarketTool,
    // Analytics tools
    get_stats: executeAnalyticsTool,
    get_categories: executeAnalyticsTool
};

/**
 * Execute a tool by name with given input
 * @param {string} name - Tool name
 * @param {object} input - Tool input parameters
 * @returns {Promise<object>} Tool result
 */
export async function executeTool(name, input) {
    const executor = toolExecutors[name];

    if (!executor) {
        return {
            error: `Unknown tool: ${name}`,
            available_tools: Object.keys(toolExecutors)
        };
    }

    try {
        const startTime = Date.now();
        const result = await executor(name, input);
        const duration = Date.now() - startTime;

        return {
            ...result,
            _meta: {
                tool: name,
                duration_ms: duration
            }
        };
    } catch (error) {
        return {
            error: error.message,
            stack: process.env.DEBUG ? error.stack : undefined,
            tool: name
        };
    }
}

/**
 * Get tool definition by name
 * @param {string} name - Tool name
 * @returns {object|null} Tool definition
 */
export function getToolDefinition(name) {
    return tools.find(t => t.name === name) || null;
}

/**
 * List all available tools
 * @returns {string[]} Tool names
 */
export function listTools() {
    return tools.map(t => t.name);
}

/**
 * Get tools grouped by category
 * @returns {object} Tools by category
 */
export function getToolsByCategory() {
    return {
        market: marketToolDefinitions.map(t => t.name),
        analytics: analyticsToolDefinitions.map(t => t.name)
    };
}

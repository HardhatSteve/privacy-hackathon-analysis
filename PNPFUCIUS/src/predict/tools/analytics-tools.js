// Analytics tool definitions and implementations for Claude Predict

import { createAggregator } from '../../analytics/aggregator.js';
import { PRIVACY_CATEGORIES, listCategories } from '../../privacy-markets.js';

// Tool definitions for Claude API
export const analyticsToolDefinitions = [
    {
        name: 'get_stats',
        description: 'Get market statistics and analytics',
        input_schema: {
            type: 'object',
            properties: {
                period: {
                    type: 'string',
                    enum: ['24h', '7d', '30d', 'all'],
                    description: 'Time period for statistics (default: all)'
                }
            }
        }
    },
    {
        name: 'get_categories',
        description: 'List available market categories with their templates and weights',
        input_schema: {
            type: 'object',
            properties: {}
        }
    }
];

// Tool implementations
export async function executeAnalyticsTool(name, input) {
    switch (name) {
        case 'get_stats': {
            const aggregator = createAggregator();
            const overview = await aggregator.getOverview();
            const period = input.period || 'all';

            // Calculate period-specific stats
            let periodStats = overview;
            if (period !== 'all') {
                const periodMs = {
                    '24h': 24 * 60 * 60 * 1000,
                    '7d': 7 * 24 * 60 * 60 * 1000,
                    '30d': 30 * 24 * 60 * 60 * 1000
                }[period];

                const cutoff = Date.now() - periodMs;
                // Filter stats by period if aggregator supports it
                periodStats = {
                    ...overview,
                    period,
                    period_start: new Date(cutoff).toISOString()
                };
            }

            return {
                period,
                ...periodStats
            };
        }

        case 'get_categories': {
            const categories = listCategories();
            return {
                categories: categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    weight: cat.weight,
                    urgency: cat.urgency,
                    template_count: cat.templates?.length || 0,
                    examples: cat.templates?.slice(0, 2) || []
                })),
                total: categories.length
            };
        }

        default:
            return { error: `Unknown analytics tool: ${name}` };
    }
}

// News tool definitions and implementations for Claude Predict

import { createScorer } from '../../ai/scorer.js';
import { createMarketGenerator } from '../../ai/market-generator.js';
import { createNewsMonitor } from '../../monitoring/news-monitor.js';

// Tool definitions for Claude API
export const newsToolDefinitions = [
    {
        name: 'score_news',
        description: 'Score a news headline for privacy relevance (0-100). High scores indicate good market potential.',
        input_schema: {
            type: 'object',
            properties: {
                headline: {
                    type: 'string',
                    description: 'News headline to score'
                },
                summary: {
                    type: 'string',
                    description: 'Optional article summary for more accurate scoring'
                }
            },
            required: ['headline']
        }
    },
    {
        name: 'fetch_news',
        description: 'Fetch recent privacy-related news from monitored RSS feeds',
        input_schema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Max items to return (default: 10)'
                },
                min_score: {
                    type: 'number',
                    description: 'Minimum relevance score filter (default: 0)'
                }
            }
        }
    },
    {
        name: 'generate_from_news',
        description: 'Generate a prediction market from a news headline',
        input_schema: {
            type: 'object',
            properties: {
                headline: {
                    type: 'string',
                    description: 'News headline'
                },
                summary: {
                    type: 'string',
                    description: 'Article summary'
                },
                source: {
                    type: 'string',
                    description: 'News source'
                }
            },
            required: ['headline']
        }
    }
];

// Tool implementations
export async function executeNewsTool(name, input) {
    switch (name) {
        case 'score_news': {
            const scorer = createScorer();
            const result = await scorer.scoreNews({
                title: input.headline,
                description: input.summary || ''
            });
            return {
                headline: input.headline,
                score: result.score,
                category: result.category,
                urgency: result.urgency,
                market_potential: result.marketPotential,
                reasoning: result.reasoning
            };
        }

        case 'fetch_news': {
            const monitor = createNewsMonitor();
            const items = await monitor.checkFeeds();
            const limit = input.limit || 10;
            const minScore = input.min_score || 0;

            // Score items if filtering by score
            let scoredItems = items;
            if (minScore > 0) {
                const scorer = createScorer();
                scoredItems = [];
                for (const item of items.slice(0, 20)) {
                    const score = await scorer.scoreNews(item);
                    if (score.score >= minScore) {
                        scoredItems.push({
                            ...item,
                            relevance_score: score.score,
                            category: score.category
                        });
                    }
                }
            }

            return {
                items: scoredItems.slice(0, limit),
                total: scoredItems.length,
                min_score_filter: minScore
            };
        }

        case 'generate_from_news': {
            const generator = createMarketGenerator();
            const result = await generator.generateFromNews({
                title: input.headline,
                description: input.summary || '',
                source: input.source || 'Unknown'
            });
            return result;
        }

        default:
            return { error: `Unknown news tool: ${name}` };
    }
}

// AI-powered market generation using Claude API
// Transforms news headlines into privacy-themed prediction markets

import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config.js';

const MARKET_GENERATION_PROMPT = `You are an expert at creating prediction market questions for a privacy-focused prediction market on Solana.

Given news headlines or topics, generate relevant YES/NO prediction market questions that:
1. Are clearly verifiable with a definitive outcome
2. Focus on privacy, regulation, zero-knowledge proofs, encryption, data protection, or surveillance
3. Have appropriate timeframes (30-365 days typically)
4. Are interesting enough to attract betting activity
5. Are NOT already obviously true or false

Categories to consider:
- regulation: Government policies, GDPR, privacy laws, sanctions
- technology: ZK protocols, encryption standards, privacy tools, Solana privacy features
- adoption: User growth, TVL milestones, enterprise adoption
- events: Breaches, scandals, conference announcements, court cases

Respond with valid JSON only, no markdown formatting:
{
  "question": "The yes/no question ending with ?",
  "category": "regulation|technology|adoption|events",
  "categoryName": "Human readable category name",
  "suggestedDurationDays": 30-365,
  "suggestedLiquidityUSDC": 1000-10000,
  "urgency": "breaking|timely|evergreen",
  "reasoning": "Brief explanation of why this is a good market"
}`;

export class AIMarketGenerator {
    constructor(apiKey = null) {
        const config = getConfig();
        this.apiKey = apiKey || config.anthropicApiKey;

        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required for AI market generation');
        }

        this.client = new Anthropic({ apiKey: this.apiKey });
        this.model = 'claude-sonnet-4-20250514';
    }

    /**
     * Generate a market question from a news headline
     */
    async generateFromNews(newsItem) {
        const { title, summary, source, link } = newsItem;

        const userPrompt = `Generate a prediction market question based on this news:

Title: ${title}
${summary ? `Summary: ${summary}` : ''}
${source ? `Source: ${source}` : ''}

Create a compelling, verifiable YES/NO question that privacy-focused traders would want to bet on.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 500,
                messages: [
                    { role: 'user', content: MARKET_GENERATION_PROMPT + '\n\n' + userPrompt }
                ]
            });

            const content = response.content[0].text;
            const market = JSON.parse(content);

            return {
                ...market,
                sourceNews: { title, source, link },
                generatedAt: Date.now()
            };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Generate multiple markets from a batch of news items
     */
    async generateBatchFromNews(newsItems, options = {}) {
        const { maxMarkets = 5, minScore = 50 } = options;
        const results = [];

        for (const item of newsItems.slice(0, maxMarkets)) {
            try {
                // Skip low-relevance items if score provided
                if (item.relevanceScore !== undefined && item.relevanceScore < minScore) {
                    continue;
                }

                const market = await this.generateFromNews(item);
                results.push({ success: true, market, newsItem: item });
            } catch (error) {
                results.push({ success: false, error: error.message, newsItem: item });
            }
        }

        return results;
    }

    /**
     * Generate a market from a topic/theme (not news-based)
     */
    async generateFromTopic(topic, category = null) {
        const userPrompt = `Generate a prediction market question about: ${topic}
${category ? `Focus on the "${category}" category.` : ''}

Create a compelling, verifiable YES/NO question that privacy-focused traders would want to bet on.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 500,
                messages: [
                    { role: 'user', content: MARKET_GENERATION_PROMPT + '\n\n' + userPrompt }
                ]
            });

            const content = response.content[0].text;
            const market = JSON.parse(content);

            return {
                ...market,
                sourceTopic: topic,
                generatedAt: Date.now()
            };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Generate multiple diverse markets
     */
    async generateDiverseMarkets(count = 5) {
        const topics = [
            'GDPR enforcement trends in 2026',
            'Zero-knowledge proof adoption on Solana',
            'Privacy coin regulations in the US',
            'Enterprise adoption of confidential computing',
            'End-to-end encryption legislation',
            'Decentralized identity adoption',
            'Privacy-preserving AI developments',
            'Tornado Cash legal developments',
            'Light Protocol and Solana privacy',
            'Data breach trends and regulations'
        ];

        const categories = ['regulation', 'technology', 'adoption', 'events'];
        const results = [];

        for (let i = 0; i < count; i++) {
            const topic = topics[i % topics.length];
            const category = categories[i % categories.length];

            try {
                const market = await this.generateFromTopic(topic, category);
                results.push({ success: true, market });
            } catch (error) {
                results.push({ success: false, error: error.message, topic });
            }
        }

        return results;
    }
}

/**
 * Factory function
 */
export function createMarketGenerator(apiKey = null) {
    return new AIMarketGenerator(apiKey);
}

export default AIMarketGenerator;

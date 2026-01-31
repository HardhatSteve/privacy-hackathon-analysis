// AI-powered news relevance scoring using Claude API
// Scores incoming news items 0-100 on privacy relevance

import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config.js';

const SCORING_PROMPT = `You are an expert at evaluating news relevance for a privacy-focused prediction market on Solana.

Score news items from 0-100 based on their relevance to:
- Privacy regulations (GDPR, CCPA, federal privacy laws)
- Privacy technology (zero-knowledge proofs, encryption, confidential computing)
- Privacy tools (Tor, Signal, privacy coins, mixers like Tornado Cash)
- Data protection (breaches, surveillance, data rights)
- Blockchain privacy (Solana privacy features, Token-2022 confidential transfers)
- Crypto regulations affecting privacy (sanctions, KYC requirements)

Scoring guidelines:
- 90-100: Directly about privacy regulation/technology, major impact, breaking news
- 70-89: Strongly privacy-related, significant developments
- 50-69: Moderately relevant, tangential privacy implications
- 30-49: Loosely related, minor privacy angle
- 0-29: Not relevant or very weak connection

Also suggest if this news could generate an interesting prediction market.

Respond with valid JSON only, no markdown formatting:
{
  "score": 0-100,
  "category": "regulation"|"technology"|"adoption"|"events"|"none",
  "urgency": "breaking"|"timely"|"evergreen",
  "marketPotential": true/false,
  "reasoning": "Brief explanation of the score",
  "suggestedMarketAngle": "If marketPotential is true, a brief market idea"
}`;

export class AIScorer {
    constructor(apiKey = null) {
        const config = getConfig();
        this.apiKey = apiKey || config.anthropicApiKey;

        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required for AI scoring');
        }

        this.client = new Anthropic({ apiKey: this.apiKey });
        this.model = 'claude-haiku-4-20250514'; // Use Haiku for speed/cost on scoring
        this.cache = new Map(); // Simple cache for repeated items
    }

    /**
     * Score a single news item
     */
    async scoreNews(newsItem) {
        const { title, summary, source } = newsItem;

        // Check cache
        const cacheKey = title.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const userPrompt = `Score this news item for privacy relevance:

Title: ${title}
${summary ? `Summary: ${summary}` : ''}
${source ? `Source: ${source}` : ''}`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 300,
                messages: [
                    { role: 'user', content: SCORING_PROMPT + '\n\n' + userPrompt }
                ]
            });

            const content = response.content[0].text;
            const result = JSON.parse(content);

            const scored = {
                ...result,
                newsItem: { title, source },
                scoredAt: Date.now()
            };

            // Cache result
            this.cache.set(cacheKey, scored);

            return scored;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Score multiple news items in batch
     */
    async scoreBatch(newsItems) {
        const results = [];

        for (const item of newsItems) {
            try {
                const score = await this.scoreNews(item);
                results.push({ success: true, ...score });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    newsItem: item
                });
            }
        }

        return results;
    }

    /**
     * Filter news items by minimum score
     */
    async filterByRelevance(newsItems, minScore = 50) {
        const scored = await this.scoreBatch(newsItems);

        return scored
            .filter(r => r.success && r.score >= minScore)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Get high-potential market candidates from news
     */
    async findMarketCandidates(newsItems, options = {}) {
        const { minScore = 60 } = options;
        const scored = await this.scoreBatch(newsItems);

        return scored
            .filter(r => r.success && r.marketPotential && r.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .map(r => ({
                title: r.newsItem.title,
                source: r.newsItem.source,
                score: r.score,
                category: r.category,
                urgency: r.urgency,
                marketAngle: r.suggestedMarketAngle
            }));
    }

    /**
     * Clear the score cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

/**
 * Factory function
 */
export function createScorer(apiKey = null) {
    return new AIScorer(apiKey);
}

/**
 * Quick scoring function for single items
 */
export async function quickScore(newsItem, apiKey = null) {
    const scorer = new AIScorer(apiKey);
    return scorer.scoreNews(newsItem);
}

export default AIScorer;

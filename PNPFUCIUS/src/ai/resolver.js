// AI-powered market resolution helper using Claude API
// Analyzes whether market conditions have been met

import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config.js';

const RESOLUTION_PROMPT = `You are an expert at determining whether prediction market conditions have been met.

Given a prediction market question and the current date, analyze whether:
1. The condition can be definitively resolved (enough time has passed, event occurred, etc.)
2. If resolvable, whether the outcome is YES or NO
3. Your confidence level in the assessment

Consider:
- Time-bound conditions (has the deadline passed?)
- Verifiable events (did the specific event occur?)
- Measurable thresholds (was the metric achieved?)

Be conservative - if uncertain, indicate the market cannot be resolved yet.

Respond with valid JSON only, no markdown formatting:
{
  "canResolve": true/false,
  "outcome": "yes"|"no"|"unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of your assessment",
  "sources": ["Any sources or facts you're basing this on"],
  "suggestedAction": "resolve_yes"|"resolve_no"|"wait"|"needs_oracle"
}`;

export class AIResolver {
    constructor(apiKey = null) {
        const config = getConfig();
        this.apiKey = apiKey || config.anthropicApiKey;

        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required for AI resolution');
        }

        this.client = new Anthropic({ apiKey: this.apiKey });
        this.model = 'claude-sonnet-4-20250514';
    }

    /**
     * Analyze if a market can be resolved
     */
    async analyzeResolution(market) {
        const { question, creationTime, endTime, durationDays } = market;
        const now = new Date();
        const createdAt = new Date(creationTime);
        const endsAt = endTime ? new Date(endTime) : null;

        const userPrompt = `Analyze this prediction market for resolution:

Question: ${question}

Market Details:
- Created: ${createdAt.toISOString().split('T')[0]}
- Duration: ${durationDays} days
${endsAt ? `- End Date: ${endsAt.toISOString().split('T')[0]}` : ''}
- Current Date: ${now.toISOString().split('T')[0]}

Has enough time passed? Has the condition been met or definitively failed?
Use your knowledge cutoff to assess current events and facts.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 800,
                messages: [
                    { role: 'user', content: RESOLUTION_PROMPT + '\n\n' + userPrompt }
                ]
            });

            const content = response.content[0].text;
            const analysis = JSON.parse(content);

            return {
                ...analysis,
                marketAddress: market.address,
                analyzedAt: Date.now()
            };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Batch analyze multiple markets for resolution
     */
    async analyzeMarkets(markets) {
        const results = [];

        for (const market of markets) {
            try {
                const analysis = await this.analyzeResolution(market);
                results.push({
                    success: true,
                    market,
                    analysis
                });
            } catch (error) {
                results.push({
                    success: false,
                    market,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Get markets that are ready to resolve
     */
    async findResolvableMarkets(markets, options = {}) {
        const { minConfidence = 0.8 } = options;
        const analyses = await this.analyzeMarkets(markets);

        return analyses
            .filter(r => r.success && r.analysis.canResolve && r.analysis.confidence >= minConfidence)
            .map(r => ({
                market: r.market,
                outcome: r.analysis.outcome,
                confidence: r.analysis.confidence,
                reasoning: r.analysis.reasoning,
                suggestedAction: r.analysis.suggestedAction
            }));
    }

    /**
     * Generate a resolution report for a market
     */
    async generateResolutionReport(market) {
        const analysis = await this.analyzeResolution(market);

        return {
            market: {
                address: market.address,
                question: market.question,
                category: market.category
            },
            resolution: {
                canResolve: analysis.canResolve,
                outcome: analysis.outcome,
                confidence: analysis.confidence,
                suggestedAction: analysis.suggestedAction
            },
            details: {
                reasoning: analysis.reasoning,
                sources: analysis.sources
            },
            meta: {
                analyzedAt: new Date().toISOString(),
                model: this.model
            }
        };
    }
}

/**
 * Factory function
 */
export function createResolver(apiKey = null) {
    return new AIResolver(apiKey);
}

export default AIResolver;

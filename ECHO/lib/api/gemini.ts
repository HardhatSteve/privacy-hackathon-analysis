/**
 * Gemini AI Client
 * Generate plain-language privacy summaries and explanations
 * Using Gemini 2.5 Flash model with Google GenAI SDK
 */

import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PrivacySummary {
  summary: string;
  keyRisks: string[];
  recommendations: string[];
  privacyScore: number;
}

/**
 * Generate privacy summary for a wallet
 */
export async function generatePrivacySummary(walletData: {
  address: string;
  transactionCount: number;
  uniqueInteractions: number;
  risks: Array<{ title: string; severity: string }>;
  temporalPatterns?: { hasPatterns: boolean; commonHours: number[] };
  rangeRiskScore?: number;
}): Promise<PrivacySummary> {
  // Pre-calculate the privacy score so Gemini can reference it
  const calculatedScore = calculatePrivacyScore(walletData);
  const privacyLevel = calculatedScore > 75 ? "STRONG" : calculatedScore > 50 ? "MODERATE" : "WEAK";
  
  try {
    const prompt = `
You are a blockchain privacy expert. Analyze this Solana wallet's privacy:

**Wallet:** ${walletData.address}
**Transactions:** ${walletData.transactionCount}
**Unique Addresses Interacted With:** ${walletData.uniqueInteractions}
**Detected Risks:** ${walletData.risks.map((r) => `${r.severity} - ${r.title}`).join(", ") || "None detected"}
**Calculated Privacy Score:** ${calculatedScore}/100 (${privacyLevel})
${walletData.temporalPatterns?.hasPatterns ? `**Temporal Patterns:** Transactions clustered at hours ${walletData.temporalPatterns.commonHours.join(", ")}` : ""}
${walletData.rangeRiskScore ? `**External Risk Score:** ${walletData.rangeRiskScore}/100` : ""}

IMPORTANT: The privacy score is ${calculatedScore}/100 which means privacy is ${privacyLevel}. Your summary MUST reflect this score accurately.
- Score > 75 = Strong privacy
- Score 50-75 = Moderate privacy  
- Score < 50 = Weak privacy

Provide:
1. A 2-3 sentence plain-language summary of the wallet's privacy status
2. Top 3 privacy risks (bullet points)
3. Top 3 recommendations to improve privacy (bullet points)

Format your response as JSON:
{
  "summary": "...",
  "keyRisks": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."]
}
`;

    // Force JSON response to prevent markdown/commentary (new @google/genai SDK)
    let response;
    try {
      response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (apiError) {
      console.error("⚠️ Gemini API call failed:", apiError);
      return generateFallbackSummary(walletData);
    }
    
    // Safely extract text - don't trust response.text (can throw JSON.parse errors internally)
    let text = "";
    try {
      // Try candidates first (most reliable)
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      // Fallback to response.text if available (wrap in try-catch as it may parse internally)
      if (!text) {
        try {
          text = response?.text || "";
        } catch {
          // response.text getter can throw
          text = "";
        }
      }
    } catch (extractError) {
      console.warn("⚠️ Failed to extract text from Gemini response:", extractError);
    }

    console.log("🤖 Gemini raw response:", text ? text.substring(0, 300) + "..." : "EMPTY");
    
    if (!text || text.trim() === "") {
      console.warn("⚠️ Gemini returned empty response, using fallback");
      return generateFallbackSummary(walletData);
    }

    // Safely extract JSON boundaries - find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      console.warn("⚠️ No valid JSON boundaries found in response:", text.substring(0, 200));
      return generateFallbackSummary(walletData);
    }
    
    const jsonText = text.substring(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn("⚠️ Failed to parse Gemini JSON:", parseError, "JSON snippet:", jsonText.substring(0, 100));
      return generateFallbackSummary(walletData);
    }

    // Validate parsed fields - ensure arrays exist
    const keyRisks = Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [];
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

    return {
      summary: parsed.summary || "Privacy analysis complete.",
      keyRisks,
      recommendations,
      privacyScore: calculatePrivacyScore(walletData),
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return generateFallbackSummary(walletData);
  }
}

/**
 * Calculate privacy score from wallet data
 */
function calculatePrivacyScore(walletData: {
  transactionCount: number;
  uniqueInteractions: number;
  risks: Array<{ severity: string }>;
  rangeRiskScore?: number;
}): number {
  let score = 100;

  const criticalRisks = walletData.risks.filter((r) => r.severity === "critical").length;
  const highRisks = walletData.risks.filter((r) => r.severity === "high").length;
  const mediumRisks = walletData.risks.filter((r) => r.severity === "medium").length;

  score -= criticalRisks * 20;
  score -= highRisks * 10;
  score -= mediumRisks * 5;

  if (walletData.uniqueInteractions > 50) score -= 10;
  if (walletData.uniqueInteractions > 100) score -= 10;

  if (walletData.rangeRiskScore) {
    score -= walletData.rangeRiskScore * 0.3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fallback summary if Gemini fails
 */
function generateFallbackSummary(walletData: {
  transactionCount: number;
  uniqueInteractions: number;
  risks: Array<{ title: string; severity: string }>;
}): PrivacySummary {
  const score = calculatePrivacyScore(walletData);

  let summary = `This wallet has made ${walletData.transactionCount} transactions with ${walletData.uniqueInteractions} unique addresses.`;

  if (score > 75) {
    summary += " Privacy appears strong with minimal exposure.";
  } else if (score > 50) {
    summary += " Privacy is moderate with some identifiable patterns.";
  } else {
    summary += " Privacy is weak with significant deanonymization risks.";
  }

  const keyRisks = walletData.risks.slice(0, 3).map((r) => r.title);
  const recommendations = [
    "Use privacy-preserving protocols for future transfers",
    "Avoid transacting with KYC exchanges directly",
    "Randomize transaction timing to reduce temporal correlation",
  ];

  return { summary, keyRisks, recommendations, privacyScore: score };
}

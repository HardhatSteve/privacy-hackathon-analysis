/**
 * Range API Client
 * Privacy risk assessment, sanctions checks, and payment risk analysis
 * https://api.range.org/v1
 */

const RANGE_API_URL = "https://api.range.org/v1";
const RANGE_API_KEY = process.env.RANGE_API_KEY;

export interface RangeRiskScore {
  address: string;
  riskScore: number; // 0-10 scale from Range API
  riskLevel: string;
  numHops: number;
  maliciousAddressesFound: Array<{
    address: string;
    distance: number;
    name_tag: string;
    entity: string;
    category: string;
  }>;
  reasoning: string;
  attribution: {
    name_tag: string;
    entity: string;
    category: string;
    address_role: string;
  } | null;
}

export interface TokenRiskAssessment {
  mint: string;
  riskScore: number;
  riskLevel: string;
  riskPercentage: number;
  tokenInfo: {
    name: string;
    symbol: string;
  };
  summary: {
    totalFactors: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
}

export interface PaymentRisk {
  from: string;
  to: string;
  amount: number;
  overallRiskLevel: string;
  riskFactors: Array<{
    riskContext: string;
    factor: string;
    riskLevel: string;
    description: string;
  }>;
}

export interface SanctionsCheck {
  address: string;
  isTokenBlacklisted: boolean;
  isOfacSanctioned: boolean;
  checkedAt: string;
  attribution: {
    name: string;
    category: string;
    role: string;
    malicious: boolean;
  } | null;
}

/**
 * Get address risk score using Range API
 * Endpoint: GET /risk/address?network=solana&address={address}
 */
// Simple in-memory cache to avoid hitting rate limits
const riskCache = new Map<string, { data: RangeRiskScore; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export async function getAddressRiskScore(
  address: string
): Promise<RangeRiskScore> {
  // Check cache first
  const cached = riskCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Using cached risk score for ${address.slice(0, 8)}...`);
    return cached.data;
  }

  try {
    const response = await fetch(
      `${RANGE_API_URL}/risk/address?network=solana&address=${address}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RANGE_API_KEY}`,
        },
      }
    );

    // Handle rate limiting (429) gracefully
    if (response.status === 429) {
      console.warn(`⚠️ Range API rate limited for ${address.slice(0, 8)}...`);
      return {
        address,
        riskScore: 0,
        riskLevel: "UNKNOWN",
        numHops: 0,
        maliciousAddressesFound: [],
        reasoning: "Rate limited - try again later",
        attribution: null,
      };
    }

    if (!response.ok) {
      throw new Error(`Range API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Range API response for ${address.slice(0, 8)}:`, data);

    const result: RangeRiskScore = {
      address,
      riskScore: data.riskScore || 0,
      riskLevel: data.riskLevel || "LOW",
      numHops: data.numHops || 0,
      maliciousAddressesFound: data.maliciousAddressesFound || [],
      reasoning: data.reasoning || "",
      attribution: data.attribution || null,
    };

    // Cache the result
    riskCache.set(address, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Range address risk error:", error);
    // Return safe defaults if API fails
    return {
      address,
      riskScore: 0,
      riskLevel: "UNKNOWN",
      numHops: 0,
      maliciousAddressesFound: [],
      reasoning: "Unable to assess risk - API unavailable",
      attribution: null,
    };
  }
}

/**
 * Assess token risk using Range API
 * Endpoint: GET /risk/token?address={tokenMint}
 */
export async function assessTokenRisk(
  mint: string
): Promise<TokenRiskAssessment> {
  try {
    const response = await fetch(
      `${RANGE_API_URL}/risk/token?address=${mint}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RANGE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Range token API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      mint,
      riskScore: data.overall_assessment?.risk_score || 0,
      riskLevel: data.overall_assessment?.risk_level || "UNKNOWN",
      riskPercentage: data.overall_assessment?.risk_percentage || 0,
      tokenInfo: {
        name: data.token_info?.name || "Unknown Token",
        symbol: data.token_info?.symbol || "???",
      },
      summary: {
        totalFactors: data.summary?.total_factors || 0,
        highRiskCount: data.summary?.high_risk_count || 0,
        mediumRiskCount: data.summary?.medium_risk_count || 0,
        lowRiskCount: data.summary?.low_risk_count || 0,
      },
    };
  } catch (error) {
    console.error("Range token risk error:", error);
    return {
      mint,
      riskScore: 0,
      riskLevel: "UNKNOWN",
      riskPercentage: 0,
      tokenInfo: { name: "Unknown", symbol: "???" },
      summary: { totalFactors: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 },
    };
  }
}

/**
 * Assess payment risk between two addresses using Range API
 * Endpoint: GET /risk/payment?sender_address={from}&recipient_address={to}&amount={amount}&sender_network=solana&recipient_network=solana
 */
export async function assessPaymentRisk(
  from: string,
  to: string,
  amount: number
): Promise<PaymentRisk> {
  try {
    const params = new URLSearchParams({
      sender_address: from,
      recipient_address: to,
      amount: amount.toString(),
      sender_network: "solana",
      recipient_network: "solana",
    });

    const response = await fetch(
      `${RANGE_API_URL}/risk/payment?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RANGE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Range payment API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      from,
      to,
      amount,
      overallRiskLevel: data.overall_risk_level || "unknown",
      riskFactors: (data.risk_factors || []).map((f: any) => ({
        riskContext: f.risk_context || "",
        factor: f.factor || "",
        riskLevel: f.risk_level || "low",
        description: f.description || "",
      })),
    };
  } catch (error) {
    console.error("Range payment risk error:", error);
    return {
      from,
      to,
      amount,
      overallRiskLevel: "unknown",
      riskFactors: [],
    };
  }
}

/**
 * Check sanctions and blacklists using Range API
 * Endpoint: GET /risk/sanctions/{address}?include_details=true
 */
// Cache for sanctions checks
const sanctionsCache = new Map<string, { data: SanctionsCheck; timestamp: number }>();

export async function checkSanctions(address: string): Promise<SanctionsCheck> {
  // Check cache first
  const cached = sanctionsCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Using cached sanctions check for ${address.slice(0, 8)}...`);
    return cached.data;
  }

  try {
    const response = await fetch(
      `${RANGE_API_URL}/risk/sanctions/${address}?include_details=true`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RANGE_API_KEY}`,
        },
      }
    );

    // Handle rate limiting
    if (response.status === 429) {
      console.warn(`⚠️ Range sanctions API rate limited for ${address.slice(0, 8)}...`);
      return {
        address,
        isTokenBlacklisted: false,
        isOfacSanctioned: false,
        checkedAt: new Date().toISOString(),
        attribution: null,
      };
    }

    if (!response.ok) {
      throw new Error(`Range sanctions API error: ${response.status}`);
    }

    const data = await response.json();

    const result: SanctionsCheck = {
      address,
      isTokenBlacklisted: data.is_token_blacklisted || false,
      isOfacSanctioned: data.is_ofac_sanctioned || false,
      checkedAt: data.checked_at || new Date().toISOString(),
      attribution: data.attribution ? {
        name: data.attribution.name || "",
        category: data.attribution.category || "",
        role: data.attribution.role || "",
        malicious: data.attribution.malicious || false,
      } : null,
    };

    // Cache the result
    sanctionsCache.set(address, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Range sanctions error:", error);
    return {
      address,
      isTokenBlacklisted: false,
      isOfacSanctioned: false,
      checkedAt: new Date().toISOString(),
      attribution: null,
    };
  }
}

/**
 * Helper: Convert Range risk level to our internal format
 */
export function normalizeRiskLevel(
  rangeLevel: string
): "low" | "medium" | "high" | "critical" {
  const level = rangeLevel.toUpperCase();
  if (level.includes("CRITICAL") || level.includes("SEVERE")) return "critical";
  if (level.includes("HIGH")) return "high";
  if (level.includes("MEDIUM") || level.includes("MODERATE")) return "medium";
  return "low";
}

/**
 * Helper: Convert Range risk score (0-10) to percentage (0-100)
 */
export function normalizeRiskScore(score: number): number {
  return Math.min(100, Math.max(0, score * 10));
}
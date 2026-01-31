import type { ScreeningResult, RiskAssessment, KYCLevel } from "@/types";
import { KYC_LEVELS } from "@/types";

interface RangeConfig {
  apiKey: string;
  environment: "sandbox" | "production";
  baseUrl?: string;
}

interface TransactionParams {
  sender: string;
  recipient: string;
  amount: number;
  currency: string;
}

interface ComplianceCheckResult {
  allowed: boolean;
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
  requiresReview: boolean;
  reason?: string;
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}

export class RangeComplianceService {
  private config: RangeConfig;
  private baseUrl: string;

  constructor(config: RangeConfig) {
    this.config = config;
    this.baseUrl =
      config.baseUrl ||
      (config.environment === "production"
        ? "https://api.range.io"
        : "https://sandbox-api.range.io");
  }

  async screenAddress(address: string): Promise<ScreeningResult> {
    // In production, this would call Range Protocol API
    // For now, simulate screening

    // Simple heuristic checks (in production, use actual API)
    const isKnownBadAddress = this.checkKnownBadAddresses(address);

    if (isKnownBadAddress) {
      return {
        address,
        riskLevel: "high",
        flags: ["Sanctioned address"],
        sanctioned: true,
        allowed: false,
        reason: "Address is on sanctions list",
      };
    }

    // Default: allow with low risk
    return {
      address,
      riskLevel: "low",
      flags: [],
      sanctioned: false,
      allowed: true,
    };
  }

  async assessTransactionRisk(params: TransactionParams): Promise<RiskAssessment> {
    // Assess transaction risk based on various factors
    const factors: string[] = [];
    let riskScore = 0;

    // Check amount thresholds
    if (params.amount > 10000) {
      factors.push("High value transaction");
      riskScore += 30;
    } else if (params.amount > 1000) {
      factors.push("Medium value transaction");
      riskScore += 10;
    }

    // Screen addresses
    const [senderResult, recipientResult] = await Promise.all([
      this.screenAddress(params.sender),
      this.screenAddress(params.recipient),
    ]);

    if (senderResult.riskLevel !== "low") {
      factors.push(`Sender: ${senderResult.riskLevel} risk`);
      riskScore += senderResult.riskLevel === "high" ? 50 : 20;
    }

    if (recipientResult.riskLevel !== "low") {
      factors.push(`Recipient: ${recipientResult.riskLevel} risk`);
      riskScore += recipientResult.riskLevel === "high" ? 50 : 20;
    }

    // Determine risk level and recommendation
    let level: "low" | "medium" | "high";
    let recommendation: "approve" | "review" | "reject";

    if (riskScore >= 50) {
      level = "high";
      recommendation = "reject";
    } else if (riskScore >= 25) {
      level = "medium";
      recommendation = "review";
    } else {
      level = "low";
      recommendation = "approve";
    }

    return {
      score: Math.min(riskScore, 100),
      level,
      factors,
      recommendation,
    };
  }

  async preTransactionCheck(params: TransactionParams): Promise<ComplianceCheckResult> {
    // Screen both addresses
    const [senderCheck, recipientCheck] = await Promise.all([
      this.screenAddress(params.sender),
      this.screenAddress(params.recipient),
    ]);

    // If either is sanctioned, block
    if (senderCheck.sanctioned || recipientCheck.sanctioned) {
      return {
        allowed: false,
        riskLevel: "high",
        warnings: [...senderCheck.flags, ...recipientCheck.flags],
        requiresReview: false,
        reason: "Transaction involves sanctioned address",
      };
    }

    // Assess transaction risk
    const riskAssessment = await this.assessTransactionRisk(params);

    return {
      allowed: riskAssessment.recommendation !== "reject",
      riskLevel: riskAssessment.level,
      warnings: riskAssessment.factors,
      requiresReview: riskAssessment.recommendation === "review",
    };
  }

  checkTransactionLimit(
    kycLevel: number,
    amount: number,
    dailyTotal: number,
    monthlyTotal: number
  ): LimitCheckResult {
    const limits = KYC_LEVELS[kycLevel]?.limits;
    if (!limits) {
      return {
        allowed: false,
        reason: "Invalid KYC level",
      };
    }

    // Check single transaction limit
    if (amount > limits.singleTransactionLimit) {
      return {
        allowed: false,
        reason: "Single transaction limit exceeded",
        limit: limits.singleTransactionLimit,
        current: amount,
      };
    }

    // Check daily limit
    if (dailyTotal + amount > limits.dailyLimit) {
      return {
        allowed: false,
        reason: "Daily limit exceeded",
        limit: limits.dailyLimit,
        current: dailyTotal,
      };
    }

    // Check monthly limit
    if (monthlyTotal + amount > limits.monthlyLimit) {
      return {
        allowed: false,
        reason: "Monthly limit exceeded",
        limit: limits.monthlyLimit,
        current: monthlyTotal,
      };
    }

    return { allowed: true };
  }

  getKYCLevelInfo(level: number): KYCLevel | undefined {
    return KYC_LEVELS[level];
  }

  getNextKYCLevel(currentLevel: number): KYCLevel | undefined {
    if (currentLevel >= KYC_LEVELS.length - 1) {
      return undefined; // Already at max level
    }
    return KYC_LEVELS[currentLevel + 1];
  }

  private checkKnownBadAddresses(address: string): boolean {
    // In production, this would check against OFAC, UN, and other sanctions lists
    // For development, we use a small sample list

    const knownBadAddresses = new Set([
      // These are example addresses - not real sanctioned addresses
      "11111111111111111111111111111111",
    ]);

    return knownBadAddresses.has(address);
  }
}

// Singleton instance
let rangeServiceInstance: RangeComplianceService | null = null;

export function getRangeService(): RangeComplianceService {
  if (!rangeServiceInstance) {
    rangeServiceInstance = new RangeComplianceService({
      apiKey: process.env.RANGE_API_KEY || "",
      environment:
        (process.env.RANGE_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    });
  }
  return rangeServiceInstance;
}

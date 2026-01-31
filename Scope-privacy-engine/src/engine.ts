/**
 * Privacy Engine - Main Analysis Engine
 * Orchestrates all detectors and generates comprehensive privacy reports
 */

import * as dotenv from "dotenv";
import { HeliusService } from "./services/helius";
import type { ParsedTransaction } from "./services/helius";
import { checkRisk, checkInteractingAddresses } from "./services/range";
import type { RangeCheckResult } from "./services/range";
import {
  detectCEXTransactions,
  generateCEXWarnings,
  generateCEXActions,
} from "./detectors/cex";
import type { CEXDetectionResult } from "./detectors/cex";
import {
  detectClustering,
  detectWashTrading,
  generateClusteringWarnings,
  generateClusteringActions,
} from "./detectors/clustering";
import type { ClusteringResult } from "./detectors/clustering";
import {
  detectIdentityAssets,
  generateAssetWarnings,
  generateAssetActions,
} from "./detectors/assets";
import type { AssetsDetectionResult } from "./detectors/assets";
import {
  RiskLevel,
  SCORE_THRESHOLDS,
  RECOMMENDED_TOOLS,
  ANALYSIS_CONFIG,
} from "./utils/constants";

// Load environment variables
dotenv.config();


export interface PrivacyReport {
  // Basic info
  walletAddress: string;
  analyzedAt: Date;
  balance: number; // SOL balance fetched via QuickNode
  transactionsAnalyzed: number;

  // Main score
  score: number; // 0-100
  riskLevel: RiskLevel;
  riskDescription: string;

  // Detailed findings
  warnings: Warning[];
  actions: Recommendation[];

  // Detector results
  detectorResults: {
    cex: CEXDetectionResult;
    clustering: ClusteringResult;
    assets: AssetsDetectionResult;
    compliance: RangeCheckResult;
    interactingAddressRisks: {
      sanctionedAddresses: string[];
      flaggedAddresses: string[];
      totalChecked: number;
    };
  };

  // Metadata
  analysisMetadata: {
    heliusEnabled: boolean;
    apiLimitReached: boolean;
    analysisTimeMs: number;
  };

  // Financial exposure
  financialExposure: {
    exposedSol: number;
    exposedUsd: number;
    cexVolumeSol: number;
  };
}

export interface Warning {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  message: string;
}

export interface Recommendation {
  priority: "low" | "medium" | "high";
  category: string;
  action: string;
  tool?: string | undefined;
  toolUrl?: string | undefined;
}


/**
 * Analyze a Solana wallet for privacy risks
 * @param address - Solana wallet address to analyze
 * @returns Comprehensive privacy report
 */
export async function analyzeWallet(address: string): Promise<PrivacyReport> {
  const startTime = Date.now();
  console.log("\n" + "=".repeat(60));
  console.log(`🔍 PRIVACY ANALYSIS: ${address}`);
  console.log("=".repeat(60) + "\n");

  try {
    // Validate address
    if (!isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    // Initialize services
    const heliusService = new HeliusService();
    const heliusEnabled = heliusService.isReady();

    // Step 1: Fetch transaction history
    console.log("📡 Step 1: Fetching transaction history...");
    let transactions: ParsedTransaction[] = [];
    
    if (heliusEnabled) {
      transactions = await heliusService.getHistory(
        address,
        ANALYSIS_CONFIG.MAX_TRANSACTIONS_TO_ANALYZE
      );
    } else {
      console.log("⚠️  Helius API not available, using mock data for demo");
      transactions = generateMockTransactions(address);
    }

    console.log(`   Retrieved ${transactions.length} transactions\n`);

    // Step 1.5: Fetch real balance via QuickNode
    console.log("💰 Step 1.5: Fetching real balance via QuickNode...");
    const realBalance = await heliusService.getBalance(address);
    console.log(`💰 Step 1.5: Fetched Real Balance via QuickNode: ${realBalance.toFixed(4)} SOL\n`);

    // Step 2: Run compliance check on the wallet itself
    console.log("🔒 Step 2: Running compliance check...");
    const complianceResult = await checkRisk(address);
    console.log(`   Wallet status: ${complianceResult.status}\n`);

    // Step 3: Run CEX detector
    console.log("🏦 Step 3: Detecting CEX activity...");
    const cexResult = detectCEXTransactions(transactions, address);
    console.log("");

    // Step 4: Run clustering detector
    console.log("🔗 Step 4: Analyzing transaction patterns...");
    const clusteringResult = detectClustering(transactions, address);
    const washTradingResult = detectWashTrading(transactions, address);
    console.log("");

    // Step 5: Run assets detector
    console.log("🖼️  Step 5: Checking identity-revealing assets...");
    const assetsResult = detectIdentityAssets(transactions, address);
    console.log("");

    // Step 6: Check interacting addresses for risks
    console.log("👥 Step 6: Checking interacting addresses...");
    const interactingAddresses = heliusService.getInteractingAddresses(
      transactions,
      address
    );
    const addressRisks = await checkInteractingAddresses(interactingAddresses);
    console.log(`   Checked ${addressRisks.totalChecked} addresses`);
    if (addressRisks.sanctionedAddresses.length > 0) {
      console.log(`   ⚠️  Found ${addressRisks.sanctionedAddresses.length} sanctioned!`);
    }
    console.log("");

    // Step 7: Calculate final score
    console.log("📊 Step 7: Calculating privacy score...");
    const { score, deductions } = calculatePrivacyScore({
      cexResult,
      clusteringResult,
      assetsResult,
      complianceResult,
      addressRisks,
      washTradingDetected: washTradingResult.detected,
    });
    console.log(`   Final Score: ${score}/100`);
    console.log("");

    // Step 8: Determine risk level
    const riskLevel = determineRiskLevel(score);
    const riskDescription = getRiskDescription(riskLevel);

    // Step 9: Collect warnings
    const warnings = collectWarnings({
      cexResult,
      clusteringResult,
      assetsResult,
      complianceResult,
      addressRisks,
    });

    // Step 10: Generate recommendations
    const actions = generateRecommendations({
      cexResult,
      clusteringResult,
      assetsResult,
      complianceResult,
      score,
    });

    const analysisTimeMs = Date.now() - startTime;

    // Calculate financial exposure from CEX transactions
    const SOL_PRICE_USD = 150; // Fixed rate for simplicity
    const cexVolumeSol = [
      ...cexResult.deposits.map(d => d.amount || 0),
      ...cexResult.withdrawals.map(w => w.amount || 0),
    ].reduce((sum, amount) => sum + amount, 0);
    
    // If wallet is burned, all balance is exposed - take max of CEX volume and actual balance
    const exposedSol = Math.max(cexVolumeSol, realBalance);
    const exposedUsd = exposedSol * SOL_PRICE_USD;

    const report: PrivacyReport = {
      walletAddress: address,
      analyzedAt: new Date(),
      balance: realBalance,
      transactionsAnalyzed: transactions.length,
      score,
      riskLevel,
      riskDescription,
      warnings,
      actions,
      detectorResults: {
        cex: cexResult,
        clustering: clusteringResult,
        assets: assetsResult,
        compliance: complianceResult,
        interactingAddressRisks: addressRisks,
      },
      analysisMetadata: {
        heliusEnabled,
        apiLimitReached: false,
        analysisTimeMs,
      },
      financialExposure: {
        exposedSol,
        exposedUsd,
        cexVolumeSol,
      },
    };

    console.log("\n" + "=".repeat(60));
    console.log("✅ ANALYSIS COMPLETE");
    console.log("=".repeat(60) + "\n");

    return report;
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    
    // Return error report
    return {
      walletAddress: address,
      analyzedAt: new Date(),
      balance: 0,
      transactionsAnalyzed: 0,
      score: 0,
      riskLevel: RiskLevel.CRITICAL,
      riskDescription: "Analysis failed - unable to assess privacy risk",
      warnings: [
        {
          severity: "critical",
          category: "error",
          message: `Analysis error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      actions: [],
      detectorResults: {
        cex: { detected: false, deposits: [], withdrawals: [], totalCEXTransactions: 0, exchangesInvolved: [], riskContribution: 0 },
        clustering: { detected: false, clusteringPercentage: 0, topAddresses: [], dominantAddress: null, totalUniqueAddresses: 0, totalTransactions: 0, riskContribution: 0, pattern: "none" },
        assets: { detected: false, nftsDetected: [], solDomainsDetected: [], poapsDetected: [], identityExposureLevel: "none", riskContribution: 0 },
        compliance: { address, status: "Unknown", riskScore: 0, checkedAt: new Date(), details: { sanctionLists: [], flags: [], linkedToMixer: false, linkedToExploit: false } },
        interactingAddressRisks: { sanctionedAddresses: [], flaggedAddresses: [], totalChecked: 0 },
      },
      analysisMetadata: {
        heliusEnabled: false,
        apiLimitReached: false,
        analysisTimeMs: Date.now() - startTime,
      },
      financialExposure: {
        exposedSol: 0,
        exposedUsd: 0,
        cexVolumeSol: 0,
      },
    };
  }
}


interface ScoreInput {
  cexResult: CEXDetectionResult;
  clusteringResult: ClusteringResult;
  assetsResult: AssetsDetectionResult;
  complianceResult: RangeCheckResult;
  addressRisks: { sanctionedAddresses: string[]; flaggedAddresses: string[] };
  washTradingDetected: boolean;
}

interface ScoreOutput {
  score: number;
  deductions: { reason: string; points: number }[];
}

function calculatePrivacyScore(input: ScoreInput): ScoreOutput {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];

  // CEX activity deductions
  if (input.cexResult.riskContribution > 0) {
    score -= input.cexResult.riskContribution;
    deductions.push({
      reason: `CEX activity (${input.cexResult.totalCEXTransactions} transactions)`,
      points: input.cexResult.riskContribution,
    });
  }

  // Clustering deductions
  if (input.clusteringResult.riskContribution > 0) {
    score -= input.clusteringResult.riskContribution;
    deductions.push({
      reason: `Clustering pattern: ${input.clusteringResult.pattern}`,
      points: input.clusteringResult.riskContribution,
    });
  }

  // Assets deductions
  if (input.assetsResult.riskContribution > 0) {
    score -= input.assetsResult.riskContribution;
    deductions.push({
      reason: `Identity-revealing assets`,
      points: input.assetsResult.riskContribution,
    });
  }

  // Compliance deductions
  if (input.complianceResult.status === "Sanctioned") {
    score -= 50;
    deductions.push({
      reason: "Wallet on sanctions list",
      points: 50,
    });
  } else if (input.complianceResult.status === "Flagged") {
    score -= 25;
    deductions.push({
      reason: "Wallet flagged for suspicious activity",
      points: 25,
    });
  }

  // Interacting with sanctioned addresses
  if (input.addressRisks.sanctionedAddresses.length > 0) {
    const penalty = Math.min(input.addressRisks.sanctionedAddresses.length * 20, 40);
    score -= penalty;
    deductions.push({
      reason: `Interacted with ${input.addressRisks.sanctionedAddresses.length} sanctioned address(es)`,
      points: penalty,
    });
  }

  // Wash trading penalty
  if (input.washTradingDetected) {
    score -= 15;
    deductions.push({
      reason: "Wash trading pattern detected",
      points: 15,
    });
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return { score, deductions };
}

function determineRiskLevel(score: number): RiskLevel {
  if (score <= SCORE_THRESHOLDS.CRITICAL) return RiskLevel.CRITICAL;
  if (score <= SCORE_THRESHOLDS.HIGH) return RiskLevel.HIGH;
  if (score <= SCORE_THRESHOLDS.MEDIUM) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

function getRiskDescription(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.CRITICAL:
      return "Critical privacy risk. Your wallet is highly traceable and may be linked to your identity.";
    case RiskLevel.HIGH:
      return "High privacy risk. Significant linkages exist that could compromise your anonymity.";
    case RiskLevel.MEDIUM:
      return "Moderate privacy risk. Some patterns could be used to link your activities.";
    case RiskLevel.LOW:
      return "Good privacy posture. Minimal identifiable patterns detected.";
  }
}


interface WarningInput {
  cexResult: CEXDetectionResult;
  clusteringResult: ClusteringResult;
  assetsResult: AssetsDetectionResult;
  complianceResult: RangeCheckResult;
  addressRisks: { sanctionedAddresses: string[]; flaggedAddresses: string[] };
}

function collectWarnings(input: WarningInput): Warning[] {
  const warnings: Warning[] = [];

  // CEX warnings
  for (const msg of generateCEXWarnings(input.cexResult)) {
    warnings.push({
      severity: "high",
      category: "CEX",
      message: msg,
    });
  }

  // Clustering warnings
  for (const msg of generateClusteringWarnings(input.clusteringResult)) {
    warnings.push({
      severity: "medium",
      category: "Clustering",
      message: msg,
    });
  }

  // Asset warnings
  for (const msg of generateAssetWarnings(input.assetsResult)) {
    warnings.push({
      severity: "medium",
      category: "Identity",
      message: msg,
    });
  }

  // Compliance warnings
  if (input.complianceResult.status === "Sanctioned") {
    warnings.push({
      severity: "critical",
      category: "Compliance",
      message: "⚠️ CRITICAL: This wallet is on a sanctions list!",
    });
  } else if (input.complianceResult.status === "Flagged") {
    warnings.push({
      severity: "high",
      category: "Compliance",
      message: "This wallet has been flagged for suspicious activity.",
    });
  }

  // Interacting address warnings
  if (input.addressRisks.sanctionedAddresses.length > 0) {
    warnings.push({
      severity: "critical",
      category: "Compliance",
      message: `This wallet has interacted with ${input.addressRisks.sanctionedAddresses.length} sanctioned address(es).`,
    });
  }

  return warnings;
}

interface RecommendationInput {
  cexResult: CEXDetectionResult;
  clusteringResult: ClusteringResult;
  assetsResult: AssetsDetectionResult;
  complianceResult: RangeCheckResult;
  score: number;
}

function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // CEX-related recommendations
  for (const action of generateCEXActions(input.cexResult)) {
    const tool = RECOMMENDED_TOOLS.find(t => t.useCase === "CEX_DEPOSIT");
    recommendations.push({
      priority: "high",
      category: "CEX",
      action,
      tool: tool?.name,
      toolUrl: tool?.url,
    });
  }

  // Clustering recommendations
  for (const action of generateClusteringActions(input.clusteringResult)) {
    const tool = RECOMMENDED_TOOLS.find(t => t.useCase === "CLUSTER_DETECTED");
    recommendations.push({
      priority: "medium",
      category: "Clustering",
      action,
      tool: tool?.name,
      toolUrl: tool?.url,
    });
  }

  // Asset recommendations
  for (const action of generateAssetActions(input.assetsResult)) {
    recommendations.push({
      priority: "medium",
      category: "Identity",
      action,
    });
  }

  // Compliance recommendations
  if (input.complianceResult.status !== "Clean") {
    const tool = RECOMMENDED_TOOLS.find(t => t.useCase === "SANCTIONED_INTERACTION");
    recommendations.push({
      priority: "high",
      category: "Compliance",
      action: "Consult Range Protocol for compliance review and remediation options.",
      tool: tool?.name,
      toolUrl: tool?.url,
    });
  }

  // General recommendations for low scores
  if (input.score < 50) {
    const generalTool = RECOMMENDED_TOOLS.find(t => t.useCase === "GENERAL_PRIVACY");
    recommendations.push({
      priority: "high",
      category: "General",
      action: "Consider creating a fresh wallet and using privacy-preserving tools for future transactions.",
      tool: generalTool?.name,
      toolUrl: generalTool?.url,
    });
  }

  return recommendations;
}


function isValidSolanaAddress(address: string): boolean {
  // Basic validation: base58 characters, 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Generate mock transactions for demo when Helius is not available
 */
function generateMockTransactions(walletAddress: string): ParsedTransaction[] {
  console.log("   📝 Generating mock transaction data for demo...");
  
  return [
    {
      signature: "mock_sig_1",
      timestamp: Date.now() - 86400000,
      type: "TRANSFER",
      source: "SYSTEM_PROGRAM",
      description: "Transferred 1 SOL",
      fee: 5000,
      feePayer: walletAddress,
      accountData: [],
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", // Mock Binance
          toUserAccount: walletAddress,
          amount: 1000000000,
        },
      ],
      events: {},
    },
    {
      signature: "mock_sig_2",
      timestamp: Date.now() - 172800000,
      type: "TRANSFER",
      source: "SYSTEM_PROGRAM",
      description: "Transferred 0.5 SOL",
      fee: 5000,
      feePayer: walletAddress,
      accountData: [],
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: walletAddress,
          toUserAccount: "RandomAddr123456789012345678901234567890123",
          amount: 500000000,
        },
      ],
      events: {},
    },
    {
      signature: "mock_sig_3",
      timestamp: Date.now() - 259200000,
      type: "NFT_MINT",
      source: "MAGIC_EDEN",
      description: "Received Hackathon POAP Badge",
      fee: 5000,
      feePayer: walletAddress,
      accountData: [],
      tokenTransfers: [
        {
          mint: "MockMint123456789012345678901234567890",
          tokenAmount: 1,
          fromUserAccount: "MinterAddress12345678901234567890123456",
          toUserAccount: walletAddress,
          tokenStandard: "NonFungible",
        },
      ],
      nativeTransfers: [],
      events: {
        nft: {
          description: "Minted Hackathon POAP Badge",
          type: "NFT_MINT",
          source: "MAGIC_EDEN",
          amount: 0,
          fee: 5000,
          feePayer: walletAddress,
          buyer: walletAddress,
          nfts: [
            {
              mint: "MockMint123456789012345678901234567890",
              tokenStandard: "NonFungible",
            },
          ],
        },
      },
    },
  ] as ParsedTransaction[];
}

/**
 * Format report as a readable string for console output
 */
export function formatReportForConsole(report: PrivacyReport): string {
  const lines: string[] = [];

  lines.push("\n" + "═".repeat(60));
  lines.push("          SOLANA PRIVACY SCORE REPORT");
  lines.push("═".repeat(60));

  lines.push(`\n📍 Wallet: ${report.walletAddress}`);
  lines.push(`📅 Analyzed: ${report.analyzedAt.toISOString()}`);
  lines.push(`📊 Transactions Analyzed: ${report.transactionsAnalyzed}`);

  lines.push("\n" + "─".repeat(60));
  lines.push(`\n🎯 PRIVACY SCORE: ${report.score}/100`);
  lines.push(`🚦 Risk Level: ${report.riskLevel}`);
  lines.push(`📝 ${report.riskDescription}`);

  if (report.warnings.length > 0) {
    lines.push("\n" + "─".repeat(60));
    lines.push("\n⚠️  WARNINGS:");
    for (const warning of report.warnings) {
      const icon = warning.severity === "critical" ? "🚨" : 
                   warning.severity === "high" ? "⚠️" : "ℹ️";
      lines.push(`   ${icon} [${warning.category}] ${warning.message}`);
    }
  }

  if (report.actions.length > 0) {
    lines.push("\n" + "─".repeat(60));
    lines.push("\n💡 RECOMMENDATIONS:");
    for (const action of report.actions) {
      lines.push(`   • ${action.action}`);
      if (action.tool) {
        lines.push(`     → Use ${action.tool}: ${action.toolUrl}`);
      }
    }
  }

  lines.push("\n" + "═".repeat(60));

  return lines.join("\n");
}

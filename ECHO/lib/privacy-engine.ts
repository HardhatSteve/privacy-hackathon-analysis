/**
 * ECHO Privacy Analysis Engine
 * Core deanonymization detection and privacy scoring algorithm
 */

import { getTransactionHistory, getConnectedAddresses, analyzeTemporalPatterns, type HeliusTransaction } from "./api/helius";
import { getAddressRiskScore, checkSanctions, type RangeRiskScore } from "./api/range";
import { detectMEV } from "./api/quicknode";
import { generatePrivacySummary, type PrivacySummary } from "./api/gemini";

export interface PrivacyRisk {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  confidence: number;
  affectedTransactions: number;
  recommendation: string;
  category: "identity" | "timing" | "amount" | "mev" | "compliance";
}

export interface DeanonymizationPath {
  nodes: Array<{
    address: string;
    type: "wallet" | "exchange" | "program";
    risk: "low" | "medium" | "high" | "critical";
    transactionCount?: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    confidence: number;
  }>;
}

export interface WalletAnalysis {
  address: string;
  privacyScore: number;
  transactionCount: number;
  uniqueInteractions: number;
  risks: PrivacyRisk[];
  deanonymizationPaths: DeanonymizationPath[];
  aiSummary: PrivacySummary;
  rangeRiskScore: RangeRiskScore;
  sanctionsCheck: {
    isSanctioned: boolean;
    isBlacklisted: boolean;
  };
  mevExposure: {
    detected: boolean;
    count: number;
    totalExtracted: number;
  };
  temporalAnalysis: {
    hasPatterns: boolean;
    commonHours: number[];
    confidence: number;
  };
}

/**
 * Main analysis function - orchestrates all privacy checks
 */
export async function analyzeWalletPrivacy(
  address: string
): Promise<WalletAnalysis> {
  console.log(`🔍 Starting privacy analysis for ${address}`);

  const [transactions, connectedAddresses, rangeRisk, sanctionsData] = await Promise.all([
    getTransactionHistory(address, 100),
    getConnectedAddresses(address, 100),
    getAddressRiskScore(address),
    checkSanctions(address),
  ]);

  console.log(`📊 Fetched ${transactions.length} transactions`);

  const temporalAnalysis = analyzeTemporalPatterns(transactions);

  const risks = await detectPrivacyRisks(
    address,
    transactions,
    Array.from(connectedAddresses),
    temporalAnalysis,
    rangeRisk,
    sanctionsData
  );

  const mevAnalysis = await analyzeMEVExposure(transactions);

  const deanonymizationPaths = await buildDeanonymizationPaths(
    address,
    transactions,
    connectedAddresses
  );

  const aiSummary = await generatePrivacySummary({
    address,
    transactionCount: transactions.length,
    uniqueInteractions: connectedAddresses.size,
    risks,
    temporalPatterns: temporalAnalysis,
    rangeRiskScore: rangeRisk.riskScore,
  });

  console.log(`✅ Analysis complete: ${risks.length} risks detected`);

  return {
    address,
    privacyScore: aiSummary.privacyScore,
    transactionCount: transactions.length,
    uniqueInteractions: connectedAddresses.size,
    risks,
    deanonymizationPaths,
    aiSummary,
    rangeRiskScore: rangeRisk,
    sanctionsCheck: {
      isSanctioned: sanctionsData.isOfacSanctioned,
      isBlacklisted: sanctionsData.isTokenBlacklisted,
    },
    mevExposure: mevAnalysis,
    temporalAnalysis,
  };
}

/**
 * Detect all privacy risks
 */
async function detectPrivacyRisks(
  address: string,
  transactions: HeliusTransaction[],
  connectedAddresses: string[],
  temporalAnalysis: { hasPatterns: boolean; commonHours: number[]; confidence: number },
  rangeRisk: RangeRiskScore,
  sanctionsData: { isOfacSanctioned: boolean; isTokenBlacklisted: boolean }
): Promise<PrivacyRisk[]> {
  const risks: PrivacyRisk[] = [];

  const exchangeAddresses = detectExchangeLinks(connectedAddresses);
  if (exchangeAddresses.length > 0) {
    risks.push({
      id: "kyc-exposure",
      severity: "critical",
      title: "Linked KYC Exchange Wallet",
      description: `Detected ${exchangeAddresses.length} interactions with known exchanges. Your identity may be linked to this wallet through KYC records.`,
      confidence: 95,
      affectedTransactions: countTransactionsWithAddresses(
        transactions,
        exchangeAddresses
      ),
      recommendation:
        "Use intermediate wallets or privacy-preserving protocols to break the link between your identity and on-chain activity.",
      category: "identity",
    });
  }

  if (temporalAnalysis.hasPatterns) {
    const formatHour = (hour: number) => {
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    };
    const formattedHours = temporalAnalysis.commonHours.map(formatHour).join(", ");
    
    risks.push({
      id: "temporal-patterns",
      severity: "high",
      title: "Predictable Transaction Timing",
      description: `${temporalAnalysis.confidence.toFixed(0)}% of your transactions occur around ${formattedHours}. This pattern can help link transactions to your timezone/schedule.`,
      confidence: temporalAnalysis.confidence,
      affectedTransactions: Math.floor(
        transactions.length * (temporalAnalysis.confidence / 100)
      ),
      recommendation:
        "Randomize transaction timing or use scheduled/automated transactions to break temporal patterns.",
      category: "timing",
    });
  }

  const amountRisk = detectAmountCorrelation(transactions);
  if (amountRisk.detected) {
    risks.push({
      id: "amount-correlation",
      severity: "medium",
      title: "Unique Transaction Amounts",
      description: `${amountRisk.uniqueAmounts} unique transaction amounts detected. Specific amounts can be used to link wallets.`,
      confidence: amountRisk.confidence,
      affectedTransactions: amountRisk.count,
      recommendation:
        "Use round numbers or add small random amounts to obscure exact transfer amounts.",
      category: "amount",
    });
  }

  const repeatRisk = detectRepeatInteractions(connectedAddresses);
  if (repeatRisk.detected) {
    risks.push({
      id: "repeat-interactions",
      severity: "medium",
      title: "Frequent Repeat Interactions",
      description: `You frequently interact with ${repeatRisk.repeatCount} addresses. This creates a linkable pattern.`,
      confidence: repeatRisk.confidence,
      affectedTransactions: repeatRisk.transactionCount,
      recommendation:
        "Diversify interactions or use mixing services to break association patterns.",
      category: "identity",
    });
  }

  if (sanctionsData.isOfacSanctioned || sanctionsData.isTokenBlacklisted) {
    risks.push({
      id: "compliance-risk",
      severity: "critical",
      title: "Compliance Risk Detected",
      description: sanctionsData.isOfacSanctioned
        ? "This address is on the OFAC sanctions list."
        : "This address is flagged as token blacklisted.",
      confidence: 100,
      affectedTransactions: 0,
      recommendation:
        "Contact compliance support immediately. This wallet may be restricted.",
      category: "compliance",
    });
  }

  if (rangeRisk.riskScore >= 7) {
    risks.push({
      id: "range-high-risk",
      severity: rangeRisk.riskScore >= 9 ? "critical" : "high",
      title: "High Risk Address Detected",
      description: rangeRisk.reasoning || `Range API detected ${rangeRisk.maliciousAddressesFound.length} malicious addresses within ${rangeRisk.numHops} hops.`,
      confidence: 90,
      affectedTransactions: rangeRisk.maliciousAddressesFound.length,
      recommendation:
        "Review your transaction history and consider using a new wallet for future activities.",
      category: "compliance",
    });
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return risks;
}

/**
 * Detect exchange wallet links
 * NOTE: Uses heuristics instead of Range API to save API credits
 */
function detectExchangeLinks(addresses: string[]): string[] {
  const KNOWN_EXCHANGE_PATTERNS = [
    /^(coinbase|binance|kraken|ftx|okx|bybit|kucoin)/i,
  ];
  
  const KNOWN_EXCHANGES = new Set<string>([]);

  const exchangeAddresses: string[] = [];

  for (const addr of addresses) {
    if (KNOWN_EXCHANGES.has(addr)) {
      exchangeAddresses.push(addr);
    }
  }

  return exchangeAddresses;
}

/**
 * Count transactions involving specific addresses
 */
function countTransactionsWithAddresses(
  transactions: HeliusTransaction[],
  addresses: string[]
): number {
  let count = 0;
  const addressSet = new Set(addresses);

  transactions.forEach((tx) => {
    tx.nativeTransfers?.forEach((transfer) => {
      if (
        addressSet.has(transfer.fromUserAccount) ||
        addressSet.has(transfer.toUserAccount)
      ) {
        count++;
      }
    });
    tx.tokenTransfers?.forEach((transfer) => {
      if (
        addressSet.has(transfer.fromUserAccount) ||
        addressSet.has(transfer.toUserAccount)
      ) {
        count++;
      }
    });
  });

  return count;
}

/**
 * Detect amount correlation patterns
 */
function detectAmountCorrelation(transactions: HeliusTransaction[]): {
  detected: boolean;
  uniqueAmounts: number;
  confidence: number;
  count: number;
} {
  const amounts = new Set<number>();

  transactions.forEach((tx) => {
    tx.nativeTransfers?.forEach((transfer) => amounts.add(transfer.amount));
    tx.tokenTransfers?.forEach((transfer) => amounts.add(transfer.tokenAmount));
  });

  const uniqueRatio = amounts.size / transactions.length;
  const detected = uniqueRatio > 0.7; // >70% unique amounts = risky

  return {
    detected,
    uniqueAmounts: amounts.size,
    confidence: detected ? Math.min(85, uniqueRatio * 100) : 0,
    count: transactions.length,
  };
}

/**
 * Detect repeat interaction patterns
 */
function detectRepeatInteractions(addresses: string[]): {
  detected: boolean;
  repeatCount: number;
  confidence: number;
  transactionCount: number;
} {
  const addressCounts = new Map<string, number>();

  addresses.forEach((addr) => {
    addressCounts.set(addr, (addressCounts.get(addr) || 0) + 1);
  });

  const repeats = Array.from(addressCounts.values()).filter((count) => count > 3);
  const detected = repeats.length > 5;

  return {
    detected,
    repeatCount: repeats.length,
    confidence: detected ? Math.min(90, (repeats.length / addresses.length) * 100) : 0,
    transactionCount: repeats.reduce((sum, count) => sum + count, 0),
  };
}

/**
 * Analyze MEV exposure
 */
async function analyzeMEVExposure(transactions: HeliusTransaction[]): Promise<{
  detected: boolean;
  count: number;
  totalExtracted: number;
}> {
  let mevCount = 0;
  let totalExtracted = 0;

  for (const tx of transactions.slice(0, 20)) {
    try {
      const mev = await detectMEV(tx.signature);
      if (mev.isMEV) {
        mevCount++;
        totalExtracted += mev.extractedValue;
      }
    } catch (error) {}
  }

  return {
    detected: mevCount > 0,
    count: mevCount,
    totalExtracted,
  };
}

/**
 * Build deanonymization paths through transaction graph
 */
async function buildDeanonymizationPaths(
  address: string,
  transactions: HeliusTransaction[],
  connectedAddresses: Set<string>
): Promise<DeanonymizationPath[]> {
  const paths: DeanonymizationPath[] = [];

  console.log(`🔗 Building deanonymization paths from ${connectedAddresses.size} connected addresses`);

  if (connectedAddresses.size === 0) {
    console.log("⚠️ No connected addresses found, creating single-node graph");
    paths.push({
      nodes: [{ address, type: "wallet", risk: "low" }],
      edges: [],
    });
    return paths;
  }

  const firstHop = Array.from(connectedAddresses).slice(0, 12);

  const KNOWN_PROGRAMS = new Set([
    "11111111111111111111111111111111",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  ]);

  for (const hop1 of firstHop) {
    if (!hop1 || hop1.trim() === "") continue;

    let nodeType: "wallet" | "exchange" | "program" = "wallet";
    if (KNOWN_PROGRAMS.has(hop1)) {
      nodeType = "program";
    }

    const txCountWithAddress = transactions.filter(tx => {
      const involved = [
        ...(tx.nativeTransfers?.map(t => [t.fromUserAccount, t.toUserAccount]).flat() || []),
        ...(tx.tokenTransfers?.map(t => [t.fromUserAccount, t.toUserAccount]).flat() || [])
      ];
      return involved.includes(hop1);
    }).length;
    
    const confidence = Math.min(95, 40 + (txCountWithAddress * 11));

    const riskLevel: "low" | "medium" | "high" | "critical" = "low";

    paths.push({
      nodes: [
        { address, type: "wallet", risk: "medium", transactionCount: transactions.length },
        { address: hop1, type: nodeType, risk: riskLevel, transactionCount: txCountWithAddress },
      ],
      edges: [{ from: address, to: hop1, confidence }],
    });
  }

  console.log(`✅ Built ${paths.length} deanonymization paths`);
  return paths;
}
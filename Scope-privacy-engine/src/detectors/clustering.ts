/**
 * Clustering Detector - Detects wallet clustering patterns
 * Identifies if a wallet has suspicious transaction patterns with the same addresses
 */

import type { ParsedTransaction } from "../services/helius";
import { ANALYSIS_CONFIG, POINT_DEDUCTIONS } from "../utils/constants";

export interface ClusteringResult {
  detected: boolean;
  clusteringPercentage: number;
  topAddresses: AddressFrequency[];
  dominantAddress: string | null;
  totalUniqueAddresses: number;
  totalTransactions: number;
  riskContribution: number;
  pattern: ClusterPattern;
}

export interface AddressFrequency {
  address: string;
  count: number;
  percentage: number;
}

export type ClusterPattern = 
  | "none"
  | "single_counterparty"  // 50%+ with same address
  | "small_cluster"        // 3-5 addresses make up 80%
  | "wash_trading"         // Suspicious back-and-forth
  | "funnel";              // Many inputs, few outputs

/**
 * Detect wallet clustering in transaction history
 * @param transactions - Parsed transaction history
 * @param walletAddress - The wallet being analyzed
 * @returns ClusteringResult with pattern analysis
 */
export function detectClustering(
  transactions: ParsedTransaction[],
  walletAddress: string
): ClusteringResult {
  try {
    const addressCounts = new Map<string, number>();
    let totalInteractions = 0;

    // Count interactions with each address
    for (const tx of transactions) {
      // Analyze native transfers
      for (const transfer of tx.nativeTransfers || []) {
        const otherAddress =
          transfer.fromUserAccount === walletAddress
            ? transfer.toUserAccount
            : transfer.fromUserAccount;

        if (otherAddress && otherAddress !== walletAddress) {
          addressCounts.set(
            otherAddress,
            (addressCounts.get(otherAddress) || 0) + 1
          );
          totalInteractions++;
        }
      }

      // Analyze token transfers
      for (const transfer of tx.tokenTransfers || []) {
        const otherAddress =
          transfer.fromUserAccount === walletAddress
            ? transfer.toUserAccount
            : transfer.fromUserAccount;

        if (otherAddress && otherAddress !== walletAddress) {
          addressCounts.set(
            otherAddress,
            (addressCounts.get(otherAddress) || 0) + 1
          );
          totalInteractions++;
        }
      }
    }

    // Not enough data to analyze
    if (totalInteractions < ANALYSIS_CONFIG.MIN_TRANSACTIONS_FOR_PATTERN) {
      console.log(`ℹ️  Not enough transactions for clustering analysis (${totalInteractions} interactions)`);
      return {
        detected: false,
        clusteringPercentage: 0,
        topAddresses: [],
        dominantAddress: null,
        totalUniqueAddresses: addressCounts.size,
        totalTransactions: transactions.length,
        riskContribution: 0,
        pattern: "none",
      };
    }

    // Sort addresses by frequency
    const sortedAddresses = Array.from(addressCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([address, count]) => ({
        address,
        count,
        percentage: (count / totalInteractions) * 100,
      }));

    const topAddresses = sortedAddresses.slice(0, 5);
    const firstAddress = topAddresses[0];
    const dominantAddress = firstAddress ? firstAddress.address : null;
    const highestPercentage = firstAddress ? firstAddress.percentage : 0;

    // Detect clustering pattern
    const pattern = detectPattern(sortedAddresses, totalInteractions);
    const clusteringDetected = 
      highestPercentage >= ANALYSIS_CONFIG.CLUSTER_THRESHOLD_PERCENTAGE ||
      pattern !== "none";

    // Calculate risk contribution
    let riskContribution = 0;
    if (clusteringDetected) {
      if (pattern === "single_counterparty") {
        riskContribution = POINT_DEDUCTIONS.CLUSTER_DETECTED;
      } else if (pattern === "wash_trading") {
        riskContribution = POINT_DEDUCTIONS.CLUSTER_DETECTED + 10;
      } else if (pattern === "small_cluster") {
        riskContribution = Math.floor(POINT_DEDUCTIONS.CLUSTER_DETECTED * 0.7);
      } else if (pattern === "funnel") {
        riskContribution = Math.floor(POINT_DEDUCTIONS.CLUSTER_DETECTED * 0.5);
      } else {
        riskContribution = POINT_DEDUCTIONS.HIGH_FREQUENCY_SAME_ADDR;
      }
    }

    const result: ClusteringResult = {
      detected: clusteringDetected,
      clusteringPercentage: highestPercentage,
      topAddresses,
      dominantAddress,
      totalUniqueAddresses: addressCounts.size,
      totalTransactions: transactions.length,
      riskContribution,
      pattern,
    };

    if (clusteringDetected) {
      console.log(`⚠️  Clustering pattern detected: ${pattern}`);
      console.log(`   - Highest concentration: ${highestPercentage.toFixed(1)}%`);
      console.log(`   - Unique addresses: ${addressCounts.size}`);
    } else {
      console.log(`✅ No significant clustering detected`);
      console.log(`   - ${addressCounts.size} unique counterparties`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error in clustering detection:", error);
    return {
      detected: false,
      clusteringPercentage: 0,
      topAddresses: [],
      dominantAddress: null,
      totalUniqueAddresses: 0,
      totalTransactions: transactions.length,
      riskContribution: 0,
      pattern: "none",
    };
  }
}

/**
 * Detect the type of clustering pattern
 */
function detectPattern(
  sortedAddresses: AddressFrequency[],
  totalInteractions: number
): ClusterPattern {
  if (sortedAddresses.length === 0) return "none";
  const firstAddress = sortedAddresses[0];
  // Single counterparty: 50%+ with one address
  if (firstAddress && firstAddress.percentage >= 50) {
    return "single_counterparty";
  }

  // Small cluster: top 3 addresses make up 80%+
  if (sortedAddresses.length >= 3) {
    const top3Percentage = sortedAddresses
      .slice(0, 3)
      .reduce((sum, a) => sum + a.percentage, 0);
    
    if (top3Percentage >= 80) {
      return "small_cluster";
    }
  }

  // Funnel: many addresses but concentrated outputs
  if (sortedAddresses.length >= 10) {
    const top5Percentage = sortedAddresses
      .slice(0, 5)
      .reduce((sum, a) => sum + a.percentage, 0);
    
    if (top5Percentage >= 70) {
      return "funnel";
    }
  }

  return "none";
}

/**
 * Detect potential wash trading patterns
 * @param transactions - Parsed transactions
 * @param walletAddress - Wallet to analyze
 * @returns Detection result
 */
export function detectWashTrading(
  transactions: ParsedTransaction[],
  walletAddress: string
): { detected: boolean; pairs: WashTradePair[] } {
  const pairs: WashTradePair[] = [];
  const addressTimelines = new Map<string, { sent: number[]; received: number[] }>();

  try {
    // Build timeline of sends/receives per address
    for (const tx of transactions) {
      for (const transfer of tx.nativeTransfers || []) {
        if (transfer.fromUserAccount === walletAddress && transfer.toUserAccount) {
          const timeline = addressTimelines.get(transfer.toUserAccount) || 
            { sent: [], received: [] };
          timeline.sent.push(tx.timestamp);
          addressTimelines.set(transfer.toUserAccount, timeline);
        }

        if (transfer.toUserAccount === walletAddress && transfer.fromUserAccount) {
          const timeline = addressTimelines.get(transfer.fromUserAccount) || 
            { sent: [], received: [] };
          timeline.received.push(tx.timestamp);
          addressTimelines.set(transfer.fromUserAccount, timeline);
        }
      }
    }

    // Look for back-and-forth patterns
    for (const [address, timeline] of addressTimelines) {
      if (timeline.sent.length >= 2 && timeline.received.length >= 2) {
        // Check for alternating pattern
        const allTimestamps = [
          ...timeline.sent.map(t => ({ t, type: "sent" })),
          ...timeline.received.map(t => ({ t, type: "received" })),
        ].sort((a, b) => a.t - b.t);

        let alternations = 0;
        for (let i = 1; i < allTimestamps.length; i++) {
          const current = allTimestamps[i];
          const previous = allTimestamps[i - 1];
          if (current && previous && current.type !== previous.type) {
            alternations++;
          }
        }

        if (alternations >= 3) {
          pairs.push({
            address,
            sendCount: timeline.sent.length,
            receiveCount: timeline.received.length,
            alternations,
          });
        }
      }
    }

    return {
      detected: pairs.length > 0,
      pairs,
    };
  } catch (error) {
    console.error("❌ Error detecting wash trading:", error);
    return { detected: false, pairs: [] };
  }
}

export interface WashTradePair {
  address: string;
  sendCount: number;
  receiveCount: number;
  alternations: number;
}

/**
 * Generate warnings based on clustering results
 */
export function generateClusteringWarnings(result: ClusteringResult): string[] {
  const warnings: string[] = [];

  if (!result.detected) return warnings;

  switch (result.pattern) {
    case "single_counterparty":
      warnings.push(
        `${result.clusteringPercentage.toFixed(1)}% of transactions are with a single address. ` +
          `This creates a clear link between your wallets.`
      );
      break;
    case "small_cluster":
      warnings.push(
        `Your transactions are concentrated among just ${result.topAddresses.length} addresses. ` +
          `This clustering pattern can be used to link your wallets.`
      );
      break;
    case "wash_trading":
      warnings.push(
        `Suspicious back-and-forth transaction pattern detected. ` +
          `This behavior is easily identifiable on-chain.`
      );
      break;
    case "funnel":
      warnings.push(
        `Funnel pattern detected: many sources funneling to few destinations. ` +
          `This pattern suggests wallet consolidation.`
      );
      break;
  }

  return warnings;
}

/**
 * Generate recommendations for fixing clustering issues
 */
export function generateClusteringActions(result: ClusteringResult): string[] {
  const actions: string[] = [];

  if (!result.detected) return actions;

  actions.push(
    "Use Radr Labs to break wallet clustering patterns and obfuscate your transaction graph."
  );

  if (result.pattern === "single_counterparty") {
    actions.push(
      "Diversify your transaction patterns - use multiple intermediate wallets."
    );
  }

  if (result.pattern === "wash_trading") {
    actions.push(
      "Avoid repetitive back-and-forth transactions with the same address."
    );
  }

  actions.push(
    "Consider using Elusiv for private transactions that don't create linkable patterns."
  );

  return actions;
}

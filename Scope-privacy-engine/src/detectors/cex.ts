/**
 * CEX Detector - Detects transactions with centralized exchanges
 * Identifies deposits and withdrawals from known exchange hot wallets
 */

import { KNOWN_CEX } from "../utils/constants";
import type { ParsedTransaction } from "../services/helius";

export interface CEXDetectionResult {
  detected: boolean;
  deposits: CEXTransaction[];
  withdrawals: CEXTransaction[];
  totalCEXTransactions: number;
  exchangesInvolved: string[];
  riskContribution: number; // Points to deduct from privacy score
}

export interface CEXTransaction {
  signature: string;
  timestamp: number;
  exchangeName: string;
  exchangeAddress: string;
  direction: "deposit" | "withdrawal";
  amount?: number;
}

/**
 * Detect CEX-related transactions in wallet history
 * @param transactions - Parsed transaction history
 * @param walletAddress - The wallet being analyzed
 * @returns CEXDetectionResult with all detected CEX interactions
 */
export function detectCEXTransactions(
  transactions: ParsedTransaction[],
  walletAddress: string
): CEXDetectionResult {
  const deposits: CEXTransaction[] = [];
  const withdrawals: CEXTransaction[] = [];
  const exchangesSet = new Set<string>();

  try {
    for (const tx of transactions) {
      // Check native (SOL) transfers
      for (const transfer of tx.nativeTransfers || []) {
        const cexMatch = findCEXAddress(transfer.fromUserAccount);
        
        if (cexMatch && transfer.toUserAccount === walletAddress) {
          // Deposit FROM CEX to our wallet
          deposits.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            exchangeName: cexMatch.name,
            exchangeAddress: cexMatch.address,
            direction: "deposit",
            amount: transfer.amount / 1e9, // Convert lamports to SOL
          });
          exchangesSet.add(cexMatch.name);
        }

        const cexMatchTo = findCEXAddress(transfer.toUserAccount);
        if (cexMatchTo && transfer.fromUserAccount === walletAddress) {
          // Withdrawal TO CEX from our wallet
          withdrawals.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            exchangeName: cexMatchTo.name,
            exchangeAddress: cexMatchTo.address,
            direction: "withdrawal",
            amount: transfer.amount / 1e9,
          });
          exchangesSet.add(cexMatchTo.name);
        }
      }

      // Check token transfers
      for (const transfer of tx.tokenTransfers || []) {
        const cexMatch = findCEXAddress(transfer.fromUserAccount);
        
        if (cexMatch && transfer.toUserAccount === walletAddress) {
          deposits.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            exchangeName: cexMatch.name,
            exchangeAddress: cexMatch.address,
            direction: "deposit",
            amount: transfer.tokenAmount,
          });
          exchangesSet.add(cexMatch.name);
        }

        const cexMatchTo = findCEXAddress(transfer.toUserAccount);
        if (cexMatchTo && transfer.fromUserAccount === walletAddress) {
          withdrawals.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            exchangeName: cexMatchTo.name,
            exchangeAddress: cexMatchTo.address,
            direction: "withdrawal",
            amount: transfer.tokenAmount,
          });
          exchangesSet.add(cexMatchTo.name);
        }
      }

      // Also check feePayer - sometimes CEX pays fees for withdrawals
      const feePayerMatch = findCEXAddress(tx.feePayer);
      if (feePayerMatch && tx.feePayer !== walletAddress) {
        // CEX paid the fee, likely a withdrawal from CEX
        const alreadyTracked = deposits.some(d => d.signature === tx.signature);
        if (!alreadyTracked) {
          deposits.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            exchangeName: feePayerMatch.name,
            exchangeAddress: feePayerMatch.address,
            direction: "deposit",
          });
          exchangesSet.add(feePayerMatch.name);
        }
      }
    }

    // Calculate risk contribution
    // Deposits from CEX are worse for privacy (direct link to KYC)
    const depositRisk = deposits.length * 15; // 15 points per deposit
    const withdrawalRisk = withdrawals.length * 10; // 10 points per withdrawal
    const riskContribution = Math.min(depositRisk + withdrawalRisk, 50); // Cap at 50

    const result: CEXDetectionResult = {
      detected: deposits.length > 0 || withdrawals.length > 0,
      deposits,
      withdrawals,
      totalCEXTransactions: deposits.length + withdrawals.length,
      exchangesInvolved: Array.from(exchangesSet),
      riskContribution,
    };

    if (result.detected) {
      console.log(`⚠️  CEX Activity Detected:`);
      console.log(`   - Deposits from CEX: ${deposits.length}`);
      console.log(`   - Withdrawals to CEX: ${withdrawals.length}`);
      console.log(`   - Exchanges: ${result.exchangesInvolved.join(", ")}`);
    } else {
      console.log(`✅ No CEX activity detected`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error in CEX detection:", error);
    return {
      detected: false,
      deposits: [],
      withdrawals: [],
      totalCEXTransactions: 0,
      exchangesInvolved: [],
      riskContribution: 0,
    };
  }
}

/**
 * Find a CEX by address
 * @param address - Address to check
 * @returns CEX info if found, null otherwise
 */
function findCEXAddress(
  address: string | undefined
): { address: string; name: string } | null {
  if (!address) return null;
  return KNOWN_CEX.find((cex) => cex.address === address) || null;
}

/**
 * Check if an address is a known CEX
 * @param address - Address to check
 * @returns boolean
 */
export function isKnownCEX(address: string): boolean {
  return KNOWN_CEX.some((cex) => cex.address === address);
}

/**
 * Get CEX name by address
 * @param address - CEX address
 * @returns Exchange name or null
 */
export function getCEXName(address: string): string | null {
  const cex = findCEXAddress(address);
  return cex ? cex.name : null;
}

/**
 * Generate warnings based on CEX detection results
 * @param result - CEX detection result
 * @returns Array of warning messages
 */
export function generateCEXWarnings(result: CEXDetectionResult): string[] {
  const warnings: string[] = [];

  for (const deposit of result.deposits) {
    warnings.push(
      `Direct deposit from ${deposit.exchangeName} detected. ` +
        `This links your CEX KYC identity to this wallet.`
    );
  }

  for (const withdrawal of result.withdrawals) {
    warnings.push(
      `Withdrawal to ${withdrawal.exchangeName} detected. ` +
        `Your wallet activity is now linked to your exchange account.`
    );
  }

  return warnings;
}

/**
 * Generate action recommendations for CEX issues
 * @param result - CEX detection result
 * @returns Array of recommended actions
 */
export function generateCEXActions(result: CEXDetectionResult): string[] {
  const actions: string[] = [];

  if (result.deposits.length > 0) {
    actions.push(
      "Consider using Privacy Cash to create a clean wallet for future DeFi activities."
    );
    actions.push(
      "Use intermediate wallets between CEX and your main DeFi wallet."
    );
  }

  if (result.withdrawals.length > 0) {
    actions.push(
      "Before depositing to CEX, route through an intermediate wallet."
    );
    actions.push(
      "Consider using compliant privacy solutions like Elusiv for future transactions."
    );
  }

  if (result.exchangesInvolved.length > 1) {
    actions.push(
      "Multiple exchanges linked to this wallet - consider compartmentalizing with separate wallets."
    );
  }

  return actions;
}

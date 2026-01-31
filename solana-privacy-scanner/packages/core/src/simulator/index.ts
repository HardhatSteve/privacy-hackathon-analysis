import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';
import { normalizeTransactionData } from '../normalizer/index.js';
import { generateReport } from '../scanner/index.js';
import { createDefaultLabelProvider } from '../labels/index.js';
import type { PrivacyReport, LabelProvider, RiskSignal } from '../types/index.js';

export interface SimulatorOptions {
  /** Custom label provider for known entity detection */
  labelProvider?: LabelProvider;
  /** Commitment level for simulation */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  /** Whether to include account details in simulation */
  includeAccounts?: boolean;
}

export interface PrivacyFlowReport {
  /** Individual reports for each transaction */
  individualReports: PrivacyReport[];
  /** Overall cumulative risk level */
  cumulativeRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Cumulative privacy score (0-100) */
  cumulativeScore: number;
  /** Patterns that emerge across multiple transactions */
  emergentPatterns: EmergentPattern[];
  /** Recommendations based on the full flow */
  recommendations: string[];
}

export interface EmergentPattern {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  transactions: number[]; // Indices of affected transactions
}

export interface PrivacyComparison {
  implementationA: PrivacyReport;
  implementationB: PrivacyReport;
  winner: 'A' | 'B' | 'EQUAL';
  difference: number;
  recommendation: string;
}

/**
 * Simulate a single transaction's privacy impact without sending it to the network
 * 
 * @param transaction - The transaction to simulate
 * @param connection - Solana RPC connection
 * @param options - Simulation options
 * @returns Privacy report for the simulated transaction
 * 
 * @example
 * ```typescript
 * const tx = new Transaction().add(instruction);
 * const report = await simulateTransactionPrivacy(tx, connection);
 * 
 * if (report.overallRisk === 'HIGH') {
 *   console.warn('This transaction has high privacy risks');
 * }
 * ```
 */
export async function simulateTransactionPrivacy(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SimulatorOptions
): Promise<PrivacyReport> {
  try {
    // Simulate the transaction
    let simulation;
    
    if (transaction instanceof Transaction) {
      simulation = await connection.simulateTransaction(transaction);
    } else {
      simulation = await connection.simulateTransaction(transaction);
    }

    if (simulation.value.err) {
      throw new Error(
        `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
      );
    }

    // Create synthetic transaction data from simulation
    const syntheticTx = createSyntheticTransaction(transaction, simulation);

    // Use existing analysis engine
    const labelProvider = options?.labelProvider || createDefaultLabelProvider();
    const context = normalizeTransactionData(syntheticTx, labelProvider);
    
    return generateReport(context);
  } catch (error) {
    throw new Error(
      `Failed to simulate transaction privacy: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Simulate a flow of transactions to see cumulative privacy impact
 * 
 * @param transactions - Array of transactions representing a user flow
 * @param connection - Solana RPC connection
 * @param options - Simulation options
 * @returns Cumulative privacy analysis of the flow
 * 
 * @example
 * ```typescript
 * const flow = [depositTx, swapTx, withdrawTx];
 * const report = await simulateTransactionFlow(flow, connection);
 * 
 * console.log(`Cumulative Risk: ${report.cumulativeRisk}`);
 * console.log(`Emergent Patterns: ${report.emergentPatterns.length}`);
 * ```
 */
export async function simulateTransactionFlow(
  transactions: (Transaction | VersionedTransaction)[],
  connection: Connection,
  options?: SimulatorOptions
): Promise<PrivacyFlowReport> {
  const reports: PrivacyReport[] = [];

  // Simulate each transaction
  for (const tx of transactions) {
    const report = await simulateTransactionPrivacy(tx, connection, options);
    reports.push(report);
  }

  // Analyze cumulative patterns
  const emergentPatterns = detectEmergentPatterns(reports);
  const cumulativeScore = calculateCumulativeScore(reports);
  const cumulativeRisk = determineRiskLevel(cumulativeScore);
  const recommendations = generateFlowRecommendations(reports, emergentPatterns);

  return {
    individualReports: reports,
    cumulativeRisk,
    cumulativeScore,
    emergentPatterns,
    recommendations,
  };
}

/**
 * Compare two transaction implementations for privacy impact
 * 
 * @param implA - First implementation
 * @param implB - Second implementation
 * @param connection - Solana RPC connection
 * @param options - Simulation options
 * @returns Comparison showing which implementation is more private
 * 
 * @example
 * ```typescript
 * const directTransfer = createDirectTransfer(user, recipient, amount);
 * const intermediaryTransfer = createIntermediaryTransfer(user, recipient, amount);
 * 
 * const comparison = await compareImplementations(
 *   directTransfer,
 *   intermediaryTransfer,
 *   connection
 * );
 * 
 * console.log(`Winner: Implementation ${comparison.winner}`);
 * console.log(`Privacy improvement: ${comparison.difference} points`);
 * ```
 */
export async function compareImplementations(
  implA: Transaction | VersionedTransaction,
  implB: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SimulatorOptions
): Promise<PrivacyComparison> {
  const [reportA, reportB] = await Promise.all([
    simulateTransactionPrivacy(implA, connection, options),
    simulateTransactionPrivacy(implB, connection, options),
  ]);

  const scoreA = calculateScore(reportA);
  const scoreB = calculateScore(reportB);
  const difference = Math.abs(scoreA - scoreB);

  let winner: 'A' | 'B' | 'EQUAL' = 'EQUAL';
  if (difference > 5) {
    // At least 5 point difference to declare a winner
    winner = scoreA > scoreB ? 'A' : 'B';
  }

  const recommendation = generateComparison(reportA, reportB, winner);

  return {
    implementationA: reportA,
    implementationB: reportB,
    winner,
    difference,
    recommendation,
  };
}

// Helper functions

function createSyntheticTransaction(
  transaction: Transaction | VersionedTransaction,
  simulation: any
): any {
  // Create a synthetic transaction object that matches the expected format
  // for normalizeTransactionData
  return {
    transaction: {
      signature: 'SIMULATED_' + Date.now(),
      slot: simulation.context.slot,
      blockTime: Math.floor(Date.now() / 1000),
      transaction: {
        message:
          transaction instanceof Transaction
            ? transaction.compileMessage()
            : transaction.message,
        signatures: [],
      },
      meta: simulation.value,
    },
  };
}

function detectEmergentPatterns(reports: PrivacyReport[]): EmergentPattern[] {
  const patterns: EmergentPattern[] = [];

  // Detect timing patterns across multiple transactions
  const hasTimingIssues = reports.filter((r) =>
    r.signals.some((s: RiskSignal) => s.type.includes('timing'))
  );
  if (hasTimingIssues.length >= 2) {
    patterns.push({
      type: 'timing-correlation',
      description: 'Multiple transactions create timing-based fingerprint',
      severity: 'MEDIUM',
      transactions: hasTimingIssues.map((_, i) => i),
    });
  }

  // Detect counterparty reuse across flow
  const counterpartySignals = reports
    .map((r, i) => ({
      report: r,
      index: i,
      hasCounterparty: r.signals.some((s: RiskSignal) => s.type.includes('counterparty')),
    }))
    .filter((x) => x.hasCounterparty);

  if (counterpartySignals.length >= 2) {
    patterns.push({
      type: 'flow-linkage',
      description: 'Repeated counterparties create linkage across transaction flow',
      severity: 'HIGH',
      transactions: counterpartySignals.map((x) => x.index),
    });
  }

  // Detect amount patterns across flow
  const amountSignals = reports.filter((r) =>
    r.signals.some((s: RiskSignal) => s.type.includes('amount'))
  );
  if (amountSignals.length >= 2) {
    patterns.push({
      type: 'amount-correlation',
      description: 'Similar amounts across flow create pattern',
      severity: 'LOW',
      transactions: amountSignals.map((_, i) => i),
    });
  }

  return patterns;
}

function calculateCumulativeScore(reports: PrivacyReport[]): number {
  if (reports.length === 0) return 100;

  // Calculate average score, but weight later transactions more heavily
  // (as they can reveal patterns from earlier ones)
  let weightedSum = 0;
  let totalWeight = 0;

  reports.forEach((report, index) => {
    const weight = index + 1; // Later transactions have more weight
    const score = calculateScore(report);
    weightedSum += score * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

function calculateScore(report: PrivacyReport): number {
  // Simple scoring: start at 100, deduct points for signals
  let score = 100;

  for (const signal of report.signals) {
    if (signal.severity === 'HIGH') {
      score -= 20;
    } else if (signal.severity === 'MEDIUM') {
      score -= 10;
    } else if (signal.severity === 'LOW') {
      score -= 5;
    }
  }

  return Math.max(0, score);
}

function determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 70) return 'LOW';
  if (score >= 40) return 'MEDIUM';
  return 'HIGH';
}

function generateFlowRecommendations(
  reports: PrivacyReport[],
  patterns: EmergentPattern[]
): string[] {
  const recommendations: string[] = [];

  // Add pattern-specific recommendations
  for (const pattern of patterns) {
    switch (pattern.type) {
      case 'timing-correlation':
        recommendations.push(
          'Add randomized delays between related transactions to break timing patterns'
        );
        break;
      case 'flow-linkage':
        recommendations.push(
          'Use different intermediary accounts between flow steps to reduce linkage'
        );
        break;
      case 'amount-correlation':
        recommendations.push(
          'Vary transaction amounts or add noise to prevent amount-based correlation'
        );
        break;
    }
  }

  // Add general recommendations based on cumulative signals
  const allSignals = reports.flatMap((r) => r.signals);
  const highSeverityCount = allSignals.filter((s: RiskSignal) => s.severity === 'HIGH').length;

  if (highSeverityCount > 0) {
    recommendations.push(
      `Address ${highSeverityCount} high-severity privacy issue(s) before production`
    );
  }

  // Check for known entity interactions
  const hasKnownEntities = reports.some((r) => r.knownEntities.length > 0);
  if (hasKnownEntities) {
    recommendations.push(
      'Consider using intermediary accounts when interacting with known entities'
    );
  }

  return recommendations;
}

function generateComparison(
  reportA: PrivacyReport,
  reportB: PrivacyReport,
  winner: 'A' | 'B' | 'EQUAL'
): string {
  if (winner === 'EQUAL') {
    return 'Both implementations have similar privacy characteristics';
  }

  const winnerReport = winner === 'A' ? reportA : reportB;
  const loserReport = winner === 'A' ? reportB : reportA;

  const winnerSignals = winnerReport.signals.length;
  const loserSignals = loserReport.signals.length;

  return `Implementation ${winner} is more private with ${winnerSignals} signal(s) vs ${loserSignals}. ` +
    `Key advantage: ${identifyKeyAdvantage(winnerReport, loserReport)}`;
}

function identifyKeyAdvantage(better: PrivacyReport, worse: PrivacyReport): string {
  // Find what makes the better implementation superior
  const betterTypes = new Set(better.signals.map((s) => s.type));
  const worseTypes = new Set(worse.signals.map((s) => s.type));

  // Find signals present in worse but not in better
  const avoidedSignals = Array.from(worseTypes).filter((t) => !betterTypes.has(t));

  if (avoidedSignals.length > 0) {
    const signal = avoidedSignals[0] as string;
    return `Avoids ${signal.replace(/-/g, ' ')}`;
  }

  // If both have signals, compare severity
  const betterHigh = better.signals.filter((s) => s.severity === 'HIGH').length;
  const worseHigh = worse.signals.filter((s) => s.severity === 'HIGH').length;

  if (worseHigh > betterHigh) {
    return 'Fewer high-severity privacy risks';
  }

  return 'Better overall privacy characteristics';
}

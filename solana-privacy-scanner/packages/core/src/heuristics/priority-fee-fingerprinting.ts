import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect priority fee fingerprinting patterns
 *
 * Compute budget instructions reveal exact priority fee and compute unit limits.
 * Users and bots often use consistent values, creating a behavioral signature
 * that links transactions together even across different counterparties.
 */
export function detectPriorityFeeFingerprinting(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  if (!context.transactions || context.transactions.length < 5) {
    return signals;
  }

  // Signal 1: Consistent priority fee usage
  const txsWithPriorityFee = context.transactions.filter(
    tx => tx.priorityFee !== undefined && tx.priorityFee !== null && tx.priorityFee > 0
  );

  if (txsWithPriorityFee.length >= 3) {
    const feeGroups = new Map<number, number>();
    for (const tx of txsWithPriorityFee) {
      const fee = tx.priorityFee!;
      feeGroups.set(fee, (feeGroups.get(fee) || 0) + 1);
    }

    const sortedFees = Array.from(feeGroups.entries()).sort((a, b) => b[1] - a[1]);
    const [topFee, topCount] = sortedFees[0];
    const concentration = topCount / txsWithPriorityFee.length;

    if (concentration >= 0.5 && topCount >= 3) {
      const evidence: Evidence[] = sortedFees.slice(0, 3).map(([fee, count]) => ({
        description: `Priority fee of ${fee} lamports used in ${count} transaction(s)`,
        severity: (concentration > 0.7 ? 'MEDIUM' : 'LOW') as 'MEDIUM' | 'LOW',
      }));

      signals.push({
        id: 'priority-fee-consistent',
        name: 'Consistent Priority Fee Usage',
        severity: 'MEDIUM',
        category: 'behavioral',
        confidence: 0.7,
        reason: `This wallet uses the same priority fee (${topFee} lamports) in ${Math.round(concentration * 100)}% of transactions. This creates a recognizable pattern that makes it easier for someone watching the blockchain to group these transactions together as coming from the same person or bot.`,
        impact: 'Using the same priority fee repeatedly acts like a signature that links your transactions together, even when interacting with different addresses.',
        mitigation: 'Vary your priority fee amounts between transactions. If using a bot or script, add randomness to the fee calculation.',
        evidence,
      });
    }
  }

  // Signal 2: Distinctive compute unit pattern
  const txsWithComputeUnits = context.transactions.filter(
    tx => tx.computeUnitsUsed !== undefined && tx.computeUnitsUsed !== null
  );

  if (txsWithComputeUnits.length >= 5) {
    const bucketSize = 10000;
    const buckets = new Map<number, number>();
    for (const tx of txsWithComputeUnits) {
      const bucket = Math.floor(tx.computeUnitsUsed! / bucketSize) * bucketSize;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }

    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]);
    const [topBucket, topBucketCount] = sortedBuckets[0];
    const bucketConcentration = topBucketCount / txsWithComputeUnits.length;

    if (bucketConcentration >= 0.6 && topBucketCount >= 4) {
      signals.push({
        id: 'compute-budget-fingerprint',
        name: 'Distinctive Compute Unit Pattern',
        severity: 'LOW',
        category: 'behavioral',
        confidence: 0.6,
        reason: `${Math.round(bucketConcentration * 100)}% of transactions use between ${topBucket} and ${topBucket + bucketSize} compute units. This consistent pattern could help someone identify your transactions among others on the network.`,
        impact: 'Consistent compute unit usage creates a pattern that can be used to link your transactions together.',
        mitigation: 'This is often unavoidable when running the same type of operations repeatedly. If privacy is important, try varying the operations you include in each transaction.',
        evidence: [{
          description: `${topBucketCount}/${txsWithComputeUnits.length} transactions use ${topBucket}-${topBucket + bucketSize} compute units`,
          severity: 'LOW',
        }],
      });
    }
  }

  return signals;
}

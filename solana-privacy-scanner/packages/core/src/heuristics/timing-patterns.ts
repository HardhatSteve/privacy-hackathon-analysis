import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect transaction timing patterns
 * Concentrated activity and regular intervals create temporal fingerprints
 */
export function detectTimingPatterns(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  if (!context.timeRange.earliest || !context.timeRange.latest) {
    return signals;
  }

  if (context.transactionCount < 3) {
    return signals;
  }

  // Calculate time span in hours
  const timeSpanSeconds = context.timeRange.latest - context.timeRange.earliest;
  const timeSpanHours = timeSpanSeconds / 3600;

  if (timeSpanHours === 0) {
    return signals;
  }

  // Calculate transaction rate (txs per hour)
  const txRate = context.transactionCount / timeSpanHours;

  // Case 1: Burst activity (high tx rate in short time)
  let isBurst = false;
  let burstSeverity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (txRate > 10) {
    burstSeverity = 'HIGH';
    isBurst = true;
  } else if (txRate > 5) {
    burstSeverity = 'MEDIUM';
    isBurst = true;
  } else if (timeSpanHours < 1 && context.transactionCount >= 3) {
    burstSeverity = 'MEDIUM';
    isBurst = true;
  }

  if (isBurst) {
    signals.push({
      id: 'timing-burst',
      name: 'Transaction Burst Pattern',
      severity: burstSeverity,
      confidence: 0.8,
      category: 'behavioral',
      reason: `${context.transactionCount} transactions happened within just ${timeSpanHours.toFixed(1)} hour(s). This burst of activity stands out and is easy to spot on the blockchain.`,
      impact: 'A sudden spike in transactions is distinctive. Anyone watching can see the burst and correlate it with real-world events or other wallets showing the same pattern.',
      mitigation: 'Spread your transactions out over a longer period. Doing everything at once makes your activity easy to identify.',
      evidence: [{
        description: `${context.transactionCount} transactions in ${timeSpanHours.toFixed(1)} hours (${txRate.toFixed(2)} tx/hour)`,
        severity: burstSeverity,
        reference: undefined,
      }],
    });
  }

  // Case 2: Regular interval patterns
  // Check if we have transaction timestamps
  if (context.transactions && context.transactions.length >= 5) {
    const timestamps = context.transactions
      .map(tx => tx.blockTime)
      .filter((time): time is number => time !== undefined)
      .sort((a, b) => a - b);

    if (timestamps.length >= 5) {
      // Calculate time gaps between consecutive transactions
      const gaps: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        gaps.push(timestamps[i] - timestamps[i - 1]);
      }

      // Check for regular intervals (gaps clustered around same value)
      const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgGap;

      // Low coefficient of variation = regular intervals
      if (coefficientOfVariation < 0.3 && avgGap > 60) {
        // Regular intervals detected
        const intervalMinutes = Math.round(avgGap / 60);
        const intervalHours = avgGap / 3600;
        
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (intervalHours >= 23 && intervalHours <= 25) {
          severity = 'HIGH'; // Daily pattern
        } else if (intervalHours >= 0.9 && intervalHours <= 1.1) {
          severity = 'HIGH'; // Hourly pattern
        } else if (gaps.length >= 10) {
          severity = 'MEDIUM'; // Many regular transactions
        }

        signals.push({
          id: 'timing-regular-interval',
          name: 'Regular Transaction Interval',
          severity,
          confidence: 0.85,
          category: 'behavioral',
          reason: `Transactions happen at regular ${intervalMinutes < 60 ? `${intervalMinutes}-minute` : `${intervalHours.toFixed(1)}-hour`} intervals. This clock-like pattern is a strong signal of automation or a fixed schedule.`,
          impact: 'Regular timing is one of the easiest patterns to spot. It can reveal your timezone, daily routine, or that you are running a bot — all of which help identify you.',
          mitigation: 'Add random delays between transactions. Even small variations in timing make the pattern much harder to detect.',
          evidence: [{
            description: `${gaps.length} transactions with average ${intervalMinutes}-minute intervals (${(coefficientOfVariation * 100).toFixed(1)}% variation)`,
            severity,
            reference: undefined,
          }],
        });
      }
    }
  }

  // Case 3: Timezone pattern (transactions clustered in certain hours)
  if (context.transactions && context.transactions.length >= 10) {
    const timestamps = context.transactions
      .map(tx => tx.blockTime)
      .filter((time): time is number => time !== undefined);

    if (timestamps.length >= 10) {
      // Get hour of day for each transaction (UTC)
      const hours = timestamps.map(ts => new Date(ts * 1000).getUTCHours());
      
      // Count transactions per hour
      const hourCounts = new Map<number, number>();
      hours.forEach(hour => {
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      // Find most active hours
      const maxCount = Math.max(...Array.from(hourCounts.values()));
      const concentration = maxCount / hours.length;

      if (concentration > 0.4) {
        const mostActiveHours = Array.from(hourCounts.entries())
          .filter(([_, count]) => count >= maxCount * 0.8)
          .map(([hour]) => hour)
          .sort((a, b) => a - b);

        signals.push({
          id: 'timing-timezone-pattern',
          name: 'Consistent Time-of-Day Pattern',
          severity: 'MEDIUM',
          confidence: 0.7,
          category: 'behavioral',
          reason: `${Math.round(concentration * 100)}% of transactions happen during the same hours of the day (${mostActiveHours.map(h => `${h}:00`).join(', ')} UTC). This reveals when you are active and hints at your timezone.`,
          impact: 'If most of your transactions happen at the same time every day, someone can figure out your timezone and daily schedule. This narrows down who you might be.',
          mitigation: 'Send transactions at different times of day. If you use automation, add random time offsets so your activity does not cluster in the same hours.',
          evidence: [{
            description: `${maxCount}/${hours.length} transactions during ${mostActiveHours.length} hour(s)`,
            severity: 'MEDIUM',
            reference: undefined,
          }],
        });
      }
    }
  }

  return signals;
}

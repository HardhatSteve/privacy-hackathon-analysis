import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect staking delegation patterns
 *
 * Validator choice is public on Solana. If multiple "unrelated" wallets
 * all delegate to the same uncommon validator, they are likely the same entity.
 * Regular staking timing also reveals automation or habitual behavior.
 */
export function detectStakingDelegationPatterns(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  const stakeInstructions = context.instructions.filter(inst => inst.category === 'stake');

  if (stakeInstructions.length < 2) {
    return signals;
  }

  // Signal 1: Concentrated delegation to few validators
  const validatorDelegations = new Map<string, { count: number; signatures: string[] }>();

  for (const inst of stakeInstructions) {
    if (!inst.accounts || inst.accounts.length === 0) continue;

    // In stake instructions, try to identify the vote account (validator)
    const voteAccount = (inst.data?.voteAccount as string | undefined)
      ?? (inst.accounts.length >= 2 ? inst.accounts[1] : undefined);

    if (voteAccount) {
      if (!validatorDelegations.has(voteAccount)) {
        validatorDelegations.set(voteAccount, { count: 0, signatures: [] });
      }
      const entry = validatorDelegations.get(voteAccount)!;
      entry.count++;
      if (entry.signatures.length < 3) {
        entry.signatures.push(inst.signature);
      }
    }
  }

  const validators = Array.from(validatorDelegations.entries())
    .sort((a, b) => b[1].count - a[1].count);

  if (validators.length > 0 && validators.length <= 2 && stakeInstructions.length >= 3) {
    const evidence: Evidence[] = validators.map(([validator, data]) => {
      const label = context.labels.get(validator);
      return {
        description: `Delegated to ${validator.slice(0, 8)}...${label ? ` (${label.name})` : ''} ${data.count} time(s)`,
        severity: 'MEDIUM' as const,
        reference: `https://solscan.io/account/${validator}`,
      };
    });

    signals.push({
      id: 'stake-delegation-pattern',
      name: 'Concentrated Staking Delegation',
      severity: 'MEDIUM',
      category: 'behavioral',
      confidence: 0.7,
      reason: `All staking activity is concentrated on ${validators.length} validator(s). If someone knows which validator(s) you stake with, they can identify your staking transactions. Using uncommon validators makes this even more distinctive.`,
      impact: 'Staking with the same small set of validators creates a behavioral pattern that links your stake accounts together.',
      mitigation: 'Consider delegating to multiple validators across different stake accounts. Use well-known validators to blend in with other stakers.',
      evidence,
    });
  }

  // Signal 2: Regular staking timing
  const stakeTimestamps = stakeInstructions
    .map(inst => inst.blockTime)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);

  if (stakeTimestamps.length >= 4) {
    const gaps: number[] = [];
    for (let i = 1; i < stakeTimestamps.length; i++) {
      gaps.push(stakeTimestamps[i] - stakeTimestamps[i - 1]);
    }

    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgGap > 0 ? stdDev / avgGap : Infinity;

    // Low coefficient of variation = regular timing
    if (cv < 0.3 && avgGap > 3600) {
      const intervalHours = Math.round(avgGap / 3600);

      signals.push({
        id: 'stake-timing-correlation',
        name: 'Regular Staking Schedule',
        severity: 'LOW',
        category: 'behavioral',
        confidence: 0.6,
        reason: `Staking operations happen roughly every ${intervalHours} hour(s). This regular schedule could help someone identify your transactions because most people do not stake at exact intervals.`,
        impact: 'Regular staking timing reveals automation or habitual behavior, making your transactions easier to pick out from the crowd.',
        mitigation: 'Add some randomness to when you stake. Avoid staking at the exact same time each day or week.',
        evidence: [{
          description: `${stakeTimestamps.length} stake operations at ~${intervalHours}-hour intervals (${(cv * 100).toFixed(1)}% variation)`,
          severity: 'LOW',
        }],
      });
    }
  }

  return signals;
}

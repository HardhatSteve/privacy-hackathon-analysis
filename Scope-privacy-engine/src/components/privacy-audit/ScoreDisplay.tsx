'use client';

import type { RiskLevel } from './types';

/**
 * ScoreDisplay - Premium score visualization
 * ElevenLabs-style with large typography and elegant badges
 */

interface ScoreDisplayProps {
  score: number;
  riskLevel: RiskLevel;
  riskDescription: string;
  walletAddress: string;
  transactionsAnalyzed: number;
}

const riskStyles: Record<RiskLevel, { bg: string; text: string; ring: string }> = {
  LOW: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-200',
  },
  MEDIUM: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  HIGH: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
  },
  CRITICAL: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-300',
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function ScoreDisplay({
  score,
  riskLevel,
  riskDescription,
  walletAddress,
  transactionsAnalyzed,
}: ScoreDisplayProps) {
  const styles = riskStyles[riskLevel] ?? riskStyles.HIGH;
  const scoreColor = getScoreColor(score);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${styles.bg} ${styles.text} ${styles.ring}`}>
          {riskLevel} RISK
        </span>
      </div>

      {/* Main Score */}
      <div className="text-center py-8">
        <div className="inline-flex items-baseline gap-2">
          <span className={`text-8xl font-black tabular-nums ${scoreColor}`}>
            {score}
          </span>
          <span className="text-3xl font-medium text-gray-300">/100</span>
        </div>
        <p className="text-gray-500 mt-4 max-w-lg mx-auto">
          {riskDescription}
        </p>
      </div>

      {/* Wallet Info */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Wallet Address
            </p>
            <p className="font-mono text-sm text-gray-700 break-all">
              {walletAddress}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Transactions
            </p>
            <p className="text-sm font-semibold text-gray-700">
              {transactionsAnalyzed} analyzed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

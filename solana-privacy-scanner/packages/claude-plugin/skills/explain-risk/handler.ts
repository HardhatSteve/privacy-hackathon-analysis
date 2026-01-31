/**
 * explain-risk skill handler (simplified version)
 *
 * Provides brief explanations of privacy risks
 */

import type { SkillResult } from '../../src/types.js';

export interface ExplainRiskOptions {
  riskId?: string;
  list?: boolean;
  verbose?: boolean;
}

interface RiskBrief {
  id: string;
  name: string;
  severity: string;
  overview: string;
  why: string;
  fix: string[];
}

/**
 * Concise risk explanations (lightweight)
 */
const RISKS: Record<string, RiskBrief> = {
  'fee-payer-reuse': {
    id: 'fee-payer-reuse',
    name: 'Fee Payer Reuse',
    severity: 'CRITICAL',
    overview:
      'One wallet pays transaction fees for multiple accounts, creating a permanent on-chain link between them.',
    why: 'When a single fee payer funds multiple accounts, it proves they\'re controlled by the same entity, enabling powerful deanonymization.',
    fix: [
      'Have each account pay its own fees',
      'Rotate fee payers if external funding is needed',
    ],
  },

  'fee-payer-never-self': {
    id: 'fee-payer-never-self',
    name: 'Never Self-Pays Fees',
    severity: 'HIGH',
    overview:
      'Account never pays its own fees, always relying on external fee payers.',
    why: 'Reveals the account is funded and controlled by an external entity.',
    fix: [
      'Fund accounts with SOL so they can pay their own fees',
      'Use per-user fee payer delegation instead of shared payer',
    ],
  },

  'signer-overlap': {
    id: 'signer-overlap',
    name: 'Signer Overlap',
    severity: 'HIGH',
    overview:
      'Same combination of signers appears across multiple transactions.',
    why: 'Repeated signer patterns prove accounts are controlled by the same entities.',
    fix: [
      'Rotate signer keys for different operations',
      'Use unique authority keys per account',
    ],
  },

  'memo-pii': {
    id: 'memo-pii',
    name: 'PII in Transaction Memos',
    severity: 'CRITICAL',
    overview:
      'Transaction memos contain personally identifiable information like emails or names.',
    why: 'Memos are permanently on-chain. PII in memos directly links real-world identities to wallet addresses.',
    fix: [
      'Never put PII in transaction memos',
      'Use reference IDs or hashes instead',
    ],
  },

  'address-reuse': {
    id: 'address-reuse',
    name: 'Address Reuse',
    severity: 'MEDIUM',
    overview: 'Same address used repeatedly instead of rotating.',
    why: 'Reusing addresses makes transaction history linkable over time.',
    fix: [
      'Generate new addresses for each transaction',
      'Use HD wallets with derivation paths',
    ],
  },

  'known-entity-cex': {
    id: 'known-entity-cex',
    name: 'CEX Interaction',
    severity: 'HIGH',
    overview: 'Wallet directly interacts with centralized exchange addresses.',
    why: 'CEXs have KYC data that links transactions to your real identity.',
    fix: [
      'Use intermediary wallets between CEX and personal wallets',
      'Avoid direct CEX to personal wallet transfers',
    ],
  },

  'counterparty-reuse': {
    id: 'counterparty-reuse',
    name: 'Counterparty Reuse',
    severity: 'MEDIUM',
    overview:
      'Wallet repeatedly transacts with the same counterparty addresses.',
    why: 'Repeated interactions reveal relationships and behavioral patterns.',
    fix: [
      'Diversify counterparties when possible',
      'Use fresh addresses for different relationships',
    ],
  },

  'instruction-fingerprint': {
    id: 'instruction-fingerprint',
    name: 'Instruction Fingerprinting',
    severity: 'MEDIUM',
    overview:
      'Unique program call patterns create an identifying fingerprint.',
    why: 'Specific sequences of program calls create a trackable pattern.',
    fix: [
      'Vary the order of operations when possible',
      'Avoid unique transaction templates',
    ],
  },

  'token-account-lifecycle': {
    id: 'token-account-lifecycle',
    name: 'Token Account Lifecycle Tracking',
    severity: 'MEDIUM',
    overview:
      'Token account closures link accounts through rent refunds.',
    why: 'If the same address receives multiple rent refunds, it links those token accounts together.',
    fix: [
      'Use different refund destinations for different accounts',
      'Rotate rent refund recipient addresses',
    ],
  },

  'timing-patterns': {
    id: 'timing-patterns',
    name: 'Timing Patterns',
    severity: 'MEDIUM',
    overview: 'Transactions occur in predictable time patterns.',
    why: 'Regular schedules or burst patterns create unique fingerprints.',
    fix: [
      'Add random delays between transactions',
      'Avoid predictable schedules',
    ],
  },

  'amount-reuse': {
    id: 'amount-reuse',
    name: 'Amount Reuse',
    severity: 'LOW',
    overview: 'Same transaction amounts used repeatedly.',
    why: 'Repeated amounts can help link transactions.',
    fix: [
      'Use varied amounts when possible',
      'Add small random variations to transfers',
    ],
  },

  'balance-traceability': {
    id: 'balance-traceability',
    name: 'Balance Traceability',
    severity: 'MEDIUM',
    overview:
      'Balance changes create a traceable flow of funds between accounts.',
    why: 'Following balance changes can reveal ownership relationships.',
    fix: [
      'Use multiple intermediate accounts',
      'Vary timing and amounts to obscure flows',
    ],
  },
};

/**
 * Explain a privacy risk (exported for API use)
 */
export async function explainRisk(
  options: ExplainRiskOptions
): Promise<SkillResult> {
  const riskId = options.riskId;

  if (!riskId) {
    return {
      success: false,
      error: 'Risk ID required. Example: /explain-risk fee-payer-reuse',
    };
  }

  const risk = RISKS[riskId];

  if (!risk) {
    const availableRisks = Object.keys(RISKS).join(', ');
    return {
      success: false,
      error: `Unknown risk: ${riskId}. Available: ${availableRisks}`,
    };
  }

  // Format output (concise, 3 sections only)
  const output = `
# ${risk.name} (${risk.severity})

## Overview
${risk.overview}

## Why It Matters
${risk.why}

## How to Fix
${risk.fix.map((step) => `- ${step}`).join('\n')}

---
For code examples: /suggest-fix ${risk.id}
`.trim();

  return {
    success: true,
    message: output,
    data: {
      riskId: risk.id,
      severity: risk.severity,
    },
  };
}

/**
 * Skill handler (called by Claude Code)
 */
export async function handler(
  args: string[],
  options: ExplainRiskOptions
): Promise<SkillResult> {
  // Get risk ID from options or args
  const riskId = options.riskId || args[0];

  return explainRisk({ ...options, riskId });
}

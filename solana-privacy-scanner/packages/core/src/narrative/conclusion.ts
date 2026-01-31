import type { PrivacyReport } from '../types/index.js';
import type { IdentifiabilityLevel, AdversaryStatement } from './types.js';

/**
 * Determine identifiability level based on detected signals
 */
export function determineIdentifiability(report: PrivacyReport): IdentifiabilityLevel {
  const { signals, overallRisk, summary } = report;

  // Check for direct identity signals
  const hasExchangeInteraction = signals.some((s) => s.id === 'known-entity-exchange');
  const hasDomainLinkage = signals.some((s) => s.id === 'domain-name-linkage');
  const hasPIIInMemos = signals.some((s) => s.id === 'memo-pii-exposure');
  const hasNeverSelfPays = signals.some((s) => s.id === 'fee-payer-never-self');

  // Fully identified: direct identity exposure
  if (hasPIIInMemos && hasExchangeInteraction) {
    return 'fully-identified';
  }
  if (hasDomainLinkage && hasExchangeInteraction) {
    return 'fully-identified';
  }

  // Identifiable: strong paths to identity
  if (hasExchangeInteraction || hasDomainLinkage || hasPIIInMemos) {
    return 'identifiable';
  }

  // Check for strong linkage patterns
  const hasStrongLinkage = signals.some(
    (s) =>
      s.id === 'fee-payer-never-self' ||
      s.id === 'signer-authority-hub' ||
      s.id === 'ata-creator-linkage'
  );

  if (hasStrongLinkage && summary.highRiskSignals >= 2) {
    return 'identifiable';
  }

  // Pseudonymous: patterns exist but no direct identity link
  if (overallRisk === 'HIGH' || overallRisk === 'MEDIUM') {
    return 'pseudonymous';
  }

  if (summary.totalSignals > 0) {
    return 'pseudonymous';
  }

  // Anonymous: no significant signals
  return 'anonymous';
}

/**
 * Generate conclusion text based on identifiability and findings
 */
export function generateConclusion(
  report: PrivacyReport,
  statements: AdversaryStatement[],
  identifiability: IdentifiabilityLevel
): string {
  const categoryCount = new Set(statements.map((s) => s.category)).size;
  const highCount = statements.filter((s) => s.severity === 'HIGH').length;

  const conclusions: Record<IdentifiabilityLevel, string[]> = {
    'fully-identified': [
      `In summary, I can confidently identify the owner of this wallet. With direct exchange interactions combined with personal information exposure, the on-chain pseudonym is broken. The ${highCount} critical issues detected provide multiple pathways to real-world identification.`,
      `This wallet is fully identified. Through ${categoryCount} categories of privacy leaks, I have established clear links between this on-chain address and real-world identity. The privacy damage is complete and permanent.`,
    ],
    identifiable: [
      `This wallet is identifiable through ${highCount} high-severity privacy issues. While I may not have a name yet, there are clear pathways - likely through exchange records or domain registration - that could reveal the owner's identity with minimal additional investigation.`,
      `I can likely identify this wallet's owner. The patterns across ${categoryCount} categories create enough data points that, combined with external records, would reveal their identity. The wallet operates more like a named account than an anonymous one.`,
    ],
    pseudonymous: [
      `This wallet maintains pseudonymity but has revealing patterns. Across ${categoryCount} categories, I found behavioral fingerprints and connections that distinguish this user from others. While not immediately identifiable, these patterns could be used to link this wallet to other activities or narrow down the owner's identity.`,
      `The wallet is pseudonymous - not anonymous. I cannot immediately identify the owner, but the ${statements.length} patterns detected create a profile that could be matched against other data sources or used to connect this wallet to the same owner's other activities.`,
    ],
    anonymous: [
      'This wallet maintains reasonable anonymity. While some minor patterns exist, there are no critical privacy issues that would allow identification. The owner practices good privacy hygiene.',
      'I found no significant privacy leaks. This wallet blends in with normal activity and would be difficult to distinguish or identify from on-chain data alone.',
    ],
  };

  const options = conclusions[identifiability];
  // Deterministic selection based on signal count
  return options[report.summary.totalSignals % options.length];
}

/**
 * Get a human-readable description of identifiability level
 */
export function getIdentifiabilityDescription(level: IdentifiabilityLevel): string {
  const descriptions: Record<IdentifiabilityLevel, string> = {
    'fully-identified':
      'Direct pathways to real-world identity exist through KYC exchanges and personal information exposure.',
    identifiable:
      'Strong linkage to identity through exchanges, domains, or exposed personal information.',
    pseudonymous:
      'Behavioral patterns exist that distinguish this wallet, but no direct identity link.',
    anonymous:
      'Minimal distinguishing characteristics; wallet blends in with normal activity.',
  };
  return descriptions[level];
}

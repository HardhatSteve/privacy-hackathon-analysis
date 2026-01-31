import type { ScanContext, RiskSignal, RiskLevel, PrivacyReport } from '../types/index.js';
import {
  detectCounterpartyReuse,
  detectTimingPatterns,
  detectKnownEntityInteraction,
  detectFeePayerReuse,
  detectSignerOverlap,
  detectInstructionFingerprinting,
  detectTokenAccountLifecycle,
  detectMemoExposure,
  detectAddressReuse,
  detectPriorityFeeFingerprinting,
  detectATALinkage,
  detectStakingDelegationPatterns,
  detectIdentityMetadataExposure,
  detectLocationInference,
} from '../heuristics/index.js';

/**
 * Current report schema version
 */
const REPORT_VERSION = '1.0.0';

/**
 * All available heuristic functions
 */
const HEURISTICS = [
  // Solana-specific (highest priority)
  detectFeePayerReuse,
  detectSignerOverlap,
  detectMemoExposure,
  detectIdentityMetadataExposure,
  detectATALinkage,
  detectAddressReuse,
  detectKnownEntityInteraction,
  detectCounterpartyReuse,
  detectInstructionFingerprinting,
  detectTokenAccountLifecycle,
  detectPriorityFeeFingerprinting,
  detectStakingDelegationPatterns,
  // Timing analysis
  detectTimingPatterns,
  // Location inference (requires more data)
  detectLocationInference,
];

/**
 * Calculate overall risk level from individual signals
 * Uses deterministic scoring based on severity and count
 */
function calculateOverallRisk(signals: RiskSignal[]): RiskLevel {
  if (signals.length === 0) {
    return 'LOW';
  }

  // Count signals by severity
  const highCount = signals.filter(s => s.severity === 'HIGH').length;
  const mediumCount = signals.filter(s => s.severity === 'MEDIUM').length;
  const lowCount = signals.filter(s => s.severity === 'LOW').length;

  // Deterministic thresholds
  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
    return 'HIGH';
  }

  if (highCount >= 1 || mediumCount >= 2 || (mediumCount >= 1 && lowCount >= 2)) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Generate general mitigation recommendations based on detected signals
 */
function generateMitigations(signals: RiskSignal[]): string[] {
  const mitigations = new Set<string>();

  if (signals.length === 0) {
    return ['Continue practicing good privacy hygiene to maintain low exposure.'];
  }

  // Add general recommendations
  mitigations.add('Consider using multiple wallets to compartmentalize different activities.');
  
  // Check for specific signal types and add relevant mitigations
  const signalIds = new Set(signals.map(s => s.id));

  // Solana-specific mitigations
  if (signalIds.has('fee-payer-never-self') || signalIds.has('fee-payer-external')) {
    mitigations.add('Always pay your own transaction fees to avoid linkage.');
  }

  if (signalIds.has('signer-repeated') || signalIds.has('signer-set-reuse')) {
    mitigations.add('Use separate signing keys for unrelated activities.');
  }

  if (signalIds.has('instruction-sequence-pattern') || signalIds.has('program-usage-profile')) {
    mitigations.add('Diversify transaction patterns and protocols to reduce behavioral fingerprinting.');
  }

  if (signalIds.has('token-account-churn') || signalIds.has('rent-refund-clustering')) {
    mitigations.add('Avoid closing token accounts if privacy is important - the rent refund creates linkage.');
  }

  if (signalIds.has('memo-pii-exposure') || signalIds.has('memo-descriptive-content') || signalIds.has('memo-usage')) {
    mitigations.add('Never include personal information in transaction memos - they are permanently public.');
  }

  if (signalIds.has('address-high-diversity') || signalIds.has('address-moderate-diversity') || signalIds.has('address-long-term-usage')) {
    mitigations.add('Use separate addresses for different activity types to compartmentalize your behavior.');
  }

  // Traditional mitigations
  if (signalIds.has('known-entity-exchange') || signalIds.has('known-entity-bridge') || signalIds.has('known-entity-other') || signalIds.has('known-entity-interaction')) {
    mitigations.add('Avoid direct interactions between privacy-sensitive wallets and KYC services.');
  }

  if (signalIds.has('counterparty-reuse') || signalIds.has('pda-reuse') || signalIds.has('instruction-pda-reuse')) {
    mitigations.add('Use different addresses for different counterparties or contexts.');
  }

  if (signalIds.has('timing-burst') || signalIds.has('timing-regular-interval') || signalIds.has('timing-timezone-pattern') || signalIds.has('timing-correlation')) {
    mitigations.add('Introduce timing delays and vary transaction patterns to reduce correlation.');
  }

  if (signalIds.has('priority-fee-consistent') || signalIds.has('compute-budget-fingerprint')) {
    mitigations.add('Vary your priority fees and compute budget between transactions to avoid creating a recognizable pattern.');
  }

  if (signalIds.has('ata-creator-linkage') || signalIds.has('ata-funding-pattern')) {
    mitigations.add('Have each wallet create and fund its own token accounts rather than using a central wallet to set them up.');
  }

  if (signalIds.has('stake-delegation-pattern') || signalIds.has('stake-timing-correlation')) {
    mitigations.add('Spread staking across multiple validators and vary the timing of staking operations.');
  }

  if (signalIds.has('nft-metadata-exposure') || signalIds.has('domain-name-linkage')) {
    mitigations.add('Use a dedicated wallet for NFT creation and domain registration that is separate from your other activities.');
  }

  // Always add this general advice
  mitigations.add('Research and consider privacy-preserving protocols when available.');

  return Array.from(mitigations);
}

/**
 * Evaluate all heuristics against a scan context
 */
export function evaluateHeuristics(context: ScanContext): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const heuristic of HEURISTICS) {
    try {
      const result = heuristic(context);
      // Handle both array and single/null returns for backwards compatibility
      if (Array.isArray(result)) {
        signals.push(...result);
      } else if (result) {
        signals.push(result);
      }
    } catch (error) {
      // Log but don't fail if a heuristic errors
      console.warn(`Heuristic evaluation failed:`, error);
    }
  }

  // Sort signals by severity (HIGH -> MEDIUM -> LOW) for deterministic ordering
  signals.sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return signals;
}

/**
 * Generate a complete privacy report from a scan context
 */
export function generateReport(context: ScanContext): PrivacyReport {
  // Evaluate all heuristics
  const signals = evaluateHeuristics(context);

  // Calculate overall risk
  const overallRisk = calculateOverallRisk(signals);

  // Count signals by severity
  const highRiskSignals = signals.filter(s => s.severity === 'HIGH').length;
  const mediumRiskSignals = signals.filter(s => s.severity === 'MEDIUM').length;
  const lowRiskSignals = signals.filter(s => s.severity === 'LOW').length;

  // Generate mitigations
  const mitigations = generateMitigations(signals);

  // Extract known entities from context
  const knownEntities = Array.from(context.labels.values());

  return {
    version: REPORT_VERSION,
    timestamp: Date.now(),
    targetType: context.targetType,
    target: context.target,
    overallRisk,
    signals,
    summary: {
      totalSignals: signals.length,
      highRiskSignals,
      mediumRiskSignals,
      lowRiskSignals,
      transactionsAnalyzed: context.transactionCount,
    },
    mitigations,
    knownEntities,
  };
}

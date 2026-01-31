import type { RiskSignal } from './signal.js';
import type { Label } from './label.js';

/**
 * Overall privacy risk level
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Complete privacy analysis report
 */
export interface PrivacyReport {
  /**
   * Schema version for forward compatibility
   */
  version: string;

  /**
   * Timestamp when the scan was performed
   */
  timestamp: number;

  /**
   * Type of target that was scanned
   */
  targetType: 'wallet' | 'transaction' | 'program';

  /**
   * The address/signature/programId that was scanned
   */
  target: string;

  /**
   * Overall aggregated risk level
   */
  overallRisk: RiskLevel;

  /**
   * Individual risk signals detected during analysis
   */
  signals: RiskSignal[];

  /**
   * Summary statistics about the scan
   */
  summary: {
    totalSignals: number;
    highRiskSignals: number;
    mediumRiskSignals: number;
    lowRiskSignals: number;
    transactionsAnalyzed: number;
  };

  /**
   * General mitigation recommendations
   */
  mitigations: string[];

  /**
   * Known entities detected during the scan
   */
  knownEntities: Label[];
}

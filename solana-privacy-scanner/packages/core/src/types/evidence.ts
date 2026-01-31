/**
 * Types of evidence that can support a risk signal
 */
export type EvidenceType = 
  | 'transaction'
  | 'address'
  | 'amount'
  | 'timing'
  | 'pattern'
  | 'label';

/**
 * Concrete evidence supporting a privacy risk signal
 */
export interface Evidence {
  /**
   * Human-readable description of the evidence
   */
  description: string;

  /**
   * Severity level of this specific evidence
   */
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';

  /**
   * Optional reference (transaction signature, address, etc.)
   */
  reference?: string;

  /**
   * Type of evidence (optional, for backwards compatibility)
   */
  type?: EvidenceType;

  /**
   * Structured data supporting the evidence (optional, for backwards compatibility)
   */
  data?: Record<string, unknown>;
}

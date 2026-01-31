/**
 * Severity levels for privacy issues
 */
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Types of privacy issues that can be detected
 */
export type IssueType =
  | 'fee-payer-reuse'
  | 'memo-pii'
  | 'known-entity'
  | 'signer-overlap'
  | 'round-amount'
  | 'address-reuse';

/**
 * A detected privacy issue in code
 */
export interface Issue {
  /** Type of privacy issue */
  type: IssueType;

  /** Severity of the issue */
  severity: IssueSeverity;

  /** File path where issue was found */
  file: string;

  /** Line number (1-indexed) */
  line: number;

  /** Column number (1-indexed) */
  column: number;

  /** Human-readable message explaining the issue */
  message: string;

  /** Suggested fix for the issue */
  suggestion: string;

  /** Code snippet showing the problematic code */
  codeSnippet: string;

  /** Optional: Variable name or identifier involved */
  identifier?: string;

  /** Optional: Number of times pattern occurs */
  occurrences?: number;
}

/**
 * Result of analyzing code
 */
export interface AnalyzerResult {
  /** All detected issues */
  issues: Issue[];

  /** Summary statistics */
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };

  /** Files analyzed */
  filesAnalyzed: number;

  /** Timestamp of analysis */
  timestamp: number;
}

/**
 * Configuration options for analyzer
 */
export interface AnalyzerOptions {
  /** File patterns to include */
  include?: string[];

  /** File patterns to exclude */
  exclude?: string[];

  /** Whether to include low severity issues */
  includeLow?: boolean;

  /** Maximum file size to analyze (bytes) */
  maxFileSize?: number;
}

/**
 * Location in source code
 */
export interface SourceLocation {
  line: number;
  column: number;
  file: string;
}

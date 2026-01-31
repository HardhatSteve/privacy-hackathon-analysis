/**
 * Solana Privacy Analyzer
 *
 * Static code analyzer for detecting privacy vulnerabilities in
 * Solana TypeScript/JavaScript code.
 */

// Export main analyzer
export { SolanaPrivacyAnalyzer, analyze } from './analyzer.js';

// Export types
export type {
  Issue,
  IssueType,
  IssueSeverity,
  AnalyzerResult,
  AnalyzerOptions,
  SourceLocation
} from './types.js';

// Export detectors (for custom usage)
export { detectFeePayerReuseInCode } from './detectors/fee-payer-reuse.js';
export { detectMemoPII, getMemoRecommendations } from './detectors/memo-pii.js';

// Export utilities
export { groupIssuesByFile, sortIssues } from './utils.js';

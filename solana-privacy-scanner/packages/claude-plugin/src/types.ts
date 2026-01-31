/**
 * Shared TypeScript types for the Claude Code plugin
 */

import type { PrivacyReport, PrivacySignal, AnalyzerResult, Issue } from 'solana-privacy-scanner-core';

/**
 * Skill execution result
 */
export interface SkillResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Formatted analysis result for display
 */
export interface FormattedAnalysisResult {
  summary: string;
  issues: FormattedIssue[];
  suggestions: string[];
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

/**
 * Formatted issue with location and details
 */
export interface FormattedIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  file: string;
  line: number;
  column: number;
  codeSnippet?: string;
  suggestion?: string;
}

/**
 * Formatted privacy report for display
 */
export interface FormattedPrivacyReport {
  summary: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: FormattedSignal[];
  mitigations: string[];
  knownEntities: string[];
  stats: {
    totalSignals: number;
    highRiskSignals: number;
    mediumRiskSignals: number;
    lowRiskSignals: number;
    transactionsAnalyzed: number;
  };
}

/**
 * Formatted privacy signal
 */
export interface FormattedSignal {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  name: string;
  reason: string;
  evidence: string[];
  mitigation?: string;
}

/**
 * Risk explanation
 */
export interface RiskExplanation {
  riskId: string;
  name: string;
  description: string;
  whyItMatters: string;
  realWorldExample: string;
  prevention: string;
  resources: string[];
}

/**
 * Code fix suggestion
 */
export interface CodeFixSuggestion {
  file: string;
  line: number;
  issueType: string;
  before: string;
  after: string;
  explanation: string;
  alternatives?: string[];
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  verbose?: boolean;
  rpcUrl?: string;
  maxSignatures?: number;
  includeLowSeverity?: boolean;
}

// Re-export types from core
export type { PrivacyReport, PrivacySignal, AnalyzerResult, Issue };

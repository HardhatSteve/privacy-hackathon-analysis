/**
 * Output formatting utilities for Claude Code plugin
 */

import type {
  AnalyzerResult,
  Issue,
  PrivacyReport,
  PrivacySignal,
  FormattedAnalysisResult,
  FormattedPrivacyReport,
  FormattedIssue,
  FormattedSignal,
} from './types.js';

/**
 * Format analyzer results for display in Claude Code
 */
export function formatAnalyzerResult(result: AnalyzerResult): FormattedAnalysisResult {
  const formattedIssues: FormattedIssue[] = result.issues.map((issue: Issue) => ({
    severity: issue.severity,
    type: issue.type,
    message: issue.message,
    file: issue.file,
    line: issue.line,
    column: issue.column,
    codeSnippet: issue.codeSnippet,
    suggestion: issue.suggestion,
  }));

  const summary = createAnalysisSummary(result);

  return {
    summary,
    issues: formattedIssues,
    suggestions: extractSuggestions(result.issues),
    totalIssues: result.summary.total,
    criticalCount: result.summary.critical,
    highCount: result.summary.high,
    mediumCount: result.summary.medium,
    lowCount: result.summary.low,
  };
}

/**
 * Format privacy report for display in Claude Code
 */
export function formatPrivacyReport(report: PrivacyReport): FormattedPrivacyReport {
  const formattedSignals: FormattedSignal[] = report.signals.map((signal: PrivacySignal) => ({
    severity: signal.severity,
    name: signal.name,
    reason: signal.reason,
    evidence: formatEvidence(signal.evidence),
    mitigation: signal.mitigation,
  }));

  const summary = createReportSummary(report);

  return {
    summary,
    overallRisk: report.overallRisk,
    signals: formattedSignals,
    mitigations: report.mitigations,
    knownEntities: report.knownEntities.map((e: any) => `${e.name} (${e.type})`),
    stats: {
      totalSignals: report.summary.totalSignals,
      highRiskSignals: report.summary.highRiskSignals,
      mediumRiskSignals: report.summary.mediumRiskSignals,
      lowRiskSignals: report.summary.lowRiskSignals,
      transactionsAnalyzed: report.summary.transactionsAnalyzed,
    },
  };
}

/**
 * Create markdown-formatted analysis summary
 */
function createAnalysisSummary(result: AnalyzerResult): string {
  const lines: string[] = [];

  lines.push(`# Static Analysis Results`);
  lines.push('');
  lines.push(`Files analyzed: **${result.filesAnalyzed}**`);
  lines.push(`Total issues: **${result.summary.total}**`);
  lines.push('');

  if (result.summary.critical > 0) {
    lines.push(`🔴 **CRITICAL:** ${result.summary.critical}`);
  }
  if (result.summary.high > 0) {
    lines.push(`🟡 **HIGH:** ${result.summary.high}`);
  }
  if (result.summary.medium > 0) {
    lines.push(`🔵 **MEDIUM:** ${result.summary.medium}`);
  }
  if (result.summary.low > 0) {
    lines.push(`⚪ **LOW:** ${result.summary.low}`);
  }

  if (result.summary.total === 0) {
    lines.push('');
    lines.push('✅ **No privacy issues detected!**');
  }

  return lines.join('\n');
}

/**
 * Create markdown-formatted privacy report summary
 */
function createReportSummary(report: PrivacyReport): string {
  const lines: string[] = [];

  lines.push(`# Privacy Scan Results`);
  lines.push('');
  lines.push(`Target: **${report.target}**`);
  lines.push(`Type: **${report.targetType}**`);
  lines.push(`Overall Risk: **${report.overallRisk}**`);
  lines.push('');

  lines.push(`## Statistics`);
  lines.push(`- Transactions analyzed: ${report.summary.transactionsAnalyzed}`);
  lines.push(`- Total signals: ${report.summary.totalSignals}`);
  if (report.summary.highRiskSignals > 0) {
    lines.push(`- 🔴 HIGH risk: ${report.summary.highRiskSignals}`);
  }
  if (report.summary.mediumRiskSignals > 0) {
    lines.push(`- 🟡 MEDIUM risk: ${report.summary.mediumRiskSignals}`);
  }
  if (report.summary.lowRiskSignals > 0) {
    lines.push(`- 🔵 LOW risk: ${report.summary.lowRiskSignals}`);
  }

  if (report.knownEntities.length > 0) {
    lines.push('');
    lines.push(`## Known Entity Interactions`);
    report.knownEntities.forEach((entity: any) => {
      lines.push(`- ${entity.name} (${entity.type})`);
    });
  }

  return lines.join('\n');
}

/**
 * Format evidence array into readable strings
 */
function formatEvidence(evidence: any[]): string[] {
  return evidence.map(ev => {
    if (typeof ev === 'string') {
      return ev;
    }
    if (ev.type === 'transaction') {
      return `Transaction: ${ev.value}`;
    }
    if (ev.type === 'address') {
      return `Address: ${ev.value}`;
    }
    if (ev.type === 'pattern') {
      return `Pattern: ${ev.value}`;
    }
    return JSON.stringify(ev);
  });
}

/**
 * Extract unique suggestions from issues
 */
function extractSuggestions(issues: Issue[]): string[] {
  const suggestions = new Set<string>();
  issues.forEach(issue => {
    if (issue.suggestion) {
      suggestions.add(issue.suggestion);
    }
  });
  return Array.from(suggestions);
}

/**
 * Format issue for display with location
 */
export function formatIssueWithLocation(issue: FormattedIssue): string {
  const severityEmoji =
    issue.severity === 'CRITICAL' ? '🔴' :
    issue.severity === 'HIGH' ? '🟡' :
    issue.severity === 'MEDIUM' ? '🔵' : '⚪';

  return `${severityEmoji} **${issue.severity}** ${issue.message} (${issue.file}:${issue.line})`;
}

/**
 * Format signal for display
 */
export function formatSignalWithDetails(signal: FormattedSignal): string {
  const lines: string[] = [];

  const severityEmoji =
    signal.severity === 'HIGH' ? '🔴' :
    signal.severity === 'MEDIUM' ? '🟡' : '🔵';

  lines.push(`${severityEmoji} **${signal.severity}** - ${signal.name}`);
  lines.push(`  ${signal.reason}`);

  if (signal.evidence.length > 0) {
    lines.push(`  Evidence:`);
    signal.evidence.slice(0, 3).forEach(ev => {
      lines.push(`    - ${ev}`);
    });
    if (signal.evidence.length > 3) {
      lines.push(`    - ... and ${signal.evidence.length - 3} more`);
    }
  }

  if (signal.mitigation) {
    lines.push(`  💡 ${signal.mitigation}`);
  }

  return lines.join('\n');
}

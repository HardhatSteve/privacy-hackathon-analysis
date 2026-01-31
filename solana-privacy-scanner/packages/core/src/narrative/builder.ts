import type { PrivacyReport, RiskSignal } from '../types/index.js';
import type {
  AdversaryNarrative,
  AdversaryStatement,
  NarrativeParagraph,
  NarrativeCategory,
  NarrativeOptions,
  RiskLevel,
} from './types.js';
import { findTemplate } from './templates.js';
import { CATEGORY_DEFINITIONS, getSignalCategory, getCategoriesInOrder } from './categories.js';
import { interpolate } from './interpolator.js';
import { selectTransition, getSeverityIndicator } from './transitions.js';
import { generateConclusion, determineIdentifiability } from './conclusion.js';

const DEFAULT_OPTIONS: Required<NarrativeOptions> = {
  includeLowSeverity: true,
  includeDetails: true,
  maxStatementsPerCategory: 5,
  format: 'text',
};

/**
 * Build an adversary statement from a signal
 */
function buildStatement(signal: RiskSignal): AdversaryStatement | null {
  const template = findTemplate(signal.id);

  if (!template) {
    // Fallback: use signal reason directly
    return {
      signalId: signal.id,
      category: getSignalCategory(signal.id),
      severity: signal.severity,
      statement: `I can determine that: ${signal.reason}`,
      details: signal.evidence.slice(0, 3).map((e) => e.description),
      confidence: signal.confidence ?? 0.7,
    };
  }

  const variables = template.extractVariables(signal);
  const statement = interpolate(template.template, variables);

  const details: string[] = [];
  if (template.detailTemplates && signal.evidence.length > 0) {
    for (let i = 0; i < Math.min(signal.evidence.length, 3); i++) {
      const ev = signal.evidence[i];
      // Extract content from evidence description for detail interpolation
      const detailVars = {
        ...variables,
        content: ev.description?.replace(/^"(.+)"$/, '$1') || '',
        reference: ev.reference || '',
      };
      const detail = interpolate(template.detailTemplates[0], detailVars);
      details.push(detail);
    }
  }

  return {
    signalId: signal.id,
    category: template.category,
    severity: signal.severity,
    statement,
    details,
    confidence: signal.confidence ?? 0.7,
  };
}

/**
 * Group statements by category
 */
function groupByCategory(
  statements: AdversaryStatement[]
): Map<NarrativeCategory, AdversaryStatement[]> {
  const groups = new Map<NarrativeCategory, AdversaryStatement[]>();

  for (const stmt of statements) {
    if (!groups.has(stmt.category)) {
      groups.set(stmt.category, []);
    }
    groups.get(stmt.category)!.push(stmt);
  }

  // Sort within each category: HIGH first, then MEDIUM, then LOW
  for (const [, stmts] of groups) {
    stmts.sort((a, b) => {
      const order: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  return groups;
}

/**
 * Build a paragraph for a category
 */
function buildParagraph(
  category: NarrativeCategory,
  statements: AdversaryStatement[],
  options: Required<NarrativeOptions>
): NarrativeParagraph {
  const def = CATEGORY_DEFINITIONS[category];

  // Limit statements
  const limited = statements.slice(0, options.maxStatementsPerCategory);

  // Select opening based on severity distribution
  const hasHigh = limited.some((s) => s.severity === 'HIGH');
  const openingIndex = hasHigh ? 0 : 1;

  return {
    category,
    title: def.title,
    opening: def.openingPhrases[openingIndex % def.openingPhrases.length],
    statements: limited,
    closing: def.closingPhrases[0],
  };
}

/**
 * Generate introduction based on overall risk
 */
function generateIntroduction(report: PrivacyReport): string {
  const { overallRisk, summary } = report;

  if (overallRisk === 'HIGH') {
    return `Based on my analysis of ${summary.transactionsAnalyzed} transactions, I can build a detailed profile of this wallet's owner. There are ${summary.highRiskSignals} critical privacy issues that could lead to identification.`;
  }

  if (overallRisk === 'MEDIUM') {
    return `After analyzing ${summary.transactionsAnalyzed} transactions, I found several privacy patterns that reveal information about this wallet's owner. While not immediately identifiable, there are ${summary.totalSignals} concerns worth addressing.`;
  }

  return `My analysis of ${summary.transactionsAnalyzed} transactions reveals ${summary.totalSignals} minor privacy patterns. This wallet maintains reasonable privacy, though some behavioral fingerprints exist.`;
}

/**
 * Format narrative as plain text
 */
function formatAsText(narrative: AdversaryNarrative, options: Required<NarrativeOptions>): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(65));
  lines.push('  WHAT DOES THE OBSERVER KNOW?');
  lines.push("  An Adversary's Perspective");
  lines.push('='.repeat(65));
  lines.push('');

  lines.push(narrative.introduction);
  lines.push('');

  for (let i = 0; i < narrative.paragraphs.length; i++) {
    const para = narrative.paragraphs[i];

    // Category header
    lines.push('-'.repeat(65));
    lines.push(`## ${para.title.toUpperCase()}`);
    lines.push('-'.repeat(65));
    lines.push('');
    lines.push(para.opening);
    lines.push('');

    // Statements
    for (let j = 0; j < para.statements.length; j++) {
      const stmt = para.statements[j];
      const prevSeverity = j > 0 ? para.statements[j - 1].severity : stmt.severity;
      const transition = selectTransition(stmt.severity, prevSeverity, j);

      // Severity indicator
      const severityIcon = getSeverityIndicator(stmt.severity);

      if (transition) {
        lines.push(`${transition} ${severityIcon} ${stmt.statement}`);
      } else {
        lines.push(`${severityIcon} ${stmt.statement}`);
      }

      // Details (indented)
      if (options.includeDetails && stmt.details.length > 0) {
        for (const detail of stmt.details) {
          lines.push(`    - ${detail}`);
        }
      }
      lines.push('');
    }

    lines.push(para.closing);
    lines.push('');
  }

  // Conclusion
  lines.push('='.repeat(65));
  lines.push('## CONCLUSION');
  lines.push('='.repeat(65));
  lines.push('');
  lines.push(narrative.conclusion);
  lines.push('');
  lines.push(`Identifiability Level: ${narrative.identifiabilityLevel.toUpperCase()}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Main narrative generation function
 *
 * Transforms a PrivacyReport into an adversary-perspective narrative
 * that explains what an observer could learn from analyzing this wallet.
 */
export function generateNarrative(
  report: PrivacyReport,
  options: NarrativeOptions = {}
): AdversaryNarrative {
  const opts: Required<NarrativeOptions> = { ...DEFAULT_OPTIONS, ...options };

  // Filter signals
  let signals = report.signals;
  if (!opts.includeLowSeverity) {
    signals = signals.filter((s) => s.severity !== 'LOW');
  }

  // Build statements
  const statements: AdversaryStatement[] = [];
  for (const signal of signals) {
    const stmt = buildStatement(signal);
    if (stmt) {
      statements.push(stmt);
    }
  }

  // Group by category
  const grouped = groupByCategory(statements);

  // Build paragraphs in priority order
  const categoryOrder = getCategoriesInOrder();
  const paragraphs: NarrativeParagraph[] = [];

  for (const category of categoryOrder) {
    const categoryStatements = grouped.get(category);
    if (categoryStatements && categoryStatements.length > 0) {
      paragraphs.push(buildParagraph(category, categoryStatements, opts));
    }
  }

  // Generate conclusion
  const identifiability = determineIdentifiability(report);
  const conclusion = generateConclusion(report, statements, identifiability);

  return {
    introduction: generateIntroduction(report),
    paragraphs,
    conclusion,
    identifiabilityLevel: identifiability,
    signalCount: signals.length,
    timestamp: Date.now(),
  };
}

/**
 * Generate narrative as formatted text
 *
 * Convenience function that generates the narrative and formats it
 * as human-readable plain text.
 */
export function generateNarrativeText(
  report: PrivacyReport,
  options: NarrativeOptions = {}
): string {
  const opts: Required<NarrativeOptions> = { ...DEFAULT_OPTIONS, ...options };
  const narrative = generateNarrative(report, opts);
  return formatAsText(narrative, opts);
}

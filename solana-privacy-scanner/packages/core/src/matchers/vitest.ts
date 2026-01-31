import { expect } from 'vitest';
import type { PrivacyReport, RiskSignal } from '../types/index.js';

/**
 * Custom Vitest matchers for privacy testing
 * 
 * @example
 * ```typescript
 * import { expect } from 'vitest';
 * import '@solana-privacy-scanner/ci-tools/matchers';
 * 
 * test('transaction privacy', async () => {
 *   const report = await analyzeTransaction(tx);
 *   expect(report).toHavePrivacyRisk('LOW');
 *   expect(report).toNotLeakUserRelationships();
 * });
 * ```
 */

interface CustomMatchers<R = unknown> {
  /**
   * Assert that a privacy report has a specific risk level
   * @param expectedRisk - Expected risk level
   */
  toHavePrivacyRisk(expectedRisk: 'LOW' | 'MEDIUM' | 'HIGH'): R;

  /**
   * Assert that a privacy report has no high-severity signals
   */
  toHaveNoHighRiskSignals(): R;

  /**
   * Assert that a privacy report doesn't leak user relationships
   */
  toNotLeakUserRelationships(): R;

  /**
   * Assert that a privacy report contains a specific signal type
   * @param signalType - Signal type to check for
   */
  toHaveSignal(signalType: string): R;

  /**
   * Assert that a privacy report does not contain a specific signal type
   * @param signalType - Signal type to check for
   */
  toNotHaveSignal(signalType: string): R;

  /**
   * Assert that a privacy report has a minimum privacy score
   * @param minScore - Minimum acceptable score (0-100)
   */
  toHavePrivacyScore(minScore: number): R;

  /**
   * Assert that a privacy report has at most N signals
   * @param maxSignals - Maximum number of signals allowed
   */
  toHaveAtMostSignals(maxSignals: number): R;

  /**
   * Assert that no known entities are detected
   */
  toHaveNoKnownEntities(): R;

  /**
   * Assert that a specific known entity type is not present
   * @param entityType - Entity type to check for (e.g., 'exchange', 'bridge')
   */
  toNotInteractWith(entityType: string): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toHavePrivacyRisk(report: PrivacyReport, expectedRisk: 'LOW' | 'MEDIUM' | 'HIGH') {
    const { overallRisk } = report;
    const pass = overallRisk === expectedRisk;

    return {
      pass,
      message: () =>
        pass
          ? `Expected privacy risk NOT to be ${expectedRisk}`
          : `Expected privacy risk to be ${expectedRisk}, but got ${overallRisk}\n` +
            `Detected signals: ${report.signals.length}\n` +
            formatSignals(report.signals),
    };
  },

  toHaveNoHighRiskSignals(report: PrivacyReport) {
    const highRiskSignals = report.signals.filter((s) => s.severity === 'HIGH');
    const pass = highRiskSignals.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected to have HIGH risk signals, but found none'
          : `Expected no HIGH risk signals, but found ${highRiskSignals.length}:\n` +
            formatSignals(highRiskSignals),
    };
  },

  toNotLeakUserRelationships(report: PrivacyReport) {
    const relationshipLeaks = report.signals.filter(
      (s) =>
        s.type.includes('counterparty') ||
        s.type.includes('signer-overlap') ||
        s.type.includes('fee-payer-reuse')
    );
    const pass = relationshipLeaks.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected user relationship leaks, but found none'
          : `Found ${relationshipLeaks.length} user relationship leak(s):\n` +
            formatSignals(relationshipLeaks) +
            '\n\nThese signals indicate transactions that link user identities or accounts.',
    };
  },

  toHaveSignal(report: PrivacyReport, signalType: string) {
    const hasSignal = report.signals.some((s) => s.type === signalType);

    return {
      pass: hasSignal,
      message: () =>
        hasSignal
          ? `Expected NOT to have signal '${signalType}'`
          : `Expected to have signal '${signalType}', but it was not found.\n` +
            `Available signals: ${report.signals.map((s) => s.type).join(', ') || 'none'}`,
    };
  },

  toNotHaveSignal(report: PrivacyReport, signalType: string) {
    const hasSignal = report.signals.some((s) => s.type === signalType);

    return {
      pass: !hasSignal,
      message: () =>
        !hasSignal
          ? `Expected to have signal '${signalType}'`
          : `Expected NOT to have signal '${signalType}', but it was detected.\n` +
            formatSignals(report.signals.filter((s) => s.type === signalType)),
    };
  },

  toHavePrivacyScore(report: PrivacyReport, minScore: number) {
    const score = calculatePrivacyScore(report);
    const pass = score >= minScore;

    return {
      pass,
      message: () =>
        pass
          ? `Expected privacy score to be less than ${minScore}, but got ${score}`
          : `Expected privacy score to be at least ${minScore}, but got ${score}\n` +
            `Signals detected: ${report.signals.length}\n` +
            `Risk level: ${report.overallRisk}`,
    };
  },

  toHaveAtMostSignals(report: PrivacyReport, maxSignals: number) {
    const actualSignals = report.signals.length;
    const pass = actualSignals <= maxSignals;

    return {
      pass,
      message: () =>
        pass
          ? `Expected more than ${maxSignals} signals, but found ${actualSignals}`
          : `Expected at most ${maxSignals} signal(s), but found ${actualSignals}:\n` +
            formatSignals(report.signals),
    };
  },

  toHaveNoKnownEntities(report: PrivacyReport) {
    const hasEntities = report.knownEntities.length > 0;

    return {
      pass: !hasEntities,
      message: () =>
        !hasEntities
          ? 'Expected to have known entities, but found none'
          : `Expected no known entities, but found ${report.knownEntities.length}:\n` +
            report.knownEntities
              .map((e) => `  - ${e.name} (${e.type})`)
              .join('\n') +
            '\n\nInteracting with known entities can link your transactions to your identity.',
    };
  },

  toNotInteractWith(report: PrivacyReport, entityType: string) {
    const hasEntityType = report.knownEntities.some((e) => e.type === entityType);

    return {
      pass: !hasEntityType,
      message: () =>
        !hasEntityType
          ? `Expected to interact with '${entityType}', but no such entities found`
          : `Expected NOT to interact with '${entityType}', but found:\n` +
            report.knownEntities
              .filter((e) => e.type === entityType)
              .map((e) => `  - ${e.name}`)
              .join('\n'),
    };
  },
});

// Helper functions

function formatSignals(signals: RiskSignal[]): string {
  if (signals.length === 0) return '  (none)';

  return signals
    .map(
      (s) =>
        `  - [${s.severity}] ${s.type}\n` +
        `    ${s.description}\n` +
        (s.mitigation ? `    💡 ${s.mitigation}` : '')
    )
    .join('\n');
}

function calculatePrivacyScore(report: PrivacyReport): number {
  // Simple scoring algorithm: start at 100, deduct for signals
  let score = 100;

  for (const signal of report.signals) {
    switch (signal.severity) {
      case 'HIGH':
        score -= 20;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
        score -= 5;
        break;
    }
  }

  return Math.max(0, score);
}

// Export for use in other test frameworks
export { calculatePrivacyScore, formatSignals };

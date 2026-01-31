import { describe, it, expect } from 'vitest';
import {
  generateNarrative,
  generateNarrativeText,
  determineIdentifiability,
  getSignalCategory,
  CATEGORY_DEFINITIONS,
  getCategoriesInOrder,
} from './index.js';
import type { PrivacyReport, RiskSignal, Evidence } from '../types/index.js';

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockEvidence(description: string, severity?: 'LOW' | 'MEDIUM' | 'HIGH'): Evidence {
  return {
    description,
    severity,
  };
}

function createMockSignal(overrides: Partial<RiskSignal> = {}): RiskSignal {
  return {
    id: overrides.id || 'test-signal',
    name: overrides.name || 'Test Signal',
    severity: overrides.severity || 'MEDIUM',
    reason: overrides.reason || 'Test reason',
    impact: overrides.impact || 'Test impact',
    evidence: overrides.evidence || [],
    mitigation: overrides.mitigation || 'Test mitigation',
    confidence: overrides.confidence ?? 0.8,
  };
}

function createMockReport(signals: Partial<RiskSignal>[] = []): PrivacyReport {
  const fullSignals = signals.map((s) => createMockSignal(s));
  const highCount = fullSignals.filter((s) => s.severity === 'HIGH').length;
  const mediumCount = fullSignals.filter((s) => s.severity === 'MEDIUM').length;
  const lowCount = fullSignals.filter((s) => s.severity === 'LOW').length;

  return {
    version: '1.0.0',
    timestamp: Date.now(),
    targetType: 'wallet',
    target: 'TestWallet123456789',
    overallRisk: highCount > 0 ? 'HIGH' : mediumCount > 0 ? 'MEDIUM' : 'LOW',
    signals: fullSignals,
    summary: {
      totalSignals: fullSignals.length,
      highRiskSignals: highCount,
      mediumRiskSignals: mediumCount,
      lowRiskSignals: lowCount,
      transactionsAnalyzed: 50,
    },
    mitigations: [],
    knownEntities: [],
  };
}

// =============================================================================
// CATEGORY TESTS
// =============================================================================

describe('Categories', () => {
  describe('getSignalCategory', () => {
    it('should return correct category for known signal IDs', () => {
      expect(getSignalCategory('known-entity-exchange')).toBe('identity');
      expect(getSignalCategory('fee-payer-never-self')).toBe('connections');
      expect(getSignalCategory('timing-burst')).toBe('behavior');
      expect(getSignalCategory('memo-pii-exposure')).toBe('exposure');
    });

    it('should handle dynamic signal IDs', () => {
      expect(getSignalCategory('known-entity-frequent-abc123')).toBe('identity');
      expect(getSignalCategory('instruction-type-xyz789')).toBe('behavior');
    });

    it('should default to exposure for unknown signal IDs', () => {
      expect(getSignalCategory('unknown-signal-id')).toBe('exposure');
    });
  });

  describe('getCategoriesInOrder', () => {
    it('should return categories in priority order', () => {
      const order = getCategoriesInOrder();
      expect(order).toEqual(['identity', 'connections', 'behavior', 'exposure']);
    });
  });

  describe('CATEGORY_DEFINITIONS', () => {
    it('should have all required categories defined', () => {
      expect(CATEGORY_DEFINITIONS.identity).toBeDefined();
      expect(CATEGORY_DEFINITIONS.connections).toBeDefined();
      expect(CATEGORY_DEFINITIONS.behavior).toBeDefined();
      expect(CATEGORY_DEFINITIONS.exposure).toBeDefined();
    });

    it('should have opening and closing phrases', () => {
      for (const category of Object.values(CATEGORY_DEFINITIONS)) {
        expect(category.openingPhrases.length).toBeGreaterThan(0);
        expect(category.closingPhrases.length).toBeGreaterThan(0);
      }
    });
  });
});

// =============================================================================
// IDENTIFIABILITY TESTS
// =============================================================================

describe('determineIdentifiability', () => {
  it('should return fully-identified for PII + exchange', () => {
    const report = createMockReport([
      { id: 'memo-pii-exposure', severity: 'HIGH' },
      { id: 'known-entity-exchange', severity: 'HIGH' },
    ]);

    expect(determineIdentifiability(report)).toBe('fully-identified');
  });

  it('should return fully-identified for domain + exchange', () => {
    const report = createMockReport([
      { id: 'domain-name-linkage', severity: 'HIGH' },
      { id: 'known-entity-exchange', severity: 'HIGH' },
    ]);

    expect(determineIdentifiability(report)).toBe('fully-identified');
  });

  it('should return identifiable for exchange only', () => {
    const report = createMockReport([{ id: 'known-entity-exchange', severity: 'HIGH' }]);

    expect(determineIdentifiability(report)).toBe('identifiable');
  });

  it('should return identifiable for domain only', () => {
    const report = createMockReport([{ id: 'domain-name-linkage', severity: 'HIGH' }]);

    expect(determineIdentifiability(report)).toBe('identifiable');
  });

  it('should return identifiable for PII in memos only', () => {
    const report = createMockReport([{ id: 'memo-pii-exposure', severity: 'HIGH' }]);

    expect(determineIdentifiability(report)).toBe('identifiable');
  });

  it('should return pseudonymous for behavioral patterns only', () => {
    const report = createMockReport([
      { id: 'timing-burst', severity: 'MEDIUM' },
      { id: 'counterparty-reuse', severity: 'MEDIUM' },
    ]);

    expect(determineIdentifiability(report)).toBe('pseudonymous');
  });

  it('should return pseudonymous for connection patterns only', () => {
    const report = createMockReport([{ id: 'fee-payer-external', severity: 'MEDIUM' }]);

    expect(determineIdentifiability(report)).toBe('pseudonymous');
  });

  it('should return anonymous for no signals', () => {
    const report = createMockReport([]);

    expect(determineIdentifiability(report)).toBe('anonymous');
  });

  it('should return identifiable for strong linkage with multiple HIGH signals', () => {
    const report = createMockReport([
      { id: 'fee-payer-never-self', severity: 'HIGH' },
      { id: 'signer-authority-hub', severity: 'HIGH' },
    ]);

    expect(determineIdentifiability(report)).toBe('identifiable');
  });
});

// =============================================================================
// NARRATIVE GENERATION TESTS
// =============================================================================

describe('generateNarrative', () => {
  it('should generate structured narrative from report', () => {
    const report = createMockReport([
      {
        id: 'known-entity-exchange',
        severity: 'HIGH',
        reason: '2 exchanges detected',
        evidence: [createMockEvidence('5 interaction(s) with Binance')],
      },
      {
        id: 'fee-payer-never-self',
        severity: 'HIGH',
        reason: 'All 50 transactions paid by 1 other wallet',
      },
    ]);

    const narrative = generateNarrative(report);

    expect(narrative.paragraphs.length).toBeGreaterThan(0);
    expect(narrative.conclusion).toBeTruthy();
    expect(narrative.identifiabilityLevel).toBe('identifiable');
    expect(narrative.signalCount).toBe(2);
    expect(narrative.timestamp).toBeGreaterThan(0);
  });

  it('should categorize signals correctly', () => {
    const report = createMockReport([
      { id: 'known-entity-exchange', severity: 'HIGH' },
      { id: 'fee-payer-never-self', severity: 'HIGH' },
      { id: 'timing-burst', severity: 'MEDIUM' },
      { id: 'memo-pii-exposure', severity: 'HIGH' },
    ]);

    const narrative = generateNarrative(report);

    const categories = narrative.paragraphs.map((p) => p.category);
    expect(categories).toContain('identity');
    expect(categories).toContain('connections');
    expect(categories).toContain('behavior');
    expect(categories).toContain('exposure');
  });

  it('should respect includeLowSeverity option', () => {
    const report = createMockReport([
      { id: 'known-entity-exchange', severity: 'HIGH' },
      { id: 'memo-usage', severity: 'LOW' },
    ]);

    const withLow = generateNarrative(report, { includeLowSeverity: true });
    const withoutLow = generateNarrative(report, { includeLowSeverity: false });

    expect(withLow.signalCount).toBe(2);
    expect(withoutLow.signalCount).toBe(1);
  });

  it('should respect maxStatementsPerCategory option', () => {
    const report = createMockReport([
      { id: 'timing-burst', severity: 'MEDIUM' },
      { id: 'timing-regular-interval', severity: 'MEDIUM' },
      { id: 'timing-timezone-pattern', severity: 'MEDIUM' },
      { id: 'priority-fee-consistent', severity: 'MEDIUM' },
      { id: 'compute-budget-fingerprint', severity: 'LOW' },
      { id: 'instruction-sequence-pattern', severity: 'LOW' },
    ]);

    const narrative = generateNarrative(report, { maxStatementsPerCategory: 2 });

    const behaviorParagraph = narrative.paragraphs.find((p) => p.category === 'behavior');
    expect(behaviorParagraph?.statements.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty signals gracefully', () => {
    const report = createMockReport([]);

    const narrative = generateNarrative(report);

    expect(narrative.paragraphs.length).toBe(0);
    expect(narrative.identifiabilityLevel).toBe('anonymous');
    expect(narrative.conclusion).toBeTruthy();
  });

  it('should handle dynamic signal IDs', () => {
    const report = createMockReport([
      {
        id: 'known-entity-frequent-abc123',
        severity: 'MEDIUM',
        reason: '45% of activity with Binance',
      },
      { id: 'instruction-type-xyz789', severity: 'LOW', reason: 'swap operation used 5 times' },
    ]);

    const narrative = generateNarrative(report);

    expect(narrative.paragraphs.length).toBeGreaterThan(0);
  });

  it('should sort statements by severity within categories', () => {
    const report = createMockReport([
      { id: 'timing-burst', severity: 'LOW' },
      { id: 'timing-regular-interval', severity: 'HIGH' },
      { id: 'timing-timezone-pattern', severity: 'MEDIUM' },
    ]);

    const narrative = generateNarrative(report);

    const behaviorParagraph = narrative.paragraphs.find((p) => p.category === 'behavior');
    expect(behaviorParagraph?.statements[0].severity).toBe('HIGH');
    expect(behaviorParagraph?.statements[1].severity).toBe('MEDIUM');
    expect(behaviorParagraph?.statements[2].severity).toBe('LOW');
  });

  it('should generate appropriate introduction based on risk level', () => {
    const highRiskReport = createMockReport([
      { id: 'known-entity-exchange', severity: 'HIGH' },
      { id: 'fee-payer-never-self', severity: 'HIGH' },
    ]);

    const lowRiskReport = createMockReport([{ id: 'memo-usage', severity: 'LOW' }]);

    const highNarrative = generateNarrative(highRiskReport);
    const lowNarrative = generateNarrative(lowRiskReport);

    expect(highNarrative.introduction).toContain('critical');
    expect(lowNarrative.introduction).toContain('minor');
  });
});

// =============================================================================
// TEXT FORMATTING TESTS
// =============================================================================

describe('generateNarrativeText', () => {
  it('should generate formatted text output', () => {
    const report = createMockReport([
      {
        id: 'known-entity-exchange',
        severity: 'HIGH',
        evidence: [createMockEvidence('5 interaction(s) with Binance')],
      },
    ]);

    const text = generateNarrativeText(report);

    expect(text).toContain('WHAT DOES THE OBSERVER KNOW?');
    expect(text).toContain('IDENTITY LINKAGE');
    expect(text).toContain('CONCLUSION');
  });

  it('should include severity indicators', () => {
    const report = createMockReport([
      { id: 'known-entity-exchange', severity: 'HIGH' },
      { id: 'timing-burst', severity: 'MEDIUM' },
      { id: 'memo-usage', severity: 'LOW' },
    ]);

    const text = generateNarrativeText(report);

    expect(text).toContain('[!]'); // HIGH
    expect(text).toContain('[~]'); // MEDIUM
    expect(text).toContain('[.]'); // LOW
  });

  it('should be deterministic (same input = same output)', () => {
    const report = createMockReport([
      {
        id: 'known-entity-exchange',
        severity: 'HIGH',
        reason: '2 interaction(s) with Binance',
        evidence: [createMockEvidence('2 interaction(s) with Binance')],
      },
      {
        id: 'fee-payer-never-self',
        severity: 'HIGH',
        reason: 'All 50 transaction(s) paid by 1 other wallet(s)',
      },
    ]);

    const text1 = generateNarrativeText(report);
    const text2 = generateNarrativeText(report);

    // Remove timestamp from narrative object before comparison
    // (timestamp will differ, but the text formatting is deterministic)
    expect(text1).toBe(text2);
  });

  it('should include identifiability level in output', () => {
    const report = createMockReport([
      { id: 'known-entity-exchange', severity: 'HIGH' },
      { id: 'memo-pii-exposure', severity: 'HIGH' },
    ]);

    const text = generateNarrativeText(report);

    expect(text).toContain('Identifiability Level: FULLY-IDENTIFIED');
  });

  it('should handle reports with no signals', () => {
    const report = createMockReport([]);

    const text = generateNarrativeText(report);

    expect(text).toContain('WHAT DOES THE OBSERVER KNOW?');
    expect(text).toContain('CONCLUSION');
    expect(text).toContain('ANONYMOUS');
  });

  it('should respect includeDetails option', () => {
    const report = createMockReport([
      {
        id: 'known-entity-exchange',
        severity: 'HIGH',
        evidence: [
          createMockEvidence('5 interaction(s) with Binance'),
          createMockEvidence('3 interaction(s) with Coinbase'),
        ],
      },
    ]);

    const withDetails = generateNarrativeText(report, { includeDetails: true });
    const withoutDetails = generateNarrativeText(report, { includeDetails: false });

    // With details should include evidence
    expect(withDetails.split('\n').length).toBeGreaterThan(withoutDetails.split('\n').length);
  });
});

// =============================================================================
// TEMPLATE TESTS
// =============================================================================

describe('Signal Templates', () => {
  it('should generate meaningful statements for identity signals', () => {
    const report = createMockReport([
      {
        id: 'known-entity-exchange',
        severity: 'HIGH',
        reason: 'Interacted with exchanges',
        evidence: [createMockEvidence('5 interaction(s) with Binance')],
      },
    ]);

    const narrative = generateNarrative(report);
    const identityParagraph = narrative.paragraphs.find((p) => p.category === 'identity');

    expect(identityParagraph?.statements[0].statement).toContain('exchange');
    expect(identityParagraph?.statements[0].statement).toContain('KYC');
  });

  it('should generate meaningful statements for connection signals', () => {
    const report = createMockReport([
      {
        id: 'fee-payer-never-self',
        severity: 'HIGH',
        reason: 'All 50 transactions paid by 1 other wallet',
      },
    ]);

    const narrative = generateNarrative(report);
    const connectionsParagraph = narrative.paragraphs.find((p) => p.category === 'connections');

    expect(connectionsParagraph?.statements[0].statement).toContain('NEVER');
    expect(connectionsParagraph?.statements[0].statement).toContain('fee');
  });

  it('should generate meaningful statements for behavior signals', () => {
    const report = createMockReport([
      {
        id: 'timing-timezone-pattern',
        severity: 'MEDIUM',
        reason: '65% of transactions during 14:00, 15:00, 16:00 UTC',
      },
    ]);

    const narrative = generateNarrative(report);
    const behaviorParagraph = narrative.paragraphs.find((p) => p.category === 'behavior');

    expect(behaviorParagraph?.statements[0].statement).toContain('timezone');
  });

  it('should generate meaningful statements for exposure signals', () => {
    const report = createMockReport([
      {
        id: 'memo-pii-exposure',
        severity: 'HIGH',
        reason: 'PII detected in memos',
        evidence: [createMockEvidence('"user@example.com"')],
      },
    ]);

    const narrative = generateNarrative(report);
    const exposureParagraph = narrative.paragraphs.find((p) => p.category === 'exposure');

    expect(exposureParagraph?.statements[0].statement).toContain('personal information');
  });

  it('should handle unknown signal IDs with fallback', () => {
    const report = createMockReport([
      {
        id: 'completely-unknown-signal',
        severity: 'MEDIUM',
        reason: 'Some unknown pattern detected',
      },
    ]);

    const narrative = generateNarrative(report);

    // Should still generate a statement using fallback
    expect(narrative.paragraphs.length).toBeGreaterThan(0);
    expect(narrative.paragraphs[0].statements[0].statement).toContain('I can determine');
  });
});

import type { RiskLevel } from './types.js';

/**
 * Transitions between sentences within a category
 */
export const INTRA_CATEGORY_TRANSITIONS = {
  additive: [
    'Additionally,',
    'Furthermore,',
    'I also found that',
    'Building on this,',
    'On top of that,',
    'Moreover,',
  ],

  amplifying: [
    'More concerning,',
    'Even more revealing,',
    'This is compounded by the fact that',
    'What makes this worse is that',
    'Adding to this risk,',
  ],

  neutral: ['I can also see that', 'Another observation:', 'Looking further,', 'In addition,'],
};

/**
 * Select a transition based on severity relationship
 */
export function selectTransition(
  currentSeverity: RiskLevel,
  previousSeverity: RiskLevel,
  index: number
): string {
  const severityRank = { LOW: 1, MEDIUM: 2, HIGH: 3 };

  // First statement in a group - no transition needed
  if (index === 0) return '';

  // If this is more severe than previous, use amplifying
  if (severityRank[currentSeverity] > severityRank[previousSeverity]) {
    return INTRA_CATEGORY_TRANSITIONS.amplifying[
      index % INTRA_CATEGORY_TRANSITIONS.amplifying.length
    ];
  }

  // Same or lower severity - use additive/neutral
  const transitions =
    index % 2 === 0
      ? INTRA_CATEGORY_TRANSITIONS.additive
      : INTRA_CATEGORY_TRANSITIONS.neutral;

  return transitions[index % transitions.length];
}

/**
 * Transitions between category sections
 */
export const INTER_CATEGORY_TRANSITIONS: Record<string, string[]> = {
  'identity->connections': [
    'Beyond direct identity links, I can also map out connected wallets.',
    'Moving from identity to wallet relationships,',
    'In addition to identity exposure, there are connection patterns.',
  ],
  'identity->behavior': [
    'Beyond identity concerns, behavioral patterns are also revealing.',
    'Shifting focus to usage patterns,',
  ],
  'identity->exposure': [
    'There is also exposed metadata to consider.',
    'Additional information is leaked through transaction data.',
  ],
  'connections->behavior': [
    'Beyond wallet connections, behavioral patterns emerge.',
    'Looking at usage patterns on top of these connections,',
  ],
  'connections->exposure': [
    'Additional metadata provides more context.',
    'Beyond connections, there is exposed information.',
  ],
  'behavior->exposure': [
    'Finally, there is exposed metadata to consider.',
    'Additional information leakage includes:',
  ],
};

/**
 * Get a transition phrase between categories
 */
export function getCategoryTransition(from: string, to: string, index: number): string {
  const key = `${from}->${to}`;
  const transitions = INTER_CATEGORY_TRANSITIONS[key] || ['Additionally,', 'Furthermore,'];
  return transitions[index % transitions.length];
}

/**
 * Get severity indicator for display
 */
export function getSeverityIndicator(severity: RiskLevel): string {
  switch (severity) {
    case 'HIGH':
      return '[!]';
    case 'MEDIUM':
      return '[~]';
    case 'LOW':
      return '[.]';
  }
}

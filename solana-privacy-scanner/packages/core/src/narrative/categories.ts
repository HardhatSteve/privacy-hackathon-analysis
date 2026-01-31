import type { NarrativeCategory, CategoryDefinition } from './types.js';

/**
 * Category definitions with display properties and phrases
 */
export const CATEGORY_DEFINITIONS: Record<NarrativeCategory, CategoryDefinition> = {
  identity: {
    id: 'identity',
    title: 'Identity Linkage',
    description: 'Direct connections to real-world identity',
    openingPhrases: [
      'Starting with the most critical findings - I can potentially identify who owns this wallet.',
      'The most serious privacy concerns involve direct identity linkage.',
      'I have found clear paths to identifying the wallet owner.',
    ],
    closingPhrases: [
      'These identity links are the most damaging because they connect on-chain activity to real-world identities.',
      'Any of these pathways could lead to complete identification of the wallet owner.',
    ],
    priority: 1,
  },

  connections: {
    id: 'connections',
    title: 'Wallet Connections',
    description: 'Links between this wallet and other addresses',
    openingPhrases: [
      'I can map out a network of connected wallets.',
      'This wallet is linked to other addresses in several ways.',
      'The following connections reveal relationships between wallets.',
    ],
    closingPhrases: [
      'These connections form a web - identifying any one wallet helps identify the others.',
      'Even without knowing the owner, I can see which wallets belong together.',
    ],
    priority: 2,
  },

  behavior: {
    id: 'behavior',
    title: 'Behavioral Fingerprints',
    description: 'Patterns that distinguish this wallet from others',
    openingPhrases: [
      'I can identify distinctive behavioral patterns.',
      'This wallet has recognizable usage patterns.',
      'The following behaviors create a unique fingerprint.',
    ],
    closingPhrases: [
      'These patterns help identify the same user across different wallets.',
      'Behavioral consistency makes this wallet stand out from random users.',
    ],
    priority: 3,
  },

  exposure: {
    id: 'exposure',
    title: 'Information Exposure',
    description: 'Metadata and content that reveals information',
    openingPhrases: [
      'Additional information is exposed through transaction data.',
      'I found metadata that provides extra context about this wallet.',
      'The following data leaks provide additional insights.',
    ],
    closingPhrases: [
      'This exposed information adds context that helps in identification.',
      'Each piece of exposed data contributes to a more complete profile.',
    ],
    priority: 4,
  },
};

/**
 * Map signal IDs to their categories
 */
export const SIGNAL_CATEGORY_MAP: Record<string, NarrativeCategory> = {
  // Identity - direct paths to real-world identity
  'known-entity-exchange': 'identity',
  'known-entity-bridge': 'identity',
  'domain-name-linkage': 'identity',
  'nft-metadata-exposure': 'identity',

  // Connections - wallet relationships
  'fee-payer-external': 'connections',
  'fee-payer-never-self': 'connections',
  'fee-payer-multi-signer': 'connections',
  'signer-repeated': 'connections',
  'signer-set-reuse': 'connections',
  'signer-authority-hub': 'connections',
  'ata-creator-linkage': 'connections',
  'ata-funding-pattern': 'connections',
  'counterparty-reuse': 'connections',
  'pda-reuse': 'connections',

  // Behavior - usage patterns
  'timing-burst': 'behavior',
  'timing-regular-interval': 'behavior',
  'timing-timezone-pattern': 'behavior',
  'priority-fee-consistent': 'behavior',
  'compute-budget-fingerprint': 'behavior',
  'instruction-sequence-pattern': 'behavior',
  'program-usage-profile': 'behavior',
  'program-reuse': 'behavior',
  'instruction-pda-reuse': 'behavior',
  'stake-delegation-pattern': 'behavior',
  'stake-timing-correlation': 'behavior',
  'address-high-diversity': 'behavior',
  'address-moderate-diversity': 'behavior',
  'address-long-term-usage': 'behavior',

  // Exposure - information leaks
  'memo-usage': 'exposure',
  'memo-pii-exposure': 'exposure',
  'memo-descriptive-content': 'exposure',
  'known-entity-other': 'exposure',
  'token-account-churn': 'exposure',
  'token-account-short-lived': 'exposure',
  'token-account-common-owner': 'exposure',
  'rent-refund-clustering': 'exposure',
  'counterparty-program-combo': 'exposure',
};

/**
 * Get category for a signal ID, handling dynamic patterns
 */
export function getSignalCategory(signalId: string): NarrativeCategory {
  // Direct match
  if (SIGNAL_CATEGORY_MAP[signalId]) {
    return SIGNAL_CATEGORY_MAP[signalId];
  }

  // Dynamic patterns
  if (signalId.startsWith('known-entity-frequent-')) return 'identity';
  if (signalId.startsWith('instruction-type-')) return 'behavior';

  // Default to exposure for unknown signals
  return 'exposure';
}

/**
 * Get categories in priority order
 */
export function getCategoriesInOrder(): NarrativeCategory[] {
  return ['identity', 'connections', 'behavior', 'exposure'];
}

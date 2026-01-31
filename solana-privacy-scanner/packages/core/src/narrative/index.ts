/**
 * Narrative Generator Module
 *
 * Transforms privacy signals into an adversary-perspective narrative
 * that explains what an observer could learn from analyzing a wallet.
 *
 * @example
 * ```typescript
 * import { generateNarrativeText, generateNarrative, determineIdentifiability } from 'solana-privacy-scanner-core';
 *
 * // Generate formatted text narrative
 * const narrative = generateNarrativeText(report);
 * console.log(narrative);
 *
 * // Generate structured narrative object
 * const structured = generateNarrative(report, { includeLowSeverity: false });
 * console.log(structured.identifiabilityLevel);
 *
 * // Just get identifiability level
 * const level = determineIdentifiability(report);
 * ```
 */

// Export types
export type {
  NarrativeCategory,
  IdentifiabilityLevel,
  AdversaryStatement,
  NarrativeParagraph,
  AdversaryNarrative,
  NarrativeOptions,
  SignalTemplate,
  CategoryDefinition,
} from './types.js';

// Export main functions
export { generateNarrative, generateNarrativeText } from './builder.js';
export {
  determineIdentifiability,
  generateConclusion,
  getIdentifiabilityDescription,
} from './conclusion.js';

// Export category utilities
export { CATEGORY_DEFINITIONS, getSignalCategory, getCategoriesInOrder } from './categories.js';

// Export template utilities (for advanced customization)
export { ALL_TEMPLATES, findTemplate } from './templates.js';

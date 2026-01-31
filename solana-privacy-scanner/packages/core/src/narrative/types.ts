import type { RiskSignal } from '../types/index.js';

/**
 * Categories for grouping findings in the narrative
 */
export type NarrativeCategory =
  | 'identity' // KYC linkage, domains, NFTs, exchange interactions
  | 'connections' // Fee payers, signers, counterparties, ATA linkage
  | 'behavior' // Timing, fees, instruction patterns, staking
  | 'exposure'; // Memos, metadata, descriptive content

/**
 * Level of identifiability based on detected signals
 */
export type IdentifiabilityLevel =
  | 'anonymous' // No significant signals
  | 'pseudonymous' // Patterns exist but no direct identity link
  | 'identifiable' // Clear paths to identity (exchange, domain, etc.)
  | 'fully-identified'; // Direct identity exposure (PII + exchange, etc.)

/**
 * Risk level type (imported from report)
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * A single adversary knowledge statement
 */
export interface AdversaryStatement {
  /** The signal that generated this statement */
  signalId: string;
  /** The category this statement belongs to */
  category: NarrativeCategory;
  /** The severity of the underlying signal */
  severity: RiskLevel;
  /** The main adversary knowledge statement */
  statement: string;
  /** Optional supporting detail sentences */
  details: string[];
  /** Confidence level (inherited from signal) */
  confidence: number;
}

/**
 * A paragraph in the narrative
 */
export interface NarrativeParagraph {
  /** Category this paragraph covers */
  category: NarrativeCategory;
  /** Human-readable category title */
  title: string;
  /** Opening transition for this section */
  opening: string;
  /** Individual statements in this paragraph */
  statements: AdversaryStatement[];
  /** Closing transition */
  closing: string;
}

/**
 * The complete adversary narrative
 */
export interface AdversaryNarrative {
  /** Opening introduction */
  introduction: string;
  /** Category-grouped paragraphs */
  paragraphs: NarrativeParagraph[];
  /** Final conclusion */
  conclusion: string;
  /** Overall identifiability assessment */
  identifiabilityLevel: IdentifiabilityLevel;
  /** The number of signals that were analyzed */
  signalCount: number;
  /** Timestamp of generation */
  timestamp: number;
}

/**
 * Template for a signal's adversary statement
 */
export interface SignalTemplate {
  /** The pattern to match signal IDs (string for exact match, RegExp for patterns) */
  pattern: string | RegExp;
  /** Category this signal belongs to */
  category: NarrativeCategory;
  /** Template string with {variable} placeholders */
  template: string;
  /** Optional detail templates for evidence items */
  detailTemplates?: string[];
  /** Function to extract template variables from the signal */
  extractVariables: (signal: RiskSignal) => Record<string, string | number>;
}

/**
 * Options for narrative generation
 */
export interface NarrativeOptions {
  /** Include LOW severity signals (default: true) */
  includeLowSeverity?: boolean;
  /** Include evidence details (default: true) */
  includeDetails?: boolean;
  /** Maximum statements per category (default: 5) */
  maxStatementsPerCategory?: number;
  /** Generate plain text or structured output */
  format?: 'text' | 'structured';
}

/**
 * Category definition with display properties
 */
export interface CategoryDefinition {
  /** Category identifier */
  id: NarrativeCategory;
  /** Human-readable title */
  title: string;
  /** Description of what this category covers */
  description: string;
  /** Opening phrases for this section (selected based on severity) */
  openingPhrases: string[];
  /** Closing phrases for this section */
  closingPhrases: string[];
  /** Display priority (lower = appears first) */
  priority: number;
}

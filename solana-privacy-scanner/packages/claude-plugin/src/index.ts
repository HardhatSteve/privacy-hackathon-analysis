/**
 * Solana Privacy Scanner - Claude Code Plugin
 *
 * Main entry point for the plugin
 */

export * from './types.js';
export * from './formatter.js';
export * from './analyzer.js';
export * from './scanner.js';
export * from './explainer.js';
export * from './fixer.js';

/**
 * Plugin version
 */
export const VERSION = '0.1.0';

/**
 * Plugin metadata
 */
export const PLUGIN_INFO = {
  name: 'solana-privacy-scanner-plugin',
  version: VERSION,
  description: 'AI-powered Solana privacy analysis for developers',
  author: 'Taylor Ferran',
  homepage: 'https://taylorferran.github.io/solana-privacy-scanner',
} as const;

/**
 * High-level API for generating privacy fixes
 */

import { suggestFix } from '../skills/suggest-fix/handler.js';
import type { SkillResult } from './types.js';

export interface FixOptions {
  riskId: string;
  verbose?: boolean;
}

/**
 * Get code-level fix suggestion for a privacy risk
 */
export async function suggestPrivacyFix(
  options: FixOptions
): Promise<SkillResult> {
  return suggestFix({
    target: options.riskId,
    list: false,
    verbose: options.verbose,
  });
}

/**
 * List all available fix templates
 */
export async function listAvailableFixes(): Promise<SkillResult> {
  return suggestFix({
    list: true,
  });
}

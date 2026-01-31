/**
 * High-level API for explaining privacy risks
 */

import { explainRisk } from '../skills/explain-risk/handler.js';
import type { SkillResult } from './types.js';

export interface ExplainOptions {
  riskId: string;
  verbose?: boolean;
}

/**
 * Get detailed explanation of a privacy risk
 */
export async function explainPrivacyRisk(
  options: ExplainOptions
): Promise<SkillResult> {
  return explainRisk({
    riskId: options.riskId,
    list: false,
    verbose: options.verbose,
  });
}

/**
 * List all available risk explanations
 */
export async function listAvailableRisks(): Promise<SkillResult> {
  return explainRisk({
    list: true,
  });
}

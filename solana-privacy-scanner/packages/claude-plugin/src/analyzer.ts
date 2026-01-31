/**
 * Static analyzer integration
 *
 * High-level API for static code analysis
 */

import { scanCode } from '../skills/scan-code/handler.js';
import type { SkillResult } from './types.js';

export interface AnalyzeOptions {
  paths: string[];
  excludeLowSeverity?: boolean;
  verbose?: boolean;
}

/**
 * Analyze source code for privacy issues
 */
export async function analyzeCode(options: AnalyzeOptions): Promise<SkillResult> {
  return scanCode({
    paths: options.paths,
    noLow: options.excludeLowSeverity,
    json: false,
    verbose: options.verbose,
  });
}

/**
 * Analyze source code and return raw JSON
 */
export async function analyzeCodeJSON(options: AnalyzeOptions): Promise<SkillResult> {
  return scanCode({
    paths: options.paths,
    noLow: options.excludeLowSeverity,
    json: true,
    verbose: options.verbose,
  });
}

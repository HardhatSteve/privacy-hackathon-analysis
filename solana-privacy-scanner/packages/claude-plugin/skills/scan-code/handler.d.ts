/**
 * scan-code skill handler
 *
 * Performs static code analysis using the solana-privacy-scanner toolkit
 */
import type { SkillResult } from '../../src/types.js';
export interface ScanCodeOptions {
    paths: string[];
    noLow?: boolean;
    json?: boolean;
    verbose?: boolean;
}
/**
 * Execute static code analysis
 */
export declare function scanCode(options: ScanCodeOptions): Promise<SkillResult>;
/**
 * CLI entry point for testing
 */
export declare function main(): Promise<void>;
//# sourceMappingURL=handler.d.ts.map
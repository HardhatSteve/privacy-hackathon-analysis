import type { Issue, AnalyzerResult, AnalyzerOptions } from './types.js';
import { readFile, findFiles, isCodeFile, sortIssues } from './utils.js';
import { detectFeePayerReuseInCode } from './detectors/fee-payer-reuse.js';
import { detectMemoPII } from './detectors/memo-pii.js';

/**
 * Main analyzer class that orchestrates all detectors
 */
export class SolanaPrivacyAnalyzer {
  private options: Required<AnalyzerOptions>;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      include: options.include || ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**'
      ],
      includeLow: options.includeLow ?? true,
      maxFileSize: options.maxFileSize || 1024 * 1024 // 1MB default
    };
  }

  /**
   * Analyze files matching patterns
   */
  async analyze(paths: string[]): Promise<AnalyzerResult> {
    const startTime = Date.now();
    const allIssues: Issue[] = [];

    // Find all files to analyze
    const files = await findFiles(paths, {
      exclude: this.options.exclude
    });

    // Filter to only code files
    const codeFiles = files.filter(isCodeFile);

    // Analyze each file
    for (const file of codeFiles) {
      try {
        const issues = await this.analyzeFile(file);
        allIssues.push(...issues);
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
        // Continue with other files
      }
    }

    // Filter out low severity if requested
    const filteredIssues = this.options.includeLow
      ? allIssues
      : allIssues.filter(issue => issue.severity !== 'LOW');

    // Sort issues
    const sortedIssues = sortIssues(filteredIssues);

    // Calculate summary
    const summary = this.calculateSummary(sortedIssues);

    return {
      issues: sortedIssues,
      summary,
      filesAnalyzed: codeFiles.length,
      timestamp: startTime
    };
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<Issue[]> {
    const content = await readFile(filePath);
    const issues: Issue[] = [];

    // Run all detectors
    issues.push(...detectFeePayerReuseInCode(content, filePath));
    issues.push(...detectMemoPII(content, filePath));

    // Future detectors can be added here:
    // issues.push(...detectSignerOverlap(content, filePath));
    // issues.push(...detectKnownEntities(content, filePath));

    return issues;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(issues: Issue[]): AnalyzerResult['summary'] {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: issues.length
    };

    for (const issue of issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          summary.critical++;
          break;
        case 'HIGH':
          summary.high++;
          break;
        case 'MEDIUM':
          summary.medium++;
          break;
        case 'LOW':
          summary.low++;
          break;
      }
    }

    return summary;
  }
}

/**
 * Convenience function to analyze paths
 */
export async function analyze(
  paths: string[],
  options?: AnalyzerOptions
): Promise<AnalyzerResult> {
  const analyzer = new SolanaPrivacyAnalyzer(options);
  return analyzer.analyze(paths);
}

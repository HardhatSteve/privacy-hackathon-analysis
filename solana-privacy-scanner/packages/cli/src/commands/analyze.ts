import chalk from 'chalk';
import { analyze } from 'solana-privacy-scanner-core';
import type { AnalyzerResult, Issue } from 'solana-privacy-scanner-core';
import * as path from 'path';
import * as fs from 'fs';

interface AnalyzeOptions {
  json?: boolean;
  low?: boolean;
  quiet?: boolean;
  output?: string;
}

export async function analyzeCommand(paths: string[], options: AnalyzeOptions) {
  try {
    if (!options.quiet) {
      console.log(chalk.blue('🔒 Running Solana Privacy Analyzer...\n'));
    }

    const result = await analyze(paths, {
      includeLow: options.low !== false
    });

    if (options.json) {
      const output = JSON.stringify(result, null, 2);
      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`✅ Results written to ${options.output}`));
      } else {
        console.log(output);
      }
    } else {
      printResults(result, options.quiet || false);
      if (options.output) {
        const jsonOutput = JSON.stringify(result, null, 2);
        fs.writeFileSync(options.output, jsonOutput);
        console.log(chalk.green(`\n✅ Results also written to ${options.output}`));
      }
    }

    // Exit with error code if critical or high issues found
    if (result.summary.critical > 0 || result.summary.high > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('❌ Analysis failed:'), error);
    process.exit(1);
  }
}

function printResults(result: AnalyzerResult, quiet: boolean) {
  // Summary
  console.log(chalk.bold('📊 Scan Summary\n'));
  console.log(`Files analyzed: ${result.filesAnalyzed}`);
  console.log(`Total issues: ${result.summary.total}\n`);

  if (result.summary.critical > 0) {
    console.log(chalk.red(`  🔴 CRITICAL: ${result.summary.critical}`));
  }
  if (result.summary.high > 0) {
    console.log(chalk.yellow(`  🟡 HIGH: ${result.summary.high}`));
  }
  if (result.summary.medium > 0) {
    console.log(chalk.blue(`  🔵 MEDIUM: ${result.summary.medium}`));
  }
  if (result.summary.low > 0) {
    console.log(chalk.gray(`  ⚪ LOW: ${result.summary.low}`));
  }

  if (result.issues.length === 0) {
    console.log(chalk.green('\n✅ No issues found!'));
    return;
  }

  if (quiet) {
    return;
  }

  // Group issues by file
  const byFile = result.issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  console.log(chalk.bold('\n📋 Detailed Issues\n'));

  for (const [file, issues] of Object.entries(byFile)) {
    console.log(chalk.bold(`\n📁 ${path.relative(process.cwd(), file)}`));
    console.log('━'.repeat(80));

    issues.forEach((issue, index) => {
      const severityColor =
        issue.severity === 'CRITICAL' ? chalk.red :
        issue.severity === 'HIGH' ? chalk.yellow :
        issue.severity === 'MEDIUM' ? chalk.blue :
        chalk.gray;

      const severityEmoji =
        issue.severity === 'CRITICAL' ? '🔴' :
        issue.severity === 'HIGH' ? '🟡' :
        issue.severity === 'MEDIUM' ? '🔵' :
        '⚪';

      console.log(`${index + 1}. ${severityEmoji} ${severityColor(issue.severity)} ${issue.message}`);
      console.log(`   Line ${issue.line}:${issue.column}`);

      if (issue.suggestion) {
        console.log(chalk.dim(`   Suggestion: ${issue.suggestion}`));
      }

      if (issue.codeSnippet) {
        console.log(chalk.dim('\n   Code:'));
        console.log(chalk.dim(issue.codeSnippet.split('\n').map(l => `   ${l}`).join('\n')));
      }
      console.log();
    });
  }

  if (result.summary.critical > 0 || result.summary.high > 0) {
    console.log(chalk.yellow('\n💡 Recommendations\n'));
    console.log('Critical and high severity issues should be fixed before deployment.');
    console.log('Run with --json to get machine-readable output for CI/CD integration.');
  }
}

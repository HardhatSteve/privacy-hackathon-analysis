/**
 * scan-code skill handler
 *
 * Performs static code analysis using the solana-privacy-scanner toolkit
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { formatAnalyzerResult } from '../../src/formatter.js';
const execAsync = promisify(exec);
/**
 * Execute static code analysis
 */
export async function scanCode(options) {
    try {
        // Validate inputs
        if (!options.paths || options.paths.length === 0) {
            return {
                success: false,
                error: 'No file paths provided. Usage: /scan-code <paths...>',
            };
        }
        // Build command
        const command = buildAnalyzeCommand(options);
        if (options.verbose) {
            console.log(`Executing: ${command}`);
        }
        // Execute analyzer
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            cwd: process.cwd(),
        });
        // Check for errors in stderr
        if (stderr && !stderr.includes('WARNING')) {
            console.warn('Analyzer warnings:', stderr);
        }
        // Parse JSON output
        let result;
        try {
            result = JSON.parse(stdout);
        }
        catch (parseError) {
            return {
                success: false,
                error: `Failed to parse analyzer output: ${parseError}`,
                data: { stdout, stderr },
            };
        }
        // Return raw JSON if requested
        if (options.json) {
            return {
                success: true,
                data: result,
                message: 'Analysis complete',
            };
        }
        // Format results for display
        const formatted = formatAnalyzerResult(result);
        const message = createDisplayMessage(formatted);
        return {
            success: true,
            data: formatted,
            message,
        };
    }
    catch (error) {
        // Check if it's an execution error with non-zero exit code
        if (error.code === 1 && error.stdout) {
            // Exit code 1 means issues were found (expected behavior)
            try {
                const result = JSON.parse(error.stdout);
                if (options.json) {
                    return {
                        success: true,
                        data: result,
                        message: 'Analysis complete (issues found)',
                    };
                }
                const formatted = formatAnalyzerResult(result);
                const message = createDisplayMessage(formatted);
                return {
                    success: true,
                    data: formatted,
                    message,
                };
            }
            catch (parseError) {
                // Couldn't parse, treat as real error
            }
        }
        return {
            success: false,
            error: `Analysis failed: ${error.message}`,
            data: { stderr: error.stderr },
        };
    }
}
/**
 * Build the analyze command with options
 */
function buildAnalyzeCommand(options) {
    const parts = ['npx', 'solana-privacy-scanner', 'analyze'];
    // Add paths
    parts.push(...options.paths.map(p => `"${p}"`));
    // Add flags
    parts.push('--json'); // Always get JSON for parsing
    if (options.noLow) {
        parts.push('--no-low');
    }
    return parts.join(' ');
}
/**
 * Create formatted display message from analysis results
 */
function createDisplayMessage(formatted) {
    const lines = [];
    // Add summary
    lines.push(formatted.summary);
    lines.push('');
    // If no issues, we're done
    if (formatted.totalIssues === 0) {
        return lines.join('\n');
    }
    // Group issues by file
    const byFile = new Map();
    formatted.issues.forEach((issue) => {
        if (!byFile.has(issue.file)) {
            byFile.set(issue.file, []);
        }
        byFile.get(issue.file).push(issue);
    });
    // Display issues by file
    lines.push('## Issues Found');
    lines.push('');
    for (const [file, issues] of byFile) {
        lines.push(`### ${file}`);
        lines.push('');
        issues.forEach((issue, index) => {
            const severityEmoji = issue.severity === 'CRITICAL' ? '🔴' :
                issue.severity === 'HIGH' ? '🟡' :
                    issue.severity === 'MEDIUM' ? '🔵' : '⚪';
            lines.push(`${index + 1}. ${severityEmoji} **${issue.severity}** ${issue.message}`);
            lines.push(`   Line ${issue.line}:${issue.column}`);
            if (issue.suggestion) {
                lines.push(`   💡 ${issue.suggestion}`);
            }
            if (issue.codeSnippet) {
                lines.push('');
                lines.push('   ```typescript');
                issue.codeSnippet.split('\n').forEach((line) => {
                    lines.push(`   ${line}`);
                });
                lines.push('   ```');
            }
            lines.push('');
        });
    }
    // Add recommendations
    if (formatted.suggestions && formatted.suggestions.length > 0) {
        lines.push('## 💡 Recommendations');
        lines.push('');
        formatted.suggestions.forEach((suggestion) => {
            lines.push(`- ${suggestion}`);
        });
        lines.push('');
    }
    // Add next steps
    lines.push('## Next Steps');
    lines.push('');
    lines.push('- Use `/explain-risk <risk-type>` to learn more about specific issues');
    lines.push('- Use `/suggest-fix <file:line>` to get AI-generated fixes');
    lines.push('- Fix CRITICAL and HIGH severity issues before deployment');
    return lines.join('\n');
}
/**
 * CLI entry point for testing
 */
export async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node handler.js <paths...> [--no-low] [--json]');
        process.exit(1);
    }
    const options = {
        paths: [],
        noLow: args.includes('--no-low'),
        json: args.includes('--json'),
        verbose: args.includes('--verbose'),
    };
    // Extract paths (non-flag arguments)
    options.paths = args.filter(arg => !arg.startsWith('--'));
    const result = await scanCode(options);
    if (!result.success) {
        console.error('❌ Error:', result.error);
        process.exit(1);
    }
    console.log(result.message || JSON.stringify(result.data, null, 2));
    process.exit(0);
}
// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=handler.js.map
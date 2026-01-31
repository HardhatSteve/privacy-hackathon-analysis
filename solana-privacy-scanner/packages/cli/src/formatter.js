import chalk from 'chalk';
/**
 * Conditional chalk - returns plain text if noColor is true
 */
function c(text, formatter, noColor) {
    return noColor ? text : formatter(text);
}
/**
 * Format a privacy report as human-readable text
 * @param report The privacy report to format
 * @param noColor If true, omit ANSI color codes (for file output)
 */
export function formatReport(report, noColor = false) {
    const lines = [];
    // Header
    lines.push('');
    lines.push(c('═══════════════════════════════════════════════════════════════', chalk.bold, noColor));
    lines.push(c('  SOLANA PRIVACY SCANNER - REPORT', chalk.bold, noColor));
    lines.push(c('═══════════════════════════════════════════════════════════════', chalk.bold, noColor));
    lines.push('');
    // Target info
    lines.push(c(`Target Type: ${report.targetType}`, chalk.gray, noColor));
    lines.push(c(`Target:      ${report.target}`, chalk.gray, noColor));
    lines.push(c(`Scanned:     ${new Date(report.timestamp).toLocaleString()}`, chalk.gray, noColor));
    lines.push(c(`Version:     ${report.version}`, chalk.gray, noColor));
    lines.push('');
    // Overall Risk (with color)
    let riskText = report.overallRisk;
    if (!noColor) {
        if (report.overallRisk === 'HIGH') {
            riskText = chalk.red.bold(report.overallRisk);
        }
        else if (report.overallRisk === 'MEDIUM') {
            riskText = chalk.yellow.bold(report.overallRisk);
        }
        else {
            riskText = chalk.green.bold(report.overallRisk);
        }
    }
    lines.push(c('OVERALL PRIVACY RISK: ', chalk.bold, noColor) + riskText);
    lines.push('');
    // Summary
    lines.push(c('SUMMARY', chalk.bold, noColor));
    lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
    lines.push(`Transactions Analyzed: ${report.summary.transactionsAnalyzed}`);
    lines.push(`Total Risk Signals:    ${report.summary.totalSignals}`);
    if (report.summary.totalSignals > 0) {
        lines.push(`  ${noColor ? '●' : chalk.red('●')} HIGH:   ${report.summary.highRiskSignals}`);
        lines.push(`  ${noColor ? '●' : chalk.yellow('●')} MEDIUM: ${report.summary.mediumRiskSignals}`);
        lines.push(`  ${noColor ? '●' : chalk.green('●')} LOW:    ${report.summary.lowRiskSignals}`);
    }
    lines.push('');
    // Risk Signals
    if (report.signals.length > 0) {
        lines.push(c('DETECTED PRIVACY RISKS', chalk.bold, noColor));
        lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
        lines.push('');
        report.signals.forEach((signal, index) => {
            // Signal header with severity badge
            let severityBadge = '';
            if (noColor) {
                severityBadge = ` [${signal.severity}] `;
            }
            else {
                if (signal.severity === 'HIGH') {
                    severityBadge = chalk.red.bold(' [HIGH] ');
                }
                else if (signal.severity === 'MEDIUM') {
                    severityBadge = chalk.yellow.bold(' [MEDIUM] ');
                }
                else {
                    severityBadge = chalk.green.bold(' [LOW] ');
                }
            }
            lines.push(c(`${index + 1}. ${signal.name}`, chalk.bold, noColor) + severityBadge);
            lines.push('');
            lines.push(c('   Reason:', chalk.bold, noColor));
            lines.push(`   ${signal.reason}`);
            lines.push('');
            lines.push(c('   Why This Matters:', chalk.bold, noColor));
            lines.push(`   ${signal.impact}`);
            lines.push('');
            if (signal.evidence.length > 0) {
                lines.push(c('   Evidence:', chalk.bold, noColor));
                signal.evidence.forEach((ev) => {
                    lines.push(`   • ${ev.description}`);
                });
                lines.push('');
            }
            lines.push(c('   Mitigation:', chalk.bold, noColor));
            lines.push(`   ${signal.mitigation}`);
            lines.push('');
            lines.push(c(`   Confidence: ${(signal.confidence * 100).toFixed(0)}%`, chalk.gray, noColor));
            if (index < report.signals.length - 1) {
                lines.push('');
                lines.push(c('   ─────────────────────────────────────────────────────────', chalk.gray, noColor));
                lines.push('');
            }
        });
    }
    else {
        lines.push(c('✓ No significant privacy risks detected', chalk.green.bold, noColor));
        lines.push('');
    }
    // Known Entities (always show this section)
    lines.push('');
    lines.push(c('KNOWN ENTITIES DETECTED', chalk.bold, noColor));
    lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
    if (report.knownEntities && report.knownEntities.length > 0) {
        // Group by type
        const byType = new Map();
        for (const entity of report.knownEntities) {
            if (!byType.has(entity.type)) {
                byType.set(entity.type, []);
            }
            byType.get(entity.type).push(entity);
        }
        // Display grouped by type
        const typeOrder = ['exchange', 'bridge', 'protocol', 'program', 'mixer', 'other'];
        const typeLabels = {
            exchange: 'Exchanges',
            bridge: 'Bridges',
            protocol: 'DeFi Protocols',
            program: 'Programs',
            mixer: 'Privacy Protocols',
            other: 'Other Services',
        };
        for (const type of typeOrder) {
            const entities = byType.get(type);
            if (entities && entities.length > 0) {
                lines.push('');
                lines.push(c(`${typeLabels[type]}:`, chalk.cyan.bold, noColor));
                entities.forEach(entity => {
                    lines.push(`  • ${entity.name}`);
                    if (entity.description) {
                        lines.push(c(`    ${entity.description}`, chalk.gray, noColor));
                    }
                });
            }
        }
        lines.push('');
        lines.push(c('Note: These addresses were involved in transactions or identified in the scan.', chalk.gray.italic, noColor));
        lines.push(c('This does not necessarily indicate a privacy risk.', chalk.gray.italic, noColor));
    }
    else {
        lines.push(c('✓ No known entities detected in scanned transactions.', chalk.green, noColor));
    }
    lines.push('');
    // Mitigations
    if (report.mitigations.length > 0) {
        lines.push('');
        lines.push(c('RECOMMENDATIONS', chalk.bold, noColor));
        lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
        report.mitigations.forEach((mitigation, index) => {
            lines.push(`${index + 1}. ${mitigation}`);
        });
        lines.push('');
    }
    // Footer
    lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
    lines.push(c('This report analyzes publicly available blockchain data.', chalk.gray, noColor));
    lines.push(c('Risk signals are probabilistic indicators, not guarantees.', chalk.gray, noColor));
    lines.push(c('───────────────────────────────────────────────────────────────', chalk.gray, noColor));
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=formatter.js.map
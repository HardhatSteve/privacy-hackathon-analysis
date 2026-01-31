// Output renderer for Claude Predict

import chalk from 'chalk';

// Purple color definitions
const purple = chalk.hex('#A855F7');
const purpleBright = chalk.hex('#C084FC');
const purpleDim = chalk.hex('#7C3AED');
const violet = chalk.hex('#8B5CF6');

/**
 * Render markdown-like text for terminal output
 * Simple rendering without external dependencies
 */
export function renderMarkdown(text) {
    if (!text) return '';

    let result = text;

    // Headers
    result = result.replace(/^### (.+)$/gm, purpleBright.bold('   $1'));
    result = result.replace(/^## (.+)$/gm, purpleBright.bold('  $1'));
    result = result.replace(/^# (.+)$/gm, purpleBright.bold(' $1'));

    // Bold
    result = result.replace(/\*\*(.+?)\*\*/g, chalk.bold('$1'));

    // Italic
    result = result.replace(/\*(.+?)\*/g, chalk.italic('$1'));

    // Inline code
    result = result.replace(/`([^`]+)`/g, violet('$1'));

    // Code blocks (simple - just highlight)
    result = result.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => {
        return purple('─'.repeat(40)) + '\n' +
            violet(code.trim()) + '\n' +
            purple('─'.repeat(40));
    });

    // Lists
    result = result.replace(/^- (.+)$/gm, purple('  ◆') + ' $1');
    result = result.replace(/^\d+\. (.+)$/gm, (_, item) => purple('  ◆') + ' ' + item);

    // Links [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        purpleBright.underline('$1') + chalk.dim(' ($2)')
    );

    // Blockquotes
    result = result.replace(/^> (.+)$/gm, purple('  │ ') + chalk.italic('$1'));

    // Horizontal rules
    result = result.replace(/^---$/gm, purple('─'.repeat(50)));

    return result;
}

/**
 * Format tool result for display
 */
export function formatToolResult(toolName, result) {
    const lines = [];

    lines.push(purpleDim(`  ┌─ ${toolName} ─────────────────────`));

    if (result.error) {
        lines.push(chalk.red(`  │ Error: ${result.error}`));
    } else {
        // Format based on tool type
        const formatted = formatResultByType(toolName, result);
        for (const line of formatted.split('\n')) {
            lines.push(purpleDim('  │ ') + line);
        }
    }

    lines.push(purpleDim('  └' + '─'.repeat(40)));

    return lines.join('\n');
}

/**
 * Format result based on tool type
 */
function formatResultByType(toolName, result) {
    switch (toolName) {
        case 'create_market':
            return formatMarketCreation(result);
        case 'generate_market':
            return formatMarketIdea(result);
        case 'list_markets':
            return formatMarketList(result);
        case 'score_news':
            return formatNewsScore(result);
        case 'get_stats':
            return formatStats(result);
        case 'run_command':
            return formatCommandResult(result);
        default:
            return JSON.stringify(result, null, 2);
    }
}

function formatMarketCreation(result) {
    if (!result.success) return chalk.red('Market creation failed');

    return [
        purple('✓ Market created successfully!'),
        '',
        `${chalk.dim('Question:')} ${result.question}`,
        `${chalk.dim('Address:')}  ${violet(result.market)}`,
        `${chalk.dim('Signature:')} ${chalk.gray(result.signature?.slice(0, 20) + '...')}`,
        `${chalk.dim('Duration:')} ${result.duration_days} days`,
        `${chalk.dim('Liquidity:')} ${result.liquidity_usdc} USDC`,
        `${chalk.dim('Network:')}  ${result.network}`
    ].join('\n');
}

function formatMarketIdea(result) {
    if (result.markets) {
        return result.markets.map((m, i) =>
            `${i + 1}. ${chalk.bold(m.question)}\n` +
            `   ${chalk.dim('Category:')} ${m.category} | ` +
            `${chalk.dim('Duration:')} ${m.durationDays}d | ` +
            `${chalk.dim('Liquidity:')} ${m.suggestedLiquidity} USDC`
        ).join('\n\n');
    }

    return [
        chalk.bold(result.question),
        '',
        `${chalk.dim('Category:')} ${result.category}`,
        `${chalk.dim('Duration:')} ${result.durationDays} days`,
        `${chalk.dim('Suggested Liquidity:')} ${result.suggestedLiquidity} USDC`,
        result.reasoning ? `${chalk.dim('Reasoning:')} ${result.reasoning}` : ''
    ].filter(Boolean).join('\n');
}

function formatMarketList(result) {
    if (!result.markets || result.markets.length === 0) {
        return chalk.dim('No markets found');
    }

    return result.markets.map(m =>
        `• ${chalk.bold(m.question?.slice(0, 50) || 'Unknown')}${m.question?.length > 50 ? '...' : ''}\n` +
        `  ${chalk.dim(m.address?.slice(0, 20) + '...')} | ${m.status || 'unknown'}`
    ).join('\n');
}

function formatNewsScore(result) {
    const scoreColor = result.score >= 70 ? chalk.green :
        result.score >= 40 ? chalk.yellow : chalk.red;

    return [
        `${chalk.dim('Score:')} ${scoreColor(result.score + '/100')}`,
        `${chalk.dim('Category:')} ${result.category}`,
        `${chalk.dim('Urgency:')} ${result.urgency}`,
        `${chalk.dim('Market Potential:')} ${result.market_potential ? 'High' : 'Low'}`,
        result.reasoning ? `${chalk.dim('Analysis:')} ${result.reasoning}` : ''
    ].filter(Boolean).join('\n');
}

function formatStats(result) {
    return [
        `${chalk.dim('Period:')} ${result.period || 'all'}`,
        `${chalk.dim('Total Markets:')} ${result.totalMarkets || 0}`,
        `${chalk.dim('Active:')} ${result.activeMarkets || 0}`,
        `${chalk.dim('Resolved:')} ${result.resolvedMarkets || 0}`
    ].join('\n');
}

function formatCommandResult(result) {
    const status = result.success
        ? chalk.green('✓ Success')
        : chalk.red(`✗ Exit code ${result.exit_code}`);

    let output = status;
    if (result.stdout) {
        output += '\n' + result.stdout;
    }
    if (result.stderr && !result.success) {
        output += '\n' + chalk.red(result.stderr);
    }
    return output;
}

/**
 * Print a spinner message
 */
export function printSpinner(message) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    return setInterval(() => {
        process.stdout.write(`\r${purple(frames[i++ % frames.length])} ${message}`);
    }, 80);
}

/**
 * Stop spinner and clear line
 */
export function stopSpinner(spinner, message = '') {
    clearInterval(spinner);
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
    if (message) {
        console.log(message);
    }
}

/**
 * Print tool usage indicator
 */
export function printToolUse(toolName) {
    console.log(purpleDim(`\n  ◆ ${toolName}`));
}

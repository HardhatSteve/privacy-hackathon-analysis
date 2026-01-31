// Slash command handlers for PNPFUCIUS

import chalk from 'chalk';
import { printHelp, printGoodbye, printWelcome, printDivider } from './ui/welcome.js';
import { executeTool, getToolsByCategory } from './tools/index.js';
import { getConfig } from '../config.js';

// Purple color definitions
const purple = chalk.hex('#A855F7');
const purpleBright = chalk.hex('#C084FC');
const purpleDim = chalk.hex('#7C3AED');
const violet = chalk.hex('#8B5CF6');

/**
 * Handle slash commands
 * @param {string} input - User input
 * @param {object} context - Command context (agent instance, etc.)
 * @returns {boolean} True if handled, false if not a command
 */
export async function handleSlashCommand(input, context = {}) {
    const trimmed = input.trim();

    if (!trimmed.startsWith('/')) {
        return false;
    }

    const [command, ...args] = trimmed.slice(1).split(' ');
    const argString = args.join(' ');
    const { agent, executeTool: execTool } = context;

    switch (command.toLowerCase()) {
        case 'help':
        case 'h':
        case '?':
            printHelp();
            return true;

        case 'exit':
        case 'quit':
        case 'q':
            printGoodbye();
            process.exit(0);

        case 'clear':
        case 'cls':
            printWelcome();
            return true;

        case 'config':
            await showConfig();
            return true;

        // ========== MARKET COMMANDS ==========

        case 'discover':
        case 'explore':
        case 'markets':
            const version = args[0] || 'all';
            if (execTool) {
                await execTool('discover_all_markets', { version });
            }
            return true;

        case 'create':
            if (argString) {
                if (execTool) {
                    await execTool('create_market', {
                        question: argString,
                        liquidity_usdc: 1,
                        duration_days: 30
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /create <market question>'));
                console.log(chalk.dim('  Example: /create Will BTC reach $100k by 2025?'));
            }
            return true;

        case 'p2p':
            if (argString) {
                if (execTool) {
                    await execTool('create_p2p_market_simple', {
                        question: argString,
                        side: 'yes',
                        amount_usdc: 1
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /p2p <market question>'));
                console.log(chalk.dim('  Example: /p2p Will ETH flip BTC in 2025?'));
            }
            return true;

        case 'odds':
            if (args.length >= 2) {
                const oddsPercent = parseInt(args[0]);
                const question = args.slice(1).join(' ');
                if (execTool && !isNaN(oddsPercent)) {
                    await execTool('create_amm_market_with_odds', {
                        question,
                        yes_odds_percent: oddsPercent,
                        liquidity_usdc: 1
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /odds <percent> <question>'));
                console.log(chalk.dim('  Example: /odds 70 Will SOL reach $500?'));
            }
            return true;

        case 'info':
            if (argString) {
                if (execTool) {
                    await execTool('get_market_info', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /info <market_address>'));
            }
            return true;

        // ========== TRADING COMMANDS ==========

        case 'buy':
            if (args.length >= 3) {
                if (execTool) {
                    await execTool('buy_tokens', {
                        market_address: args[0],
                        side: args[1],
                        amount_usdc: parseFloat(args[2])
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /buy <market_address> <yes|no> <usdc_amount>'));
                console.log(chalk.dim('  Example: /buy 7xKXw9... yes 10'));
            }
            return true;

        case 'sell':
            if (args.length >= 3) {
                if (execTool) {
                    await execTool('sell_tokens', {
                        market_address: args[0],
                        side: args[1],
                        amount: parseFloat(args[2])
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /sell <market_address> <yes|no> <token_amount>'));
            }
            return true;

        case 'prices':
        case 'price':
            if (argString) {
                if (execTool) {
                    await execTool('get_market_prices', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /prices <market_address>'));
            }
            return true;

        case 'balance':
        case 'balances':
            if (argString) {
                if (execTool) {
                    await execTool('get_balances', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /balance <market_address>'));
            }
            return true;

        // ========== SETTLEMENT COMMANDS ==========

        case 'oracle':
        case 'criteria':
            if (argString) {
                if (execTool) {
                    await execTool('get_settlement_criteria', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /oracle <market_address>'));
                console.log(chalk.dim('  Get AI-generated settlement criteria from PNP Oracle'));
            }
            return true;

        case 'settlement':
        case 'resolve':
            if (argString) {
                if (execTool) {
                    await execTool('get_settlement_data', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /settlement <market_address>'));
                console.log(chalk.dim('  Get resolution result from PNP Oracle'));
            }
            return true;

        case 'settle':
            if (args.length >= 2) {
                if (execTool) {
                    await execTool('settle_market', {
                        market_address: args[0],
                        outcome: args[1]
                    });
                }
            } else {
                console.log(purpleDim('\n  Usage: /settle <market_address> <yes|no>'));
                console.log(chalk.dim('  Settle market with specified outcome (requires authority)'));
            }
            return true;

        case 'redeem':
            if (argString) {
                if (execTool) {
                    await execTool('redeem_position', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /redeem <market_address>'));
            }
            return true;

        case 'refund':
            if (argString) {
                if (execTool) {
                    await execTool('claim_refund', { market_address: argString });
                }
            } else {
                console.log(purpleDim('\n  Usage: /refund <market_address>'));
            }
            return true;

        // ========== INFO COMMANDS ==========

        case 'pnp':
            if (execTool) {
                await execTool('get_pnp_config', {});
            }
            return true;

        case 'tools':
            await showTools();
            return true;

        default:
            console.log(chalk.yellow(`\n  Unknown command: /${command}`));
            console.log(chalk.dim('  Type /help for available commands.'));
            return true;
    }
}

/**
 * Show current configuration
 */
async function showConfig() {
    const config = getConfig();

    console.log();
    console.log(purpleBright('  Configuration'));
    console.log(purple('  ' + '─'.repeat(50)));
    console.log();

    const items = [
        ['Network', config.isMainnet ? chalk.red('mainnet') : chalk.green('devnet')],
        ['RPC URL', chalk.dim(config.rpcUrl.slice(0, 40) + '...')],
        ['Helius API', config.heliusKey ? chalk.green('Configured') : chalk.yellow('Not set')],
        ['Wallet', config.walletKey ? chalk.green('Configured') : chalk.red('Not set')],
        ['Collateral', config.collateralToken],
        ['Default Liquidity', config.defaultLiquidity.toString()],
        ['Default Duration', `${config.defaultDurationDays} days`]
    ];

    for (const [key, value] of items) {
        console.log(`  ${chalk.dim(key.padEnd(18))} ${value}`);
    }

    console.log();
}

/**
 * Show available tools
 */
async function showTools() {
    const categories = getToolsByCategory();

    console.log();
    console.log(purpleBright('  Available Tools'));
    console.log(purple('  ' + '─'.repeat(50)));
    console.log();

    const toolCategories = {
        'Market Creation': [
            'create_market', 'create_p2p_market_simple',
            'create_amm_market_with_odds', 'create_p2p_market_with_odds',
            'create_market_with_oracle', 'create_market_from_source'
        ],
        'Market Discovery': [
            'discover_all_markets', 'list_markets', 'get_market_info',
            'get_v2_market_info', 'get_p2p_market_info', 'get_market_metadata'
        ],
        'Trading': [
            'buy_tokens', 'sell_tokens', 'buy_v3_tokens',
            'get_market_prices', 'get_balances'
        ],
        'Settlement (PNP Oracle)': [
            'get_settlement_criteria', 'get_settlement_data',
            'wait_for_settlement', 'settle_market'
        ],
        'Redemption': [
            'redeem_position', 'redeem_v3_position', 'redeem_p2p_position',
            'claim_refund', 'claim_p2p_refund'
        ],
        'Protocol': [
            'get_pnp_config'
        ]
    };

    for (const [category, tools] of Object.entries(toolCategories)) {
        console.log(violet(`  ${category}`));
        for (const tool of tools) {
            console.log(`    ${purple('◆')} ${tool}`);
        }
        console.log();
    }
}

/**
 * Get list of available commands for help text
 */
export function getCommandList() {
    return [
        // Markets
        { command: '/discover', description: 'Browse all PNP markets' },
        { command: '/create <q>', description: 'Create AMM market' },
        { command: '/p2p <q>', description: 'Create P2P market' },
        { command: '/odds <% q>', description: 'Market with custom odds' },
        { command: '/info <addr>', description: 'Market details' },

        // Trading
        { command: '/buy', description: 'Buy YES/NO tokens' },
        { command: '/sell', description: 'Sell tokens' },
        { command: '/prices <addr>', description: 'Get market prices' },
        { command: '/balance <addr>', description: 'Check balances' },

        // Settlement
        { command: '/oracle <addr>', description: 'Get settlement criteria' },
        { command: '/settlement <addr>', description: 'Get resolution data' },
        { command: '/settle <a> <y/n>', description: 'Settle market' },
        { command: '/redeem <addr>', description: 'Redeem position' },
        { command: '/refund <addr>', description: 'Claim refund' },

        // System
        { command: '/pnp', description: 'PNP protocol info' },
        { command: '/config', description: 'Show configuration' },
        { command: '/tools', description: 'List all tools' },
        { command: '/clear', description: 'Clear screen' },
        { command: '/help', description: 'Show help' },
        { command: '/exit', description: 'Exit PNPFUCIUS' }
    ];
}

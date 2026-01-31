// PNPFUCIUS - The PNP Exchange CLI
// No external LLM required - uses PNP's built-in oracle

import * as readline from 'readline';
import chalk from 'chalk';
import { executeTool } from './tools/index.js';
import { printWelcome, printError, printHelp, printGoodbye } from './ui/welcome.js';
import { handleSlashCommand } from './slash-commands.js';
import { getConfig } from '../config.js';

// Purple color definitions
const purple = chalk.hex('#A855F7');
const purpleBright = chalk.hex('#C084FC');
const purpleDim = chalk.hex('#7C3AED');
const violet = chalk.hex('#8B5CF6');

export class PnpfuciusAgent {
    constructor(options = {}) {
        this.config = getConfig();
        this.verbose = options.verbose ?? false;
    }

    /**
     * Main entry point - run the interactive CLI
     */
    async run() {
        printWelcome();

        console.log(chalk.dim('  Type ') + purple('/help') + chalk.dim(' for commands or enter a command directly.'));
        console.log();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Handle Ctrl+C gracefully
        rl.on('SIGINT', () => {
            printGoodbye();
            process.exit(0);
        });

        while (true) {
            try {
                const userInput = await this.prompt(rl);

                if (!userInput.trim()) {
                    continue;
                }

                // Handle slash commands
                const result = await handleSlashCommand(userInput, {
                    agent: this,
                    executeTool: this.executeTool.bind(this)
                });

                if (result === true) {
                    // Command was handled
                    continue;
                } else if (result === false) {
                    // Not a slash command - show help
                    console.log(purpleDim('\n  ◆ Unknown command. Type /help for available commands.\n'));
                }

            } catch (error) {
                if (error.code === 'ERR_USE_AFTER_CLOSE') {
                    break;
                }
                printError(error.message);
                if (this.verbose) {
                    console.error(error);
                }
            }
        }
    }

    /**
     * Prompt user for input
     */
    async prompt(rl) {
        return new Promise((resolve) => {
            rl.question(purple('\n❯ '), (answer) => {
                resolve(answer);
            });
        });
    }

    /**
     * Execute a tool and display results
     */
    async executeTool(toolName, input) {
        console.log(purpleDim(`\n  ◆ ${toolName}`));

        try {
            const result = await executeTool(toolName, input);

            if (result.error) {
                console.log(chalk.red(`  ✗ ${result.error}`));
            } else {
                console.log(purple(`  ✓ Done`));
                this.displayResult(toolName, result);
            }

            return result;
        } catch (error) {
            console.log(chalk.red(`  ✗ ${error.message}`));
            throw error;
        }
    }

    /**
     * Display tool result in a nice format
     */
    displayResult(toolName, result) {
        console.log();

        switch (toolName) {
            case 'discover_all_markets':
                this.displayMarketDiscovery(result);
                break;
            case 'get_market_info':
            case 'get_v2_market_info':
            case 'get_p2p_market_info':
                this.displayMarketInfo(result);
                break;
            case 'get_market_prices':
                this.displayPrices(result);
                break;
            case 'get_balances':
                this.displayBalances(result);
                break;
            case 'create_market':
            case 'create_p2p_market_simple':
            case 'create_amm_market_with_odds':
                this.displayMarketCreation(result);
                break;
            case 'buy_tokens':
            case 'sell_tokens':
            case 'buy_v3_tokens':
                this.displayTrade(result);
                break;
            case 'get_settlement_criteria':
                this.displaySettlementCriteria(result);
                break;
            case 'get_settlement_data':
                this.displaySettlementData(result);
                break;
            case 'redeem_position':
            case 'redeem_v3_position':
            case 'redeem_p2p_position':
                this.displayRedemption(result);
                break;
            case 'get_pnp_config':
                this.displayPnpConfig(result);
                break;
            default:
                // Generic JSON display
                console.log(chalk.dim(JSON.stringify(result, null, 2)));
        }
    }

    displayMarketDiscovery(result) {
        const v2Count = result.v2_markets?.length || 0;
        const v3Count = result.v3_markets?.length || 0;

        console.log(purpleBright(`  Found ${result.total || v2Count + v3Count} markets on PNP Exchange\n`));

        if (v2Count > 0) {
            console.log(violet('  V2 Markets (AMM)'));
            for (const addr of result.v2_markets.slice(0, 5)) {
                console.log(`    ${purple('◆')} ${chalk.dim(addr)}`);
            }
            if (v2Count > 5) console.log(chalk.dim(`    ... and ${v2Count - 5} more`));
            console.log();
        }

        if (v3Count > 0) {
            console.log(violet('  V3 Markets (P2P)'));
            for (const addr of result.v3_markets.slice(0, 5)) {
                console.log(`    ${purple('◆')} ${chalk.dim(addr)}`);
            }
            if (v3Count > 5) console.log(chalk.dim(`    ... and ${v3Count - 5} more`));
            console.log();
        }

        console.log(chalk.dim('  Use /info <address> for market details'));
    }

    displayMarketInfo(result) {
        const info = result.info || result;
        console.log(purpleBright('  Market Info\n'));

        if (info.question) console.log(`  ${chalk.dim('Question:')} ${info.question}`);
        if (info.market || result.market) console.log(`  ${chalk.dim('Address:')}  ${violet(info.market || result.market)}`);
        if (info.endTime) console.log(`  ${chalk.dim('End Time:')} ${new Date(Number(info.endTime) * 1000).toLocaleString()}`);
        if (info.yesTokenMint) console.log(`  ${chalk.dim('YES Mint:')} ${chalk.dim(info.yesTokenMint)}`);
        if (info.noTokenMint) console.log(`  ${chalk.dim('NO Mint:')}  ${chalk.dim(info.noTokenMint)}`);
    }

    displayPrices(result) {
        console.log(purpleBright('  Market Prices\n'));
        console.log(`  ${chalk.green('YES:')} ${result.yesPrice || 'N/A'}`);
        console.log(`  ${chalk.red('NO:')}  ${result.noPrice || 'N/A'}`);
    }

    displayBalances(result) {
        console.log(purpleBright('  Your Balances\n'));
        console.log(`  ${chalk.green('YES tokens:')} ${result.yesBalance || 0}`);
        console.log(`  ${chalk.red('NO tokens:')}  ${result.noBalance || 0}`);
        if (result.usdcBalance) console.log(`  ${chalk.dim('USDC:')}       ${result.usdcBalance}`);
    }

    displayMarketCreation(result) {
        console.log(purpleBright('  Market Created!\n'));
        console.log(`  ${chalk.dim('Address:')}   ${violet(result.market)}`);
        console.log(`  ${chalk.dim('Signature:')} ${chalk.dim(result.signature?.slice(0, 30) + '...')}`);
        console.log(`  ${chalk.dim('Network:')}   ${result.network}`);
        console.log();
        console.log(chalk.dim(`  View on Solscan: https://solscan.io/tx/${result.signature}`));
    }

    displayTrade(result) {
        console.log(purpleBright('  Trade Executed!\n'));
        console.log(`  ${chalk.dim('Market:')}    ${result.market}`);
        console.log(`  ${chalk.dim('Side:')}      ${result.side?.toUpperCase()}`);
        console.log(`  ${chalk.dim('Amount:')}    ${result.amount || result.amountUsdc} USDC`);
        console.log(`  ${chalk.dim('Signature:')} ${chalk.dim(result.signature?.slice(0, 30) + '...')}`);
    }

    displaySettlementCriteria(result) {
        console.log(purpleBright('  PNP Oracle - Settlement Criteria\n'));

        if (result.criteria) {
            if (typeof result.criteria === 'string') {
                console.log(`  ${result.criteria}`);
            } else {
                console.log(chalk.dim(JSON.stringify(result.criteria, null, 2)));
            }
        } else {
            console.log(chalk.dim('  No criteria available yet'));
        }
    }

    displaySettlementData(result) {
        console.log(purpleBright('  PNP Oracle - Settlement Data\n'));

        if (result.data) {
            if (result.data.answer) {
                console.log(`  ${chalk.dim('Answer:')} ${result.data.answer === 'yes' ? chalk.green('YES') : chalk.red('NO')}`);
            }
            if (result.data.resolvable !== undefined) {
                console.log(`  ${chalk.dim('Resolvable:')} ${result.data.resolvable ? chalk.green('Yes') : chalk.yellow('Not yet')}`);
            }
            if (result.data.reasoning) {
                console.log(`  ${chalk.dim('Reasoning:')} ${result.data.reasoning}`);
            }
        } else {
            console.log(chalk.dim('  No settlement data available yet'));
        }
    }

    displayRedemption(result) {
        console.log(purpleBright('  Position Redeemed!\n'));
        console.log(`  ${chalk.dim('Market:')}    ${result.market}`);
        console.log(`  ${chalk.dim('Signature:')} ${chalk.dim(result.signature?.slice(0, 30) + '...')}`);
        console.log();
        console.log(chalk.green('  Winnings have been sent to your wallet!'));
    }

    displayPnpConfig(result) {
        console.log(purpleBright('  PNP Exchange Configuration\n'));

        if (result.config) {
            if (result.config.publicKey) {
                console.log(`  ${chalk.dim('Config Address:')} ${result.config.publicKey}`);
            }
            if (result.config.account) {
                console.log(chalk.dim(JSON.stringify(result.config.account, null, 2)));
            }
        }
    }
}

// Export factory function
export function createPnpfuciusAgent(options = {}) {
    return new PnpfuciusAgent(options);
}

// Backwards compatibility
export const ClaudePredictAgent = PnpfuciusAgent;
export const createPredictAgent = createPnpfuciusAgent;

// Welcome screen for PNPFUCIUS - The PNP Exchange CLI

import chalk from 'chalk';
import { getConfig } from '../../config.js';

// Purple color definitions
const purple = chalk.hex('#A855F7');
const purpleBright = chalk.hex('#C084FC');
const purpleDim = chalk.hex('#7C3AED');
const purpleBold = chalk.hex('#A855F7').bold;
const violet = chalk.hex('#8B5CF6');

const LOGO = `
${purple('╔════════════════════════════════════════════════════════════════════════╗')}
${purple('║')}                                                                        ${purple('║')}
${purple('║')}  ${purpleBright('██████╗ ███╗   ██╗██████╗ ███████╗██╗   ██╗ ██████╗██╗██╗   ██╗███████╗')}  ${purple('║')}
${purple('║')}  ${purpleBright('██╔══██╗████╗  ██║██╔══██╗██╔════╝██║   ██║██╔════╝██║██║   ██║██╔════╝')}  ${purple('║')}
${purple('║')}  ${purpleBright('██████╔╝██╔██╗ ██║██████╔╝█████╗  ██║   ██║██║     ██║██║   ██║███████╗')}  ${purple('║')}
${purple('║')}  ${purpleBright('██╔═══╝ ██║╚██╗██║██╔═══╝ ██╔══╝  ██║   ██║██║     ██║██║   ██║╚════██║')}  ${purple('║')}
${purple('║')}  ${purpleBright('██║     ██║ ╚████║██║     ██║     ╚██████╔╝╚██████╗██║╚██████╔╝███████║')}  ${purple('║')}
${purple('║')}  ${purpleBright('╚═╝     ╚═╝  ╚═══╝╚═╝     ╚═╝      ╚═════╝  ╚═════╝╚═╝ ╚═════╝ ╚══════╝')}  ${purple('║')}
${purple('║')}                                                                        ${purple('║')}
${purple('║')}  ${violet('        "The wise trader predicts with patience"')}                     ${purple('║')}
${purple('║')}                                                                        ${purple('║')}
${purple('╚════════════════════════════════════════════════════════════════════════╝')}
`;

export function printWelcome(options = {}) {
    const config = getConfig();
    const walletKey = config.walletKey;
    const walletDisplay = walletKey
        ? `${walletKey.slice(0, 6)}...${walletKey.slice(-4)}`
        : chalk.yellow('Not configured');

    console.clear();

    // Logo
    console.log(LOGO);

    // Tagline
    console.log(purpleDim('  ◆ The PNP Exchange CLI'));
    console.log(chalk.dim('  ◆ Create, Trade, and Settle Prediction Markets on Solana'));
    console.log();

    // Status bar
    const networkColor = config.isMainnet ? chalk.red : chalk.green;
    const networkLabel = config.isMainnet ? 'MAINNET' : 'DEVNET';

    console.log(purple('  ┌' + '─'.repeat(62) + '┐'));
    console.log(purple('  │') +
        `  ${chalk.dim('Network')} ${networkColor.bold(networkLabel.padEnd(8))}` +
        `${chalk.dim('│')} ` +
        `${chalk.dim('Wallet')} ${chalk.white(walletDisplay.padEnd(16))}` +
        `${chalk.dim('│')} ` +
        `${chalk.dim('Helius')} ${config.heliusKey ? chalk.green('●') : chalk.yellow('○')}  ` +
        purple('│')
    );
    console.log(purple('  └' + '─'.repeat(62) + '┘'));
    console.log();

    // Help hint
    console.log(chalk.dim('  Type a message or use ') + purple('/help') + chalk.dim(' for commands'));
    console.log();
}

export function printHelp() {
    console.log();
    console.log(purpleBold('  PNPFUCIUS Commands'));
    console.log(purple('  ' + '─'.repeat(50)));
    console.log();

    const sections = [
        {
            title: 'Markets',
            commands: [
                ['/create [q]', 'Create AMM market'],
                ['/p2p [q]', 'Create P2P market'],
                ['/odds <q>', 'Market with custom odds'],
                ['/discover', 'Browse ALL PNP markets'],
                ['/markets', 'List your markets'],
            ]
        },
        {
            title: 'Trading',
            commands: [
                ['/buy', 'Buy YES/NO tokens'],
                ['/sell', 'Sell tokens'],
                ['/prices <addr>', 'Get market prices'],
                ['/balance', 'Check your balances'],
            ]
        },
        {
            title: 'Settlement',
            commands: [
                ['/oracle <addr>', 'Get LLM settlement criteria'],
                ['/settle', 'Settle a market'],
                ['/redeem', 'Redeem winning position'],
                ['/refund', 'Claim refund'],
            ]
        },
        {
            title: 'Info',
            commands: [
                ['/info <addr>', 'Market details'],
                ['/config', 'Show configuration'],
                ['/pnp', 'PNP protocol info'],
            ]
        },
        {
            title: 'System',
            commands: [
                ['/clear', 'Clear screen'],
                ['/help', 'Show this help'],
                ['/exit', 'Exit PNPFUCIUS'],
            ]
        }
    ];

    for (const section of sections) {
        console.log(violet(`  ${section.title}`));
        for (const [cmd, desc] of section.commands) {
            console.log(`    ${purple(cmd.padEnd(16))} ${chalk.dim(desc)}`);
        }
        console.log();
    }

    console.log(violet('  "The market reveals truth to those who wait"'));
    console.log();
}

export function printGoodbye() {
    console.log();
    console.log(purple('  ◆ Thanks for using PNPFUCIUS!'));
    console.log(chalk.dim('  ◆ "The wise trader knows when to exit"'));
    console.log();
}

export function printError(message) {
    console.log();
    console.log(chalk.red(`  ✗ Error: ${message}`));
    console.log();
}

export function printDivider() {
    console.log(purple('─'.repeat(60)));
}

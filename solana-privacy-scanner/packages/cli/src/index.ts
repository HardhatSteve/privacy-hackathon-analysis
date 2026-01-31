import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { scanWallet, scanTransaction, scanProgram } from './commands/index.js';
import { analyzeCommand } from './commands/analyze.js';
import { initCommand } from './commands/init.js';
import { VERSION } from 'solana-privacy-scanner-core';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const program = new Command();

program
  .name('solana-privacy-scanner')
  .description('Privacy risk scanner for Solana blockchain')
  .version(VERSION);

// Wallet scan command
program
  .command('scan-wallet')
  .alias('wallet')
  .description('Scan a Solana wallet address for privacy risks')
  .argument('<address>', 'Wallet address to scan')
  .option('--rpc <url>', 'Custom RPC endpoint URL (optional)', process.env.SOLANA_RPC)
  .option('--json', 'Output as JSON', false)
  .option('--max-signatures <number>', 'Maximum number of signatures to fetch', '100')
  .option('--output <file>', 'Write output to file')
  .option('--nicknames <file>', 'JSON file with address nicknames for readable output', process.env.PRIVACY_SCANNER_NICKNAMES)
  .action(scanWallet);

// Transaction scan command
program
  .command('scan-transaction')
  .alias('tx')
  .description('Scan a single Solana transaction for privacy risks')
  .argument('<signature>', 'Transaction signature to scan')
  .option('--rpc <url>', 'Custom RPC endpoint URL (optional)', process.env.SOLANA_RPC)
  .option('--json', 'Output as JSON', false)
  .option('--output <file>', 'Write output to file')
  .action(scanTransaction);

// Program scan command
program
  .command('scan-program')
  .alias('program')
  .description('Scan a Solana program for privacy risks')
  .argument('<programId>', 'Program ID to scan')
  .option('--rpc <url>', 'Custom RPC endpoint URL (optional)', process.env.SOLANA_RPC)
  .option('--json', 'Output as JSON', false)
  .option('--max-accounts <number>', 'Maximum number of accounts to fetch', '100')
  .option('--max-transactions <number>', 'Maximum number of transactions to fetch', '50')
  .option('--output <file>', 'Write output to file')
  .action(scanProgram);

// Static code analysis command
program
  .command('analyze')
  .description('Analyze source code for privacy vulnerabilities')
  .argument('<paths...>', 'Files or directories to analyze')
  .option('--json', 'Output as JSON', false)
  .option('--no-low', 'Exclude low severity issues')
  .option('--quiet', 'Only show summary')
  .option('--output <file>', 'Write output to file')
  .action(analyzeCommand);

// Interactive setup wizard
program
  .command('init')
  .description('Interactive setup wizard for privacy configuration')
  .action(initCommand);

program.parse();

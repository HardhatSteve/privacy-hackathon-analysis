// cli/commands/ghost.ts
// Privacy Ghost Score Command - Non-breaking CLI extension

import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolVoidClient } from '../../sdk/client';
import { GhostScoreCalculator } from '../utils/ghost-calculator';
import { GhostArt } from '../utils/ghost-art';
import { BadgeGenerator } from '../utils/badge-generator';
import chalk from 'chalk';

/**
 * Register the ghost command with the CLI program
 * This is a non-breaking addition to your existing CLI
 */
export function registerGhostCommand(program: Command) {
  program
    .command('ghost')
    .description(' Generate Privacy Ghost Score with visual terminal art')
    .argument('<address>', 'Wallet address to analyze')
    .option('--badge', 'Generate shareable privacy badge with ZK proof')
    .option('--json', 'Output as JSON (for automation)')
    .option('--share', 'Show social media sharing options')
    .option('--verify <proof>', 'Verify a privacy badge proof')
    .action(async (address: string, options) => {
      try {
        // Handle proof verification
        if (options.verify) {
          handleProofVerification(options.verify);
          return;
        }

        console.log(chalk.cyan(' Analyzing wallet privacy...\n'));

        // Initialize client using existing configuration
        const client = new SolVoidClient(
          {
            rpcUrl: program.opts().rpc || 'https://api.mainnet-beta.solana.com',
            programId: program.opts().program || 'Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i',
            relayerUrl: program.opts().relayer || 'http://localhost:3000'
          },
          {} as any // Wallet not needed for read-only operations
        );

        // Use existing protect() method - NO BREAKING CHANGES!
        console.log(chalk.gray('   Scanning for privacy leaks...'));
        const scanResults = await client.protect(new PublicKey(address));

        console.log(chalk.gray('   Calculating Ghost Score...'));
        const ghostScore = GhostScoreCalculator.calculate(scanResults);

        console.log(chalk.gray('   Generating visual report...\n'));

        // JSON output for automation
        if (options.json) {
          console.log(JSON.stringify({
            address,
            ghostScore,
            timestamp: Date.now(),
            scanResults
          }, null, 2));
          return;
        }

        // Display beautiful terminal art
        console.log(GhostArt.formatGhostScore(ghostScore));

        // Generate and display badge
        if (options.badge || options.share) {
          await handleBadgeGeneration(address, ghostScore, options.share);
        }

        // Show call-to-action
        console.log(chalk.cyan('\n Next Steps:'));
        if (ghostScore.score < 70) {
          console.log(chalk.yellow('   Consider shielding transactions to improve privacy'));
          console.log(chalk.yellow('   Use: solvoid-scan shield <amount>'));
        } else {
          console.log(chalk.green('   Great privacy! Consider sharing your badge'));
          console.log(chalk.green('   Use: solvoid-scan ghost <address> --badge --share'));
        }

      } catch (error: any) {
        console.error(chalk.red('\n Error generating Ghost Score:'), error.message);
        console.error(chalk.gray('\nTroubleshooting:'));
        console.error(chalk.gray('  • Check that the address is valid'));
        console.error(chalk.gray('  • Ensure your RPC endpoint is accessible'));
        console.error(chalk.gray('  • Try again with --rpc <custom-endpoint>'));
        process.exit(1);
      }
    });
}

/**
 * Handle badge generation and display
 */
async function handleBadgeGeneration(
  address: string,
  ghostScore: any,
  showShare: boolean
): Promise<void> {
  console.log(chalk.cyan('\n Generating Privacy Badge...\n'));

  const badge = await BadgeGenerator.generate(address, ghostScore);

  // Terminal badge
  console.log(GhostArt.formatBadge(badge));

  // Social sharing
  if (showShare) {
    console.log(chalk.bold(' Twitter/X Post:'));
    console.log(chalk.gray(''.repeat(60)));
    console.log(chalk.blue(badge.twitterText));
    console.log(chalk.gray(''.repeat(60)));
    console.log();

    console.log(chalk.bold(' Discord Message:'));
    console.log(chalk.gray(''.repeat(60)));
    console.log(badge.discordText);
    console.log(chalk.gray(''.repeat(60)));
    console.log();

    console.log(chalk.bold(' Privacy Proof (ZK):'));
    console.log(chalk.gray(''.repeat(60)));
    console.log(chalk.gray(badge.proofData.slice(0, 80) + '...'));
    console.log(chalk.dim('\n(This is a zero-knowledge proof of your privacy score'));
    console.log(chalk.dim('that doesn\'t reveal your wallet address)'));
    console.log(chalk.gray(''.repeat(60)));
    console.log();

    console.log(chalk.cyan(' Verification:'));
    console.log(`Anyone can verify your proof with:`);
    console.log(chalk.green(`solvoid-scan ghost --verify "${badge.proofData.slice(0, 40)}..."`));
    console.log();
  }
}

/**
 * Verify a privacy badge proof
 */
function handleProofVerification(proofData: string): void {
  console.log(chalk.cyan('\n Verifying Privacy Badge Proof...\n'));

  const verification = BadgeGenerator.verifyBadge(proofData);

  if (verification) {
    console.log(chalk.green(' Proof is VALID\n'));
    console.log(chalk.bold('Proof Details:'));
    console.log(`  Verification: ${chalk.cyan('SUCCESSFUL')}`);
    console.log(chalk.green('This wallet holder has proven their privacy score'));
    console.log(chalk.green('without revealing their wallet address! '));
  } else {
    console.log(chalk.red(' Proof is INVALID or EXPIRED\n'));
    console.log(chalk.yellow('Possible reasons:'));
    console.log('  • Proof data is corrupted');
    console.log('  • Proof was tampered with');
  }

  console.log();
}

/**
 * Add helper text for the ghost command
 */
export function getGhostCommandHelp(): string {
  return `
${chalk.bold.cyan('Privacy Ghost Score')}

Analyze your wallet's privacy and get a visual "Ghost Score" (0-100).

${chalk.bold('Usage:')}
  solvoid-scan ghost <address>              Basic ghost score
  solvoid-scan ghost <address> --badge      Generate shareable badge
  solvoid-scan ghost <address> --share      Show social sharing options
  solvoid-scan ghost <address> --json       JSON output for automation
  solvoid-scan ghost --verify <proof>       Verify a privacy badge

${chalk.bold('Examples:')}
  # Analyze privacy
  solvoid-scan ghost 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

  # Generate badge for GitHub
  solvoid-scan ghost 9WzDXw... --badge

  # Share on social media
  solvoid-scan ghost 9WzDXw... --share

  # Get JSON for automation
  solvoid-scan ghost 9WzDXw... --json | jq .ghostScore.score

${chalk.bold('Ghost Score Levels:')}
  90-100  ${chalk.green(' Invisible')}   - Elite privacy
  70-89   ${chalk.cyan('  Translucent')} - Good privacy
  50-69   ${chalk.yellow('  Visible')}     - Needs improvement
  30-49   ${chalk.red(' Exposed')}     - Poor privacy
  0-29    ${chalk.red.bold(' Glass House')} - Critical issues

${chalk.bold('What it analyzes:')}
   Anonymity     - Use of shielded transactions
   Linkage       - Links to CEX/DEX addresses
   Pattern       - Transaction pattern detection
   Volume        - Amount obfuscation
   Timing        - Timing analysis resistance
`;
}

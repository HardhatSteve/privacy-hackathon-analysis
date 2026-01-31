import { writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import type { PrivacyConfig } from 'solana-privacy-scanner-core';

export async function initCommand() {
  console.log(chalk.bold.blue('\n🔍 Solana Privacy Scanner - Setup Wizard\n'));

  // Check if config already exists
  const configPath = join(process.cwd(), '.privacyrc');
  if (existsSync(configPath)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Configuration file already exists. Overwrite?',
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.yellow('\nSetup cancelled.'));
      return;
    }
  }

  // Gather configuration
  const responses = await prompts([
    {
      type: 'select',
      name: 'preset',
      message: 'Choose a configuration preset:',
      choices: [
        {
          title: 'Development (Permissive)',
          value: 'dev',
          description: 'Relaxed rules for development',
        },
        {
          title: 'Production (Strict)',
          value: 'prod',
          description: 'Strict rules for production code',
        },
        {
          title: 'Custom',
          value: 'custom',
          description: 'Configure manually',
        },
      ],
      initial: 0,
    },
    {
      type: (prev) => (prev === 'custom' ? 'select' : null),
      name: 'maxRiskLevel',
      message: 'Maximum acceptable risk level:',
      choices: [
        { title: 'LOW', value: 'LOW' },
        { title: 'MEDIUM', value: 'MEDIUM' },
        { title: 'HIGH', value: 'HIGH' },
      ],
      initial: 1,
    },
    {
      type: (_, values) => (values.preset === 'custom' ? 'confirm' : null),
      name: 'enforceInCI',
      message: 'Enforce privacy checks in CI/CD?',
      initial: true,
    },
    {
      type: (_, values) => (values.preset === 'custom' ? 'confirm' : null),
      name: 'blockOnFailure',
      message: 'Block builds/commits on privacy policy violations?',
      initial: false,
    },
    {
      type: 'text',
      name: 'devnetWallet',
      message: 'Test wallet address (devnet):',
      validate: (value) =>
        !value || value.length === 44 || 'Invalid Solana address',
    },
    {
      type: 'multiselect',
      name: 'integrations',
      message: 'Which integrations would you like to set up?',
      choices: [
        { title: 'GitHub Actions', value: 'github', selected: true },
        { title: 'Pre-commit Hook', value: 'precommit', selected: true },
        { title: 'Testing Matchers', value: 'testing', selected: true },
      ],
    },
  ]);

  if (!responses.preset) {
    console.log(chalk.yellow('\nSetup cancelled.'));
    return;
  }

  // Generate config based on preset
  let config: PrivacyConfig;

  switch (responses.preset) {
    case 'dev':
      config = {
        maxRiskLevel: 'HIGH',
        enforceInCI: false,
        blockOnFailure: false,
        thresholds: {
          maxHighSeverity: 5,
        },
      };
      break;

    case 'prod':
      config = {
        maxRiskLevel: 'LOW',
        enforceInCI: true,
        blockOnFailure: true,
        thresholds: {
          maxHighSeverity: 0,
          maxMediumSeverity: 2,
          minPrivacyScore: 80,
        },
      };
      break;

    case 'custom':
      config = {
        maxRiskLevel: responses.maxRiskLevel || 'MEDIUM',
        enforceInCI: responses.enforceInCI ?? true,
        blockOnFailure: responses.blockOnFailure ?? false,
        thresholds: {
          maxHighSeverity: 0,
        },
      };
      break;

    default:
      config = {
        maxRiskLevel: 'MEDIUM',
        enforceInCI: true,
        blockOnFailure: false,
        thresholds: {
          maxHighSeverity: 0,
        },
      };
  }

  // Add test wallet if provided
  if (responses.devnetWallet) {
    config.testWallets = {
      devnet: responses.devnetWallet,
    };
  }

  // Write config file
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`\n✓ Created ${configPath}`));

  // Set up integrations
  const integrations = responses.integrations || [];

  if (integrations.includes('github')) {
    setupGitHubActions();
  }

  if (integrations.includes('precommit')) {
    setupPreCommitHook();
  }

  if (integrations.includes('testing')) {
    setupTestingMatchers();
  }

  // Print next steps
  console.log(chalk.bold.green('\n✓ Setup complete!\n'));
  console.log(chalk.bold('Next steps:\n'));
  console.log('  1. Review your configuration in ' + chalk.cyan('.privacyrc'));
  console.log('  2. Add a test wallet address to scan');
  console.log('  3. Run ' + chalk.cyan('npx solana-privacy-scanner scan-wallet <ADDRESS>'));
  console.log('\nFor more info: ' + chalk.cyan('https://sps.guide'));
}

function setupGitHubActions() {
  const workflowDir = join(process.cwd(), '.github', 'workflows');
  const workflowPath = join(workflowDir, 'privacy-check.yml');

  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true });
  }

  const workflow = `name: Privacy Check

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  privacy-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Install Privacy Scanner
        run: npm install -g solana-privacy-scanner
      
      - name: Run Privacy Check
        run: |
          # Get test wallet from config
          TEST_WALLET=\$(node -e "console.log(require('./.privacyrc').testWallets?.devnet || '')")
          
          if [ -n "$TEST_WALLET" ]; then
            solana-privacy-scanner scan-wallet $TEST_WALLET --json --output privacy-report.json
          else
            echo "No test wallet configured, skipping scan"
            exit 0
          fi
      
      - name: Check Privacy Policy
        run: |
          # Parse report and check against policy
          RISK_LEVEL=\$(node -e "console.log(require('./privacy-report.json').overallRisk)")
          MAX_RISK=\$(node -e "console.log(require('./.privacyrc').maxRiskLevel)")
          
          echo "Risk Level: $RISK_LEVEL"
          echo "Max Allowed: $MAX_RISK"
          
          # Simple comparison (can be enhanced)
          if [ "$RISK_LEVEL" = "HIGH" ] && [ "$MAX_RISK" != "HIGH" ]; then
            echo "Privacy policy violated!"
            exit 1
          fi
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: privacy-report
          path: privacy-report.json
`;

  writeFileSync(workflowPath, workflow);
  console.log(chalk.green(`\n✓ Created ${workflowPath}`));
}

function setupPreCommitHook() {
  const hookPath = join(process.cwd(), '.husky', 'pre-commit');
  const huskyDir = join(process.cwd(), '.husky');

  if (!existsSync(huskyDir)) {
    mkdirSync(huskyDir, { recursive: true });
  }

  const hook = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Load config
CONFIG_FILE=".privacyrc"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "No .privacyrc found, skipping privacy check"
  exit 0
fi

# Get test wallet
TEST_WALLET=$(node -e "const config = require('./.privacyrc'); console.log(config.testWallets?.devnet || '');" 2>/dev/null)

if [ -z "$TEST_WALLET" ]; then
  echo "No test wallet configured, skipping privacy check"
  exit 0
fi

echo "🔍 Running privacy check..."

# Run privacy scanner
npx solana-privacy-scanner scan-wallet $TEST_WALLET --json > /tmp/privacy-report.json 2>&1

# Check result
RISK_LEVEL=$(node -e "const report = require('/tmp/privacy-report.json'); console.log(report.overallRisk);" 2>/dev/null)

if [ "$RISK_LEVEL" = "HIGH" ]; then
  echo "❌ HIGH privacy risk detected!"
  echo "Run 'npx solana-privacy-scanner scan-wallet $TEST_WALLET' for details"
  echo ""
  echo "To bypass this check, use: git commit --no-verify"
  exit 1
fi

echo "✓ Privacy check passed"
exit 0
`;

  writeFileSync(hookPath, hook);
  
  // Make executable
  try {
    chmodSync(hookPath, '755');
  } catch (error) {
    console.warn(chalk.yellow('Could not make hook executable. Run: chmod +x .husky/pre-commit'));
  }

  console.log(chalk.green(`\n✓ Created ${hookPath}`));
  console.log(chalk.yellow('  Note: Install husky with: npm install --save-dev husky && npx husky install'));
}

function setupTestingMatchers() {
  const testSetupPath = join(process.cwd(), 'tests', 'setup.ts');
  const testDir = join(process.cwd(), 'tests');

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const setup = `// Privacy testing setup
import '@solana-privacy-scanner/ci-tools/matchers';

// This file is automatically loaded by Vitest
// Add any additional test setup here
`;

  writeFileSync(testSetupPath, setup);
  console.log(chalk.green(`\n✓ Created ${testSetupPath}`));

  // Create example test
  const exampleTestPath = join(testDir, 'privacy.example.test.ts');
  const exampleTest = `import { describe, it, expect } from 'vitest';
import { Connection, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { simulateTransactionPrivacy } from '@solana-privacy-scanner/ci-tools/simulator';

describe('Privacy Tests Example', () => {
  const connection = new Connection('https://api.devnet.solana.com');

  it('should maintain privacy for basic transfer', async () => {
    // Create a simple transfer transaction
    const from = Keypair.generate();
    const to = Keypair.generate();
    
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to.publicKey,
        lamports: 1000000,
      })
    );

    // Simulate and analyze privacy
    const report = await simulateTransactionPrivacy(tx, connection);

    // Make privacy assertions
    expect(report).toHavePrivacyRisk('LOW');
    expect(report).toHaveNoHighRiskSignals();
    expect(report).toHaveAtMostSignals(2);
  });
});
`;

  writeFileSync(exampleTestPath, exampleTest);
  console.log(chalk.green(`✓ Created ${exampleTestPath}`));
}

import { writeFileSync, existsSync } from 'fs';
import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider,
  createFileNicknameProvider,
  type PrivacyReport,
  type NicknameProvider,
} from 'solana-privacy-scanner-core';
import { formatReport } from '../formatter.js';

interface WalletOptions {
  rpc?: string;
  json?: boolean;
  maxSignatures?: string;
  output?: string;
  nicknames?: string;
}

/**
 * Load nickname provider from file if specified
 */
function loadNicknames(path?: string): NicknameProvider | undefined {
  if (!path) {
    // Check environment variable
    const envPath = process.env.PRIVACY_SCANNER_NICKNAMES;
    if (envPath && existsSync(envPath)) {
      console.error(`Loading nicknames from: ${envPath}`);
      return createFileNicknameProvider(envPath);
    }
    return undefined;
  }

  if (!existsSync(path)) {
    console.error(`Warning: Nicknames file not found: ${path}`);
    console.error('Creating empty file for future use...');
    // Create the file with empty store
    const provider = createFileNicknameProvider(path);
    return provider;
  }

  console.error(`Loading nicknames from: ${path}`);
  return createFileNicknameProvider(path);
}

export async function scanWallet(address: string, options: WalletOptions) {
  try {
    console.error(`Scanning wallet: ${address}`);
    console.error('');

    // Load nicknames if provided
    const nicknames = loadNicknames(options.nicknames);
    if (nicknames && nicknames.count() > 0) {
      console.error(`Loaded ${nicknames.count()} address nicknames`);
      console.error('');
    }

    // Create RPC client (uses default RPC if not provided)
    const client = new RPCClient(
      options.rpc ? {
        rpcUrl: options.rpc,
        maxConcurrency: 5,
        maxRetries: 3,
      } : {
        maxConcurrency: 5,
        maxRetries: 3,
      }
    );

    // Collect raw data
    console.error('Collecting transaction data...');
    const maxSigs = parseInt(options.maxSignatures || '100', 10);
    const rawData = await collectWalletData(client, address, {
      maxSignatures: maxSigs,
      includeTokenAccounts: true,
    });

    console.error(`Found ${rawData.signatures.length} transactions`);
    console.error('');

    // Normalize data
    console.error('Analyzing privacy patterns...');
    const labelProvider = createDefaultLabelProvider();
    const context = normalizeWalletData(rawData, labelProvider);

    // Generate report
    const report: PrivacyReport = generateReport(context);

    // Output
    if (options.json) {
      const output = JSON.stringify(report, null, 2);
      if (options.output) {
        writeFileSync(options.output, output);
        console.error(`Report written to: ${options.output}`);
      } else {
        console.log(output);
      }
    } else {
      // Disable colors when writing to file
      const formatted = formatReport(report, !!options.output, nicknames);
      if (options.output) {
        writeFileSync(options.output, formatted);
        console.error(`Report written to: ${options.output}`);
      } else {
        console.log(formatted);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error scanning wallet:', error);
    process.exit(1);
  }
}

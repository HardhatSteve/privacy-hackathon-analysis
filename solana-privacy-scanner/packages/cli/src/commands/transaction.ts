import { writeFileSync } from 'fs';
import {
  RPCClient,
  collectTransactionData,
  normalizeTransactionData,
  generateReport,
  createDefaultLabelProvider,
  type PrivacyReport,
} from 'solana-privacy-scanner-core';
import { formatReport } from '../formatter.js';

interface TransactionOptions {
  rpc?: string;
  json?: boolean;
  output?: string;
}

export async function scanTransaction(signature: string, options: TransactionOptions) {
  try {
    console.error(`Scanning transaction: ${signature}`);
    console.error('');

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

    // Collect transaction data
    console.error('Fetching transaction...');
    const rawData = await collectTransactionData(client, signature);

    if (!rawData.transaction) {
      console.error('Error: Transaction not found or failed to fetch');
      process.exit(1);
    }

    console.error('Analyzing transaction...');
    console.error('');

    // Normalize data
    const labelProvider = createDefaultLabelProvider();
    const context = normalizeTransactionData(rawData, labelProvider);

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
      const formatted = formatReport(report, !!options.output);
      if (options.output) {
        writeFileSync(options.output, formatted);
        console.error(`Report written to: ${options.output}`);
      } else {
        console.log(formatted);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error scanning transaction:', error);
    process.exit(1);
  }
}

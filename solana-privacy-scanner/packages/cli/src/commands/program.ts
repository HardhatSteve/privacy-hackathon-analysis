import { writeFileSync } from 'fs';
import {
  RPCClient,
  collectProgramData,
  normalizeProgramData,
  generateReport,
  createDefaultLabelProvider,
  type PrivacyReport,
} from 'solana-privacy-scanner-core';
import { formatReport } from '../formatter.js';

interface ProgramOptions {
  rpc?: string;
  json?: boolean;
  maxAccounts?: string;
  maxTransactions?: string;
  output?: string;
}

export async function scanProgram(programId: string, options: ProgramOptions) {
  try {
    console.error(`Scanning program: ${programId}`);
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

    // Collect program data
    console.error('Collecting program data...');
    const maxAccounts = parseInt(options.maxAccounts || '100', 10);
    const maxTxs = parseInt(options.maxTransactions || '50', 10);
    
    const rawData = await collectProgramData(client, programId, {
      maxAccounts,
      maxTransactions: maxTxs,
    });

    console.error(`Found ${rawData.accounts.length} accounts, ${rawData.relatedTransactions.length} transactions`);
    console.error('');

    // Normalize data
    console.error('Analyzing program activity...');
    const labelProvider = createDefaultLabelProvider();
    const context = normalizeProgramData(rawData, labelProvider);

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
    console.error('Error scanning program:', error);
    process.exit(1);
  }
}

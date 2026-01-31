/**
 * scan-wallet skill handler
 *
 * Performs on-chain wallet privacy analysis using the core library
 */

import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider,
} from 'solana-privacy-scanner-core';
import { formatPrivacyReport, formatSignalWithDetails } from '../../src/formatter.js';
import type { SkillResult, PrivacyReport } from '../../src/types.js';

export interface ScanWalletOptions {
  address: string;
  maxSignatures?: number;
  rpcUrl?: string;
  json?: boolean;
  verbose?: boolean;
}

/**
 * Execute on-chain wallet privacy analysis
 */
export async function scanWallet(options: ScanWalletOptions): Promise<SkillResult> {
  try {
    // Validate inputs
    if (!options.address) {
      return {
        success: false,
        error: 'No wallet address provided. Usage: /scan-wallet <address>',
      };
    }

    // Validate address format (basic check)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(options.address)) {
      return {
        success: false,
        error: `Invalid Solana address: ${options.address}`,
      };
    }

    if (options.verbose) {
      console.log(`Scanning wallet: ${options.address}`);
      console.log(`Max signatures: ${options.maxSignatures || 100}`);
      if (options.rpcUrl) {
        console.log(`RPC URL: ${options.rpcUrl}`);
      }
    }

    // Initialize RPC client
    const rpc = new RPCClient(options.rpcUrl || process.env.SOLANA_RPC);

    // Check RPC health
    const isHealthy = await rpc.healthCheck();
    if (!isHealthy) {
      return {
        success: false,
        error: 'RPC endpoint is not healthy. Please check your connection or try a different RPC.',
      };
    }

    // Initialize label provider
    const labels = createDefaultLabelProvider();

    if (options.verbose) {
      console.log(`Loaded ${labels.getCount()} known address labels`);
      console.log('Fetching wallet data...');
    }

    // Collect wallet data
    const rawData = await collectWalletData(rpc, options.address, {
      maxSignatures: options.maxSignatures || 100,
      includeTokenAccounts: true,
    });

    if (options.verbose) {
      console.log('Normalizing data...');
    }

    // Normalize data
    const context = normalizeWalletData(rawData, labels);

    if (options.verbose) {
      console.log('Generating privacy report...');
    }

    // Generate report
    const report = generateReport(context);

    // Return raw JSON if requested
    if (options.json) {
      return {
        success: true,
        data: report,
        message: 'Analysis complete',
      };
    }

    // Format results for display
    const formatted = formatPrivacyReport(report);
    const message = createDisplayMessage(formatted, report);

    return {
      success: true,
      data: formatted,
      message,
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Wallet scan failed: ${error.message}`,
      data: { stack: error.stack },
    };
  }
}

/**
 * Create formatted display message from privacy report
 */
function createDisplayMessage(formatted: any, report: PrivacyReport): string {
  const lines: string[] = [];

  // Add summary
  lines.push(formatted.summary);
  lines.push('');

  // If no signals, highlight clean wallet
  if (formatted.stats.totalSignals === 0) {
    lines.push('✅ **No privacy risks detected!**');
    lines.push('');
    lines.push('This wallet shows good privacy practices based on on-chain data.');
    return lines.join('\n');
  }

  // Add known entities if any
  if (formatted.knownEntities.length > 0) {
    lines.push('## 🏛️ Known Entity Interactions');
    lines.push('');
    formatted.knownEntities.forEach((entity: string) => {
      lines.push(`- ${entity}`);
    });
    lines.push('');
  }

  // Group signals by severity
  const highSignals = formatted.signals.filter((s: any) => s.severity === 'HIGH');
  const mediumSignals = formatted.signals.filter((s: any) => s.severity === 'MEDIUM');
  const lowSignals = formatted.signals.filter((s: any) => s.severity === 'LOW');

  // Display HIGH severity signals
  if (highSignals.length > 0) {
    lines.push('## 🔴 HIGH Risk Signals');
    lines.push('');
    highSignals.forEach((signal: any) => {
      lines.push(`### ${signal.name}`);
      lines.push('');
      lines.push(signal.reason);
      lines.push('');

      if (signal.evidence.length > 0) {
        lines.push('**Evidence:**');
        signal.evidence.slice(0, 3).forEach((ev: string) => {
          lines.push(`- ${ev}`);
        });
        if (signal.evidence.length > 3) {
          lines.push(`- ... and ${signal.evidence.length - 3} more`);
        }
        lines.push('');
      }

      if (signal.mitigation) {
        lines.push(`💡 **Mitigation:** ${signal.mitigation}`);
        lines.push('');
      }
    });
  }

  // Display MEDIUM severity signals (condensed)
  if (mediumSignals.length > 0) {
    lines.push('## 🟡 MEDIUM Risk Signals');
    lines.push('');
    mediumSignals.forEach((signal: any) => {
      lines.push(`**${signal.name}**: ${signal.reason}`);
      if (signal.mitigation) {
        lines.push(`  💡 ${signal.mitigation}`);
      }
      lines.push('');
    });
  }

  // Display LOW severity signals (very condensed)
  if (lowSignals.length > 0) {
    lines.push('## 🔵 LOW Risk Signals');
    lines.push('');
    const lowNames = lowSignals.map((s: any) => s.name).join(', ');
    lines.push(`Detected: ${lowNames}`);
    lines.push('');
  }

  // Add mitigations
  if (formatted.mitigations.length > 0) {
    lines.push('## 💡 Recommended Actions');
    lines.push('');
    formatted.mitigations.forEach((mitigation: string) => {
      lines.push(`- ${mitigation}`);
    });
    lines.push('');
  }

  // Add next steps
  lines.push('## Next Steps');
  lines.push('');
  lines.push('- Use `/explain-risk <signal-id>` to learn more about specific risks');
  lines.push('- Use `/scan-code` to analyze your source code before deployment');
  lines.push('- Review and implement the recommended privacy improvements');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`📊 Report version: ${report.version} | Generated: ${new Date(report.timestamp).toISOString()}`);

  return lines.join('\n');
}

/**
 * CLI entry point for testing
 */
export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node handler.js <address> [--max-signatures N] [--rpc URL] [--json] [--verbose]');
    process.exit(1);
  }

  const options: ScanWalletOptions = {
    address: args[0],
    maxSignatures: undefined,
    rpcUrl: undefined,
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
  };

  // Parse --max-signatures
  const maxSigIndex = args.indexOf('--max-signatures');
  if (maxSigIndex !== -1 && args[maxSigIndex + 1]) {
    options.maxSignatures = parseInt(args[maxSigIndex + 1], 10);
  }

  // Parse --rpc
  const rpcIndex = args.indexOf('--rpc');
  if (rpcIndex !== -1 && args[rpcIndex + 1]) {
    options.rpcUrl = args[rpcIndex + 1];
  }

  const result = await scanWallet(options);

  if (!result.success) {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }

  console.log(result.message || JSON.stringify(result.data, null, 2));
  process.exit(0);
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

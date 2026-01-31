# For LLMs - Library Integration

This page provides a comprehensive reference for AI coding assistants. Copy the entire section below and paste it into your LLM (Claude, Cursor, ChatGPT, etc.) when you need help integrating the Solana Privacy Scanner library.

---

## Complete Library Reference (Copy Everything Below)

```
SOLANA PRIVACY SCANNER - LIBRARY INTEGRATION GUIDE

LIBRARY: solana-privacy-scanner-core
VERSION: 0.7.0
npm: npm install solana-privacy-scanner-core
DOCUMENTATION: https://sps.guide/library/api-reference

═══════════════════════════════════════════════════════════════════════════════
OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

Analyzes Solana wallets, transactions, and programs for privacy risks using 13
Solana-native heuristics. Returns deterministic privacy reports with risk levels
(LOW/MEDIUM/HIGH), detected privacy signals, and actionable mitigation advice.

Key Features:
- No configuration required (default QuickNode RPC included)
- 13 privacy heuristics (Solana-native detection)
- Deterministic analysis (same input = same output)
- Built-in rate limiting and retry logic
- Known entity detection (78+ CEXs, bridges, protocols)
- TypeScript-first with full type definitions

═══════════════════════════════════════════════════════════════════════════════
INSTALLATION
═══════════════════════════════════════════════════════════════════════════════

npm install solana-privacy-scanner-core

═══════════════════════════════════════════════════════════════════════════════
CORE ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

The library follows a 4-step pipeline:

1. DATA COLLECTION (collectors/)
   - Fetch raw on-chain data via RPC
   - Functions: collectWalletData, collectTransactionData, collectProgramData

2. NORMALIZATION (normalizer/)
   - Convert raw data to standardized ScanContext
   - Functions: normalizeWalletData, normalizeTransactionData, normalizeProgramData

3. HEURISTIC EVALUATION (heuristics/)
   - Run 13 privacy heuristics on ScanContext
   - Each heuristic returns PrivacySignal[] (array of detected risks)

4. REPORT GENERATION (scanner/)
   - Aggregate signals, calculate risk, generate mitigations
   - Function: generateReport(context)

═══════════════════════════════════════════════════════════════════════════════
BASIC USAGE - WALLET SCAN
═══════════════════════════════════════════════════════════════════════════════

import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider,
  type PrivacyReport
} from 'solana-privacy-scanner-core';

async function scanWallet(address: string): Promise<PrivacyReport> {
  // 1. Initialize RPC client (no config needed - uses default)
  const rpc = new RPCClient();

  // 2. Initialize label provider for known entity detection
  const labels = createDefaultLabelProvider();

  // 3. Collect raw blockchain data
  const rawData = await collectWalletData(rpc, address, {
    maxSignatures: 100,        // Limit transaction history
    includeTokenAccounts: true // Include SPL token accounts
  });

  // 4. Normalize into analysis-ready format
  const context = normalizeWalletData(rawData, labels);

  // 5. Generate privacy report
  const report = generateReport(context);

  return report;
}

// Usage
const report = await scanWallet('WALLET_ADDRESS_HERE');

console.log('Risk Level:', report.overallRisk);        // LOW | MEDIUM | HIGH
console.log('Total Signals:', report.summary.totalSignals);
console.log('HIGH Risks:', report.summary.highRiskSignals);
console.log('Transactions Analyzed:', report.summary.transactionsAnalyzed);

// Handle high-risk wallets
if (report.overallRisk === 'HIGH') {
  console.warn('⚠️ HIGH PRIVACY RISK DETECTED');

  report.signals
    .filter(s => s.severity === 'HIGH')
    .forEach(signal => {
      console.log(`\n[${signal.severity}] ${signal.name}`);
      console.log(`Reason: ${signal.reason}`);
      console.log(`Confidence: ${signal.confidence}`);
      if (signal.mitigation) {
        console.log(`Fix: ${signal.mitigation}`);
      }
    });
}

// Display mitigations
console.log('\n📋 Recommended Actions:');
report.mitigations.forEach(m => console.log(`- ${m}`));

// Check for known entity interactions
if (report.knownEntities.length > 0) {
  console.log('\n🏦 Known Entities Detected:');
  report.knownEntities.forEach(entity => {
    console.log(`- ${entity.name} (${entity.type}): ${entity.address}`);
  });
}

═══════════════════════════════════════════════════════════════════════════════
TRANSACTION SCAN
═══════════════════════════════════════════════════════════════════════════════

import { collectTransactionData, normalizeTransactionData } from 'solana-privacy-scanner-core';

async function scanTransaction(signature: string) {
  const rpc = new RPCClient();
  const labels = createDefaultLabelProvider();

  const rawData = await collectTransactionData(rpc, signature);
  const context = normalizeTransactionData(rawData, labels);
  const report = generateReport(context);

  return report;
}

═══════════════════════════════════════════════════════════════════════════════
PROGRAM SCAN
═══════════════════════════════════════════════════════════════════════════════

import { collectProgramData, normalizeProgramData } from 'solana-privacy-scanner-core';

async function scanProgram(programId: string) {
  const rpc = new RPCClient();
  const labels = createDefaultLabelProvider();

  const rawData = await collectProgramData(rpc, programId, {
    maxAccounts: 100,      // Limit program accounts to fetch
    maxTransactions: 50    // Limit related transactions
  });

  const context = normalizeProgramData(rawData, labels);
  const report = generateReport(context);

  return report;
}

═══════════════════════════════════════════════════════════════════════════════
CUSTOM RPC CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════

// Use custom RPC URL (string)
const rpc = new RPCClient('https://api.mainnet-beta.solana.com');

// Or use full configuration object
const rpc = new RPCClient({
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://your-rpc.com',
  maxRetries: 5,           // Retry failed requests (default: 3)
  retryDelay: 1000,        // Initial backoff delay ms (default: 1000)
  timeout: 60000,          // Request timeout ms (default: 30000)
  maxConcurrency: 10,      // Max parallel requests (default: 10)
  debug: true              // Enable logging (default: false)
});

// Check RPC health
const isHealthy = await rpc.healthCheck();

// Get rate limiter stats
const stats = rpc.getStats();
console.log(`Active: ${stats.activeRequests}, Queued: ${stats.queueLength}`);

═══════════════════════════════════════════════════════════════════════════════
KEY TYPES & INTERFACES
═══════════════════════════════════════════════════════════════════════════════

## PrivacyReport
{
  version: string;              // Report schema version
  timestamp: number;            // Generation time (Unix ms)
  targetType: 'wallet' | 'transaction' | 'program';
  target: string;               // Address/signature/program ID
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: PrivacySignal[];     // Array of detected privacy risks
  summary: {
    totalSignals: number;
    highRiskSignals: number;
    mediumRiskSignals: number;
    lowRiskSignals: number;
    transactionsAnalyzed: number;
  };
  mitigations: string[];        // Actionable recommendations
  knownEntities: Label[];       // Detected CEXs, bridges, etc.
}

## PrivacySignal
{
  id: string;                   // Unique signal ID (e.g., 'fee-payer-never-self')
  name: string;                 // Human-readable name
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;           // 0-1 confidence score
  reason: string;               // Explanation of privacy risk
  evidence: Evidence[];         // Supporting data (addresses, txs, etc.)
  mitigation?: string;          // Optional: how to fix
}

## ScanContext (input to heuristics)
{
  target: string;
  targetType: 'wallet' | 'transaction' | 'program';
  transfers: Transfer[];              // SOL and SPL transfers
  instructions: NormalizedInstruction[];
  counterparties: Set<string>;        // Unique addresses interacted with
  labels: Map<string, Label>;         // Known entity labels
  tokenAccounts: Array<{ mint, address, balance }>;
  timeRange: { earliest: number | null; latest: number | null };
  transactionCount: number;

  // Additional context fields
  transactions: TransactionMetadata[];    // Fee payers, signers, memos
  tokenAccountEvents: TokenAccountEvent[]; // Create/close events
  pdaInteractions: PDAInteraction[];      // Program-derived address usage
  feePayers: Set<string>;
  signers: Set<string>;
  programs: Set<string>;
}

## Label (known entity)
{
  address: string;
  name: string;                 // e.g., "Binance Hot Wallet"
  type: 'exchange' | 'bridge' | 'protocol' | 'service' | 'other';
  description?: string;
  relatedAddresses?: string[];
}

═══════════════════════════════════════════════════════════════════════════════
13 PRIVACY HEURISTICS
═══════════════════════════════════════════════════════════════════════════════

SOLANA-SPECIFIC (CRITICAL):
1. detectFeePayerReuse() - Fee payer reuse (MOST CRITICAL on Solana)
   Signals: fee-payer-never-self (HIGH), fee-payer-external (HIGH/MEDIUM)

2. detectSignerOverlap() - Repeated signer combinations
   Signals: signer-repeated (HIGH/MEDIUM), signer-set-reuse (HIGH)

3. detectMemoExposure() - PII in transaction memos
   Signals: memo-pii-exposure (HIGH), memo-descriptive-content (MEDIUM), memo-usage (LOW)

4. detectIdentityMetadataExposure() - .sol domain and NFT metadata linkage
   Signals: identity-sol-domain (HIGH), identity-nft-metadata (MEDIUM)

5. detectATALinkage() - One wallet funding token accounts for multiple owners
   Signals: ata-funder-linkage (HIGH), ata-pattern (MEDIUM)

6. detectAddressReuse() - Lack of address rotation
   Signals: address-high-diversity (LOW), address-moderate-diversity (MEDIUM), address-long-term-usage (LOW)

BEHAVIORAL ANALYSIS:
7. detectKnownEntityInteraction() - CEX/bridge/KYC interactions
   Signals: known-entity-exchange (HIGH), known-entity-bridge (MEDIUM), known-entity-other (varies)

8. detectCounterpartyReuse() - Repeated counterparty patterns
   Signals: counterparty-reuse (varies), pda-reuse (varies)

9. detectInstructionFingerprinting() - Unique program usage patterns
   Signals: instruction-sequence-pattern (MEDIUM), program-usage-profile (MEDIUM)

10. detectTokenAccountLifecycle() - Token account create/close patterns
    Signals: token-account-churn (MEDIUM), rent-refund-clustering (MEDIUM)

11. detectPriorityFeeFingerprinting() - Consistent priority fee amounts
    Signals: priority-fee-pattern (MEDIUM), priority-fee-consistent (LOW)

12. detectStakingDelegationPatterns() - Concentrated validator delegation
    Signals: staking-single-validator (MEDIUM), staking-delegation-pattern (LOW)

13. detectTimingPatterns() - Transaction timing analysis
    Signals: timing-burst (MEDIUM), timing-regular-interval (MEDIUM), timing-timezone-pattern (LOW)

All heuristics are PURE FUNCTIONS: heuristic(ScanContext) => PrivacySignal[]

═══════════════════════════════════════════════════════════════════════════════
COMPLETE API REFERENCE
═══════════════════════════════════════════════════════════════════════════════

## RPCClient
new RPCClient(config?: RPCClientConfig | string)
  .getSignaturesForAddress(address, options?)
  .getTransaction(signature, options?)
  .getTransactions(signatures[], options?)
  .getTokenAccountsByOwner(ownerAddress, mintAddress?)
  .getProgramAccounts(programId, config?)
  .getAccountInfo(address)
  .getMultipleAccountsInfo(addresses[])
  .getConnection()          // Returns underlying Solana Connection
  .getStats()               // Rate limiter stats
  .healthCheck()            // Check RPC health

## Data Collection
collectWalletData(client, address, options?)
  options: { maxSignatures?: 100, includeTokenAccounts?: true }

collectTransactionData(client, signature)

collectProgramData(client, programId, options?)
  options: { maxAccounts?: 100, maxTransactions?: 50 }

## Normalization
normalizeWalletData(rawData, labelProvider?) => ScanContext
normalizeTransactionData(rawData, labelProvider?) => ScanContext
normalizeProgramData(rawData, labelProvider?) => ScanContext

## Report Generation
generateReport(context) => PrivacyReport
evaluateHeuristics(context) => PrivacySignal[]  // Used internally by generateReport

## Label Provider
createDefaultLabelProvider() => StaticLabelProvider
new StaticLabelProvider(labelsPath?)
  .lookup(address) => Label | null
  .lookupMany(addresses[]) => Map<string, Label>
  .getAllLabels() => Label[]
  .getCount() => number

## Individual Heuristics (can be called directly)
detectFeePayerReuse(context) => PrivacySignal[]
detectSignerOverlap(context) => PrivacySignal[]
detectMemoExposure(context) => PrivacySignal[]
detectIdentityMetadataExposure(context) => PrivacySignal[]
detectATALinkage(context) => PrivacySignal[]
detectAddressReuse(context) => PrivacySignal[]
detectKnownEntityInteraction(context) => PrivacySignal[]
detectCounterpartyReuse(context) => PrivacySignal[]
detectInstructionFingerprinting(context) => PrivacySignal[]
detectTokenAccountLifecycle(context) => PrivacySignal[]
detectPriorityFeeFingerprinting(context) => PrivacySignal[]
detectStakingDelegationPatterns(context) => PrivacySignal[]
detectTimingPatterns(context) => PrivacySignal[]

═══════════════════════════════════════════════════════════════════════════════
COMMON USE CASES
═══════════════════════════════════════════════════════════════════════════════

## Use Case 1: Wallet Onboarding Screen
async function checkWalletBeforeOnboarding(address: string) {
  const report = await scanWallet(address);

  if (report.overallRisk === 'HIGH') {
    return { allowed: false, reason: 'High privacy risk detected' };
  }

  const hasCEX = report.knownEntities.some(e => e.type === 'exchange');
  if (hasCEX) {
    return {
      allowed: true,
      warning: 'CEX interaction detected - privacy may be limited'
    };
  }

  return { allowed: true };
}

## Use Case 2: Batch Analysis
async function scanMultipleWallets(addresses: string[]) {
  const rpc = new RPCClient();
  const labels = createDefaultLabelProvider();
  const results = [];

  for (const address of addresses) {
    const rawData = await collectWalletData(rpc, address, { maxSignatures: 50 });
    const context = normalizeWalletData(rawData, labels);
    const report = generateReport(context);

    results.push({
      address,
      risk: report.overallRisk,
      signals: report.summary.totalSignals,
      highRiskCount: report.summary.highRiskSignals,
      hasCEX: report.knownEntities.some(e => e.type === 'exchange')
    });

    // Respect rate limits (RPCClient handles this, but add delay between wallets)
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

## Use Case 3: Filter High-Risk Signals
const report = await scanWallet(address);

// Get only HIGH severity signals
const criticalIssues = report.signals.filter(s => s.severity === 'HIGH');

// Get fee payer issues specifically
const feePayerIssues = report.signals.filter(s => s.id.includes('fee-payer'));

// Check for specific signal
const hasFeePayerReuse = report.signals.some(s => s.id === 'fee-payer-never-self');

## Use Case 4: Export to JSON/CSV
import { writeFileSync } from 'fs';

const report = await scanWallet(address);

// Save full report as JSON
writeFileSync(`report-${address}.json`, JSON.stringify(report, null, 2));

// Export signals as CSV
const csv = [
  'ID,Name,Severity,Confidence,Reason',
  ...report.signals.map(s =>
    `${s.id},"${s.name}",${s.severity},${s.confidence},"${s.reason}"`
  )
].join('\n');
writeFileSync(`signals-${address}.csv`, csv);

## Use Case 5: Custom Heuristic Integration
import { evaluateHeuristics, type ScanContext, type PrivacySignal } from 'solana-privacy-scanner-core';

// Run built-in heuristics
const builtInSignals = evaluateHeuristics(context);

// Add custom heuristic
function detectMyCustomPattern(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Your custom analysis logic
  const suspiciousPrograms = ['ProgramID1', 'ProgramID2'];
  const hasSuspicious = Array.from(context.programs).some(p =>
    suspiciousPrograms.includes(p)
  );

  if (hasSuspicious) {
    signals.push({
      id: 'custom-suspicious-program',
      name: 'Suspicious Program Interaction',
      severity: 'HIGH',
      confidence: 0.9,
      reason: 'Interacted with flagged program',
      evidence: [{ type: 'program', value: 'ProgramID1' }],
      mitigation: 'Avoid interacting with this program'
    });
  }

  return signals;
}

// Combine signals
const customSignals = detectMyCustomPattern(context);
const allSignals = [...builtInSignals, ...customSignals];

═══════════════════════════════════════════════════════════════════════════════
ERROR HANDLING & BEST PRACTICES
═══════════════════════════════════════════════════════════════════════════════

✅ DO:
- Cache label provider instance (don't recreate for each scan)
- Use maxSignatures to limit transaction history (100-200 is reasonable)
- Check report.overallRisk first, then drill into signals
- Handle RPC errors gracefully (collectors return partial data on failure)
- Use RPCClient's built-in rate limiting for batch operations
- Display mitigations to users for actionable guidance

❌ DON'T:
- Don't recreate RPCClient for every scan (reuse instances)
- Don't fetch entire wallet history (unbounded maxSignatures)
- Don't ignore error handling - RPC can fail
- Don't assume all data will be present (check for null/undefined)

## Error Handling Pattern
try {
  const rawData = await collectWalletData(rpc, address);
  const context = normalizeWalletData(rawData, labels);
  const report = generateReport(context);

  if (report.signals.length === 0) {
    console.log('No privacy risks detected (or insufficient data)');
  }

  return report;
} catch (error) {
  console.error('Scan failed:', error);
  // Return null or throw - depends on your app's needs
  return null;
}

## Null Safety
- RPC calls can return null transactions
- Collectors degrade gracefully (empty arrays on failure)
- Normalizers handle missing data (check blockTime, accountKeys, etc.)
- Always validate report.signals.length before accessing

═══════════════════════════════════════════════════════════════════════════════
PERFORMANCE OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════════

## Fast Scans (< 5 seconds)
const report = await scanWallet(address, {
  maxSignatures: 50,           // Fetch fewer transactions
  includeTokenAccounts: false  // Skip token account lookup
});

## Parallel Scans (multiple wallets)
const reports = await Promise.all(
  addresses.map(addr => scanWallet(addr))
);

## Rate Limiting
- RPCClient includes built-in rate limiting (10 concurrent by default)
- For batch operations, add delays between wallets (200-500ms)
- Use custom RPC with higher limits for production

═══════════════════════════════════════════════════════════════════════════════
TESTING & DEVELOPMENT
═══════════════════════════════════════════════════════════════════════════════

## Test with Known Addresses
// Binance hot wallet (will trigger known-entity-exchange)
const report = await scanWallet('5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9');

// Test transaction
const txReport = await scanTransaction('YOUR_TX_SIGNATURE');

## Mock for Testing
import { type ScanContext, generateReport } from 'solana-privacy-scanner-core';

const mockContext: ScanContext = {
  target: 'TEST_ADDRESS',
  targetType: 'wallet',
  transfers: [],
  instructions: [],
  counterparties: new Set(),
  labels: new Map(),
  tokenAccounts: [],
  timeRange: { earliest: null, latest: null },
  transactionCount: 0,
  transactions: [],
  tokenAccountEvents: [],
  pdaInteractions: [],
  feePayers: new Set(),
  signers: new Set(),
  programs: new Set()
};

const report = generateReport(mockContext);

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL RESOURCES
═══════════════════════════════════════════════════════════════════════════════

Documentation: https://sps.guide/library/api-reference
Examples: https://sps.guide/library/examples
npm: https://www.npmjs.com/package/solana-privacy-scanner-core
GitHub: https://github.com/taylorferran/solana-privacy-scanner
Report Format: https://sps.guide/reports/risk-levels
Heuristics Guide: https://sps.guide/reports/heuristics

═══════════════════════════════════════════════════════════════════════════════
```

# Library Examples

Practical examples using `solana-privacy-scanner-core`.

## Wallet Analysis

```typescript
import { 
  RPCClient, 
  collectWalletData, 
  normalizeWalletData, 
  generateReport,
  createDefaultLabelProvider 
} from 'solana-privacy-scanner-core';

const rpc = new RPCClient();
const labels = createDefaultLabelProvider();

const raw = await collectWalletData(rpc, 'WALLET_ADDRESS', {
  maxSignatures: 100,
  includeTokenAccounts: true
});

const context = normalizeWalletData(raw, labels);
const report = generateReport(context);

console.log(`Risk: ${report.overallRisk}`);
console.log(`Signals: ${report.signals.length}`);
```

## Transaction Analysis

```typescript
const raw = await collectTransactionData(rpc, 'SIGNATURE');
const context = normalizeTransactionData(raw, labels);
const report = generateReport(context);

// Check for specific signals
const hasFeePayerReuse = report.signals.some(
  s => s.id === 'fee-payer-reuse'
);
```

## Program Analysis

```typescript
const raw = await collectProgramData(rpc, 'PROGRAM_ID', {
  maxTransactions: 50
});

const context = normalizeProgramData(raw, labels);
const report = generateReport(context);
```

## Batch Processing

```typescript
async function scanMultipleWallets(addresses: string[]) {
  const rpc = new RPCClient();
  const labels = createDefaultLabelProvider();
  const results = [];

  for (const address of addresses) {
    const raw = await collectWalletData(rpc, address);
    const context = normalizeWalletData(raw, labels);
    const report = generateReport(context);
    
    results.push({
      address,
      risk: report.overallRisk,
      score: report.summary.privacyScore,
      signals: report.signals.length
    });
    
    // Rate limiting handled by RPCClient
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}
```

## Risk-Based Logic

```typescript
const report = await analyzeWallet(address);

switch (report.overallRisk) {
  case 'HIGH':
    console.warn('⚠️ High risk - manual review required');
    notifyAdmin(address, report);
    break;
    
  case 'MEDIUM':
    console.log('⚠️ Medium risk - proceed with caution');
    break;
    
  case 'LOW':
    console.log('✓ Low risk - proceed');
    break;
}
```

## Filtering Signals

```typescript
// Get only HIGH severity signals
const highRiskSignals = report.signals.filter(
  s => s.severity === 'HIGH'
);

// Check for CEX interactions
const hasCEXInteraction = report.knownEntities.some(
  e => e.type === 'exchange'
);

// Get all fee payer reuse signals
const feePayerIssues = report.signals.filter(
  s => s.id === 'fee-payer-reuse'
);
```

## Custom RPC Config

```typescript
const rpc = new RPCClient({
  rpcUrl: process.env.QUICKNODE_RPC_URL,
  maxRetries: 5,
  requestsPerSecond: 10
});
```

## Export Reports

```typescript
import { writeFileSync } from 'fs';

const report = await analyzeWallet(address);

// Save as JSON
writeFileSync(
  `reports/${address}.json`,
  JSON.stringify(report, null, 2)
);

// Save as CSV
const csv = report.signals.map(s => 
  `${s.name},${s.severity},${s.confidence}`
).join('\n');

writeFileSync(`reports/${address}.csv`, csv);
```

## Next Steps

- **[Full API](./usage)** - Complete function reference
- **[For LLMs](./for-llms)** - Get AI coding help

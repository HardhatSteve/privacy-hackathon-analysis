# Core Library

Programmatic API for privacy analysis.

## Install

```bash
npm install solana-privacy-scanner-core
```

## On-Chain Scanning

```typescript
import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider
} from 'solana-privacy-scanner-core';

// Initialize
const rpc = new RPCClient(); // Uses default QuickNode endpoint
const labels = createDefaultLabelProvider(); // 78+ known entities

// Scan wallet
const rawData = await collectWalletData(rpc, 'WALLET_ADDRESS');
const context = normalizeWalletData(rawData, labels);
const report = generateReport(context);

console.log(report.overallRisk); // 'LOW' | 'MEDIUM' | 'HIGH'
console.log(report.signals);     // Privacy risk signals
console.log(report.mitigations); // Recommended fixes
```

**Custom RPC:**

```typescript
const rpc = new RPCClient('https://your-endpoint.com');
```

**Scan transactions or programs:**

```typescript
import { collectTransactionData, normalizeTransactionData } from 'solana-privacy-scanner-core';
import { collectProgramData, normalizeProgramData } from 'solana-privacy-scanner-core';

// Transaction
const txData = await collectTransactionData(rpc, 'SIGNATURE');
const txContext = normalizeTransactionData(txData, labels);

// Program
const programData = await collectProgramData(rpc, 'PROGRAM_ID');
const programContext = normalizeProgramData(programData, labels);
```

## Static Code Analysis

Analyze source code for privacy anti-patterns before deployment.

```typescript
import { analyze } from 'solana-privacy-scanner-core';

const result = await analyze(['src/**/*.ts']);

console.log(`Found ${result.summary.total} issues`);
result.issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.message} at ${issue.file}:${issue.line}`);
});
```

**Detects:**
- Fee payer reuse in loops (CRITICAL)
- PII in transaction memos (HIGH)
- Descriptive memo patterns (MEDIUM)

## Transaction Simulation

Test privacy before sending transactions.

```typescript
import { Connection } from '@solana/web3.js';
import { simulateTransactionPrivacy } from 'solana-privacy-scanner-core';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const report = await simulateTransactionPrivacy(tx, connection);

if (report.overallRisk === 'HIGH') {
  console.warn('Transaction has privacy risks');
}
```

## Test Matchers

Custom assertions for Vitest/Jest.

```typescript
import { expect } from 'vitest';
import 'solana-privacy-scanner-core/matchers';

test('transaction maintains privacy', async () => {
  const report = await simulateTransactionPrivacy(tx, connection);

  expect(report).toHavePrivacyRisk('LOW');
  expect(report).toHaveNoHighRiskSignals();
  expect(report).toNotLeakUserRelationships();
});
```

**Available matchers:**
- `toHavePrivacyRisk(level)` - Assert specific risk level
- `toHaveNoHighRiskSignals()` - No HIGH severity signals
- `toNotLeakUserRelationships()` - No relationship-linking signals
- `toHaveSignal(type)` / `toNotHaveSignal(type)` - Check for specific signals
- `toHaveAtMostSignals(max)` - Maximum signal count
- `toHaveNoKnownEntities()` - No CEX/bridge interactions

## Configuration

Load privacy policy from `.privacyrc` or `package.json`.

```typescript
import { loadConfig } from 'solana-privacy-scanner-core';

const config = loadConfig();
console.log(`Max risk: ${config.maxRiskLevel}`);
console.log(`Enforce in CI: ${config.enforceInCI}`);
```

**Config file (`.privacyrc`):**

```json
{
  "maxRiskLevel": "MEDIUM",
  "enforceInCI": true,
  "blockOnFailure": true
}
```

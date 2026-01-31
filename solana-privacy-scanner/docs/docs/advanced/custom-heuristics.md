# Custom Heuristics

## Overview

Extend the scanner with protocol-specific privacy rules.

## Use Cases

- Privacy protocols detecting SDK misuse
- DeFi protocols checking MEV exposure
- DAOs detecting voting pattern leakage
- Custom compliance policies

## Write a Heuristic

```typescript
import { ScanContext, PrivacySignal } from 'solana-privacy-scanner-core';

export function detectCustomPattern(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Your detection logic
  if (/* condition */) {
    signals.push({
      id: 'custom-pattern',
      name: 'Custom Pattern Detected',
      severity: 'HIGH',
      confidence: 0.85,
      reason: 'What was detected',
      impact: 'How this affects privacy',
      evidence: [{
        description: 'Transaction shows pattern X',
        severity: 'HIGH',
        reference: 'signature123...'
      }],
      mitigation: 'How to fix'
    });
  }

  return signals;
}
```

## PrivacySignal Fields

All fields required unless marked optional:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier for this signal type | `'custom-pattern'` |
| `name` | `string` | Human-readable name | `'Custom Pattern Detected'` |
| `severity` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | Risk severity level | `'HIGH'` |
| `reason` | `string` | Why this signal was triggered | `'Detected repeated pattern X in 5 transactions'` |
| `impact` | `string` | What this means for privacy | `'Links all transactions to same user identity'` |
| `evidence` | `Evidence[]` | Supporting data (see below) | `[{description: '...', reference: 'sig1'}]` |
| `mitigation` | `string` | How to fix or reduce this risk | `'Use separate wallets for different activities'` |
| `confidence` | `number` (optional) | Confidence score 0-1 | `0.85` |
| `category` | `string` (optional) | Signal category | `'linkability' \| 'behavioral' \| 'exposure'` |

## Evidence Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `description` | `string` | Human-readable explanation | `'Transaction A to B shows pattern'` |
| `severity` | `'LOW' \| 'MEDIUM' \| 'HIGH'` (optional) | Evidence severity | `'HIGH'` |
| `reference` | `string` (optional) | Transaction signature, address, etc. | `'5x7Ym...'` |
| `type` | `EvidenceType` (optional) | Evidence category | `'transaction' \| 'address' \| 'amount' \| 'timing' \| 'pattern' \| 'label'` |
| `data` | `Record<string, unknown>` (optional) | Structured supporting data | `{count: 5, addresses: [...]}` |

## ScanContext Fields

The `ScanContext` object contains all normalized blockchain data for analysis:

| Field | Type | Description |
|-------|------|-------------|
| `target` | `string` | Address/signature being scanned |
| `targetType` | `'wallet' \| 'transaction' \| 'program'` | Type of scan |
| `transfers` | `Transfer[]` | All SOL and SPL token transfers |
| `instructions` | `NormalizedInstruction[]` | All program instructions |
| `counterparties` | `Set<string>` | Unique addresses interacted with |
| `labels` | `Map<string, Label>` | Known entity labels (CEXs, etc.) |
| `tokenAccounts` | `Array<{mint, address, balance}>` | Token accounts owned |
| `timeRange` | `{earliest, latest}` | Time bounds of activity |
| `transactionCount` | `number` | Total transactions analyzed |
| **Core Fields:** | | |
| `transactions` | `TransactionMetadata[]` | Transaction metadata (fee payers, signers, memos) |
| `tokenAccountEvents` | `TokenAccountEvent[]` | Token account create/close events |
| `pdaInteractions` | `PDAInteraction[]` | Program-Derived Address interactions |
| `feePayers` | `Set<string>` | Unique fee payer addresses |
| `signers` | `Set<string>` | Unique signer addresses |
| `programs` | `Set<string>` | Program IDs interacted with |

**Example: Access fee payers**
```typescript
export function detectCustomPattern(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Check if wallet never pays own fees
  if (!context.feePayers.has(context.target)) {
    signals.push({
      id: 'custom-fee-pattern',
      name: 'Custom Fee Analysis',
      severity: 'HIGH',
      reason: 'Wallet never pays own transaction fees',
      impact: 'All transactions linked to external fee payer',
      evidence: [{
        description: `Fee paid by ${Array.from(context.feePayers).join(', ')}`,
        severity: 'HIGH'
      }],
      mitigation: 'Pay own fees to avoid linkage'
    });
  }

  return signals;
}
```

## Integration

### Option 1: Combine with Built-in Signals

```typescript
import {
  collectWalletData,
  normalizeWalletData,
  evaluateHeuristics,
  generateReport,
  createDefaultLabelProvider,
  RPCClient
} from 'solana-privacy-scanner-core';
import { detectCustomPattern } from './my-heuristic';

// Collect and normalize data
const rpcClient = new RPCClient();
const rawData = await collectWalletData(rpcClient, 'wallet-address');
const labelProvider = createDefaultLabelProvider();
const context = normalizeWalletData(rawData, labelProvider);

// Evaluate built-in heuristics
const builtInSignals = evaluateHeuristics(context);

// Evaluate custom heuristics
const customSignals = detectCustomPattern(context);

// Combine signals
const allSignals = [...builtInSignals, ...customSignals];

// Generate report with combined signals
const report = {
  ...generateReport(context),
  signals: allSignals
};
```

### Option 2: Custom-Only Analysis

```typescript
import {
  collectWalletData,
  normalizeWalletData,
  createDefaultLabelProvider,
  RPCClient
} from 'solana-privacy-scanner-core';
import { detectCustomPattern } from './my-heuristic';

const rpcClient = new RPCClient();
const rawData = await collectWalletData(rpcClient, 'wallet-address');
const labelProvider = createDefaultLabelProvider();
const context = normalizeWalletData(rawData, labelProvider);

// Only run your custom heuristic
const customSignals = detectCustomPattern(context);

// Build custom report
const report = {
  version: '1.0.0',
  timestamp: Date.now(),
  target: context.target,
  targetType: context.targetType,
  signals: customSignals,
  overallRisk: customSignals.some(s => s.severity === 'HIGH') ? 'HIGH' : 'LOW'
};
```

See [Devtools](../core/usage) for testing custom heuristics.

# solana-privacy-scanner-core

Core scanning engine for Solana privacy analysis. Analyze on-chain privacy exposure using 13 heuristic-based detections plus static code analysis.

## Features

- **13 Privacy Heuristics** - Fee payer reuse, signer overlap, memo PII, ATA linkage, priority fee fingerprinting, staking patterns, identity metadata exposure, and more
- **Static Code Analyzer** - AST-based detection of privacy anti-patterns in TypeScript/JavaScript source code
- **Known Entity Detection** - Flags interactions with exchanges, bridges, and KYC services
- **Structured Reports** - JSON reports with risk scores, evidence, and actionable mitigations
- **Works Out of the Box** - Built-in RPC endpoint, no configuration required

## Installation

```bash
npm install solana-privacy-scanner-core
```

## Quick Start

### Scan a wallet

```typescript
import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  createDefaultLabelProvider,
  generateReport,
} from 'solana-privacy-scanner-core';

const rpc = new RPCClient(); // uses built-in RPC
const raw = await collectWalletData(rpc, 'YourWalletAddress', { maxSignatures: 100 });
const labels = createDefaultLabelProvider();
const context = normalizeWalletData(raw, labels);
const report = generateReport(context);

console.log('Risk:', report.overallRisk);
console.log('Signals:', report.signals.length);
```

### Analyze source code

```typescript
import { analyze } from 'solana-privacy-scanner-core';

const result = await analyze(['src/**/*.ts']);
console.log(`Found ${result.summary.total} privacy issues`);
result.issues.forEach(i => console.log(`  ${i.severity} ${i.type}: ${i.message}`));
```

### Use individual heuristics

```typescript
import { detectFeePayerReuse, detectMemoExposure } from 'solana-privacy-scanner-core';
import type { ScanContext } from 'solana-privacy-scanner-core';

const signals = detectFeePayerReuse(context);
const memoSignals = detectMemoExposure(context);
```

## The 13 Heuristics

| # | Heuristic | What it checks |
|---|-----------|---------------|
| 1 | Fee Payer Reuse | One wallet paying fees for multiple accounts |
| 2 | Signer Overlap | Same signers appearing across transactions |
| 3 | Memo Exposure | Personal information in memo fields |
| 4 | Known Entity Interaction | Transfers to/from exchanges, bridges, KYC services |
| 5 | Identity Metadata Exposure | .sol domain and NFT metadata linkage |
| 6 | ATA Linkage | One wallet funding token accounts for multiple owners |
| 7 | Address Reuse | Using one address across many different protocols |
| 8 | Counterparty Reuse | Repeated transfers to the same address |
| 9 | Instruction Fingerprinting | Repeated program call patterns |
| 10 | Token Account Lifecycle | Frequent create/close cycles |
| 11 | Priority Fee Fingerprinting | Consistent priority fee amounts |
| 12 | Staking Delegation | Concentrated validator delegation |
| 13 | Timing Patterns | Burst activity and regular intervals |

## Documentation

Full documentation: https://taylorferran.github.io/solana-privacy-scanner

- [Getting Started](https://taylorferran.github.io/solana-privacy-scanner/guide/getting-started)
- [Library Usage](https://taylorferran.github.io/solana-privacy-scanner/library/usage)
- [Heuristics Reference](https://taylorferran.github.io/solana-privacy-scanner/reports/heuristics)

## License

MIT

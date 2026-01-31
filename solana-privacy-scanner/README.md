# Solana Privacy Scanner

[![npm - core](https://img.shields.io/npm/v/solana-privacy-scanner-core?label=core&color=blue)](https://www.npmjs.com/package/solana-privacy-scanner-core)
[![npm - cli](https://img.shields.io/npm/v/solana-privacy-scanner?label=cli&color=blue)](https://www.npmjs.com/package/solana-privacy-scanner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by QuickNode](https://img.shields.io/badge/Powered%20by-QuickNode-0d9488?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3TDEyIDEyTDIyIDdMMTIgMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yIDEwTDEyIDE1TDIyIDEwVjE0TDEyIDE5TDIgMTRWMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=)](https://www.quicknode.com/)

An open source public good built with [QuickNode](https://www.quicknode.com/) to help developers maintain privacy on Solana.

Analyzes wallets, transactions, and programs using public on-chain data and produces deterministic privacy risk reports. Zero configuration required.

**Current Version:** `0.7.0` - [Changelog](./docs/changelog.md)

---

## Quick Start

### CLI

```bash
npm install -g solana-privacy-scanner

# Scan a wallet
solana-privacy-scanner scan-wallet <ADDRESS>

# Scan a transaction
solana-privacy-scanner scan-transaction <SIGNATURE>

# Scan a program
solana-privacy-scanner scan-program <PROGRAM_ID>

# Analyze source code for privacy anti-patterns
solana-privacy-scanner analyze src/**/*.ts
```

No setup required - includes a built-in RPC endpoint powered by [QuickNode](https://www.quicknode.com/).

### Library

```bash
npm install solana-privacy-scanner-core
```

```typescript
import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider
} from 'solana-privacy-scanner-core';

const rpc = new RPCClient(); // built-in RPC, no config needed
const rawData = await collectWalletData(rpc, 'WALLET_ADDRESS');
const context = normalizeWalletData(rawData, createDefaultLabelProvider());
const report = generateReport(context);

console.log('Risk:', report.overallRisk);
console.log('Signals:', report.signals.length);
```

### Web UI

**[Launch Interactive Scanner](https://sps.guide)** - Paste any Solana wallet address and scan in your browser.

---

## What It Detects

13 privacy heuristics analyze on-chain behavior:

| # | Heuristic | Severity | What it checks |
|---|-----------|----------|---------------|
| 1 | Fee Payer Reuse | CRITICAL | One wallet paying fees for multiple accounts |
| 2 | Signer Overlap | HIGH | Same signers appearing across transactions |
| 3 | Memo Exposure | HIGH | Personal information in memo fields |
| 4 | Known Entity Interaction | HIGH | Transfers to/from exchanges, bridges, KYC services |
| 5 | Identity Metadata Exposure | HIGH | .sol domain and NFT metadata linkage |
| 6 | ATA Linkage | HIGH | One wallet funding token accounts for multiple owners |
| 7 | Address Reuse | MEDIUM | Using one address across many different protocols |
| 8 | Counterparty Reuse | MEDIUM | Repeated transfers to the same address |
| 9 | Instruction Fingerprinting | MEDIUM | Repeated program call patterns |
| 10 | Token Account Lifecycle | MEDIUM | Frequent create/close cycles |
| 11 | Priority Fee Fingerprinting | MEDIUM | Consistent priority fee amounts |
| 12 | Staking Delegation | MEDIUM | Concentrated validator delegation |
| 13 | Timing Patterns | MEDIUM | Burst activity and regular intervals |

The static code analyzer also detects fee payer reuse and memo PII in TypeScript/JavaScript source before deployment.

All heuristics are [fully documented](https://sps.guide/reports/heuristics) with examples and mitigation guidance.

---

## Developer Tools

### Static Code Analyzer

Catch privacy leaks before they reach the blockchain:

```bash
solana-privacy-scanner analyze src/ --json
```

Detects fee payer reuse in loops, PII in memo fields (emails, phone numbers, names), and `Buffer.from()` data sent to the Memo program.

### Claude Code Plugin

AI-powered privacy analysis inside Claude Code:

```
/scan-code          # Analyze source files
/scan-wallet        # Scan a wallet address
/explain-risk       # Explain a specific risk
/suggest-fix        # Get code fixes for issues
/privacy-audit      # Full repo audit
```

### CI/CD Integration

**See it in action:** [Example Repository](https://github.com/taylorferran/solana-privacy-scanner-example) with working PRs showing leak detection

```yaml
# .github/workflows/privacy-check.yml
- name: Privacy Scan
  run: |
    npx solana-privacy-scanner analyze src/ --json > report.json
    CRITICAL=$(jq '.summary.critical' report.json)
    [ "$CRITICAL" -eq 0 ] || exit 1
```

---

## Packages

| Package | Description |
|---------|-------------|
| [`solana-privacy-scanner-core`](https://www.npmjs.com/package/solana-privacy-scanner-core) | Core scanning engine - heuristics, report generation, static analyzer |
| [`solana-privacy-scanner`](https://www.npmjs.com/package/solana-privacy-scanner) | CLI tool - scan wallets/transactions/programs, analyze code |

---

## Documentation

**[Full Documentation](https://sps.guide)**

- [Getting Started](https://sps.guide/guide/getting-started) - Installation and first scan
- [Library API](https://sps.guide/library/usage) - Integration guide
- [CLI Commands](https://sps.guide/cli/quickstart) - Command-line reference
- [Heuristics Reference](https://sps.guide/reports/heuristics) - What each heuristic detects
- [Heuristic Internals](https://sps.guide/reports/heuristic-internals) - How detection works in code

---

## Project Structure

```
solana-privacy-scanner/
├── docs/                   # Docusaurus documentation + web UI
├── packages/
│   ├── core/              # solana-privacy-scanner-core (npm)
│   ├── cli/               # solana-privacy-scanner (npm)
│   └── claude-plugin/     # Claude Code plugin
└── known-addresses.json   # Community-maintained entity database
```

---

## Development

```bash
git clone https://github.com/taylorferran/solana-privacy-scanner
cd solana-privacy-scanner
npm install
npm run build
npm test -- --run
```

---

## Contributing

- **Add known addresses** - Expand the entity database by editing `known-addresses.json` and submitting a PR. [Guide](https://sps.guide/contributing/addresses)
- **Report bugs** - [Open an issue](https://github.com/taylorferran/solana-privacy-scanner/issues)
- **Submit code** - Read the [Development Guide](https://sps.guide/contributing/development), write tests, submit a PR

---

## What This Tool Is

- A diagnostic tool for measuring on-chain privacy exposure
- An educational resource for understanding blockchain privacy
- Open source software with documented, transparent heuristics

This tool does not deanonymize users. It analyzes privacy risk signals that already exist in public blockchain data.

---

## Infrastructure

Powered by **[QuickNode](https://www.quicknode.com/)** as a public good for the Solana ecosystem. No API keys, no setup, no configuration - privacy scanning just works.

For production use with higher rate limits, get your own [QuickNode endpoint](https://www.quicknode.com/).

---

## License

MIT - see [LICENSE](./LICENSE)

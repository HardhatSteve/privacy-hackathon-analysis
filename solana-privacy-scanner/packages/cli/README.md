# solana-privacy-scanner

Developer toolkit for Solana privacy analysis. Scan wallets, transactions, and programs for privacy risks. Analyze source code for privacy anti-patterns. Set up CI/CD privacy checks.

## Installation

```bash
# Global installation
npm install -g solana-privacy-scanner

# Or use with npx (no installation required)
npx solana-privacy-scanner scan-wallet <address>
```

## Quick Start

```bash
# Scan a wallet (built-in RPC, no config needed)
solana-privacy-scanner scan-wallet YourWalletAddressHere

# Scan with custom RPC
solana-privacy-scanner scan-wallet YourAddress --rpc https://your-rpc.com

# Output as JSON
solana-privacy-scanner scan-wallet YourAddress --json --output report.json
```

## Commands

### On-chain scanning

```bash
# Scan a wallet for privacy risks
solana-privacy-scanner scan-wallet <address> [--max-signatures 100]

# Scan a single transaction
solana-privacy-scanner scan-transaction <signature>

# Scan a program's usage patterns
solana-privacy-scanner scan-program <programId> [--max-accounts 100] [--max-transactions 50]
```

### Static code analysis

```bash
# Analyze source files for privacy anti-patterns
solana-privacy-scanner analyze src/**/*.ts

# JSON output, skip low-severity issues
solana-privacy-scanner analyze src/ --json --no-low
```

### Setup

```bash
# Interactive privacy config wizard
solana-privacy-scanner init
```

## Options

All scan commands support:
- `--rpc <url>` - Custom RPC endpoint (or set `SOLANA_RPC` env var)
- `--json` - Output as JSON
- `--output <file>` - Save output to file

## What it detects

13 privacy heuristics covering fee payer reuse, signer overlap, memo PII, ATA linkage, priority fee fingerprinting, staking patterns, identity metadata exposure, known entity interactions, and behavioral patterns.

Static analyzer detects fee payer reuse and memo PII in TypeScript/JavaScript source code.

## Documentation

Full documentation: https://taylorferran.github.io/solana-privacy-scanner

- [CLI Guide](https://taylorferran.github.io/solana-privacy-scanner/cli/user-guide)
- [Heuristics Reference](https://taylorferran.github.io/solana-privacy-scanner/reports/heuristics)

## License

MIT

---
sidebar_position: 1
---

# Toolkit

The Solana Privacy Scanner CLI provides on-chain scanning, static code analysis, and project setup tools.

## Installation

```bash
npm install -g solana-privacy-scanner
```

Or use with npx:

```bash
npx solana-privacy-scanner <command>
```

## Commands

**On-chain scanning:**
- `scan-wallet` - Analyze wallet transaction history
- `scan-transaction` - Analyze single transaction
- `scan-program` - Analyze program interactions

**Code analysis:**
- `analyze` - Static analysis for privacy anti-patterns

**Setup:**
- `init` - Interactive setup wizard

## Quick Start

**Scan a wallet:**

```bash
solana-privacy-scanner scan-wallet <ADDRESS>
```

**Analyze source code:**

```bash
solana-privacy-scanner analyze src/**/*.ts
```

**Setup project:**

```bash
solana-privacy-scanner init
```

## RPC Configuration

The CLI includes a default QuickNode RPC endpoint. Override if needed:

```bash
export SOLANA_RPC=https://your-rpc-url.com
```

Or use `--rpc` flag:

```bash
solana-privacy-scanner scan-wallet <ADDRESS> --rpc https://your-rpc.com
```

## Next Steps

- **[Commands](./commands)** - Complete command reference

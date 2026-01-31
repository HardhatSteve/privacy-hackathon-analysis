---
sidebar_position: 2
---

# Commands

Complete reference for all CLI commands.

## scan-wallet

Analyze wallet transaction history for privacy risks.

```bash
solana-privacy-scanner scan-wallet <ADDRESS> [options]
```

**Options:**
- `--max-signatures <number>` - Max transactions to analyze (default: 100)
- `--json` - Output as JSON
- `--output <file>` - Save to file
- `--rpc <url>` - Custom RPC endpoint

**Examples:**

```bash
# Basic scan
solana-privacy-scanner scan-wallet YourWalletAddress

# Quick check (20 transactions)
solana-privacy-scanner scan-wallet YourWallet --max-signatures 20

# Deep analysis with file output
solana-privacy-scanner scan-wallet YourWallet --max-signatures 200 --output report.txt

# JSON for automation
solana-privacy-scanner scan-wallet YourWallet --json > report.json
```

## scan-transaction

Analyze a single transaction for privacy risks.

```bash
solana-privacy-scanner scan-transaction <SIGNATURE> [options]
```

**Options:**
- `--json` - Output as JSON
- `--output <file>` - Save to file
- `--rpc <url>` - Custom RPC endpoint

**Example:**

```bash
solana-privacy-scanner scan-transaction 5Jx...Signature...xyz
```

## scan-program

Analyze program interactions for privacy patterns.

```bash
solana-privacy-scanner scan-program <PROGRAM_ID> [options]
```

**Options:**
- `--max-accounts <number>` - Max accounts to fetch (default: 10)
- `--max-transactions <number>` - Max transactions to analyze (default: 20)
- `--json` - Output as JSON
- `--output <file>` - Save to file
- `--rpc <url>` - Custom RPC endpoint

**Example:**

```bash
solana-privacy-scanner scan-program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
```

## analyze

Static analysis for privacy anti-patterns in source code.

```bash
solana-privacy-scanner analyze <paths...> [options]
```

**Options:**
- `--json` - Output as JSON
- `--no-low` - Exclude low severity issues
- `--quiet` - Only show summary
- `--output <file>` - Save to file

**Examples:**

```bash
# Analyze source files
solana-privacy-scanner analyze src/**/*.ts

# Analyze specific files
solana-privacy-scanner analyze src/transfer.ts src/wallet.ts

# JSON output
solana-privacy-scanner analyze src/ --json --output analysis.json

# Hide low severity issues
solana-privacy-scanner analyze src/ --no-low
```

**Detects:**
- Fee payer reuse in loops (CRITICAL)
- PII in transaction memos (HIGH)
- Hardcoded addresses (MEDIUM)
- Descriptive memo patterns (LOW)

## init

Interactive setup wizard for privacy configuration.

```bash
solana-privacy-scanner init
```

Creates:
- `.privacyrc` - Privacy policy configuration
- `.github/workflows/privacy-check.yml` - GitHub Actions (optional)
- `.husky/pre-commit` - Pre-commit hook (optional)
- `tests/setup.ts` - Test matchers setup (optional)

**Configuration presets:**
- **Development** - Permissive rules
- **Production** - Strict rules
- **Custom** - Manual configuration

## Common Patterns

**Quick privacy check:**

```bash
solana-privacy-scanner scan-wallet YOUR_WALLET --max-signatures 30
```

**Automated monitoring:**

```bash
# Daily scan
solana-privacy-scanner scan-wallet YOUR_WALLET --json --output "scan-$(date +%Y%m%d).json"
```

**Process with jq:**

```bash
# Extract HIGH risk signals
solana-privacy-scanner scan-wallet YOUR_WALLET --json | \
  jq '.signals[] | select(.severity == "HIGH")'

# Count signals
solana-privacy-scanner scan-wallet YOUR_WALLET --json | jq '.summary.totalSignals'
```

**Scan multiple wallets:**

```bash
for wallet in wallet1 wallet2 wallet3; do
  solana-privacy-scanner scan-wallet "$wallet" --output "report-$wallet.txt"
done
```

**GitHub Actions:**

```yaml
- run: npm install -g solana-privacy-scanner
- run: |
    solana-privacy-scanner scan-wallet ${{ secrets.WALLET }} \
      --json --output audit.json
```

**Shell alias:**

```bash
# Add to .bashrc/.zshrc
alias solscan='solana-privacy-scanner scan-wallet'
```

## Troubleshooting

**Command not found:**

```bash
npm install -g solana-privacy-scanner
# or use npx
```

**429 Too Many Requests:**

Reduce `--max-signatures` or wait. Free RPC tiers have limits.

**No risks detected:**

May be accurate! Try increasing `--max-signatures` for more history.

**Test connectivity:**

```bash
solana-privacy-scanner scan-wallet YOUR_WALLET --max-signatures 5
```

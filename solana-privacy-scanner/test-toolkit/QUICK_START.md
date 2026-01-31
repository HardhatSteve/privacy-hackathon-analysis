# Quick Start - Copy & Paste Commands

## Setup (Run Once)

```bash
cd test-toolkit
npm install
```

## Run Everything

```bash
# Static analysis - fee payer (should find 2 CRITICAL issues)
npm run analyze:fee-payer

# Static analysis - memo PII (should find 13 issues)
npm run analyze:memo

# Static analysis - good code (should find 0 issues)
npm run analyze:good

# Run all tests (should all pass)
npm test

# Scan a real wallet
npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
```

## Individual Commands

### Static Code Analysis

```bash
# Analyze fee payer reuse (SHOULD FIND 2 CRITICAL issues)
npm run analyze:fee-payer

# Analyze memo PII (SHOULD FIND 13 issues: 5 CRITICAL, 2 HIGH, 6 MEDIUM)
npm run analyze:memo

# Analyze good code (SHOULD PASS - 0 issues)
npm run analyze:good

# Analyze all bad files together
npm run analyze
```

### Run Tests

```bash
# Run once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Scan Wallets

```bash
# Scan wallet (human-readable)
npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy

# Scan wallet (JSON)
npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --json

# Scan with custom RPC
npx solana-privacy-scanner scan-wallet ADDRESS --rpc https://your-rpc.com
```

### Scan Transactions

```bash
# Replace SIGNATURE with actual transaction signature
npx solana-privacy-scanner scan-transaction SIGNATURE

# JSON output
npx solana-privacy-scanner scan-transaction SIGNATURE --json
```

### Scan Programs

```bash
# Scan Token program
npx solana-privacy-scanner scan-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

# JSON output
npx solana-privacy-scanner scan-program PROGRAM_ID --json
```

## Expected Results

### ✅ Static Analysis - Fee Payer Bad
```
Files analyzed: 1
Total issues: 2
  🔴 CRITICAL: 2

Issues:
1. Fee payer declared outside loop but reused inside
2. Fee payer reused 3 times
```

### ✅ Static Analysis - Memo PII Bad
```
Files analyzed: 1
Total issues: 13
  🔴 CRITICAL: 5
  🟡 HIGH: 2
  🔵 MEDIUM: 6

Issues include: email, phone, SSN, credit card, URL with params, personal name
```

### ✅ Static Analysis - Good Example
```
✓ No privacy issues detected!
Total Issues: 0
```

### ✅ Tests
```
Test Files: 1 passed (1)
     Tests: 10+ passed
```

### ✅ Wallet Scan
```
Overall Risk: MEDIUM
Signals Detected: 5
  - 2 HIGH severity
  - 2 MEDIUM severity
  - 1 LOW severity
```

## Validation Checklist

- [ ] `npm install` completes successfully
- [ ] `npm run analyze:fee-payer` finds 2 CRITICAL issues
- [ ] `npm run analyze:memo` finds 13 issues (5 CRITICAL, 2 HIGH, 6 MEDIUM)
- [ ] `npm run analyze:good` finds 0 issues
- [ ] `npm test` all tests pass
- [ ] Wallet scanning works
- [ ] JSON output is valid
- [ ] Custom RPC flag works

## Next: Claude Code Plugin

Once all checks pass (see `VALIDATION_RESULTS.md`), you're ready to build the Claude Code plugin!

# Testing Summary

## What We're Testing

This test suite validates the **published npm packages** before building the Claude Code plugin.

## Installation

```bash
cd test-toolkit
npm install
```

## Quick Validation

Run these commands in order:

### 1. Static Analysis

```bash
# Should FIND ISSUES
npm run analyze:bad

# Should PASS
npm run analyze:good
```

### 2. Library Tests

```bash
npm test
```

### 3. CLI Commands

```bash
# Scan a real wallet
npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
```

## Current Static Analyzer Capabilities

The static analyzer currently has **2 detectors**:

### 1. Fee Payer Reuse Detector

**What it detects:**
- Variables with "fee" or "payer" in the name
- Declared OUTSIDE loops
- Used INSIDE loops

**Example that gets detected:**
```typescript
const feePayer = Keypair.generate(); // Outside loop

for (let i = 0; i < 10; i++) {
  transaction.feePayer = feePayer.publicKey; // DETECTED: Reuse in loop
}
```

**Severity:** HIGH

### 2. Memo PII Detector

**What it detects:**
- Email addresses (regex pattern)
- Phone numbers (regex pattern)
- Social Security Numbers
- Credit card numbers
- Generic PII patterns in memo fields

**Example that gets detected:**
```typescript
const memo = Buffer.from(`Payment from user@example.com`); // DETECTED: Email in memo
```

**Severity:** HIGH (email, SSN) or MEDIUM (phone, generic)

## Test Files Explained

### `bad-analyzer-example.ts`

Contains code patterns that the analyzer **actually detects**:
- 4 functions with fee payer reuse
- 2 functions with PII in memos
- Patterns match the AST analysis the analyzer performs

**Expected:** 3+ issues found (HIGH and MEDIUM)

### `good-example.ts`

Contains privacy-preserving code:
- Self-paid fees
- No fee payer reuse
- Generic memos without PII

**Expected:** 0 issues found

### `bad-example.ts`

General privacy anti-patterns for reference:
- External fee payers (function parameters)
- Address reuse
- Amount reuse
- Timing patterns

**Note:** These patterns are NOT currently detected by the static analyzer. They would be detected by the on-chain analysis when scanning actual transactions.

### `library.test.ts`

Integration tests for the core library:
- RPCClient creation
- Label provider functionality
- Wallet data collection
- Report generation
- Report structure validation

**Expected:** All tests pass

## What to Expect

### ✅ Should Work

- Static analyzer detects fee payer reuse (specific pattern)
- Static analyzer detects PII in memos
- Core library scans real wallets
- CLI commands execute successfully
- Reports have correct structure
- Label provider loads known addresses

### ❌ Not Yet Implemented

Static analyzer does NOT yet detect:
- Address reuse patterns
- Amount reuse
- Timing patterns
- Signer overlap
- Token account lifecycle
- Balance traceability

These are detected during **on-chain analysis** (scan-wallet command), not static analysis.

## Validation Checklist

Run through this checklist:

- [ ] `npm install` succeeds
- [ ] `npm run analyze:bad` finds 3+ issues
- [ ] `npm run analyze:good` finds 0 issues
- [ ] `npm test` all tests pass
- [ ] `scan-wallet` command works
- [ ] Reports show correct risk levels
- [ ] JSON output is valid

## Common Issues

### "No issues found" for bad-analyzer-example.ts

**Problem:** Analyzer not detecting patterns
**Check:**
1. Verify you're analyzing `bad-analyzer-example.ts`, not `bad-example.ts`
2. Check npm package version: `npm list solana-privacy-scanner`
3. Try reinstalling: `rm -rf node_modules && npm install`

### Tests timeout

**Problem:** RPC calls taking too long
**Solution:** Tests have 30s timeout, should be enough. If not, check internet connection.

### "AccountNotFound" errors

**Problem:** Trying to simulate transactions with unfunded accounts
**Solution:** This is why we removed `privacy.test.ts`. The `library.test.ts` doesn't simulate, it scans real data.

## Next Steps

Once validation passes:

✅ Static analyzer working
✅ Core library functioning
✅ CLI commands operational
✅ Tests passing

**Ready to build Claude Code plugin!**

The plugin will:
1. Use the analyzer to scan source code
2. Parse analyzer results
3. Use Claude to explain issues
4. Provide AI-powered fixes
5. Integrate with developer workflow

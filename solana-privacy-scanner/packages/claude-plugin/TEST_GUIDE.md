# Claude Code Plugin - Testing Guide

This guide provides all commands to test the Solana Privacy Scanner Claude Code Plugin both automatically (with Vitest) and manually.

## Prerequisites

1. Install dependencies:
```bash
cd packages/claude-plugin
npm install
```

2. Build the plugin:
```bash
npm run build
```

## Automated Tests

### Run All Integration Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Coverage

The integration tests cover:
- ✅ All 4 skills independently
- ✅ Skill chaining workflows (scan → explain → fix)
- ✅ Error handling
- ✅ Output formatting
- ✅ Edge cases

**Expected Results:**
- 20+ tests should pass
- Tests use test-toolkit repo files
- Tests verify real wallet scanning
- Tests validate markdown formatting

## Manual Testing Using test-toolkit

The `test-toolkit` directory at the project root contains perfect test files for the plugin.

### Test-Toolkit Files

```
test-toolkit/
├── src/
│   ├── fee-payer-bad.ts       # BAD: Fee payer outside loop
│   ├── memo-pii-bad.ts        # BAD: PII in memos
│   ├── good-example.ts        # GOOD: Clean code
│   └── library.test.ts        # Library integration tests
└── package.json
```

## Manual Test Commands

### Skill 1: scan-code

Test with bad fee payer code:
```bash
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts
```

**Expected Output:**
- ✅ 2 CRITICAL issues detected
- ✅ Shows file:line locations
- ✅ "Fee payer variable declared outside loop" messages

Test with memo PII:
```bash
node dist/skills/scan-code/handler.js ../../test-toolkit/src/memo-pii-bad.ts
```

**Expected Output:**
- ✅ 13 issues detected (5 CRITICAL, 2 HIGH, 6 MEDIUM)
- ✅ Email addresses detected
- ✅ Phone numbers detected
- ✅ SSNs detected

Test with good code:
```bash
node dist/skills/scan-code/handler.js ../../test-toolkit/src/good-example.ts
```

**Expected Output:**
- ✅ 0 issues detected
- ✅ "No privacy issues detected" message

Test with multiple files:
```bash
node dist/skills/scan-code/handler.js ../../test-toolkit/src/*.ts
```

**Expected Output:**
- ✅ Analyzes all TypeScript files
- ✅ Aggregates issues from all files

Test JSON output:
```bash
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts --json
```

**Expected Output:**
- ✅ Raw JSON output
- ✅ Structured data for programmatic use

---

### Skill 2: scan-wallet

Test with real wallet (small batch):
```bash
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 20
```

**Expected Output:**
- ✅ Overall Risk: MEDIUM or HIGH
- ✅ Signals grouped by severity
- ✅ Evidence shown (transaction signatures)
- ✅ Mitigations provided
- ✅ "Loaded 78 known address labels" message

Test with custom RPC:
```bash
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --rpc https://your-rpc.com --max-signatures 10
```

Test JSON output:
```bash
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10 --json
```

**Expected Output:**
- ✅ Raw JSON privacy report
- ✅ All signals with evidence arrays
- ✅ Known entities array

Test with invalid address:
```bash
node dist/skills/scan-wallet/handler.js invalid-address
```

**Expected Output:**
- ❌ Error: "Invalid Solana address: invalid-address"

Test verbose mode:
```bash
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10 --verbose
```

**Expected Output:**
- ✅ Progress messages shown
- ✅ "Fetching wallet data..."
- ✅ "Loaded N known address labels"
- ✅ "Generating privacy report..."

---

### Skill 3: explain-risk

Test fee payer reuse explanation:
```bash
node dist/skills/explain-risk/handler.js fee-payer-reuse
```

**Expected Output:**
- ✅ 🔴 CRITICAL severity
- ✅ 10 sections (What This Is, Why It Matters, etc.)
- ✅ Real-world deanonymization scenario
- ✅ Prevention strategies (4 items)
- ✅ Mitigation strategies (4 items)
- ✅ Solana-specific notes
- ✅ Related risks with descriptions
- ✅ Documentation links

Test memo PII explanation:
```bash
node dist/skills/explain-risk/handler.js memo-pii
```

**Expected Output:**
- ✅ CRITICAL severity
- ✅ Regex pattern detection explained
- ✅ UUID solution described
- ✅ Off-chain database approach

Test timing patterns:
```bash
node dist/skills/explain-risk/handler.js timing-burst
```

**Expected Output:**
- ✅ HIGH severity
- ✅ Bot fingerprinting scenario
- ✅ Jitter strategies explained

Test list all risks:
```bash
node dist/skills/explain-risk/handler.js --list
```

**Expected Output:**
- ✅ 4 categories (Solana-Specific, Behavioral, Timing, Traditional)
- ✅ 16 total risks documented
- ✅ Each risk shows: ID, name, severity, overview

Test invalid risk ID:
```bash
node dist/skills/explain-risk/handler.js invalid-risk-id
```

**Expected Output:**
- ❌ Error: "Unknown risk ID: invalid-risk-id"
- ✅ Suggestion to use --list

---

### Skill 4: suggest-fix

Test fee payer reuse fix:
```bash
node dist/skills/suggest-fix/handler.js fee-payer-reuse
```

**Expected Output:**
- ✅ Before/after code comparison
- ✅ Current code shows fee payer outside loop
- ✅ Fixed code shows fee payer inside loop
- ✅ 4 alternative approaches
- ✅ 4 testing recommendations
- ✅ Trade-offs section (cost, complexity, speed, privacy)
- ✅ Related fixes listed

Test memo PII fix:
```bash
node dist/skills/suggest-fix/handler.js memo-pii
```

**Expected Output:**
- ✅ UUID implementation with imports
- ✅ Off-chain database schema
- ✅ 4 alternatives (remove, hash, encrypt, sanitize)
- ✅ Historical PII scanning recommendation

Test privacy best practices:
```bash
node dist/skills/suggest-fix/handler.js privacy-best-practices
```

**Expected Output:**
- ✅ Comprehensive template (60+ lines)
- ✅ Combines 5+ techniques
- ✅ Amount randomization
- ✅ Intermediary wallets
- ✅ Unique fee payers
- ✅ Timing delays
- ✅ Helper functions (sleep, fundFeePayer)

Test timing burst fix:
```bash
node dist/skills/suggest-fix/handler.js timing-burst
```

**Expected Output:**
- ✅ Random delay implementation
- ✅ Jitter calculation (100-500ms)
- ✅ sleep() helper function

Test balance traceability fix:
```bash
node dist/skills/suggest-fix/handler.js balance-traceability
```

**Expected Output:**
- ✅ Multi-hop strategy
- ✅ Amount splitting (3 intermediaries)
- ✅ Timing delays
- ✅ Noise addition

Test list all fixes:
```bash
node dist/skills/suggest-fix/handler.js --list
```

**Expected Output:**
- ✅ 3 severity groups (CRITICAL, HIGH, MEDIUM)
- ✅ 10 total fix templates
- ✅ Each shows: ID, name, issue summary

Test invalid risk ID:
```bash
node dist/skills/suggest-fix/handler.js invalid-risk-id
```

**Expected Output:**
- ❌ Error: "Unknown risk ID: invalid-risk-id"
- ✅ Suggestion to use --list

---

## Workflow Testing (Skill Chaining)

### Workflow 1: Complete Static Analysis Flow

```bash
# Step 1: Scan code
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts

# Step 2: Explain the detected risk
node dist/skills/explain-risk/handler.js fee-payer-reuse

# Step 3: Get fix suggestion
node dist/skills/suggest-fix/handler.js fee-payer-reuse
```

**Expected Flow:**
1. ✅ Scan detects 2 CRITICAL issues at specific lines
2. ✅ Explanation teaches why fee payer reuse is #1 Solana risk
3. ✅ Fix provides working code to move fee payer inside loop

### Workflow 2: Complete On-Chain Analysis Flow

```bash
# Step 1: Scan wallet
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 20

# Step 2: Explain a detected signal (e.g., timing-burst)
node dist/skills/explain-risk/handler.js timing-burst

# Step 3: Get fix for timing patterns
node dist/skills/suggest-fix/handler.js timing-burst
```

**Expected Flow:**
1. ✅ Wallet scan shows transaction burst pattern (HIGH)
2. ✅ Explanation describes bot fingerprinting
3. ✅ Fix shows random delay implementation

### Workflow 3: Educational Flow

```bash
# Step 1: List all available risks
node dist/skills/explain-risk/handler.js --list

# Step 2: Learn about a specific risk
node dist/skills/explain-risk/handler.js signer-overlap

# Step 3: See how to fix it
node dist/skills/suggest-fix/handler.js signer-overlap
```

**Expected Flow:**
1. ✅ Shows all 16 documented risks
2. ✅ Detailed explanation of signer overlap
3. ✅ Code to use unique signers per compartment

---

## API Testing (Programmatic Use)

### Test High-Level APIs

Create a test file `test-api.js`:

```javascript
import { analyzeCode } from './dist/src/analyzer.js';
import { scanWalletPrivacy } from './dist/src/scanner.js';
import { explainPrivacyRisk } from './dist/src/explainer.js';
import { suggestPrivacyFix } from './dist/src/fixer.js';

// Test scan-code API
const scanResult = await analyzeCode({
  paths: ['../../test-toolkit/src/fee-payer-bad.ts']
});
console.log('Scan Result:', scanResult.data.totalIssues, 'issues');

// Test scan-wallet API
const walletResult = await scanWalletPrivacy({
  address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  maxSignatures: 10
});
console.log('Wallet Risk:', walletResult.data.stats.totalSignals, 'signals');

// Test explain-risk API
const explainResult = await explainPrivacyRisk({
  riskId: 'fee-payer-reuse'
});
console.log('Explanation:', explainResult.data.name);

// Test suggest-fix API
const fixResult = await suggestPrivacyFix({
  riskId: 'fee-payer-reuse'
});
console.log('Fix:', fixResult.data.name);
```

Run it:
```bash
node test-api.js
```

**Expected Output:**
- ✅ All 4 APIs return success
- ✅ Data structures are correct
- ✅ Messages are formatted

---

## Performance Testing

### Test Scanning Speed

```bash
# Small scan (fast)
time node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10

# Medium scan
time node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 50

# Large scan (slower)
time node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 100
```

**Expected Timings:**
- 10 signatures: ~5-10 seconds
- 50 signatures: ~15-30 seconds
- 100 signatures: ~30-60 seconds

### Test Static Analysis Speed

```bash
# Single file (fast)
time node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts

# Multiple files
time node dist/skills/scan-code/handler.js ../../test-toolkit/src/*.ts

# Larger codebase (if available)
time node dist/skills/scan-code/handler.js ../../packages/core/src/**/*.ts
```

---

## Error Handling Tests

### Test Invalid Inputs

```bash
# Invalid wallet address
node dist/skills/scan-wallet/handler.js invalid-address

# Invalid RPC endpoint
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --rpc https://invalid-rpc.com --max-signatures 5

# Nonexistent file
node dist/skills/scan-code/handler.js nonexistent-file.ts

# Invalid risk ID
node dist/skills/explain-risk/handler.js invalid-risk-id

# Invalid fix ID
node dist/skills/suggest-fix/handler.js invalid-fix-id
```

**Expected:**
- ✅ All errors handled gracefully
- ✅ Helpful error messages shown
- ✅ Suggestions for fixes
- ✅ Exit codes: 1 for errors

---

## Test Summary Checklist

Run through this checklist to verify all functionality:

### Skill 1: scan-code ✅
- [ ] Detects fee payer reuse (2 CRITICAL issues)
- [ ] Detects PII in memos (13 issues)
- [ ] Returns 0 issues for clean code
- [ ] Handles multiple files
- [ ] JSON output works
- [ ] Error handling for missing files

### Skill 2: scan-wallet ✅
- [ ] Scans real wallet successfully
- [ ] Shows overall risk level
- [ ] Groups signals by severity
- [ ] Shows evidence
- [ ] Loads 78 known addresses
- [ ] Handles RPC errors
- [ ] Invalid address error
- [ ] JSON output works
- [ ] Verbose mode shows progress

### Skill 3: explain-risk ✅
- [ ] Explains fee-payer-reuse (CRITICAL)
- [ ] Explains memo-pii (CRITICAL)
- [ ] Explains all 16 risks
- [ ] Lists all risks with --list
- [ ] Shows 10 sections per explanation
- [ ] Includes real-world scenarios
- [ ] Provides prevention strategies
- [ ] Error for invalid risk ID

### Skill 4: suggest-fix ✅
- [ ] Suggests fee-payer-reuse fix
- [ ] Suggests memo-pii fix
- [ ] Shows before/after code
- [ ] Provides 4 alternatives per fix
- [ ] Includes testing recommendations
- [ ] Shows trade-offs
- [ ] Lists all 10 templates with --list
- [ ] Privacy best practices template works
- [ ] Error for invalid risk ID

### Workflows ✅
- [ ] Complete static flow (scan → explain → fix)
- [ ] Complete on-chain flow (scan → explain → fix)
- [ ] Educational flow (list → explain → fix)

### Integration ✅
- [ ] All automated tests pass (npm test)
- [ ] High-level APIs work
- [ ] Error handling robust
- [ ] Performance acceptable

---

## Quick Test Script

Create `test-all.sh` to test everything:

```bash
#!/bin/bash

echo "=== Testing scan-code ==="
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts

echo -e "\n=== Testing scan-wallet ==="
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10

echo -e "\n=== Testing explain-risk ==="
node dist/skills/explain-risk/handler.js fee-payer-reuse | head -50

echo -e "\n=== Testing suggest-fix ==="
node dist/skills/suggest-fix/handler.js fee-payer-reuse | head -50

echo -e "\n=== Testing list commands ==="
node dist/skills/explain-risk/handler.js --list | head -20
node dist/skills/suggest-fix/handler.js --list | head -20

echo -e "\n=== All manual tests complete ==="
```

Run it:
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Document any issues found
2. ✅ Update error messages if needed
3. ✅ Add more test cases if gaps found
4. ✅ Prepare for distribution (Task 7)

## Common Issues & Solutions

**Issue:** "Cannot find module solana-privacy-scanner"
**Solution:** Run `npm install` in both `packages/claude-plugin` and `packages/cli`

**Issue:** RPC timeouts during wallet scanning
**Solution:** Use `--max-signatures 10` or provide custom RPC with `--rpc`

**Issue:** Tests fail with network errors
**Solution:** Check internet connection, RPC endpoint may be rate limiting

**Issue:** "File not found" errors
**Solution:** Ensure you're running commands from `packages/claude-plugin` directory

---

**All test commands are ready!** Run through this guide to verify the plugin works end-to-end. 🎉

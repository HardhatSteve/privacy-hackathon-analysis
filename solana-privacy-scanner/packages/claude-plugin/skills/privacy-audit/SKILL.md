---
name: privacy-audit
description: This skill should be used when the user asks to "audit the repo", "scan and fix all", "privacy audit", "fix all privacy issues", wants comprehensive privacy analysis and automated fixes across their entire Solana codebase, or needs a summary report of privacy improvements.
version: 1.0.0
---

# Privacy Audit - Comprehensive Repository Privacy Analysis & Fix

Performs a complete privacy audit of a Solana repository, automatically applies fixes, and generates a summary report.

## Overview

This skill orchestrates a full privacy analysis workflow:

1. **Scan** - Analyze all code files for privacy issues
2. **Fix** - Automatically apply fixes with user confirmation
3. **Report** - Generate summary table of all changes

## When to Use This Skill

Use this skill when the user wants to:
- "Audit the entire repo for privacy issues"
- "Scan and fix all privacy problems"
- "Do a complete privacy analysis"
- "Fix all privacy issues automatically"
- "Get a privacy report for the whole codebase"

## Workflow Steps

### Step 1: Initial Scan

Run static analysis on the entire repository:

```bash
# Scan all TypeScript/JavaScript files
solana-privacy-scanner analyze "src/**/*.{ts,js,tsx,jsx}" --json
```

Parse the JSON output to identify all issues grouped by:
- File path
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Issue type (fee-payer-reuse, memo-pii, etc.)

### Step 2: Categorize Issues

Group issues by fix type:
- **Auto-fixable**: Issues with deterministic fixes (e.g., fee payer moved inside loop)
- **Requires review**: Issues needing human judgment (e.g., memo content decisions)
- **Informational**: Low severity issues for awareness

### Step 3: Apply Fixes

For each auto-fixable issue:

1. **Show the issue**:
   - File: `src/transactions.ts:42`
   - Problem: Fee payer declared outside loop
   - Severity: CRITICAL

2. **Get fix template** from suggest-fix skill

3. **Apply fix** using Edit tool:
   - Read the file
   - Apply the transformation
   - Verify syntax is valid

4. **Track the change** for the summary report

### Step 4: Generate Summary Report

Create a markdown table summarizing all changes:

```markdown
## Privacy Audit Summary

**Repository**: [repo-name]
**Date**: [timestamp]
**Total Issues Found**: X
**Auto-Fixed**: Y
**Requires Review**: Z

### Fixed Issues

| File | Line | Severity | Issue Type | Fix Applied |
|------|------|----------|------------|-------------|
| src/transactions.ts | 42 | 🔴 CRITICAL | Fee Payer Reuse | Moved fee payer generation inside loop |
| src/wallet.ts | 128 | 🔴 CRITICAL | Memo PII | Replaced email with UUID reference |
| src/helpers.ts | 67 | 🟡 MEDIUM | Address Reuse | Added wallet compartmentalization |

### Issues Requiring Review

| File | Line | Severity | Issue Type | Recommendation |
|------|------|----------|------------|----------------|
| src/analytics.ts | 234 | 🔴 CRITICAL | Memo PII | Review memo content and sanitize manually |
| src/config.ts | 15 | 🟡 MEDIUM | Known Entity | Consider privacy implications of CEX integration |

### Privacy Score Improvement

- **Before**: 45/100 (HIGH RISK)
- **After**: 82/100 (LOW RISK)
- **Improvement**: +37 points

### Next Steps

1. Review the 2 issues requiring manual attention
2. Run tests to verify fixes don't break functionality
3. Scan wallet addresses used in production
4. Consider privacy-preserving architecture improvements
```

## Fix Strategies by Issue Type

### Fee Payer Reuse (CRITICAL)

**Detection Pattern**:
```typescript
const feePayer = Keypair.generate(); // Outside loop
for (const recipient of recipients) {
  await sendAndConfirmTransaction(..., [sender, feePayer]);
}
```

**Auto-Fix**:
```typescript
for (const recipient of recipients) {
  const feePayer = Keypair.generate(); // Inside loop - unique per tx
  await sendAndConfirmTransaction(..., [sender, feePayer]);
}
```

**Applied**: Move fee payer generation inside loop

### Memo PII (CRITICAL)

**Detection Pattern**:
```typescript
const memo = `Payment from ${user.email}`;
```

**Auto-Fix**:
```typescript
const paymentRef = uuidv4();
await db.save({ ref: paymentRef, userEmail: user.email });
const memo = `Payment ref: ${paymentRef}`;
```

**Applied**: Replace PII with UUID reference + off-chain storage

### Signer Overlap (HIGH)

**Detection Pattern**:
```typescript
// Same signers across multiple wallets
const authority1 = Keypair.fromSecretKey(...);
const authority2 = Keypair.fromSecretKey(...);

// Used for multiple purposes
createWallet1([authority1, authority2]);
createWallet2([authority1, authority2]); // Same signers!
```

**Auto-Fix**:
```typescript
// Unique signers per purpose
const tradingAuthority = Keypair.generate();
const savingsAuthority = Keypair.generate();

createTradingWallet([tradingAuthority]);
createSavingsWallet([savingsAuthority]);
```

**Applied**: Generate unique signer sets per wallet purpose

### Address Reuse (MEDIUM)

**Detection Pattern**:
```typescript
// Single wallet for everything
const wallet = Keypair.fromSecretKey(...);
await buyNFT(wallet);
await tradeDEX(wallet);
await donate(wallet);
```

**Auto-Fix**:
```typescript
// Separate wallets per activity
const nftWallet = Keypair.generate();
const tradingWallet = Keypair.generate();
const donationWallet = Keypair.generate();

await buyNFT(nftWallet);
await tradeDEX(tradingWallet);
await donate(donationWallet);
```

**Applied**: Implement wallet compartmentalization

### Timing Patterns (MEDIUM)

**Detection Pattern**:
```typescript
for (const trade of trades) {
  await executeTrade(trade); // Immediate execution
}
```

**Auto-Fix**:
```typescript
for (const trade of trades) {
  const jitter = Math.random() * 400 + 100; // 100-500ms
  await sleep(jitter);
  await executeTrade(trade);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Applied**: Add random timing delays

## User Confirmation Flow

Before applying fixes, confirm with the user:

**For CRITICAL issues**:
```
Found 3 CRITICAL privacy issues that can be auto-fixed:
1. Fee payer reuse in src/transactions.ts (line 42)
2. Email in memo in src/wallet.ts (line 128)
3. Phone number in memo in src/payments.ts (line 89)

Apply fixes automatically? (y/n)
```

**For grouped fixes**:
```
Apply all auto-fixable CRITICAL issues? (5 total)
Apply all auto-fixable HIGH issues? (3 total)
Apply all auto-fixable MEDIUM issues? (7 total)
```

**Individual confirmation** for complex fixes:
```
Fix preview for src/transactions.ts:42

Current:
  const feePayer = Keypair.generate();
  for (const recipient of recipients) {
    ...
  }

Fixed:
  for (const recipient of recipients) {
    const feePayer = Keypair.generate();
    ...
  }

Apply this fix? (y/n/s=skip all)
```

## Error Handling

### Syntax Errors After Fix

If a fix breaks syntax:
1. Revert the change
2. Mark as "Requires review"
3. Note the error in report
4. Continue with other fixes

### Test Failures

After all fixes:
1. Run test suite if available
2. Report any failures
3. Suggest reverting specific fixes if tests break

### Import Issues

If fix requires new imports:
1. Add import automatically: `import { v4 as uuidv4 } from 'uuid';`
2. Check if package is installed
3. Suggest adding to package.json if needed

## Best Practices

### 1. Backup Before Fixing

Recommend creating a git branch:
```bash
git checkout -b privacy-audit-$(date +%Y%m%d)
git add .
git commit -m "Pre-privacy-audit snapshot"
```

### 2. Incremental Fixes

Apply fixes in severity order:
1. CRITICAL first
2. HIGH second
3. MEDIUM third
4. LOW last (often skip these)

### 3. Testing Between Fixes

After fixing CRITICAL issues:
```bash
npm test
```

If tests pass, continue. If tests fail, review the last fix.

### 4. Documentation

Add comments explaining privacy decisions:
```typescript
// Privacy: Using unique fee payer per transaction to prevent linking
const feePayer = Keypair.generate();
```

## Output Example

```markdown
# 🔒 Privacy Audit Complete

**Repository**: solana-dex
**Scanned**: 47 files
**Issues Found**: 15 total (5 CRITICAL, 3 HIGH, 7 MEDIUM)
**Auto-Fixed**: 12 issues
**Requires Review**: 3 issues

## Summary Table

| Status | File | Line | Severity | Issue | Fix |
|--------|------|------|----------|-------|-----|
| ✅ Fixed | src/transactions.ts | 42 | 🔴 CRITICAL | Fee Payer Reuse | Moved inside loop |
| ✅ Fixed | src/wallet.ts | 128 | 🔴 CRITICAL | Memo PII (Email) | UUID reference |
| ✅ Fixed | src/payments.ts | 89 | 🔴 CRITICAL | Memo PII (Phone) | UUID reference |
| ✅ Fixed | src/helpers.ts | 67 | 🟡 MEDIUM | Address Reuse | Compartmentalization |
| ✅ Fixed | src/trading.ts | 234 | 🟡 MEDIUM | Timing Burst | Random delays |
| ⚠️ Review | src/analytics.ts | 45 | 🔴 CRITICAL | Memo Content | Manual review needed |
| ⚠️ Review | src/config.ts | 12 | 🟡 MEDIUM | CEX Integration | Architectural decision |

## Code Changes

**Files Modified**: 8
**Lines Changed**: ~125
**New Dependencies**: uuid (for UUID generation)

## Privacy Score

- **Before**: 🔴 42/100 (HIGH RISK)
- **After**: 🟢 85/100 (LOW RISK)
- **Improvement**: +43 points ⬆️

## Remaining Issues (3)

### CRITICAL - Requires Manual Review

**src/analytics.ts:45**
- Issue: Memo contains user identifiers
- Recommendation: Review if this data is necessary, consider hashing or removing

### MEDIUM - Architectural Decision

**src/config.ts:12**
- Issue: Direct CEX integration without privacy layer
- Recommendation: Add intermediary wallets between users and CEX

## Next Steps

1. ✅ Auto-fixes applied and tested
2. ⏳ Review 2 issues requiring manual attention
3. ⏳ Run full test suite
4. ⏳ Scan production wallet addresses
5. ⏳ Consider adding privacy-preserving infrastructure

## Recommendations

### Immediate
- Address the 2 CRITICAL issues requiring manual review
- Run integration tests to verify fixes

### Short-term
- Implement privacy-first architecture patterns
- Add privacy checks to CI/CD pipeline
- Train team on Solana privacy best practices

### Long-term
- Consider using privacy-preserving protocols
- Regular privacy audits (monthly)
- Monitor on-chain privacy metrics

---

**Generated by**: Solana Privacy Scanner v0.7.0
**Date**: 2026-01-25 01:15:42 UTC
**Audit ID**: audit-2026-01-25-abc123
```

## Integration with Other Skills

This skill orchestrates the other skills:

1. **Uses scan-code**: For initial analysis
2. **Uses explain-risk**: To understand each issue type
3. **Uses suggest-fix**: To get fix templates
4. **Combines all**: Into a comprehensive workflow

## Edge Cases

### No Issues Found

```markdown
# 🎉 Privacy Audit Complete - No Issues Found!

**Repository**: solana-dex
**Files Scanned**: 47
**Issues Found**: 0

Your codebase follows privacy best practices!

Consider:
- Regular audits as code evolves
- Scanning production wallet addresses
- Privacy monitoring in CI/CD
```

### All Issues Require Manual Review

```markdown
# ⚠️ Privacy Audit Complete - Manual Review Required

All detected issues require human judgment:

| File | Issue | Why Manual Review Needed |
|------|-------|-------------------------|
| src/config.ts | Architecture | Business decision on CEX integration |
| src/analytics.ts | Data retention | Legal/compliance considerations |

Recommendation: Schedule privacy review meeting with team.
```

### Partial Fix Success

```markdown
# 🔄 Privacy Audit Partially Complete

**Auto-Fixed**: 8/12 issues
**Failed**: 4 issues (reverted)
**Requires Review**: 3 issues

## Failed Fixes (Reverted)

| File | Issue | Why It Failed |
|------|-------|---------------|
| src/complex.ts | Fee Payer | Syntax error after fix - complex loop structure |

These issues are marked for manual review.
```

## Commands to Run

**Start full audit**:
```
Audit this repository for privacy issues and fix them
```

**Scan only (no fixes)**:
```
Scan the repository for privacy issues without fixing
```

**Fix specific severity**:
```
Fix all CRITICAL privacy issues
```

**Generate report only**:
```
Generate privacy report for this codebase
```

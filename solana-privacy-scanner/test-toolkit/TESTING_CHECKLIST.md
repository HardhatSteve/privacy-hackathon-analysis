# Testing Checklist

Use this checklist to validate all toolkit features before moving to Claude Code plugin development.

## Pre-Testing Setup

- [ ] Install dependencies: `npm install`
- [ ] Verify CLI installed: `npx solana-privacy-scanner --version`
- [ ] Check TypeScript compiles: `npx tsc --noEmit`

## 1. Static Code Analysis

### Test Bad Example (Should FAIL)
- [ ] Run: `npx solana-privacy-scanner analyze src/bad-example.ts`
- [ ] Verify detects: Fee payer reuse
- [ ] Verify detects: PII in memo
- [ ] Verify detects: Address reuse
- [ ] Verify detects: Amount reuse
- [ ] Verify shows: HIGH severity issues
- [ ] Verify shows: Line numbers and file paths
- [ ] Verify shows: Actionable suggestions

### Test Good Example (Should PASS)
- [ ] Run: `npx solana-privacy-scanner analyze src/good-example.ts`
- [ ] Verify: No issues detected OR minimal LOW severity
- [ ] Verify: Displays success message
- [ ] Verify: Shows files analyzed count

### Test All Files
- [ ] Run: `npm run analyze`
- [ ] Verify: Analyzes both files
- [ ] Verify: Summary shows correct counts
- [ ] Verify: Exit code non-zero if issues found

## 2. Test Matchers

### Run Test Suite
- [ ] Run: `npm test`
- [ ] Verify: All tests pass
- [ ] Verify: "Good Privacy Practices" tests pass
- [ ] Verify: "Privacy Anti-Patterns" correctly detect issues
- [ ] Verify: "Known Entity Detection" works
- [ ] Verify: "Signal Thresholds" enforced

### Test Individual Matchers
Check each matcher works:
- [ ] `toHavePrivacyRisk()` - Asserts risk level
- [ ] `toHaveNoHighRiskSignals()` - No HIGH signals
- [ ] `toNotLeakUserRelationships()` - No linking
- [ ] `toHavePrivacyScore()` - Minimum score
- [ ] `toHaveAtMostSignals()` - Signal limit
- [ ] `toHaveNoKnownEntities()` - No CEX/bridge
- [ ] `toNotInteractWith()` - Avoid entity type
- [ ] `toHaveSignal()` - Has specific signal
- [ ] `toNotHaveSignal()` - Lacks specific signal

### Test Watch Mode
- [ ] Run: `npm run test:watch`
- [ ] Verify: Reruns on file changes
- [ ] Verify: Can filter tests
- [ ] Exit watch mode

## 3. CLI Wallet Scanning

### Scan Known Wallet
- [ ] Run: `npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy`
- [ ] Verify: Shows overall risk level
- [ ] Verify: Shows privacy signals
- [ ] Verify: Shows mitigations
- [ ] Verify: Shows transaction count
- [ ] Verify: Human-readable format

### JSON Output
- [ ] Run: `npx solana-privacy-scanner scan-wallet ADDRESS --json`
- [ ] Verify: Valid JSON output
- [ ] Verify: Contains all report fields
- [ ] Verify: Can pipe to jq: `... | jq .overallRisk`

### Custom RPC
- [ ] Run: `npx solana-privacy-scanner scan-wallet ADDRESS --rpc https://api.mainnet-beta.solana.com`
- [ ] Verify: Uses custom RPC
- [ ] Verify: Still produces report

## 4. CLI Transaction Scanning

### Scan Transaction
- [ ] Find recent tx signature from wallet scan
- [ ] Run: `npx solana-privacy-scanner scan-transaction SIGNATURE`
- [ ] Verify: Shows transaction details
- [ ] Verify: Shows fee payer info
- [ ] Verify: Shows signer info
- [ ] Verify: Shows privacy signals

### JSON Output
- [ ] Run: `npx solana-privacy-scanner scan-transaction SIGNATURE --json`
- [ ] Verify: Valid JSON
- [ ] Verify: Parseable output

## 5. CLI Program Scanning

### Scan Known Program
- [ ] Run: `npx solana-privacy-scanner scan-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- [ ] Verify: Shows program analysis
- [ ] Verify: Shows account interactions
- [ ] Verify: Shows privacy signals

### JSON Output
- [ ] Run: `npx solana-privacy-scanner scan-program PROGRAM_ID --json`
- [ ] Verify: Valid JSON output

## 6. Error Handling

### Invalid Inputs
- [ ] Test invalid wallet address
- [ ] Test invalid transaction signature
- [ ] Test invalid program ID
- [ ] Verify: Shows helpful error messages
- [ ] Verify: Non-zero exit codes

### Network Errors
- [ ] Test with invalid RPC URL
- [ ] Verify: Shows connection error
- [ ] Verify: Suggests troubleshooting

### File Not Found
- [ ] Run: `npx solana-privacy-scanner analyze nonexistent.ts`
- [ ] Verify: Shows file not found error

## 7. Integration Tests

### Library Usage
- [ ] Create test script using `solana-privacy-scanner-core`
- [ ] Import: `RPCClient`, `collectWalletData`, `normalizeWalletData`, `generateReport`
- [ ] Verify: Can programmatically scan wallet
- [ ] Verify: Report structure matches types

### Matcher Usage
- [ ] Import matchers: `import 'solana-privacy-scanner-core/matchers'`
- [ ] Verify: Matchers available in tests
- [ ] Verify: TypeScript types work
- [ ] Verify: Assertion errors are descriptive

## Final Validation

- [ ] All static analysis tests pass
- [ ] All matcher tests pass
- [ ] All CLI commands work
- [ ] Error handling is robust
- [ ] Documentation is accurate
- [ ] Ready for Claude Code plugin development

## Issues Found

Document any issues here:

```
Issue 1:
  Description:
  Steps to reproduce:
  Expected:
  Actual:

Issue 2:
  ...
```

## Sign-Off

- [ ] Toolkit is production-ready
- [ ] All features validated
- [ ] Documentation verified
- [ ] Ready to proceed with Claude Code plugin

**Tested by:** _______________
**Date:** _______________
**Version:** _______________

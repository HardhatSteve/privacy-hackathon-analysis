# Quick Test Commands

Run these commands from `packages/claude-plugin` directory to test the plugin.

## Setup (One Time)

```bash
cd packages/claude-plugin
npm install
npm run build
```

## Automated Tests

```bash
# Run all integration tests
npm test
```

## Manual Tests - Using test-toolkit

### 1. Test scan-code skill

```bash
# Detect fee payer issues
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts

# Detect PII in memos
node dist/skills/scan-code/handler.js ../../test-toolkit/src/memo-pii-bad.ts

# Verify clean code returns 0 issues
node dist/skills/scan-code/handler.js ../../test-toolkit/src/good-example.ts
```

### 2. Test scan-wallet skill

```bash
# Scan a real wallet
node dist/skills/scan-wallet/handler.js DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 20
```

### 3. Test explain-risk skill

```bash
# Explain a specific risk
node dist/skills/explain-risk/handler.js fee-payer-reuse

# List all available risks
node dist/skills/explain-risk/handler.js --list
```

### 4. Test suggest-fix skill

```bash
# Get fix for fee payer issue
node dist/skills/suggest-fix/handler.js fee-payer-reuse

# List all available fixes
node dist/skills/suggest-fix/handler.js --list
```

## Complete Workflow Test

```bash
# Step 1: Scan code and find issues
node dist/skills/scan-code/handler.js ../../test-toolkit/src/fee-payer-bad.ts

# Step 2: Explain the detected risk
node dist/skills/explain-risk/handler.js fee-payer-reuse

# Step 3: Get code to fix it
node dist/skills/suggest-fix/handler.js fee-payer-reuse
```

## Expected Results

✅ **scan-code**: Should detect 2 CRITICAL fee payer issues
✅ **scan-wallet**: Should show MEDIUM/HIGH risk with signals
✅ **explain-risk**: Should show 10-section detailed explanation
✅ **suggest-fix**: Should show before/after code comparison

## All Tests Pass?

If all commands work, the plugin is ready! 🎉

See `TEST_GUIDE.md` for comprehensive testing documentation.

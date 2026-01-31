# Solana Privacy Scanner - Toolkit Test Suite

This directory contains a comprehensive test suite to validate the `solana-privacy-scanner` toolkit before building the Claude Code plugin.

## Setup

### 1. Install Dependencies

Install the published npm packages:

```bash
cd test-toolkit
npm install
```

This will install:
- `solana-privacy-scanner` - The toolkit (CLI + dev tools)
- `solana-privacy-scanner-core` - The core library
- `@solana/web3.js` - Solana SDK
- `vitest` - Test runner
- `typescript` - TypeScript compiler

### 2. Verify Installation

Check that the CLI is available:

```bash
npx solana-privacy-scanner --version
```

## Running Tests

### Static Code Analysis

Analyze the source code for privacy anti-patterns:

```bash
# Analyze all TypeScript files
npm run analyze

# Analyze bad example (should find issues)
npx solana-privacy-scanner analyze src/bad-analyzer-example.ts

# Analyze good example (should pass)
npx solana-privacy-scanner analyze src/good-example.ts
```

**Expected Output:**
- `bad-analyzer-example.ts` - Should detect fee payer reuse (HIGH), PII in memos (HIGH/MEDIUM)
- `good-example.ts` - Should pass with minimal or no warnings

**Note:** Static analyzer currently detects:
- Fee payer reuse (variables declared outside loops, used inside)
- PII in memos (emails, phone numbers, SSNs)

### Run Test Matchers

Test the custom Vitest matchers:

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch
```

**Expected Output:**
- "Good Privacy Practices" tests should PASS
- "Privacy Anti-Patterns" tests should correctly DETECT issues
- All assertions using matchers should work correctly

### Scan Real Wallets

Scan actual Solana wallets (mainnet):

```bash
# Scan a wallet (replace with any address)
npm run scan:wallet -- DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy

# Scan in JSON format
npx solana-privacy-scanner scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --json

# Scan with custom RPC
npx solana-privacy-scanner scan-wallet ADDRESS --rpc https://your-rpc.com
```

### Scan Transactions

Scan individual transactions:

```bash
# Scan a transaction signature
npm run scan:tx -- 5wJqZB8Hb8xCZ8X9K3r4J2VQ7mD1pE6yN8sT3vL9kW4xR2aQ

# JSON output
npx solana-privacy-scanner scan-transaction SIGNATURE --json
```

### Scan Programs

Analyze program interactions:

```bash
# Scan a program
npx solana-privacy-scanner scan-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

# JSON output
npx solana-privacy-scanner scan-program PROGRAM_ID --json
```

## File Structure

```
test-toolkit/
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Vitest config
├── src/
│   ├── bad-analyzer-example.ts # Code patterns the analyzer detects (SHOULD FAIL)
│   ├── good-example.ts         # Code with good privacy practices (SHOULD PASS)
│   ├── bad-example.ts          # General privacy anti-patterns (reference)
│   └── library.test.ts         # Core library integration tests
└── README.md                   # This file
```

## What to Validate

### ✅ Static Analyzer Should Detect:

**In `bad-analyzer-example.ts`:**
- ❌ Fee payer reuse (HIGH) - Variables declared outside loops, used inside
- ❌ PII in memo fields (HIGH/MEDIUM) - Email addresses, phone numbers

**In `good-example.ts`:**
- ✅ Self-paid fees
- ✅ Generic memos without PII
- ✅ No fee payer reuse patterns

### ✅ Core Library Should Work:

All these functions should work correctly:
- `RPCClient()` - Create RPC client
- `collectWalletData()` - Fetch wallet data
- `normalizeWalletData()` - Normalize to ScanContext
- `generateReport()` - Generate privacy report
- `createDefaultLabelProvider()` - Load known addresses

### ✅ CLI Commands Should Work:

- `scan-wallet` - Analyze wallet privacy
- `scan-transaction` - Analyze single transaction
- `scan-program` - Analyze program interactions
- `analyze` - Static code analysis
- `--json` flag - JSON output format
- `--rpc` flag - Custom RPC endpoint

## Expected Results

### Bad Analyzer Example Analysis

```bash
$ npx solana-privacy-scanner analyze src/bad-analyzer-example.ts
```

**Expected Output:**
```
Analyzing: src/bad-analyzer-example.ts

Issues Found:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HIGH] Fee payer reuse detected
  File: src/bad-analyzer-example.ts:18
  Fee payer variable declared outside loop and reused inside

[HIGH] PII in memo field
  File: src/bad-analyzer-example.ts:53
  Email address detected in transaction memo

[MEDIUM] PII in memo field
  File: src/bad-analyzer-example.ts:76
  Phone number pattern detected in memo

Summary:
  Files Analyzed: 1
  Total Issues: 3+
  HIGH: 2+, MEDIUM: 1+, LOW: 0
```

### Good Example Analysis

```bash
$ npx solana-privacy-scanner analyze src/good-example.ts
```

**Expected Output:**
```
Analyzing: src/good-example.ts

✓ No privacy issues detected!

Summary:
  Files Analyzed: 1
  Total Issues: 0
```

### Test Run

```bash
$ npm test
```

**Expected Output:**
```
✓ src/library.test.ts (X tests)
  ✓ Core Library Integration
    ✓ RPCClient tests
    ✓ Label Provider tests
    ✓ Wallet Scanning tests
    ✓ Report Structure tests

Test Files: 1 passed (1)
     Tests: X passed (X)
```

## Troubleshooting

### RPC Rate Limits

If you get rate limit errors when scanning:
```bash
# Use custom RPC (get free endpoint from QuickNode)
export SOLANA_RPC=https://your-quicknode-endpoint.com
npx solana-privacy-scanner scan-wallet ADDRESS
```

### Package Not Found

If CLI command fails:
```bash
# Ensure packages are installed
npm install

# Check installation
npx solana-privacy-scanner --version
```

### Test Failures

If tests fail:
```bash
# Check Solana devnet is accessible
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Run tests with verbose output
npm test -- --reporter=verbose
```

## Next Steps

After validating the toolkit:
1. ✅ Static analyzer detects privacy issues
2. ✅ Test matchers work correctly
3. ✅ CLI commands function properly
4. ✅ Real wallet/transaction scanning works

**Ready to build the Claude Code plugin!**

The plugin will:
- Use the static analyzer to detect issues in code
- Leverage Claude's intelligence for context-aware explanations
- Provide interactive fixes and recommendations
- Integrate seamlessly with the development workflow

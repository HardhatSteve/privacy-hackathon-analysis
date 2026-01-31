---
sidebar_position: 2
---

# Skills

Complete reference for all plugin skills.

## scan-wallet

Analyze on-chain wallet privacy using blockchain data.

```
/scan-wallet <ADDRESS> [options]
```

**Options:**
- `--max-signatures <number>` - Max transactions to analyze (default: 100)
- `--rpc <url>` - Custom RPC endpoint

**Examples:**

```
# Basic scan
/scan-wallet YourWalletAddress

# Quick check (20 transactions)
/scan-wallet YourWallet --max-signatures 20

# Custom RPC
/scan-wallet YourWallet --rpc https://your-rpc.com
```

**Provides:**
- Overall risk assessment (LOW/MEDIUM/HIGH)
- Detailed privacy signals with evidence
- Actionable mitigation recommendations

## scan-code

Static analysis for privacy anti-patterns in source code.

```
/scan-code <path>
```

**Examples:**

```
# Scan file
/scan-code src/transactions.ts

# Scan directory
/scan-code src/**/*.ts
```

**Detects:**
- Fee payer reuse patterns (CRITICAL)
- PII in transaction memos (HIGH)
- Address reuse issues (MEDIUM)
- Signer overlap problems (HIGH)

## explain-risk

Get concise explanations of specific privacy risks.

```
/explain-risk <risk-id>
```

**Available Risk IDs:**

**Critical:**
- `fee-payer-reuse` - External fee payer used across accounts (CRITICAL)
- `fee-payer-never-self` - Account never pays own fees (HIGH)
- `signer-overlap` - Repeated signer combinations (HIGH)
- `memo-pii` - Personal information in memos (CRITICAL)
- `address-reuse` - Lack of address rotation (MEDIUM)

**Behavioral:**
- `known-entity-cex` - CEX interaction (HIGH)
- `counterparty-reuse` - Repeated transaction partners (MEDIUM)
- `timing-patterns` - Predictable timing (MEDIUM)
- `instruction-fingerprint` - Unique program patterns (MEDIUM)
- `token-account-lifecycle` - Token account tracking (MEDIUM)
- `amount-reuse` - Repeated amounts (LOW)
- `balance-traceability` - Traceable fund flows (MEDIUM)

**Example:**

```
/explain-risk fee-payer-reuse
```

**Output:**
- Overview - What the risk is
- Why It Matters - Privacy impact
- How to Fix - Mitigation steps

## suggest-fix

Generate code fixes for detected privacy issues.

```
/suggest-fix <risk-id>
```

**Examples:**

```
/suggest-fix fee-payer-reuse
/suggest-fix memo-pii
```

**Provides:**
- Before/after code examples
- Step-by-step implementation
- Testing recommendations

## privacy-audit

Full codebase privacy audit with comprehensive analysis.

```
/privacy-audit
```

**Performs:**
- Scans all source files for privacy anti-patterns
- Detects all risk types
- Generates summary report with actionable fixes

## Common Workflows

**Learn about a risk:**

```
# 1. Get explanation
/explain-risk fee-payer-reuse

# 2. See how to fix it
/suggest-fix fee-payer-reuse
```

**Analyze wallet privacy:**

```
# 1. Scan wallet
/scan-wallet YOUR_WALLET

# 2. Learn about detected risks
/explain-risk <detected-risk-id>
```

**Code privacy check:**

```
# 1. Scan code
/scan-code src/

# 2. Learn about issues
/explain-risk <issue-id>

# 3. Get fix suggestions
/suggest-fix <issue-id>
```

## Troubleshooting

**Skill not found:**

Verify plugin is installed:

```
/plugins
```

**RPC errors:**

Use custom RPC endpoint:

```
/scan-wallet ADDRESS --rpc https://your-rpc.com
```

Or reduce batch size:

```
/scan-wallet ADDRESS --max-signatures 10
```

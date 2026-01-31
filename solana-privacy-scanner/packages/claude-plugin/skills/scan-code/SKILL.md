---
name: scan-code
description: This skill should be used when the user asks to "analyze code", "scan code", "check for privacy issues", "find privacy risks", or wants static analysis of Solana TypeScript/JavaScript code for privacy anti-patterns.
version: 1.0.0
---

# Scan Code - Solana Privacy Static Analysis

Analyze Solana TypeScript/JavaScript source code for privacy anti-patterns using static analysis.

## Description

This skill performs static code analysis on Solana projects to detect privacy vulnerabilities before they reach the blockchain. It identifies patterns like fee payer reuse, PII in memos, and other privacy risks that could lead to user deanonymization.

## Usage

```
/scan-code <paths...>
```

### Arguments

- `paths` - One or more file paths or glob patterns to analyze

### Options

- `--no-low` - Exclude low severity issues from results
- `--json` - Output raw JSON results

## Examples

### Analyze a single file
```
/scan-code src/transactions.ts
```

### Analyze multiple files
```
/scan-code src/transactions.ts src/wallet.ts
```

### Analyze with glob patterns
```
/scan-code "src/**/*.ts"
/scan-code "src/utils/*.js"
```

### Exclude low severity issues
```
/scan-code src/ --no-low
```

## What It Detects

### Fee Payer Reuse (CRITICAL)
Detects when a fee payer variable is:
- Declared outside a loop
- Reused inside the loop across multiple transactions
- Used multiple times sequentially

**Why it matters:** Fee payer reuse creates strong on-chain links between transactions, enabling wallet clustering and deanonymization.

### PII in Memos (CRITICAL/HIGH/MEDIUM)
Scans transaction memos for:
- Email addresses (CRITICAL)
- Phone numbers (CRITICAL)
- Social Security Numbers (CRITICAL)
- Credit card numbers (CRITICAL)
- URLs with query parameters (HIGH)
- Personal names (HIGH)
- Descriptive content that may contain PII (MEDIUM)

**Why it matters:** Memos are permanently public on-chain. Any PII in memos is permanently exposed.

## Output

The skill provides:

1. **Summary**: Overview of files analyzed and total issues found
2. **Issues List**: Detailed breakdown by file with:
   - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
   - Issue type
   - File location (file:line:column)
   - Description
   - Code snippet (if available)
   - Fix suggestion
3. **Statistics**: Count of issues by severity
4. **Recommendations**: Actionable next steps

## Example Output

```markdown
# Static Analysis Results

Files analyzed: **3**
Total issues: **5**

🔴 **CRITICAL:** 2
🟡 **HIGH:** 1
🔵 **MEDIUM:** 2

## Issues Found

### src/transactions.ts

1. 🔴 **CRITICAL** Fee payer 'sharedFeePayer' declared outside loop but reused inside
   Line 18:8

   Suggestion: Move fee payer generation inside the loop

   Code:
   ```typescript
   const sharedFeePayer = Keypair.generate();
   ```

2. 🔴 **CRITICAL** Email address detected in memo field
   Line 45:12

   Suggestion: Remove personal information from memo fields

   Code:
   ```typescript
   const memo = "Payment from user@example.com";
   ```
```

## Integration

This skill uses the `solana-privacy-scanner analyze` command under the hood, which performs AST (Abstract Syntax Tree) analysis to detect patterns in your code.

The analysis is:
- **Fast**: Analyzes code without executing it
- **Deterministic**: Same code always produces same results
- **Safe**: Never executes or modifies your code
- **Offline**: Works without network access

## Next Steps

After scanning:
- Use `/explain-risk <risk-id>` to learn more about specific issues
- Use `/suggest-fix <file:line>` to get AI-generated fix suggestions
- Use `/scan-wallet <address>` to analyze on-chain privacy after deployment

## Limitations

Static analysis can only detect patterns in source code. It cannot:
- Detect runtime behavior
- Analyze on-chain transactions
- See external dependencies
- Detect issues in compiled code

For on-chain analysis, use `/scan-wallet` after deployment.

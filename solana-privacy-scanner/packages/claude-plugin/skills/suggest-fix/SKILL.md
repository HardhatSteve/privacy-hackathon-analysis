---
name: suggest-fix
description: This skill should be used when the user asks "how do I fix this", "suggest a fix", "give me code to fix", wants code-level solutions for privacy issues, or needs before/after code examples for privacy improvements in Solana applications.
version: 1.0.0
---

# Suggest Fix - Code-Level Privacy Fixes

Generates code-level fixes for detected privacy issues in Solana applications.

## Purpose

When the scanner detects privacy issues, this skill provides:
- Before/after code comparisons
- Multiple fix options when applicable
- Explanation of what changed and why
- Testing recommendations
- Alternative approaches

## Usage

```
/suggest-fix <risk-id>
/suggest-fix fee-payer-reuse
/suggest-fix memo-pii
/suggest-fix <file>:<line>
/suggest-fix src/transactions.ts:42
/suggest-fix --list
```

## Parameters

- `<risk-id>` - The ID of the privacy risk to fix (e.g., `fee-payer-reuse`)
- `<file>:<line>` - Specific file and line number from analyzer output
- `--list` - Show all available fix templates

## Available Fix Templates

### Critical Fixes

**`fee-payer-reuse`** (CRITICAL)
- Move fee payer generation inside loops
- Use unique fee payers per account
- Implement fee payer rotation strategies
- Self-payment refactoring

**`memo-pii`** (CRITICAL)
- Remove PII from memos
- Sanitize memo content with regex
- Replace with UUIDs or hashes
- Off-chain reference system

**`signer-overlap`** (HIGH)
- Use unique signer keys per wallet
- Implement signer rotation
- Separate multi-sig configurations
- Hierarchical deterministic key derivation

**`address-reuse`** (MEDIUM)
- Generate new addresses per transaction
- Implement address rotation
- Use burner wallets
- Compartmentalization patterns

### Behavioral Pattern Fixes

**`timing-patterns`** (MEDIUM/HIGH)
- Add random delays between transactions
- Implement jitter for scheduled operations
- Batch timing randomization
- Timezone obfuscation

**`counterparty-reuse`** (MEDIUM)
- Use intermediary addresses
- Implement address rotation for recipients
- Payment processor integration

**`instruction-fingerprint`** (MEDIUM)
- Use standard program call patterns
- Avoid unique instruction sequences
- Separate development/production addresses

**`token-account-lifecycle`** (MEDIUM)
- Vary rent refund destinations
- Leave accounts open when possible
- Use burner refund addresses

### Generic Privacy Improvements

**`privacy-best-practices`**
- Complete privacy-preserving transaction template
- Multi-hop transfer strategies
- Timing and amount randomization
- Compartmentalization architecture

## Fix Format

Each fix suggestion includes:

1. **Issue Summary** - What the problem is
2. **Risk Level** - Severity and impact
3. **Current Code** - The problematic code pattern
4. **Fixed Code** - The corrected implementation
5. **Diff View** - Side-by-side or unified diff
6. **Explanation** - What changed and why
7. **Alternative Approaches** - Other ways to solve it
8. **Testing Recommendations** - How to verify the fix
9. **Trade-offs** - Performance or complexity impacts
10. **Related Fixes** - Other improvements to consider

## Example Output

### Fix for fee-payer-reuse

```markdown
# Fix Suggestion: Fee Payer Reuse

## Issue Summary
Fee payer variable declared outside loop and reused for multiple accounts,
linking all transactions together.

## Risk Level
🔴 CRITICAL - Definitively links all accounts to single entity

## Current Code (❌ VULNERABLE)
```typescript
const feePayer = Keypair.generate();

for (const recipient of recipients) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount,
    })
  );

  transaction.feePayer = feePayer.publicKey;
  await sendAndConfirmTransaction(connection, transaction, [sender, feePayer]);
}
```

## Fixed Code (✅ PRIVATE)
```typescript
for (const recipient of recipients) {
  // Generate unique fee payer per transaction
  const feePayer = Keypair.generate();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount,
    })
  );

  transaction.feePayer = feePayer.publicKey;
  await sendAndConfirmTransaction(connection, transaction, [sender, feePayer]);
}
```

## What Changed
- Moved `feePayer` generation inside the loop
- Each transaction now uses a unique fee payer
- Recipients can no longer be linked via shared fee payer

## Alternative Approaches
1. **Self-Payment**: Have each account pay its own fees
2. **Fee Payer Pool**: Rotate through a pool of fee payers
3. **Per-User Payers**: One fee payer per user, not per transaction

## Testing
- Verify each transaction uses different fee payer
- Check that fee payers are funded before use
- Monitor transaction success rate
```

## Integration

Designed to work after scanning:

```
1. /scan-code src/**/*.ts
   → Detects fee-payer-reuse at line 42

2. /suggest-fix src/transactions.ts:42
   → Get specific fix for that location

OR

2. /suggest-fix fee-payer-reuse
   → Get general template for this issue type
```

## Fix Categories

### Code-Level Fixes
- Direct code modifications
- Refactoring suggestions
- Library usage improvements

### Architectural Fixes
- Wallet compartmentalization
- Multi-hop strategies
- Privacy-preserving patterns

### Configuration Fixes
- RPC endpoint selection
- Transaction parameter tuning
- Network-level considerations

## Language Support

Currently supports:
- TypeScript
- JavaScript
- Anchor (Solana framework)

Fix templates use TypeScript by default with comments indicating framework-specific variations.

## Customization

Templates can be:
- Adapted to your code style
- Extended with project-specific patterns
- Combined for multiple issues
- Staged for gradual implementation

## Limitations

- Templates are generic - may need adaptation
- Some fixes require architectural changes
- Trade-offs between privacy and performance
- Not all issues can be automatically fixed

## Notes

- Always test fixes in development first
- Some fixes may impact transaction costs
- Consider user experience implications
- Privacy improvements may require coordination with counterparties
- Document privacy decisions in your codebase

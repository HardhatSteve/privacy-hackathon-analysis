---
title: Privacy Levels
description: Understanding SIP's three privacy levels
---

# Privacy Levels

SIP defines three privacy levels that users can select per-intent.

## Overview

| Level | Privacy | Compliance | Use Case |
|-------|---------|------------|----------|
| `TRANSPARENT` | None | Full | Maximum compatibility |
| `SHIELDED` | Full | None | Maximum privacy |
| `COMPLIANT` | Full + Disclosure | Selective | Institutional/regulatory |

## TRANSPARENT

Standard on-chain transaction with no privacy enhancements.

```typescript
const intent = await sip
  .intent()
  .input('near', 'NEAR', 100n)
  .output('ethereum', 'ETH')
  .privacy(PrivacyLevel.TRANSPARENT)
  .build()
```

### Visibility

| Information | Visible To |
|-------------|-----------|
| Sender address | Everyone |
| Input amount | Everyone |
| Output amount | Everyone |
| Recipient address | Everyone |

### Required Proofs

None - standard transaction signing only.

### Use Cases

- DEX integrations requiring transparency
- Public treasury operations
- Airdrops and distributions
- Testing and debugging

## SHIELDED

Full privacy with cryptographic hiding of sender, amounts, and recipient.

```typescript
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', 1_000_000_000_000_000_000n)
  .output('zcash', 'ZEC')
  .privacy(PrivacyLevel.SHIELDED)
  .build()
```

### Visibility

| Information | Visible To | Hidden Via |
|-------------|-----------|------------|
| Sender address | Nobody | Sender commitment |
| Input amount | Nobody | Pedersen commitment |
| Output amount | Solver only (range) | Commitment |
| Recipient address | Nobody | Stealth address |
| Min output required | Everyone | Plaintext (for quoting) |

### Required Proofs

| Proof | Purpose |
|-------|---------|
| Funding Proof | Prove balance ≥ input |
| Validity Proof | Prove authorization |
| Fulfillment Proof | Prove correct delivery |

### What Solvers See

```
Solver view:
├── "Someone wants to swap"
├── "Input: ??? amount of SOL (committed)"
├── "Output: at least 100 ZEC"
├── "Recipient: stealth address 0x..."
└── "Proof that sender has sufficient funds: ✓"
```

### Guarantees

| Property | Guaranteed? | Mechanism |
|----------|-------------|-----------|
| Sender privacy | Yes | Pedersen commitment |
| Amount privacy | Yes | Amount commitments |
| Recipient privacy | Yes | Stealth address |
| Unlinkability | Yes | Fresh blinding + stealth per tx |

## COMPLIANT

Full privacy with selective disclosure for authorized auditors.

```typescript
const viewingKey = sip.generateViewingKey('/audit')

const intent = await sip
  .intent()
  .input('solana', 'SOL', 5_000_000_000n)
  .output('near', 'NEAR')
  .privacy(PrivacyLevel.COMPLIANT)
  .viewingKey(viewingKey)
  .build()
```

### Visibility

| Information | Public | Auditor (with key) |
|-------------|--------|-------------------|
| Sender address | Hidden | Visible |
| Input amount | Hidden | Visible |
| Output amount | Hidden | Visible |
| Recipient address | Hidden | Visible |
| Audit trail | Hidden | Full history |

### Auditor Workflow

1. User creates COMPLIANT intent
2. User designates auditor (provides viewing key hash)
3. Transaction data encrypted with auditor's key
4. Encrypted blob stored with intent
5. Auditor decrypts when needed
6. Auditor generates ViewingProof for reports

### Use Cases

- Institutional trading
- Tax compliance
- Regulatory requirements
- DAO treasury operations

## Comparison Matrix

### Privacy

| Aspect | TRANSPARENT | SHIELDED | COMPLIANT |
|--------|-------------|----------|-----------|
| Sender hidden | No | Yes | Yes (public) / No (auditor) |
| Amount hidden | No | Yes | Yes (public) / No (auditor) |
| Recipient hidden | No | Yes | Yes (public) / No (auditor) |
| Audit possible | Trivial | No | Yes (with key) |

### Performance

| Aspect | TRANSPARENT | SHIELDED | COMPLIANT |
|--------|-------------|----------|-----------|
| Proof generation | None | ~2-5s | ~2-5s + encryption |
| Verification | Fast | ~10ms | ~10ms |
| Data size | Small | Medium | Medium + encrypted blob |

### Use Case Fit

| Use Case | Recommended Level |
|----------|-------------------|
| Public DEX swap | TRANSPARENT |
| Personal privacy | SHIELDED |
| Institutional trading | COMPLIANT |
| Tax reporting needed | COMPLIANT |
| Anonymous donation | SHIELDED |
| Regulated exchange | COMPLIANT |

## Transition Rules

```
TRANSPARENT → SHIELDED ✓ (add proofs and commitments)
TRANSPARENT → COMPLIANT ✓ (add proofs + viewing key)
SHIELDED → COMPLIANT ✓ (add viewing key encryption)
SHIELDED → TRANSPARENT ✗ (cannot reveal hidden data)
COMPLIANT → SHIELDED ✗ (auditor key already shared)
COMPLIANT → TRANSPARENT ✗ (cannot reveal hidden data)
```

Once data is committed/hidden, it cannot be revealed without user cooperation.

## SDK Usage

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'testnet' })

// Transparent
const transparent = await sip.createIntent({
  privacyLevel: PrivacyLevel.TRANSPARENT,
  sender: '0x...',
  recipient: '0x...',
  inputAmount: 100n,
})

// Shielded - SDK generates commitments, stealth, proofs
const shielded = await sip.createIntent({
  privacyLevel: PrivacyLevel.SHIELDED,
  inputAmount: 100n,
})

// Compliant - SDK adds encrypted viewing data
const compliant = await sip.createIntent({
  privacyLevel: PrivacyLevel.COMPLIANT,
  inputAmount: 100n,
  auditorKeyHash: '0x...',
})
```

## Security Considerations

### Privacy Level Selection

| Consideration | Guidance |
|---------------|----------|
| Default level | SHIELDED (privacy by default) |
| Downgrade requests | Reject - cannot downgrade |
| Level in metadata | Included in intent_hash |

### Commitment Binding

All commitments are bound to privacy level:

```
commitment_hash = Poseidon(
  commitment,
  privacy_level,
  intent_id
)
```

This prevents commitment reuse across different privacy contexts.

### Auditor Trust

For COMPLIANT mode:
- User chooses auditor (not protocol)
- Multiple auditors supported
- Revocation possible but doesn't hide past disclosures

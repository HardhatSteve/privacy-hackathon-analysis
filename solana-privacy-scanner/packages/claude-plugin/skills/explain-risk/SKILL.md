---
name: explain-risk
description: Brief explanation of a specific privacy risk
version: 1.0.0
---

# Explain Risk

Provides a concise explanation of what a privacy risk is and why it matters.

## Usage

```
/explain-risk <risk-id>
```

## Output Format

- **Overview**: What the risk is (1-2 sentences)
- **Why It Matters**: Impact on privacy (2-3 sentences)
- **How to Fix**: High-level mitigation steps (bullets, no code)

For code examples, use `/suggest-fix <risk-id>` instead.

## Parameters

- `<risk-id>` - The privacy risk ID (e.g., fee-payer-reuse, memo-pii)

## Available Risk IDs

### Critical

**`fee-payer-reuse`** (CRITICAL)
- External fee payer used across multiple accounts
- Most powerful deanonymization vector on Solana

**`fee-payer-never-self`** (HIGH)
- Account never pays its own fees
- Indicates external funding relationship

**`signer-overlap`** (HIGH)
- Repeated signer combinations across transactions
- Links multiple accounts to same entity

**`memo-pii`** (CRITICAL/HIGH/MEDIUM)
- Personal information in transaction memos
- Includes emails, phones, SSNs, names, addresses

**`address-reuse`** (MEDIUM/LOW)
- Lack of address rotation
- Single address used repeatedly

### Behavioral Analysis

**`known-entity-cex`** (HIGH)
- Interaction with centralized exchange
- KYC data linkage risk

**`known-entity-bridge`** (MEDIUM)
- Cross-chain bridge usage
- Multi-chain correlation risk

**`known-entity-protocol`** (LOW)
- Interaction with DeFi protocols
- Transaction pattern exposure

**`counterparty-reuse`** (MEDIUM/LOW)
- Repeated transaction partners
- Relationship graph exposure

**`timing-burst`** (HIGH)
- Concentrated transaction activity
- Automated bot fingerprint

**`timing-regular`** (MEDIUM)
- Regular transaction intervals
- Scheduled payment pattern

**`timing-timezone`** (LOW)
- Transactions clustered by time-of-day
- Geographic location hint

**`instruction-fingerprint`** (MEDIUM)
- Unique program call patterns
- Developer/app identification

**`token-account-lifecycle`** (MEDIUM)
- Token account creation/closure patterns
- Rent refund linking

**`amount-reuse`** (LOW)
- Repeated transaction amounts
- Less impactful on Solana due to account model

**`balance-traceability`** (MEDIUM)
- Traceable fund flows
- Source/destination linking

## Example Usage

```
/explain-risk fee-payer-reuse
```

## Notes

- Risk IDs match the `id` field in `PrivacySignal` objects
- Use this after scanning to understand detected issues

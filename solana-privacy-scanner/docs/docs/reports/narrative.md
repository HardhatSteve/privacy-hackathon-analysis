---
sidebar_position: 5
---

# Adversary Narrative

The **Adversary Narrative** feature transforms privacy signals into a human-readable story that explains what an observer could learn from analyzing your wallet. Instead of just listing risks, it answers the question: *"If someone was watching my wallet, what could they actually deduce about me?"*

## Overview

Traditional privacy reports list risks like "Fee Payer Reuse: HIGH" - but what does that *mean* for your privacy? The narrative engine translates technical signals into concrete adversary knowledge:

> "I have identified that this wallet NEVER pays its own transaction fees. All 47 transactions were funded by 1 other wallet. This tells me definitively that someone else controls or funds this account - I can identify the controller by following the fee payments."

This is more visceral than a list of signals - it tells you *what someone actually learns*.

## Categories

The narrative organizes findings into four categories, presented in priority order:

### 1. Identity Linkage
Direct paths to real-world identity:
- Exchange interactions (KYC linkage)
- .sol domain registration
- NFT creator metadata
- Bridge usage (cross-chain tracking)

### 2. Wallet Connections
Relationships between addresses:
- Fee payer relationships
- Signer overlap patterns
- ATA (Associated Token Account) linkage
- Counterparty reuse

### 3. Behavioral Fingerprints
Patterns that distinguish you from others:
- Transaction timing (timezone, schedule)
- Priority fee consistency
- Program usage profiles
- Staking delegation patterns

### 4. Information Exposure
Metadata and content leaks:
- Memo content (PII, URLs)
- Token account lifecycle traces
- Rent refund clustering

## Identifiability Levels

The narrative concludes with an **Identifiability Level** assessment:

| Level | Meaning |
|-------|---------|
| **ANONYMOUS** | Minimal distinguishing characteristics; wallet blends in with normal activity |
| **PSEUDONYMOUS** | Behavioral patterns exist that distinguish this wallet, but no direct identity link |
| **IDENTIFIABLE** | Strong linkage to identity through exchanges, domains, or exposed personal information |
| **FULLY-IDENTIFIED** | Direct pathways to real-world identity exist (e.g., PII + exchange interaction) |

## Using in Code

### Basic Usage

```typescript
import { generateNarrative, generateNarrativeText } from 'solana-privacy-scanner-core';

// Generate the privacy report first
const report = generateReport(context);

// Get structured narrative object
const narrative = generateNarrative(report);
console.log(narrative.identifiabilityLevel); // 'pseudonymous'
console.log(narrative.paragraphs); // Category-grouped findings

// Or get formatted text output
const text = generateNarrativeText(report);
console.log(text);
```

### Options

```typescript
const narrative = generateNarrative(report, {
  includeLowSeverity: false,      // Skip LOW severity signals (default: true)
  includeDetails: true,           // Include evidence details (default: true)
  maxStatementsPerCategory: 5,    // Limit findings per category (default: 5)
});
```

### Just Check Identifiability

```typescript
import { determineIdentifiability } from 'solana-privacy-scanner-core';

const level = determineIdentifiability(report);
// Returns: 'anonymous' | 'pseudonymous' | 'identifiable' | 'fully-identified'
```

## Narrative Structure

The `AdversaryNarrative` object contains:

```typescript
interface AdversaryNarrative {
  introduction: string;           // Opening summary based on risk level
  paragraphs: NarrativeParagraph[];  // Category-grouped findings
  conclusion: string;             // Final assessment
  identifiabilityLevel: IdentifiabilityLevel;
  signalCount: number;            // Number of signals analyzed
  timestamp: number;              // When generated
}

interface NarrativeParagraph {
  category: 'identity' | 'connections' | 'behavior' | 'exposure';
  title: string;                  // Human-readable category name
  opening: string;                // Section intro
  statements: AdversaryStatement[];
  closing: string;                // Section summary
}

interface AdversaryStatement {
  signalId: string;               // Original signal ID
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  statement: string;              // Adversary knowledge statement
  details: string[];              // Supporting evidence
  confidence: number;
}
```

## Example Output

```
=================================================================
  WHAT DOES THE OBSERVER KNOW?
  An Adversary's Perspective
=================================================================

Based on my analysis of 47 transactions, I can build a detailed profile
of this wallet's owner. There are 3 critical privacy issues that could
lead to identification.

-----------------------------------------------------------------
## IDENTITY LINKAGE
-----------------------------------------------------------------

Starting with the most critical findings - I can potentially identify
who owns this wallet.

[!] I can see that this wallet has directly interacted with 2 centralized
exchange(s) including Binance, Coinbase. Since exchanges require KYC
verification, I can potentially link this wallet to a real-world identity.

-----------------------------------------------------------------
## WALLET CONNECTIONS
-----------------------------------------------------------------

I can map out a network of connected wallets.

[!] This wallet NEVER pays its own fees. All 47 transactions were funded
by 1 other wallet. I can identify the controller by following fee payments.

=================================================================
## CONCLUSION
=================================================================

This wallet is identifiable through 3 high-severity privacy issues.

Identifiability Level: IDENTIFIABLE
```

## Design Philosophy

The narrative engine is:

- **Deterministic**: Same input always produces identical output
- **Template-based**: No LLM required - works offline, fast, and predictable
- **Adversary-perspective**: Written from the viewpoint of someone analyzing your wallet
- **Actionable**: Each finding explains both the risk and its implications

## Web UI

On the [homepage scanner](/), the narrative appears as a collapsible "What Does the Observer Know?" section after scanning a wallet. Click to expand and see the full adversary perspective analysis.

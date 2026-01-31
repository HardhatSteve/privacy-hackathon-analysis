# Veil SDK - Submission

## The Problem
Privacy on Solana is gated by complexity. Developers must navigate custom UTXO models, opaque error states, and protocol-specific SDKs. This fragmentation prevents privacy from being a default feature in most dApps.

## The Solution
Veil provides a unified interface for privacy. By separating the privacy *intent* from the *implementation*, we allow developers to integrate anonymity as easily as they integrate a standard token transfer.

---

## Technical Highlights

- **Adapter-Based Architecture**: Core logic is decoupled from specific protocols. Switching from a mixer to a ZK-rollup is a configuration change, not a refactor.
- **Pre-flight Inspection**: A unique `inspect` API that scores transaction privacy and warns about data leakage (e.g., unique amounts or public recipients) before the user signs.
- **Wallet Agnostic**: Works with any standard Solana wallet adapter.

## Example Flow

```typescript
import { createVeil, PrivacyLevel } from '@veil-labs/veil';

const veil = createVeil({ wallet });

const tx = {
  to: '...',
  amount: 50000000n,
  privacyLevel: PrivacyLevel.Private
};

// Transparency: Know what you leak before you send
const report = await veil.inspect(tx);
if (report.privacyScore < 80) {
  console.warn("Low privacy score detected.");
}

const { txId } = await veil.send(tx);
```

## Judging Criteria

- **Complexity**: Managed via a clean monorepo with strict boundary enforcement between core logic and protocol implementations.
- **UX**: Focuses on the Developer Experience (DX). Standardizing the "Privacy Transaction" makes it accessible to the average web3 developer.
- **Impact**: Provides a path for Solana to have a "Privacy Standard" that any protocol can plug into.
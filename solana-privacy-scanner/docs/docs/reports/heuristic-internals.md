# How Each Heuristic Works

Brief look at the core detection logic for each of the 13 heuristics. All heuristics are pure functions that take a `ScanContext` and return `PrivacySignal[]`.

---

### 1. Fee Payer Reuse

Checks who pays the fee for each transaction. Flags when someone other than the wallet owner pays, or when fees are never self-paid.

```typescript
// Build set of all fee payers from transaction data
const feePayers = context.feePayers;
const targetIsFeePayer = feePayers.has(target);

// Case: Target never pays own fees → HIGH
if (!targetIsFeePayer && feePayers.size > 0) { ... }

// Case: External fee payers alongside target → MEDIUM/HIGH
if (feePayers.size > 1 && targetIsFeePayer) { ... }
```

**Source:** `packages/core/src/heuristics/fee-payer-reuse.ts`

---

### 2. Signer Overlap

Builds a frequency map of signers across all transactions. Flags signers that appear in many transactions, repeated multi-sig sets, and authority hubs.

```typescript
// Count how often each signer appears
const signerFrequency = new Map<string, number>();
for (const tx of context.transactions) {
  for (const signer of tx.signers) {
    signerFrequency.set(signer, (signerFrequency.get(signer) || 0) + 1);
  }
}

// Flag signers appearing in 30%+ of transactions (excluding target)
const frequentSigners = Array.from(signerFrequency.entries())
  .filter(([signer]) => signer !== target)
  .filter(([_, count]) => count >= Math.ceil(context.transactionCount * 0.3));
```

**Source:** `packages/core/src/heuristics/signer-overlap.ts`

---

### 3. Memo Exposure

Scans memo instructions for PII patterns (emails, phone numbers, names) using regex matching.

```typescript
// Find all memo program instructions
const memoInstructions = context.instructions
  .filter(inst => MEMO_PROGRAMS.includes(inst.programId));

// Check content against PII patterns
const PII_PATTERNS = [
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    type: 'email', severity: 'HIGH' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    type: 'phone', severity: 'HIGH' },
  // ... more patterns
];
```

**Source:** `packages/core/src/heuristics/memo-exposure.ts`

---

### 4. Known Entity Interaction

Cross-references transfer counterparties with a database of labeled addresses (exchanges, bridges, protocols).

```typescript
// Group interactions by entity type
for (const [address, label] of context.labels.entries()) {
  let interactionCount = 0;
  for (const transfer of context.transfers) {
    if (transfer.from === address || transfer.to === address) {
      interactionCount++;
    }
  }
  // Group by type: 'exchange' → HIGH, 'bridge' → MEDIUM, etc.
}
```

**Source:** `packages/core/src/heuristics/known-entity.ts`

---

### 5. Identity Metadata Exposure

Checks if the wallet has interacted with Metaplex (NFT metadata) or Bonfida Name Service (.sol domains).

```typescript
const METAPLEX = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const BONFIDA  = 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX';

// Count interactions with identity-linking programs
const metaplexInstructions = context.instructions
  .filter(inst => inst.programId === METAPLEX);
const bonfidaInstructions = context.instructions
  .filter(inst => inst.programId === BONFIDA);

// Bonfida → HIGH (direct name linkage)
// Metaplex → MEDIUM (NFT metadata)
```

**Source:** `packages/core/src/heuristics/identity-metadata.ts`

---

### 6. ATA Linkage

Cross-references token account creation events with transaction fee payers to find wallets that create accounts for others.

```typescript
// For each create event, find who paid the fee
for (const event of createEvents) {
  const tx = context.transactions.find(t => t.signature === event.signature);
  if (tx) {
    const feePayer = tx.feePayer;
    const owner = event.owner;
    // If feePayer != owner → someone else set up this account
    if (feePayer !== owner) {
      creatorOwnerMap.get(feePayer)!.add(owner);
    }
  }
}
// Flag fee payers who created accounts for 2+ different owners → HIGH
```

**Source:** `packages/core/src/heuristics/ata-linkage.ts`

---

### 7. Address Reuse

Categorizes transaction activity into types (DeFi, NFT, Gaming, DAO, Exchange, P2P) and flags wallets that span many categories.

```typescript
// Categorize by checking program labels against known categories
const DEFI_PROGRAMS = new Set(['JUP', 'Raydium', 'Orca', ...]);
const NFT_PROGRAMS = new Set(['Magic Eden', 'Tensor', ...]);

for (const inst of context.instructions) {
  const programName = context.labels.get(inst.programId)?.name || '';
  if (DEFI_PROGRAMS.has(programName)) activityTypes.add('DeFi');
  if (NFT_PROGRAMS.has(programName)) activityTypes.add('NFT');
  // ...
}

// 4+ activity types → HIGH, 3 → MEDIUM
```

**Source:** `packages/core/src/heuristics/address-reuse.ts`

---

### 8. Counterparty & PDA Reuse

Counts interactions per counterparty, program, and PDA. Flags concentrated patterns.

```typescript
// Track counterparty frequency
for (const transfer of context.transfers) {
  const counterparty = transfer.from === target ? transfer.to : transfer.from;
  interactionCounts.set(counterparty,
    (interactionCounts.get(counterparty) || 0) + 1);
}

// Flag counterparties with 3+ interactions
// Also tracks PDA reuse and counterparty-program combos
```

**Source:** `packages/core/src/heuristics/counterparty-reuse.ts`

---

### 9. Instruction Fingerprinting

Builds a fingerprint from the sequence of program IDs in each transaction. Flags repeated sequences.

```typescript
// Create fingerprint per transaction
for (const tx of context.transactions) {
  const txInstructions = context.instructions
    .filter(inst => inst.signature === tx.signature)
    .map(inst => inst.programId);
  const sequence = txInstructions.join('->');
  sequenceFingerprints.set(sequence,
    (sequenceFingerprints.get(sequence) || 0) + 1);
}

// Flag sequences appearing in 20%+ of transactions
```

**Source:** `packages/core/src/heuristics/instruction-fingerprinting.ts`

---

### 10. Token Account Lifecycle

Tracks create/close events for token accounts. Flags rent refund patterns that link temporary accounts back to owners.

```typescript
// Find create and close events
const createEvents = context.tokenAccountEvents.filter(e => e.type === 'create');
const closeEvents = context.tokenAccountEvents.filter(e => e.type === 'close');

// Track where rent refunds go
for (const event of closeEvents) {
  if (event.rentRefund) {
    refundDestinations.set(event.owner,
      (refundDestinations.get(event.owner) || 0) + event.rentRefund);
  }
}
// Multiple refunds to same address → MEDIUM
```

**Source:** `packages/core/src/heuristics/token-account-lifecycle.ts`

---

### 11. Priority Fee Fingerprinting

Groups transactions by priority fee amount. Flags when the same fee appears in >50% of transactions.

```typescript
// Count how often each priority fee appears
const feeCounts = new Map<number, number>();
for (const tx of context.transactions) {
  if (tx.priorityFee !== undefined) {
    feeCounts.set(tx.priorityFee,
      (feeCounts.get(tx.priorityFee) || 0) + 1);
  }
}

// Flag if any single fee value appears in >50% of txs (min 3)
const [topFee, topCount] = [...feeCounts.entries()]
  .sort((a, b) => b[1] - a[1])[0];
if (topCount >= txCount * 0.5 && topCount >= 3) { ... }
```

**Source:** `packages/core/src/heuristics/priority-fee-fingerprinting.ts`

---

### 12. Staking Delegation Patterns

Extracts vote account (validator) from stake instructions and flags concentrated delegation.

```typescript
// Find stake instructions and extract validator
const stakeInstructions = context.instructions
  .filter(inst => inst.category === 'stake');

for (const inst of stakeInstructions) {
  const voteAccount = inst.data?.voteAccount || inst.accounts?.[1];
  if (voteAccount) {
    validatorCounts.set(voteAccount,
      (validatorCounts.get(voteAccount) || 0) + 1);
  }
}

// Flag if 1-2 validators receive all delegations → MEDIUM
```

**Source:** `packages/core/src/heuristics/staking-delegation.ts`

---

### 13. Timing Patterns

Calculates transaction rate, inter-transaction gaps, and hour-of-day distribution.

```typescript
// Burst detection: high tx rate in short time
const txRate = context.transactionCount / timeSpanHours;
if (txRate > 10) { /* HIGH */ }

// Regular interval detection: low variance in gaps
const gaps = timestamps.map((t, i) => t - timestamps[i - 1]);
const coefficientOfVariation = stdDev / avgGap;
if (coefficientOfVariation < 0.3) { /* regular pattern */ }

// Timezone detection: hour-of-day clustering
const hours = timestamps.map(ts => new Date(ts * 1000).getUTCHours());
```

**Source:** `packages/core/src/heuristics/timing-patterns.ts`

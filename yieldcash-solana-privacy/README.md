# YieldCash: DeFi-Composable Privacy Pools on Solana

**Privacy pools are dead-end vaults. Your funds sit idle while the rest of DeFi earns yield. YieldCash fixes this.**

---

## TL;DR

YieldCash is the first **yield-bearing privacy pool** on Solana — adding **DeFi composability to the UTXO privacy model**. Same Zcash/Tornado-style privacy (Merkle trees, nullifiers, anonymity sets), but your hidden funds earn staking yield via Marinade.

**Core Innovation:** UTXO privacy + DeFi yield + MEV-protected batching + selective compliance.

---

## The Problem: Privacy OR Yield — Pick One

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     THE PRIVACY-YIELD TRADEOFF                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   OPTION A: Privacy Pools (Tornado, Privacy Cash, ShadowWire)                   │
│   ────────────────────────────────────────────────────────────                   │
│   ✓ Breaks link between sender and recipient                                    │
│   ✓ UTXO mixing provides anonymity set                                          │
│   ✗ Your funds sit idle — 0% yield                                              │
│   ✗ SOL staking yields 7-8% APY... you're missing out                           │
│                                                                                  │
│   OPTION B: Public DeFi (Stake to Marinade directly)                            │
│   ────────────────────────────────────────────────────                           │
│   ✓ Earn 7-8% staking yield                                                     │
│   ✗ Your position is a public billboard                                         │
│   ✗ MEV bots sandwich your large unstakes ($370M-$500M extracted on Solana)     │
│   ✗ Surveillance platforms track your every move (350M+ wallets labeled)        │
│                                                                                  │
│   THE CHOICE: Privacy OR Yield — you can't have both                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         YIELDCASH SOLUTION                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ✓ UTXO Privacy (same as Zcash/Tornado)                                        │
│   ✓ Yield-bearing (pool stakes to Marinade)                                     │
│   ✓ MEV protection (Arcium batches encrypted intents)                           │
│   ✓ Compliance-ready (prove facts without revealing balances)                   │
│                                                                                  │
│   Privacy AND Yield — no tradeoff required                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## How It Works: Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         YIELDCASH ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYER 1: UTXO PRIVACY (Native Shielded Pool)                                   │
│  ─────────────────────────────────────────────                                   │
│  • Same privacy model as Zcash/Tornado Cash                                     │
│  • Merkle tree of note commitments                                              │
│  • Nullifiers prevent double-spend                                              │
│  • Transfers break linkability chain                                            │
│  • Join-Split circuit handles all operations                                    │
│                                                                                  │
│  LAYER 2: MEV PROTECTION (Arcium MPC)                                           │
│  ─────────────────────────────────────                                           │
│  • Private intent batching (intents hidden until settlement)                    │
│  • Internal matching (deposits offset withdrawals)                              │
│  • MEV bots can't front-run individual large withdrawals                        │
│                                                                                  │
│  LAYER 3: SELECTIVE COMPLIANCE (Noir ZK Proofs)                                 │
│  ─────────────────────────────────────────────                                   │
│  • Prove "balance ≥ X" without revealing balance                                │
│  • Prove "held ≥ N days" without revealing deposit date                         │
│  • Prove "yield earned" for tax reporting                                       │
│  • YOU control who learns what, when                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The UTXO Privacy Model

YieldCash uses the same privacy model that powers Zcash and Tornado Cash:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      UTXO PRIVACY: HOW IT WORKS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. DEPOSIT: Create a "note" (like a private check)                             │
│     ────────────────────────────────────────────────                             │
│     Alice deposits 10 SOL → Note A created (commitment added to Merkle tree)    │
│     Bob deposits 10 SOL   → Note B created                                      │
│     Carol deposits 10 SOL → Note C created                                      │
│                                                                                  │
│     Observers see: "Someone deposited 10 SOL" (3 times)                         │
│     Observers DON'T know: Which commitment belongs to whom                      │
│                                                                                  │
│  2. TRANSFER: Spend old note, create new note                                   │
│     ────────────────────────────────────────────                                 │
│     Alice transfers to Dave → Note A nullified, Note D created                  │
│                                                                                  │
│     Observers see: "A nullifier was revealed, a new commitment was added"       │
│     Observers DON'T know: Which note was spent (Merkle proof hides this)        │
│                                                                                  │
│  3. WITHDRAW: Prove ownership, get SOL                                          │
│     ────────────────────────────────────────                                     │
│     Dave withdraws → Reveals nullifier, proves ownership, receives SOL          │
│                                                                                  │
│     Observers see: "10 SOL withdrawn to address X"                              │
│     Observers DON'T know: Which deposit funded this (linkability broken)        │
│                                                                                  │
│  THE PRIVACY: After transfers, observers CANNOT trace which original            │
│  deposit a note came from. The anonymity set is everyone who deposited.         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Yield Model: Shares and Index

Unlike Tornado Cash where funds sit idle, YieldCash earns yield:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         HOW YIELD WORKS                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DEPOSIT: SOL → Shares (at current index)                                       │
│  ─────────────────────────────────────────                                       │
│  Day 1:  Alice deposits 10 SOL, index = 1.0 → receives 10 shares                │
│  Day 1:  Bob deposits 10 SOL, index = 1.0   → receives 10 shares                │
│                                                                                  │
│  YIELD ACCRUES: Index increases (pool stakes to Marinade)                       │
│  ───────────────────────────────────────────────────────                         │
│  Day 30: Pool earns 2 SOL yield                                                 │
│          index = 22 SOL / 20 shares = 1.1                                       │
│                                                                                  │
│  LATE DEPOSIT: Fewer shares (fair to early depositors)                          │
│  ──────────────────────────────────────────────────────                          │
│  Day 31: Carol deposits 10 SOL, index = 1.1 → receives 9.09 shares              │
│                                                                                  │
│  WITHDRAW: Shares × Index = SOL (includes yield)                                │
│  ────────────────────────────────────────────────                                │
│  Day 60: Alice withdraws 10 shares × 1.2 index = 12 SOL (2 SOL profit!)         │
│                                                                                  │
│  KEY INSIGHT: Notes store SHARES, not SOL amounts.                              │
│  The index grows as yield accrues. Notes never need updating.                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Join-Split Circuit: One Circuit for Everything

The system uses a unified **Join-Split circuit** with 2 inputs and 2 outputs:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     JOIN-SPLIT: 2-IN, 2-OUT UTXO PATTERN                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  OPERATION      │ INPUT 0   │ INPUT 1   │ OUTPUT 0    │ OUTPUT 1   │ PUBLIC     │
│  ───────────────┼───────────┼───────────┼─────────────┼────────────┼────────────│
│  Deposit        │ Dummy     │ Dummy     │ New Note    │ Dummy      │ +10 SOL    │
│  Withdraw       │ Note      │ Dummy     │ Change Note │ Dummy      │ -10 SOL    │
│  Transfer       │ Note      │ Dummy     │ New Note    │ Dummy      │ 0          │
│  Merge          │ Note A    │ Note B    │ Combined    │ Dummy      │ 0          │
│  Split          │ Note      │ Dummy     │ Note A      │ Note B     │ 0          │
│                                                                                  │
│  WHY THIS PATTERN:                                                              │
│  • Single circuit handles ALL operations (simpler deployment)                   │
│  • Atomic merging and splitting of notes                                        │
│  • Standard pattern proven in Zcash/Tornado                                     │
│  • Dummy notes are zeros (commitment = hash(0,0,0,0,0))                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## MEV Protection: Arcium Intent Batching

Large withdrawals are MEV targets. Arcium hides individual intents:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARCIUM PRIVATE INTENT BATCHING                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT ARCIUM (Public Mempool)                                                │
│  ───────────────────────────────                                                 │
│  Alice: "Withdraw 1000 SOL"  ──→  MEV bot sees large withdrawal                 │
│  MEV bot: Front-runs with massive Marinade unstake                              │
│  Alice: Gets sandwiched, loses $50-500 to slippage                              │
│                                                                                  │
│  WITH ARCIUM (Private Batching)                                                 │
│  ──────────────────────────────                                                  │
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │   USERS      │  Alice: Enc(withdraw 1000 SOL)                                │
│  │   SUBMIT     │  Bob:   Enc(deposit 800 SOL)                                  │
│  │   ENCRYPTED  │  Carol: Enc(withdraw 200 SOL)                                 │
│  │   INTENTS    │  Dave:  Enc(deposit 500 SOL)                                  │
│  └──────┬───────┘                                                               │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                    ARCIUM MXE (Trusted Execution)                     │       │
│  │  • All intents encrypted — nobody sees individual amounts            │       │
│  │  • Compute internal matching: deposits fund withdrawals              │       │
│  │  • Net calculation: (800+500) - (1000+200) = +100 SOL net deposit    │       │
│  └──────┬───────────────────────────────────────────────────────────────┘       │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                               │
│  │  SETTLEMENT  │  Single on-chain action: "Stake 100 SOL to Marinade"          │
│  │  (PUBLIC)    │  Individual intents hidden — MEV bots see nothing             │
│  └──────────────┘                                                               │
│                                                                                  │
│  BENEFITS:                                                                       │
│  • MEV bots can't target Alice's 1000 SOL withdrawal                            │
│  • Gas optimization: 1 Marinade tx instead of 4                                 │
│  • Internal matching: Bob's deposit directly funds Alice's withdrawal           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Transaction Modes: Direct vs Batched

Users can choose between two transaction modes:

| Mode | Speed | MEV Protection | Use Case |
|------|-------|----------------|----------|
| **Direct** | Immediate (~400ms) | None | Small amounts, time-sensitive |
| **Batched** | 30-60 seconds | Full (Arcium) | Large withdrawals, MEV-sensitive |

**Batching is opt-in.** Users check a toggle in the UI to enable MEV protection. Batched intents are queued and settled together — internal matching means deposits can directly fund withdrawals without touching Marinade.

---

## Fixed Denominations

Both deposits AND withdrawals use fixed amounts to preserve anonymity:

| Amount | Use Case |
|--------|----------|
| **0.05 SOL** | Micro transactions, testing |
| **0.1 SOL** | Small deposits |
| **0.5 SOL** | Medium deposits |
| **1 SOL** | Standard deposits |
| **5 SOL** | Large deposits |

**Why fixed denominations?** Without them, withdrawal amounts leak information. A withdrawal of "1.073 SOL" correlates with a deposit of "1 SOL" that earned 7.3% yield. With fixed denominations, all 1 SOL withdrawals look identical.

**Yield stays in the pool** as fractional shares. Users withdraw in whole denominations; remaining balance stays as a "change note."

---

## User Flows

### Deposit Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEPOSIT FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  USER                          NOIR CIRCUIT                   SOLANA PROGRAM    │
│  ────                          ────────────                   ──────────────    │
│                                                                                  │
│  1. Choose amount                                                               │
│     (0.05, 0.1, 0.5, 1, or 5 SOL)                                               │
│         │                                                                        │
│         ▼                                                                        │
│  2. Generate randomness                                                         │
│     Create note locally:                                                        │
│     { shares, owner, randomness }                                               │
│         │                                                                        │
│         ▼                                                                        │
│  3. Compute commitment ─────────► commitment = hash(shares, owner, randomness)  │
│         │                                                                        │
│         ▼                                                                        │
│  4. Generate proof ─────────────► Join-Split circuit proves:                    │
│         │                         • Commitment is well-formed                   │
│         │                         • Shares = deposit × SCALE / index            │
│         │                         • Value conservation holds                    │
│         │                                                                        │
│         ▼                                                                        │
│  5. Submit tx ─────────────────────────────────────────────► Verify proof       │
│     (proof + SOL)                                             Accept SOL        │
│     OR opt-in to Arcium batching for MEV protection          Add commitment    │
│                                                               to Merkle tree    │
│                                                                                  │
│  RESULT: Note stored locally. Commitment on-chain. SOL in pool earning yield.   │
│          With batching: intent queued until batch settles.                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Withdrawal Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             WITHDRAWAL FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  USER                          NOIR CIRCUIT                   SOLANA PROGRAM    │
│  ────                          ────────────                   ──────────────    │
│                                                                                  │
│  1. Select note to spend                                                        │
│     (from local storage)                                                        │
│         │                                                                        │
│         ▼                                                                        │
│  2. Compute nullifier                                                           │
│     nullifier = hash(commitment, master_secret)                                 │
│         │                                                                        │
│         ▼                                                                        │
│  3. Get Merkle proof ───────────► Prove note exists in tree                     │
│         │                         (without revealing which one)                 │
│         │                                                                        │
│         ▼                                                                        │
│  4. Generate proof ─────────────► Join-Split circuit proves:                    │
│         │                         • Note exists (Merkle proof)                  │
│         │                         • User owns it (knows secret)                 │
│         │                         • Nullifier is correct                        │
│         │                         • Payout = shares × index                     │
│         │                                                                        │
│         ▼                                                                        │
│  5. Submit tx ─────────────────────────────────────────────► Check nullifier    │
│     (proof + nullifier)                                       not spent         │
│     OR opt-in to Arcium batching for MEV protection          Verify proof      │
│                                                               Record nullifier  │
│                                                               Transfer SOL      │
│                                                                                  │
│  RESULT: SOL (in fixed denomination) sent to recipient. Note spent forever.     │
│          Remaining balance stays as "change note" in pool.                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Selective Compliance

Privacy shouldn't mean hiding from everyone — it means **you choose** who learns what:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRIVACY AS CONTROL                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DEFAULT: Full Privacy                                                          │
│  ─────────────────────                                                           │
│  • Random observers    → See encrypted commitments only                         │
│  • MEV bots            → Can't predict your moves                               │
│  • Surveillance        → No balance to label                                    │
│  • Attackers           → No target to identify                                  │
│                                                                                  │
│  OPTIONAL: Selective Disclosure (YOU choose)                                    │
│  ───────────────────────────────────────────                                     │
│  • Tax authority  → "I earned ≥ X yield"     (not your balance)                 │
│  • DeFi protocol  → "Collateral ≥ Y SOL"     (not exact amount)                 │
│  • Auditor        → "Held position ≥ 90 days"                                   │
│  • Counterparty   → "Position exists"        (not amount)                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Available Compliance Proofs

| Proof Type | What You Prove | What Stays Hidden | Use Case |
|------------|----------------|-------------------|----------|
| **Balance Threshold** | "My balance ≥ X SOL" | Actual balance | Collateral verification |
| **Holding Period** | "I've held ≥ N days" | Exact deposit date | Tax treatment |
| **Yield Earned** | "I earned ≥ Y yield" | Principal, total balance | Tax reporting |
| **Position Existence** | "I have a position" | Everything else | Proof of participation |

---

## What's Public vs Private

**Being honest about our privacy guarantees:**

| Data | Visibility | Why |
|------|------------|-----|
| **TVL** | Public | Vault balances visible on-chain |
| **Index** | Public | Derivable: `index = TVL / total_shares` |
| **Individual deposit/withdrawal amounts** | Public | Transaction data on-chain |
| **Total shares** | Public | Tracked by pool program |
| **Which note you're spending** | Private | Merkle proof hides this |
| **Who owns which note** | Private | Commitments are hashed |
| **Link between deposit → withdrawal** | Private (after transfers) | UTXO mixing breaks chain |
| **Intent timing** | Private (with Arcium) | Batched settlement hides individuals |

**The privacy comes from the UTXO model, not from hidden state.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         YIELDCASH SHIELDED POOL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           USER LAYER                                     │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  User Wallet                                                            │    │
│  │      │                                                                   │    │
│  │      ▼                                                                   │    │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │    │
│  │  │   Deposit    │    │   Withdraw   │    │  Compliance  │              │    │
│  │  │  (SOL → Note)│    │ (Note → SOL) │    │   Proofs     │              │    │
│  │  └──────────────┘    └──────────────┘    └──────────────┘              │    │
│  │         │                   │                   │                        │    │
│  │         ▼                   ▼                   ▼                        │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │    │
│  │  │                 CLIENT-SIDE PROOF GENERATION                     │   │    │
│  │  │                    (Noir WASM in Browser)                        │   │    │
│  │  └─────────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         SOLANA PROGRAM LAYER                             │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │    │
│  │  │  Shielded Pool   │  │  Noir Verifiers  │  │  Arcium Bridge   │      │    │
│  │  │    Program       │  │  (On-Chain)      │  │  (MEV Protection)│      │    │
│  │  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤      │    │
│  │  │ • Merkle Tree    │  │ • Join-Split     │  │ • Intent Batch   │      │    │
│  │  │ • Nullifier Set  │  │ • Compliance     │  │ • Internal Match │      │    │
│  │  │ • SOL Vault      │  │                  │  │ • Net Settlement │      │    │
│  │  │ • mSOL Vault     │  │                  │  │                  │      │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           YIELD LAYER                                    │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │    │
│  │  │   SOL Buffer     │  │   Marinade       │  │   mSOL Vault     │      │    │
│  │  │   (10-20%)       │◄─┤   Staking        │──►  (80-90%)        │      │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘      │    │
│  │                                                                          │    │
│  │  Buffer rebalancing via crank                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Components

### Noir Circuit Suite

| Circuit | Purpose | Key Features |
|---------|---------|--------------|
| `join_split` | All UTXO operations | 2-in, 2-out pattern, Merkle proofs, nullifiers, value conservation |
| `compliance_balance` | Balance threshold proofs | Selective disclosure |
| `compliance_holding` | Holding period proofs | Time-based attestations |

### Key Technologies

| Technology | Role | What It Does |
|------------|------|--------------|
| **Noir** | Authorization Layer | Proves note ownership, prevents double-spend, ensures value conservation |
| **Arcium** | MEV Protection Layer | Batches intents privately, performs internal matching, hides timing |
| **Solana** | Execution Layer | Verifies proofs, updates Merkle tree, moves funds |
| **Marinade** | Yield Layer | Stakes pool SOL, provides mSOL appreciation |

---

## Limitations (Being Honest)

| Limitation | Reality |
|------------|---------|
| **Perfect unlinkability?** | No. Improves with more users. Privacy depends on anonymity set size. |
| **Metadata privacy?** | No. RPC/IP can leak info. Use Tor if needed. |
| **Instant withdrawals?** | Depends on SOL buffer. Large withdrawals may need Marinade unstaking delay. |
| **Browser proving speed?** | ~30-60 seconds. Acceptable but not instant. |

### Trust Assumptions

- **Arcium MPC**: At least 1 honest node (dishonest minority assumption)
- **Marinade**: Smart contract security
- **Noir Verifier**: Deployed bytecode matches source

---

## Bounty Alignment

### Noir/Aztec — Primary Target

**Claim:** Comprehensive Noir circuit suite demonstrating real-world privacy application

- Join-Split circuit implementing Zcash-style UTXO pattern
- Merkle proofs, nullifiers, value conservation
- Selective compliance disclosure circuits
- Production patterns (not toy examples)

### Arcium — Primary Target

**Claim:** Novel use of Arcium for MEV protection through private intent batching

- Users submit encrypted deposit/withdrawal intents
- Arcium performs internal matching (deposits offset withdrawals)
- Only net settlement revealed to chain
- MEV bots can't target individual large withdrawals

### Private Payments Track

**Claim:** Extends privacy INTO DeFi (yield-bearing), not just transfers

- Same UTXO privacy model as Tornado/Zcash
- But funds earn staking yield instead of sitting idle
- Compliance-ready (works within regulatory frameworks)

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           YIELDCASH IN ONE PICTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PROBLEM                                                                        │
│  ───────                                                                         │
│  Privacy pools = dead-end vaults (0% yield)                                     │
│  Public DeFi = MEV extraction + surveillance                                    │
│  Users must choose: Privacy OR Yield                                            │
│                                                                                  │
│                              ▼                                                   │
│                                                                                  │
│  SOLUTION: YieldCash                                                            │
│  ───────────────────                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │                                                                         │     │
│  │   Layer 1: UTXO Privacy          Same as Zcash/Tornado                 │     │
│  │   ─────────────────────          (Merkle trees, nullifiers)            │     │
│  │                                                                         │     │
│  │   Layer 2: MEV Protection        Arcium batches encrypted intents      │     │
│  │   ────────────────────           (no front-running)                    │     │
│  │                                                                         │     │
│  │   Layer 3: Selective Compliance  Noir ZK proofs                        │     │
│  │   ─────────────────────────────  (prove facts, not balances)           │     │
│  │                                                                         │     │
│  │   + YIELD                        Pool stakes to Marinade (7-8% APY)    │     │
│  │                                                                         │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  RESULT: Privacy AND Yield — no tradeoff required                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## References

- [Noir Documentation](https://noir-lang.org/docs)
- [Arcium Developer Docs](https://docs.arcium.com/developers)
- [Sunspot: Noir on Solana](https://github.com/solana-foundation/noir-examples)
- [Marinade Finance](https://docs.marinade.finance)
- [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)

---

*Built for the Solana Privacy Hackathon 2026*

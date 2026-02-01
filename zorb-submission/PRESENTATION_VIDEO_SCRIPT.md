# ZORB Demo Video Script (3 minutes)

**Recording Tools**: OBS, Loom, or QuickTime
**Upload To**: Vimeo (allows video replacement with stable link)
**Max Length**: 3 minutes

---

## VIDEO STRUCTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ZORB DEMO VIDEO (3:00)                               │
│                     5400 frames @ 30fps = 180 seconds                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [0:00]──────[0:25]──────[1:10]──────[1:50]──────[2:45]──────[3:00]        │
│     │          │          │          │          │          │               │
│     ▼          ▼          ▼          ▼          ▼          ▼               │
│  ┌──────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌──────┐           │
│  │INTRO │  │ FREE  │  │ YIELD │  │ZORB.  │  │ CLOSE │  │ END  │           │
│  │      │  │TRANS- │  │BEARING│  │ CASH  │  │       │  │      │           │
│  │ 25s  │  │ FERS  │  │  SOL  │  │       │  │  15s  │  │      │           │
│  │750fr │  │  45s  │  │  40s  │  │  55s  │  │450fr  │  │      │           │
│  └──────┘  │1350fr │  │1200fr │  │1650fr │  └───────┘  └──────┘           │
│            └───────┘  └───────┘  └───────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Section | Timestamp | Duration | Frames | Composition | Key Message |
|---------|-----------|----------|--------|-------------|-------------|
| 0. Introduction | 0:00-0:25 | 25s | 0-750 | `Introduction` | ZORB = programmable privacy on Solana |
| 1. Free Transfers | 0:25-1:10 | 45s | 750-2100 | `FreeShieldedTransfers` | No nullifier rent — transfers are free |
| 2. Yield-Bearing SOL | 1:10-1:50 | 40s | 2100-3300 | `YieldBearingSOL` | Unified SOL earns 7-8% APY while private |
| 3. zorb.cash Product | 1:50-2:45 | 55s | 3300-4950 | `ZorbCashProduct` | Demo: Generate, Shield, Send, Unshield + Stress Test |
| 4. Close | 2:45-3:00 | 15s | 4950-5400 | `Close` | CTA: zorb.cash, GitHub, tagline |

---

<video_outline>

**The video must hit all messages below (in order):**

0. **Introduction — ZORB**
   1. ZORB is exploring programmable privacy on Solana similar to Aztec and Miden
   2. We're starting with private payments — fully unlinkable transactions using commitments and nullifiers (the ZEXE model)[^1]
   3. Architecturally similar to Zcash shielded payments[^2]

1. **Free Shielded Transfers**
   1. ZEXE model[^1] requires nullifiers to prevent double-spending
   2. On Solana, nullifiers stored as PDAs = $0.13 rent locked per tx
   3. "Other protocols charge $0.13 per private transaction" — e.g., PrivacyCash has $47,230 locked in 363,308 nullifier PDAs
   4. ZORB solution: indexed merkle tree (67M nullifiers in ~1KB)
   5. "ZORB transfers are free — no nullifier rent"
   6. "Send privately without fees eating your balance"
   7. Stress test demo: show throughput as % of Solana TPS + total $ saved (rent that would have been locked)

2. **Yield-Bearing Shielded SOL**
   1. **THE PROBLEM: Anonymity Set Fragmentation**
      - "The value of a privacy solution grows with the size of its anonymity set"
      - If you have separate pools for SOL, jitoSOL, mSOL, vSOL → 4 small pools
      - Small pools = weak privacy (easier to trace, fewer users to hide among)
      - "More pools ≠ more privacy. It's the opposite."
   2. **THE SOLUTION: Unified SOL**
      - Introduce **Unified SOL** — the product name (show icon)
      - Groups SOL-equivalents (SOL, vSOL, jitoSOL, mSOL) into a single fungible unit
      - "One pool. Maximum anonymity set."
   3. **THE BONUS: Yield-Bearing Privacy**
      - Underlying LSTs continue earning staking rewards while shielded
      - "Your shielded SOL earns 7-8% APY"
      - "Privacy + yield — no tradeoff"
   4. Technical: ZK circuit computes yield share using global reward accumulator (amount never revealed)
   5. Technical: `unified-sol-pool` Solana program handles LST vaults, exchange rates, harvest-finalize cycle

3. **zorb.cash — The Product**
   1. zorb.cash is an early product that combines both: free transfers + yield-bearing privacy
   2. Wallet: deterministic signature wallet; can also do native ed25519 Solana keypair spend authorizations via STARK + in-browser WASM proving
   3. **Demo: Basic flows**
      1. Shielded addresses — generate/display
      2. Shield — deposit SOL/LST into shielded pool
      3. Send — private transfer to another shielded address
      4. Unshield — withdraw back to public Solana address
   4. **"Break ZORB" stress test**
      1. Demo environment: devnet with real ZK proofs
      2. Infrastructure: Distributed prover setup (in-browser WASM + server-side Groth16)
      3. Throughput: Target 50+ tx/sec (verify before recording)
   5. "Shield your SOL. Send for free. Earn while hidden."
   6. **Note (do not claim, just frame correctly):**
      - Decentralized protocol — no operators, no custody, permissionless
      - Compliance path exists: proof of innocence / association sets

4. **Future — Two Birds, One Stone**
   - **TODO:** Bring STARKs and Circle-FRI onto Solana through Groth16 (recursive verification)

</video_outline>

<references>

[^1]: **ZEXE** — "ZEXE: Enabling Decentralized Private Computation" (Bowe, Chiesa, Green, Miers, Mishra, Wu). IEEE S&P 2020. The commitment + nullifier model for private computation. Paper: https://eprint.iacr.org/2018/962

[^2]: **Zerocash** — "Zerocash: Decentralized Anonymous Payments from Bitcoin" (Ben-Sasson et al.). IEEE S&P 2014. Origin of the commitment/nullifier paradigm used in Zcash and ZEXE. Paper: https://eprint.iacr.org/2014/349

[^3]: **Nullifier Tree Specification** — Internal ZORB protocol specification for the indexed merkle tree. Defines the two-layer security model (ZK non-membership + PDA existence), tree structure (height 26, 67M capacity), and epoch-based root management. Source: `app/docs/protocol/nullifier-tree-specification.md`

</references>

---

## REMOTION PROJECT

**Location**: `presentation-video/`
**Full Video**: `ZorbDemo` — 180s / 5400 frames @ 30fps

```bash
cd presentation-video
pnpm run dev      # Start Remotion Studio → http://localhost:3000
pnpm run render   # Render full video → out/zorb-demo.mp4
```

**Compositions** (6 total):
| Composition | Frames | Duration | Status |
|-------------|--------|----------|--------|
| `ZorbDemo` | 5400 | 3:00 | Full video |
| `Introduction` | 750 | 0:25 | ✅ Ready |
| `FreeShieldedTransfers` | 1350 | 0:45 | ✅ Ready |
| `YieldBearingSOL` | 1200 | 0:40 | ✅ Ready |
| `ZorbCashProduct` | 1650 | 0:55 | ✅ Ready |
| `Close` | 450 | 0:15 | ✅ Ready |

> **Note**: Consider reviewing ETHGlobal/Devcon demo videos for pacing reference before recording voiceover.

---

## SCRIPT WITH DETAILED TIMING

Each section below includes:
- **Timestamp**: When it appears in the final video
- **Composition**: Remotion component name
- **Sub-sections**: Internal timing breakdowns with frame numbers
- **Visual cues**: `[Cue Name]` markers for animation/screen recording sync
- **Narration**: Exact words to speak

---

### [0:00-0:25] SECTION 0: Introduction — ZORB
**Composition**: `Introduction` (750 frames)
**Status**: ✅ READY

**Internal Structure:**
```
Frame 0────────────────────────────────────────────Frame 750
│                                                          │
│  [0-300] Logo animation + "ZORB" title                   │
│  [300-500] "Programmable Privacy on Solana"              │
│  [500-750] Solana logo + ZEXE/Zcash context              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**VISUAL**:
- ZORB logo animation (gradient circle, brand colors)
- Solana logo appears
- Text: "Programmable Privacy on Solana"

**NARRATION** (~20 seconds):
> "ZORB is exploring programmable privacy on Solana similar to Aztec and Miden.
>
> We're starting with private payments — fully unlinkable transactions using commitments and nullifiers. If you know Zcash, this is architecturally similar. The ZEXE model.
>
> This problem space is largely unexplored on Solana. Let me show you what we've built."

---

### [0:25-1:10] SECTION 1: Free Shielded Transfers
**Composition**: `FreeShieldedTransfers` (1350 frames)
**Status**: ✅ READY
**Technical Reference**: `app/docs/protocol/nullifier-tree-specification.md`[^3]

**Privacy Hackathon Angles** (points judges value):
- Novel approach to a known problem (nullifier storage cost)
- Real cryptographic implementation (Groth16 on-chain verification)
- Comparison to existing protocols with on-chain evidence
- Scalability claim with concrete numbers (67M nullifiers in ~1KB)
- Two-layer security model (ZK proofs + PDA checks)
- Working demo, not just theory

**Internal Structure:**
```
Frame 0────────────────────────────────────────────Frame 1350
│                                                          │
│  [0-300] PROBLEM: PDA Costs                              │
│    • "Private transactions require nullifiers"           │
│    • Animated PDA blocks appearing (12 blocks)           │
│    • Live cost accumulator: "12 PDAs = $1.56"            │
│    • "Locked forever. Every transaction."                │
│                                                          │
│  [300-500] EVIDENCE: On-Chain Data                       │
│    • [Show on-chain data] cue                            │
│    • PrivacyCash Protocol card                           │
│    • "$47,230 locked in 363,308 nullifier PDAs"          │
│    • "That money is gone. Forever."                      │
│                                                          │
│  [500-850] SOLUTION: Indexed Merkle Tree                 │
│    • Tree visualization (4 levels shown, 26 total)       │
│    • Stats panel: Capacity 67,108,864 (2²⁶)              │
│    • Stats panel: Storage ~1 KB total                    │
│    • Comparison: "$8.7M (PDA) → $0.01 (ZORB)"            │
│    • "Same structure Aztec uses in production"           │
│    • "ZORB transfers are FREE"                           │
│                                                          │
│  [850-1100] TECHNICAL: Two-Layer Security                │
│    • Layer 1: ZK Non-Membership Proof (Groth16)          │
│      - "N ∉ IndexedTree(root)"                           │
│      - Covers all historical nullifiers                  │
│    • Layer 2: PDA Existence Check                        │
│      - "¬∃ NullifierPDA[N]"                              │
│      - Catches recent nullifier uses                     │
│    • Combined: "Complete double-spend prevention"        │
│    • "Layer 1 covers past • Layer 2 covers present"      │
│                                                          │
│  [1100-1350] DEMO: Stress Test Counter                   │
│    • [Show stress test counter] cue                      │
│    • Animated tx counter (0 → 5000)                      │
│    • Animated savings counter ($0 → $650)                │
│    • "67M capacity • ~1KB storage • Same tech as Aztec"  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**VISUAL CUES**:
| Frame | Cue | Visual |
|-------|-----|--------|
| 0 | Start | Red "The Problem: Nullifier Rent" title |
| 40 | PDA blocks | Animated orange PDA blocks appearing with spring animation |
| 150 | Forever | "Locked forever. Every transaction." fades in |
| 300 | Evidence | "Real Protocol Data" title + PrivacyCash card with $47,230 locked |
| 500 | Solution | Green "ZORB Solution: Indexed Merkle Tree" title |
| 550 | Tree | Animated tree nodes building level by level |
| 620 | Stats | Capacity + Storage stats panel |
| 700 | Comparison | PDA cost vs ZORB cost comparison |
| 850 | Security | "Two-Layer Security Model" title |
| 890 | Layer 1 | ZK Non-Membership Proof card |
| 950 | Layer 2 | PDA Existence Check card |
| 1010 | Combined | "Complete double-spend prevention" banner |
| 1100 | Stress test | "Live Stress Test" title + dual animated counters with easing |

**NARRATION** (~40 seconds):
> "Private transactions need nullifiers — they prevent double-spending. On Solana, every protocol stores these as PDAs. Each one locks thirteen cents in rent. Forever.
>
> [Show on-chain data]
>
> Look at PrivacyCash — they've locked forty-seven thousand dollars in nullifier PDAs. That money is gone.
>
> ZORB takes a different approach. We use an indexed merkle tree — the same structure Aztec uses in production. Sixty-seven million nullifiers in about one kilobyte.
>
> The result? ZORB transfers are free. No nullifier rent eating your balance.
>
> [Show stress test counter]
>
> Watch this — every transaction you see would have cost thirteen cents elsewhere. That counter shows real money saved."

---

**TECHNICAL EXPLAINER: How Free Transactions Work**

This section explains the mechanism at a low level for judges who want to understand the cryptographic design.

**Why PDAs Cost Money**
```
On Solana, accounts require rent-exempt minimum balance:
  - Nullifier PDA = 64 bytes account data
  - Rent = ~0.00089 SOL ≈ $0.13 at current prices
  - This rent is locked FOREVER (cannot be reclaimed while account exists)
  - Linear growth: N transactions = N × $0.13 locked
```

**How Indexed Merkle Tree Works**
```
Instead of storing each nullifier as a separate PDA, we store them in a
merkle tree with a sorted linked list structure:

┌─────────────────────────────────────────────────────────────────────┐
│  INDEXED MERKLE TREE (Height 26)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Each leaf contains:                                                │
│    { value: nullifier_hash,                                         │
│      next_value: next_larger_nullifier,                             │
│      next_index: tree_index_of_next }                               │
│                                                                     │
│  Leaf hash: Poseidon(value, next_index, next_value)                 │
│                                                                     │
│  Tree structure:                                                    │
│                        [Root]                                       │
│                       /      \                                      │
│                    [H01]    [H23]                                   │
│                   /    \   /    \                                   │
│                 [L0]  [L1] [L2] [L3] ...                            │
│                                                                     │
│  On-chain storage (~968 bytes total):                               │
│    - root: 32 bytes                                                 │
│    - subtrees[26]: 26 × 32 = 832 bytes (sibling cache for O(h) ops) │
│    - next_index, current_epoch, etc.: ~100 bytes                    │
│                                                                     │
│  Capacity: 2^26 = 67,108,864 nullifiers                             │
│  Storage: ~1 KB (vs 67M × $0.13 = $8.7M for PDAs)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Non-Membership Proof Mechanism**
```
To prove nullifier N is NOT in the tree (preventing double-spend):

1. Find "low element" L where: L.value < N < L.next_value
   (This gap proves N is not in the sorted list)

2. Generate merkle proof that L exists at claimed position

3. ZK circuit verifies:
   - L.value < N < L.next_value  (ordering constraint)
   - merkle_verify(L, proof, root) = true  (inclusion of L)

If N were in the tree, no valid L would exist (N would BE some leaf's value).
The ZK proof is verified on-chain via Groth16 (~200K compute units).
```

**Two-Layer Security Model**
```
┌─────────────────────────────────────────────────────────────────────┐
│  WHY TWO LAYERS?                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Problem: Tree updates are batched (not real-time).                 │
│  A nullifier used 5 minutes ago may not be in the tree yet.         │
│                                                                     │
│  Solution: Two complementary checks:                                │
│                                                                     │
│  LAYER 1: ZK Non-Membership Proof                                   │
│    - Proves N ∉ IndexedTree(epoch_root)                             │
│    - Covers all nullifiers inserted BEFORE the epoch root           │
│    - Verified via Groth16 on-chain                                  │
│                                                                     │
│  LAYER 2: PDA Existence Check                                       │
│    - When spending, atomically create NullifierPDA[N]               │
│    - If PDA exists, create_account fails → tx rejected              │
│    - Covers all nullifiers used AFTER the epoch root                │
│                                                                     │
│  COMBINED COVERAGE:                                                 │
│    Layer 1 covers: ████████████████████  (past - in tree)           │
│    Layer 2 covers:                     ██████████  (recent - PDAs)  │
│    Together:       ██████████████████████████████  (complete)       │
│                                                                     │
│  Security theorem: ∀ N spent → (N ∈ tree(R) ∨ NullifierPDA[N] exists)│
│  No gaps → complete double-spend prevention                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Transfers Are Free**
```
1. No per-transaction PDA creation (no $0.13 rent)
2. Tree account exists once (~$0.01 rent total)
3. ZK proof verification cost: ~200K CU (paid by user as tx fee, ~$0.0001)
4. Batch insertion amortizes sequencer costs across many transactions

Net result: User pays only standard Solana transaction fee (~$0.0001)
           vs $0.13 + tx fee with PDA approach

Savings: ~1300x cheaper per private transaction
```

---

**RESEARCH ASIDE: Why Groth16 (Not STARKs)**

We investigated using Circle-FRI STARKs instead of Groth16 for on-chain verification.

**The Vision**
```
Batch Circle-FRI proofs → Recurse into final Circle-FRI →
Verify via Groth16 wrapper (32 + 64 + 32 = 128 bytes proof)
```

**What We Found**
```
┌─────────────────────────────────────────────────────────────────────┐
│  STARK VERIFICATION ON SOLANA                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Approach: Batched Circle-FRI STARK verification on-chain           │
│                                                                     │
│  Result: >900 MILLION compute units required                        │
│          (Solana tx limit: 1.4M CU)                                 │
│                                                                     │
│  Conclusion: Not viable for direct on-chain verification            │
│                                                                     │
│  Current solution: Groth16 (BN254)                                  │
│    - Verification: ~200K CU                                         │
│    - Proof size: 128 bytes (32 + 64 + 32)                           │
│    - Mature tooling (snarkjs, circom)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Future Direction**
```
Bring STARKs and Circle-FRI onto Solana through Groth16 recursive verification:
  1. Generate STARK proof (fast prover, large proof)
  2. Recursively verify STARK inside a Groth16 circuit
  3. Verify Groth16 wrapper on-chain (~200K CU)

This gives STARK prover speed + Groth16 verification efficiency.
Active research area for ZORB protocol.
```

---

### [1:10-1:50] SECTION 2: Yield-Bearing Shielded SOL
**Composition**: `YieldBearingSOL` (1200 frames)
**Status**: ✅ READY

**Privacy Hackathon Angles** (points judges value):
- Addresses fundamental privacy challenge (anonymity set size)
- Novel architecture that avoids common pitfalls
- Real yield mechanism implemented in ZK
- Product differentiation over generic mixers

**Internal Structure:**
```
Frame 0────────────────────────────────────────────Frame 1200
│                                                          │
│  [0-350] PROBLEM: Anonymity Set Fragmentation            │
│    • Title: "The Problem: Fragmented Anonymity"          │
│    • Visual: 4 small isolated pools (SOL, jitoSOL, ...)  │
│    • "The value of privacy grows with anonymity set"     │
│    • "4 small pools = weak privacy"                      │
│    • "Easier to trace. Fewer users to hide among."       │
│                                                          │
│  [350-700] SOLUTION: Unified SOL                         │
│    • Transition: 4 pools merge into 1                    │
│    • Unified SOL icon (gradient circle)                  │
│    • "One pool. Maximum anonymity set."                  │
│    • LST icons: SOL, jitoSOL, mSOL, vSOL                 │
│    • Arrows converging into Unified SOL                  │
│                                                          │
│  [700-1000] BONUS: Yield-Bearing Privacy                 │
│    • "But wait — there's more"                           │
│    • "7-8% APY" stat in green                            │
│    • "Underlying LSTs keep earning staking rewards"      │
│    • "Your privacy earns yield"                          │
│                                                          │
│  [1000-1200] SUMMARY                                     │
│    • "Privacy + yield — no tradeoff"                     │
│    • "Unified SOL: Strong privacy. Real yield."          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**VISUAL CUES**:
| Frame | Cue | Visual |
|-------|-----|--------|
| 0 | Problem title | "The Problem: Fragmented Anonymity" in red |
| 50 | Small pools | 4 isolated pool boxes (SOL, jitoSOL, mSOL, vSOL) |
| 200 | Weak privacy | "4 pools = weak privacy" callout |
| 350 | Transition | Pools animate merging into center |
| 450 | Unified SOL | Unified SOL icon with "One pool. Maximum anonymity." |
| 550 | LST logos | jitoSOL, mSOL, vSOL, SOL icons converging |
| 700 | Yield intro | "The Bonus: Yield-Bearing Privacy" title |
| 800 | APY stat | "7-8% APY" in green, large |
| 1000 | Summary | "Privacy + yield — no tradeoff" |

**NARRATION** (~35 seconds):
> "Here's something most privacy protocols get wrong.
>
> The value of a privacy solution grows with the size of its anonymity set. If you have separate pools for SOL, jitoSOL, mSOL — you get four small pools. Four small pools are easy to trace. Fewer users to hide among.
>
> ZORB solves this with Unified SOL. We group all SOL-equivalents into a single fungible unit. One pool. Maximum anonymity set.
>
> And here's the bonus: your shielded SOL keeps earning yield. The underlying LSTs — jitoSOL, mSOL — continue accruing staking rewards. Seven to eight percent APY, while fully private.
>
> Privacy plus yield. No tradeoff."

---

### [1:50-2:45] SECTION 3: zorb.cash — The Product
**Composition**: `ZorbCashProduct` (1650 frames)
**Status**: ✅ READY

**Internal Structure:**
```
Frame 0────────────────────────────────────────────Frame 1650
│                                                          │
│  [0-250] PRODUCT INTRO                                   │
│    • "zorb.cash" title                                   │
│    • "Free transfers + Yield-bearing privacy"            │
│                                                          │
│  [250-850] DEMO: Basic Flows (4 steps, 150 frames each)  │
│    • [250-400] [Demo: Generate] — Create shielded addr   │
│    • [400-550] [Demo: Shield] — Deposit SOL/LST          │
│    • [550-700] [Demo: Send] — Private transfer           │
│    • [700-850] [Demo: Unshield] — Withdraw to public     │
│                                                          │
│  [850-1400] DEMO: Break ZORB Stress Test                 │
│    • [Show Break ZORB stress test] cue                   │
│    • Animated tx counter                                 │
│    • Animated savings counter                            │
│    • TPS stat: "[N] tx/sec" (fill in actual test result) │
│    • "Running on devnet • Real ZK proofs"                │
│                                                          │
│  [1400-1650] CLOSING NOTES                               │
│    • Decentralization card                               │
│    • Compliance path card                                │
│    • Tagline: "Shield your SOL..."                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**VISUAL CUES**:
| Frame | Cue | Visual |
|-------|-----|--------|
| 0 | Start | "zorb.cash" title |
| 250 | `[Demo: Generate]` | Generate flow card highlighted |
| 400 | `[Demo: Shield]` | Shield flow card highlighted |
| 550 | `[Demo: Send]` | Send flow card highlighted |
| 700 | `[Demo: Unshield]` | Unshield flow card highlighted |
| 850 | `[Show Break ZORB stress test]` | Stress test counters |
| 1400 | Closing | Decentralization + Compliance cards |

**NARRATION** (~50 seconds):
> "zorb.cash is our early product that brings this together.
>
> [Demo: Generate shielded address]
>
> Create a shielded address.
>
> [Demo: Shield]
>
> Shield your SOL — deposit into the private pool.
>
> [Demo: Send]
>
> Send to another shielded address. No one sees the amount. No one sees the recipient.
>
> [Demo: Unshield]
>
> Unshield when you need to — withdraw back to any Solana address.
>
> [Show Break ZORB stress test]
>
> And here's our stress test running on devnet. Real ZK proofs. Real throughput. Watch those counters climb — every transaction you see is a real shielded transfer.
>
> Every one of those would have cost rent elsewhere. Here, it's free."

**NOTE (shown visually, not spoken)**:
- Decentralized protocol — no operators, no custody, permissionless
- Compliance path exists: proof of innocence / association sets

---

### [2:45-3:00] SECTION 4: Close
**Composition**: `Close` (450 frames)
**Status**: ✅ READY

**Internal Structure:**
```
Frame 0────────────────────────────────────────────Frame 450
│                                                          │
│  [0-90] LOGO: ZORB brand animation                       │
│    • Gradient circle scales in                           │
│    • "ZORB" title                                        │
│                                                          │
│  [90-180] TAGLINE                                        │
│    • "Shield your SOL. Send for free. Earn while hidden."│
│                                                          │
│  [180-300] LINKS                                         │
│    • zorb.cash                                           │
│    • github.com/zorb-labs                                │
│                                                          │
│  [300-450] CLOSING                                       │
│    • "Privacy should be free. ZORB makes it possible."   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**VISUAL CUES**:
| Frame | Cue | Visual |
|-------|-----|--------|
| 0 | Logo | ZORB logo animation |
| 90 | Tagline | Cyan tagline text |
| 180 | Links | zorb.cash + GitHub links |
| 300 | Closing | Green italic closing line |

**NARRATION** (~12 seconds):
> "ZORB. Shield your SOL. Send for free. Earn while hidden.
>
> Try it at zorb.cash. Code is open source on GitHub.
>
> Privacy should be free. ZORB makes it possible."

---

## PRODUCTION WORKFLOW

### Step 1: Render Remotion Video
```bash
cd presentation-video
pnpm run render
# Output: out/zorb-demo.mp4 (180s, ~12MB)
```

### Step 2: Record Voiceover
- Use script narration above
- Record in quiet environment
- Aim for 2:50 total (leave buffer)
- Export as WAV or high-quality MP3

### Step 3: Sync Audio to Video
```bash
# Combine video + voiceover
ffmpeg -i out/zorb-demo.mp4 -i voiceover.wav \
  -c:v copy -c:a aac -b:a 192k \
  -map 0:v:0 -map 1:a:0 \
  out/zorb-demo-with-audio.mp4
```

### Step 4: Final Review
- [ ] Audio syncs with visual cues
- [ ] All `[Cue]` markers hit at correct times
- [ ] Total length ≤ 3:00
- [ ] 1080p resolution maintained

### Step 5: Compress & Upload
```bash
# Compress for upload
ffmpeg -i out/zorb-demo-with-audio.mp4 \
  -c:v libx264 -crf 23 -c:a aac -b:a 128k \
  out/final.mp4

# Verify length
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 out/final.mp4
```

---

## RECORDING TIPS

1. **Pacing**: Conversational but confident. Don't rush.
2. **Emphasis**: Hit the three pillars — private, free, yield-bearing
3. **Audio**: Good microphone. Background noise kills credibility.
4. **Length**: Aim for 2:50. Leave buffer for editing.
5. **Energy**: Study ETHGlobal finalists — confident, not salesy

---

## UPLOAD CHECKLIST

- [ ] Video is under 3 minutes
- [ ] 1080p resolution
- [ ] Audio is clear and synced
- [ ] All links visible on screen
- [ ] Upload to Vimeo (stable link for updates)
- [ ] Test playback without login
- [ ] Copy URL to FINAL_SUBMISSION.md

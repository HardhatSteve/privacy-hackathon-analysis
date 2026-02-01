# ZORB Hackathon Submission - FINAL FORM ANSWERS

**Form URL**: https://solanafoundation.typeform.com/privacyhacksub
**Deadline**: February 1, 2026 (END OF DAY)

---

## Core Narrative

This is the ground truth for ZORB's hackathon submission. All materials (video, animations, graphics) should align with this narrative.

### The One-Liner
> Free private transfers on Solana using a concurrent nullifier tree scheme with amortizable rent.

### The Framing
ZORB is exploring **programmable privacy on Solana**. We started with native private payments — not Token 2022 confidential transfers, but fully unlinkable transactions using commitments and nullifiers (the ZEXE model). This problem space is largely unexplored on Solana.

### The Problem (Why This Matters)
Private execution requires commitments and nullifiers. On Solana, every protocol stores nullifiers as individual PDAs — each costing 2 years of rent to be rent-exempt (~$0.13). This rent is locked forever.

At scale: 10,000 tx = $1,300 locked. 1 million tx = $130,000 gone permanently.

### The Solution (What ZORB Does)
We present a **concurrent nullifier tree scheme** with amortizable rent tending to zero:

- **Indexed Merkle Tree** — Same structure Aztec uses in production (67M nullifiers in ~1KB)
- **Global epoch cursors** — Earliest provable epoch + current epoch enable safe PDA closure
- **Two-layer security** — Immediate PDA coverage + background ZK batch insertion
- **Closable nullifier PDAs** — Rent comes back after epoch advances

**References**:
- Indexed Merkle Tree paper: https://eprint.iacr.org/2021/1263.pdf
- Aztec implementation: https://docs.aztec.network/developers/docs/foundational-topics/advanced/storage/indexed_merkle_tree

### The Differentiators (Why ZORB Wins)
1. **Zero rent costs** — Indexed merkle tree vs PDAs
2. **Batch proofs** — 4/16/64 nullifiers per ZK proof
3. **Yield while shielded** — Multi-LST pool (vSOL, jitoSOL, mSOL) earning 7-8% APY
4. **Rent reclamation** — Old nullifier PDAs can be closed after epoch advance

### Key Technical Claims
- **Nullifiers are unlinkable to commitments** — No on-chain correlation between deposits and spends; the nullifier reveals nothing about which note was consumed
- **Two-layer security** — ZK proof covers the merkle tree, PDA check covers pending insertions; no double-spend window
- **Production-ready cryptography** — Real Groth16 verification on-chain, not mock verifiers

### Team & Vision
- **ZK team with Polygon experience** — Proven track record in zero-knowledge systems
- **Researching programmable privacy on Solana** — Pushing the frontier of what's possible, open sourcing our work as we go
- **Kernel L2 rollup coming Q2 2026** — Private smart contracts on Solana

### The Tagline
> "Privacy should be free. ZORB makes it possible."

---

## Related Assets

| Asset | File | Purpose |
|-------|------|---------|
| Demo Video Script | [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md) | 3-minute video narration, timing, and visual cues |
| Video Animations | `../video-animations/` | Motion Canvas scenes derived from VIDEO_SCRIPT.md |
| Competitor Analysis | [`COMPETITOR_VIDEOS.md`](./COMPETITOR_VIDEOS.md) | Video strategy based on competitor research |

**Video Production**: Follow [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md) exactly. The script defines timing, narration, and visuals for each section of the demo video.

---

## Form Fields

### Field 1: Project Name
```
ZORB
```

---

## Field 2: One-line Description (50-100 chars)
```
Free private transfers on Solana using an indexed merkle tree that eliminates per-transaction rent costs
```

---

## Field 3: GitHub Repository
```
https://github.com/zorb-protocol/zorb
```
**CRITICAL**: Repository MUST be PUBLIC until Feb 7

---

## Field 4: Demo Video (YouTube/Loom)
```
[INSERT YOUTUBE LINK AFTER RECORDING]
```
Max 4 minutes, no login required

**Production Guide**: See [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md) for the complete script with timing, narration, and visual requirements.

---

## Field 5: Live Demo Link (Optional)
```
https://zorb.cash/stress-test
```

---

## Field 6: Track Selection
```
Private payments
```

---

## Field 7: Does your project use Light Protocol?
```
No
```

---

## Field 8: Are you applying for any sponsor bounties?
```
None
```

---

## Field 9: Technical Description (Copy-paste below)

```
ZORB is a privacy protocol for Solana that eliminates the fundamental cost problem plaguing all existing implementations: per-transaction rent.

THE PROBLEM

Every Solana privacy protocol today (Privacy Cash, Velum, etc.) stores nullifiers as individual PDAs. Each nullifier locks ~0.00089 SOL in rent (~$0.13) permanently. At scale, this becomes prohibitive: 10,000 private transactions lock $1,300 forever.

OUR SOLUTION: INDEXED MERKLE TREE

We implemented an Aztec-style indexed merkle tree that stores 67 million nullifiers in a single ~1KB account. Instead of PDA lookups, we use ZK non-membership proofs to verify a nullifier hasn't been spent.

How it works:
1. Tree stores nullifiers in sorted order with "next" pointers (linked list)
2. To prove non-membership: find the "low element" where low.value < nullifier < low.nextValue
3. Groth16 proof verifies low element exists in tree, proves gap exists, nullifier not present
4. Epoch-based snapshots allow historical proofs while tree continues growing

WHAT WE BUILT

Circuits (Circom/Groth16):
- nullifierNonMembership4: Proves 4 nullifiers not in tree (~29K constraints)
- nullifierBatchInsert4/16/64: Batch insertion proofs
- transaction2/4: Note spend + output creation with nullifier generation

Solana Programs (Rust/Anchor):
- shielded-pool: Core privacy operations, nullifier tree management
- token-pool: SPL token vaults for shielded deposits/withdrawals
- unified-sol-pool: Multi-LST support with yield-while-shielded capability

YIELD WHILE SHIELDED (Unique to ZORB)

Our unified-sol-pool is the only working implementation of private yield on Solana. Competitors claim this feature but have unfinished code (TODO stubs, simulated ZK).

How it works:
- Accepts multiple LSTs: WSOL, vSOL, jitoSOL, mSOL in same pool
- Cross-LST fungibility: deposit vSOL, withdraw jitoSOL (no unshielding required)
- Real exchange rate tracking in pool state
- Appreciation harvesting captures staking yield privately
- Users earn ~7-8% APY while funds remain fully shielded

No other hackathon submission has this capability fully implemented.

Key Technical Innovations:
1. Two-layer security: ZK proof covers tree, PDA check covers pending - no gaps
2. Concurrent insertion: Multiple sequencers can generate batch proofs in parallel
3. Epoch-based cleanup: Old nullifier PDAs can be closed, rent reclaimed
4. Position-independent nullifiers: Tree reorganization doesn't break existing proofs

PERFORMANCE

Our "Break ZORB" stress test demonstrates:
- Sustained private transaction throughput limited only by prover speed
- Zero long-term storage costs (vs $0.13/tx for competitors)
- 400ms finality (1875x faster than Zcash's 12.5 min)

Deployed Programs (Devnet):
- Shielded Pool: GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6
- Token Pool: 7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S
- Unified SOL Pool: 3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf

All code is open source.

TEAM

Built by a ZK team with experience from Polygon. We're researching and pushing the frontier of programmable privacy on Solana — open sourcing our work as we go. ZORB is the foundation; a privacy kernel L2 rollup is next.
```

---

## Field 10: Project Roadmap (Copy-paste below)

```
IMMEDIATE (February 2026)
- Mainnet deployment with audited contracts
- Public SDK release (@zorb/circuits, @zorb/wallet-react)
- Developer documentation and integration guides

Q1 2026
- Remote prover network for higher throughput
- Mobile SDK (iOS/Android)
- Hardware wallet integration (Ledger, Trezor)

Q2 2026
- Programmable privacy kernel as L2 rollup on Solana
- Private DEX integration (Jupiter aggregator support)
- Cross-chain bridges with privacy preservation
- Institutional compliance tools (selective disclosure)

LONG-TERM VISION
ZORB aims to make privacy the default for Solana transactions. Our indexed merkle tree approach scales to billions of transactions without accumulating rent debt. The goal is privacy that costs nothing at scale.
```

---

## Field 11: Telegram Handle
```
@[YOUR_TELEGRAM_HANDLE]
```
**ACTION REQUIRED**: Add your Telegram handle

---

## Pre-Submission Checklist

- [ ] GitHub repo is PUBLIC and accessible
- [ ] GitHub repo clones successfully: `git clone https://github.com/zorb-protocol/zorb`
- [ ] Demo video plays without login
- [ ] Demo video is under 3 minutes
- [ ] zorb.cash/stress-test loads (or show local demo in video)
- [ ] All 11 form fields completed
- [ ] Telegram handle is correct
- [ ] Review technical description for typos

---

## Post-Submission

- [ ] Screenshot confirmation page
- [ ] Save submission ID
- [ ] Keep repo PUBLIC until Feb 7 judging ends
- [ ] Check email for confirmation

---

## Quick Reference: Deployed Program IDs

| Network | Program | Address |
|---------|---------|---------|
| Devnet | Shielded Pool | `GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6` |
| Devnet | Token Pool | `7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S` |
| Devnet | Unified SOL | `3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf` |
| Mainnet | Shielded Pool | `zrbus1K97oD9wzzygehPBZMh5EVXPturZNgbfoTig5Z` |
| Mainnet | Token Pool | `tokucUdUVP8k9xMS98cnVFmy4Yg3zkKMjfmGuYma8ah` |
| Mainnet | Unified SOL | `unixG6MuVwukHrmCbn4oE8LAPYKDfDMyNtNuMSEYJmi` |

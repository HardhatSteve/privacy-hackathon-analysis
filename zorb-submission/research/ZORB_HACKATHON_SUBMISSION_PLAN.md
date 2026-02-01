# Zorb Hackathon Submission: Complete Strategy & Technical Analysis

**Submission Deadline**: February 1, 2026
**Analysis Date**: January 31, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Official Hackathon Requirements](#official-hackathon-requirements)
3. [Zorb Technical Differentiators](#zorb-technical-differentiators)
4. [Submission Opportunities](#submission-opportunities)
5. [Competitive Analysis](#competitive-analysis)
6. [Implementation Plan](#implementation-plan)
7. [Package Publishing Strategy](#package-publishing-strategy)
8. [Demo & Video Strategy](#demo--video-strategy)
9. [Submission Checklist](#submission-checklist)

---

## Executive Summary

Zorb should submit to **multiple tracks** with different focal points:

| Submission | Track | Prize Pool | Win Probability |
|------------|-------|------------|-----------------|
| **Zorb Privacy Protocol** | Private Payments | $15,000 | HIGH |
| **Break Zorb Demo** | Privacy Tooling | $15,000 | MEDIUM-HIGH |
| **Zorb SDK** | Privacy Tooling | $15,000 | MEDIUM |
| **Private ZORB Mining** | Open Track | $18,000 | MEDIUM |

**Total Addressable Prizes**: $63,000 + sponsor bounties

**Core Narrative**: Zorb is the only Solana privacy protocol that eliminates the expensive PDA-per-nullifier pattern, enabling **privacy at scale** with 1000x lower storage costs than competitors.

---

## Official Hackathon Requirements

### Key Deadlines
| Milestone | Date |
|-----------|------|
| Hacking Period | January 12-30, 2026 |
| **Submissions Due** | **February 1, 2026** |
| Winners Announced | February 10, 2026 |

### Mandatory Requirements
1. **"All code must be open source"** ← Non-negotiable for submitted project
2. Projects must integrate with Solana + utilize privacy-preserving technologies
3. All programs must be deployed to **Solana devnet or mainnet**
4. Submit a **demo video (max 3 minutes)**
5. Include documentation on how to run and use

### Tracks & Prizes
| Track | Prize Pool |
|-------|------------|
| Private Payments | $15,000 |
| Privacy Tooling | $15,000 |
| Open Track (Light Protocol) | $18,000 |

### Relevant Sponsor Bounties
| Sponsor | Amount | Zorb Fit |
|---------|--------|----------|
| Privacy Cash | $15,000 | MEDIUM (different architecture) |
| Arcium | $10,000 | LOW (no MPC integration) |
| Aztec/Noir | $10,000 | LOW (Circom, not Noir) |
| Radr Labs | $15,000 | MEDIUM |
| Anoncoin | $10,000 | MEDIUM |

---

## Zorb Technical Differentiators

### The Core Innovation: Indexed Merkle Tree

**The Problem**: Every Solana privacy competitor stores nullifiers as individual PDAs:
- Privacy Cash, Velum: 1 PDA per nullifier = ~0.00089 SOL rent per spend
- At 100 tx/day: ~0.089 SOL/day (~$13/day) locked forever

**Zorb's Solution**: Aztec-style indexed merkle tree
- Single account stores 67 million nullifiers
- ZK non-membership proofs (no PDA creation)
- Epoch-based cleanup enables rent reclamation

| Metric | Zorb | Competitors |
|--------|------|-------------|
| Nullifier Storage | Indexed MT | PDAs |
| Cost per Nullifier | ~$0 | ~$0.13 |
| 100 tx Rent | ~$0 | ~$13 locked |
| Rent Reclaimable | Yes | No |
| Max Capacity | 67M | Rent-limited |

### Additional Unique Capabilities

| Feature | Zorb | Best Competitor |
|---------|------|-----------------|
| **Batch Proofs** | 4/16/64 nullifiers per proof | None |
| **Multi-Asset** | 4 assets per transaction | 1-2 typical |
| **Yield Accrual** | Rewards while shielded | None |
| **LST Support** | Cross-LST swaps privately | None |
| **Circuit Efficiency** | 35,620 constraints | 50K-200K+ |

### Circuit Architecture Summary

**Transaction Circuits**:
| Circuit | Constraints | Inputs | Outputs |
|---------|-------------|--------|---------|
| transaction2 | ~28,000 | 2 | 2 |
| transaction4 | ~35,620 | 4 | 4 |
| transaction16 | ~200,000 | 16 | 2 |

**Nullifier Circuits**:
| Circuit | Constraints | Batch Size |
|---------|-------------|------------|
| nullifierNonMembership4 | ~29,104 | 4 |
| nullifierBatchInsert4 | ~212,000 | 4 |
| nullifierBatchInsert16 | ~800,000 | 16 |
| nullifierBatchInsert64 | ~3.2M | 64 |

**Mining Circuits**:
| Circuit | Constraints | Purpose |
|---------|-------------|---------|
| shieldedClaim | ~8,500 | Private mining reward claims |
| shieldedDeploy | ~12,000 | Bind mining to wallet |

### On-Chain Programs

| Program | ID | Purpose |
|---------|-----|---------|
| Shielded Pool | `zrbus1K97...` | Hub for all privacy ops |
| Token Pool | `tokucUdUVP8k9...` | SPL token vaults |
| Unified SOL Pool | `unixG6MuVwuk...` | Multi-LST support |
| ZORB Mining | `boreXQWsKpsJ...` | Mining game |

---

## Submission Opportunities

### Submission 1: Zorb Privacy Protocol (PRIMARY)

**Track**: Private Payments ($15,000)

**Narrative**: "Privacy at Scale"

> "Zorb is the only Solana privacy protocol that doesn't create a new account for every transaction. Our indexed merkle tree stores 67 million nullifiers in a single account, eliminating the ~$0.13 rent cost that competitors lock permanently per transaction."

**Key Talking Points**:
1. **Zero PDA rent** - Indexed merkle tree vs individual PDAs
2. **Batch efficiency** - 64 nullifiers per proof amortizes verification
3. **400ms finality** - 1875x faster than Zcash (12.5 min)
4. **Yield while shielded** - Unique reward accumulator
5. **Cross-LST privacy** - Private LST-to-LST conversions

**Required Deliverables**:
- [ ] Open source Solana programs (zore/)
- [ ] Open source circuit package
- [ ] Deploy to devnet (already done)
- [ ] 3-minute demo video
- [ ] Documentation

### Submission 2: Break Zorb Demo

**Track**: Privacy Tooling ($15,000)

**Narrative**: "See Privacy at Scale in Action"

**Demo Features**:
- Real-time TPS dashboard
- Transaction success rate tracking
- Latency percentiles (p50, p95, p99)
- Cost comparison visualizations
- Finality comparison (Zorb vs Zcash)

**Technical Infrastructure** (existing in `@49labs/stress-test`):
- ExecutionPool with configurable concurrency (1-10)
- Three modes: proof-only, full, relayer
- Predefined scenarios (smoke, high-throughput, endurance)
- CLI and programmatic APIs

**Comparison Visuals**:
```
Finality Comparison:
Zcash:    ████████████████████████████████ 12.5 min
Zorb:     █ 400ms (1875x faster)

Cost Comparison (100 tx):
Privacy Cash: ████████████ $13 rent locked forever
Zorb:         █ ~$0 (shared tree)

TPS Comparison:
Solana Max:     ████████████████████████████████ 65,000
Zorb Shielded:  ██ ~100-500 (prover-limited)
Privacy Cash:   █ ~10-50 (PDA-limited)
```

**Required Deliverables**:
- [ ] Standalone break-zorb app (extracted from zorb-cash)
- [ ] Public deployment URL
- [ ] Open source `@zorb/stress-test` package
- [ ] Demo video showing throughput

### Submission 3: Zorb SDK

**Track**: Privacy Tooling ($15,000)

**Narrative**: "Build Privacy into Any Solana App"

**Published Packages**:

| Package | Purpose | npm |
|---------|---------|-----|
| `@zorb/circuits` | ZK circuits + TypeScript | ✓ |
| `@zorb/wallet-react` | React hooks for privacy wallet | ✓ |
| `@zorb/shielded-pool-client` | Solana client SDK | ✓ |
| `@zorb/token-pool-client` | Token pool client | ✓ |
| `@zorb/unified-sol-pool-client` | SOL/LST pool client | ✓ |
| `@zorb/api-schemas` | API type definitions | ✓ |
| `@zorb/config` | Network configuration | ✓ |
| `@zorb/stress-test` | Benchmarking tools | ✓ |

**Developer Experience Highlights**:
```typescript
// Simple shielding
const { shield } = useZorbWallet();
await shield.mutateAsync({
  amount: TokenAmount.from(1000n, 6),
  mint: USDC_MINT,
});

// Private transfer
const { send } = useZorbWallet();
await send.mutateAsync({
  amount: TokenAmount.from(500n, 6),
  recipientAddress: "szorb1...",
});

// Multi-tab coordination automatic
// Parallel proof generation automatic
// Circuit preloading automatic
```

**Required Deliverables**:
- [ ] Publish all packages to npm (@zorb scope)
- [ ] Developer documentation
- [ ] Example app
- [ ] Demo video

### Submission 4: Private ZORB Mining

**Track**: Open Track ($18,000)

**Narrative**: "Mine Privately, Earn Privately"

**Current State**: ZORB mining exists but has no privacy integration

**Enhancement Path**:
1. Private ZORB staking via shielded pool
2. Private deployment interface
3. Private yield claiming
4. Private reward distribution

**Mining Mechanics** (existing):
- 5×5 game grid, deploy SOL to squares
- Winner selection via decentralized slot-hash RNG
- +4 ZORB per round + 90% of losing deployments

**Privacy Additions**:
- Shield ZORB tokens before staking
- Deploy privately (amount hidden)
- Claim rewards to shielded pool
- Unstake privately

**Required Deliverables**:
- [ ] Shielded pool integration for ZORB staking
- [ ] Private deployment frontend
- [ ] Demo video
- [ ] Documentation

---

## Competitive Analysis

### vs Protocol-01 (Threat: CRITICAL)

**Their Strengths**:
- Browser extension + mobile app
- Stealth addresses (ECDH)
- 2,175+ tests
- Biometric auth, fiat onramps

**Zorb's Advantages**:
- **Indexed MT vs PDAs** - No rent costs
- **4 assets per tx** - Multi-asset privacy
- **Yield while shielded** - Unique feature
- **Cross-LST swaps** - Privacy for stakers

### vs cloakcraft (Threat: CRITICAL)

**Their Strengths**:
- Full DeFi suite (AMM, perps, governance)
- Light Protocol compression
- Note consolidation (3→1)

**Zorb's Advantages**:
- **Indexed MT** - More efficient than Light Protocol for nullifiers
- **Batch proofs** - 4/16/64 vs none
- **Multi-asset per tx** - 4 vs 1
- **No fake commitment vulnerability** - They have unfixed critical bug

### vs velum (Threat: HIGH)

**Their Strengths**:
- **Live on mainnet** (velum.cash)
- Payment links (shareable URLs)
- Consumer-friendly UX

**Zorb's Advantages**:
- **Indexed MT vs PDAs** - 1000x cheaper
- **Reclaimable rent** - vs permanent lock
- **Multi-asset** - vs single asset
- **Yield accrual** - vs none

### Threat Summary

| Competitor | Threat Level | Key Vulnerability |
|------------|--------------|-------------------|
| Protocol-01 | CRITICAL | Client-computed merkle roots |
| cloakcraft | CRITICAL | Fake commitment attack (unfixed) |
| velum | HIGH | PDA rent costs at scale |
| SolVoid | HIGH | Placeholder program ID |
| vapor-tokens | HIGH | Single-use vapor addresses |

---

## Implementation Plan

### Phase 1: Package Publishing (Day 1)

**Tier 1 - No Internal Dependencies**:
```bash
# Publish to npm
npm publish @zorb/api-schemas
npm publish @zorb/config
npm publish @zorb/shielded-pool-client
npm publish @zorb/token-pool-client
npm publish @zorb/unified-sol-pool-client
```

**Tier 2 - Depends on Tier 1**:
```bash
npm publish @zorb/prover-coordinator-client
```

**Tier 3 - Depends on Tier 1-2**:
```bash
npm publish @zorb/circuits
npm publish @zorb/stress-test
```

### Phase 2: Wallet Package (Day 1-2)

```bash
npm publish @zorb/wallet-react
```

Dependencies: circuits, api-schemas, config, react-common, all clients

### Phase 3: Break Zorb App (Day 2)

1. Create `break-zorb/` app (new repo or monorepo)
2. Copy UI components from zorb-cash stress-test/
3. Copy `use-stress-test.ts` hook
4. Import from published `@zorb/wallet-react`
5. Deploy to public URL

### Phase 4: Open Source Programs (Day 2)

1. Create public repo for `zore/` programs
2. Verify deployment on devnet
3. Link IDLs to client packages
4. Add README with architecture docs

### Phase 5: Demo Video (Day 2-3)

**Script Outline** (3 minutes):
```
[0:00-0:30] Hook: "What if privacy didn't cost $0.13 per transaction?"

[0:30-1:00] Problem: Show competitor PDA costs accumulating
- Privacy Cash transaction → +$0.13 rent
- 100 transactions → $13 locked forever
- At scale → Unsustainable

[1:00-1:30] Solution: Zorb indexed merkle tree
- Single account, 67 million nullifiers
- ZK non-membership proofs
- Zero marginal cost

[1:30-2:00] Demo: Break Zorb stress test
- Show TPS dashboard
- Show transaction success rate
- Show latency metrics
- Compare to competitors

[2:00-2:30] Unique Features
- Yield while shielded
- Cross-LST swaps
- Batch proofs (4/16/64)

[2:30-3:00] CTA
- Open source links
- SDK documentation
- Try it yourself
```

### Phase 6: Documentation (Day 3)

- Protocol specification
- Circuit documentation
- SDK quickstart guide
- API reference

---

## Package Publishing Strategy

### Current Package Structure (app/)

```
app/
├── clients/              # Protocol clients (auto-generated)
│   ├── shielded-pool-client/     → @zorb/shielded-pool-client
│   ├── token-pool-client/        → @zorb/token-pool-client
│   ├── unified-sol-pool-client/  → @zorb/unified-sol-pool-client
│   └── ...
├── packages/             # Reusable libraries
│   ├── api-schemas/      → @zorb/api-schemas
│   ├── circuits/         → @zorb/circuits
│   ├── config/           → @zorb/config
│   ├── stress-test/      → @zorb/stress-test
│   ├── zorb-wallet-react/→ @zorb/wallet-react
│   └── react-common/     → (extract minimal utilities)
└── apps/
    └── zorb-cash/        → (stays private)
```

### Rename Strategy

| Current Name | Published Name | Scope |
|--------------|----------------|-------|
| @49labs/api-schemas | @zorb/api-schemas | Public |
| @49labs/circuits | @zorb/circuits | Public |
| @49labs/config | @zorb/config | Public |
| @49labs/shielded-pool-client | @zorb/shielded-pool-client | Public |
| @49labs/token-pool-client | @zorb/token-pool-client | Public |
| @49labs/unified-sol-pool-client | @zorb/unified-sol-pool-client | Public |
| @49labs/stress-test | @zorb/stress-test | Public |
| @49labs/zorb-wallet-react | @zorb/wallet-react | Public |

### Stays Private

| Component | Reason |
|-----------|--------|
| zorb-cash | Main product frontend |
| All workers | Infrastructure |
| deploy-helpers | Internal tooling |

---

## Demo & Video Strategy

### Break Zorb Demo Features

**Control Panel**:
- Start/Stop/Pause buttons
- Batch size selector (1/4/16/64)
- Concurrency slider (1-10)
- Mode selector (proof-only/full/relayer)
- Keyboard shortcuts (Space, Enter, Escape)

**Metrics Dashboard**:
- TPS gauge (real-time)
- Success rate percentage
- Latency histogram (p50/p95/p99)
- Transaction feed (live)
- Cost breakdown

**Comparison Section**:
- Zorb vs Zcash finality
- Zorb vs Privacy Cash cost
- Zorb vs Solana throughput

### Video Storyboard

| Time | Visual | Narration |
|------|--------|-----------|
| 0:00 | Problem statement | "Privacy on Solana costs too much" |
| 0:15 | PDA rent animation | "Every transaction locks $0.13 forever" |
| 0:30 | Indexed MT diagram | "Zorb uses a single shared tree" |
| 0:45 | Break Zorb demo | "Watch as we process 100 private transactions" |
| 1:15 | TPS dashboard | "10+ TPS with full privacy" |
| 1:30 | Cost comparison | "Cost: essentially zero" |
| 1:45 | Yield feature | "Earn rewards while shielded" |
| 2:00 | LST feature | "Swap LSTs privately" |
| 2:15 | SDK code | "Build privacy into any app" |
| 2:30 | Open source links | "All code is open source" |
| 2:45 | CTA | "Try Zorb today" |

---

## Submission Checklist

### Code Preparation
- [ ] Publish Tier 1 packages (clients, api-schemas, config)
- [ ] Publish Tier 2 packages (prover-coordinator-client)
- [ ] Publish Tier 3 packages (circuits, stress-test)
- [ ] Publish zorb-wallet-react
- [ ] Create Break Zorb standalone app
- [ ] Open source Solana programs (zore/)
- [ ] Verify programs deployed to devnet

### Demo Polish
- [ ] Complete remote prover integration (higher TPS)
- [ ] Add visual polish (donut charts, animated grid)
- [ ] Add network comparison section
- [ ] Test full e2e flow
- [ ] Deploy to public URL

### Submission Materials
- [ ] Record 3-minute demo video
- [ ] Write README with comparison figures
- [ ] Prepare protocol documentation
- [ ] Write SDK quickstart guide

### Submit by February 1, 2026
- [ ] Private Payments track: Zorb Privacy Protocol
- [ ] Privacy Tooling track: Break Zorb Demo
- [ ] Privacy Tooling track: Zorb SDK
- [ ] Open Track: Private ZORB Mining (if time permits)

---

## Appendix: Key Talking Points

### For Judges

1. **"Zero PDA rent"** - Unlike every competitor, Zorb stores nullifiers in a shared indexed merkle tree
2. **"Batch efficiency"** - 64 nullifiers per proof amortizes verification cost
3. **"Solana speed privacy"** - 400ms finality vs Zcash's 12.5 minutes
4. **"Reclaimable rent"** - Epoch-based cleanup returns rent to operators
5. **"Programmable privacy"** - CPI integration lets any Solana program add privacy
6. **"Yield while shielded"** - Reward accumulator is unique to Zorb

### For Technical Reviewers

1. **Indexed Merkle Tree**: Aztec-style sorted linked list for O(log n) non-membership proofs
2. **Three-Tier Circuit Architecture**: Notes → Private Roster → Public Reward Registry
3. **Position-Independent Nullifiers**: Orchard-model design for tree flexibility
4. **Parallel Proof Generation**: Transaction + nullifier proofs run simultaneously
5. **Leader/Follower Tab Coordination**: Web Locks-based election for multi-tab sync

### For Sponsors

- **Light Protocol**: Different approach (indexed MT vs compressed accounts) but complementary
- **Helius**: Heavy RPC usage for tree state fetching
- **QuickNode**: Compatible with any Solana RPC provider

---

## Appendix: File Locations

**Circuits**:
- `/Users/atian/p/_49ers/zorb-workspace/app/packages/circuits/`

**Programs**:
- `/Users/atian/p/_49ers/zorb-workspace/zore/programs/`

**Mining**:
- `/Users/atian/p/_49ers/zorb-workspace/ore/`

**Wallet SDK**:
- `/Users/atian/p/_49ers/zorb-workspace/app/packages/zorb-wallet-react/`

**Stress Test**:
- `/Users/atian/p/_49ers/zorb-workspace/app/packages/stress-test/`

**Stress Test UI** (to extract for Break Zorb):
- `/Users/atian/p/_49ers/zorb-workspace/app/apps/zorb-cash/src/components/pages/stress-test/`

---

*Analysis based on comprehensive exploration of ~50,000+ lines across app/, zore/, and ore/ directories, plus competitive analysis of 97 hackathon repositories.*

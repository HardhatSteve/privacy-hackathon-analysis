# Zorb Technical Capabilities - Comprehensive Analysis

**Analysis Date**: January 31, 2026
**Purpose**: Identify hackathon submission opportunities based on Zorb's technical differentiators

---

## Executive Summary

Zorb is the most technically sophisticated privacy protocol analyzed in the Solana Privacy Hackathon 2026. While Protocol-01 and cloakcraft have broader product suites, **Zorb's core cryptographic infrastructure is more advanced**:

| Capability | Zorb | Best Competitor |
|------------|------|-----------------|
| Nullifier Storage | **Indexed Merkle Tree** (Aztec-style) | PDAs (Privacy Cash, velum) |
| Batch Efficiency | **4/16/64 nullifiers per proof** | None |
| Multi-Asset Privacy | **4 assets per transaction** | 1-2 assets |
| Yield Accrual | **Rewards while shielded** | None |
| LST Support | **Cross-LST swaps privately** | None |
| Circuit Constraints | **35,620 (optimized)** | 50K-200K+ typical |

---

## 1. ZK Circuit Architecture

### 1.1 Primary Transaction Circuits

| Circuit | Constraints | Inputs | Outputs | Use Case |
|---------|-------------|--------|---------|----------|
| `transaction2` | ~28,000 | 2 | 2 | Simple transfers |
| `transaction4` | ~35,620 | 4 | 4 | Standard operations |
| `transaction16` | ~200,000 | 16 | 2 | High-volume batching |

**Key Design Decisions**:
- **Three-Tier Routing Architecture**:
  - Tier 1 (Notes): Input/output UTXO notes
  - Tier 2 (Private Roster): 4 asset slots with hidden routing
  - Tier 3 (Public Reward Registry): 8-line privacy set for yield tracking
- **One-Hot Selectors**: Binary arrays ensure only one slot selected per operation without revealing which
- **Position-Independent Nullifiers**: Orchard-model design where nullifiers don't depend on tree position

### 1.2 Nullifier Circuits (Anti-Double-Spend)

| Circuit | Constraints | Nullifiers | Purpose |
|---------|-------------|------------|---------|
| `nullifierNonMembership4` | ~29,104 | 4 | Non-membership proof |
| `nullifierBatchInsert4` | ~212,000 | 4 | Batch tree insertion |
| `nullifierBatchInsert16` | ~800,000 | 16 | High throughput insertion |
| `nullifierBatchInsert64` | ~3.2M | 64 | Maximum batch |

**The Key Innovation**: Zorb's indexed merkle tree enables efficient ZK non-membership proofs by maintaining nullifiers in sorted order with "low element" pointers. This is the same technique used by Aztec Protocol—**no other Solana competitor uses this pattern**.

### 1.3 Mining/Reward Circuits

| Circuit | Constraints | Purpose |
|---------|-------------|---------|
| `shieldedClaim` | ~8,500 | Claim mining rewards privately |
| `shieldedDeploy` | ~12,000 | Bind mining deployment to wallet |

**MINING_DOMAIN Separator**: Prevents cross-contamination between regular notes and mining commitment storage.

### 1.4 Cryptographic Primitives

| Primitive | Implementation | Purpose |
|-----------|----------------|---------|
| Poseidon | circomlib | Commitments, nullifiers, tree hashing |
| BN254 | Native Groth16 | ZK proof system |
| X25519 | libsodium-compatible | Note encryption key exchange |
| XChaCha20-Poly1305 | AEAD | Authenticated note encryption |
| BIP44/BIP39 | Zcash Sapling-style | Key derivation hierarchy |

---

## 2. Indexed Merkle Tree (Unique Differentiator)

### 2.1 Architecture

```
Standard Merkle Tree (competitors):
├─ Append-only insertions
├─ Cannot prove non-membership efficiently
├─ Requires storing all nullifiers as PDAs
└─ Cost: ~0.00089 SOL per nullifier PDA

Zorb Indexed Merkle Tree:
├─ Sorted linked list of nullifiers
├─ Each leaf: { value, next_value, next_index }
├─ ZK range-proof for non-membership
├─ Single account stores 2^26 nullifiers (~67M)
└─ Cost: ~$0 marginal cost per nullifier
```

### 2.2 Non-Membership Proof Flow

```
To prove nullifier X is NOT in tree:
1. Find "low nullifier" Y where: Y < X < next(Y)
2. Provide merkle proof for Y's position
3. Circuit verifies:
   ├─ Merkle proof validates Y's inclusion
   ├─ Range proof confirms: Y < X < next(Y)
   └─ Therefore: X is NOT in the tree
```

### 2.3 Cost Comparison

| Metric | Zorb | Privacy Cash / Velum |
|--------|------|----------------------|
| Nullifier storage | Shared account | Individual PDAs |
| Rent per nullifier | ~$0 | ~$0.13 |
| 100 transactions | ~$0 rent | ~$13 locked forever |
| Rent reclaimable | Yes (epoch cleanup) | No |
| Max nullifiers | 67 million | Limited by rent |

---

## 3. On-Chain Programs

### 3.1 Shielded Pool (Hub)

**Program ID**: `zrbus1K97oD9wzzygehPBZMh5EVXPturZNgbfoTig5Z`

**Core Responsibilities**:
- ZK Groth16 proof verification (BN254 alt_bn128 syscalls)
- Three merkle tree management (commitment, receipt, nullifier)
- Hub-centric fee calculation and validation
- CPI orchestration to pool programs

**Three Merkle Trees**:

| Tree | Height | Purpose | Leaves |
|------|--------|---------|--------|
| Commitment | 26 | Note existence proofs | ~67M |
| Receipt | 26 | Immutable audit trail | ~67M |
| Nullifier (Indexed) | 26 | Anti-double-spend | ~67M |

**Transaction Flow (3-step chunked upload)**:
```
1. InitTransactSession → Create temporary PDA (up to 4KB)
2. UploadTransactChunk → Upload proof + params in chunks
3. ExecuteTransact → Verify proofs, create nullifiers, append commitments
4. CloseTransactSession → Reclaim rent
```

### 3.2 Token Pool

**Program ID**: `tokucUdUVP8k9xMS98cnVFmy4Yg3zkKmjfmGuYma8ah`

**Features**:
- 1:1 SPL token vault
- CPI-based deposit/withdrawal from shielded pool hub
- Reward finalization every 750 slots (~5 min)
- Pending deposits/withdrawals for privacy timing isolation

### 3.3 Unified SOL Pool (Multi-LST)

**Program ID**: `unixG6MuVwukHrmCbn4oE8LAPYKDfDMyNtNuMSEYJmi`

**Supported Pool Types**:
- WSOL (Wrapped SOL, 1:1)
- SplStakePool (Jito, Sanctum)
- Marinade
- Lido

**Key Innovation - Cross-LST Fungibility**:
```
User deposits 10 vSOL (rate: 1.05 SOL each)
├─ Credits: 10.5 virtual SOL equivalent
└─ Commitment reflects: 10.5 SOL value

User withdraws 10 jitoSOL (rate: 1.04 SOL each)
├─ Debits: ~10.4 virtual SOL equivalent
└─ Net effect: Converted vSOL → jitoSOL PRIVATELY
```

**Privacy Benefit**: LST swap is hidden—chain only sees deposits/withdrawals, not asset conversion.

### 3.4 Swap Intent

**Purpose**: Intent-based DEX integration for Jupiter swaps

**Flow**:
1. Create swap intent with target route
2. Unshield funds to intent escrow
3. Relayer/user executes swap via Jupiter
4. Output tokens re-shielded

---

## 4. TypeScript SDK (`@49labs/circuits`)

### 4.1 Core APIs

```typescript
// Transaction Building (Functional API)
buildTransaction({
  config: { commitmentRoot, poolConfigs, relayerConfig },
  deposits: [...],     // Shielding
  inputs: [...],       // Spending notes
  outputs: [...],      // Recipients
  withdraws: [...],    // Unshielding
  drainTo: paymentAddress
})

// Key Management
KeyManager.create()      // New wallet
KeyManager.restore()     // Recovery
deriveAccountFromSeed()  // Zcash-style hierarchy

// Proof Generation
loadArtifacts(name)      // WASM + zkey loading
RapidsnarkProver         // 4-10x faster than snarkjs
createProver()           // Auto-detect best prover
```

### 4.2 Circuit Artifacts

| Artifact | Size | CDN |
|----------|------|-----|
| transaction4.wasm | 4.0 MB | circuits.zorb.cash |
| transaction4.zkey | 39.6 MB | circuits.zorb.cash |
| nullifierBatchInsert4.wasm | 2.9 MB | circuits.zorb.cash |
| nullifierBatchInsert4.zkey | 79.1 MB | circuits.zorb.cash |

### 4.3 Proof Generation Times

| Prover | transaction4 | nullifierNonMembership4 |
|--------|--------------|-------------------------|
| snarkjs (WASM) | ~38 seconds | ~25 seconds |
| RapidSNARK (native) | ~4 seconds | ~3 seconds |
| Remote prover | ~1.1 seconds | ~0.8 seconds |

---

## 5. React Wallet SDK (`@49labs/zorb-wallet-react`)

### 5.1 Core Hooks

**Wallet Management**:
- `useZorbWallet()` - Primary hook with all functionality
- `useZorbWallets()` - Multi-wallet support
- `useGeneratedAddresses()` - Shielded address management

**Transaction Operations**:
- `useShield()` - Deposit into shielded pool
- `useSend()` - Private transfers
- `useUnshield()` - Withdraw to public address

**State & Sync**:
- `useZorbBalance(assetId)` - Per-asset balance
- `useZorbSyncHealth()` - Sync status with health levels
- `useCircuitPreloader()` - Background artifact loading

### 5.2 Architecture Features

- **Leader/Follower Tab Coordination**: Web Locks-based election for multi-tab sync
- **SQLite WASM Storage**: Notes, transactions, addresses in OPFS
- **Parallel Proof Generation**: Transaction + nullifier proofs simultaneously
- **TanStack Query Integration**: Automatic caching, deduplication

---

## 6. Stress Testing Infrastructure

### 6.1 Execution Modes

| Mode | Description | TPS |
|------|-------------|-----|
| Proof-only | Generate proofs without on-chain submission | 10-20 |
| Full | Complete 3-step on-chain flow | 0.5-2 |
| Relayer | True end-to-end via relayer | 0.5-1 |

### 6.2 Predefined Scenarios

| Scenario | Transactions | Concurrency | Expected Success |
|----------|-------------|-------------|------------------|
| smoke | 3 | 1 | 100% |
| basic-load | 10 | 3 | 95%+ |
| concurrent | 25 | 5 | 90%+ |
| high-throughput | 100 | 10 | 85%+ |
| endurance | 200 | 3 | 90%+ |

### 6.3 CLI Commands

```bash
# Proof generation benchmark
bun run stress-test run --network devnet -t 100 -c 10 --mode proof-only --prover rapidsnark

# Full transaction testing
bun run stress-test run --network devnet -t 20 -c 5 --mode full -o results.json

# Predefined scenario
bun run stress-test scenarios run high-throughput
```

---

## 7. ZORB Mining Protocol

### 7.1 Overview

**Program ID**: `boreXQWsKpsJz5RR9BMtN8Vk4ndAk23sutj8spWYhwk`

**Core Mechanics**:
- 5×5 game grid (25 squares)
- Deploy SOL to squares during 150-slot deploy phase
- Winner selection via slot-hash RNG (decentralized)
- +4 ZORB per round to winners
- 90% of losing deployments to winners, 10% vaulted

### 7.2 Unique Features

- **Decentralized RNG**: XOR of slot hashes from multiple recent slots
- **Staking System**: Stake ZORB (burned), claim yield from bury operations
- **Automated Deployments**: Bot configuration support
- **Motherlode Jackpots**: 1/625 chance for bonus pool

### 7.3 Privacy Integration Potential

Currently **no privacy integration**, but could add:
- Shielded ZORB staking via Zore
- Private mining deployments
- Private yield harvesting

---

## 8. Hackathon Submission Opportunities

### 8.1 Primary Submission: "Zorb Privacy Protocol"

**Tracks**: Private Payments ($15K) + Privacy Tooling ($15K)

**Unique Differentiators vs Competition**:

| Feature | Zorb | Protocol-01 | cloakcraft | velum |
|---------|------|-------------|------------|-------|
| Nullifier storage | Indexed MT | PDAs | Light Protocol | PDAs |
| Batch proofs | 4/16/64 | None | None | None |
| Multi-asset | 4 per tx | 1 | 1 | 1 |
| Yield accrual | Yes | No | No | No |
| LST support | Multi-LST | No | No | No |
| Rent reclaimable | Yes | No | No | No |

**Talking Points**:
1. "Zero PDA rent" - Only privacy protocol without per-nullifier account creation
2. "Batch efficiency" - 64 nullifiers per proof vs 1 for competitors
3. "Yield while shielded" - Unique reward accumulator system
4. "Cross-LST privacy" - Convert between LSTs without visibility
5. "Programmable privacy" - CPI integration for any Solana program

### 8.2 Secondary Submission: "Break Zorb" Demo

**Track**: Privacy Tooling ($15K)

**Demo Concept**: Interactive stress test showing Zorb's throughput advantages

**Features to Highlight**:
- Real-time TPS dashboard
- Cost comparison (Zorb vs competitors)
- Finality comparison (Zorb vs Zcash: 400ms vs 12.5 min)

### 8.3 Tertiary Submission: "ZORB Private Mining"

**Track**: Open Track ($18K)

**Opportunity**: Add privacy layer to existing mining protocol

**Implementation Path**:
1. Integrate shielded pool for private ZORB staking
2. Private deployment interface
3. Private yield claiming

### 8.4 SDK/Tooling Submission

**Track**: Privacy Tooling ($15K)

**Packages to Open Source**:
- `@zorb/circuits` - ZK circuit library with TypeScript utilities
- `@zorb/wallet-react` - React hooks for privacy wallet
- `@zorb/shielded-pool-client` - Solana client SDK
- `@zorb/stress-test` - Throughput benchmarking tools

---

## 9. Competitive Analysis vs Top Projects

### 9.1 vs Protocol-01 (Threat: CRITICAL)

| Aspect | Zorb Advantage | Protocol-01 Advantage |
|--------|----------------|----------------------|
| Nullifier efficiency | **Indexed MT vs PDAs** | - |
| Multi-asset | **4 assets per tx** | - |
| Yield | **Rewards while shielded** | - |
| LST support | **Cross-LST swaps** | - |
| Product completeness | - | Browser extension, mobile app |
| Stealth addresses | - | ECDH stealth addresses |
| Test coverage | - | 2,175+ tests |

### 9.2 vs cloakcraft (Threat: CRITICAL)

| Aspect | Zorb Advantage | cloakcraft Advantage |
|--------|----------------|---------------------|
| Nullifier efficiency | **Indexed MT** | Light Protocol compression |
| Batch proofs | **4/16/64 per proof** | - |
| Multi-asset | **4 per tx** | - |
| DeFi integration | - | AMM, perps, governance |
| Note consolidation | - | 3→1 merge |

### 9.3 vs velum (Threat: HIGH)

| Aspect | Zorb Advantage | velum Advantage |
|--------|----------------|-----------------|
| Nullifier efficiency | **Indexed MT vs PDAs** | - |
| Rent | **Reclaimable** | Permanent lock |
| Production status | - | **Mainnet live** |
| Payment links | - | Shareable URLs |

---

## 10. Technical Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Trusted setup not performed | HIGH | Use existing powers-of-tau ceremony |
| Audit incomplete | HIGH | Document audit findings, fix applied |
| Centralized relayer | MEDIUM | Federated relayer network roadmap |
| Proof generation latency | MEDIUM | Remote prover service |
| Circuit artifact size | LOW | CDN with SHA256 verification |

---

## Appendix A: File Structure Reference

```
app/packages/
├── circuits/                    # ZK circuits + TypeScript
│   ├── circom/                  # Circom source files
│   │   ├── transaction.circom  # Main transaction circuit
│   │   ├── nullifierBatchInsert.circom
│   │   └── shieldedClaim.circom
│   ├── src/                     # TypeScript utilities
│   │   ├── transaction/        # Builder, planner
│   │   ├── keys/               # KeyManager
│   │   └── prover/             # RapidSNARK integration
│   └── artifacts/              # Compiled WASM/zkeys
├── zorb-wallet-react/          # React wallet SDK
│   ├── src/hooks/              # 40+ hooks
│   └── src/worker/             # Leader/follower coordination
├── stress-test/                # Throughput testing
└── [5 protocol clients]/       # Codama-generated SDKs

zore/programs/
├── shielded-pool/              # Main privacy hub
├── token-pool/                 # SPL token vault
├── unified-sol-pool/           # Multi-LST vault
└── swap-intent/                # DEX integration

ore/                            # Mining protocol
├── program/                    # On-chain program
├── cli/                        # CLI tools
└── docs/                       # Comprehensive docs
```

---

## Appendix B: Program IDs

| Program | Mainnet | Devnet |
|---------|---------|--------|
| Shielded Pool | `zrbus1K97oD9wzzygehPBZMh5EVXPturZNgbfoTig5Z` | Same |
| Token Pool | `tokucUdUVP8k9xMS98cnVFmy4Yg3zkKmjfmGuYma8ah` | Same |
| Unified SOL Pool | `unixG6MuVwukHrmCbn4oE8LAPYKDfDMyNtNuMSEYJmi` | Same |
| ZORB Mining | `boreXQWsKpsJz5RR9BMtN8Vk4ndAk23sutj8spWYhwk` | `7c6v7zwSycQGDz7RSEXkY3Xakdspx5DTPNkcELxbWT3Z` |

---

*Analysis based on comprehensive exploration of ~50,000 lines across app/, zore/, and ore/ directories.*

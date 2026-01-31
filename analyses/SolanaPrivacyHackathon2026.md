# SolanaPrivacyHackathon2026 Analysis

**Project Name:** Quantish Prediction Privacy Relay
**Repository:** SolanaPrivacyHackathon2026
**Analysis Date:** January 31, 2026

---

## 1. Project Overview

Quantish is a **privacy-preserving prediction market relay** built for Solana. The project combines three independent privacy layers to protect user identity, order amounts, and execution integrity when trading on prediction markets (Kalshi/DFlow).

### Core Value Proposition
- **Wallet Unlinkability:** Break on-chain connection between user wallet and trading position
- **Hidden Order Amounts:** Relay operator cannot see individual order sizes
- **Verifiable Execution:** ZK proofs ensure correct batch execution and share distribution

### Architecture Summary
```
User Wallet --> [Privacy Cash ZK Pool] --> Ephemeral Wallet --> Relay
                     |                            |
                     v                            v
              Breaks wallet link          [Arcium MPC] encrypts amounts
                                                  |
                                                  v
                                          [DFlow/Kalshi] executes trade
                                                  |
                                                  v
                                          [Noir ZK Proof] verifies distribution
```

---

## 2. Track Targeting

### Primary Track
**Track 3 - Open Track ($18k)**
> Intersection of prediction markets and privacy tooling

### Sponsor Bounties Targeted

| Sponsor | Bounty | Amount | Integration |
|---------|--------|--------|-------------|
| **Privacy Cash** | Best Integration to Existing App | $6,000 | ZK shielded pool for wallet unlinkability |
| **Aztec/Noir** | Best Overall / Most Creative | $5,000 / $2,500 | Noir ZK circuits for batch verification |
| **Arcium** | Best Overall App / Best Integration | $5,000 / $3,000 | MPC for encrypted order amounts on devnet |
| **Helius** | Best Privacy Project with Helius | TBD | High-performance RPC for Solana connectivity |
| **PNP Exchange** | Private Prediction Markets | $1,000 | Private prediction market infrastructure |

**Total Bounty Potential:** Up to $22,500 across multiple sponsors

---

## 3. Tech Stack

### Languages
- **TypeScript/JavaScript** (Backend + Frontend)
- **Rust** (Solana programs)
- **Noir** (ZK circuits)

### Frameworks & Libraries

| Layer | Technology | Version/Details |
|-------|------------|-----------------|
| **Frontend** | React + Vite + TailwindCSS + Zustand | React 18.2, Vite 5.0 |
| **Backend** | Node.js + Express + TypeScript | ES Modules |
| **Blockchain** | Solana + Anchor | 0.32.1 |
| **ZK Proving** | Noir + UltraHonk (Aztec bb.js) | Noir 1.0.0-beta.18 |
| **MPC** | Arcium SDK + arcis-imports | 0.5.4 |
| **Privacy Pool** | Privacy Cash SDK | 1.1.9 |
| **Cryptography** | @noble/curves, poseidon-lite | x25519, Poseidon hash |
| **Wallet** | @solana/wallet-adapter | 0.15+ |

### Infrastructure
- **Railway** for deployment
- **Helius RPC** for Solana connectivity
- **Solana Devnet** for MPC testing
- **Solana Mainnet** for live trading

---

## 4. Crypto Primitives

### ZK Circuits (Noir)

**Batch Verifier Circuit:** `/circuits/obsidian_batch_verifier/`
- **Hash Function:** Poseidon (BN254 curve)
- **Merkle Tree:** Depth 5, max 32 orders per batch
- **Constraints Proven:**
  1. Commitment hash verification (Poseidon hash_5)
  2. Merkle inclusion proof
  3. Market and side match batch parameters
  4. Distribution hash matches allocation
  5. Proportional share allocation: `shares_i * total_usdc == usdc_i * total_shares`
  6. Total sums match

```noir
struct OrderCommitment {
    market_id: Field,
    side: Field,
    usdc_amount: Field,
    distribution_hash: Field,
    salt: Field,
}
```

### Encryption (Arcium MPC)

**Client-Side Encryption:**
- **Key Exchange:** x25519 ECDH
- **Cipher:** XOR cipher (demo) / Rescue cipher (production)
- **Nonce:** 16 bytes random
- **Plaintext Format:** `marketIdHash(16) + side(1) + usdcAmount(8) + distributionHash(16) + salt(8) + walletLo(16) + walletHi(16)`

**MPC Computation Definitions:**
| Circuit | Purpose | Offset |
|---------|---------|--------|
| `init_batch` | Initialize encrypted batch state | 3167146940 |
| `add_to_batch` | Add encrypted order to running total | 448552201 |
| `reveal_batch_total` | Reveal only batch sum to relay | 1072107248 |
| `compute_distribution` | Compute pro-rata share for single order | 623176224 |

### Privacy Pool (On-Chain)

**Privacy Pool Program:** `AfTSjfnT7M88XipRjPGLgDCcqcVfnrePrtuvNBF74hhP`
- **Hash:** Poseidon (BN254) via `light-poseidon` + `ark-bn254`
- **Merkle Tree:** Depth 5, stores up to 32 commitments on-chain
- **Nullifier Set:** Prevents double-spending
- **Commitment:** `hash(secret, amount)`

---

## 5. Solana Integration

### Deployed Programs

| Program | Address | Network | Purpose |
|---------|---------|---------|---------|
| **MPC Program** | `8postM9mUCTKTu6a1vkrhfg8erso2g8eHo8bmc9JZjZc` | Devnet | Arcium MPC batch coordination |
| **MPC Program (Alt)** | `9P88Ayn2WKLWhtCgUv8A3YkxTWDRnoU3QSLdWftaWtAo` | Devnet | Alternative deployment |
| **Arcium Program** | `F3G6Q9tRicyznCqcZLydJ6RxkwDSBeHWM458J7V6aeyk` | Devnet | Arcium core MXE |
| **Privacy Pool** | `AfTSjfnT7M88XipRjPGLgDCcqcVfnrePrtuvNBF74hhP` | Devnet | ZK shielded pool |
| **Relay Wallet** | `9mNa6ScZtenajirheMFSZLUkAQtbBA7r1MNB8SahiveS` | Mainnet | Order execution wallet |

### On-Chain Accounts

**MXE Account:** `CUx5EJ6PtgWTHfiqmYbMgeDepaiqj1xu3Y2C6Q11Nqkb`
- Cluster Offset: 123
- Contains encryption key for MPC

**Computation Definition PDAs:**
- `init_batch`: `HcF78B6k1xKpeGbJ4ec1gtYd8WwHor47ConXEy3cJ8iB`
- `add_to_batch`: `ATH9uoxHikGiFSMa13dpkkpoJjT5aq6aACJWRsCStFyr`
- `reveal_batch_total`: `FhtdfFsXPjfrTLiNgu3sSsRgHphHRanSPHmc5jwnkrKm`
- `compute_distribution`: `J3uC4D1xxX49ieNdq3EvphsCJY7htPVjZCfn5dVV9ygo`

### Program Architecture

**Anchor Program (obsidian_mpc):**
```rust
// Instructions
- init_init_batch_comp_def
- init_add_to_batch_comp_def
- init_reveal_batch_total_comp_def
- init_compute_distribution_comp_def
- create_batch
- record_order
- close_batch
- record_execution
- record_distribution
- mark_distributed

// State
pub struct Batch {
    authority: Pubkey,
    market_id: String,
    side: u8,
    status: BatchStatus,  // Open, Closed, Executed, Distributing, Completed
    order_count: u8,
    total_usdc: u64,
    total_shares: u64,
    created_at: i64,
    distributions_completed: u8,
}
```

---

## 6. Sponsor Bounty Targeting

### Privacy Cash Integration
- **SDK Usage:** `privacycash` npm package v1.1.9
- **Flow:** Deposit USDC -> ZK Pool -> Withdraw to ephemeral wallet
- **Fee:** 0.35% + ~0.006 SOL
- **Privacy Guarantee:** Complete wallet unlinkability via ZK proofs
- **Integration File:** `src/services/privacy-cash.ts`

### Aztec/Noir Integration
- **Circuit:** Batch verification with Poseidon hashing
- **Backend:** UltraHonk prover via `@aztec/bb.js`
- **Version:** Noir 1.0.0-beta.18, nightly bb.js
- **Proof Size:** ~50KB default, ~25KB with 8x blowup
- **Integration File:** `src/services/prover.ts`

### Arcium MPC Integration
- **SDK:** `arcis-imports` v0.5.4, `arcium-anchor`
- **Network:** Solana Devnet, Cluster 123
- **4 Computation Definitions** registered on-chain
- **Encryption:** x25519 ECDH + XOR cipher (demo)
- **Limitation:** No active MPC nodes on devnet (infrastructure dependency)
- **Integration Files:** `src/services/arcium-mpc.ts`, `arcium-relay/encrypted-ixs/src/lib.rs`

### Helius RPC Integration
- **Usage:** Environment variable `SOLANA_RPC_URL` / `HELIUS_RPC_URL`
- **Purpose:** High-performance Solana connectivity
- **Integration:** Via `@solana/web3.js` Connection

---

## 7. Alpha/Novel Findings

### Novel Architecture: Triple Privacy Layer
This is one of the few hackathon submissions combining **three independent privacy technologies** in a single application:
1. **Wallet privacy** (Privacy Cash)
2. **Amount privacy** (Arcium MPC)
3. **Execution integrity** (Noir ZK)

### Blind Batch Operator Pattern
The relay operates as a **blind batch operator** - it can coordinate orders without seeing individual amounts. This is a novel use case for MPC in prediction markets.

### Privacy Guarantees Matrix
| Data | Relay Sees | MPC Sees | On-Chain Visible |
|------|------------|----------|------------------|
| User Identity | NO | NO | NO (via Privacy Cash) |
| Market ID | YES | YES | YES |
| Side | YES | YES | YES |
| Order Amount | **NO** | YES | NO |
| Batch Total | YES (after reveal) | YES | YES |
| Distribution | **NO** | YES | After reveal |

### Production-Ready Patterns
- Proper Anchor program structure with events
- Merkle tree with Poseidon hashing matching between Noir and Rust
- Multi-wallet distribution support (up to 10 destinations per order)
- Comprehensive error handling and status tracking

### Limitations Acknowledged
- MPC integration blocked by Arcium devnet having no active nodes
- Privacy pool limited to 32 deposits (demo mode)
- XOR cipher instead of Rescue for demo encryption

---

## 8. Strengths and Weaknesses

### Strengths

1. **Comprehensive Privacy Stack**
   - Three independent privacy layers with clear separation
   - Each layer has a distinct, well-defined purpose

2. **Real Deployments**
   - Multiple programs deployed to Solana devnet
   - MXE account and computation definitions initialized
   - Working mainnet relay wallet

3. **Production-Quality Code**
   - Well-structured Anchor programs with events and proper error handling
   - TypeScript backend with type safety
   - React frontend with wallet integration

4. **Strong Documentation**
   - Detailed README with architecture diagrams
   - Demo script with timing
   - Status documents tracking integration progress

5. **Multiple Sponsor Integrations**
   - Privacy Cash, Arcium, Noir, Helius all integrated
   - Clear bounty targeting strategy

6. **Demo Materials**
   - Video demo included (demo.mp4)
   - Live website at quantish.live
   - Telegram bot integration

### Weaknesses

1. **MPC Not Fully Functional**
   - Arcium devnet has no active nodes
   - MPC round-trip cannot be demonstrated live
   - Falls back to revealing architecture rather than live operation

2. **Privacy Pool Limitations**
   - Only 32 deposits supported (demo mode)
   - Merkle tree stored entirely on-chain (not scalable)
   - No actual ZK proof verification for withdrawals

3. **Encryption Demo Mode**
   - XOR cipher instead of proper Rescue cipher
   - Simplified hash function for demonstration

4. **Incomplete Circuit**
   - Privacy pool `src/lib.rs` exists but no matching verification circuit
   - Batch verifier circuit does not verify actual signatures

5. **External Dependencies**
   - Heavy reliance on Privacy Cash SDK
   - Arcium infrastructure dependency
   - DFlow/Kalshi market access required

---

## 9. Threat Level Assessment

### **THREAT LEVEL: MODERATE**

**Rationale:**

| Factor | Assessment |
|--------|------------|
| **Technical Depth** | HIGH - Multiple ZK circuits, MPC integration, Solana programs |
| **Completeness** | MEDIUM - MPC blocked by infrastructure, some demo-mode shortcuts |
| **Novelty** | HIGH - Triple privacy layer architecture is unique |
| **Bounty Coverage** | HIGH - Targets 5 sponsors with real integrations |
| **Demo Quality** | HIGH - Video, live site, Telegram bot |
| **Deployment Status** | MEDIUM - Programs deployed but MPC non-functional |

**Competitive Position:**
- Strong contender for **Privacy Cash** bounty (real SDK integration)
- Strong contender for **Arcium** bounty (complete on-chain setup, code ready)
- Moderate contender for **Noir** bounty (working circuit but not novel)
- Moderate contender for **Open Track** (good concept but MPC limitation hurts demo)

---

## 10. Implementation Completeness

### Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend** | 95% | Full React app with wallet integration, two demo tabs |
| **Backend** | 90% | Express server with batch, proof, MPC services |
| **Privacy Cash Integration** | 100% | Full SDK integration, working flow |
| **Noir Circuit** | 85% | Batch verifier complete, no signature verification |
| **Arcium MPC Program** | 100% | Deployed, MXE initialized, comp defs registered |
| **Arcium MPC Runtime** | 0% | Blocked by no active devnet nodes |
| **Privacy Pool Program** | 70% | Deposit works, withdrawal ZK proof missing |
| **DFlow/Kalshi Integration** | 80% | Market data, execution, distribution |
| **Documentation** | 95% | Comprehensive README, status docs, demo script |

### Missing for Production
1. Actual ZK proof verification for privacy pool withdrawals
2. Active Arcium MPC nodes
3. Rescue cipher instead of XOR
4. Scalable Merkle tree (off-chain storage)
5. Signature verification in batch circuit

---

## Summary

**Quantish** is a well-architected privacy relay that demonstrates sophisticated understanding of ZK proofs, MPC, and Solana programming. The triple-privacy-layer concept is novel and the codebase shows production-quality patterns.

The main weakness is the **Arcium MPC dependency** - the most innovative part of the project (blind batch operator) cannot be demonstrated live due to devnet infrastructure limitations. However, the on-chain setup is complete and the code is ready to run when nodes become available.

**Bounty Predictions:**
- Privacy Cash: **HIGH** likelihood (strong integration)
- Arcium: **MEDIUM-HIGH** (complete setup, limited demo)
- Noir/Aztec: **MEDIUM** (working but not exceptional)
- Open Track: **MEDIUM** (concept stronger than demo)

This submission represents a serious competitive threat, particularly for the Privacy Cash and Arcium bounties where the integration work is most complete.

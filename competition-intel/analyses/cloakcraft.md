# CloakCraft - Hackathon Competitive Analysis


**Analysis Date:** January 31, 2026

---

## 1. Project Overview

CloakCraft is a comprehensive privacy-preserving DeFi protocol on Solana featuring:
- **Private Token Transfers** via UTXO-like note system
- **Private AMM Swaps** with constant product and StableSwap curves
- **Private Limit Orders** (internal orderbook)
- **Private Perpetual Futures** with up to 100x leverage
- **Private Governance Voting** with encrypted votes and threshold decryption
- **Note Consolidation** (merge 3 notes into 1)

The system uses Groth16 ZK proofs generated via Circom circuits, with commitments stored in Light Protocol's compressed state trees for 5000x storage cost reduction.

**Tagline:** "Privacy-preserving decentralized finance protocol on Solana using zero-knowledge proofs"

---

## 2. Track Targeting Assessment

### Primary Track: Privacy Tooling ($15k)
**Confidence: HIGH (90%)**

CloakCraft is a foundational privacy infrastructure layer providing:
- Full SDK (`@cloakcraft/sdk`) with comprehensive TypeScript API
- React hooks library (`@cloakcraft/hooks`)
- UI component library (`@cloakcraft/ui`)
- Modular circuit architecture for extensibility
- Light Protocol integration for compressed state

### Secondary Track: Private Payments ($15k)
**Confidence: HIGH (85%)**

Core private transfer functionality:
- Shield (public to private)
- Private transfer (1x2, 2x2)
- Unshield (private to public)
- Multi-token SPL support
- Stealth address recipient privacy

### Tertiary Track: Open Track ($18k)
**Confidence: MODERATE (60%)**

Comprehensive DeFi primitives:
- Private AMM (ConstantProduct + StableSwap)
- Private Perps with Pyth oracle integration
- Private Governance with multiple voting modes
- External DEX adapter architecture

---

## 3. Tech Stack

### ZK System
| Component | Technology |
|-----------|------------|
| Circuit Language | Circom 2.1 |
| Proof System | Groth16 (via snarkjs 0.7.5) |
| Curve | BabyJubJub (twisted Edwards) |
| Hash Function | Poseidon (ZK-friendly) |
| On-chain Verifier | groth16-solana 0.2.0 |
| Alternative | gnark-solana (Go Groth16 for Solana) |

### Blockchain Integration
| Component | Technology |
|-----------|------------|
| Framework | Anchor 0.32.1 |
| Solana SDK | 2.1 |
| State Compression | Light Protocol SDK 0.17.1 |
| Indexer | Helius RPC |
| Oracle | Pyth (pyth-solana-receiver-sdk 1.1.0) |

### Frontend/SDK
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14/15 |
| Language | TypeScript 5.3+ |
| State Management | React hooks |
| Crypto Libraries | @noble/curves, @noble/hashes, @noble/ciphers |
| Circuit Interface | circomlibjs 0.1.7 |

### Code Volume
| Component | Lines of Code |
|-----------|---------------|
| Anchor Program (Rust) | ~20,625 |
| TypeScript SDK | ~27,533 |
| Circom Circuits | ~4,142 |
| **Total** | **~52,300** |

---

## 4. Cryptographic Primitives

### Core Primitives
| Primitive | Implementation | Usage |
|-----------|---------------|-------|
| **Poseidon Hash** | circomlib, light-hasher | Commitments, nullifiers |
| **BabyJubJub Curve** | circomlib | Stealth addresses, EdDSA |
| **Stealth Addresses** | Custom (hash-based) | Recipient privacy |
| **Groth16 Proofs** | snarkjs/groth16-solana | ZK verification |
| **ChaCha20** | @noble/ciphers | Note encryption |
| **Merkle Trees** | Light Protocol (32 levels) | Commitment inclusion |

### Commitment Scheme
```
commitment = Poseidon(domain=1, stealth_pub_x, token_mint, amount, randomness)
nullifier = Poseidon(domain=2, nullifier_key, commitment, leaf_index)
nullifier_key = Poseidon(domain=4, spending_key, 0)
```

### Domain Separation Constants
- COMMITMENT_DOMAIN = 1
- SPENDING_NULLIFIER_DOMAIN = 2
- NULLIFIER_KEY_DOMAIN = 4
- VOTE_NULLIFIER_DOMAIN = 0x10
- VOTE_COMMITMENT_DOMAIN = 0x11

---

## 5. Solana Integration

### Program Architecture
- **Program ID (Devnet):** `2VWF9TxMFgzHwbd5WPpYKoqHvtzk3fN66Ka3tVV82nZG`
- **Pattern:** Multi-phase transaction architecture (Append Pattern)
- **CPI Integration:** Light Protocol for compressed accounts

### Transaction Phases (Transfer Example)
1. Phase 0: Create PendingOperation + verify ZK proof
2. Phase 1: Verify commitment exists (Light Protocol read-only)
3. Phase 2: Create nullifier (prevents double-spend)
4. Phase 3: Process transfer/unshield
5. Phase 4+: Create output commitments
6. Final: Close pending operation

### Light Protocol Integration
- Uses `light-sdk` 0.17.1 with Anchor feature
- Stores commitments as compressed accounts
- Nullifier non-inclusion proofs via `getValidityProof`
- Commitment inclusion via `with_read_only_accounts`
- Helius indexer for merkle proof retrieval

### On-chain Verification
- ~200k compute units for Groth16 verification
- ~50k compute units for Merkle insert
- ~300k total for a complete transfer

---

## 6. Sponsor Bounty Targeting

### Potential Sponsor Alignments

| Sponsor | Bounty Relevance | Evidence |
|---------|-----------------|----------|
| **Light Protocol** | HIGH | Deep integration (light-sdk 0.17.1), compressed state storage |
| **Helius** | HIGH | Uses Helius RPC for indexing, merkle proofs |
| **Pyth** | MODERATE | Oracle integration for perps pricing |
| **Solana Foundation** | MODERATE | Native Solana program, SPL token support |
| **Anchor** | LOW | Standard Anchor usage (0.32.1) |

### SDK/Tooling Bounties
- Comprehensive TypeScript SDK with full API coverage
- React hooks library for wallet integration
- UI component library for easy integration

---

## 7. Alpha / Novel Findings

### Architectural Innovations

1. **Append Pattern for Multi-Phase ZK Transactions**
   - Novel transaction splitting to work within Solana's size limits
   - PendingOperation PDA binds all phases cryptographically
   - Prevents phase substitution attacks

2. **Private Perpetual Futures**
   - First private perps implementation on Solana
   - Integrates Pyth oracles for price feeds
   - Supports up to 100x leverage with ZK-proven positions

3. **Comprehensive Voting System**
   - Multiple reveal modes: Public, TimeLocked, PermanentPrivate
   - Homomorphic tally accumulation for encrypted votes
   - Vote change capability without revealing previous vote
   - Snapshot voting (notes not consumed) vs SpendToVote (tokens locked)

4. **TunnelCraft Relay Integration**
   - Uses Hyperswarm for IP-layer privacy
   - P2P transaction relay to hide origin IP
   - Protomux for protocol multiplexing

5. **gnark-solana Alternative**
   - Provides Go-based gnark proof system as alternative to snarkjs
   - Potentially faster proving times
   - Uses Sunspot for verification key generation

### Technical Differentiators

1. **Note Consolidation Circuit**
   - Merge up to 3 notes into 1 (consolidate_3x1)
   - Free operation (no protocol fee)
   - Reduces UTXO bloat

2. **StableSwap AMM Support**
   - Curve-style amplification parameter
   - Better for pegged asset pairs
   - Configurable amplification (100-1000)

3. **External DEX Adapter Architecture**
   - `transact_adapt` instruction for external DEX integration
   - Modular adapter system with versioning
   - Privacy-preserving swaps through external liquidity

---

## 8. Strengths and Weaknesses

### Strengths

| Category | Strength |
|----------|----------|
| **Completeness** | Full DeFi suite: transfers, AMM, perps, governance, orderbook |
| **Production Readiness** | All E2E tests passing on devnet (Jan 2025) |
| **Documentation** | Comprehensive CLAUDE.md, ARCHITECTURE.md, API docs |
| **Code Quality** | 52k+ lines, well-structured monorepo |
| **Testing** | Extensive test suite with 26+ passing tests |
| **Light Protocol** | Deep integration with compressed state |
| **Multi-Phase Pattern** | Solves Solana tx size limits elegantly |
| **Demo Video** | Has demo video (4.7MB mp4) |

### Weaknesses

| Category | Weakness | Severity |
|----------|----------|----------|
| **Commitment Inclusion** | CRITICAL: No verification that input commitment exists in state tree | CRITICAL |
| **Fake Commitment Attack** | Attackers can spend non-existent tokens | CRITICAL |
| **Trusted Setup** | Groth16 requires ceremony (PLONK migration planned) | HIGH |
| **VK Registration** | Voting VKs not registered on devnet | MODERATE |
| **Circuit Audit** | Circuits not audited | HIGH |
| **Proving Time** | 3-6 seconds per proof (acceptable but not ideal) | LOW |
| **Memory Usage** | 500MB-1GB for proof generation | MODERATE |

### Critical Security Vulnerability (From SECURITY_ANALYSIS.md)

**Attack Vector:** Fake Commitment Attack
1. Attacker generates random commitment (never deposited)
2. Computes correct nullifier for fake commitment
3. Generates valid ZK proof (mathematically correct)
4. Submits transaction to spend fake commitment

**Result:** Tokens minted out of thin air

**Status:** NOT PRODUCTION READY - Acknowledged in codebase

---

## 9. Threat Level Assessment

### Overall Threat Level: **CRITICAL**

| Factor | Assessment |
|--------|------------|
| Feature Completeness | CRITICAL - Most comprehensive DeFi privacy suite |
| Technical Sophistication | HIGH - Novel multi-phase pattern, perps, voting |
| Implementation Quality | HIGH - 52k lines, passing E2E tests |
| Documentation | HIGH - Extensive docs and CLAUDE.md |
| Hackathon Polish | HIGH - Demo video, clean README |
| Security Posture | LOW - Critical vulnerability acknowledged |
| Production Readiness | MODERATE - Works on devnet but has known security gaps |

### Competitive Threat Matrix

|---------|------------|
| **Transfers** | Equivalent - Both use UTXO/note model |
| **AMM** | CloakCraft advantage - Has working AMM |

---

## 10. Implementation Completeness

### Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Transfers** | COMPLETE | 1x2, 2x2 circuits working |
| **Shield/Unshield** | COMPLETE | Full flow tested |
| **Note Scanning** | COMPLETE | Helius indexer integration |
| **AMM Swaps** | COMPLETE | Constant product + StableSwap |
| **Add/Remove Liquidity** | COMPLETE | Multi-phase working |
| **Perps Open Position** | COMPLETE | 5x leverage tested |
| **Perps Close Position** | COMPLETE | PnL calculation working |
| **Voting Ballot Creation** | COMPLETE | All modes working |
| **Vote Submission** | PARTIAL | VK not registered on devnet |
| **Note Consolidation** | COMPLETE | 3x1 working |
| **External DEX Adapter** | COMPLETE | Architecture in place |
| **Commitment Inclusion Verification** | INCOMPLETE | CRITICAL SECURITY GAP |

### Circuit Inventory

| Circuit | Purpose | Status |
|---------|---------|--------|
| transfer_1x2 | 1 input, 2 outputs | COMPLETE |
| consolidate_3x1 | 3 inputs, 1 output | COMPLETE |
| swap | AMM swap | COMPLETE |
| add_liquidity | LP provision | COMPLETE |
| remove_liquidity | LP withdrawal | COMPLETE |
| open_position | Perps long/short | COMPLETE |
| close_position | Perps settlement | COMPLETE |
| liquidate | Perps liquidation | COMPLETE |
| vote_snapshot | Snapshot voting | COMPLETE |
| vote_spend | SpendToVote | COMPLETE |
| change_vote_* | Vote modification | COMPLETE |
| claim | Winner payout | COMPLETE |

### Test Coverage

| Test Suite | Passed | Failed |
|------------|--------|--------|
| E2E ZK Test (Core) | 12/12 | 0 |
| E2E ZK Test (AMM) | 4/4 | 0 |
| E2E ZK Test (Perps) | 5/5 | 0 |
| E2E Voting Full | 26/35 | 0 (9 skipped) |

---

## 11. Summary

CloakCraft is an **extremely comprehensive** privacy protocol that represents a significant competitive threat due to:

1. **Breadth of Features:** Covers transfers, AMM, perps, governance, orderbook
2. **Technical Sophistication:** Novel multi-phase transaction pattern, Light Protocol integration
3. **Production Readiness:** All E2E tests passing on devnet
4. **Documentation Quality:** Extensive docs, CLAUDE.md, architecture guides
5. **Hackathon Polish:** Demo video, clean presentation

However, it has a **critical security vulnerability** (fake commitment attack) that the team has acknowledged but not fixed. This significantly impacts production readiness but may not affect hackathon judging if the judges focus on feature completeness over security audit.

### Recommendation

1. STARK-based proofs (no trusted setup)
2. Security-first approach (proper inclusion proofs)
3. Simpler, auditable design

---

## Appendix: Key Files

| File | Purpose |
|------|---------|
| `/programs/cloakcraft/src/lib.rs` | Main Anchor program (1231 lines) |
| `/packages/sdk/src/client.ts` | SDK entry point |
| `/circom-circuits/circuits/transfer/transfer_1x2.circom` | Core transfer circuit |
| `/SECURITY_ANALYSIS.md` | Known vulnerability documentation |
| `/TESTING_STATUS.md` | Test results and coverage |
| `/docs/ARCHITECTURE.md` | System architecture |
| `/docs/VOTING_PROTOCOL.md` | Voting system spec (46k chars) |

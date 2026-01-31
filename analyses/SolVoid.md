# SolVoid Analysis

## 1. Project Overview

**SolVoid** is an enterprise-grade privacy protocol for Solana that implements a Tornado Cash-style ZK-SNARK mixer for shielding SOL. The project claims to be a "Privacy Lifecycle Management (PLM)" platform providing:

- **ZK-Shielded Deposits/Withdrawals**: Uses Groth16 proofs over BN254 to break transaction linkage
- **Privacy Ghost Score**: Diagnostic tool analyzing wallet anonymity via transaction graph heuristics
- **Shadow Relayer Network**: Multi-hop onion-routing for transaction broadcasting
- **Atomic Rescue**: Emergency asset migration tooling
- **TypeScript SDK + CLI**: Developer tooling for protocol integration

The protocol uses a depth-20 Merkle tree (supporting ~1M deposits) with Poseidon hashing, matching the Tornado Cash architecture but adapted for Solana.

**Repository**: https://github.com/brainless3178/SolVoid

---

## 2. Track Targeting

| Track | Prize | Fit | Assessment |
|-------|-------|-----|------------|
| **Private Payments** | $15k | **PRIMARY** | Direct fit - ZK mixer for private SOL transfers |
| **Privacy Tooling** | $15k | **SECONDARY** | Ghost Score diagnostics and SDK qualify |
| **Open Track** | $18k | Possible | Enterprise framing could appeal broadly |

**Primary Target**: Private Payments track. The core functionality is a ZK mixer for private SOL transfers with relayer infrastructure for gasless anonymous withdrawals.

**Secondary Target**: Privacy Tooling track. The Ghost Score diagnostic engine, privacy leak detection SDK, and CLI tools provide developer-facing privacy infrastructure.

---

## 3. Tech Stack

### Languages
- **Rust**: Solana program (Anchor framework)
- **TypeScript/JavaScript**: SDK, CLI, Relayer, Dashboard
- **Circom 2.0+**: ZK circuit definitions

### Frameworks & Libraries

| Component | Technology |
|-----------|------------|
| Smart Contract | Anchor 0.30.1 |
| ZK System | Circom 2.x + SnarkJS 0.7.6 (Groth16) |
| ZK Verifier | groth16-solana 0.2.0 (on-chain) |
| Hash Function | light-poseidon 0.2.0 (Rust), circomlibjs (TS) |
| Curve Arithmetic | ark-bn254 0.4.0, ark-groth16 0.4.0 |
| Frontend | Next.js 15 |
| Relayer | Express.js + cross-fetch |
| Wallet Integration | @solana/web3.js 1.98.0, @coral-xyz/anchor 0.30.1 |

### Build System
- npm/yarn for TypeScript
- Anchor for Rust/Solana
- Circom compiler for circuits

---

## 4. Crypto Primitives

### Zero-Knowledge System
- **Proving System**: Groth16 SNARKs
- **Curve**: BN254 (alt-bn128)
- **Hash Function**: Poseidon-3 (ZK-friendly sponge construction)
- **Merkle Tree**: Depth-20 binary tree with Poseidon hashing

### Circuit Architecture

**Main Circuit (withdraw.circom)**:
```circom
template PrivacyZero(levels) {
    // Public inputs
    signal input root, nullifierHash;
    signal input recipient_low, recipient_high;  // Split for BN254 field
    signal input relayer_low, relayer_high;
    signal input fee, amount;

    // Private inputs
    signal input secret, nullifier;
    signal input pathElements[levels], pathIndices[levels];

    // Commitment = Poseidon(secret, nullifier, amount)
    // NullifierHash = Poseidon(nullifier, 1)
    // Merkle path verification
    // Statement binding hash output
}
```

**Key Security Features**:
1. **Amount binding**: Commitment includes amount to prevent inflation attacks
2. **Recipient/relayer binding**: Public inputs prevent proof hijacking
3. **Statement hash output**: Binds all public signals to prevent manipulation

### Rescue Circuit (rescue.circom)
Batch commitment prover for emergency asset migration (up to 5 assets).

---

## 5. Solana Integration

### Program Architecture (Anchor)

**Program ID**: `Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i`

**PDAs**:
- `[b"state"]` - Main program state (Merkle tree, root)
- `[b"vault"]` - Shielded fund custody
- `[b"root_history"]` - Rolling 100-root history
- `[b"verifier", state]` - Groth16 verification key
- `[b"nullifier", nullifier_hash]` - Double-spend prevention
- `[b"economic_state"]` - Rate limiting / circuit breaker
- `[b"treasury"]` - Protocol fee accumulator

**Instructions**:
1. `initialize` - Deploy protocol state
2. `initialize_verifier` - Store verification key
3. `initialize_root_history` - Setup root tracking
4. `initialize_economics` - Setup fee/rate-limit system
5. `deposit` - Shield SOL with commitment
6. `withdraw` - Verify proof and release funds
7. `trigger_emergency_mode` / `disable_emergency_mode` - Admin controls
8. `trigger_circuit_breaker` / `reset_circuit_breaker` - Safety controls

### On-Chain Verification
Uses `groth16-solana` crate for native Groth16 verification. Verification key stored in dedicated account.

### Economic Safety Layer
- **Base fee**: 0.1% of withdrawal amount
- **Emergency multiplier**: 1-10x fee scaling
- **Hourly limit**: 5 SOL default
- **Circuit breaker**: Automatic halt on anomalies
- **Minimum reserve**: 0.1 SOL

---

## 6. Sponsor Bounty Targeting

| Sponsor | Bounty | Likelihood | Notes |
|---------|--------|------------|-------|
| Light Protocol | Privacy infra | LOW | Uses custom Poseidon, not Light ZK compression |
| Helius | Indexing | LOW | No specific Helius integration visible |
| Jito | MEV protection | MEDIUM | Optional @jito-foundation/jito-ts peer dependency |
| Pyth | Oracle | LOW | Has pyth feed code but not core to privacy |

**Assessment**: Limited sponsor bounty targeting. The project is self-contained without deep integrations into sponsor ecosystems.

---

## 7. Alpha / Novel Findings

### Technical Innovations

1. **Privacy Ghost Score Engine**: Unique diagnostic system analyzing wallet anonymity through:
   - Linkage scoring (CEX connections)
   - Temporal pattern analysis
   - Volume fingerprinting
   - Multi-factor correlation penalties

2. **Shadow Relayer with Onion Routing**: Multi-hop relay infrastructure with:
   - Peer discovery and registration
   - Weighted random peer selection
   - Success rate tracking
   - Onion-encrypted payloads

3. **Root Drift Protection**: SDK checks for Merkle root changes during proof generation to prevent race conditions.

4. **Data Integrity Layer**: Zod-based runtime type enforcement across trust boundaries (API, internal, user input).

### Architectural Decisions

1. **Split Public Keys**: Recipient/relayer pubkeys split into low/high 16-byte chunks to fit BN254 field elements.

2. **Statement Hash Binding**: All public inputs hashed to single output signal for circuit integrity.

3. **100-Root History**: Allows proofs against recent roots, mitigating concurrent deposit issues.

### Potential Issues Identified

1. **No Trusted Setup Ceremony**: SECURITY.md explicitly states current ceremony files are for testing only.

2. **Unaudited Code**: Self-declared as not professionally audited.

3. **BPF Constraints**: Multiple `*_old.rs` files suggest struggles with Solana compute limits.

4. **Placeholder Program ID**: Uses Anchor's default test program ID (`Fg6PaFpo...`).

---

## 8. Strengths and Weaknesses

### Strengths

| Category | Details |
|----------|---------|
| **Architecture** | Well-structured modular design (circuits, program, SDK, relayer, dashboard) |
| **Documentation** | Extensive README, ARCHITECTURE.md, CLI docs, security policy |
| **Feature Depth** | Full privacy lifecycle: deposit, withdraw, diagnostics, rescue, relayer |
| **Circuit Design** | Proper amount binding, recipient binding, statement hashing |
| **Security Awareness** | Honest SECURITY.md about limitations, field element validation |
| **Developer Experience** | Comprehensive SDK, CLI tooling, TypeScript types |
| **Economic Safety** | Rate limiting, circuit breaker, emergency controls |

### Weaknesses

| Category | Details |
|----------|---------|
| **Trusted Setup** | No production MPC ceremony - critical for Groth16 security |
| **Testing** | Test directories exist but limited visible test coverage |
| **Deployment State** | Uses placeholder program ID, unclear if deployed to devnet |
| **Compute Limits** | Multiple iterations of verifier code suggest BPF challenges |
| **Token Support** | SOL only - no SPL token integration yet |
| **Relayer Centralization** | No decentralized incentive mechanism implemented |
| **Privacy Score** | Scoring heuristics are relatively simple |

---

## 9. Threat Level Assessment

### Threat Level: **HIGH**

**Rationale**:

1. **Complete Protocol Implementation**: Full deposit/withdraw flow with on-chain ZK verification
2. **Production-Ready SDK**: Comprehensive TypeScript SDK with proper types and error handling
3. **Infrastructure Completeness**: Relayer, CLI, dashboard all implemented
4. **Privacy Focus**: Strong alignment with hackathon themes
5. **Enterprise Framing**: Professional presentation, extensive documentation

**Competitive Advantages**:
- Most feature-complete privacy protocol among typical hackathon submissions
- Multiple attack vectors (Private Payments, Privacy Tooling, Open Track)
- Strong documentation and presentation materials

**Risk Factors for Competition**:
- Requires trusted setup for production use
- May face compute limit challenges on-chain
- Circuit security depends on proper constraint review

---

## 10. Implementation Completeness

### Completion Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Circom Circuits** | 90% | Core withdraw + merkle implemented, rescue circuit present |
| **Solana Program** | 85% | Full flow implemented, multiple iteration files suggest refinement |
| **On-Chain Verifier** | 80% | groth16-solana integration, needs production VK |
| **TypeScript SDK** | 90% | Comprehensive client with Poseidon, Merkle, proof generation |
| **CLI** | 85% | Ghost scoring, scanning, commands implemented |
| **Relayer** | 80% | Multi-hop, onion routing, peer registry |
| **Dashboard** | 70% | Next.js 15 setup, basic structure |
| **Tests** | 50% | Directory structure exists, coverage unclear |
| **Documentation** | 95% | Extensive README, architecture, security docs |

### Missing for Production

1. **MPC Trusted Setup Ceremony**
2. **Production Verification Key**
3. **Professional Security Audit**
4. **Mainnet/Devnet Deployment**
5. **SPL Token Support**
6. **Decentralized Relayer Incentives**

---

## Summary

SolVoid is a **highly competitive** hackathon submission implementing a complete Tornado Cash-style mixer for Solana. The project demonstrates strong technical understanding of ZK-SNARK protocols, Solana program development, and privacy engineering.

**Key Differentiators**:
- Full-stack implementation (circuits, program, SDK, CLI, relayer, dashboard)
- Privacy diagnostics tooling (Ghost Score)
- Enterprise-grade documentation and presentation
- Honest security disclosure

**Primary Concerns**:
- Groth16 requires trusted setup not yet performed
- Unaudited cryptographic code
- Potential compute limit challenges

**Recommended Monitoring**: Track any updates to trusted setup or audit announcements. Their Private Payments track submission is strong competition.

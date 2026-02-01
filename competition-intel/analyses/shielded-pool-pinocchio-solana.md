# Shielded Pool (Pinocchio + Noir) on Solana

**Repository**: https://github.com/iamvon/shielded-pool-pinocchio-solana
**Author**: Tuan Pham Minh (iamvon)
**Last Commit**: `fb7fb5c` - "chore: verifier program id update before build"

---

## 1. Project Overview

A privacy-preserving SOL transfer system implementing a Tornado Cash-style shielded pool on Solana. Users deposit SOL into a pooled vault with a cryptographic commitment, then later withdraw to any recipient address by presenting a zero-knowledge proof of deposit ownership without revealing which deposit is being spent.

### Core Flow
1. **Initialize**: Relayer creates pool state and vault PDAs
2. **Deposit**: Sender transfers SOL to vault, submits commitment that gets added to Merkle tree
3. **Withdraw**: Relayer submits ZK proof; program verifies proof via CPI to Groth16 verifier, checks nullifier, releases SOL to recipient

The privacy model relies on the ZK proof: withdrawals do not require the original depositor's signature, and the nullifier mechanism prevents double-spending while maintaining unlinkability between deposits and withdrawals.

---

## 2. Track Targeting

**Primary Track**: Privacy Infrastructure / DeFi Privacy

This project directly targets the core privacy track with a classic mixer/shielded pool implementation. It provides:
- Deposit/withdrawal unlinkability
- ZK-proof-based authorization (no signature from depositor at withdrawal time)
- Double-spend prevention via nullifiers

**Secondary Considerations**:
- Relayer infrastructure pattern (gas abstraction)
- Could serve as foundation for private payment rails

---

## 3. Tech Stack

### Cryptographic Backend
| Component | Technology | Version/Details |
|-----------|------------|-----------------|
| ZK Circuit Language | **Noir** | `1.0.0-beta.13` |
| Proving System | **Groth16** via Sunspot | gnark-based, Solana-optimized |
| Hash Function | **Poseidon** (BN254) | `poseidon v0.1.1` from noir-lang |
| Merkle Tree | 16-level Poseidon tree | 65,536 leaf capacity |

### Solana Program
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | **Pinocchio** | `0.10.1` |
| Logging | `pinocchio-log` | `0.5.1` |
| System CPI | `pinocchio-system` | `0.5.0` |
| Serialization | `bytemuck` | `1.23.0` |
| ZK Verification | Sunspot Groth16 Verifier | CPI-based |

### Client/Testing
| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ with tsx |
| Solana SDK | `@solana/kit` v5.1.0 |
| Poseidon (off-chain) | `circomlibjs` v0.1.7 |

---

## 4. Cryptographic Primitives

### ZK Circuit (main.nr)

```noir
fn main(
    root: pub Field,           // Merkle root (public)
    nullifier: pub Field,      // Nullifier hash (public)
    recipient: pub Field,      // Recipient address hash (public)
    amount: pub u64,           // Withdrawal amount (public)

    secret: Field,             // Private: deposit secret
    nullifier_key: Field,      // Private: nullifier key
    index: Field,              // Private: leaf index
    siblings: [Field; 16]      // Private: Merkle proof path
)
```

**Constraints Proven**:
1. **Commitment**: `commitment = Poseidon3(secret, nullifier_key, amount)`
2. **Nullifier**: `nullifier == Poseidon2(nullifier_key, index)`
3. **Merkle Membership**: `root == compute_merkle_root(commitment, index, siblings)`
4. **Recipient Binding**: `recipient != 0` (binds proof to specific recipient)

### Commitment Scheme
- 3-input Poseidon hash over BN254 scalar field
- Includes amount in commitment (fixed-denomination per commitment)
- Nullifier derived from `nullifier_key` and leaf `index`

### Merkle Tree
- Depth: 16 levels (2^16 = 65,536 maximum deposits)
- Hash: Poseidon2 for internal nodes
- Default leaf: 0 (empty subtrees use precomputed default hashes)

### Proof Characteristics
- **Proof Size**: 388 bytes (compressed Groth16)
- **Public Witness**: 140 bytes (12-byte header + 4 x 32-byte public inputs)
- **Verification**: ~400-600k compute units via CPI to Sunspot verifier

---

## 5. Solana Integration

### Program Architecture

**Program ID**: `FHsd7GZobRveRNN1e4TrfAu6ByMk9TUprCP68Gt4s79S`

#### Accounts Structure

| Account | Type | Seeds | Size |
|---------|------|-------|------|
| Pool State | PDA | `["pool_state"]` | 1,072 bytes |
| Vault | PDA | `["vault"]` | 0 bytes (SOL only) |
| Nullifier | PDA | `["nullifier", nullifier_hash]` | 0 bytes |

#### State Layout (ShieldedPoolState)
```rust
pub struct ShieldedPoolState {
    pub discriminator: [u8; 8],       // "poolstat"
    pub current_root: [u8; 32],       // Latest Merkle root
    pub roots: [[u8; 32]; 32],        // Circular buffer of last 32 roots
    pub roots_index: u32,             // Current index in buffer
    pub _padding: [u8; 4],
}
```

### Instructions

#### Initialize (discriminator: 0)
- Creates pool state and vault PDAs
- Relayer pays for account creation
- Sets initial root to zeros

#### Deposit (discriminator: 1)
- **Data**: `[amount: u64][commitment: [u8; 32]][new_root: [u8; 32]]`
- Transfers SOL from sender to vault
- Updates Merkle root in state (adds to circular buffer)
- **Note**: Merkle tree maintained off-chain; client computes new root

#### Withdraw (discriminator: 2)
- **Data**: `[proof: 388 bytes][witness: 140 bytes]`
- Verifies ZK proof via CPI to Sunspot verifier
- Checks root against 32-root history
- Validates nullifier PDA not yet created
- Verifies recipient matches proof's public input
- Creates nullifier PDA (marks as spent)
- Transfers SOL from vault to recipient

### Pinocchio Usage

The project demonstrates idiomatic Pinocchio patterns:
- `#![no_std]` for minimal binary size
- Direct `AccountView` manipulation
- `bytemuck` for zero-copy state access
- PDA signing with `Seed` and `Signer` types
- CPI via `InstructionView`

### Compute Budget
- Initialize: ~200k CU
- Deposit: ~200k CU
- Withdraw: ~600k CU (dominated by Groth16 verification)

---

## 6. Sponsor Bounties

### Potential Bounty Alignment

| Sponsor | Bounty | Alignment | Notes |
|---------|--------|-----------|-------|
| **Anza** | Pinocchio Excellence | **Strong** | Clean Pinocchio 0.10 implementation |
| **Sunspot/Reilabs** | ZK Integration | **Strong** | Uses Sunspot Groth16 for on-chain verification |
| **Noir/Aztec** | Noir Circuit | **Strong** | Native Noir circuit with Poseidon |
| **Privacy Track** | Core Track | **Primary** | Direct privacy infrastructure |

### Sponsorship Notes
- This is essentially a reference implementation combining Noir + Sunspot + Pinocchio
- Likely a strong contender for any Sunspot/Noir integration bounties
- Clean, well-documented code suitable for ecosystem examples

---

## 7. Alpha / Novel Findings

### Positive Technical Observations

1. **Clean Architecture Separation**
   - Circuit logic fully isolated in Noir
   - On-chain program purely handles state and CPI
   - Client handles proof generation orchestration

2. **Efficient State Design**
   - Circular buffer for root history (32 roots)
   - Zero-byte nullifier accounts (existence check only)
   - Minimal on-chain storage footprint

3. **Relayer Pattern Implementation**
   - Sender only signs deposit
   - Relayer pays gas for withdraw
   - Natural privacy-preserving fee abstraction

4. **Modern Tooling**
   - Noir 1.0 beta (latest stable-ish)
   - Pinocchio 0.10 (latest)
   - Sunspot for efficient on-chain Groth16

### Potential Issues / Limitations

1. **Off-Chain Merkle Tree Dependency**
   - Client must maintain correct tree state
   - Deposits provide `new_root` directly - program trusts it
   - **Critical**: No on-chain verification that new_root is correctly computed
   - Attack vector: Malicious depositor could submit invalid root

2. **Root History Truncation**
   - Only 32 historical roots stored
   - High-volume pools could expire valid roots quickly
   - User must withdraw before their root is evicted

3. **Recipient Encoding Quirk**
   - Uses 30 bytes of pubkey, zero-pads first 2 bytes
   - Non-standard encoding for BN254 field element
   - Works but fragile

4. **Fixed Denomination Limitation**
   - Amount embedded in commitment
   - No withdrawal splitting or merging
   - Anonymity set fragmented by amount

5. **No UI/Frontend**
   - CLI integration test only
   - Production usage requires significant client work

---

## 8. Strengths and Weaknesses

### Strengths

| Category | Strength |
|----------|----------|
| **Clarity** | Exceptionally clean, readable code |
| **Documentation** | README includes architecture, setup, and privacy notes |
| **Tooling** | Uses latest Noir, Pinocchio, Sunspot versions |
| **Security Model** | Honest about privacy limitations in README |
| **Minimalism** | Does one thing well; no feature bloat |
| **Testing** | Integration test covers happy path and failure cases |
| **Proof Size** | Compact 388-byte Groth16 proofs |

### Weaknesses

| Category | Weakness |
|----------|----------|
| **Trust Assumption** | Merkle root supplied by client without on-chain verification |
| **Scalability** | 16-level tree limits to 65k deposits |
| **Anonymity Set** | Fixed denomination fragments anonymity |
| **UX** | No frontend, requires CLI expertise |
| **Auditing** | Self-disclaimed as unaudited |
| **Root Expiry** | 32-root buffer may expire valid withdrawals |

---

## 9. Threat Level Assessment

**Threat Level**: **MEDIUM-HIGH** (as a hackathon competitor)

### Competitive Analysis

- Does not directly compete with our STARK-based approach
- Different proving system (Groth16 vs Circle STARKs)
- Could inform our shielded pool design patterns

**As Hackathon Entry**:
- Very polished implementation for hackathon scope
- Strong sponsor alignment (Noir, Sunspot, Anza/Pinocchio)
- Could win multiple bounties

**Technical Sophistication**:
| Aspect | Rating |
|--------|--------|
| ZK Implementation | 8/10 |
| Solana Integration | 9/10 |
| Code Quality | 9/10 |
| Security Design | 7/10 |
| Production Readiness | 5/10 |

### Why Not Higher Threat
- Simple circuit (no complex constraints)
- No novel cryptographic contribution
- Standard Tornado-style design
- Trusted setup requirement (Groth16)

---

## 10. Implementation Completeness

### Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Noir Circuit | Complete | Standard shielded pool circuit |
| Solana Program | Complete | All 3 instructions implemented |
| Client Library | Complete | Full proof generation + tx building |
| Integration Tests | Complete | Happy path + failure cases |
| Deployment Scripts | Partial | Manual deployment documented |
| Frontend | Missing | No UI |
| Documentation | Complete | Comprehensive README |

### Feature Checklist

| Feature | Implemented |
|---------|-------------|
| Deposit | Yes |
| Withdraw | Yes |
| Nullifier tracking | Yes |
| Root history | Yes (32 roots) |
| Proof verification | Yes (CPI) |
| Relayer support | Yes |
| Multi-denomination | No |
| Compliance hooks | No |
| Rate limiting | No |
| Frontend | No |

### Code Metrics

| Metric | Value |
|--------|-------|
| Noir circuit LOC | ~70 |
| Rust program LOC | ~350 |
| TypeScript client LOC | ~500 |
| Test coverage | Integration only |

### Production Gaps

1. **Security Audit** - Required before mainnet
2. **Merkle Root Verification** - On-chain verification of root computation
3. **Denomination Strategy** - Fixed vs. variable amounts
4. **Root Expiry Handling** - Grace period or user notifications
5. **Compliance Features** - Optional disclosure mechanisms
6. **Multi-deposit Optimization** - Batch deposit support
7. **Frontend** - Web UI for non-technical users

---

## Summary

A well-executed reference implementation of a Tornado Cash-style shielded pool on Solana using the Noir + Sunspot + Pinocchio stack. Strong on code quality and documentation, weak on production readiness. The trusted client-side Merkle root computation is a significant security consideration. Likely to perform well in hackathon judging for sponsor bounties, particularly those from Noir/Aztec, Sunspot/Reilabs, and Anza.

**Key Differentiator**: Clean integration of Noir ZK circuits with Pinocchio on-chain programs via Sunspot's Groth16 verifier.

**Key Risk**: Client-trusted Merkle root submission without on-chain verification.

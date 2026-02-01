# Shadow DEX - Hackathon Submission Analysis

## Project Overview

**Name:** Shadow DEX
**Tagline:** ZK Gated swaps on Solana
**Repository:** shadow
**Status:** Deployed on Devnet with working demo transactions

Shadow DEX is a ZK-gated AMM/DEX that enables privacy-preserving eligibility verification for token swaps. Rather than pursuing full transaction privacy (which hides amounts and recipients), Shadow focuses on **eligibility privacy** - proving you meet swap requirements without revealing the underlying data.

### Core Value Proposition

The project addresses a practical problem: DeFi pools often need to verify user eligibility (balance thresholds, governance token holdings, sanctions compliance) but current solutions require revealing sensitive data. Shadow allows users to prove:

- Minimum balance requirements without revealing exact holdings
- Governance token ownership without exposing wallet addresses
- Non-blacklisted status without revealing identity
- Shielded note ownership for private deposits

## Track Targeting

| Track | Relevance | Fit Score |
|-------|-----------|-----------|
| **Private Payments ($15k)** | Partial - shielded deposits/spends exist but amounts visible on-chain | 6/10 |
| **Privacy Tooling ($15k)** | Strong - eligibility proofs are reusable privacy infrastructure | 8/10 |
| **Open Track ($18k)** | Strong - novel ZK-gated DEX concept with real deployment | 8/10 |

**Best Fit:** Privacy Tooling or Open Track. The project is more about access control privacy than payment privacy, making it a unique entry in the tooling category.

## Tech Stack

### ZK System

| Component | Technology |
|-----------|------------|
| **Circuit Language** | Noir (v1.0.0-beta.13 nightly) |
| **Proving System** | Sunspot (Noir-to-Solana verifier compiler) |
| **Proof Type** | Groth16 (via Sunspot) |
| **Hash Function** | Poseidon (BN254) for commitments, custom polynomial hash for account data |

### Language & Frameworks

| Layer | Technology |
|-------|------------|
| **On-chain Program** | Rust + Anchor 0.32.0 |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Wallet Integration** | @solana/wallet-adapter |
| **Styling** | Tailwind CSS |

### Key Dependencies

**Rust (Solana Program):**
- anchor-lang 0.32.0
- anchor-spl 0.32.0
- bytemuck 1.14.0

**Frontend:**
- @noir-lang/noir_js (1.0.0-beta.13-nightly)
- circomlibjs 0.1.7 (Poseidon hash)
- @lightprotocol/stateless.js 0.22.0 (ZK Compression - planned)
- @lightprotocol/compressed-token 0.22.0 (planned)

## Crypto Primitives

### Circuit Implementations

1. **min_balance** (68 lines)
   - Proves: `balance >= threshold`
   - Private inputs: balance, owner, raw SPL token account data (165 bytes)
   - Public inputs: state_root (account hash), threshold, token_mint
   - Hash: Custom polynomial hash (`h = h * 31 + byte[i]`) for account data

2. **token_holder** (75 lines)
   - Proves: `token_amount >= min_required`
   - Parses raw SPL token account data to verify ownership
   - Similar structure to min_balance

3. **smt_exclusion** (30 lines)
   - **SIMPLIFIED/PLACEHOLDER** - Not a real Sparse Merkle Tree exclusion proof
   - Simply checks `address_hash != blacklist_root`
   - Does not implement proper non-membership proof

4. **shielded_spend** (69 lines)
   - Proves ownership of a shielded note
   - Uses Poseidon hash (BN254) from official noir-lang library
   - 32-level Merkle tree for note commitments
   - Nullifier scheme to prevent double-spending
   - Commitment: `poseidon::hash_5([amount, secret, nullifier, mint, pool_id])`
   - Nullifier hash: `poseidon::hash_3([nullifier, mint, pool_id])`

### On-Chain Verification

- CPI to deployed Sunspot verifier program
- Proof format: `proof || public_witness` concatenated
- Verification via simple invoke (no account data needed)

## Solana Integration

### Deployed Programs (Devnet)

| Program | Address |
|---------|---------|
| Shadow DEX | `3TKv2Y8SaxJd2wmmtBS58GjET4mLz5esMZjnGfrstG72` |
| Shielded Verifier | `HPsMCiGGMEScQdKxihvSazYyXPsyXi7fj5q2vtBfQ4tF` |

### Program Architecture

**zkgate program** provides:
- AMM pool creation and liquidity management
- ZK-gated swaps (`zk_swap`, `zk_swap_reverse`)
- Shielded pool deposits and withdrawals
- Private swaps from shielded deposits
- State root history management
- Nullifier tracking (double-spend prevention)

### Key Instructions

1. `deposit` - Deposit tokens into shielded pool, emit commitment
2. `swap_private` - Swap from shielded deposit with ZK proof
3. `withdraw_shielded` - Withdraw from shielded pool with proof
4. `zk_swap` / `zk_swap_reverse` - ZK-gated public swaps
5. `update_shielded_root` - Authority updates Merkle root

### State Management

- **ShieldedPool**: Stores mint, vault, authority, current_root, next_index
- **ShieldedRootHistory**: Ring buffer of 32 historical roots (zero_copy for efficiency)
- **Nullifier**: PDA-based spent tracking per pool

## Sponsor Bounty Targeting

### Light Protocol

**Explicit Interest:** Yes - `@lightprotocol/stateless.js` and `@lightprotocol/compressed-token` in dependencies

**Integration Status:** Planned but not implemented. Cargo.toml shows commented-out Light SDK dependencies:
```rust
# light-sdk = { version = "0.17.1", features = ["anchor"] }
# light-hasher = { version = "5.0.0", features = ["solana"] }
```

### Sunspot / Reilabs

**Strong Fit:** Uses Sunspot as the core proving infrastructure. Working deployment proves real-world Sunspot viability.

### Potential Bounty Relevance

- Noir/Aztec ecosystem (using Noir circuits)
- Solana Foundation (novel privacy primitive)
- Any privacy-focused sponsor

## Alpha / Novel Findings

### Innovative Aspects

1. **Eligibility Privacy Focus**: Unique approach - instead of hiding everything, hide only what matters for access control. This is more practical for near-term adoption.

2. **SPL Token Account Parsing in Circuit**: Directly parses 165-byte raw SPL token account data within the ZK circuit, extracting balance, owner, and mint fields at specific offsets.

3. **Relayer Architecture**: Off-chain eligibility verification with on-chain shielded spend proofs creates a hybrid privacy model.

4. **Sunspot Production Usage**: One of few projects demonstrating Sunspot in a complete, deployed application.

### Technical Observations

1. **Hash Function Choice**: Uses a weak polynomial hash (`h * 31 + byte[i]`) for account data binding rather than a cryptographic hash. This may have collision vulnerabilities but is circuit-efficient.

2. **Amount Visibility**: The design explicitly keeps swap amounts visible on-chain. This is an honest tradeoff acknowledged in documentation.

3. **Root Authority Model**: Shielded pool roots require an off-chain sequencer/authority to update. This is centralized but documented as temporary.

## Strengths

1. **Complete Working System**: End-to-end implementation with deployed contracts, working frontend, and real devnet transactions

2. **Excellent Documentation**: Clear README, technical explanation, setup guide, and honest about limitations

3. **Practical Use Case**: Addresses real DeFi pain point (KYC/eligibility without doxxing)

4. **Clean Code Structure**: Well-organized Rust program with proper error handling, state management

5. **Multiple Proof Modes**: Four distinct proof types showing circuit design capability

6. **Proper Nullifier Scheme**: Correct double-spend prevention with PDA-based nullifier tracking

7. **AMM Integration**: Full constant-product AMM with fee calculations integrated with ZK verification

## Weaknesses

1. **smt_exclusion is Placeholder**: Blacklist circuit is not a real SMT exclusion proof - just a trivial equality check

2. **Centralized Root Updates**: Requires trusted authority to update Merkle roots. No on-chain tree building.

3. **Weak Account Hash**: Polynomial hash for account data binding is not cryptographically secure

4. **Server-Side Proving**: Proofs generated server-side (Sunspot limitation), reduces trust assumptions

5. **No Real State Root Verification**: Min balance and token holder proofs hash account data but don't verify against a Solana state commitment

6. **Light Protocol Not Integrated**: Despite dependencies, ZK Compression is not actually used

7. **Amounts Still Public**: Not a full privacy solution - swap amounts visible on-chain

## Threat Level Assessment


**Threat Level: MODERATE**

**Rationale:**
- Different design philosophy (eligibility privacy vs. full privacy)
- Not directly competing for "shielded pool" use case where amounts/recipients are hidden
- Strong execution increases hackathon placement likelihood

### Competitive Position

| Factor | Assessment |
|--------|------------|
| Technical Depth | Medium-High (4 circuits, full program, working demo) |
| Novelty | High (unique eligibility privacy angle) |
| Completeness | High (deployed, tested, documented) |
| Production Readiness | Medium (several known limitations) |
| Demo Quality | High (live devnet with example transactions) |

## Implementation Completeness

### Fully Implemented

- [x] AMM pool with constant-product formula
- [x] ZK-gated swap with proof verification
- [x] Shielded deposit with commitment emission
- [x] Shielded withdraw with proof and nullifier
- [x] Private swap from shielded deposits
- [x] Nullifier double-spend prevention
- [x] State root history ring buffer
- [x] Min balance proof circuit
- [x] Token holder proof circuit
- [x] Shielded spend proof circuit (Poseidon-based)
- [x] Frontend with wallet integration
- [x] Proof generation API endpoints
- [x] Devnet deployment

### Partially Implemented / Planned

- [ ] SMT exclusion proof (placeholder only)
- [ ] Solana state root verification
- [ ] Client-side proof generation
- [ ] Light Protocol ZK Compression
- [ ] Shielded outputs (recipient privacy)
- [ ] Batched deposits / larger anonymity sets
- [ ] On-chain Merkle tree updates

### Code Quality Metrics

| Metric | Score |
|--------|-------|
| Rust Code Quality | 8/10 (clean Anchor patterns, proper error handling) |
| Circuit Quality | 7/10 (working but some simplifications) |
| Frontend Quality | 7/10 (modern stack, reasonable UX) |
| Documentation | 9/10 (excellent for hackathon) |
| Test Coverage | 5/10 (circuit tests exist, limited integration tests) |

## Summary

Shadow DEX is a well-executed hackathon project that takes a pragmatic approach to privacy on Solana. Rather than attempting full transaction privacy, it focuses on the more tractable problem of eligibility verification - letting users prove they meet requirements without revealing sensitive data.

The project demonstrates strong technical capability with four working Noir circuits, a complete Anchor program with shielded pool functionality, and a polished Next.js frontend. The deployment on devnet with working transactions is notable.

Key limitations include a placeholder blacklist circuit, centralized root management, and server-side proof generation. The honest acknowledgment of these limitations in documentation reflects good engineering practice.

For the hackathon context, this is a strong submission that could place well in Privacy Tooling or Open Track categories. The unique angle on eligibility privacy differentiates it from typical "hide everything" approaches.

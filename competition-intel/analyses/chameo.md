# Chameo.cash - Hackathon Submission Analysis

**Updated:** 2026-02-01
**Score:** 98 (↑ from 95, +3)
**Threat Level:** CRITICAL

## 1. Project Overview

**Name:** Chameo (chameo.cash)

**Tagline:** Privacy-first, compliance-gated payout platform on Solana

**Video Demo:** https://youtu.be/JZMt14qAP-w

**Core Concept:** Chameo enables teams to pay anyone via email or social handle (X/Twitter, Telegram, Discord, GitHub) using either direct payouts or escrowed bounties/grants. The platform breaks on-chain linkability between payers and recipients while maintaining compliance through wallet screening.

**Key Innovation:** The combination of Privacy Cash (UTXO-based mixing pool), Inco Lightning (fully homomorphic encryption for on-chain analytics/voting), and Aztec Noir ZK proofs (for anonymous voting with nullifiers) creates a comprehensive privacy stack that still allows compliance screening.

**Use Cases:**
- Private bounty/grant distribution
- Anonymous payroll to contractors
- Escrowed funds with dispute resolution
- Compliance-screened private payments

---

## 2. Track Targeting

### Primary Track: Private Payments ($15k)
**Fit: EXCELLENT**

Chameo directly addresses private payments with a sophisticated Privacy Cash integration:
- UTXO-based shielded pool with Groth16 proofs
- Deposits/withdrawals break wallet linkability
- Host wallet -> Campaign wallet -> Claimant wallet chain is unlinkable
- Compliance screening via Range API ensures regulatory alignment

### Secondary Track: Privacy Tooling ($15k)
**Fit: STRONG**

The project provides several privacy tools:
- Encrypted on-chain analytics via Inco Lightning (FHE)
- ZK-based anonymous voting system for dispute resolution
- Nullifier-based one-vote-per-identity enforcement
- Poseidon Merkle tree for eligibility proofs

### Tertiary Track: Open Track ($18k)
**Fit: MODERATE**

Could position as novel privacy infrastructure, but more targeted at the specific payment/payout use case than general tooling.

---

## 3. Tech Stack

### ZK System
| Component | Technology | Purpose |
|-----------|------------|---------|
| Privacy Cash Proofs | **Groth16 (snarkjs)** | UTXO deposit/withdraw |
| Vote Eligibility | **Aztec Noir** | Anonymous voting proofs |
| On-chain Verifier | **Sunspot** (gnark-solana) | Noir proof verification |
| Homomorphic Encryption | **Inco Lightning** | Encrypted vote/analytics counters |

### Languages & Frameworks
- **Backend:** TypeScript (Node.js/Express)
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS
- **Solana Program:** Rust + Anchor 0.31.1
- **ZK Circuit:** Noir (Aztec)
- **Database:** MongoDB

### Key Dependencies
```
Server:
- @coral-xyz/anchor ^0.30.1
- @inco/solana-sdk ^0.0.2
- snarkjs ^0.7.5 (Groth16 proving)
- @lightprotocol/hasher.rs ^0.2.1 (Poseidon)

Client:
- privacycash ^1.1.11 (Privacy Cash SDK)
- @inco/solana-sdk ^0.0.2

Contracts:
- anchor-lang 0.31.1
- inco-lightning 0.1.4
- solana-poseidon 2.2.4
```

---

## 4. Crypto Primitives

### Poseidon Hash (BN254)
- Used for Merkle tree construction (identity eligibility)
- Used for nullifier derivation
- Used for vote ciphertext commitment
- Implemented via both `@lightprotocol/hasher.rs` (WASM) and `solana-poseidon` (on-chain)

### Groth16 ZK-SNARK (Privacy Cash)
- 2-input, 2-output UTXO model
- Merkle tree depth: configurable (default 18)
- Proves: valid nullifiers, valid commitments, balanced inputs/outputs
- Circuit: `transaction2.wasm` + `transaction2.zkey`

### Noir Circuit (Vote Eligibility)
```
Proves:
1. Voter leaf is in Poseidon Merkle root (depth 16)
2. Nullifier = Poseidon(secret) - prevents double voting
3. Commitment = Poseidon(encrypted_vote) - binds vote to proof
```

### Inco Lightning (FHE)
- Euint128 encrypted integers for vote totals
- Homomorphic addition: `e_add()`
- Conditional selection: `e_select()`
- Equality check: `e_eq()`
- Attested decryption after voting closes

### AES-256-GCM
- UTXO encryption for Privacy Cash
- V2 encryption with 12-byte IV + 16-byte auth tag

### SHA-256
- Identity hashing (email/social handles -> identityHash)
- Used in key derivation

### Keccak256
- Privacy Cash V2 encryption key derivation
- UTXO private key derivation

---

## 5. Solana Integration

### Program Architecture
```
chameo-privacy (Anchor)
├── voting.rs
│   ├── VotingPool account (PDA: ["voting_pool", campaign_id])
│   ├── Nullifier account (PDA: ["nullifier", campaign_id, nullifier_value])
│   ├── initialize_voting_pool() - creates encrypted vote counters
│   ├── cast_vote_zk() - verifies Noir proof, updates encrypted totals
│   ├── set_eligibility_root() - updates Merkle root
│   └── close_voting() - grants decrypt access, closes pool
│
└── analytics.rs
    ├── Analytics account (PDA: ["analytics", campaign_id])
    ├── initialize_analytics() - creates encrypted counters
    ├── track_event() - increments encrypted event counters
    └── grant_analytics_access() - allows creator to decrypt

External Programs:
- Inco Lightning (5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj)
- Privacy Cash (9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD)
- ZK Verifier (Sunspot-deployed, configurable)
```

### CPI Patterns
- **Inco Lightning CPI:** Used for all encrypted operations
- **ZK Verifier Invoke:** `invoke()` to Sunspot-deployed Noir verifier
- **Privacy Cash:** Off-chain relayer interaction (not direct CPI)

### Account Structure
```rust
VotingPool (161 bytes):
  campaign_id: [u8; 32]
  authority: Pubkey
  eligibility_root: [u8; 32]
  zk_verifier_program: Pubkey
  refund_host_votes: Euint128
  equal_distribution_votes: Euint128
  total_votes: u64
  is_active: bool

Nullifier (64 bytes):
  campaign_id: [u8; 32]
  value: [u8; 32]
```

---

## 6. Sponsor Bounty Targeting

### Inco Network - FHE
**Fit: EXCELLENT**
- Heavy use of Inco Lightning for encrypted analytics and voting
- Demonstrates encrypted counters, homomorphic addition, conditional logic
- Attested decryption workflow implemented
- Well-documented integration

### Range Protocol - Compliance
**Fit: EXCELLENT**
- Direct integration with Range API
- Risk score checking (1-10 scale, threshold at 6)
- OFAC sanctions checking
- Token blacklist checking
- Compliance gate enforced on every claim

### Privacy Cash - Shielded Pool
**Fit: EXCELLENT**
- Core integration for unlinkable payments
- Full UTXO lifecycle: deposit, withdraw, balance checking
- Relayer integration for privacy

### Helius - RPC
**Fit: MODERATE**
- Used for Solana RPC (mainnet/devnet)
- Standard RPC usage, nothing special

### Light Protocol
**Fit: MODERATE**
- Uses `@lightprotocol/hasher.rs` for Poseidon hashing
- Not using ZK Compression

---

## 7. Alpha / Novel Findings

### Novel Architecture Patterns

1. **Triple-Layer Privacy Stack**
   - Privacy Cash (UTXO mixing) + Inco (FHE) + Noir (ZK proofs)
   - Rare to see all three combined in one project

2. **Compliance-Gated Privacy**
   - Range API screening happens AFTER identity verification but BEFORE payout
   - Creates "compliant privacy" - addresses not linked but bad actors blocked

3. **Server-as-Relayer Pattern**
   - Server generates Noir proofs and submits votes
   - Voter wallet never appears on-chain
   - Relayer pays gas, hiding voter entirely

4. **Encrypted Dispute Resolution**
   - Vote totals encrypted until voting closes
   - Prevents vote manipulation based on intermediate results

### Technical Alpha

1. **Sunspot Integration**
   - Uses Sunspot for Noir -> Solana proof verification
   - Proof size: 388 bytes
   - Public witness: 108 bytes (12 + 32 + 32 + 32)

2. **Poseidon Parameter Choice**
   - BN254 curve (matching Noir)
   - Big-endian encoding
   - 16-byte chunk packing for ciphertext commitment

3. **Privacy Cash V2 Encryption**
   - 8-byte version prefix + AES-256-GCM
   - Backward compatible with V1 (AES-128-CTR + HMAC)

### Potential Vulnerabilities

1. **Server Centralization Risk**
   - Server holds campaign wallet keys (encrypted with WALLET_ENCRYPTION_KEY)
   - Server is sole relayer for ZK votes
   - Server controls dispute resolution timing

2. **Nullifier Derivation**
   - Nullifier = Poseidon(secret) where secret = identityHash
   - If identityHash is predictable (known email), nullifier can be computed
   - Attacker could pre-create nullifier PDAs

3. **50% Turnout Requirement Bypass**
   - Server can force resolution with `options.force = true`
   - Bypasses quorum requirement

---

## 8. Strengths

### Technical Strengths
1. **Comprehensive Privacy Model** - Addresses multiple privacy vectors (sender, receiver, amounts, votes)
2. **Working Integration Tests** - `chameo.test.ts` demonstrates full ZK vote flow
3. **Real Noir Circuit** - Actual ZK circuit with Merkle proof, nullifier, and commitment
4. **Clean Architecture** - Well-organized server modules with clear separation

### Business Strengths
1. **Clear Use Case** - Private payroll/bounties is underserved market
2. **Compliance Story** - Range integration provides regulatory cover
3. **Multiple Identity Providers** - Email, Twitter, Telegram, Discord, GitHub

### Implementation Quality
1. **Video Demo Exists** - Shows working product
2. **Deployed Contracts** - Program IDs provided for devnet
3. **Full Stack** - Frontend, backend, contracts, circuits all present

---

## 9. Weaknesses

### Technical Weaknesses
1. **Server Centralization** - Single point of failure for key custody and relaying
2. **No On-chain Compliance** - Range checks happen off-chain only
3. **Limited Scalability** - Noir proof generation blocks voting throughput
4. **No Multi-sig** - Campaign wallet keys controlled by single server key

### Implementation Gaps
1. **No WASM Proving** - Proof generation requires nargo/sunspot CLI
2. **Missing Error Recovery** - Some error paths leave state inconsistent
3. **Hardcoded Parameters** - Many constants could be configurable

### Security Concerns
1. **Key Derivation from Signature** - Privacy Cash keys derived from wallet signature
2. **MongoDB for Sensitive Data** - Campaign wallet keys stored in database
3. **Nullifier Pre-computation** - Predictable identity hashes enable attacks

---

## 10. Threat Level Assessment

**Threat Level: CRITICAL** (Score: 98, ↑ +3 from 95)

### Recent Updates (2026-02-01)
- ✅ **Video demo added**: https://youtu.be/JZMt14qAP-w
- ✅ **Comprehensive README enhancement** with detailed architecture documentation
- ✅ **Docker deployment support** added (Dockerfile, .dockerignore)
- ✅ **Privacy model table** showing host/campaign/claimant wallet visibility
- ✅ **Code snippets** for Privacy Cash, Range compliance, Inco ZK voting, Noir circuit

**Previous Assessment:** HIGH

### Justification

| Factor | Assessment |
|--------|------------|
| Track Fit | Excellent fit for Private Payments |
| Technical Depth | Deep - 3 ZK systems integrated |
| Implementation Completeness | ~85% - working e2e with some gaps |
| Sponsor Bounty Fit | Strong for Inco, Range, Privacy Cash |
| Novel Innovation | High - unique triple-layer privacy stack |
| Demo Quality | Video demo available |
| Code Quality | Good - clean architecture, tests present |

### Competitive Risk
- **Direct Competition** to other privacy payment solutions
- Strong Position for Inco bounty due to extensive FHE usage
- Strong Position for Range bounty due to proper compliance integration
- Moderate Position for Privacy Cash bounty (SDK wrapper, not novel usage)

### Recommended Counter-Strategy
1. Emphasize on-chain compliance enforcement (Range checks in program)
2. Highlight STARK-based proving advantages over Groth16/Noir
3. Demonstrate better decentralization (no server custody)
4. Show superior proof generation times

---

## 11. Implementation Completeness

| Component | Status | Notes |
|-----------|--------|-------|
| Privacy Cash Integration | Complete | Full deposit/withdraw flow |
| Inco Analytics | Complete | All 6 event types tracked |
| Inco Voting | Complete | Encrypted vote tallying |
| Noir Circuit | Complete | Merkle + nullifier + commitment |
| Sunspot Verifier | Complete | On-chain verification |
| Range Compliance | Complete | Risk + sanctions checking |
| Identity Providers | Complete | 5 providers implemented |
| Campaign Management | Complete | CRUD + lifecycle |
| Dispute Resolution | Complete | ZK voting + outcome handling |
| Frontend | Complete | Dashboard, claim flow, voting |
| Tests | Partial | Anchor tests only, no unit tests |
| Documentation | Good | README covers architecture well |

**Overall Completeness: 85-90%**

---

## File References

Key files analyzed:

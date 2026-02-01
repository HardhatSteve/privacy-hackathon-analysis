# Obsidian - The Dark Launchpad

## 1. Project Overview

**Obsidian** is a privacy-preserving token launchpad on Solana that implements "Dark Auctions" where bid amounts remain encrypted until the auction concludes. The project integrates Arcium's confidential computing layer to prevent front-running, eliminate price manipulation based on visible demand, and ensure equitable market participation.

### Core Value Proposition
- **Dark Auctions**: Bid amounts are encrypted client-side and only decrypted by a trusted Cypher Node (simulating Arcium MPC/TEE)
- **Anti-MEV**: Hidden bids prevent front-running and price manipulation
- **AI-Driven Allocation**: Scoring model determines token allocation based on decrypted bid data
- **SPL Token Integration**: Full token lifecycle with claim mechanism

### Live Demo
- **URL**: https://obsidian-qdke.vercel.app/
- **Program ID**: `8nkjktP5dWDYCkwR3fJFSuQANB1vyw5g5LTHCrxnf3CE`
- **Network**: Solana Devnet

---

## 2. Track Targeting

**Primary Track**: Arcium Confidential Computing

The project is explicitly built for the Arcium x Solana Hackathon and heavily targets the Arcium bounty by:
- Using Arcium's confidential computing paradigm (simulated)
- Implementing MPC-style bid decryption
- Demonstrating TEE-based allocation execution
- Planning full Arcium Network integration (DKG) in roadmap

**Secondary Relevance**:
- Privacy/DeFi track (if applicable)
- Token launchpad/fair launch mechanisms

---

## 3. Tech Stack

### Blockchain Layer
| Component | Technology | Version |
|-----------|------------|---------|
| L1 | Solana | Devnet |
| Framework | Anchor | 0.30.1/0.32.1 |
| Token Standard | SPL Token + Token-2022 ready | 3.0.4 |
| Program Language | Rust | 2021 Edition |

### Confidentiality Layer
| Component | Technology | Purpose |
|-----------|------------|---------|
| Encryption | TweetNaCl (nacl.box) | Curve25519-XSalsa20-Poly1305 |
| Key Exchange | X25519 | Asymmetric encryption |
| Cypher Node | TypeScript (simulated TEE) | Off-chain bid decryption |
| Future: Arcium | MPC/TEE | Distributed confidential compute |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.1.1 |
| React | React | 19.2.3 |
| Styling | TailwindCSS | 4.x |
| Wallet | Solana Wallet Adapter | 0.9.x |
| Animation | Framer Motion | 12.x |

### Dependencies (package.json)
```json
{
  "@solana/web3.js": "^1.98.4",
  "@solana/spl-token": "^0.4.14",
  "@coral-xyz/anchor": "^0.32.1",
  "tweetnacl": "^1.0.3",
  "tweetnacl-util": "^0.15.1"
}
```

---

## 4. Crypto Primitives

### Encryption Scheme: NaCl Box (Curve25519-XSalsa20-Poly1305)
```
Client Encryption Flow:
1. Generate ephemeral Curve25519 keypair (per session)
2. Encrypt bid amount with Cypher Node's public key
3. Pack: [Nonce (24 bytes)] [ClientPubKey (32 bytes)] [Ciphertext]
4. Store encrypted payload on-chain in Bid PDA
```

### Payload Format
```typescript
// Plaintext format
const payloadString = `ENCRYPTED:${amount}`;

// Full encrypted payload structure
fullPayload = [nonce (24)] + [clientPubKey (32)] + [ciphertext (variable)]
```

### Cypher Node Decryption
```typescript
function arciumDecrypt(fullPayload: Uint8Array, nodeSecretKey: Uint8Array): string | null {
    const nonce = fullPayload.slice(0, 24);
    const clientPublicKey = fullPayload.slice(24, 56);
    const ciphertext = fullPayload.slice(56);
    return nacl.box.open(ciphertext, nonce, clientPublicKey, nodeSecretKey);
}
```

### AI Scoring Model
```typescript
// Weighted logistic regression (simulated)
const WEIGHT_BID = 0.8;
const WEIGHT_AGE = 0.2;

function runAiScoring(inputs: { bidAmount: number; walletAgeDays: number }): number {
    const normBid = Math.min(inputs.bidAmount / 1000, 1.0);
    const normAge = Math.min(inputs.walletAgeDays / 365, 1.0);
    return (normBid * WEIGHT_BID) + (normAge * WEIGHT_AGE);
}
```

### Key Management
- Cypher Node keypair stored in `arcium_keypair.json`
- Public key hardcoded in frontend: `ARCIUM_CLUSTER_PUBKEY`
- No distributed key generation (DKG) implemented yet

---

## 5. Solana Integration

### On-Chain Program (`programs/obsidian/src/lib.rs`)

#### Account Structures
```rust
#[account]
pub struct Launch {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub launch_pool: Pubkey,
    pub total_tokens: u64,
    pub max_allocation: u64,
    pub tokens_distributed: u64,
    pub is_finalized: bool,
    pub bump: u8,
}

#[account]
pub struct Bid {
    pub bidder: Pubkey,
    pub encrypted_data: Vec<u8>,  // NaCl encrypted payload
    pub is_processed: bool,
    pub allocation: u64,
    pub is_claimed: bool,
}
```

#### PDA Seeds
```rust
// Launch PDA
seeds = [b"launch_v2"]

// Bid PDA (per user)
seeds = [b"bid_v2", bidder.key().as_ref()]
```

#### Instructions
| Instruction | Purpose | Authority |
|-------------|---------|-----------|
| `initialize_launch` | Create launch with token pool | Admin |
| `submit_encrypted_bid` | Submit encrypted bid + transfer USDC | User |
| `run_ai_allocation` | Emit event for Cypher Node | Admin |
| `record_allocation` | Record user allocation (from Cypher Node) | Admin |
| `finalize_launch` | Mark auction complete | Admin |
| `claim_tokens` | User claims allocated tokens | User |
| `finalize_and_distribute` | Batch distribute tokens | Admin |

#### Token Flow
```
1. User submits encrypted bid + transfers USDC to launch_pool
2. Cypher Node decrypts bids off-chain
3. AI model calculates allocations
4. Admin records allocations on-chain
5. Admin finalizes launch
6. Users claim tokens from launch_pool
```

#### CPI Integration
- Uses `anchor_spl::token_interface::transfer_checked` for token transfers
- Supports both SPL Token and Token-2022
- PDA signing with stored bump

---

## 6. Sponsor Bounties

### Primary: Arcium Confidential Computing

**Alignment Score: 8/10**

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Encrypted data processing | NaCl box encryption | Simulated |
| MPC/TEE execution | TypeScript Cypher Node | Simulated |
| On-chain encrypted state | `encrypted_data: Vec<u8>` in Bid | Complete |
| Verifiable allocation | Event emission + on-chain record | Partial |
| Arcium SDK integration | Not using actual Arcium SDK | Planned |

**Gaps**:
- Using standard NaCl, not Arcium's actual SDK/MXE
- Cypher Node is centralized (single operator)
- No distributed key generation (DKG)
- No attestation/proof of correct execution

### Future Bounty Potential

| Bounty | Relevance | Notes |
|--------|-----------|-------|
| Token-2022 Confidential Transfers | High | Documented upgrade path |
| Realms Governance | Medium | DAO governance planned |
| SPL Token | High | Already integrated |

---

## 7. Alpha/Novel Findings

### 1. Hybrid Privacy Model
Obsidian uses a novel approach combining:
- **Client-side encryption** (NaCl) for bid privacy
- **Trusted off-chain compute** for decryption
- **On-chain settlement** for verifiability

This is similar to sealed-bid auctions in traditional finance but adapted for blockchain.

### 2. AI-Driven Allocation
The project introduces an "AI scoring" component that could theoretically:
- Weight bids by wallet age/reputation
- Implement anti-whale mechanisms
- Create fairer token distributions

Currently simplistic (linear scoring), but architecture supports complex models.

### 3. Claim-Based Distribution
Unlike direct distribution, users must actively claim tokens:
- Reduces admin gas costs
- Enables lazy finalization
- Users bear claim transaction cost

### 4. Token-2022 Roadmap
Documentation shows clear path to confidential transfers:
```rust
// Planned: Confidential mint with auditor support
MintExtension::ConfidentialTransferMint {
    authority: Some(authority),
    auto_approve_new_accounts: true,
    auditor_elgamal_pubkey: None,
}
```

### 5. Security Self-Awareness
The project includes a self-audit document acknowledging:
- Bump seed storage issues (now fixed in code)
- Recipient validation gaps
- Encryption payload size limits

---

## 8. Strengths and Weaknesses

### Strengths

| Strength | Impact |
|----------|--------|
| **Complete E2E Flow** | Working launchpad with bid/claim lifecycle |
| **Live Demo** | Deployed on devnet with frontend |
| **Clean Architecture** | Well-organized codebase with separation of concerns |
| **Anchor Best Practices** | PDAs, bumps, token-2022 support |
| **Documentation** | Security audit, roadmap, upgrade paths documented |
| **Arcium Narrative Fit** | Perfect alignment with hackathon theme |
| **Practical Use Case** | Dark auctions are genuinely useful for fair launches |

### Weaknesses

| Weakness | Severity | Notes |
|----------|----------|-------|
| **Centralized Cypher Node** | High | Single point of trust/failure |
| **No Real Arcium Integration** | Medium | Uses simulated SDK |
| **Minimal Testing** | High | Only stub test in `tests/obsidian.ts` |
| **Known Smart Contract Issues** | Medium | Self-documented bump/validation bugs |
| **No Proof of Correct Execution** | High | Trust assumption on Cypher Node |
| **Static Encryption Key** | Medium | Single Cypher Node key in frontend |
| **AI Model is Trivial** | Low | Linear scoring, not actual ML |

### Security Concerns

1. **Trust Model**: Cypher Node operator can see all bid amounts
2. **Key Compromise**: Single encryption key for all bids
3. **No Replay Protection**: Encrypted payloads could potentially be replayed
4. **Admin Centralization**: Authority controls finalization and allocation recording

---

## 9. Threat Level Assessment


| Factor | Assessment |
|--------|------------|
| **Technical Sophistication** | Medium - Standard crypto, no ZK |
| **Completion Level** | High - Working E2E with frontend |
| **Arcium Alignment** | High - Perfect hackathon fit |
| **Differentiation** | Medium - Launchpad vs general privacy |
| **Production Readiness** | Low - Acknowledged security gaps |

### Why Medium Threat
1. **Different Problem Space**: Obsidian focuses on launchpad auctions, not general-purpose privacy
2. **Simulated Privacy**: Not using actual MPC/TEE, just encrypted storage
3. **Centralized Trust**: Single Cypher Node negates much privacy benefit
4. **No ZK**: No cryptographic proofs of correct execution

- Simpler mental model (encrypted bids)
- Live demo with polished UI
- Clear Arcium hackathon alignment
- Complete user flow (bid -> claim)

- Actual cryptographic privacy (if using ZK)
- Decentralized (no trusted operator)
- Broader use case (general privacy vs launchpads)
- More sophisticated crypto primitives

---

## 10. Implementation Completeness

### Feature Completion Matrix

| Feature | Status | Quality |
|---------|--------|---------|
| Smart Contract | Complete | Medium |
| Bid Encryption | Complete | Good |
| Cypher Node | Complete | Simulated |
| AI Allocation | Complete | Trivial |
| Frontend | Complete | Polished |
| Claim Flow | Complete | Good |
| Tests | Minimal | Poor |
| Documentation | Complete | Good |

### Roadmap Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Encrypted bidding + on-chain storage | Complete |
| Phase 2 | Off-chain decryption + allocation | Complete |
| Phase 3 | User claim interface + SPL tokens | Complete |
| Phase 4 | Full Arcium Network integration (DKG) | Planned |
| Phase 5 | Token-2022 confidential transfers | Planned |
| Phase 6 | DAO governance | Planned |

### Lines of Code Estimate

| Component | LOC | Language |
|-----------|-----|----------|
| Solana Program | ~420 | Rust |
| Cypher Node | ~240 | TypeScript |
| Frontend (BidForm) | ~640 | TypeScript/React |
| Arcium SDK (simulated) | ~75 | TypeScript |
| Scripts/Tooling | ~1000+ | TypeScript/JS |

### Overall Completion: **75%**

The core hackathon demo is complete and functional. Missing elements:
- Comprehensive tests
- Real Arcium integration
- Production security hardening
- Multi-Cypher-Node support

---

## Summary

Obsidian is a well-executed hackathon project that demonstrates a practical application of confidential computing for fair token launches. While it uses simulated Arcium integration (standard NaCl encryption with a trusted off-chain processor), the architecture is sound and could be upgraded to real MPC/TEE.

**Key Takeaways**:
1. Strong Arcium bounty candidate due to narrative alignment
2. Complete E2E flow with polished UI
3. Practical use case (anti-MEV launchpads)
4. Honest about limitations (self-audit document)
5. Clear upgrade path to production (Token-2022, Arcium DKG)

The main limitation is the centralized trust model - the Cypher Node operator can see all bids. True privacy would require actual Arcium MPC or ZK proofs of correct auction execution.

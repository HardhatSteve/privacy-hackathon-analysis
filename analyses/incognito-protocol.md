# Incognito Protocol Analysis

**Repository:** https://github.com/ChupaSOLANA/incognito-protocol
**Last Commit:** `3baaee4` - "Mise a jour de la web interface"

---

## 1. Project Overview

Incognito Protocol is a **privacy-focused decentralized marketplace** built on Solana that combines multiple privacy technologies to enable private commerce. The system allows users to buy and sell goods while keeping transaction amounts, balances, and identities private.

### Core Components

1. **Privacy Pool (Incognito Contract)** - UTXO-style shielded pool for SOL with Merkle tree commitments
2. **Escrow Contract** - Full-featured marketplace escrow with encrypted shipping, dispute resolution, and reputation
3. **Arcium MPC Integration** - Off-chain confidential computing for balance operations
4. **Off-chain Services** - Python FastAPI backend with PostgreSQL, end-to-end encrypted note storage
5. **Dashboard** - Streamlit-based UI for marketplace interactions

### Key Value Proposition

Private marketplace where:
- Transaction amounts are hidden (encrypted balances via Arcium MPC)
- Deposits/withdrawals are unlinkable (Merkle tree privacy pool)
- Shipping addresses are end-to-end encrypted
- Buyer/seller identities use stealth addresses
- Reputation can be computed privately via MPC

---

## 2. Track Targeting

**Primary Track: Privacy/Confidential DeFi**

This project squarely targets the privacy track with:
- Confidential transfers (Arcium MPC + Token-2022 planned)
- Privacy pool notes (UTXO-style deposits with Merkle proofs)
- Encrypted messaging between buyer/seller
- Stealth address support

**Secondary: Marketplace/Commerce**

Full e-commerce escrow system with:
- Order lifecycle (create, accept, ship, deliver, complete)
- Automated dispute resolution with arbiters
- Reputation system (public or private via MPC)
- Timeout handling for each phase

---

## 3. Tech Stack

### On-Chain (Solana Programs)

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Anchor | 0.31.1 |
| Confidential Computing | Arcium | 0.3.0 |
| Token Standard | SPL Token-2022 | 6.0 |
| Language | Rust | 2021 edition |

**Two Solana Programs:**
1. `incognito` (4N49EyRoX9p9zoiv1weeeqpaJTGbEHizbzZVgrsrVQeC) - Privacy pool
2. `escrow` (5QvQbnrL7fKpM5pCMS3zNqgTK8ALNkgHgRvgd49YF7v4) - Marketplace escrow

### Off-Chain

| Component | Technology |
|-----------|------------|
| API Server | Python FastAPI (uvicorn) |
| Database | PostgreSQL with SQLAlchemy |
| Migrations | Alembic |
| Dashboard | Streamlit |
| Crypto | PyNaCl (libsodium), solders |
| Client Scripts | TypeScript with Anchor SDK |

---

## 4. Cryptographic Primitives

### Merkle Tree (Privacy Pool)

```rust
// On-chain Merkle tree with depth up to 32
pub const MAX_MERKLE_DEPTH: usize = 32;

// Hash functions
fn h2(a: &[u8; 32], b: &[u8; 32]) -> [u8; 32] {
    hashv(&[a, b]).to_bytes()  // Solana's SHA-256 based hash
}

fn leaf_from(commitment: &[u8; 32], nf_hash: &[u8; 32]) -> [u8; 32] {
    h2(commitment, nf_hash)  // Commitment bound to nullifier hash
}
```

**Note Structure:**
- `commitment` = hash(secret, amount, owner_pubkey)
- `nullifier` = derived from secret (reveals on spend)
- `leaf` = h2(commitment, h1(nullifier))

### Nullifier-Based Double-Spend Prevention

```rust
// Nullifier marker PDA prevents reuse
#[account(
    init,
    payer = recipient,
    space = 8,
    seeds = [NULLIFIER_SEED, nullifier.as_ref()],
    bump
)]
pub nullifier_marker: Account<'info, NullifierMarker>,
```

### Arcium MPC (Confidential Computing)

**Encrypted Instructions (Arcis Framework):**

```rust
// Balance operations happen in MPC
#[instruction]
pub fn deposit_shielded(input_ctxt: Enc<Shared, BalanceInput>) -> Enc<Shared, u64> {
    let input = input_ctxt.to_arcis();
    let new_balance = input.balance + input.amount;
    input_ctxt.owner.from_arcis(new_balance)
}

#[instruction]
pub fn withdraw_shielded(input_ctxt: Enc<Shared, BalanceInput>) -> (Enc<Shared, u64>, bool) {
    let input = input_ctxt.to_arcis();
    let can = input.balance >= input.amount;
    let new_balance = if can { input.balance - input.amount } else { input.balance };
    (input_ctxt.owner.from_arcis(new_balance), can.reveal())
}
```

**MPC Operations:**
- Balance deposits/withdrawals
- Reputation score calculation
- Escrow amount verification
- Platform fee calculation
- Dispute win distribution

### Client-Side Encryption

```python
# E2E encrypted note storage (NaCl SecretBox)
def encrypt_note(note_data, keypair):
    encryption_key = keypair_bytes[:32]  # Derive from Solana keypair
    box = SecretBox(encryption_key)
    encrypted = box.encrypt(json.dumps(note_data).encode())
    return {"ciphertext": base64(ciphertext), "nonce": base64(nonce)}
```

### Stealth Addresses

```python
# One-time addresses for wrapper fee collection
@dataclass
class WrapperStealthAddress:
    stealth_address: str
    ephemeral_pub: str
    initial_amount: int  # 50,000,000 lamports (0.05 SOL)
```

---

## 5. Solana Integration

### Program Architecture

**Incognito Program (Privacy Pool):**

| Instruction | Description |
|-------------|-------------|
| `init_vault` | Initialize SOL vault PDA |
| `init_pool` | Create Merkle tree with configurable depth |
| `deposit_to_pool` | Deposit SOL, add commitment to tree |
| `withdraw_from_pool` | Withdraw with Merkle proof + nullifier |
| `add_claim_note` | Add payment notes (escrow seller payments) |
| `verify_proof` | Verify Merkle membership |
| Arcium callbacks | deposit_shielded, withdraw_shielded, etc. |

**Escrow Program:**

| Instruction | Description |
|-------------|-------------|
| `initialize_platform` | Set platform config (fees, deadlines) |
| `initialize_arbiter_pool` | Create arbiter pool |
| `create_order` | Buyer creates order with encrypted shipping |
| `accept_order` | Seller accepts and stakes |
| `mark_shipped` | Seller provides tracking |
| `confirm_delivery` | Buyer confirms receipt |
| `finalize_order` | Release funds after dispute window |
| `open_dispute` / `resolve_dispute` | Arbiter-mediated resolution |
| Private MPC callbacks | reputation, fee calculation, etc. |

### Account Structure

**Privacy Pool:**
```rust
pub struct PoolState {
    pub root: [u8; 32],       // Current Merkle root
    pub depth: u8,            // Tree depth
    pub leaf_count: u64,      // Number of leaves
    pub bump: u8,
}

pub struct SolVault {
    pub total_deposited: u64,
    pub bump: u8,
}
```

**Escrow:**
```rust
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub arbiter: Pubkey,
    pub amount: u64,
    pub seller_stake: u64,
    pub platform_fee: u64,
    pub state: EscrowState,  // Created/Accepted/Shipped/Delivered/Completed/Disputed/Refunded
    pub encrypted_shipping: Vec<u8>,  // E2E encrypted
    pub tracking_number: String,
    pub use_private_reputation: bool,
    // ... timestamps, etc.
}
```

### Platform Configuration

```rust
platform_fee_bps: 200,        // 2% platform fee
seller_stake_bps: 1000,       // 10% seller stake
acceptance_deadline: 86400,   // 1 day
shipping_deadline: 604800,    // 7 days
delivery_deadline: 1209600,   // 14 days
dispute_window: 604800,       // 7 days
arbiter_deadline: 259200,     // 3 days
```

---

## 6. Sponsor Bounties

### Primary: Arcium Bounty (Strong Match)

**Deep Arcium Integration:**
- 11 MPC computation definitions
- Queue computation + callback pattern
- Encrypted balance operations
- Private reputation calculation
- Escrow amount verification

**Arcis Framework Usage:**
```rust
#[encrypted]
mod circuits {
    #[instruction]
    pub fn calculate_reputation_score(input_ctxt: Enc<Shared, ReputationInput>) -> Enc<Shared, u64> {
        // Private reputation logic
    }
}
```

### Secondary Considerations

| Sponsor | Relevance | Notes |
|---------|-----------|-------|
| Token-2022 | Planned | CSOL_IMPLEMENTATION_GUIDE.md shows future plans |
| Marketplace | High | Full escrow + listings + messaging |
| Privacy | Core | Merkle pool, nullifiers, stealth addresses |

---

## 7. Alpha/Novel Findings

### Innovative Approaches

1. **Dual Privacy Layer**
   - On-chain: Merkle tree privacy pool (UTXO-style)
   - Off-chain: Arcium MPC for balance operations
   - Hybrid approach providing both transaction and computational privacy

2. **Wrapper Fee Collection via Stealth Addresses**
   ```python
   WRAPPER_FEE_LAMPORTS = 50_000_000  # 0.05 SOL per deposit
   # Stealth addresses receive fees, can be swept by operator
   ```

3. **Commitment-Bound Nullifiers**
   - Leaf = h2(commitment, h1(nullifier))
   - Prevents nullifier grinding attacks
   - Links commitment to nullifier cryptographically

4. **Seller Payment Notes**
   - Escrow completion creates "claim notes" for sellers
   - Sellers can withdraw from privacy pool using note
   - Breaks link between buyer payment and seller withdrawal

5. **Private Reputation via MPC**
   - Reputation stats can be computed confidentially
   - `use_private_reputation` flag enables MPC path
   - Scores remain encrypted, only revealed on demand

### Technical Decisions

- **SHA-256 based Merkle hashing** (via Solana's `hashv`)
- **Configurable tree depth** (up to 32 levels)
- **Change notes** supported (partial spends)
- **Client-side encryption** with NaCl SecretBox

---

## 8. Strengths and Weaknesses

### Strengths

1. **Comprehensive Privacy Stack**
   - Multiple layers: Merkle proofs, MPC, E2E encryption, stealth addresses
   - Well-thought-out privacy model

2. **Deep Arcium Integration**
   - Not superficial - actually uses MPC for meaningful operations
   - Private reputation is a novel use case

3. **Full Marketplace Functionality**
   - Complete escrow state machine
   - Dispute resolution with arbiters
   - Timeout handling at every stage

4. **Production-Ready Architecture**
   - PostgreSQL with proper migrations (Alembic)
   - SQLAlchemy ORM with privacy-conscious model design
   - Logging, error handling, rate limiting

5. **Good Security Practices**
   - Pubkeys hashed before storage
   - Nullifier double-spend prevention
   - Client-side encryption for sensitive data

### Weaknesses

1. **No ZK Proofs**
   - Merkle proofs reveal tree structure
   - No range proofs for amounts
   - Relies on Arcium trust assumptions rather than pure ZK

2. **Off-Chain Dependency**
   - Requires Arcium localnet for MPC
   - API server is a centralization point (even if "blind")
   - Merkle tree sync between on-chain and off-chain

3. **Incomplete Token-2022 Integration**
   - CSOL implementation documented but not implemented
   - Currently uses native SOL only

4. **Privacy Pool Limitations**
   - Fixed denomination not enforced (amounts visible in commitments)
   - Anonymity set depends on usage volume

5. **Complexity**
   - Many moving parts (2 programs, API, database, dashboard)
   - Arcium dependency adds operational complexity

---

## 9. Threat Level

### Competitive Assessment: **HIGH**

| Factor | Score | Notes |
|--------|-------|-------|
| Technical Depth | 9/10 | Deep Arcium integration, full Merkle pool |
| Novelty | 8/10 | Private reputation, dual-layer privacy |
| Completeness | 7/10 | Missing Token-2022, some gaps |
| Polish | 6/10 | Dashboard exists but web-interface empty |
| Sponsor Fit | 9/10 | Perfect for Arcium bounty |

**Why High Threat:**
- Only project with serious Arcium MPC usage for privacy
- Novel use cases (private reputation, seller payment notes)
- Working privacy pool with proper nullifier handling
- Full marketplace functionality

- Focus on ZK proofs (STARKs) vs. MPC trust assumptions
- Emphasize fixed denominations for better anonymity
- Token-2022 confidential transfers as native (not planned)

---

## 10. Implementation Completeness

### Fully Implemented

- [x] Privacy pool with Merkle tree (depth configurable)
- [x] Deposit/withdraw with commitments and nullifiers
- [x] Arcium MPC integration (balance ops, reputation)
- [x] Escrow state machine (full lifecycle)
- [x] Encrypted shipping addresses
- [x] Arbiter-based dispute resolution
- [x] Stealth address generation
- [x] Client-side encryption for notes
- [x] PostgreSQL data model
- [x] FastAPI backend with authentication
- [x] Streamlit dashboard (basic)

### Partially Implemented

- [ ] Token-2022 cSOL (documented, not coded)
- [ ] Web interface (directory exists but empty)
- [ ] IPFS content storage (referenced but unclear)
- [ ] Reputation encryption (callback exists, UI unclear)

### Not Implemented

- [ ] Zero-knowledge proofs (relies on MPC)
- [ ] Fixed denominations (privacy pool accepts any amount)
- [ ] Cross-chain bridging
- [ ] Mobile interface

### Code Quality

```
Lines of Code (Estimated):
- Rust (contracts): ~4,500 LOC
- Python (services): ~6,000 LOC
- TypeScript (scripts): ~1,500 LOC
```

**Architecture Quality:** Good separation of concerns, proper use of PDAs, comprehensive error handling.

**Test Coverage:** Test scripts exist for escrow flows (test1-test8), but no formal test suite visible.

---

## Summary

Incognito Protocol is a **serious competitor** in the privacy track, particularly for Arcium bounties. It demonstrates deep understanding of privacy primitives and MPC integration, with a complete marketplace built on top. The main weaknesses are reliance on MPC trust assumptions (vs. ZK proofs), incomplete Token-2022 integration, and operational complexity.

- Uses Arcium MPC vs. STARKs for privacy
- Variable amounts vs. fixed denominations
- Marketplace-focused vs. general-purpose privacy pool
- Off-chain heavy vs. on-chain focused

# AuroraZK Submission Analysis

## 1. Project Overview

**AuroraZK** is a **dark pool limit order DEX** on Solana that aims to provide privacy at multiple layers of trading:

- **Order Privacy**: Orders are submitted as cryptographic commitments using Noir zero-knowledge circuits. Price, size, and intent remain hidden until execution.
- **Fund Privacy**: Leverages Light Protocol for ZK-compressed deposits, hiding amounts on-chain.
- **Withdrawal Unlinkability**: Withdrawals can go to any wallet with no traceable link to the original deposit.

The project implements a commit-reveal pattern where:
1. User deposits funds into a shielded dark pool (via Light Protocol compression)
2. User places orders as hidden commitments with ZK range proofs
3. Off-chain matcher finds counterparties and executes matches
4. Settlement occurs with optional unlinkable withdrawals

**Live Demo**: https://aurorazkhost.vercel.app (Devnet)

**Program ID**: `4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi`

---

## 2. Track Targeting

AuroraZK explicitly targets **three hackathon tracks**:

| Track | Bounty | Integration Status |
|-------|--------|-------------------|
| **Aztec/Noir** | $10,000 | Deployed (range proofs, Groth16) |
| **Light Protocol** | $18,000 pool | Integrating (ZK compression) |
| **Helius** | $5,000 | Integrated (RPC infrastructure) |

**Total Bounty Target**: $33,000

---

## 3. Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Radix UI** primitives
- **Framer Motion** for animations
- **@solana/wallet-adapter** for wallet connections

### Backend/Matcher Service
- **Node.js/Express** server
- **WebSocket** for real-time updates
- **TweetNaCl** for encryption (box/secretbox)
- **Anchor SDK** for Solana interaction

### Solana Program
- **Anchor 0.30.1** framework
- Custom order book program with:
  - Commit-reveal pattern for orders
  - Partial fill support (GTC, IOC, FOK, AON fill types)
  - Per-user balance PDAs
  - Order expiration (max 7 days)

### Zero-Knowledge
- **Noir** circuits for range proofs
- **Barretenberg** backend (WASM-based proving)
- **Pedersen hash** commitments

---

## 4. Crypto Primitives

### Commitment Scheme
The on-chain commitment uses **SHA-256** hash:
```rust
fn compute_commitment(price: u64, size: u64, nonce: &[u8; 32]) -> [u8; 32] {
    let mut data = Vec::with_capacity(48);
    data.extend_from_slice(&price.to_le_bytes());
    data.extend_from_slice(&size.to_le_bytes());
    data.extend_from_slice(nonce);
    hash(&data).to_bytes()
}
```

**Note**: The Noir circuit uses **Pedersen hash** for commitments, which is a different primitive than the on-chain SHA-256 verification. This is a potential mismatch.

### Range Proofs (Noir)
```noir
fn main(
    price: Field,
    size: Field,
    nonce: Field,
    min_price: pub Field,
    max_price: pub Field,
    min_size: pub Field,
    max_size: pub Field
) -> pub Field {
    let commitment = pedersen_hash([price, size, nonce]);
    assert(price as u64 >= min_price as u64);
    assert(price as u64 <= max_price as u64);
    assert(size as u64 >= min_size as u64);
    assert(size as u64 <= max_size as u64);
    commitment
}
```

**Proves**:
- Price is within valid range (without revealing actual price)
- Size is within valid range (without revealing actual size)
- Prover knows values that hash to the commitment

### Encryption (Order Submission)
- **NaCl box** (curve25519-xsalsa20-poly1305) for encrypting orders to matcher
- Ephemeral keypairs for forward secrecy

### Light Protocol Integration
- **ZK Compression** for shielded deposits
- State trees for Merkle-based account storage
- Compressed SOL transfers (hidden amounts)
- Decompression to arbitrary addresses (unlinkability)

---

## 5. Solana Integration

### Program Architecture

```
OrderBook (PDA)
  - authority: Pubkey
  - base_mint: Pubkey (SOL)
  - quote_mint: Pubkey (USDC)
  - total_orders: u64
  - total_filled: u64
  - total_volume: u64

Order (Account)
  - owner: Pubkey
  - commitment_hash: [u8; 32]
  - range_proof: Vec<u8> (max 256 bytes)
  - is_buy: bool
  - timestamp: i64
  - expiration: i64
  - filled: bool
  - cancelled: bool
  - order_id: u64
  - original_size: u64
  - filled_size: u64
  - fill_count: u8
  - fill_type: OrderFillType
  - min_fill_size: u64

UserBalance (PDA)
  - owner: Pubkey
  - sol_balance: u64
  - usdc_balance: u64
```

### Instructions
1. `initialize` - Create order book for trading pair
2. `place_order` - Submit hidden order with commitment
3. `init_user_balance` - Initialize user balance PDA
4. `deposit_dark_pool` - Record deposit into ledger
5. `withdraw_dark_pool` - Record withdrawal from ledger
6. `reveal_and_match` - Matcher reveals and matches two orders
7. `partial_fill` - Partially fill an order
8. `cancel_order` - Cancel unfilled order
9. `expire_order` - Expire old order (anyone can call)
10. `close_order` - Close filled/cancelled order, reclaim rent

### Key Security Features
- Commitment verification on reveal
- Price compatibility checks (buy >= sell)
- Balance validation before trades
- Order ownership checks for cancellation
- Expiration enforcement

---

## 6. Sponsor Bounties

### Aztec/Noir ($10,000)
**Status**: Deployed

- Two Noir circuits deployed:
  - `commitment_helper` - Simple Pedersen commitment
  - `range_proof` - Full range proof with bounds checking
- Client-side proof generation using `@noir-lang/noir_js` and `@noir-lang/backend_barretenberg`
- Verifier program ID: `Ef8SgV5RCp4e7g3tKKQHwvpYcPoGXqZkoTTVTrhnG2MZ` (Sunspot-generated)
- **Fallback mode**: Orders can be placed without proofs if Noir initialization fails

### Light Protocol ($18,000)
**Status**: Integrating (partial)

- Full SDK integration attempted (`@lightprotocol/stateless.js`)
- Compress/decompress SOL operations implemented
- Devnet state tree addresses configured
- **Key feature**: Decompression to arbitrary addresses for unlinkability
- **Fallback**: Standard transfers if SDK unavailable
- Compressed balance tracking
- Local deposit record storage

### Helius ($5,000)
**Status**: Integrated

- Helius RPC endpoint configured for compression support
- Automatic detection of Helius vs standard RPC
- Enhanced RPC features utilized

---

## 7. Alpha/Novel Findings

### Innovative Concepts

1. **Layered Privacy Architecture**
   - Order privacy (Noir ZK proofs)
   - Fund privacy (Light Protocol compression)
   - Withdrawal unlinkability (decompress to any address)
   - This multi-layer approach is comprehensive

2. **Commit-Reveal for Order Matching**
   - Orders submitted as commitments only
   - Actual values revealed only at match time
   - Prevents frontrunning/sandwiching

3. **Off-chain Matching with On-chain Settlement**
   - Centralized matcher for speed
   - Atomic on-chain settlement for trustlessness
   - WebSocket for real-time updates

4. **Price Tolerance System**
   - BUY orders commit to higher price (willing to pay up to)
   - SELL orders commit to lower price (willing to accept down to)
   - Ensures price compatibility always passes

### Technical Insights

1. **Dual Commitment Systems**
   - Noir uses Pedersen hash
   - On-chain uses SHA-256
   - This mismatch could be a design choice or oversight

2. **Fallback Patterns**
   - Graceful degradation when ZK systems unavailable
   - Orders can still be placed without proofs
   - Light Protocol falls back to standard transfers

3. **Balance Tracking**
   - On-chain PDAs track per-user balances
   - Dark pool balance separate from wallet balance
   - Enables atomic internal settlement

---

## 8. Strengths/Weaknesses

### Strengths

1. **Comprehensive Feature Set**
   - Full order types (GTC, IOC, FOK, AON)
   - Partial fills support
   - Order expiration and cleanup
   - Real-time WebSocket updates

2. **Production-Ready Frontend**
   - Polished UI with animations
   - Wallet integration
   - Balance displays and order tracking
   - Progress indicators for order lifecycle

3. **Well-Documented Code**
   - Clear comments explaining privacy model
   - Detailed error handling
   - Logging for debugging

4. **Multi-Bounty Targeting**
   - Strategic integration of three sponsor technologies
   - Each integration is functional (at least partially)

5. **Security Considerations**
   - Math overflow checks
   - Balance validation
   - Owner verification
   - Expiration enforcement

### Weaknesses

1. **Commitment Hash Mismatch**
   - Noir circuit uses Pedersen hash
   - On-chain uses SHA-256
   - This breaks the zero-knowledge property - the range proof commitment won't match on-chain

2. **Centralized Matcher**
   - Single point of trust for order matching
   - Could see order flow before execution
   - Mentioned as future work (MPC matching)

3. **Incomplete Light Protocol Integration**
   - SDK loading issues in browser (worker_threads)
   - Fallback mode often used
   - Compression may not work reliably

4. **No On-chain Proof Verification**
   - Range proofs generated but stored as bytes only
   - On-chain program doesn't verify Noir proofs
   - Verifier program exists but not called during order placement

5. **Privacy Leaks**
   - Order book stats reveal aggregate information
   - Matcher sees decrypted orders
   - Trade events are public

6. **Limited Token Support**
   - Only SOL/USDC trading pair
   - USDC mint hardcoded for devnet

---

## 9. Threat Level Assessment

**Competitive Threat Level: MEDIUM-HIGH**

### Reasons for High Rating:
- **Multi-bounty strategy** maximizes prize potential
- **Working demo** with live deployment
- **Novel dark pool concept** on Solana
- **Good presentation** with clear documentation
- **Functional matcher** with real order flow

### Reasons Against Higher Rating:
- **Technical gaps** in ZK verification (Pedersen vs SHA-256 mismatch)
- **Light Protocol partially broken** (SDK issues)
- **Centralized trust** in matcher
- **No actual on-chain proof verification**

### Bounty Likelihood:
- **Noir/Aztec**: Medium (circuits exist but verification incomplete)
- **Light Protocol**: Low-Medium (SDK integration issues)
- **Helius**: Medium-High (straightforward RPC integration)

---

## 10. Implementation Completeness

| Component | Status | Completeness |
|-----------|--------|--------------|
| Solana Program | Deployed | 95% |
| Order Placement | Working | 90% |
| Order Matching | Working | 85% |
| Noir Circuits | Deployed | 80% |
| Noir Proof Generation | Working | 75% |
| On-chain Proof Verification | Not Implemented | 10% |
| Light Protocol Compression | Partial | 50% |
| Light Protocol Decompression | Partial | 40% |
| Frontend UI | Polished | 90% |
| WebSocket Updates | Working | 85% |
| Wallet Integration | Working | 95% |

### Missing/Incomplete Features:
1. On-chain Noir proof verification in order placement
2. Reliable Light Protocol SDK initialization
3. Real compressed account support
4. Multi-matcher decentralization
5. Cross-token support
6. Fee collection (disabled for hackathon)

### What Works Well:
1. Basic order flow (place, match, settle)
2. Commitment verification on reveal
3. Balance tracking and updates
4. Real-time order book updates
5. Order cancellation and expiration

---

## Summary

AuroraZK is an ambitious dark pool DEX that attempts to provide end-to-end privacy for Solana trading. The project demonstrates strong engineering effort with a working demo, deployed program, and multi-layer privacy architecture.

**Key Innovation**: Combining Noir ZK proofs, Light Protocol compression, and commit-reveal patterns for comprehensive trading privacy.

**Critical Issue**: The Pedersen hash (Noir) vs SHA-256 (on-chain) commitment mismatch undermines the zero-knowledge property of the range proofs.

**Verdict**: A technically impressive submission that may win bounties for integration effort, but has fundamental cryptographic issues that would need to be addressed for production use. The multi-bounty strategy is clever but may result in partial implementations that don't fully satisfy any single track.

# Epoch - Privacy-Preserving Prediction Market

## 1. Project Overview

**Epoch** is a privacy-preserving prediction market built on Solana that uses **Arcium MPC (Multi-Party Computation)** to hide bet directions (YES/NO) until market resolution. The system prevents front-running, copy trading, and outcome manipulation by keeping user positions encrypted throughout the betting period.

### Core Value Proposition
- Users place bets with encrypted outcomes using client-side encryption via Arcium's X25519/Rescue cipher
- Bet directions remain hidden during the entire betting phase
- Payouts are computed via MPC after market resolution
- On-chain enforcement via Anchor smart contracts

### Project Maturity
- Deployed to **Solana Devnet**: `JAycaSPgFD8hd4Ys7RuJ5pJFzBL8pf11BT8z5HMa1zhZ`
- Working frontend with Privy wallet integration
- Complete market lifecycle implemented (create -> open -> bet -> close -> resolve -> claim)
- Comprehensive test suite for both localnet and devnet

---

## 2. Track Targeting

### Primary Target: **Privacy Tooling Track ($15k)**
- **Strong Fit**: The project directly targets privacy-preserving financial operations
- Demonstrates practical MPC integration for betting privacy
- Solves a real problem: front-running and copy trading in prediction markets

### Secondary Target: **Open Track ($18k)**
- Novel application of MPC to prediction markets on Solana
- Well-executed DeFi primitive with privacy guarantees

### Unlikely: Private Payments Track ($15k)
- Not focused on payments/transfers
- Prediction market application is tangential to payment privacy

---

## 3. Tech Stack

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.1.3 (App Router) |
| UI | React 19.2.3, Tailwind CSS 4, Framer Motion |
| Wallet | Privy Auth 3.12.0 |
| Web3 | @coral-xyz/anchor 0.30.1, @solana/web3.js 1.98.4 |
| Infrastructure | Helius RPC & WebSockets |

### Smart Contract
| Component | Technology |
|-----------|------------|
| Framework | Anchor 0.32.1 |
| Language | Rust |
| Token Standard | SPL Token |
| MPC Integration | Arcium SDK 0.6.3 |

### MPC Layer
| Component | Technology |
|-----------|------------|
| Client | @arcium-hq/client 0.6.4 |
| Encrypted Instructions | arcis 0.6.3 |
| Cipher | Rescue (symmetric) + X25519 (key exchange) |
| Backend | Cerberus MPC network |

---

## 4. Crypto Primitives

### Encryption Flow
```
1. Client generates X25519 keypair (ephemeral)
2. Derives shared secret with MXE (Arcium) public key
3. Creates RescueCipher from shared secret
4. Encrypts [outcome, amount] with random 128-bit nonce
5. Submits 64-byte ciphertext on-chain
```

### Primitives Used
| Primitive | Purpose | Implementation |
|-----------|---------|----------------|
| **X25519** | Diffie-Hellman key exchange | @arcium-hq/client |
| **Rescue** | MPC-friendly symmetric cipher | RescueCipher class |
| **Blake3** | Hashing in encrypted instructions | blake3 crate |
| **SHA-512** | Not directly used (no EdDSA) | N/A |

### MPC Computation Definitions
Two encrypted instruction types:
1. **process_bet**: Validates and processes encrypted bets
   - Input: `{outcome: u8, amount: u64}`
   - Output: `{validated_outcome, validated_amount, success}`

2. **compute_payout**: Calculates payouts after resolution
   - Input: `{user_outcome, user_amount, winning_outcome, winning_pool, losing_pool}`
   - Output: `{payout: u64}`

---

## 5. Solana Integration

### Program Architecture
```
contract/
├── lib.rs              # Main program with 12 instructions
├── state/
│   ├── market.rs       # DarkMarket account (market state)
│   ├── pool.rs         # EncryptedPoolState (MPC state)
│   └── position.rs     # UserPosition (individual bets)
├── constants.rs        # PDA seeds, size limits
├── errors.rs           # 30 custom error codes
└── events.rs           # 9 event types for indexing
```

### Instructions (12 total)
| Instruction | Purpose |
|-------------|---------|
| `init_process_bet_comp_def` | Initialize MPC computation definition |
| `init_compute_payout_comp_def` | Initialize payout MPC definition |
| `create_market` | Create new prediction market |
| `open_market` | Open for betting |
| `place_bet` | Submit encrypted bet + deposit tokens |
| `process_bet_callback` | Arcium callback after bet processing |
| `close_betting` | End betting period |
| `resolve_market` | Declare winning outcome |
| `compute_payout` | Request payout computation via MPC |
| `compute_payout_callback` | Arcium callback with payout result |
| `claim_payout` | Winner claims tokens |
| `claim_refund` | Refund for cancelled markets |
| `cancel_market` | Authority cancels market |

### Account Structure
- **DarkMarket**: ~400 bytes (market metadata, timestamps, status)
- **EncryptedPoolState**: ~350 bytes (MPC state, version tracking)
- **UserPosition**: ~250 bytes (encrypted bet, deposit, payout)
- **Vault**: SPL Token account (PDA-controlled)

### Security Model
- PDA-based vault authority (no private key)
- Authority-only market control operations
- Proper constraint checks on all accounts
- Overflow protection with checked arithmetic

---

## 6. Sponsor Bounty Targeting

### Arcium (Primary Sponsor)
- **HEAVY integration** with Arcium MPC SDK
- Uses: `arcium-anchor`, `arcium-client`, `arcium-macros`, `arcis`
- Demonstrates encrypted computation pattern for DeFi
- **High probability of Arcium bounty**

### Helius
- Uses Helius for RPC and WebSocket connections
- Custom WebSocket hook for real-time updates
- **Moderate fit** for Helius infrastructure bounty

### Privy
- Full Privy wallet authentication integration
- Custom `usePrivyWallet` hook
- **Moderate fit** for Privy bounty

### Light Protocol
- Dependency present: `@lightprotocol/hasher.rs` (for wasm hashing)
- Minimal actual integration
- **Low fit** for Light Protocol bounty

---

## 7. Alpha/Novel Findings

### Technical Innovation
1. **First MPC-based prediction market on Solana**: Novel application of Arcium for betting privacy
2. **Rescue cipher for on-chain encrypted state**: Efficient MPC-friendly encryption
3. **Callback pattern for MPC results**: Clean async integration with Arcium

### Design Patterns Worth Noting
```rust
// Encrypted instruction pattern
#[arcium_callback(encrypted_ix = "process_bet")]
pub fn process_bet_callback(
    ctx: Context<ProcessBetCallback>,
    output: SignedComputationOutputs<ProcessBetOutput>,
) -> Result<()> {
    // Verify MPC computation output
    let result = output
        .verify_output(&ctx.accounts.cluster_account, &ctx.accounts.computation_account)
        .map_err(|_| DarkPoolError::ComputationAborted)?;
    // Update state with verified result
}
```

### Potential Weaknesses Found
1. **Single market authority**: Centralized resolution (authority sets winning outcome)
2. **No oracle integration**: Manual resolution by authority, not automated
3. **Token deposit leakage**: Deposit amounts are visible on-chain (only direction is hidden)
4. **Single position per user**: Users can only have one bet per market

---

## 8. Strengths & Weaknesses

### Strengths
| Aspect | Detail |
|--------|--------|
| **Implementation Quality** | Clean Anchor code, proper error handling, comprehensive tests |
| **Arcium Integration** | Deep integration shows understanding of MPC patterns |
| **Full Stack** | Working frontend with wallet integration |
| **Event Emission** | Good indexability with 9 event types |
| **Security** | Proper PDA patterns, checked arithmetic, constraint validation |
| **UX** | Modern UI with Privy embedded wallets |

### Weaknesses
| Aspect | Detail |
|--------|--------|
| **Privacy Leakage** | Deposit amounts are public; only direction is hidden |
| **Centralization** | Market resolution depends on trusted authority |
| **No Oracle** | Manual resolution creates trust assumptions |
| **Limited Flexibility** | One bet per user per market |
| **MPC Latency** | Arcium computation adds latency to bet processing |
| **Devnet Only** | No mainnet deployment or audit |

### Missing Features
- Oracle-based resolution (Pyth, Switchboard)
- Multiple positions per user
- Partial bet withdrawal
- Market creation fees
- Liquidity provider mechanism

---

## 9. Threat Level Assessment

### **Threat Level: MODERATE**

#### Rationale
| Factor | Assessment |
|--------|------------|
| **Technical Execution** | High - Well-implemented MPC integration |
| **Novelty** | High - First MPC prediction market on Solana |
| **Completeness** | Medium - Working but devnet only |
| **Competition Risk** | Medium - Unique in MPC space but competes with other prediction markets |
| **Sponsor Alignment** | High - Strong Arcium integration |

- **Different Problem Space**: Epoch solves betting privacy, not payment/shielded pool privacy
- **Technology Overlap**: Both use privacy tech on Solana, but different primitives (MPC vs ZK)
- **Bounty Competition**: May compete for general privacy tooling prize

---

## 10. Implementation Completeness

### Feature Checklist
| Feature | Status | Notes |
|---------|--------|-------|
| Market Creation | Complete | Full lifecycle with timestamps |
| Encrypted Betting | Complete | X25519 + Rescue cipher |
| MPC Processing | Complete | Arcium integration working |
| Payout Computation | Complete | MPC-based payout calculation |
| Token Vault | Complete | PDA-controlled SPL token vault |
| Claim/Refund | Complete | Winner claims, cancelled markets refund |
| Frontend | Complete | Next.js with Privy wallet |
| Tests | Complete | Localnet + devnet test suites |
| Devnet Deploy | Complete | `JAycaSPgFD8hd4Ys7RuJ5pJFzBL8pf11BT8z5HMa1zhZ` |
| Mainnet Deploy | Not Started | No production deployment |
| Audit | Not Started | No security audit |
| Documentation | Partial | README exists, no detailed docs |

### Code Quality Metrics
- **Lines of Code**: ~1,500 Rust (contract), ~800 TypeScript (frontend)
- **Test Coverage**: Good coverage for happy paths
- **Error Handling**: Comprehensive with 30 custom error types
- **Event Logging**: All state changes emit events

### Overall Assessment
**75% Complete** - Functional MVP with solid Arcium integration. Missing oracle integration, mainnet deployment, and audit for production readiness.

---

## Summary


**Key Takeaway**: Strong Arcium showcase project with novel application, but limited threat due to orthogonal use case.

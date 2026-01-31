# WAVIS Protocol - Analysis

## 1. Project Overview
WAVIS is a "Compliance-Ready Shielded Pool" for Solana, combining privacy with regulatory compliance through a "Proof of Innocence" concept. It implements a yield-bearing vault where users deposit USDC, receive internal shares, and can withdraw with yield. The protocol includes a sanctions list/allowlist check inspired by Vitalik's Privacy Pools proposal.

**Key Concept**: "Swiss Bank on Solana" - privacy with compliance via proving funds are NOT on a sanctions list.

## 2. Track Targeting
**Private Payments** - The vault system with deposits/withdrawals and yield is clearly a private payments application. The compliance layer adds regulatory positioning.

## 3. Tech Stack
- **ZK System**: **MOCKED** - ZK verification is simulated, not implemented
- **Languages**: Rust (Anchor), TypeScript (frontend)
- **Frameworks**: Anchor 0.29.0
- **Key dependencies**:
  - `anchor-lang` 0.29.0
  - `anchor-spl` 0.29.0
  - `constant_time_eq` 0.3.0

## 4. Crypto Primitives
**Partially Mocked**:
- **Nullifier Hash**: Referenced in design (`nullifier_hash: [u8; 32]` in structs) but not implemented
- **Merkle Root for Sanctions**: `compliance_root: [u8; 32]` referenced but not used
- **Proof of Innocence**: Conceptually described (prove deposit NOT in sanctions tree) but mocked

**No actual ZK circuits** - README explicitly states ZK is simulated.

## 5. Solana Integration
**Real Anchor Program** deployed to devnet with:

**PDAs**:
- `State` PDA: seeds = `["state"]` - Global config
- `UserVault` PDA: seeds = `["user_vault", user.key()]` - Per-user shares

**Instructions**:
1. `initialize` - Create global state with admin
2. `admin_update_blacklist` - Add/remove addresses from blocklist
3. `deposit` - Deposit USDC, receive shares, apply yield
4. `withdraw` - Burn shares, receive USDC minus fee

**Features**:
- Shadow Yield: 0.01% per second (demo rate, unrealistic)
- Ingress Filtering: Blacklist check before deposit
- CPI to SPL Token for transfers
- PDA signing for withdrawals

**Program ID**: `GjWUevQsr5QLWxRzXNpVCZKkQmjEdjijEA65JujZ2HXS`

## 6. Sponsor Bounty Targeting
- **Light Protocol**: Mentioned as Phase 2 integration target
- **Chainlink**: Mentioned for real-time sanctions oracle
- Not actively using any sponsor tech currently

## 7. Alpha/Novel Findings
1. **Proof of Innocence concept**: Clever regulatory framing - prove you're NOT on sanctions list without revealing identity
2. **Yield-bearing privacy**: Combining privacy with DeFi yield is a differentiator
3. **Honest disclosure**: Clear about what's mocked vs. real
4. **Japanese comments**: Developer(s) likely Japanese, high attention to detail

## 8. Strengths
1. **Working Anchor program**: Real on-chain vault logic
2. **Compliance narrative**: Strong regulatory story with Privacy Pools concept
3. **Good UX vision**: "Bank vault not hacker terminal" messaging
4. **Yield integration**: Shadow Yield adds value beyond basic privacy
5. **Clear roadmap**: Phased approach with audit mentions
6. **Professional documentation**: Mermaid diagrams, clear explanations

## 9. Weaknesses
1. **ZK is completely mocked**: No actual ZK circuits or verification
2. **Blacklist is naive**: Just a Vec<Pubkey> in state, not a Merkle tree
3. **No privacy**: Currently deposits/withdrawals are fully visible on-chain
4. **Unrealistic yield rate**: 0.01% per second = 8640% per day (demo artifact)
5. **Fixed fee**: 0.5 USDC flat fee regardless of amount
6. **No nullifier implementation**: nullifier_hash field exists but never used
7. **Centralized admin**: Single admin controls blacklist

## 10. Threat Level
**MODERATE**

**Justification**: WAVIS has a working on-chain vault program and a compelling compliance narrative, but the core privacy features (ZK proof of innocence) are entirely mocked. The "Swiss Bank" vision is strong but execution is incomplete. Projects with actual ZK implementations would outcompete it technically, though WAVIS's regulatory framing is a differentiator.

The honest disclosure about mocking actually helps credibility - they're not faking completion.

## 11. Implementation Completeness
**40% complete**

**Implemented**:
- Anchor vault program with deposit/withdraw
- Share-based accounting
- Simple blacklist filtering
- Shadow Yield calculation
- PDA structure and CPI patterns
- Web frontend (referenced)

**Missing**:
- ZK circuits for proof of innocence
- Merkle tree for sanctions list
- Nullifier system for double-spend prevention
- Encrypted PDA data
- Real compliance oracle integration
- Actual privacy (amounts/addresses still visible)
- External yield integration (Save/Kamino CPI)

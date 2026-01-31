# SeedPay Solana Privacy Hack - Analysis

## 1. Project Overview
SeedPay is a payment channel protocol for Solana implementing off-chain micropayments with on-chain settlement. The system uses ECDH key exchange to derive session identifiers, enabling privacy-preserving payment relationships between "seeders" (service providers) and "leechers" (consumers). Payments are accumulated off-chain and settled with Ed25519 signature verification on-chain.

## 2. Track Targeting
**Private Payments ($15K)**
- Privacy-preserving payment channels
- Off-chain micropayment accumulation
- Session-based anonymity

May also target **Open Track** for novel payment infrastructure.

## 3. Tech Stack
- **ZK System**: None (uses Ed25519 signatures, not ZK proofs)
- **Languages**: Rust (Anchor), TypeScript
- **Frameworks**: Anchor Framework
- **Key Dependencies**:
  - anchor-lang, anchor-spl
  - @noble/curves, @noble/hashes (ECDH + HKDF)
  - sha2 for hashing
  - SPL Token Interface

## 4. Crypto Primitives
**ECDH Key Exchange (X25519)**:
- Ephemeral keypair generation per session
- Shared secret derivation between seeder and leecher
- HKDF-SHA256 for session UUID derivation

**Ed25519 Signature Verification**:
- Payment checks signed by leecher
- Verified on-chain via native Ed25519 program (sysvar introspection)
- SHA-256 message hashing before signature verification

**Session Privacy**:
- Session hash derived from shared secret
- Only parties with ephemeral keys can link sessions
- On-chain PDA uses hashed session identifier

## 5. Solana Integration
**Custom Anchor Program**: `seedpay-channel`

**PDAs**:
- Channel PDA: `[b"channel", leecher, seeder, session_hash]`
- Escrow PDA: `[b"escrow", channel_key]`

**Instructions**:
1. `open_channel`: Leecher deposits tokens, creates channel with timeout
2. `close_channel`: Seeder submits signed payment check, funds distributed
3. `timeout_close`: Leecher reclaims funds after timeout

**Ed25519 Verification Pattern**:
- Uses instruction sysvar introspection
- Requires Ed25519 program instruction immediately before close_channel
- Parses Ed25519 instruction data to verify signature matches

**Token Support**: SPL Token Interface (Token-2022 compatible)

## 6. Sponsor Bounty Targeting
No clear sponsor integrations detected. Project focuses on core protocol implementation.

## 7. Alpha/Novel Findings
1. **Payment Channel Design**: Clean implementation of off-chain payment accumulation with on-chain settlement
2. **Session-Based Privacy**: ECDH-derived session hashes prevent address linkage across sessions
3. **Nonce Monotonicity**: Payment checks require increasing nonces, preventing replay
4. **Ed25519 Sysvar Pattern**: Novel use of instruction introspection for signature verification
5. **Amount Monotonicity**: Cumulative payment amounts prevent double-counting

**Security Features**:
- Minimum 1-hour timeout enforced
- Non-zero session hash required
- Proper CPI signing with PDA seeds

## 8. Strengths
1. **Real On-Chain Program**: Substantial Anchor implementation
2. **Cryptographically Sound**: Proper ECDH, HKDF, Ed25519 usage
3. **Privacy by Design**: Session isolation through shared secrets
4. **Micropayment Efficiency**: Off-chain accumulation reduces fees
5. **Token-2022 Ready**: Uses Token Interface for compatibility
6. **Well-Structured Code**: Clean separation of state, errors, events

## 9. Weaknesses
1. **No ZK Proofs**: Privacy limited to session unlinkability
2. **Channel Values Visible**: On-chain deposit amounts are public
3. **Seeder/Leecher Addresses Known**: Party addresses visible in PDA
4. **Incomplete Client**: TypeScript client only has ECDH helpers
5. **No Test Coverage**: Test file exists but implementation unclear
6. **Single Token Per Channel**: No multi-token support
7. **Documentation**: README is bare minimum
8. **Timeout Attack Surface**: 1-hour minimum may not suit all use cases

## 10. Threat Level
**MODERATE**

**Justification**: SeedPay represents solid protocol engineering with real on-chain implementation. The payment channel design is sound and the ECDH session privacy provides meaningful unlinkability between sessions. However, the lack of ZK proofs means amounts and party addresses remain visible. This is useful infrastructure but not a complete privacy solution. The incomplete client and documentation limit immediate impact.

## 11. Implementation Completeness
**55% Complete**

**What's Done**:
- Complete Anchor program with 3 instructions
- PDA derivation for channels and escrows
- Ed25519 signature verification via sysvar
- ECDH key exchange in TypeScript
- Session hash derivation
- State structs with proper serialization
- Error and event definitions

**What's Missing**:
- Full TypeScript client for channel operations
- Transaction building for close_channel with Ed25519 instruction
- Integration tests
- Frontend/demo application
- Documentation for protocol usage
- Multi-token channel support
- Dispute resolution mechanism

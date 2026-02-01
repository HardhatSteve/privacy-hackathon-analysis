# Protocol-01 Analysis

**Repository:** Protocol-01
**Team:** Volta Team / Slashy Fx (solo developer)
**Analyzed:** 2026-01-31
**Updated:** 2026-02-01
**Score:** 85 (↑ from 75, +10)
**Threat Level:** CRITICAL

---

## 1. Project Overview

Protocol 01 is a comprehensive privacy-focused financial ecosystem for Solana that combines:
- **ZK Shielded Pool**: Groth16-based shielded transactions with 2-in-2-out UTXO model (Zcash-style)
- **Stealth Addresses**: ECDH-derived one-time addresses (adapted from Ethereum EIP-5564)
- **Private Relay Network**: Off-chain relayer for breaking on-chain sender-recipient links
- **Payment Streams**: Time-locked payment streaming with privacy options
- **Subscriptions**: Delegated recurring payments with on-chain validation

The project includes a full product suite:
- Chrome/Brave browser extension wallet
- React Native mobile app (iOS/Android)
- Next.js marketing website
- Multiple SDKs for developer integration

---

## 2. Track Targeting

### Primary Track: Private Payments ($15k)
**Fit: STRONG**

Direct implementation of private payments via:
- Groth16 ZK proofs for shielded pool transfers
- Stealth addresses for unlinkable receiving
- Off-chain relayer to break transaction graph
- Privacy-preserving payment streams and subscriptions

### Secondary Track: Privacy Tooling ($15k)
**Fit: STRONG**

Provides developer tooling:
- `@p01/zk-sdk`: ShieldedClient for shielded pool operations
- `@p01/specter-sdk`: P01Client for stealth wallets/transfers
- `@p01/auth-sdk`: "Login with P-01" authentication
- `@p01/sdk`: Merchant integration and subscription management
- Multiple SDKs with comprehensive documentation

### Open Track ($18k)
**Fit: MODERATE**

General-purpose privacy infrastructure with novel features like:
- Decoy outputs (configurable 0-16 decoys)
- Privacy-aware subscriptions with amount/timing noise
- Hybrid stealth + shielded model

---

## 3. Tech Stack

### ZK System
| Component | Choice |
|-----------|--------|
| Proving System | **Groth16 (BN254)** |
| Circuit Language | **Circom 2.1.0** |
| Proof Library | **snarkjs 0.7.4** |
| Hash Function | **Poseidon** (ZK-native) |
| On-chain Verification | **Solana alt_bn128 syscalls** |

### Languages & Frameworks
| Layer | Technology |
|-------|------------|
| Smart Contracts | Rust, Anchor 0.30.1, Solana 1.18.17 |
| Circuits | Circom 2.1.0 |
| SDKs | TypeScript |
| Extension | React 18, Vite, TailwindCSS, Zustand |
| Mobile | React Native, Expo, NativeWind |
| Web | Next.js 16, Framer Motion |
| Relayer | Express.js, TypeScript |

### Dependencies
**Rust:**
- anchor-lang/anchor-spl 0.30.1
- solana-program 1.18.17
- ark-bn254/ark-groth16 0.4.0 (ZK verification)
- sha3 0.10 (Keccak256 for Bloom filter)

**JavaScript:**
- @solana/web3.js 1.98.4
- @coral-xyz/anchor 0.29-0.32
- snarkjs 0.7.4
- circomlib/circomlibjs
- poseidon-lite 0.2.0

---

## 4. Crypto Primitives

### Zero-Knowledge Proof System
- **Circuit**: 2-in-2-out transfer circuit with Merkle depth 20 (~1M notes)
- **Proof Size**: ~256 bytes (pi_a: 64, pi_b: 128, pi_c: 64)
- **Verification CUs**: ~200K compute units (using alt_bn128)

### Hash Functions
- **Poseidon**: Note commitments, nullifiers, spending key derivation
- **Keccak256**: VK hashing, Bloom filter indexing

### Encryption
- **ECDH**: Stealth address key derivation
- **AES-256-GCM**: Seed phrase encryption (PBKDF2 100K iterations)
- **XChaCha20-Poly1305**: Note storage encryption (claimed)

### Signature Scheme
- **Ed25519**: Solana native (wallet signatures)
- **BN254 pairings**: Groth16 proof verification

### Merkle Tree
- **Type**: Sparse Merkle tree (depth 20)
- **Hash**: Poseidon (2 inputs)
- **Capacity**: ~1,048,576 notes

### Nullifier Set
- **Primary**: Bloom filter (2KB, 16,384 bits, double hashing)
- **Secondary**: Nullifier batch accounts for definitive verification

---

## 5. Solana Integration

### On-Chain Programs (6 total)
| Program | ID | Purpose |
|---------|-----|---------|
| zk_shielded | 8dK17Nx... | Shielded pool with Groth16 verification |
| specter | 2tuztgD... | Stealth addresses + private streams |
| p01_subscription | 5kDjD9L... | Delegated recurring payments |
| p01_stream | 2ko4FQS... | Time-locked payment streaming |
| p01_whitelist | AjHD9r4... | Developer access control |
| p01_fee_splitter | muCWm9i... | Fee routing (0.5% protocol fee) |

### Key Integration Points
1. **alt_bn128 syscalls**: Native Groth16 verification via pairing precompile
2. **Zero-copy accounts**: NullifierSet uses `#[account(zero_copy)]` for large Bloom filter
3. **PDA-based escrow**: Stealth payments, streams, and subscriptions use PDAs
4. **SPL Token integration**: All programs support SPL tokens via anchor-spl
5. **Event emission**: All state changes emit events for indexing

### Compute Budget
- Shield: ~50K CUs (estimated)
- Transfer: ~200K CUs (Groth16 pairing)
- Unshield: ~200K CUs (Groth16 pairing)

---

## 6. Sponsor Bounty Targeting

### Potential Bounty Matches

| Sponsor | Bounty Type | Fit |
|---------|-------------|-----|
| Solana Foundation | Privacy Infrastructure | HIGH |
| Light Protocol | Privacy/ZK Integration | MODERATE |
| Elusiv (if sponsor) | Shielded Pools | HIGH |
| Helius | RPC/Indexing | LOW |

The project doesn't appear to explicitly target specific sponsor bounties, focusing instead on the main hackathon tracks.

---

## 7. Alpha / Novel Findings

### Innovations

1. **Hybrid Privacy Model**: Combines stealth addresses (receive privacy) with shielded pool (transfer privacy) in a single ecosystem - more comprehensive than most single-approach solutions.

2. **Decoy Transaction System**: Configurable decoy levels (0-16 outputs) for transaction graph obfuscation - similar to Monero's approach but on Solana.

3. **Privacy-Aware Subscriptions**: Novel implementation storing privacy parameters (amount_noise, timing_noise, use_stealth_address) on-chain for client-side processing.

4. **Relayer Architecture**: Off-chain ZK verification with on-chain fund transfer breaks the sender-recipient link at the protocol level.

5. **Bloom Filter Nullifier Set**: Efficient O(1) probabilistic double-spend check with batch accounts for definitive verification.

### Technical Concerns

1. **Client-computed Merkle roots**: The program accepts `new_root` from client rather than computing on-chain (Poseidon syscall not enabled on devnet). This is a security concern for mainnet.

2. **ViewTag not implemented**: The EIP-5564 viewTag optimization for efficient stealth address scanning is mentioned but unclear if fully implemented.

3. **Limited Anonymity Set**: With ~1M note capacity and fresh deployment, the anonymity set will be small initially.

---

## 8. Strengths

### Technical Strengths
1. **Complete Privacy Stack**: End-to-end privacy from stealth addresses through shielded pool to encrypted notes
2. **Production-Ready Circuits**: Well-structured Circom circuits with proper constraints (range checks, ownership, conservation)
3. **Efficient Verification**: Native alt_bn128 syscalls for sub-200K CU proof verification
4. **Comprehensive SDKs**: Multiple TypeScript SDKs with proper types and documentation
5. **Cross-Platform Apps**: Browser extension + mobile apps for real user access
6. **Strong Test Coverage**: 2,175+ tests across SDKs, contracts, and E2E flows

### Product Strengths
1. **Full Ecosystem**: Not just a protocol, but wallets, SDKs, and merchant tools
2. **User Experience**: Biometric auth, QR payments, Jupiter swap integration
3. **Developer Tools**: Multiple SDKs for different use cases
4. **Documentation**: Detailed README with architecture, security model, and usage

### Ecosystem Strengths
1. **Deployed to Devnet**: Working program IDs provided
2. **APK Available**: Downloadable mobile app for testing
3. **Extension Packaged**: Ready-to-install browser extension

---

## 9. Weaknesses

### Technical Weaknesses
1. **Trusted Merkle Root**: Client-computed roots are a security risk - malicious client could insert invalid commitments
2. **Bloom Filter False Positives**: Probabilistic nullifier checking could reject valid transactions
3. **No Recursive Proofs**: Each transfer requires full circuit proving (~seconds)
4. **Central Relayer**: Current architecture has single-point relayer (decentralization planned)
5. **Missing On-chain Poseidon**: Relies on syscall not enabled on devnet

### Cryptographic Concerns
1. **Groth16 Trusted Setup**: Requires trusted setup ceremony (powers of tau) - audit needed
2. **Limited Note Model**: 2-in-2-out fixed structure is less flexible than variable-input models
3. **Nullifier Batch Growth**: Definitive nullifier storage grows linearly with transactions

### Implementation Gaps
1. **Sync not implemented**: `ShieldedClient.sync()` is a TODO
2. **ScanForNotes incomplete**: Returns local notes only, no chain scanning
3. **Native SOL handler**: `SendPrivateNative` defined but handler not shown

---

## 10. Threat Level

### **THREAT LEVEL: CRITICAL** (Score: 85, ↑ +10 from 75)

### Recent Updates (2026-02-01)

**CRITICAL SECURITY FIX:**
```rust
// BEFORE (dangerous):
if verification_key.is_none() { return true; }  // Accepts ANY proof!

// AFTER (fixed):
if verification_key.is_none() { return false; }  // Rejects when VK missing
```

**New CI/CD Infrastructure:**
- GitHub Actions workflows: `ci.yml`, `deploy-anchor.yml`, `deploy-web.yml`, `sync-all.yml`
- Proper Rust formatting and npm configuration
- `.cargo/config.toml` for toolchain configuration

**Security Hardening:**
- Extension permissions restricted from `<all_urls>` to specific domains only
- Web-accessible resources restricted
- Relayer CORS restricted to allowed origins (Vercel, localhost)
- Rate limiting configuration added

### Justification

1. **Completeness**: This is the most complete privacy submission seen - full ZK circuits, on-chain programs, SDKs, mobile app, browser extension, relayer service, and extensive testing.

2. **Technical Depth**: Proper Groth16 implementation with Circom circuits, native Solana verification via alt_bn128, efficient nullifier handling with Bloom filters.

3. **Product Polish**: Not just a hackathon prototype - includes production features like biometric auth, fiat on-ramps, Jupiter integration.

4. **Feature Breadth**: Covers multiple privacy dimensions:
   - Stealth addresses (receive privacy)
   - Shielded pool (transfer privacy)
   - Relayer (transaction graph privacy)
   - Decoy outputs (statistical privacy)
   - Subscription privacy options

5. **Code Quality**: Clean Anchor programs, well-structured TypeScript SDKs, comprehensive test coverage (2,175+ tests).

6. **Security Posture**: Critical proof verification bug fixed, permissions hardened.

### Concerns That Prevent "Insurmountable"
- Solo developer (scalability/maintainability)
- Some TODOs in critical paths (sync, scanning)
- Client-computed Merkle roots need resolution for mainnet
- Needs security audit before production use

---

## 11. Implementation Completeness

### Circuits: 95%
- [x] Transfer circuit (2-in-2-out)
- [x] Merkle tree membership proof
- [x] Poseidon hash primitives
- [x] Range checks (64-bit amounts)
- [x] Nullifier computation
- [ ] Compiled circuits checked in (build artifacts)

### On-Chain Programs: 90%
- [x] ZK Shielded Pool (shield/transfer/unshield)
- [x] Specter (stealth addresses, private streams)
- [x] Subscriptions (delegated recurring)
- [x] Streams (time-locked payments)
- [x] Whitelist (access control)
- [x] Fee Splitter (protocol fees)
- [ ] Decentralized relayer on-chain

### SDKs: 85%
- [x] @p01/zk-sdk (ShieldedClient)
- [x] @p01/specter-sdk (P01Client)
- [x] @p01/auth-sdk
- [x] @p01/sdk (merchant)
- [ ] Chain syncing/scanning
- [ ] Note indexing

### Apps: 90%
- [x] Browser extension (Chrome/Brave)
- [x] Mobile app (React Native)
- [x] Web app (Next.js)
- [x] Relayer service
- [ ] Desktop app (roadmap)

### Testing: 95%
- [x] Unit tests (2175+ tests)
- [x] E2E integration tests
- [x] Contract tests (Anchor)
- [ ] Security audit
- [ ] Formal verification

---

## Summary

Protocol-01 is an exceptionally comprehensive privacy solution for Solana that combines multiple privacy primitives (shielded pool, stealth addresses, relayer network) into a cohesive ecosystem with full product suite (wallets, SDKs, apps). The technical implementation is solid with proper ZK circuit design, efficient on-chain verification, and extensive testing. Despite some implementation gaps and the need for security audit, this represents the most complete and polished privacy submission in the hackathon.

**Key Differentiator**: This is not just a protocol - it's a complete privacy ecosystem with user-facing products ready for testing.

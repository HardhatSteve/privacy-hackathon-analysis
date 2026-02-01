# Solana Privacy Hackathon 2026 - Complete Competitor Profiles

**Analysis Date**: January 31, 2026
**Total Projects Analyzed**: 97 repositories
**Deep Technical Reviews**: 15 projects

---

## Table of Contents

1. [Tier 1: Critical Threats](#tier-1-critical-threats-high-win-probability)
2. [Tier 2: Significant Competitors](#tier-2-significant-competitors)
3. [Tier 3: Notable Submissions](#tier-3-notable-submissions)
4. [Tier 4: Emerging Projects](#tier-4-emerging-projects)
5. [Summary Matrix](#summary-matrix)

---

# Tier 1: Critical Threats (High Win Probability)

---

## 1. Protocol-01

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 35% |
| **Technical Score** | 7/10 |
| **Threat Level** | 🔴 CRITICAL |
| **ZK System** | Groth16 (Circom 2.1.0) |
| **Deployment** | Devnet only |

### Overview
Protocol-01 is the most complete privacy ecosystem for Solana, combining ZK shielded pools with stealth addresses (ECDH, adapted from EIP-5564), browser extension wallet, mobile app, and an off-chain relayer network.

### Technical Architecture

**ZK Circuits (349 LOC)**:
- Transfer circuit: 2-in-2-out UTXO model (Zcash-style)
- Merkle tree depth: 20 levels (~1M notes)
- Poseidon hashing for commitments, nullifiers, key derivation
- On-chain verification: ~200K CU via alt_bn128 syscalls

**Solana Programs (6 Anchor programs)**:
| Program | Purpose |
|---------|---------|
| zk_shielded | Core shielded pool + ZK verification |
| specter | Stealth addresses + payment streams |
| stream | Time-locked escrow payments |
| subscription | Recurring delegated payments |
| whitelist | Developer access control |
| p01-fee-splitter | Fee routing (0.5% protocol fee) |

**SDK Packages (8 packages)**:
- @p01/zk-sdk - ShieldedClient, MerkleTree, ZkProver
- @p01/specter-sdk - P01Client, StealthScanner
- @p01/p01-js - Merchant SDK with React components
- @p01/auth-sdk - "Login with P-01" protocol

### Critical Vulnerabilities

**🔴 CRITICAL: Client-Computed Merkle Roots**
```rust
// merkle_tree.rs:75-100
pub fn insert_with_root(&mut self, leaf: [u8; 32], new_root: [u8; 32]) -> Result<u64> {
    self.root = new_root;  // TRUSTS CLIENT COMPUTATION
}
```
- On-chain program accepts Merkle root computed by client without verification
- Reason: "Poseidon syscall not enabled on devnet/mainnet"
- **Impact**: Malicious client could forge tree state

**🔴 HIGH: Weak Nullifier Double-Spend Prevention**
- Uses Bloom filter (16,384 bits) with false positives
- No explicit false positive rate documentation
- Legitimate transactions could be rejected

**⚠️ MEDIUM: VK Trust Chain**
- VK stored in separate account, validated by hash only
- Authority can unilaterally update VK

### Strengths
- ✅ Complete product suite (extension, mobile, web, SDKs)
- ✅ 2,175 tests across all layers
- ✅ Stealth addresses for receive privacy
- ✅ Payment streams and subscriptions
- ✅ Biometric auth, fiat onramps, Jupiter DEX integration

### Weaknesses
- ❌ Client-computed roots is fundamental trust violation
- ❌ Devnet only, no mainnet
- ❌ No formal audit
- ❌ Solo developer (scalability risk)

### Code Metrics
| Metric | Value |
|--------|-------|
| Rust LOC | ~5,524 |
| SDK LOC | ~2,377 |
| Test Count | 2,175 |
| Programs | 6 |
| Packages | 8 |

---

## 2. velum (velum.cash)

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 40% |
| **Technical Score** | 8/10 |
| **Threat Level** | 🔴 CRITICAL |
| **ZK System** | Groth16 (Privacy Cash fork) |
| **Deployment** | 🟢 **MAINNET LIVE** |

### Overview
Velum enables private payment links on Solana where users create shareable URLs (e.g., `velum.cash/pay/abc123`). The sender deposits into a shielded pool, and recipients withdraw without on-chain linkability. **Only project live on mainnet.**

### Technical Architecture

**Privacy Cash Integration**:
- Fork enabling third-party deposits (original only supported self-deposits)
- Wallet adapter compatibility (Phantom/Solflare)
- Pubkey-only UTXO mode

**Encryption Schemes**:
| Version | Algorithm | Size | Use Case |
|---------|-----------|------|----------|
| V2 | AES-256-GCM | 82 bytes | Self-deposit |
| V3 | NaCl Box (X25519 + ChaCha20-Poly1305) | 126 bytes | Paylink deposit |

**V3 Forward Secrecy**:
- Each encryption uses fresh ephemeral X25519 keypair
- Prevents decryption of old paylinks even if keys compromised

**Payment Link Flow**:
1. Recipient creates shielded keys (BN254 for UTXO, X25519 for encryption)
2. Paylink contains only public keys
3. Sender deposits to encrypted UTXO owned by recipient
4. Only recipient can decrypt and withdraw

### Critical Vulnerabilities

**🔴 CRITICAL: Replay Attack on API Key Creation**
```typescript
// Server verifies signature but NO NONCE/TIMESTAMP VALIDATION
if (!message.startsWith("Welcome to Velum")) return error;
if (!verifyWalletSignature(walletAddress, signature, message)) return error;
// isValidTimestamp() and generateNonce() EXIST BUT ARE NEVER CALLED
```
- Attacker can replay intercepted API key creation request indefinitely
- **Impact**: DoS via unlimited API key creation

**🔴 HIGH: No Transaction Signature Validation**
```typescript
const existing = await prisma.transactionLog.findUnique({
    where: { signature },
});
// Does NOT verify signature is real Solana transaction
```
- Fake signatures accepted into database
- **Impact**: Corrupted audit trail

**⚠️ MEDIUM: SDK Source Not Included**
- Core SDK is external dependency (`@velumdotcash/sdk`)
- Cryptographic operations not reviewable

### Strengths
- ✅ **ONLY PROJECT LIVE ON MAINNET** - Major credibility
- ✅ Consumer-friendly shareable payment links
- ✅ Forward secrecy with ephemeral encryption
- ✅ RecipientIdHash enables O(1) UTXO scanning (60x speedup)
- ✅ Excellent 3D animated UX

### Weaknesses
- ❌ API replay attack vulnerability
- ❌ Inherits Privacy Cash PDA rent model (~$0.13/tx)
- ❌ Centralized relayer (censorship risk)
- ❌ SDK source not auditable

### Code Metrics
| Metric | Value |
|--------|-------|
| Frontend LOC | ~15,000 |
| API Routes | 12 |
| Deployment | Mainnet + Vercel |
| Tokens Supported | USDC, USDT, SOL |

---

## 3. cloakcraft

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 20% |
| **Technical Score** | 6/10 |
| **Threat Level** | 🔴 CRITICAL |
| **ZK System** | Groth16 (Circom 2.1) |
| **Deployment** | Devnet only |

### Overview
CloakCraft is the most feature-complete privacy DeFi protocol: private transfers, AMM swaps (ConstantProduct + StableSwap), limit orders, perpetual futures (up to 100x leverage), and governance voting. Uses Light Protocol for 5000x storage reduction.

### Technical Architecture

**DeFi Features**:
| Feature | Completion | Status |
|---------|------------|--------|
| AMM (Swap) | 85% | Vulnerable to fake commitment |
| Perpetual Futures | 60% | Keeper rewards TODO |
| Governance/Voting | 70% | SDK in-progress |
| Order Book | 40% | Basic, no matching engine |

**Circuit Architecture**:
- Multiple circuit variants: transfer_1x2, consolidate_3x1, swap, perps, voting
- 32-level Merkle tree
- Domain-separated Poseidon hashing (0x01-0x13)

**Light Protocol Integration**:
- Compressed accounts for storage reduction
- ZK non-membership proofs for nullifiers

### Critical Vulnerabilities

**🔴 CRITICAL: FAKE COMMITMENT ATTACK (DOCUMENTED, UNFIXED)**
```
Attack Vector:
1. Generate random commitment C (never deposited)
2. Compute valid nullifier N from C
3. Generate valid ZK proof (constraints satisfied)
4. Submit transaction:
   - ZK proof: ✅ Valid
   - Nullifier: ✅ Non-existent (fresh)
   - Commitment exists: ❌ NOT CHECKED
5. System creates outputs = MINTING TOKENS FROM NOTHING
```
- Explicitly documented in SECURITY_ANALYSIS.md as CRITICAL
- **NOT FIXED** before submission
- **Impact**: Can drain entire pool

**🔴 CRITICAL: Test Coverage Abysmal**
- 44,181 lines of Rust: **0 test files**
- TypeScript SDK: 1 test file (71 lines)
- No security tests, no fuzzing

### Strengths
- ✅ Most comprehensive DeFi feature set
- ✅ Light Protocol compression (5000x storage reduction)
- ✅ Note consolidation (3→1 merge)
- ✅ Well-documented security analysis (honest about issues)

### Weaknesses
- ❌ **CRITICAL vulnerability documented but unfixed**
- ❌ Near-zero test coverage
- ❌ Over-engineered multi-phase architecture
- ❌ Incomplete perps/governance features

### Code Metrics
| Metric | Value |
|--------|-------|
| Rust LOC | 44,181 |
| TypeScript LOC | ~27,000 |
| Circom LOC | ~4,000 |
| Test Files | 1 (71 lines) |

---

# Tier 2: Significant Competitors

---

## 4. sip-protocol

| Attribute | Value |
|-----------|-------|
| **Track** | Privacy Tooling ($15K) |
| **Win Probability** | 15% |
| **Technical Score** | 5/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Noir |
| **Deployment** | Devnet + Mainnet |

### Overview
SIP positions itself as "THE privacy standard for Web3" with 6,661+ tests, multi-backend architecture (ZK, TEE, MPC, FHE), and 15+ chain support. Prior hackathon winner ($6,500 Zypherpunk).

### Technical Architecture

**Noir Circuits (3 circuits)**:
- `funding_proof`: Pedersen commitment validation
- `validity_proof`: Intent authorization
- `fulfillment_proof`: Correct execution proof

**Multi-Backend Claims**:
| Backend | Status |
|---------|--------|
| Noir | ✅ Working |
| Mock | ✅ Working |
| Halo2 | ❌ 11 TODO stubs |
| Kimchi | ❌ 7 TODO stubs |
| FHE | ❌ Zero implementation |
| MPC (Arcium) | ⚠️ Separate repo, not integrated |

### Critical Vulnerabilities

**🔴 CRITICAL: ON-CHAIN VERIFICATION IS FORMAT-ONLY**
```rust
// lib.rs:150
// TODO: In production, verify ZK proof on-chain using Sunspot verifier
```
- Solana program only checks proof SIZE (≤2048 bytes)
- **No cryptographic verification**
- Any arbitrary bytes accepted as valid proof

**🔴 HIGH: Multi-Backend Claims are False**
```typescript
// halo2.ts - 11 TODO comments:
// TODO: Load actual Halo2 WASM module
// TODO: Implement actual Halo2 proof generation
// TODO: Implement actual Halo2 verification
```

**⚠️ MEDIUM: Test Count is Misleading**
- Claimed: 6,661 tests
- Reality: 6,661 unit/format tests, ~11 circuit tests, 0 verification tests

### Strengths
- ✅ Prior hackathon win ($6,500)
- ✅ Beautiful SDK API design
- ✅ Viewing keys for selective disclosure
- ✅ Extensive documentation

### Weaknesses
- ❌ Core privacy guarantee doesn't work
- ❌ Marketing claims don't match implementation
- ❌ Mock proofs in production code

---

## 5. vapor-tokens

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 25% |
| **Technical Score** | 7/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Noir + Gnark |
| **Deployment** | Devnet |

### Overview
Token-2022 extension enabling unlinkable private transactions with **plausible deniability**. Uses hash-to-curve for provably unspendable "vapor addresses" that look identical to normal Solana addresses.

### Technical Architecture

**Hash-to-Curve Innovation**:
- Generates addresses that are provably unspendable
- No separate deposit UI needed (transfer hook auto-records)
- Every holder has privacy by default

**Circuit Design**:
- Ed25519 implementation in Noir (reusable library)
- Sunspot toolchain (Noir→Gnark transpiler)
- gnark-verifier-solana for on-chain verification

**Token-2022 Integration**:
- Transfer hook automatically accumulates to Merkle tree
- Works with existing wallets

### Critical Vulnerabilities

**🔴 CRITICAL: Trusted Setup Not Performed**
- VK hardcoded from untrusted setup
- **Impact**: Proofs could be forged

**🔴 HIGH: Amount Leakage Breaks Deniability**
- Withdrawing 100 tokens reveals you received 100 tokens
- README admits: "Balance linkability... not balance confidential"

**⚠️ MEDIUM: Unwrap Panics**
```rust
GnarkProof::from_bytes(&proof_bytes).unwrap()  // INPUT
GnarkWitness::from_bytes(&pub_witness_bytes).unwrap()  // INPUT
```
- DoS vector via malformed input

### Strengths
- ✅ Novel hash-to-curve approach
- ✅ Works with existing wallets
- ✅ No separate deposit UI
- ✅ Ed25519 in Noir (reusable library)

### Weaknesses
- ❌ Amount visibility reduces anonymity
- ❌ Single-use vapor addresses
- ❌ No trusted setup ceremony
- ❌ Many unwrap panics

---

## 6. epoch

| Attribute | Value |
|-----------|-------|
| **Track** | Open Track ($18K) |
| **Win Probability** | 30% |
| **Technical Score** | 6/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Arcium MPC |
| **Deployment** | Devnet |

### Overview
Privacy-preserving prediction market using Arcium MPC to hide bet directions (YES/NO) until market resolution. Claims to prevent front-running, copy trading, and outcome manipulation.

### Technical Architecture

**Arcium Integration**:
- X25519 key exchange for shared secret derivation
- RescueCipher encryption for bet encryption
- verify_output() callback for MPC computation verification

**Market Lifecycle**:
1. Create market (authority defines question, timestamps)
2. Open betting window
3. Encrypted bets placed (MPC encrypts YES/NO)
4. Close betting
5. Authority resolves outcome
6. MPC computes payouts
7. Users claim

### Critical Vulnerabilities

**🔴 CRITICAL: Single Authority Per Market**
```rust
market.authority = ctx.accounts.authority.key();
// Only authority can: open, close, resolve, cancel
```
- Authority key compromise = full market compromise
- Can resolve to any outcome
- No multi-sig, no timelock, no dispute mechanism

**🔴 HIGH: Privacy Claims Overstated**
```rust
pub struct UserPosition {
    pub encrypted_bet: Vec<u8>,     // 64 bytes on-chain
    pub user_pubkey: [u8; 32],      // X25519 key on-chain
    pub deposit_amount: u64,        // PLAINTEXT ON-CHAIN
}
```
- Only bet direction encrypted
- Amounts are visible
- User public keys are visible

**⚠️ MEDIUM: No Pool Mechanics**
- No AMM or price discovery
- Pool values passed as plaintext to MPC
- Off-chain pool state

### Strengths
- ✅ First MPC prediction market on Solana
- ✅ Deep Arcium integration (strong bounty candidate)
- ✅ Working devnet deployment
- ✅ Modern UI with Privy wallets

### Weaknesses
- ❌ Centralized authority
- ❌ Privacy leaks substantial information
- ❌ No oracle integration
- ❌ Incomplete pool mechanics

---

## 7. chameo

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 20% |
| **Technical Score** | 6/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Noir + Inco FHE + Privacy Cash |
| **Deployment** | Devnet |

### Overview
Privacy-first payout platform combining three privacy technologies: Noir ZK for eligibility proofs, Inco FHE for encrypted voting analytics, and Privacy Cash for anonymous payments. Includes Range API compliance screening.

### Technical Architecture

**Triple Privacy Stack**:
| Technology | Purpose | Quality |
|------------|---------|---------|
| Privacy Cash | Unlinkable transfers | Server-custodied |
| Inco Lightning FHE | Encrypted vote counters | Binary choice only |
| Noir ZK | Eligibility proofs | Server generates proofs |
| Range API | Compliance gating | TOCTOU race condition |

### Critical Vulnerabilities

**🔴 CRITICAL: Server-Side Proof Generation**
- Vote proofs generated by relayer, not voters
- Relayer learns nullifier before encryption
- Relayer knows identity → vote mapping
- **Impact**: No voter privacy against server

**🔴 HIGH: Wallet Encryption Without Authentication**
```typescript
const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
// No HMAC/GCM - vulnerable to padding oracle attacks
```
- Single symmetric key shared across all campaigns

**⚠️ MEDIUM: TOCTOU Race in Compliance**
- Compliance check happens AFTER claim inserted
- If Range API is slow, wallet could be sanctioned between check and deletion

### Strengths
- ✅ Triple privacy stack (multi-sponsor bounty potential)
- ✅ Compliance-ready (Range API)
- ✅ Ambitious scope

### Weaknesses
- ❌ Server-side proofs break privacy fundamentally
- ❌ Multiple privacy leaks
- ❌ More suitable for compliance-gated payouts than true privacy

---

# Tier 3: Notable Submissions

---

## 8. SolVoid

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 20% |
| **Technical Score** | 6/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Groth16 |
| **Deployment** | Placeholder ID only |

### Overview
Enterprise-grade sovereign privacy layer using Groth16 SNARKs and Poseidon hashing. Features "Ghost Score" diagnostics for privacy analysis.

### Technical Architecture

**Ghost Score (Novel Feature)**:
- 5-factor weighted privacy scoring:
  - Anonymity Score (25%): Shielded transaction usage
  - Linkage Score (30%): CEX/DEX connection detection
  - Pattern Score (20%): Transaction pattern analysis
  - Volume Score (15%): Amount obfuscation quality
  - Timing Score (10%): Timing analysis resistance
- Grades: A+ ("Invisible") to D/F ("Glass House")
- Shareable privacy badges with ZK proof

**Circuit Design**:
- withdraw.circom: Amount binding, recipient/relayer binding
- 20-level Merkle tree
- 100-root history for concurrent deposits

### Critical Issues
- ❌ **No production trusted setup** - Testing only
- ❌ **Placeholder program ID** - Not deployed
- ❌ Many iteration files suggest significant refactoring
- ❌ Unaudited code

### Strengths
- ✅ Ghost Score is creative diagnostic
- ✅ Comprehensive documentation
- ✅ Professional enterprise presentation
- ✅ 20 test files

---

## 9. shadow

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 22% |
| **Technical Score** | 7/10 |
| **Threat Level** | 🟠 HIGH |
| **ZK System** | Noir |
| **Deployment** | Devnet (verified transactions) |

### Overview
ZK-gated swap DEX where users must prove eligibility (minimum balance, token holder, blacklist exclusion) via Noir circuits before accessing DEX functionality.

### Technical Architecture

**Proof System**:
| Circuit | Purpose |
|---------|---------|
| shielded_spend | Merkle proof + nullifier |
| min_balance | Prove balance ≥ threshold |
| token_holder | Prove token ownership |
| smt_exclusion | Prove not blacklisted |

**DEX Features**:
- Constant Product AMM (Uniswap V2 formula)
- 30 bps fee with overflow protection
- Private swap with shielded input
- ZK eligibility verification

### Critical Issues

**🔴 HIGH: Non-Cryptographic Account Hash**
```javascript
let h = BigInt(0);
for (const b of bytes) {
    h = (h * BigInt(31) + BigInt(b)) % BN254_MODULUS;
}
```
- Simple polynomial hash, not Poseidon/Keccak
- Vulnerable to collision attacks

**🔴 HIGH: No Solana State Root Verification**
- Account data proofs are offline only
- Relayer could serve fake account data

**⚠️ MEDIUM: Simplified Blacklist**
- Just point equality, not proper SMT proof
- README admits: "simplified in this demo"

### Strengths
- ✅ Working DEX with verified transactions on devnet
- ✅ Novel ZK-gated access concept
- ✅ Good Sunspot/Noir integration
- ✅ Solid AMM implementation

### Weaknesses
- ❌ Account hash is not cryptographic
- ❌ No state root binding
- ❌ Light Protocol planned but not implemented

---

## 10. safesol

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 18% |
| **Technical Score** | 6/10 |
| **Threat Level** | 🟡 MEDIUM-HIGH |
| **ZK System** | Groth16 (Circom) |
| **Deployment** | Devnet |

### Overview
Full ZK private payment system with selective disclosure capabilities. Features comprehensive Circom circuit implementation.

### Technical Architecture

**Circuits (3 total)**:
| Circuit | LOC | Purpose |
|---------|-----|---------|
| spend.circom | 34 | Nullifier computation |
| membership.circom | 39 | Merkle proof (20 levels) |
| disclosure.circom | 41 | Selective disclosure |

**Selective Disclosure**:
- Proves `balance >= threshold` without revealing balance
- Compliance-friendly for institutional use
- Conditional disclosure based on type flag

**Program Instructions**:
1. initialize - State setup
2. private_spend - Anonymous withdrawal with ZK
3. add_commitment - Deposit to pool

### Critical Issues
- ❌ Simplified circuits (testing version)
- ❌ On-chain verifier currently mocked
- ❌ Unaudited

### Strengths
- ✅ Complete selective disclosure implementation
- ✅ Clean circuit design
- ✅ 50+ documentation files
- ✅ Well-structured codebase

---

## 11. privacy-vault

| Attribute | Value |
|-----------|-------|
| **Track** | Private Payments ($15K) |
| **Win Probability** | 20% |
| **Technical Score** | 7/10 |
| **Threat Level** | 🟡 MEDIUM-HIGH |
| **ZK System** | Groth16 |
| **Deployment** | Devnet |

### Overview
Implements Vitalik's Privacy Pools paper with dual Merkle trees for anonymous compliance. Users prove funds aren't from illicit sources without revealing identity.

### Technical Architecture

**Privacy Pools Implementation**:
- **Main Tree**: All deposits
- **Association Set Tree**: Only "clean" deposits
- User proves membership in BOTH without revealing which deposit

**Association Sets (5 tiers)**:
| Set | Description |
|-----|-------------|
| ALL_VERIFIED | Chain analysis verified |
| INSTITUTIONAL | KYC'd entities |
| COMMUNITY_CURATED | DAO-governed |
| US_COMPLIANT | OFAC compliant |
| EU_COMPLIANT | MiCA compliant |

**Circuits**:
- withdraw.circom (121 LOC): Knowledge of (nullifier, secret)
- innocence.circom (170 LOC): Dual Merkle proof

### Critical Issues
- ❌ Fund transfers are simulated (marked "Demo Only")
- ❌ Compliance uses 90% random approval (not real)
- ❌ Relayer uses in-memory storage

### Strengths
- ✅ **Accurate Privacy Pools implementation**
- ✅ Well-integrated Light Protocol
- ✅ Solid cryptographic design
- ✅ 6 complete smart contract instructions

---

# Tier 4: Emerging Projects

---

## Quick Profiles (Additional High-Threat Projects)

| Project | Track | ZK System | Key Feature | Win Prob |
|---------|-------|-----------|-------------|----------|
| **AURORAZK** | Private Payments | Noir | Private limit order DEX | 15% |
| **Dark-Null-Protocol** | Private Payments | Groth16 | Optimistic lazy verification | 12% |
| **zmix** | Private Payments | Groth16 | Tornado-style mixer | 10% |
| **Arcshield** | Private Payments | Arcium MPC | Private DeFi with lending | 15% |
| **hydentity** | Private Payments | Arcium MPC | SNS domain privacy wrapper | 12% |
| **OBSCURA-PRIVACY** | Private Payments | Arcium MPC | Dark pool + WOTS+ | 15% |
| **yieldcash-solana-privacy** | Private Payments | Noir | Yield-bearing privacy pool | 12% |
| **privacy-pay** | Private Payments | Light Protocol | Shielded payments with memos | 10% |
| **StealthPay** | Private Payments | Privacy Cash | Private USDC + receipts | 12% |
| **Obsidian** | Open Track | Arcium MPC | Privacy token launchpad | 10% |
| **veil** | Privacy Tooling | Unknown | MEV-protected swap router | 12% |
| **solprivacy-cli** | Privacy Tooling | None | AI-powered privacy analysis | 10% |

---

# Summary Matrix

## Win Probability by Track

### Private Payments Track ($15K)

| Rank | Project | Win Prob | Key Advantage | Key Risk |
|------|---------|----------|---------------|----------|
| 1 | **Zorb** | 45% | Indexed merkle tree, zero PDA rent | Not mainnet |
| 2 | **velum** | 40% | **Only mainnet** | API security, PDA rent |
| 3 | **Protocol-01** | 35% | Complete product suite | Client-computed roots |
| 4 | **vapor-tokens** | 25% | Token-2022 native | Amount leakage |
| 5 | **shadow** | 22% | ZK-gated DEX | Weak account hash |
| 6 | **SolVoid** | 20% | Ghost Score | Placeholder only |
| 7 | **cloakcraft** | 20% | Full DeFi | **Critical vuln unfixed** |
| 8 | **chameo** | 20% | Triple stack | Server-side proofs |
| 9 | **privacy-vault** | 20% | Privacy Pools | Demo only |
| 10 | **safesol** | 18% | Selective disclosure | Mocked verifier |

### Privacy Tooling Track ($15K)

| Rank | Project | Win Prob | Key Advantage | Key Risk |
|------|---------|----------|---------------|----------|
| 1 | **sip-protocol** | 15% | Prior win, viewing keys | Format-only verification |
| 2 | **solprivacy-cli** | 10% | AI-powered analysis | No ZK |
| 3 | **veil** | 12% | MEV protection | Unknown ZK |

### Open Track ($18K)

| Rank | Project | Win Prob | Key Advantage | Key Risk |
|------|---------|----------|---------------|----------|
| 1 | **epoch** | 30% | Arcium bounty fit | Centralized authority |
| 2 | **Obsidian** | 10% | Token launchpad | Arcium incomplete |

---

## Technical Competence Ranking

| Rank | Project | Score | Justification |
|------|---------|-------|---------------|
| 1 | **Zorb** | 9/10 | Indexed merkle tree, batch proofs, audited |
| 2 | **velum** | 8/10 | Mainnet live, good crypto, API gaps |
| 3 | **Protocol-01** | 7/10 | Complete suite, critical trust gap |
| 4 | **shadow** | 7/10 | Working DEX, weak account hash |
| 5 | **vapor-tokens** | 7/10 | Novel H2C, no trusted setup |
| 6 | **privacy-vault** | 7/10 | Accurate Privacy Pools, demo only |
| 7 | **cloakcraft** | 6/10 | Full DeFi, critical vuln |
| 8 | **SolVoid** | 6/10 | Ghost Score, not deployed |
| 9 | **epoch** | 6/10 | MPC working, centralized |
| 10 | **chameo** | 6/10 | Triple stack, server-side proofs |
| 11 | **safesol** | 6/10 | Clean design, mocked |
| 12 | **sip-protocol** | 5/10 | Beautiful SDK, no real verification |

---

## Zorb's Competitive Position

### Advantages Over All Competitors

| Capability | Zorb | Best Competitor |
|------------|------|-----------------|
| **Nullifier Storage** | Indexed Merkle Tree | PDAs (all others) |
| **Cost per Nullifier** | ~$0 | ~$0.13 |
| **Batch Proofs** | 4/16/64 per proof | None |
| **Multi-Asset** | 4 per tx | 1-2 |
| **Yield Accrual** | Yes | None |
| **LST Support** | Cross-LST swaps | None |
| **Circuit Efficiency** | 35,620 constraints | 50K-200K+ |
| **Rent Model** | Reclaimable | Permanent lock |

### Vulnerabilities Zorb Avoids

| Vulnerability | Affected | Zorb |
|---------------|----------|------|
| Client-computed merkle roots | Protocol-01 | ✅ On-chain |
| Fake commitment attack | cloakcraft | ✅ Indexed tree prevents |
| Format-only verification | sip-protocol | ✅ Full Groth16 |
| PDA rent accumulation | velum, Privacy Cash | ✅ Shared tree |
| Centralized authority | epoch | ✅ Decentralized |
| Server-side proofs | chameo | ✅ Client-side |

---

*Analysis based on deep code review of 15 repositories with ~100,000+ lines of code examined.*

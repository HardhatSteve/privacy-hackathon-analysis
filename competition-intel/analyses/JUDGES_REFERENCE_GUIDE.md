# Solana Privacy Hackathon - Judge's Reference Guide

**Generated:** 2026-02-01T14:30:00Z
**Total Submissions in Index:** 81
**Analysis Files Reviewed:** 100+
**Genuinely Competitive:** ~20 projects

---

## Scoring Legend

| Metric | Description |
|--------|-------------|
| **Innovation** | Novelty of approach (1-10) |
| **Execution** | Code completeness and quality (1-10) |
| **Working Status** | **Completely Working** / **Almost Working** / **Unsound** |
| **Credibility** | Team signals, prior work, code quality (LOW/MED/HIGH) |
| **Deployment** | None / Devnet / Mainnet |
| **Delivery** | **Web App** / **Mobile** / **CLI/SDK** / **None** |

### Working Status Definitions
- **Completely Working**: All core features functional, proper cryptography, deployable
- **Almost Working**: Most features work, minor gaps or incomplete integration
- **Unsound**: Broken crypto, mock verifiers, stubs, or fundamentally non-functional privacy

### Delivery Channel Preference
Projects are evaluated with preference for **web-first** delivery:
- **Web App (Preferred)**: Next.js, React, Vite-based browser apps with proper wallet integration
- **Mobile App**: React Native/Expo apps (often "vibe coded" with lower quality; harder to verify)
- **CLI/SDK**: Developer tools without end-user interface
- **None**: Backend-only or incomplete

**Why Web > Mobile:**
1. **Easier to verify** - Judges can test immediately in browser
2. **Higher quality bar** - Web apps require proper architecture
3. **Lower vibe-code risk** - Mobile often AI-generated with minimal testing
4. **Broader accessibility** - No app store downloads required

---

## TIER 1: Top Contenders (Likely Prize Winners)

### 1. Protocol-01
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 9/10 - Complete privacy ecosystem: Groth16 shielded pool + stealth addresses + relayer network + decoy outputs |
| **Execution** | 9/10 - 6 Solana programs, 2175+ tests, browser extension, mobile app, SDKs |
| **Team Credibility** | HIGH - Solo developer but exceptional output; 50k+ LOC, professional architecture |
| **Deployment** | Devnet (6 program IDs), APK available |
| **ZK System** | Groth16/Circom with Poseidon hash, alt_bn128 syscalls |
| **Video** | Not provided |

**What Works:**
- Groth16 ZK shielded pool (2-in-2-out UTXO model)
- Stealth addresses (ECDH-derived, EIP-5564 style)
- Private relay network for transaction graph obfuscation
- Payment streams & subscriptions with privacy options
- Browser extension wallet (Chrome/Brave)
- React Native mobile app with biometric auth
- Multiple SDKs (@p01/zk-sdk, @p01/specter-sdk, @p01/auth-sdk)
- 2,175+ passing tests across all components
- Configurable decoy outputs (0-16)
- Merkle tree (depth 20) with Bloom filter nullifier set

**What Doesn't Work:**
- Client-computed Merkle roots (security risk for mainnet - needs on-chain Poseidon)
- ViewTag optimization not fully implemented
- Chain scanning incomplete (`ShieldedClient.sync()` is TODO)
- Decentralized relayer not yet implemented
- Large anonymity set requires time to build

**Functional Summary:** Protocol-01 is the most comprehensive privacy submission, combining Zcash-style shielded pools with Ethereum-style stealth addresses into a cohesive ecosystem. The Groth16 circuits properly implement 2-in-2-out UTXO transfers with Poseidon hashing, verified on-chain via Solana's alt_bn128 syscalls. Production-ready apps (extension, mobile, web) demonstrate this isn't just a protocol but a complete privacy ecosystem ready for testing.

---

### 2. SIP Protocol (Ecosystem: circuits, app, mobile, SDK, blog, docs)
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - Intent-based privacy model with stealth addresses + Pedersen commitments |
| **Execution** | 8/10 - 5+ coordinated repos, 19 passing circuit tests, production-ready ecosystem |
| **Team Credibility** | HIGH - **Prior hackathon winner** (Zypherpunk $4k), 25+ technical articles, proven team |
| **Deployment** | Mainnet-beta deployed |
| **ZK System** | Noir 1.0.0-beta.15 with Barretenberg (UltraHonk) |
| **Video** | Demo from prior NEAR hackathon (winner) |

**What Works:**
- Comprehensive TypeScript SDK with 6,661+ tests
- Multi-curve stealth addresses (ed25519 + secp256k1)
- Real Pedersen commitments using @noble/curves
- Viewing keys with XChaCha20-Poly1305 encryption
- Three Noir ZK circuits (funding, validity, fulfillment proofs)
- Solana Anchor program deployed to mainnet-beta
- RPC provider abstraction (Helius, QuickNode, Triton)
- All 19 circuit tests passing

**What Doesn't Work:**
- **Critical: On-chain ZK verification incomplete** - Solana program only validates proof format, not cryptographic validity (marked as TODO)
- Pedersen verification incomplete - format validation only
- No Light Protocol integration despite targeting that bounty
- Uses secp256k1 not Ed25519 (non-native to Solana)
- Missing browser WASM bundle

**Functional Summary:** SIP Protocol is a well-engineered privacy middleware SDK positioning itself as "HTTPS for blockchain" with novel viewing keys for compliance. The Noir circuits are properly implemented with Pedersen commitments and nullifier derivation. However, the critical on-chain ZK verification is incomplete—the Solana program validates proof format but not cryptographic validity—undermining production readiness despite mainnet deployment.

---

### 3. solana-privacy-scanner
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 9/10 - Privacy ANALYSIS tool with 13 heuristic detectors + static code analyzer |
| **Execution** | 10/10 - Published npm packages (v0.7.0), CLI, web UI, Claude plugin, full docs |
| **Team Credibility** | HIGH - Production-quality tooling, semver, changelogs, GitHub stars |
| **Deployment** | npm published, QuickNode integration |
| **ZK System** | None - analysis tool |
| **Video** | Not provided |

**What Works:**
- 13 privacy heuristics detectors (fee payer reuse, signer overlap, memo exposure, known entity interaction, etc.)
- CLI tool for wallet/transaction/program scanning
- Static code analyzer for source files
- Claude Code plugin integration
- Web UI (Docusaurus-based)
- npm packages published and versioned (0.7.0)
- Known entity database with community-maintained labels
- QuickNode RPC integration

**What Doesn't Work:**
- Not a privacy solution (diagnostic only - by design)
- Heuristic-based (may have false positives/negatives)
- Cannot analyze obfuscated activity
- Known-addresses database could become stale

**Functional Summary:** solana-privacy-scanner is a production-ready privacy diagnostic tool that identifies privacy leaks rather than providing privacy itself. It implements 13 heuristics for detecting exposure (fee payer reuse, signer overlap, entity interaction) across transactions and wallets. The project is exceptionally polished with published npm packages, clear QuickNode sponsor alignment, and comprehensive documentation—ideal for the Privacy Tooling track.

---

### 4. CloakCraft
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** (Critical vulnerability) |
| **Innovation** | 9/10 - Full DeFi privacy suite (transfers, AMM, perps, governance, note consolidation) |
| **Execution** | 9/10 - 52k LOC, all E2E tests passing, Light Protocol integration |
| **Team Credibility** | HIGH - Extensive codebase, multi-phase transaction patterns, professional |
| **Deployment** | Devnet: `2VWF9TxMFgzHwbd5WPpYKoqHvtzk3fN66Ka3tVV82nZG` |
| **ZK System** | Circom 2.1 with Groth16 + Light Protocol ZK compression |
| **Video** | ✅ Yes (4.7MB demo video included) |

**What Works:**
- 52k+ lines of code across circuits, SDK, Anchor program
- Groth16 circuits for transfers (1x2), consolidation (3x1), AMM, perps, governance
- Private AMM swaps (ConstantProduct + StableSwap curves)
- Private perpetual futures (5x-100x leverage) with Pyth oracle
- Private governance voting with multiple modes
- Light Protocol compressed state integration
- Extensive documentation

**What Doesn't Work:**
- **CRITICAL: Fake commitment attack** - No verification commitments exist in state tree; attackers can spend non-existent tokens and mint currency from thin air
- Trusted setup required for Groth16 (no audit provided)
- No on-chain commitment inclusion verification
- Voting verification keys not registered on devnet
- Proving time 3-6 seconds per proof

**Functional Summary:** CloakCraft is the most feature-rich privacy DeFi submission with 52k+ lines covering transfers, AMM, perpetual futures, and governance. However, it has a **critical unpatched vulnerability** where attackers can spend fake commitments to mint tokens infinitely—the team acknowledges this but shipped to devnet anyway. Despite impressive scope and passing E2E tests, this security flaw makes it unsuitable for production.

---

## TIER 2: Strong Submissions

### 5. Shadow DEX
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - ZK-gated eligibility proofs for AMM access (unique approach) |
| **Execution** | 8/10 - 4 Noir circuits, deployed program, working frontend |
| **Team Credibility** | MEDIUM-HIGH - Clean Anchor code, excellent documentation |
| **Deployment** | Devnet: `3TKv2Y8SaxJd2wmmtBS58GjET4mLz5esMZjnGfrstG72` |
| **ZK System** | Noir (v1.0.0-beta.13) with Sunspot verifier |
| **Video** | Not provided |

**What Works:**
- Noir circuits (4 types) compiled and working
- ZK-gated AMM swaps with proof verification
- Shielded pool deposits/withdrawals
- Nullifier double-spend prevention
- State root history management (32-item ring buffer)
- Frontend with wallet integration
- Devnet deployment with live transactions

**What Doesn't Work:**
- smt_exclusion circuit is placeholder (not real SMT proof)
- Centralized root update authority (requires trusted sequencer)
- Weak polynomial hash for account data binding
- Server-side proof generation (Sunspot limitation)
- Amounts remain public on-chain
- Light Protocol not actually integrated

**Functional Summary:** Shadow DEX implements a pragmatic ZK-gated eligibility privacy system where users prove qualifications without revealing underlying data. The four working Noir circuits and complete Anchor program with shielded pools demonstrate solid end-to-end functionality. The project honestly acknowledges limitations (centralized root updates, placeholder SMT) while delivering functional Sunspot integration.

---

### 6. AuroraZK
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - Dark pool limit order DEX with Noir ZK + Light Protocol |
| **Execution** | 7/10 - Multi-layer privacy, working demo |
| **Team Credibility** | MEDIUM-HIGH - Good architecture |
| **Deployment** | Devnet: `4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi` |
| **ZK System** | Noir (Groth16) + Light Protocol ZK compression |
| **Video** | ✅ Yes - https://aurorazkhost.vercel.app |

**What Works:**
- Solana program deployed
- Order placement and matching
- Commitment verification on reveal
- Balance tracking and updates
- Real-time WebSocket updates
- Wallet integration
- Partial Light Protocol integration

**What Doesn't Work:**
- **Pedersen hash (Noir) vs SHA-256 (on-chain) commitment mismatch breaks ZK property**
- On-chain Noir proof verification not implemented
- Light Protocol SDK reliability issues
- Centralized matcher
- No multi-token support

**Functional Summary:** AuroraZK is a dark pool DEX implementing encrypted orders with commit-reveal pattern. The Noir range proofs and Light Protocol compression create multi-layer privacy. However, a critical hash mismatch between Noir (Pedersen) and on-chain (SHA-256) commitments undermines the ZK privacy property, requiring resolution for production use.

---

### 7. Mukon-messenger
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 7/10 - E2E encrypted wallet-to-wallet messaging with Arcium MPC |
| **Execution** | 8/10 - 1100+ LOC Anchor, full React Native app, deployed to devnet |
| **Team Credibility** | MEDIUM-HIGH - Complete mobile app (unusual for hackathon) |
| **Deployment** | Devnet: `GCTzU7Y6yaBNzW6WA1EJR6fnY9vLNZEEPcgsydCD8mpj` |
| **ZK System** | Arcium MPC (X25519 + Rescue cipher) |
| **Video** | Not provided |

**What Works:**
- Solana program deployed and working
- E2E NaCl box encryption functional
- Mobile app with wallet adapter
- Complete Solana account structures
- Group chat with token gating support
- Arcium circuits compiled
- User profile and relationship management

**What Doesn't Work:**
- Arcium MPC not integrated to devnet
- Contact lists visible on-chain without Arcium
- No persistent message storage (in-memory only)
- Backend centralization via Socket.IO
- Physical device required for testing

**Functional Summary:** Mukon is a privacy messenger with wallet-to-wallet encrypted communication on Solana. Users authenticate via wallet address with E2E encryption using NaCl box. The React Native app is surprisingly complete for a hackathon project. Arcium MPC integration is compiled but not yet deployed to devnet, leaving contact metadata visible.

---

### 8. CleanProof (Privacy Pools)
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 9/10 - Vitalik's "Privacy Pools" concept with Proof of Innocence |
| **Execution** | 7/10 - 90% frontend, live demo at cleanproof.xyz |
| **Team Credibility** | MEDIUM-HIGH - Professional presentation |
| **Deployment** | Live demo, backend separate |
| **ZK System** | Groth16 with Poseidon hash |
| **Video** | ✅ Yes - https://cleanproof.xyz |

**What Works:**
- Complete ZK proving stack in browser
- Poseidon hash and Merkle tree (10-level)
- Groth16 proof generation (~300ms)
- Wallet connection and UI
- Deposit/withdraw interfaces
- Solana proof encoding
- Association sets UI
- E2E tests included

**What Doesn't Work:**
- Missing circuit WASM files (must be in public/)
- Backend in separate repo (not included)
- Fixed pool amounts (no variable denominations)
- Only 10-level Merkle tree (demo), need 26 for production
- Centralized relayer dependency

**Functional Summary:** CleanProof implements Vitalik Buterin's Privacy Pools concept enabling compliant ZK-anonymous transfers with "Proof of Innocence" via association sets. Users can prove funds are not from illicit sources while maintaining privacy. The browser-based Groth16 proving works but the backend and production-scale Merkle tree are separate/missing.

---

### 9. hydentity
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - SNS domain privacy wrapper (first-mover in category) |
| **Execution** | 7/10 - Full Anchor program, frontend, Privacy Cash + Arcium integration |
| **Team Credibility** | MEDIUM-HIGH - Comprehensive architecture, GitBook docs |
| **Deployment** | Devnet + Mainnet: `7uBSpWjqTfoSNc45JRFTAiJ6agfNDZPPM48Scy987LDx` |
| **ZK System** | Arcium MPC + Privacy Cash ZK mixer |
| **Video** | Not provided |

**What Works:**
- Solana program deployed (devnet & mainnet)
- SNS domain ownership verification
- Vault PDA structure complete
- Privacy policy configuration
- Domain transfer/reclaim via CPI
- Privacy Cash SDK integration
- Derived keypair pattern
- Full React frontend with withdrawal UI
- Delegate system with permissions

**What Doesn't Work:**
- Arcium MPC integration is placeholder code
- Rescue cipher not actually implemented
- ECDH key exchange missing
- Privacy Cash SDK from unpublished GitHub tarball
- No SPL token support yet
- Vault balances publicly visible

**Functional Summary:** hydentity creates vault PDAs for receiving funds through .sol domains while keeping the primary wallet private. It combines Arcium MPC for encrypted destination storage and Privacy Cash ZK mixer for transaction unlinkability. Novel first-mover in SNS privacy wrapper category, but Arcium integration remains placeholder code.

---

### 10. Obsidian (Dark Launchpad)
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 7/10 - Dark auctions for token launches (encrypted bids) |
| **Execution** | 8/10 - Complete E2E flow, polished UI, live demo |
| **Team Credibility** | MEDIUM - Self-audit document, honest about limitations |
| **Deployment** | Devnet: `8nkjktP5dWDYCkwR3fJFSuQANB1vyw5g5LTHCrxnf3CE` |
| **ZK System** | NaCl Box (simulated Arcium, not real MPC) |
| **Video** | ✅ Yes - https://obsidian-qdke.vercel.app/ |

**What Works:**
- Solana program with auction flow deployed
- NaCl box encryption for bids functional
- Frontend with bid submission and claiming
- AI scoring model implemented
- SPL token integration
- PDA structures correct
- Complete claim flow
- Polished UI with Framer Motion

**What Doesn't Work:**
- Centralized Cypher Node (single point of trust)
- No real Arcium SDK integration (simulated only)
- Minimal testing (stub tests only)
- Self-documented security issues (bump/validation bugs)
- Static encryption key
- AI model is trivial linear scoring

**Functional Summary:** Obsidian is a dark launchpad implementing sealed-bid auctions to prevent front-running and price manipulation. Bid amounts remain encrypted until auction concludes, with off-chain Cypher Node handling decryption. The polished UI is impressive but the "Arcium integration" is actually simulated with NaCl box, not real MPC.

---

### 11. Incognito Protocol
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - Private marketplace with Merkle pool and encrypted escrow |
| **Execution** | 8/10 - Two deployed programs, comprehensive flow |
| **Team Credibility** | HIGH |
| **Deployment** | Devnet: `4N49EyRoX9p9zoiv1weeeqpaJTGbEHizbzZVgrsrVQeC` |
| **ZK System** | Arcium MPC (Merkle tree + confidential balance) |
| **Video** | Not provided |

**What Works:**
- Merkle tree privacy pool with commitments/nullifiers
- Arcium MPC for balance ops (deposit/withdraw)
- Full escrow state machine with dispute resolution
- Encrypted shipping addresses (E2E)
- Stealth address generation
- Client-side encryption for notes
- PostgreSQL backend with FastAPI
- Streamlit dashboard

**What Doesn't Work:**
- Token-2022 cSOL (documented but not coded)
- Web interface (directory exists but empty)
- No ZK proofs (relies on MPC instead)
- Off-chain Arcium dependency

**Functional Summary:** Incognito Protocol is a privacy marketplace combining on-chain Merkle tree privacy pool with off-chain Arcium MPC for balance operations. The full escrow system includes buyer/seller protection and arbiter-based dispute resolution. Uses SHA-256 Merkle trees with nullifier double-spend prevention and stealth addresses for fees.

---

### 12. anon0mesh
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - BLE mesh + Arcium MPC + durable nonces for OFFLINE payments |
| **Execution** | 7/10 - Mobile app functional, escrow incomplete |
| **Team Credibility** | MEDIUM-HIGH - Novel use case, clean architecture |
| **Deployment** | Devnet: `BtZEFfbu3dSJtP5hyQsnnfrL19X2UfLwjts2N7KbJteo` |
| **ZK System** | Arcium MPC (Cerberus protocol) |
| **Video** | Not provided |

**What Works:**
- BLE mesh networking (Central + Peripheral dual-mode)
- Multi-hop transaction relay with TTL routing
- Arcium MPC integration with 6 encrypted instructions
- Durable nonce accounts (never-expiring offline txs)
- Disposable wallet addresses
- Nostr integration (NIP-04/44 encryption)
- Mobile Wallet Adapter (MWA 2.2.5)
- React Native mobile app
- Relayer fee incentive system

**What Doesn't Work:**
- Production deployment scripts
- Mainnet configuration
- Integration tests for escrow
- BLE reliability issues in real-world usage
- Devnet-only escrow program

**Functional Summary:** anon0mesh enables P2P offline Solana payments using BLE with multi-hop relaying, durable nonces, and Arcium MPC for confidential payment statistics. Designed for connectivity-constrained environments (festivals, protests) through beacon discovery. The most unique use case in the hackathon with Nostr messaging fallback.

---

### 13. Epoch
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 7/10 - Private prediction markets |
| **Execution** | 8/10 - Complete flow |
| **Team Credibility** | HIGH |
| **Deployment** | Devnet: `JAycaSPgFD8hd4Ys7RuJ5pJFzBL8pf11BT8z5HMa1zhZ` |
| **ZK System** | Arcium MPC (X25519 + Rescue cipher) |
| **Video** | Not provided |

**What Works:**
- Market creation and full lifecycle
- Encrypted betting with X25519 + Rescue cipher
- Arcium MPC integration for payout computation
- Token vault (SPL)
- Claim/refund mechanisms
- Complete frontend with Privy wallet
- Devnet deployment
- Comprehensive test suite

**What Doesn't Work:**
- Oracle integration (manual resolution only)
- Mainnet deployment
- Security audit
- Multiple positions per user
- Partial withdrawal

**Functional Summary:** Epoch is a privacy-preserving prediction market using Arcium MPC to hide bet directions throughout the betting period, preventing front-running and copy trading. Well-implemented with clean Anchor code and strong Arcium integration at 75% completion, lacking only oracle automation and mainnet readiness.

---

### 14. ECHO
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 8/10 - Privacy analysis and visualization |
| **Execution** | 8/10 - Multi-sponsor API integration |
| **Team Credibility** | HIGH |
| **Deployment** | None - analysis tool |
| **ZK System** | None |
| **Video** | Not provided |

**What Works:**
- Privacy analysis engine (8 risk categories)
- Interactive React Flow deanonymization graph
- Node detail modals with transaction counts
- AI-powered summaries via Gemini
- MEV detection with visual indicators
- Privacy simulation panel
- Gamification badges
- Compliance heatmap
- Export functionality (JSON/MD/CSV)
- 11 integration tests passing

**What Doesn't Work:**
- Mainnet support
- Wallet adapter integration
- Historical privacy score tracking
- Known exchange address database completeness
- Deep MEV analysis (limited to 20 transactions)

**Functional Summary:** ECHO is a privacy analysis and visualization platform diagnosing wallet privacy exposure across 8 risk categories with a 0-100 privacy score. Integrates Helius, Range Protocol, QuickNode, and Gemini APIs for comprehensive privacy intelligence including MEV detection and AI-powered recommendations. Analysis tool only—provides no privacy protection itself.

---

### 15. Vapor Tokens
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 9/10 - Plausible deniability via "vapor addresses" |
| **Execution** | 8/10 - Working E2E flow with demo |
| **Team Credibility** | HIGH |
| **Deployment** | Devnet: token mint `4eyCrBi9Wp1TC4WwcvzYN8Ub8ZB15A5px9t7WCrgf4vn` |
| **ZK System** | Noir + Sunspot Groth16 |
| **Video** | ✅ Referenced in analysis |

**What Works:**
- Working hash-to-curve vapor address generation
- Ed25519 curve operations in Noir
- On-chain Merkle tree with Poseidon
- Token-2022 transfer hook for automatic recording
- Condenser circuit (Noir) with Groth16 verification
- Sunspot toolchain integration (Noir→Gnark→Solana)
- CLI wallet (address generation, listing, condensing)
- Devnet deployment
- Working end-to-end flow
- Plausible deniability (undetectable private transfers)
- Double-spend prevention via cumulative tracking

**What Doesn't Work:**
- Recursive proofs for batch withdrawals
- Trusted setup ceremony not performed (dev keys only)
- Browser wallet integration missing
- Single-use vapor addresses limitation
- Amount linkability (public amounts)
- High compute budget for Groth16 (~1M CU)

**Functional Summary:** Vapor Tokens implements unlinkable private token transfers with plausible deniability on Solana using Token-2022 hooks and Groth16 proofs. Burns tokens to provably unspendable "vapor addresses" and allows recipients to later mint new tokens via ZK proofs, making private transfers indistinguishable from regular transfers. One of the most innovative privacy approaches in the hackathon.

---

### 16. shielded-pool-pinocchio-solana
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 7/10 - Clean reference implementation |
| **Execution** | 8/10 - Full deposit/withdraw flow |
| **Team Credibility** | HIGH |
| **Deployment** | Devnet |
| **ZK System** | Noir + Sunspot Groth16 + Pinocchio |
| **Video** | Not provided |

**What Works:**
- Noir circuit properly implements commitment, nullifier, and Merkle membership constraints
- Groth16 proof generation and verification via Sunspot working E2E
- Pinocchio program cleanly handles state, deposits, and withdrawals
- Root history buffer (32 roots) for concurrent deposit handling
- Zero-byte nullifier PDAs for efficient double-spend prevention
- Integration tests covering happy path and failure cases
- Efficient 388-byte proof size
- CPI to Sunspot verifier works properly

**What Doesn't Work:**
- Off-chain Merkle tree computation—program trusts client-supplied root
- Only 32-root history buffer (may expire valid withdrawals in high volume)
- Fixed denomination per commitment fragments anonymity set
- No UI/frontend (CLI integration test only)
- No multi-denomination support

**Functional Summary:** A clean reference implementation of Tornado Cash-style shielded pool using Noir circuits + Sunspot Groth16 + Pinocchio on Solana. Fully functional deposit/withdraw flow with proper ZK constraints. Trusts client for Merkle root computation but otherwise demonstrates solid privacy primitives.

---

## TIER 3: Moderate Quality

### 17. deploy-shield
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 7/10 - Privacy-preserving program deployment |
| **Execution** | 8/10 - Working Rust CLI |
| **Deployment** | CLI tool |
| **ZK System** | Groth16 via Privacy Cash |
| **Video** | Not provided |

**What Works:**
- CLI tool with 8 commands (init, fund, deploy, upgrade, status, rotate, transfer-authority, finalize)
- Groth16 ZK proof integration via Privacy Cash
- Burner wallet separation
- Timing delay for privacy
- Config management with state tracking
- Solana v2.x SDK support
- Complete error handling

**What Doesn't Work:**
- Integration tests (0%)
- CI/CD pipeline
- Pre-built binaries
- Deposit amount visibility on-chain
- RPC IP leakage
- Bytecode fingerprinting linkability

**Functional Summary:** CLI tool for privacy-preserving Solana program deployment using Groth16 ZK proofs to hide funding path between developer's wallet and deployed programs. Leverages Privacy Cash infrastructure to obscure developer identity through burner wallets and ZK-proof private transfers.

---

### 18. PrivyLocker
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - FHE on Solana via Inco Lightning (novel tech) |
| **Execution** | 7/10 - Complete Anchor program with CPI, live demo |
| **Team Credibility** | MEDIUM |
| **Deployment** | Devnet: `4TSoksGkK9L1scc8MBqbPwaNuxM7Jfxj49HGF21pX5CG` |
| **ZK System** | Inco Lightning FHE (Fully Homomorphic Encryption) |
| **Video** | Not provided |

**What Works:**
- FHE encryption via Inco Lightning
- User profile management
- Document upload with FHE
- Share session creation with expiry
- Session revocation
- IPFS document storage
- Frontend application
- Live demo deployment

**What Doesn't Work:**
- General document type support
- Decentralized IPFS pinning
- ZK proof-based verification (requires decryption)
- Multiple verifier tiers
- Batch verification
- Audit trail/access logs

**Functional Summary:** Privacy-preserving document verification dApp using Fully Homomorphic Encryption via Inco Lightning. Users securely store sensitive documents and share verifiable proofs of identity without revealing underlying data through selective disclosure with time-limited, revocable access grants. First Inco FHE integration on Solana.

---

### 19. Nahualli
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 7/10 - Privacy-preserving personality assessments |
| **Execution** | 6/10 - Working circuits, needs polish |
| **Team Credibility** | MEDIUM |
| **Deployment** | Devnet |
| **ZK System** | Noir |
| **Video** | Not provided |

**What Works:**
- 4 personality test types (Big Five, DISC, MBTI, Enneagram)
- 3 complete Noir ZK circuits (trait_proof, test_completed, role_fit)
- AES-256-GCM client-side encryption
- IPFS storage via Pinata integration
- On-chain registry via Solana Memo Program
- Wallet-derived deterministic key recovery
- Public verification pages (/verify/{hash})
- React UI with wallet adapter
- Pedersen commitment scheme

**What Doesn't Work:**
- Arcium MXE in demo mode (not real MPC)
- No on-chain ZK verification (browser-only)
- Commitment scheme mismatch (SHA-256 frontend vs Pedersen circuits)
- Proof revocation mechanism
- Score validation for out-of-range values

**Functional Summary:** Privacy-preserving personality assessment platform with Noir ZK proofs for selective disclosure of traits without revealing scores. Results encrypted on IPFS with on-chain registry. Enables employers to verify personality fit without accessing raw assessment data.

---

### 20. paraloom-core
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Innovation** | 8/10 - ZK + privacy-preserving WASM computation |
| **Execution** | 7/10 - Working devnet deployment |
| **Team Credibility** | MEDIUM-HIGH |
| **Deployment** | Devnet |
| **ZK System** | Groth16 (Arkworks, BLS12-381) |
| **Video** | Not provided |

**What Works:**
- Groth16 circuits (Arkworks)
- Poseidon hash gadget
- Pedersen commitments
- Merkle tree proofs
- Nullifiers for double-spend
- Deposit/withdraw bridge
- WASM compute execution
- Validator consensus (7/10 threshold)
- Devnet deployment working
- AES-GCM encryption

**What Doesn't Work:**
- MPC ceremony for trusted setup
- Full validator network deployment
- Production hardening
- UI/frontend
- Comprehensive integration tests

**Functional Summary:** Full Zcash-style privacy protocol combining Groth16 proofs on BLS12-381 with privacy-preserving distributed WASM computation. Validators process encrypted data via Byzantine consensus (7/10 threshold) while maintaining confidentiality of transactions and computation results.

---

### 21. Dark Null Protocol
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 8/10 - Optimistic ZK (lazy verification) |
| **Execution** | 6/10 - V20 deployed, challenge path incomplete |
| **Team Credibility** | LOW-MEDIUM - **Closed source** |
| **Deployment** | Devnet (multiple versions) |
| **ZK System** | Groth16 on BN254 with optimistic challenge window |
| **Video** | Not provided |

**What Works:**
- Shield instruction (deposit with commitment)
- Unshield with full ZK proof
- Relayed unshield (hide recipient)
- Flex denomination mode
- Nullifier tracking
- Root ring buffer
- Devnet deployment
- E2E testing

**What Doesn't Work:**
- Challenge path (documentation incomplete)
- **Source code verification** (circuits/programs excluded from repo)
- Trusted setup details missing
- Critical vulnerability fixes (C-01 recipient binding, H-01 maturity bypass)
- Third-party audit

**Functional Summary:** Optimistic ZK privacy protocol using 32-byte commit hashes for happy-path deposits with full Groth16 proof verification only on challenge. Innovation is cost-reduction through lazy verification. However, **closed-source nature** combined with documented critical vulnerabilities significantly undermines confidence.

---

### 22. SolVoid
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 7/10 - Mixer with privacy scoring |
| **Execution** | 7/10 - Full stack with relayer |
| **Team Credibility** | MEDIUM |
| **Deployment** | Placeholder program ID |
| **ZK System** | Groth16/Circom |
| **Video** | Not provided |

**What Works:**
- Full deposit/withdraw flow with Groth16 ZK verification
- Privacy Ghost Score diagnostic engine
- Multi-hop onion-routing relayer
- Merkle tree with Poseidon hashing
- TypeScript SDK with proper types
- Economic safety layer with rate limiting
- Comprehensive CLI tooling

**What Doesn't Work:**
- No trusted setup ceremony (critical for production)
- Unaudited cryptographic code
- Placeholder program ID
- SOL-only, no SPL token support
- Relayer lacks decentralized incentives

**Functional Summary:** Full-stack Tornado Cash-style mixer for Solana with anonymity diagnostics and multi-hop relayer infrastructure. Core ZK proof verification works on-chain but requires production trusted setup ceremony.

---

### 23. Veil Ecosystem
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Innovation** | 8/10 - Dual-protocol DeFi privacy |
| **Execution** | 7/10 - Comprehensive but incomplete |
| **Team Credibility** | MEDIUM-HIGH |
| **Deployment** | Unclear |
| **ZK System** | Light Protocol + Noir |
| **Video** | Not provided |

**What Works:**
- Complete @veil/crypto package (11 modules)
- NaCl Box encryption (Curve25519-XSalsa20-Poly1305)
- Shamir's Secret Sharing implementation
- ZK compression via Light Protocol integration
- Confidential Swap Router program (5 instructions)
- RWA Secrets Service program (7 instructions)
- Solver API with key exchange
- Jupiter integration for DEX routing
- Next.js frontends
- Proper access control (4-level RWA permissions)

**What Doesn't Work:**
- Deployment status unclear (no devnet IDs shown)
- Privacy Cash SDK integration dependent on availability
- Full E2E test coverage incomplete
- Large scope may not be fully functional
- Solver trust model risk

**Functional Summary:** Comprehensive privacy-focused DeFi infrastructure with dual protocols: Confidential Swap Router (MEV-protected swaps with encrypted orders) and RWA Secrets Service (encrypted metadata for tokenized assets). Working crypto library but deployment status unclear.

---

## TIER 4: Limited/Incomplete

### 24. SafeSol
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 7/10 - Compliance-ready privacy concept |
| **Execution** | 6/10 - Full stack but mock verifier |
| **Team Credibility** | MEDIUM - Excellent docs (30+ files) |
| **Deployment** | Devnet: `HPnAch9XaLsvKdtHtqEq4o5SAoDThCHd4zt9NCbmPKBw` |
| **ZK System** | Groth16/Circom (but verifier is **MOCK**) |
| **Video** | Not provided |

**What Works:**
- Next.js frontend with wallet integration
- Groth16 SNARK circuit compilation
- Client-side proof generation (snarkjs)
- Circom circuit definitions
- Nullifier system (PDA-based)
- Selective disclosure circuit
- Transaction history UI

**What Doesn't Work:**
- **CRITICAL: Mock on-chain ZK verifier** (only checks non-zero bytes, no pairing check)
- Amount visible on-chain in transfer instruction
- Simplified circuit using addition instead of Poseidon
- Light Protocol integration is mock (client-side only)
- No CPI to verifier

**Functional Summary:** Full-stack ZK privacy payment dApp with **critical security flaws**. The on-chain verifier is non-functional—it only checks for non-zero bytes without actual pairing verification. Amounts remain visible on-chain and proof verification is entirely bypassed, making privacy claims invalid.

---

### 25. Keyed (formerly SolShare)
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** (as social platform, not privacy) |
| **Innovation** | 8/10 as social platform, **1/10 for privacy** |
| **Execution** | 9/10 - 4 Anchor programs, 744 tests, AI pipeline |
| **Team Credibility** | HIGH - Exceptional engineering |
| **Deployment** | Devnet (4 programs) |
| **ZK System** | **None** |
| **Video** | Not provided |

**What Works:**
- Social platform (profiles, posts, follows, tips, subscriptions)
- 4 deployed Anchor programs
- AI content discovery (Gemini + Voyage + Qdrant)
- 744 test cases
- Wallet integration

**What Doesn't Work:**
- **Privacy features are stubs only**
- Privacy Cash SDK not integrated
- All on-chain data public
- Privacy endpoints return mock data

**Functional Summary:** Comprehensive Web3 social media platform with production-quality Solana integration and AI microservices. **Wrong hackathon category**—built as social platform first with privacy as architectural placeholder. Exceptional engineering but no actual privacy implementation.

---

### 26. Attesta-Kit
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 7/10 - First WebAuthn/passkey auth on Solana |
| **Execution** | 4/10 - Strong architecture, not deployed |
| **Team Credibility** | MEDIUM |
| **Deployment** | **None** |
| **ZK System** | **None** |
| **Video** | Not provided |

**What Works:**
- WebAuthn/FIDO2 P-256 signature verification design
- Passkey support architecture
- Account abstraction framework

**What Doesn't Work:**
- Not deployed (no Cargo.toml)
- Policy engine returns stubs
- Encrypted backups plaintext
- SDK missing
- Zero integration tests
- No on-chain functionality

**Functional Summary:** Account abstraction protocol for Solana enabling passkey authentication instead of seed phrases. **Not a privacy project**—focuses on UX (removing seed phrases) rather than cryptographic privacy. All transactions remain public on-chain. Incomplete and undeployed.

---

### 27. triton-privacy-solana
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 6/10 - Compliance-aware privacy workflow concept |
| **Execution** | 3/10 - **All privacy features are mocks** |
| **Team Credibility** | LOW |
| **Deployment** | Devnet: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` |
| **ZK System** | **None** (claims ElGamal, reality is plaintext) |
| **Video** | Not provided |

**What Works:**
- Anchor program compiles
- 4/4 internal tests pass
- PDA derivation correct
- Architectural framework

**What Doesn't Work:**
- **All privacy features are mocks**
- No actual encryption (claims ElGamal but implements none)
- Mock compliance checks
- Plaintext financial data on-chain
- No ZK circuits
- Token transfers broken

**Functional Summary:** Architectural prototype for compliance-aware privacy workflow. **All privacy is simulated** through mock traits; stores amounts unencrypted on-chain. Claims ElGamal/Confidential Transfers but none are implemented.

---

### 28. styx-stack-Solana
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 6/10 - Domain-based privacy token concept |
| **Execution** | 2/10 - Only 5% of claimed features work |
| **Team Credibility** | LOW |
| **Deployment** | **None** |
| **ZK System** | **None** (broken crypto) |
| **Video** | Not provided |

**What Works:**
- 3 Kotlin utility functions (StyxEnvelopeV1, ChunkFrame, SessionDerivation)
- Binary message encoding
- Deterministic session IDs

**What Doesn't Work:**
- No Rust/Anchor programs
- **Broken cryptography** (sha256 instead of ECDH for key derivation)
- No ZK system
- All core features are stubs
- Centralized balance/message APIs
- 95% documentation/stubs, 5% working code

**Functional Summary:** SDK documentation for proposed privacy token standard with partial client implementations. Contains **broken cryptographic primitives** (incorrect ECDH), no on-chain programs, and centralized relay infrastructure. Resembles design document rather than working project.

---

### 29. DarkTip
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 6/10 - Privacy tipping concept |
| **Execution** | 4/10 - 85% frontend, 5% crypto |
| **Team Credibility** | LOW-MEDIUM |
| **Deployment** | **None** (placeholder IDs only) |
| **ZK System** | **Mocked** |
| **Video** | Not provided |

**What Works:**
- ShadowPay SDK integration (1200+ lines)
- Frontend UI (85% complete)
- Wallet integration (Phantom, Backpack, Solflare)
- Encrypted messaging (NaCl box)
- Clean component architecture

**What Doesn't Work:**
- **ZK proof system entirely mocked**
- **Stealth addresses broken** (XOR instead of EC point addition)
- No on-chain programs deployed
- Noir circuits don't exist
- Multi-hop routing simulated

**Functional Summary:** Privacy-preserving tipping platform with polished UI but **broken cryptography**. All core privacy features are simulated with incorrect stealth address implementation (XOR-based instead of EC operations) and mocked ZK proofs.

---

### 30. confpay
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** (but security flaws) |
| **Innovation** | 6/10 - Confidential payroll with Inco FHE |
| **Execution** | 5/10 - Real Inco integration, security flaws |
| **Team Credibility** | LOW |
| **Deployment** | Devnet: `EpWKv3uvNXVioG5J7WhyDoPy1G6LJ9vTbTcbiKZo6Jjw` |
| **ZK System** | Inco Lightning FHE |
| **Video** | Not provided |

**What Works:**
- Dual encryption (AES + Inco FHE)
- Anchor program structure
- Devnet deployment
- Employer/worker UI portals
- Manual SOL transfers
- Payment history tracking

**What Doesn't Work:**
- **CRITICAL: Plaintext PIN storage**
- Authorization checks removed (pay_employee)
- Vesting schedules
- Multi-sig
- SPL token support
- Automated payments (browser-only)

**Functional Summary:** Privacy payroll application using dual-encryption (AES-GCM + Inco FHE) to hide salary amounts. Polished UI but **critical security flaws** including plaintext PIN storage and removed authorization checks undermine production viability.

---

### 31. VeilVote
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Innovation** | 6/10 - Commit-reveal voting (classical, not ZK) |
| **Execution** | 5/10 - Clean Anchor code, but frontend stubs |
| **Team Credibility** | MEDIUM |
| **Deployment** | **Placeholder program ID** |
| **ZK System** | **None** (commit-reveal, not ZK) |
| **Video** | Not provided |

**What Works:**
- Clean Anchor program (584 lines)
- Commit-reveal logic complete
- PDA account structures defined
- Input validation
- Comprehensive documentation

**What Doesn't Work:**
- **No transaction submission** (frontend UI-only stubs)
- Placeholder program ID (11111...)
- Zero test coverage
- Secrets in plaintext localStorage
- No actual blockchain integration

**Functional Summary:** Educational prototype for DAO voting using classical commit-reveal scheme. **Not zero-knowledge**—just hash commitments with placeholder program ID and stub frontend that never submits transactions.

---

## TIER 5: Not Competitive / Wrong Category

| Project | Status | Issue |
|---------|--------|-------|
| **anonset** | ✅ Completely Working (as tool) | Analysis tool only (290 lines Python), no privacy provision |
| **anamnesis** | ⚠️ Almost Working | Multi-chain vault, not Solana-focused, no on-chain privacy |
| **anoma.cash** | ❌ Unsound | Custodial mixer with server-side JSON balance tracking, non-standard key derivation |
| **arcium-dev-skill** | N/A | Documentation/tutorial, not a project |
| **awesome-privacy-on-solana** | N/A | Curated list, not a project |
| **Axtral-priv** | N/A | IP tokenization, wrong chain (VERY Network) |
| **AgenC_Moltbook_Agent** | N/A | AI agent tool, not privacy |
| **Auction-App-Data-Processing** | N/A | AWS pipeline, wrong hackathon entirely |
| **custos-cli** | N/A | Empty repository |
| **hushfold** | N/A | Empty repository |
| **ruka0911** | N/A | GitHub profile repo |
| **synelar** | N/A | Pre-hackathon, no activity |
| **unstoppable-wallet-android** | N/A | Existing wallet, pre-hackathon code |
| **n8n-nodes-trezor** | N/A | Trezor integration, not privacy |
| **Iris-QuickNode-Kotlin-SDK** | N/A | SDK, not privacy project |
| **core (ORRO)** | N/A | Creator economy, not privacy |
| **velum** | N/A | Incomplete, minimal activity |
| **zelana** | N/A | Minimal implementation |
| **PublicTesting** | N/A | Empty repo with only LICENSE file |
| **unified-trust-protocol-sdk** | ❌ Unsound | README only, zero code implementation |
| **opencoins** | ❌ Unsound | Generic token launcher, no privacy features whatsoever |
| **zmix** | ❌ **MALWARE** | **Contains LuaJIT executables - DO NOT USE** |
| **Solana-Privacy-CLI** | ❌ Unsound | Wrong blockchain (Avalanche, not Solana) |
| **Solana-Privacy-Hack-** | ❌ Unsound | ~5% complete, only README exists |
| **Veil-SDK** | ❌ Unsound | All adapters throw "Not implemented" |
| **Pigeon** | ❌ Unsound | **Critical crypto flaw**: Key derivation from public wallet bytes |

---

## Delivery Channel Distribution

### App Type Summary
| Type | Projects | Notes |
|------|----------|-------|
| **Web App (Preferred)** | nahualli, vex-zk, sip-app, confpay, Obsidian, veilvote, chameo, cloakcraft, cleanproof | Next.js/Vite-based, testable in browser |
| **Web + Mobile** | Protocol-01 | Turbo monorepo with both platforms |
| **Mobile Only** | sip-mobile, Mukon-messenger | React Native/Expo, harder to verify |
| **CLI/SDK Only** | safesol, shadow, solana-privacy-scanner, SolanaPrivacyKit, SolVoid, deploy-shield | Developer-focused, no end-user UI |
| **Backend Only** | Arcium-poker, paraloom-core | Game servers, infra |

### Live Demo URLs (Bonus Points)
| Project | URL | Status |
|---------|-----|--------|
| **sip-app** | https://app.sip-protocol.org | Production |
| **vex-zk** | https://vex-zk.vercel.app | Live |
| **cleanproof** | https://cleanproof.xyz | Live |
| **Obsidian** | https://obsidian-qdke.vercel.app | Live |
| **AuroraZK** | https://aurorazkhost.vercel.app | Live |
| **SCOPE** | https://scope-privacy-engine.vercel.app | Live |
| **Shadow Fence** | https://shadow.hardhattechbones.com | Live |

### Red Flag: Mobile-Only with No Web
Mobile-only submissions should be scrutinized more carefully:
- **Harder for judges to test** (requires device/emulator)
- **Higher vibe-code risk** (AI-generated React Native is common)
- **Often incomplete** (mock backends, placeholder crypto)

---

## Technology Distribution

### ZK Proving Systems
| System | Projects | Notes |
|--------|----------|-------|
| **Groth16/Circom** | Protocol-01, CloakCraft, safesol, SolVoid, SolsticeProtocol, privacy-vault, cleanproof, paraloom-core | Most mature, requires trusted setup |
| **Noir/Sunspot** | Shadow DEX, AuroraZK, SIP Protocol, nahualli, vex-zk, Vapor Tokens, shielded-pool-pinocchio | Growing adoption, no trusted setup |
| **Arcium MPC** | Mukon-messenger, Arcium-poker, anon0mesh, Obsidian (simulated), hydentity, Epoch, Incognito | Confidential computing, not ZK proofs |
| **Inco FHE** | PrivyLocker, confpay, Donatrade | Fully homomorphic encryption, novel |
| **None/Mock** | veilvote, triton-privacy-solana, styx-stack, DarkTip, Keyed, Attesta-Kit | No real privacy crypto |

### Sponsor Bounty Alignment
| Sponsor | Strong Candidates |
|---------|-------------------|
| **Light Protocol** | CloakCraft, AuroraZK, privacy-vault, Veil |
| **Arcium** | Mukon-messenger, Arcium-poker, Obsidian, anon0mesh, Epoch, hydentity, Incognito |
| **Inco** | PrivyLocker, confpay, Donatrade |
| **QuickNode** | solana-privacy-scanner (explicit targeting), ECHO, QN-Privacy-Gateway |
| **Bonfida/SNS** | hydentity |
| **Range Protocol** | ECHO, StealthPay, SCOPE |
| **Helius** | Shadow Tracker, LeakLens, ECHO, StealthPay |

---

## Red Flag Summary

| Critical Issue | Projects Affected |
|----------------|-------------------|
| **Mock verifier** | safesol, triton-privacy-solana, privacy-execution-layer |
| **Placeholder circuits** | Arcium-poker, Attesta-Kit, DarkTip |
| **Broken crypto** | styx-stack (fake ECDH), DarkTip (XOR stealth), Pigeon (public key derivation), SolsticeProtocol (broken commitment) |
| **Wrong category** | Keyed, Attesta-Kit, anamnesis, ORRO, opencoins |
| **Closed source** | Dark Null Protocol |
| **Security vulnerabilities** | confpay (plaintext PIN), CloakCraft (fake commitment attack) |
| **Claims vs reality** | triton-privacy-solana (claims ElGamal, uses plaintext), ShieldedRemit (simulated Bulletproofs) |
| **Malware** | zmix (contains executables) |

---

## Recommended Judging Questions

### For Top Tier Projects
1. "Walk through your Groth16 pairing verification on-chain"
2. "How do you handle Merkle root updates - on-chain or client-computed?"
3. "What's your anonymity set size and how does it grow?"
4. "How would you handle a trusted setup ceremony for mainnet?"

### For MPC Projects
1. "What happens if Arcium nodes are unavailable?"
2. "Is the MPC integration real or simulated?"
3. "How many nodes are in your threshold scheme?"

### To Expose Weaknesses
1. "Can you show me the actual proof verification code?"
2. "Why is amount passed as a parameter if it's supposed to be hidden?"
3. "What prevents someone from generating a valid proof with any amount?"
4. "How does Light Protocol reduce your on-chain costs specifically?"

---

## Quick Reference: Innovation Highlights

| Category | Best Example |
|----------|--------------|
| **Most Complete** | Protocol-01 (full ecosystem with 6 programs) |
| **Best ZK Circuits** | SIP Protocol / shielded-pool-pinocchio |
| **Novel Privacy Model** | Shadow DEX (eligibility privacy) / Vapor Tokens (plausible deniability) |
| **Best Tooling** | solana-privacy-scanner (13 heuristics) |
| **Best MPC Integration** | Mukon-messenger / Epoch |
| **Best UX** | Obsidian (polished demo) |
| **Most Novel Tech** | PrivyLocker (FHE) / anon0mesh (offline BLE) |
| **Best Architecture** | hydentity (SNS wrapper) |
| **Best Documentation** | safesol (30+ files) |
| **Most Unique Use Case** | anon0mesh (offline payments) |
| **Prior Track Record** | SIP Protocol (Zypherpunk winner) |

---

## Summary Statistics

| Tier | Count | Description |
|------|-------|-------------|
| **Tier 1** | 4 | Top contenders, likely winners |
| **Tier 2** | 12 | Strong submissions, competitive |
| **Tier 3** | 7 | Moderate quality, some issues |
| **Tier 4** | 8 | Limited/incomplete implementations |
| **Tier 5** | 25+ | Not competitive or wrong category |

| Working Status | Count |
|----------------|-------|
| **Completely Working** | ~12 |
| **Almost Working** | ~25 |
| **Unsound** | ~20 |
| **N/A / Empty** | ~24 |

| Metric | Value |
|--------|-------|
| **Total in Index** | 81 |
| **With ZK Circuits** | ~15 |
| **With Deployed Programs** | ~25 |
| **Genuinely Competitive** | ~20 |
| **Prize-Worthy** | ~10 |

---

## Video Links Summary

| Project | Video |
|---------|-------|
| CloakCraft | ✅ 4.7MB demo video in repo |
| AuroraZK | ✅ https://aurorazkhost.vercel.app |
| CleanProof | ✅ https://cleanproof.xyz |
| Obsidian | ✅ https://obsidian-qdke.vercel.app/ |
| Vapor Tokens | ✅ Referenced in analysis |
| SCOPE | ✅ https://scope-privacy-engine.vercel.app/ |
| Shadow Fence | ✅ https://shadow.hardhattechbones.com |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-01 15:30 | Added Delivery Channel scoring (Web > Mobile), app type distribution, live demo URLs, mobile red flags |
| 2026-02-01 14:30 | Enhanced with working status (Completely Working/Almost Working/Unsound), video links, detailed what works/doesn't work sections |
| 2026-02-01 12:00 | Initial generation from 100+ analysis files |

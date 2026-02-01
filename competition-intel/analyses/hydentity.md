# Hydentity - Competitive Analysis

## 1. Project Overview

**Name:** Hydentity
**Tagline:** SNS Privacy Wrapper - Privacy-preserving receiving for Solana Name Service (.sol) domains
**Repository:** solana-privacy-hackathon-analysis/hydentity

Hydentity creates a privacy layer between public .sol domains and private wallets. Users can receive SOL/tokens through their SNS domain while keeping their primary wallet private through a combination of:

1. **Vault PDAs** - Receive funds on behalf of SNS names
2. **Domain Transfer** - Optional transfer of domain ownership to vault PDA for enhanced privacy
3. **Arcium MPC** - Encrypted destination handling via multi-party computation
4. **Privacy Cash** - ZK mixer pool to break on-chain transaction links
5. **Split & Delay** - Randomized amounts and timing to prevent transaction graph analysis

**Program ID:** `7uBSpWjqTfoSNc45JRFTAiJ6agfNDZPPM48Scy987LDx` (Devnet & Mainnet)

---

## 2. Track Targeting

**Primary Track:** Privacy Infrastructure / Identity Privacy

**Alignment:** Strong fit for privacy track - the project specifically addresses the privacy gap in public domain-based receiving addresses on Solana.

---

## 3. Tech Stack

### On-Chain (Rust/Anchor)
| Component | Technology | Version |
|-----------|------------|---------|
| Program Framework | Anchor | 0.32.1 |
| MPC Integration | arcium-anchor, arcium-macros, arcium-client | 0.5.4 |
| Account Features | init-if-needed | - |
| SPL Support | anchor-spl (token, associated_token) | 0.32.1 |

### Off-Chain (TypeScript)
| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 14.2.0 |
| Wallet Adapter | @solana/wallet-adapter-* | 0.15.35+ |
| SNS SDK | @bonfida/spl-name-service | 3.0.0 |
| Animations | framer-motion | 11.0.0 |
| Styling | TailwindCSS | 3.4.0 |
| Package Manager | pnpm | 10.18.2 |
| Build Orchestration | Turbo | 2.0.0 |

### External Dependencies
| Service | Purpose |
|---------|---------|
| Arcium Network | MPC infrastructure for encrypted config storage |
| Privacy Cash | ZK mixer pool for transaction unlinkability |
| Bonfida SNS | Solana Name Service domain resolution |

---

## 4. Crypto Primitives

### Multi-Party Computation (Arcium)
- **Key Exchange:** x25519 ECDH for shared secret derivation
- **Cipher:** Rescue (MPC-friendly symmetric cipher)
- **Flow:** Client generates ephemeral keypair -> ECDH with MXE cluster -> Encrypt config -> Store on-chain

### Zero-Knowledge (Privacy Cash)
- **Type:** ZK mixer pool (Tornado Cash-style approach)
- **Privacy Set:** Shared pool of all depositors
- **Proof:** Withdrawal validity proven without revealing deposit source
- **Relayer:** Fee-based relayer service (0.25% withdrawal fee)

### Ed25519 Key Derivation
- **Derived Keypair:** Deterministic key derivation from wallet signature
- **Message:** Fixed derivation message signed by user
- **Hash:** SHA-256 of signature -> Ed25519 seed via nacl.sign.keyPair.fromSeed

### Randomization
- **Split Randomization:** Configurable min/max splits (1-10)
- **Delay Randomization:** Configurable min/max delays (60s - 7 days)
- **Distribution Modes:** Uniform, Weighted, ExponentialDecay
- **Entropy:** User-provided 32-byte randomness for MPC plan generation

---

## 5. Solana Integration

### Account Structure (PDAs)
| Account | Seeds | Size | Purpose |
|---------|-------|------|---------|
| NameVault | `["vault", sns_name_account]` | 169 bytes | Vault metadata, ownership, statistics |
| VaultAuthority | `["vault_auth", sns_name_account]` | ~65 bytes | Holds SOL, token authority, signing PDA |
| PrivacyPolicy | `["policy", sns_name_account]` | ~475 bytes | Privacy settings (splits, delays, destinations) |
| EncryptedConfig | `["encrypted_config", vault]` | 683 bytes | MPC-encrypted destination config |
| DelegateSession | `["delegate", sns_name, delegate]` | Variable | Time-limited delegate permissions |

### Instructions
1. **initialize_vault** - Create vault for SNS domain (verifies SNS ownership)
2. **mark_domain_transferred** - Record domain transfer to vault authority
3. **reclaim_domain** - Transfer domain back from vault (CPI to SNS Name Program)
4. **close_vault** - Close all PDAs and reclaim rent
5. **claim_vault** - New domain owner takes over existing vault
6. **withdraw_direct** - Emergency bypass of privacy features (owner-only)
7. **update_policy** - Modify privacy settings
8. **add_delegate/revoke_delegate** - Delegate management
9. **store_private_config** (Arcium) - Queue encrypted config storage
10. **generate_withdrawal_plan** (Arcium) - Generate randomized withdrawal plan

### SNS Integration
- **Ownership Verification:** Reads owner field from SNS account data (bytes 32-64)
- **Domain Transfer CPI:** Calls SNS Name Program (namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX)
- **SDK:** Uses @bonfida/spl-name-service for domain resolution

### Security Model
- **Non-custodial:** Vault owner (SNS domain owner) is sole authority
- **PDA signing:** VaultAuthority signs on behalf of program only
- **Delegate permissions:** Time-limited with bitmap permissions (UPDATE_POLICY, DEPOSIT_UMBRA)
- **Constraint validation:** Anchor constraints for owner verification, balance checks

---

## 6. Sponsor Bounties

### Potential Bounty Targets
| Sponsor | Relevance | Integration Depth |
|---------|-----------|-------------------|
| **Arcium** | Primary MPC provider | Deep - arcium-anchor macros, encrypted ixs, MXE key exchange |
| **Bonfida/SNS** | Domain integration | Moderate - ownership verification, CPI transfers |
| **Privacy Cash** | ZK mixer integration | Deep - SDK integration, derived keypairs, API routes |

### Arcium Integration Details
- Uses `@arcium-hq/client` (v0.5.4)
- Implements two MPC circuits: `store_private_config`, `generate_withdrawal_plan`
- Full queue_computation_accounts macro usage
- Callback handler patterns
- Computation definition initialization

---

## 7. Alpha/Novel Findings

### Novel Approaches

1. **SNS Domain as Privacy Anchor**
   - First project to use SNS domains as a privacy abstraction layer
   - Domain transfer to vault PDA hides original owner
   - Enables "privacy-preserving receiving addresses"

2. **Dual Privacy Layer Architecture**
   - Layer 1: Arcium MPC for encrypted destination storage
   - Layer 2: Privacy Cash ZK mixer for transaction unlinkability
   - Configurable: Can use either or both

3. **Derived Keypair Pattern for ZK Mixers**
   - Deterministic key derivation from wallet signature
   - Session-cached (cleared on browser close)
   - Avoids exposing primary wallet to Privacy Cash

4. **Split & Delay Randomization**
   - Configurable presets (Low/Medium/High privacy)
   - MPC generates randomized withdrawal plans
   - User-provided entropy for additional randomness

### Potential Weaknesses

1. **Privacy Cash Dependency**
   - SDK loaded via GitHub tarball (not published npm package)
   - External relayer dependency (centralization risk)
   - Pool liquidity requirements

2. **Arcium Integration Status**
   - Many SDK calls marked as "TODO" or "placeholder"
   - `ArciumClient.initialize()` logs "Awaiting @arcium-hq/client integration"
   - Encryption uses placeholder keys for structure testing

3. **Vault Balance Visibility**
   - Vault balance is public on-chain
   - Only withdrawal destinations are private
   - Deposit patterns may leak information

4. **Historical Domain Ownership**
   - Previous owners visible in historical data
   - Domain transfer doesn't erase history

---

## 8. Strengths and Weaknesses

### Strengths

1. **Comprehensive Architecture**
   - Well-documented with GitBook documentation
   - Clear separation of concerns (core/chips/prover/verifier pattern)
   - SDK with typed interfaces

2. **Deep Sponsor Integration**
   - Heavy Arcium usage with proper macro patterns
   - Privacy Cash SDK integration with API routes
   - SNS verification via CPI

3. **User Experience Focus**
   - Privacy presets (Low/Medium/High)
   - Session-cached derived keys (no repeated signatures)
   - Direct withdrawal escape hatch
   - Recovery function for stuck funds

4. **Security Considerations**
   - Non-custodial design
   - Delegate permission system
   - Emergency access paths

5. **Production Readiness Signals**
   - Mainnet program ID
   - Vercel deployment config
   - Environment variable handling for RPC endpoints

### Weaknesses

1. **Incomplete MPC Integration**
   - Placeholder encryption code
   - Rescue cipher not actually implemented
   - Missing ECDH key exchange

2. **External Dependencies Risk**
   - Privacy Cash SDK from unpublished GitHub tarball
   - Relayer centralization
   - MPC cluster availability

3. **Limited Privacy Model**
   - Vault balances public
   - Deposit patterns observable
   - Only withdrawal destinations hidden

4. **No SPL Token Support (Yet)**
   - Listed as "In Progress"
   - Only SOL transfers currently functional

5. **Unaudited**
   - Explicitly stated in documentation
   - MPC integration described as "relatively new technology"

---

## 9. Threat Level Assessment

**Threat Level: HIGH**


|-----------|-----------|------|
| **Privacy Model** | Vault wrapper + ZK mixer | Shielded pool |
| **Crypto Approach** | MPC + ZK mixer (external) | Native ZK circuits |
| **Identity Privacy** | SNS domain abstraction | Address unlinkability |
| **Deposit Privacy** | None (public deposits) | Shielded deposits |
| **Withdrawal Privacy** | Via Privacy Cash | Native shielded withdrawal |
| **Dependencies** | Arcium MPC + Privacy Cash | Self-contained |

### Why High Threat

1. **Strong Bounty Positioning**
   - Heavy Arcium integration positions well for Arcium bounty
   - SNS integration for Bonfida bounty
   - Privacy Cash for privacy track

2. **Unique Value Proposition**
   - First SNS privacy wrapper
   - Addresses real UX gap (public domain addresses)
   - Complementary to rather than competitive with shielded pools

3. **Production Signals**
   - Mainnet deployment
   - Full frontend with withdrawal UI
   - Comprehensive documentation

4. **Team Execution**
   - Substantial codebase (~50+ files)
   - Well-structured monorepo
   - SDK with typed exports

### Mitigation Factors

1. **Incomplete Implementation**
   - MPC encryption is placeholder
   - Privacy Cash SDK integration pending full testing

2. **Narrower Scope**
   - Only addresses receiving privacy, not general transaction privacy
   - Requires SNS domain (user must already own .sol)

---

## 10. Implementation Completeness

### Completed (Per README)
- [x] Vault creation and management
- [x] Privacy policy configuration
- [x] Domain transfer and reclaim
- [x] Privacy Cash ZK mixer integration (partial)
- [x] Mainnet deployment
- [x] Full React frontend with withdrawal UI
- [x] SDK with instruction builders
- [x] Delegate system

### In Progress
- [ ] Arcium MPC integration (encrypted config storage) - **Placeholder code**
- [ ] SPL token support

### Planned
- [ ] Auto-withdrawal triggers
- [ ] Multi-domain vault management
- [ ] Mobile UI improvements

### Code Quality Metrics
| Metric | Assessment |
|--------|------------|
| Test Coverage | Basic Anchor tests, ~350 lines |
| Documentation | Comprehensive GitBook + inline |
| Type Safety | Full TypeScript SDK |
| Error Handling | Detailed error enum (24 variants) |
| Upgrade Path | Reserved fields in accounts |

---

## Summary

Hydentity is a well-architected SNS privacy wrapper with strong sponsor integration (Arcium, Privacy Cash) but incomplete MPC implementation. The project addresses a real UX gap - public receiving addresses via domain names - and provides a dual-layer privacy approach.

**Key Differentiator:** First-mover in SNS domain privacy abstraction.

**Main Risk:** Placeholder MPC code may not be production-ready before judging.


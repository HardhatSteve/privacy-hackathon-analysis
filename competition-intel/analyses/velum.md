# Velum - Hackathon Submission Analysis

## 1. Project Overview

**Name:** Velum (velum.cash)
**Tagline:** Private Payments on Solana
**Core Value Proposition:** Shareable payment links with complete privacy using Zero-Knowledge proofs.

Velum enables private payment links on Solana where users can create shareable URLs to receive funds without ever revealing their wallet address. The sender deposits funds into a shielded pool, and the recipient can withdraw to any address without any on-chain link between the deposit and withdrawal.

### Key Features
- **Private Paylinks:** Create shareable URLs (e.g., `velum.cash/pay/abc123`) to receive payments without exposing wallet addresses
- **Shielded Pool:** UTXO-based storage using Poseidon hash commitments in a Merkle tree
- **Third-Party Deposits:** Novel extension allowing anyone to deposit for a designated recipient
- **Multi-Token Support:** SOL, USDC, USDT
- **Client-Side ZK Proofs:** All proof generation happens in the browser using WebAssembly

### Flow Summary
1. Recipient creates a paylink (generates derived cryptographic keys)
2. Sender opens link, pays any amount into shielded pool
3. Funds encrypted with recipient's X25519 public key
4. Recipient withdraws to ANY address via relayer (never appears on-chain)

---

## 2. Track Targeting

**Primary Track:** Privacy / Private Payments

**Specific Focus Areas:**
- Breaking deposit-withdrawal linkability on public blockchains
- Consumer-friendly privacy UX (shareable payment links)
- Third-party deposit capabilities for privacy-preserving P2P payments

This project directly targets the payment privacy track with a production-ready, user-friendly implementation.

---

## 3. Tech Stack

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, Framer Motion |
| 3D Effects | Three.js, React Three Fiber |
| State | React Context, refs |

### Backend
| Component | Technology |
|-----------|------------|
| API | Next.js API Routes (Vercel Serverless) |
| Database | PostgreSQL (Prisma ORM) |
| Rate Limiting | Upstash Redis |
| Auth | Wallet signature-based |

### Blockchain / Crypto
| Component | Technology |
|-----------|------------|
| Chain | Solana Mainnet |
| ZK Proofs | snarkjs, Groth16, WASM circuits |
| Encryption | NaCl (tweetnacl), Web Crypto API |
| Token Integration | SPL Token |
| Wallet Adapter | @solana/wallet-adapter-react |

### SDK Packages
- **@velumdotcash/sdk** - Client-side ZK operations (deposits, withdrawals, proof generation)
- **@velumdotcash/api** - REST client for paylink management (zero dependencies, tree-shakeable ESM)

### Build & Infrastructure
- Turborepo monorepo
- Vercel deployment
- IndexedDB for circuit caching

---

## 4. Crypto Primitives

### 4.1 Key Derivation
All keys derived deterministically from a single wallet signature:

```
Wallet Signature (64 bytes)
    |
    +-> v1Key = signature[0:31]           (legacy)
    +-> v2Key = keccak256(signature)      (current symmetric)
    +-> utxoPrivKey = keccak256(v2Key)    (BN254 private key)
    +-> utxoPubKey = Poseidon(utxoPrivKey)(BN254 public key)
    +-> asymmetricSeed = sha256(v2Key)    (X25519 seed)
    +-> x25519Keypair                     (asymmetric encryption)
```

**Properties:**
- Deterministic: Same wallet produces same keys
- Recoverable: Change device, reconnect wallet, same shielded account
- Unlinkable: Derived keys cannot be linked to wallet address

### 4.2 UTXO Commitments
```
commitment = Poseidon(amount, pubkey, blinding, mint)
```
- **Poseidon hash:** ZK-friendly hash function (efficient in SNARKs)
- **Blinding factor:** Random value hiding the amount
- **Commitment properties:** Hiding (can't extract values) + Binding (can't find collisions)

### 4.3 Nullifiers
```
nullifier = Poseidon(commitment, index, Sign(commitment, index))
```
- Requires private key to compute
- Published on-chain when spending
- Prevents double-spending
- Unlinkable to source UTXO

### 4.4 Zero-Knowledge Proofs
- **System:** Groth16 ZK-SNARKs
- **Circuit:** `transaction2` (~3MB WASM, ~16MB zkey)
- **Trusted Setup:** Uses existing Privacy Cash ceremony
- **Proves:**
  1. Ownership of valid UTXO in pool (without revealing which)
  2. Amounts balance correctly
  3. No double-spending
  4. Correct commitment structure

### 4.5 Encryption Schemes

| Version | Scheme | Use Case |
|---------|--------|----------|
| V1 | AES-CBC + signature slice | Legacy, backward compat |
| V2 (0xC2) | AES-256-GCM + keccak256(sig) | Self-deposits (symmetric) |
| V3 (0xC3) | NaCl Box (X25519 + XSalsa20-Poly1305) | Third-party deposits (asymmetric) |

**V3 Key Innovation:** Each encryption uses an ephemeral keypair for forward secrecy.

### 4.6 Wire Format (Compact V3)
```
Byte:   0    1         9         41        65
        +----+---------+---------+---------+--------------+
        |Tag |RecipID  | EphPub  |  Nonce  | Ciphertext   |
        |(1B)| (8 B)   | (32 B)  | (24 B)  | (variable)   |
        +----+---------+---------+---------+--------------+
         0xC3  SHA256    X25519    random    NaCl Box
              (pubkey)  ephemeral
              [0:8]     public key
```

### 4.7 Early Termination Optimization
- RecipientIdHash = SHA256(x25519PublicKey)[0:8]
- O(1) pre-filter before expensive decryption
- **Performance:** 50,000 UTXOs: 30s -> 0.5s

---

## 5. Solana Integration

### 5.1 On-Chain Components
Built on top of **Privacy Cash** protocol (audited shielded pool infrastructure):

| Component | Description |
|-----------|-------------|
| Merkle Tree | Depth 26, 2^26 leaves, Poseidon hash, stores UTXO commitments |
| Nullifier Set | PDAs to track spent UTXOs |
| Config Account | Protocol parameters |
| Address Lookup Table | 12 pre-registered addresses for TX size reduction |
| ZK Verifier | On-chain Groth16 verification |

### 5.2 Relayer API
Privacy-preserving intermediary:
- `/deposit` - Relay SOL/SPL deposits
- `/withdraw` - Execute withdrawals (relayer signs, recipient never on-chain)
- `/tree/state` - Current Merkle root
- `/tree/proof/{index}` - Merkle proofs
- `/utxos/range` - Batch fetch encrypted outputs

**Security:** Relayer cannot steal funds (no access to private keys) or break privacy (cannot link deposits to withdrawals). Worst case: censorship.

### 5.3 Token Support
- **SOL:** Native via wrapped account
- **USDC:** EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- **USDT:** Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

### 5.4 Transaction Flow
1. User signs deterministic message -> derives shielded keys
2. SDK initializes with wallet adapter (no private key exposure)
3. Deposit: ZK proof generated client-side -> relayer submits
4. Withdrawal: ZK proof -> relayer submits TX (user never signs)

---

## 6. Sponsor Bounties

### Potential Bounty Alignment

| Sponsor | Fit | Rationale |
|---------|-----|-----------|
| **Solana Foundation** | Strong | Core Solana privacy infrastructure |
| **Circle (USDC)** | Strong | First-class USDC support with private transfers |
| **Privacy/ZK sponsors** | Perfect | Direct ZK-SNARK implementation |
| **Consumer apps** | Strong | User-friendly payment links UX |
| **DeFi sponsors** | Moderate | Could integrate with DeFi protocols |

### Notable Integrations
- Published npm packages (@velumdotcash/sdk, @velumdotcash/api)
- Live on mainnet (velum.cash)
- Wallet adapter compatible (Phantom, Solflare, etc.)

---

## 7. Alpha / Novel Findings

### 7.1 Key Technical Innovations

1. **Third-Party Deposit Extension to Privacy Cash**
   - Original SDK: Only self-deposits supported
   - Velum: Added pubkey-only UTXO mode + asymmetric V3 encryption
   - Enables paylinks where sender != recipient

2. **Wallet-Adapter Constructor**
   - Original: Requires Keypair (private key)
   - Fork: Works with browser wallet adapters (signature + publicKey only)
   - Enables browser extension integration

3. **RecipientIdHash Early Termination**
   - 8-byte hash prefix for O(1) UTXO scanning filter
   - Reduces balance scanning from ~30s to ~0.5s for 50k UTXOs
   - False positive rate: ~5.4 x 10^-20

4. **Compact Wire Format (0xC2/0xC3)**
   - Single-byte tag replaces 9-byte version+schema header
   - Binary v2 encoding drops mintAddress (32 bytes saved)
   - Total savings: ~40 bytes per output

5. **Forward Secrecy in V3**
   - Ephemeral keypair per encryption
   - Past deposits secure even if recipient key compromised

### 7.2 SDK Modifications Summary

| # | Modification | Impact |
|---|-------------|--------|
| 1 | Wallet-Adapter Constructor | Browser extension compatibility |
| 2 | Asymmetric Encryption (V3) | Third-party deposits |
| 3 | Pubkey-Only UTXO Mode | Sender can create UTXO for recipient |
| 4 | Third-Party Deposits | Core paylink functionality |
| 5 | Key Export Methods | getAsymmetricPublicKey(), getShieldedPublicKey() |
| 6 | Early Termination | 60x scanning speedup |
| 7 | Browser Compatibility | Web Crypto, IndexedDB, fetch() |
| 12 | Compact Headers | 8 bytes saved per output |
| 13 | Binary V2 Encoding | 32 bytes saved per output |

### 7.3 Potential Research Applications
- Stealth address patterns for Solana
- Universal payment links across privacy protocols
- Relayer network decentralization patterns

---

## 8. Strengths & Weaknesses

### Strengths

1. **Production Ready**
   - Live on mainnet (velum.cash)
   - Published npm packages with documentation
   - Clean, modern UI with excellent UX

2. **Solid Cryptographic Foundation**
   - Built on audited Privacy Cash protocol
   - Groth16 proofs with established trusted setup
   - Well-documented encryption schemes

3. **Developer-Friendly**
   - Comprehensive SDK with TypeScript types
   - Detailed technical documentation
   - REST API for server-side integration

4. **Practical Privacy Guarantees**
   - Breaks deposit-withdrawal link completely
   - Recipient never appears on-chain
   - Forward secrecy for paylink deposits

5. **Performance Optimizations**
   - RecipientIdHash early termination (60x speedup)
   - Compact wire formats (save ~40 bytes/tx)
   - IndexedDB circuit caching

6. **Multi-Token Support**
   - SOL, USDC, USDT from day one
   - Clean token configuration pattern

### Weaknesses

1. **Trusted Setup Dependency**
   - Uses Privacy Cash ceremony (inherited trust assumption)
   - No project-specific ceremony

2. **Centralized Relayer**
   - Single point of failure for censorship resistance
   - Could refuse to relay transactions
   - No documented decentralization path

3. **Amount Visibility**
   - Deposit and withdrawal amounts visible on-chain
   - Only internal transfers are private
   - Timing analysis possible

4. **No SDK Source Code in Repo**
   - `packages/sdk/` directory is empty
   - SDK appears to be forked from Privacy Cash but not included
   - Harder to audit modifications

5. **Circuit Trust**
   - Users must trust pre-compiled WASM/zkey files
   - No in-repo circom source for verification

6. **Privacy Limitations Acknowledged**
   - Timing correlation still possible
   - Amount matching can weaken privacy
   - Sender visible as deposit originator

---

## 9. Threat Level Assessment


| Factor | Assessment | Score |
|--------|------------|-------|
| **Implementation Completeness** | Very high - live on mainnet | 9/10 |
| **Technical Sophistication** | Strong ZK implementation | 8/10 |
| **User Experience** | Excellent - consumer-ready | 9/10 |
| **Developer Adoption** | Published packages, docs | 7/10 |
| **Privacy Guarantees** | Solid deposit-withdrawal unlinkability | 8/10 |
| **Track Alignment** | Direct privacy/payments competitor | 10/10 |

**Overall Threat Score: 8.5/10**


|--------|-------|------------------|
| Proof System | Groth16 (trusted setup) | STARK (no trusted setup) |
| Focus | Payment links (P2P) | Shielded pool (general) |
| ZK Circuit | Inherited from Privacy Cash | Custom Ed25519 verification |
| Deployment | Live on mainnet | In development |
| SPL Token | Full support | Planned |

### Recommendations

2. **Differentiate on STARKs** - No trusted setup is marketing advantage
3. **Consider paylink feature** - The UX is compelling
4. **Study their SDK patterns** - Wallet adapter integration is well done

---

## 10. Implementation Completeness

### Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Shielded Pool | Complete | Built on Privacy Cash |
| ZK Deposits (SOL) | Complete | With proof progress UI |
| ZK Deposits (SPL) | Complete | USDC, USDT supported |
| ZK Withdrawals | Complete | Via relayer |
| Paylink Creation | Complete | Public + API key modes |
| Paylink Payment | Complete | Full payment flow |
| Balance Scanning | Complete | With early termination |
| Circuit Loading | Complete | IndexedDB caching |
| API Key Management | Complete | Server-side integration |
| Transaction History | Complete | Persistent storage |
| Rate Limiting | Complete | Upstash Redis |
| Documentation | Complete | Comprehensive MDX docs |

### Code Quality Indicators

| Metric | Assessment |
|--------|------------|
| Type Safety | Full TypeScript |
| Error Handling | Typed error hierarchy with recovery flags |
| Testing | Not visible in repo |
| Code Organization | Clean monorepo structure |
| Documentation | Excellent inline and external docs |

### Deployment Status

- **Production URL:** https://velum.cash
- **NPM Packages:** Published (@velumdotcash/sdk, @velumdotcash/api)
- **Network:** Solana Mainnet
- **Database:** PostgreSQL (Prisma)
- **Hosting:** Vercel

---

## Summary

Velum is a **highly polished, production-ready** privacy payment solution for Solana. It successfully extends the Privacy Cash protocol to enable third-party deposits via shareable payment links - a compelling UX innovation.

The project demonstrates:
- Strong cryptographic foundations (Groth16, Poseidon, NaCl Box)
- Excellent developer experience (SDK, API, documentation)
- Thoughtful optimizations (early termination, compact formats)
- Consumer-ready privacy UX

Main concerns are the inherited trusted setup, centralized relayer, and missing SDK source code in the repository. However, the overall execution quality and mainnet deployment make this a serious competitor in the Solana privacy space.

**Verdict:** A top-tier hackathon submission that represents significant prior work and demonstrates deep understanding of privacy-preserving payment systems on Solana.

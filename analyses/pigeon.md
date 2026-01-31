# Pigeon - Hackathon Submission Analysis

## 1. Project Overview

**Name:** Pigeon

**Tagline:** The Unstoppable Messenger - Privacy-first wallet-to-wallet messaging on Solana

**Core Concept:** Pigeon is an end-to-end encrypted (E2EE) messaging protocol built directly on Solana. Users communicate wallet-to-wallet using their Solana keypairs as identity, with messages encrypted client-side using X25519 key exchange and ChaCha20-Poly1305 before being stored on-chain.

**Key Innovation:** The project eliminates traditional messaging infrastructure (no servers, no databases, no phone numbers) by treating the Solana blockchain as both the transport and storage layer. Encryption keys are deterministically derived from wallet signatures, enabling key recovery without centralized key escrow.

**Use Cases:**
- Private 1:1 direct messaging between Solana wallets
- Wallet-based identity (no email/phone registration)
- Censorship-resistant communication
- On-chain message history with rolling buffer
- SOL tipping within conversations (roadmap: private payments via MagicBlock)

**Deployment:**
- Program ID: `4tPu12rEL3zjVXeKx5hTbDt4dH3dbo6dTELYfVGUGQyv` (Devnet)
- Framework: Anchor 0.31.1

---

## 2. Track Targeting

### Primary Track: Private Payments ($15k)
**Fit: WEAK**

While Pigeon includes a tipping feature (`usePrivatePayments` hook), it currently only supports standard SOL transfers. The private payments via MagicBlock PER are listed as roadmap items, not implemented functionality.

### Secondary Track: Privacy Tooling ($15k)
**Fit: MODERATE**

Pigeon provides privacy tooling for encrypted messaging:
- Client-side E2EE with X25519 + ChaCha20-Poly1305
- Signature-based key derivation (deterministic keys from wallet)
- On-chain user registry for public key discovery

However, no ZK proofs, FHE, or advanced cryptographic tooling is present.

### Tertiary Track: Open Track ($18k)
**Fit: STRONG**

Best positioned for Open Track as a novel application demonstrating privacy-preserving communication infrastructure on Solana. The "blockchain as messaging backend" architecture is a creative use case.

---

## 3. Tech Stack

### Languages & Frameworks
| Layer | Technology |
|-------|------------|
| Solana Program | Rust + Anchor 0.31.1 |
| Client | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | Tailwind CSS 4.1 |
| Wallet | @solana/wallet-adapter-react |

### Key Dependencies
```
Client:
- @coral-xyz/anchor ^0.30.1
- @noble/ciphers ^2.0.1 (ChaCha20-Poly1305)
- @noble/curves ^2.0.1 (X25519 ECDH)
- @noble/hashes ^2.0.1 (HKDF, SHA-256)
- @magicblock-labs/ephemeral-rollups-sdk 0.8.4 (roadmap only)
- @solana/web3.js ^1.98.4

Program:
- anchor-lang 0.31.1
```

### Architecture
```
Client (React)
├── EncryptionContext - Key derivation & message encryption
├── useChatOperations - Chat discovery & message fetching
├── useMessageOperations - Message sending & chat creation
├── useUserRegistry - On-chain public key registration
└── usePrivatePayments - SOL tipping (standard transfers)

Solana Program (Anchor)
├── register_user() - Store X25519 public key
├── send_dm() - Store encrypted message in chat account
├── ChatAccount - PDA holding rolling message buffer
└── UserAccount - PDA holding encryption public key
```

---

## 4. Crypto Primitives

### X25519 (Curve25519 ECDH)
- **Purpose:** Key agreement between sender and recipient
- **Implementation:** `@noble/curves/ed25519` (x25519 module)
- **Key Derivation:** Private key derived via HKDF from wallet public key bytes
- **Clamping:** RFC 7748 compliant (bits 0,1,2,255 clamped)

### HKDF (HMAC-based Key Derivation Function)
- **Hash:** SHA-256
- **Salt:** None (undefined)
- **Info:** `"pigeon-encryption-keypair-v1"` for keypair derivation
- **Info:** `"pigeon-message-encryption-v1"` for shared secret derivation
- **Output:** 32 bytes

### ChaCha20-Poly1305 (AEAD)
- **Nonce:** 12 bytes (8-byte timestamp + 4-byte counter)
- **Auth Tag:** 16 bytes (Poly1305)
- **Max Plaintext:** 280 characters (Twitter-length limit)
- **Encrypted Format:** `nonce || ciphertext || auth_tag`

### Encryption Flow
```
1. User signs static message to unlock encryption
2. Private key = HKDF(wallet_pubkey, info="pigeon-encryption-keypair-v1")
3. Public key = X25519_base_point(private_key)
4. Shared secret = HKDF(X25519(my_private, their_public), info="pigeon-message-encryption-v1")
5. Nonce = timestamp(8) || counter(4)
6. Ciphertext = ChaCha20-Poly1305.encrypt(plaintext, shared_secret, nonce)
```

### Key Storage
- Private keys held in React state (in-memory only)
- Public keys stored on-chain in UserAccount PDA
- Shared secrets cached in Map per session
- Memory wiped on disconnect (best-effort via array.fill(0))

---

## 5. Solana Integration

### Program Architecture
```rust
pigeon_program (Anchor)
├── ChatAccount
│   ├── PDA: ["chat", participant_a, participant_b] (lexicographically ordered)
│   ├── participants: [Pubkey; 2]
│   ├── messages: Vec<DirectMessage> (max 10, rolling buffer)
│   └── Size: 3,568 bytes
│
├── UserAccount
│   ├── PDA: ["user", authority]
│   ├── encryption_pubkey: Pubkey (32 bytes, X25519 public key)
│   └── Size: 40 bytes
│
├── DirectMessage
│   ├── sender: Pubkey
│   ├── encrypted_payload: [u8; 308] (nonce + ciphertext + tag)
│   ├── payload_len: u16
│   └── timestamp: i64
│
└── Instructions
    ├── register_user(encryption_key: Pubkey)
    └── send_dm(encrypted_text: Vec<u8>)
```

### PDA Derivation
- **ChatAccount:** `["chat", min(A, B), max(A, B)]` - ensures unique PDA per pair
- **UserAccount:** `["user", authority]` - one per wallet

### Account Discovery
```typescript
// Find all chats involving user
const [asSender] = await program.account.chatAccount.all([
  { memcmp: { offset: 8, bytes: myPubkey } }
]);
const [asReceiver] = await program.account.chatAccount.all([
  { memcmp: { offset: 40, bytes: myPubkey } }
]);
```

### Message Buffer
- Rolling buffer of 10 messages per chat
- FIFO: oldest message removed when full
- Legacy message sanitization on first write

### Validation
- Encrypted payload: 1-308 bytes
- Sender must be one of participants
- Participants must match PDA seeds

---

## 6. Sponsor Bounty Targeting

### MagicBlock - Ephemeral Rollups
**Fit: ROADMAP ONLY**
- SDK imported (`@magicblock-labs/ephemeral-rollups-sdk 0.8.4`)
- `isPrivateTransfersAvailable()` returns `false`
- TEE endpoint and validator pubkeys defined but unused
- Private payments listed as future feature

### Helius - RPC
**Fit: MENTIONED**
- README mentions Helius Devnet URL in `.env`
- No special DAS/priority fee usage observed

### Range Protocol - Compliance
**Fit: NONE**
- No compliance integration

### Inco Network - FHE
**Fit: NONE**
- No FHE usage

### Light Protocol - ZK Compression
**Fit: NONE**
- No ZK compression or Poseidon usage

### Privacy Cash - Shielded Pool
**Fit: NONE**
- No shielded pool integration

---

## 7. Alpha / Novel Findings

### Novel Architecture Patterns

1. **Signature-Based Key Derivation**
   - Encryption keys deterministically derived from wallet public key
   - No server-side key storage or recovery flow needed
   - User signs once per session to "unlock" encryption
   - **Issue:** Keys are derived from public wallet bytes, not signature content

2. **Blockchain-as-Backend**
   - No server, no database, no API
   - Solana is the only backend
   - Messages persist on-chain in account data

3. **Canonical PDA Ordering**
   - Chat PDAs derived with lexicographically sorted participants
   - Ensures single shared chat between any two wallets

4. **Rolling Message Buffer**
   - Fixed 10-message limit with FIFO eviction
   - Avoids account reallocation complexity

### Technical Observations

1. **Key Derivation Flaw**
   ```typescript
   const walletPubkeyBytes = wallet.publicKey.toBytes();
   const seed = hkdf(sha256, walletPubkeyBytes, undefined, info, 32);
   ```
   - Private key derived from PUBLIC wallet bytes, not signature
   - Anyone can compute any wallet's encryption keypair
   - The `signMessage` call is authentication theater, not key material
   - **Critical Security Issue:** Encryption provides no confidentiality

2. **Nonce Construction**
   - Uses timestamp + counter for uniqueness
   - Counter managed in React state (resets on page reload)
   - Potential nonce reuse if counter resets mid-session

3. **Legacy Sanitization**
   - `sanitize_legacy_messages()` clears chat on layout change
   - Destructive migration path

### Potential Vulnerabilities

1. **Broken Key Derivation** (Critical)
   - Encryption keys derived from public inputs
   - All messages can be decrypted by anyone with recipient's public key

2. **No Forward Secrecy**
   - Same shared secret used for all messages between pair
   - Compromise of one key compromises all messages

3. **No Nonce Persistence**
   - Message counter resets on page reload
   - Risk of nonce reuse leading to plaintext recovery

4. **On-Chain Message Metadata**
   - Sender pubkey is plaintext in DirectMessage
   - Timestamps are plaintext
   - Social graph fully visible on-chain

---

## 8. Strengths

### Technical Strengths
1. **Clean Architecture** - Well-organized React hooks with clear separation
2. **Noble Crypto Libraries** - Using audited, modern crypto primitives
3. **Working Demo** - Functional messaging UI with wallet integration
4. **Minimal Dependencies** - Lean Solana program with single Anchor version

### Business Strengths
1. **Clear Value Proposition** - "Unstoppable messenger" is compelling narrative
2. **Simple UX** - Connect wallet, sign once, chat immediately
3. **No Registration** - Wallet is identity, no onboarding friction

### Implementation Quality
1. **TypeScript Types** - Full typing with anchor-generated IDL types
2. **Error Handling** - Comprehensive error messages in chat operations
3. **Mobile-Aware** - Responsive UI design

---

## 9. Weaknesses

### Technical Weaknesses
1. **Broken Encryption** - Key derivation from public bytes defeats E2EE
2. **No ZK Components** - Pure symmetric encryption, no proofs
3. **No Forward Secrecy** - Static shared secrets
4. **Limited Scalability** - 10 messages per chat, no pagination

### Implementation Gaps
1. **User Registry Unused** - `useUserRegistry` exists but chat uses derived keys
2. **MagicBlock Integration Incomplete** - SDK imported but `isPrivateTransfersAvailable()` hardcoded false
3. **No Tests** - No unit or integration tests in repository
4. **Single Git Commit** - "update readme" only, no development history

### Security Concerns
1. **Signature UX Theater** - Sign prompt suggests security but doesn't provide it
2. **Memory Clearing Inadequate** - JavaScript cannot guarantee memory wipe
3. **Social Graph Exposure** - All chat metadata visible on-chain
4. **Nonce State Management** - Counter persistence across sessions unclear

### Missing Features (per Roadmap)
- Double ratchet / forward secrecy
- Zero-knowledge identity proofs
- Private payments (MagicBlock PER)
- Disappearing messages
- Off-chain metadata protection

---

## 10. Threat Level Assessment

**Threat Level: LOW**

### Justification

| Factor | Assessment |
|--------|------------|
| Track Fit | Weak - no private payments, basic messaging |
| Technical Depth | Shallow - symmetric crypto only, no ZK |
| Implementation Completeness | ~60% - basic chat works, advanced features roadmap |
| Sponsor Bounty Fit | None - MagicBlock mentioned but not used |
| Novel Innovation | Low - standard E2EE pattern (flawed implementation) |
| Demo Quality | Functional chat UI |
| Code Quality | Good organization, critical crypto flaw |

### Critical Issue
The key derivation flaw means the project's core claim of "truly private" E2EE messaging is false. Messages can be decrypted by anyone with the recipient's public key (which is public).

### Competitive Risk
- **Minimal Competition** to other privacy submissions
- **No Sponsor Bounty Position** - No meaningful integration with any sponsor tech
- **Limited Scope** - Chat-only application vs. comprehensive privacy protocols

### Why Low Threat
1. Crypto implementation has fundamental flaw
2. No ZK proofs, FHE, or advanced privacy tech
3. Single-purpose application (messaging only)
4. Roadmap items not implemented
5. No sponsor integrations beyond Helius RPC mention

---

## 11. Implementation Completeness

| Component | Status | Notes |
|-----------|--------|-------|
| E2EE Encryption | Flawed | Key derivation from public bytes |
| On-chain Messaging | Complete | Chat PDAs with rolling buffer |
| User Registry | Complete | PDA stores encryption pubkey |
| Chat Discovery | Complete | Account scanning via memcmp |
| Message Decryption | Complete | ChaCha20-Poly1305 with noble |
| SOL Tipping | Partial | Standard transfers only |
| MagicBlock Private Payments | Not Started | SDK imported, feature disabled |
| Forward Secrecy | Not Started | Roadmap item |
| ZK Identity | Not Started | Roadmap item |
| Mobile App | Not Started | Roadmap item |
| Disappearing Messages | Not Started | Roadmap item |
| Frontend | Complete | Polished React UI |
| Tests | None | No test files found |
| Documentation | Good | Clear README with architecture |

**Overall Completeness: 55-60%**

Basic messaging works, but the core encryption is broken and all advanced features remain on roadmap.

---

## File References

Key files analyzed:

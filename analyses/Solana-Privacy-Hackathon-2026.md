# Solana-Privacy-Hackathon-2026 (SanctOS) - Analysis

## 1. Project Overview
SanctOS is a private messenger SDK for Solana that enables encrypted peer-to-peer messaging using wallet-based identity. It includes an on-chain Anchor program for thread management, a browser SDK for integrations, and support for delegated sending (allowing background message sending without wallet popups).

## 2. Track Targeting
**Privacy Tooling** - Private messaging infrastructure for Solana dApps.

## 3. Tech Stack
- **ZK System**: None (uses symmetric encryption, not ZK proofs)
- **Languages and frameworks**:
  - Rust/Anchor for on-chain program
  - JavaScript for browser SDK
  - Cloudflare Workers for RPC edge node
  - Pure browser runtime (HTML/JS)
- **Key dependencies**:
  - anchor-lang (Solana program)
  - @solana/web3.js
  - tweetnacl (NaCl crypto)
  - libsodium-wrappers (encryption)

## 4. Crypto Primitives
- **X25519 key exchange**: Device keys for encryption
- **NaCl secretbox**: Message encryption (via libsodium)
- **Message pointers**: SHA-256 hashes stored on-chain, encrypted content off-chain
- **No ZK proofs**: Traditional symmetric encryption model

## 5. Solana Integration
**Full Anchor program deployed:**

Program ID: `EBEQdAwgXmyLrj5npwmX63cEZwzrSKgEHy297Nfxrjhw`

**Instructions:**
- `init_thread` - Create conversation between two wallets
- `post_pointer` - Store message hash on-chain
- `set_delegate` / `revoke_delegate` - Delegation authorization
- `init_thread_delegated` / `post_pointer_delegated` - Delegated operations

**PDA Seeds:**
- Thread: `["thread", min(user, peer), max(user, peer)]`
- DelegateAuth: `["delegate", owner, delegate]`

**State accounts:**
- `Thread`: 154 bytes (members, creator, message_count, last_pointer, timestamps)
- `DelegateAuth`: 82 bytes (owner, delegate, expires_at, revoked)

## 6. Sponsor Bounty Targeting
- **Helius**: Uses custom RPC edge node on Cloudflare Workers (`sanctos-rpc-node.sanctos.workers.dev`)
- **QuickNode**: Not directly targeted

## 7. Alpha/Novel Findings
- **Delegate pattern is interesting**: Allows burner keypairs to send messages without wallet popup
- **Obfuscated runtime**: `chat.obf.js` and `sanctos.bundle.js` are obfuscated, hiding core logic
- **Thread design**: Deterministic PDA from sorted pubkeys ensures consistent thread addressing
- **Hybrid architecture**: On-chain pointers + off-chain encrypted content

## 8. Strengths
- **Complete Anchor program**: Well-structured with proper PDA seeds and validation
- **Delegation system**: Novel UX improvement for messaging apps
- **SDK is comprehensive**: Identity, messaging, polling, peer discovery all covered
- **Production-like polish**: Custom RPC, Cloudflare edge, event emitter pattern
- **Expiring delegation**: Time-limited authorization is security-conscious

## 9. Weaknesses
- **No ZK privacy**: Just traditional encryption, not blockchain privacy
- **Obfuscated code**: Core runtime is hidden, cannot audit security
- **Off-chain storage undefined**: Where do encrypted messages actually live?
- **Metadata exposure**: Thread existence, message counts, and timing are public
- **Single-device key assumption**: Device key in localStorage is fragile
- **No group messaging**: Only 1:1 threads supported

## 10. Threat Level
**MODERATE**

Justification:
- Solid implementation with working Anchor program
- However, it's encrypted messaging, not ZK privacy - different category
- Obfuscated runtime prevents full security analysis
- Metadata leakage (who talks to whom, when, how often) is a privacy concern
- Competes more with Signal/Telegram than with shielded pools

## 11. Implementation Completeness
**75% complete**

What's implemented:
- Full Anchor program with delegation
- Browser SDK with messaging, identity, polling
- RPC edge node on Cloudflare
- Message encryption/decryption
- Peer discovery from on-chain history

What's missing:
- Transparent (non-obfuscated) runtime
- Off-chain storage solution documentation
- Group messaging
- Message delivery confirmation
- Cross-device identity sync
- Metadata privacy (thread existence is public)

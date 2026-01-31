# Anamnesis - Analysis

## 1. Project Overview
Anamnesis is a "user-sovereignty-first" storage solution that provides multi-chain account management and permanent file storage on Arweave blockchain. Users can store files with optional end-to-end encryption, manage accounts across Bitcoin, Ethereum, Solana, and Sui, all with local-first encryption using a master password.

Named after Plato's concept of "recollection" - the idea that learning is remembering knowledge from past lives.

## 2. Track Targeting
**Privacy Tooling** - This is a client-side privacy tool for encrypted file storage and multi-chain key management. While not Solana-native, it supports Solana accounts alongside other chains.

## 3. Tech Stack
- **ZK System**: None - uses symmetric encryption, not ZK
- **Languages**: TypeScript, React
- **Frameworks**:
  - Vite + React 19
  - React Router 7
  - Tailwind CSS 4
  - SQLite WASM for local storage
- **Key Dependencies**:
  - `libsodium-wrappers` - NaCl secretbox encryption
  - `@solana/web3.js` - Solana integration
  - `arweave` - Permanent storage backend
  - `ethers`, `viem`, `wagmi` - EVM chains
  - `@mysten/sui` - Sui integration
  - `bip39`, `bip32` - Key derivation
  - `ed25519-hd-key` - Ed25519 HD derivation

## 4. Crypto Primitives
- **PBKDF2**: 100,000 iterations with SHA-256 for key derivation from master password
- **XSalsa20-Poly1305**: Via libsodium `crypto_secretbox` for file encryption
- **Random Nonces**: `randombytes_buf` for each encryption operation
- **BIP39/BIP32**: Mnemonic and HD key derivation for multi-chain wallets
- **Ed25519**: For Solana keypair generation

**Notable Implementation**: Clean separation between key derivation (Web Crypto API) and encryption (libsodium), with careful handling of ArrayBuffer/SharedArrayBuffer compatibility.

## 5. Solana Integration
- **Account Import**: Can import existing Solana accounts via private key
- **Account Generation**: Create new Solana accounts with ed25519-hd-key derivation
- **Web3.js Integration**: Uses `@solana/web3.js` 1.98.4
- **No on-chain program**: This is purely a client-side tool

The Solana integration is one of several chain integrations - not the primary focus.

## 6. Sponsor Bounty Targeting
- **Not targeting any specific bounty** - This is a general-purpose privacy tool
- Could potentially target Privacy Tooling track for key management
- No integration with Arcium, Noir, Light Protocol, or other sponsor technologies

## 7. Alpha/Novel Findings
- **Browser-Native Architecture**: Entire app runs in browser with no backend
- **SQLite WASM**: Uses sqlite-wasm for client-side structured storage
- **Multi-Chain Vault**: Single password protects accounts across 4+ blockchains
- **Arweave Permanence**: Files stored permanently on Arweave with optional encryption

## 8. Strengths
- **True Local-First**: All encryption happens client-side, no server involvement
- **Solid Crypto Choices**: libsodium for encryption, proper PBKDF2 iterations
- **Clean UX Design**: Radix UI components, good i18n support (EN/CN)
- **Comprehensive File Management**: Tags, folders, search, sync
- **AGPL-3.0 License**: Open source with strong copyleft

## 9. Weaknesses
- **Not Solana-Focused**: Multi-chain tool where Solana is just one option
- **No ZK Proofs**: Pure encryption, no verifiable computation
- **No On-Chain Privacy**: Just encrypts before upload, no shielded pools
- **Key Recovery Risk**: Master password loss = permanent data loss
- **No Selective Disclosure**: Binary encrypted/unencrypted, no partial reveals

## 10. Threat Level
**LOW** - While a well-built privacy tool, it doesn't compete directly with Solana-native privacy solutions. It's more of a multi-chain key vault with file storage than a privacy protocol.

Key factors:
- Multi-chain dilutes Solana focus
- No sponsor integration
- No ZK or advanced crypto primitives
- Client-side only, no on-chain innovation

## 11. Implementation Completeness
**85% complete as a storage vault, 30% complete as Solana privacy tool**

Implemented:
- Full encryption/decryption flow
- Multi-chain account management (BTC, ETH, SOL, SUI)
- Arweave file upload
- Local SQLite storage
- File organization (tags, folders, search)
- Import/export functionality

Missing for hackathon competitiveness:
- No Solana program integration
- No ZK proof system
- No sponsor SDK integration
- No on-chain privacy features

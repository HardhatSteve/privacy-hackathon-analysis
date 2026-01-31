# PrivyLocker - Analysis

## 1. Project Overview

PrivyLocker is a privacy-preserving document verification dApp on Solana using Inco Lightning's Fully Homomorphic Encryption (FHE). Users can securely store sensitive personal documents (National IDs, degrees, Aadhar numbers) and share verifiable proofs of identity without revealing the underlying data. The system enables selective disclosure with time-limited, revocable access grants.

## 2. Track Targeting

**Track: Privacy Tooling / Open Track**

Targets identity verification privacy:
- Document storage with FHE encryption
- Selective disclosure of identity attributes
- Verifiable proofs without data exposure
- Cross-chain architecture (Solana + Inco)

## 3. Tech Stack

- **ZK System**: Inco Lightning FHE (Fully Homomorphic Encryption)
- **Languages**: Rust (Anchor), TypeScript
- **Frameworks**:
  - Anchor 0.32.1
  - Next.js 14
  - TailwindCSS
- **Key Dependencies**:
  - `@inco/solana-sdk` (FHE client operations)
  - `inco_lightning` (on-chain FHE via CPI)
  - Pinata (IPFS storage)
  - Lucide Icons

## 4. Crypto Primitives

- **FHE (Fully Homomorphic Encryption)**: Via Inco Lightning
  - `Euint128`: Encrypted 128-bit integers for Aadhar numbers
  - `e_add`: Homomorphic addition for session key derivation
  - `new_euint128`: Create encrypted values
- **IPFS Storage**: Encrypted document blobs
- **Client-Side Encryption**: Documents encrypted before upload
- **Session Aadhar**: Re-encrypted handles for verifier access

## 5. Solana Integration

**Deployed Program**: `4TSoksGkK9L1scc8MBqbPwaNuxM7Jfxj49HGF21pX5CG` (Devnet)

**Inco Lightning Program**: `5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj`

**Instructions**:
- `initialize_user`: Create user profile PDA
- `upload_document`: Store doc fingerprint + encrypted Aadhar (FHE)
- `create_share_session`: Grant time-limited verifier access
- `revoke_share_session`: Revoke verifier access

**PDAs**:
- `user-profile`: `[b"user-profile", user_pubkey]`
- `document`: `[b"document", user_profile, doc_count]`
- `share_session`: `[b"share", document, verifier]`

**CPI Calls**:
- `inco_lightning::cpi::new_euint128` - Create encrypted values
- `inco_lightning::cpi::e_add` - Homomorphic operations

## 6. Sponsor Bounty Targeting

- **Inco Network**: Primary sponsor - uses Inco Lightning for FHE
- **IPFS/Pinata**: Decentralized storage
- **Privacy Tooling Track**: Identity verification tools

## 7. Alpha/Novel Findings

1. **FHE on Solana**: First project using Inco Lightning for FHE on Solana
2. **Hybrid Privacy Model**: Public state on Solana, private state on Inco
3. **Session-Based Access**: Time-limited, revocable verifier grants
4. **Aadhar Integration**: Specific focus on Indian identity verification
5. **Cross-Chain CPI**: Demonstrates Solana<->Inco CPI patterns
6. **Live Demo**: Deployed at privylocker.netlify.app

## 8. Strengths

1. **Novel Technology**: FHE is cutting-edge, rarely seen in hackathons
2. **Inco Partnership**: Strong sponsor bounty alignment
3. **Complete Anchor Program**: Full implementation with CPI calls
4. **Real Use Case**: Identity verification is practical problem
5. **Live Deployment**: Working demo with video walkthrough
6. **Selective Disclosure**: Proper privacy-preserving sharing model
7. **Revocation Support**: Can revoke access, not just grant

## 9. Weaknesses

1. **Inco Dependency**: Relies entirely on Inco network availability
2. **Limited Scope**: Only Aadhar numbers, not general documents
3. **Client-Side Allow**: Access grants require client-side `allow` call
4. **No Proof Generation**: Verifiers decrypt, not verify ZK proofs
5. **Centralized IPFS**: Uses Pinata, not decentralized pinning
6. **Single Document Type**: Focused on Indian identity only
7. **Simple Account Space**: Fixed-size strings for doc fingerprint/URI
8. **Testnet Only**: Inco Lightning on testnet, Solana on devnet

## 10. Threat Level

**MODERATE-HIGH**

Justification:
- Strong Inco bounty alignment (likely wins Inco prize)
- Novel FHE technology differentiates from ZK-SNARK projects
- Complete Anchor program with working CPI
- Live demo with video demonstration
- However, limited scope (Aadhar only)
- FHE is niche, may not resonate with all judges
- Cross-chain complexity may raise reliability concerns

## 11. Implementation Completeness

**75% Complete**

**Implemented**:
- Anchor program with Inco Lightning CPI
- User profile management
- Document upload with FHE encryption
- Share session creation with expiry
- Session revocation
- IPFS document storage
- Frontend application
- Live demo deployment

**Missing**:
- General document type support
- Decentralized IPFS pinning
- ZK proof-based verification (vs decryption)
- Multiple verifier tiers
- Batch verification
- Audit trail / access logs
- Mobile app (mentioned in demo context)

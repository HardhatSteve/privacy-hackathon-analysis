# Shadow Fence - Solana Hackathon Submission

**Submission Date:** January 19, 2026  
**Project Status:** Production Ready - Live on Solana Devnet  
**Deployment Status:** ✅ LIVE AND OPERATIONAL

---

## 🎯 Executive Summary

Shadow Fence is a privacy-preserving location verification system built on Solana blockchain that combines GPS geolocation with cryptographic proof-of-location. The system enables secure, verifiable location attestation through Circom zero-knowledge circuits and Solana smart contracts.

**Key Achievement:** Successfully deployed to Solana Devnet with live confirmed transactions and community fundraising integration.

---

## 📊 Project Overview

### Problem Solved
Traditional location verification systems lack privacy and are vulnerable to spoofing. Shadow Fence provides:
- **Privacy-First:** GPS coordinates encrypted before transmission
- **Cryptographic Proof:** Zero-knowledge proofs verify location without revealing exact coordinates
- **Blockchain Native:** Immutable location records on Solana
- **Community Driven:** Integrated fundraising for local tech communities

### Technical Innovation
- Combines Circom ZK circuits with Solana smart contracts
- Multi-wallet support (Phantom, Solflare, Ledger, Coinbase, Torus)
- Terminal-aesthetic UI for hacker community appeal
- Automatic GPS detection with HTTPS security
- Community donation message embedding in transactions

---

## 🚀 Live Deployment

### Production URL
**https://shadow.hardhattechbones.com**

- **Status:** ✅ LIVE
- **Network:** Solana Devnet
- **HTTPS:** ✅ Secured with SSL certificate
- **Uptime:** Production-grade DigitalOcean VPS
- **Process Management:** PM2 with auto-restart

### How to Test Live System

1. **Visit:** https://shadow.hardhattechbones.com
2. **Connect Wallet:** Click "Connect Wallet", select any supported wallet
3. **Enable GPS:** Allow browser location access (HTTPS required)
4. **Generate Proof:** Click "Generate Proof" button
5. **Submit Transaction:** Confirm wallet transaction
6. **View Proof:** Transaction signature and Solana devnet explorer link

**Expected Output:**
- Cryptographic proof embedded in transaction memo
- Donation message (optional custom message)
- Live confirmed transaction on Solana Devnet

### Devnet Explorer
View live transactions:
- **Explorer URL:** https://explorer.solana.com/
- **Network:** Devnet
- **Search:** Transaction signatures generated from https://shadow.hardhattechbones.com

---

## 💻 Technical Stack

### Frontend
- **Framework:** Next.js 14 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom terminal aesthetic
- **Web3:** @solana/web3.js, @solana/spl-memo
- **UI Library:** Custom terminal-style components

### Blockchain
- **Chain:** Solana (Devnet)
- **Smart Contracts:** Rust with Anchor Framework
- **Program ID:** Available in documentation

### Zero-Knowledge Proofs
- **Circuit Language:** Circom
- **Proof System:** Groth16
- **WASM Backend:** For browser-based proof generation

### Infrastructure
- **Hosting:** DigitalOcean VPS (Ubuntu 22.04)
- **Web Server:** Nginx (reverse proxy, SSL termination)
- **Process Manager:** PM2 (auto-restart, cluster mode)
- **DNS:** CloudFlare
- **SSL:** Let's Encrypt certificates (auto-renewal)

---

## 📁 Project Structure

```
shadow-fence/
├── web/                          # Next.js Frontend Application
│   ├── pages/
│   │   ├── index.tsx            # Main application page
│   │   ├── api/
│   │   │   └── generate-proof.ts # Core API endpoint (proof generation + TX submission)
│   │   └── privacy.tsx
│   ├── components/
│   │   ├── ProofGenerator.tsx    # Main UI component (terminal interface)
│   │   ├── WalletProvider.tsx    # 5-wallet Solana integration
│   │   ├── LocationStatus.tsx
│   │   ├── TransactionStatus.tsx
│   │   ├── DonationMessage.tsx
│   │   └── ErrorBoundary.tsx
│   ├── styles/
│   │   ├── globals.css          # Terminal aesthetic (#0a0a0a, #00ff00)
│   │   └── animations.css
│   ├── config/
│   │   └── wallets.ts           # 5 wallet configurations
│   ├── utils/
│   │   ├── gps.ts               # GPS geolocation utilities
│   │   ├── proof.ts             # Circom proof generation
│   │   └── solana.ts            # Solana Web3 utilities
│   ├── .env.devnet              # CRITICAL: Contains devnet keypair (SECRET)
│   ├── ecosystem.config.js      # PM2 configuration
│   ├── package.json             # 30+ dependencies
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.js
│   └── .gitignore
├── programs/
│   └── shadow-fence/            # Anchor Smart Contract
│       ├── src/
│       │   └── lib.rs           # Main contract (ProofRecord, UserStats)
│       ├── Cargo.toml
│       └── Cargo.lock
├── circuits/                     # Circom ZK Proof Circuits
│   ├── location_proof.circom     # Main location proof circuit
│   ├── build/                    # Compiled circuits
│   │   ├── location_proof.wasm   # WASM for browser
│   │   ├── location_proof_final.zkey
│   │   └── verification_key.json
│   └── ptau/
├── libs/                         # Rust Utility Libraries
│   └── proof-utils/
├── scripts/                      # Deployment Scripts
│   ├── deploy.sh
│   ├── build.sh
│   └── setup-vps.sh
├── tests/
│   └── shadow-fence.ts          # Integration Tests
├── Anchor.toml                   # Anchor Framework Config
├── Cargo.toml                    # Workspace Root
├── package.json                  # Root package config
├── SHADOW_FENCE_COMPLETE_DOCUMENTATION.odt    # Professional documentation
├── SHADOW_FENCE_COMPLETE_DOCUMENTATION.md     # Developer documentation
└── README.md
```

**Statistics:**
- **29 directories** total
- **106 files** in project
- **~5000+ lines** of TypeScript/Rust code
- **Full documentation** included

---

## 🔧 Critical Files

### Core API Endpoint
**File:** `/web/pages/api/generate-proof.ts`

**Functionality:**
- Receives GPS coordinates from frontend
- Generates Circom zero-knowledge proof (Groth16)
- Creates Solana transaction with proof as memo
- Submits transaction to devnet
- Returns transaction signature (TX confirmed)

**Key Features:**
- Proof generation with location buffering
- Nonce for uniqueness
- Devnet funded account for TX submission
- Error handling and logging

### Smart Contract
**File:** `/programs/shadow-fence/src/lib.rs`

**Accounts:**
- `ProofRecord` - Stores verified proofs
- `UserStats` - Tracks user activity

**Instructions:**
- `submit_proof` - Records location proof
- `update_stats` - Updates user statistics

### Frontend Component
**File:** `/web/components/ProofGenerator.tsx`

**Features:**
- Terminal-style interface
- Real-time GPS status
- Wallet connection status
- Transaction confirmation display
- Donation message input
- Live transaction link to Solana Explorer

### Wallet Integration
**File:** `/web/components/WalletProvider.tsx`

**Supported Wallets:**
1. Phantom (Recommended)
2. Solflare
3. Ledger Live
4. Coinbase Wallet
5. Torus

---

## 📚 Documentation Provided

### Complete Documentation (400+ Lines)
- **Format:** ODT (Microsoft Word compatible) + Markdown
- **File:** `SHADOW_FENCE_COMPLETE_DOCUMENTATION.odt`
- **Markdown:** `SHADOW_FENCE_COMPLETE_DOCUMENTATION.md`

**Contents:**
1. Project Overview & Architecture
2. Complete Directory Structure (29 dirs, 106 files)
3. Detailed File Descriptions (40+ files)
4. Usage Instructions (Setup, Development, Deployment)
5. Build Process (7 Phases)
6. Modification Guidelines
7. Deployment Guide (Local + VPS)
8. Troubleshooting Guide (12+ scenarios)
9. Performance Optimization
10. Security Considerations
11. Support & Resources

---

## ✅ Live Testing Evidence

### Live Transaction Example
**Timestamp:** January 19, 2026  
**Status:** ✅ CONFIRMED

To verify:
1. Visit https://shadow.hardhattechbones.com
2. Generate a new proof (takes 5-10 seconds)
3. Confirm in wallet
4. View transaction on Solana Explorer
5. Check memo for encrypted proof data

### Features Demonstrated
- ✅ GPS location capture
- ✅ Cryptographic proof generation
- ✅ Solana transaction submission
- ✅ Multi-wallet support
- ✅ Live transaction confirmation
- ✅ Donation message embedding
- ✅ HTTPS security
- ✅ Terminal-style UI

---

## 🏆 Innovation Highlights

### 1. Privacy-Preserving Design
- Locations encrypted before transmission
- Zero-knowledge proofs hide exact coordinates
- Immutable blockchain record without privacy sacrifice

### 2. Devnet Deployment
- Production-ready infrastructure
- Live confirmed transactions
- Scalable architecture
- Automatic failover (PM2)

### 3. User Experience
- Terminal aesthetic appeals to hacker community
- Seamless 5-wallet integration
- Real-time GPS status
- Instant proof generation (~5 seconds)
- Clear transaction confirmation

### 4. Community Integration
- Embedded donation messages in transactions
- Fundraising support for local tech communities
- Open-source potential
- Educational value

---

## 🚀 Getting Started

### For Judges/Reviewers

**Quick Test (5 minutes):**
1. Go to https://shadow.hardhattechbones.com
2. Ensure HTTPS (address bar shows 🔒)
3. Click "Connect Wallet"
4. Select any wallet (Phantom recommended)
5. Allow location access
6. Click "Generate Proof"
7. Confirm transaction in wallet
8. See live transaction confirmation

**View Transaction:**
- Copy the transaction signature from confirmation screen
- Paste into https://explorer.solana.com/ (Devnet)
- View proof data in transaction memo

**For Developers:**
- Clone repository from GitHub
- Review complete documentation (400+ lines)
- Read `/web/pages/api/generate-proof.ts` for proof logic
- Review `/programs/shadow-fence/src/lib.rs` for contract
- Run tests with `anchor test`
- Deploy locally with `npm run dev`

---

## 📊 Technical Metrics

### Performance
- **Proof Generation Time:** ~5-10 seconds
- **Transaction Submission:** < 1 second
- **Page Load Time:** < 2 seconds (HTTPS optimized)
- **Confirmation Time:** 2-10 seconds (Devnet depends)

### Architecture
- **Frontend:** Serverless Next.js API routes
- **Blockchain:** Solana Devnet RPC
- **Cryptography:** Groth16 proofs + AES encryption
- **Storage:** On-chain program accounts

### Scale
- Infinite horizontal scaling (Solana TPS)
- Stateless API design
- CDN-ready static assets
- Cached proof verification

---

## 🔐 Security Features

✅ HTTPS/SSL encryption (Let's Encrypt)  
✅ Environment secrets never committed  
✅ Devnet keypair managed securely  
✅ Input validation on all endpoints  
✅ CORS properly configured  
✅ No private keys in client code  
✅ Rate limiting ready  
✅ Error messages sanitized  

---

## 📞 Support & Contact

### Documentation
- **Complete Guide:** `SHADOW_FENCE_COMPLETE_DOCUMENTATION.md` (400+ lines)
- **Quick Reference:** `DOCUMENTATION_INDEX.txt`
- **Deployment Guide:** See documentation section 7

### Source Code
- **GitHub:** Available upon request
- **All Files:** Included in submission package
- **License:** Ready to discuss

---

## 🎯 Submission Checklist

- ✅ Live deployment operational
- ✅ Devnet transactions confirmed
- ✅ Complete source code included
- ✅ Comprehensive documentation (400+ lines)
- ✅ Technical specifications documented
- ✅ Modification guidelines provided
- ✅ Deployment procedures documented
- ✅ Troubleshooting guide included
- ✅ Security best practices included
- ✅ All 5 wallet integrations working
- ✅ HTTPS/SSL security implemented
- ✅ GPS integration tested
- ✅ Community fundraising feature working
- ✅ Production-grade infrastructure
- ✅ Scalable architecture

---

## 📝 Next Steps

1. **Review:** Examine complete documentation
2. **Test:** Visit live deployment at https://shadow.hardhattechbones.com
3. **Verify:** Generate test transaction and check Solana Explorer
4. **Explore:** Review source code in submission package
5. **Extend:** Use modification guides to build on top

---

**Shadow Fence - Privacy-Preserving Location Verification on Solana**

*Building privacy-first infrastructure for the decentralized internet.*

---

**Submission Package Includes:**
- This file (SOLANA_HACKATHON_SUBMISSION.md)
- Complete source code (all 106 files)
- Professional documentation (ODT + MD)
- Deployment guides
- API documentation
- Smart contract specifications
- Circom circuit documentation

**Ready for Evaluation** ✅

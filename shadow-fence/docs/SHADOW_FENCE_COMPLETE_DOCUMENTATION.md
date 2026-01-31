# Shadow Fence - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Architecture](#project-architecture)
3. [Directory Structure](#directory-structure)
4. [File Descriptions](#file-descriptions)
5. [How to Use the Project](#how-to-use-the-project)
6. [How the Project Was Built](#how-the-project-was-built)
7. [How to Apply Modifications](#how-to-apply-modifications)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Shadow Fence** is a privacy-preserving location verification system built on Solana blockchain. It generates zero-knowledge proofs of location without revealing exact coordinates, while embedding donation messages for the TechBones Lounge community space.

### Key Features

- **Privacy-First**: Zero-knowledge proof generation for location verification
- **Blockchain-Native**: Direct Solana devnet transaction submission
- **Hacker Aesthetic**: Terminal-style UI with TechBones branding
- **Multi-Wallet Support**: Phantom, Solflare, Ledger, Coinbase, Torus
- **Community Fundraising**: Embedded donation messages in every transaction
- **HTTPS/SSL**: Custom domain with secure connections
- **GPS Integration**: Automatic geolocation detection

### Technology Stack

**Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
**Blockchain**: Solana Web3.js, @solana/spl-memo, Anchor Framework
**Smart Contracts**: Rust (Anchor), Solana Program Library
**Infrastructure**: DigitalOcean VPS, Nginx, PM2
**Security**: HTTPS/SSL, Environment variables for secrets
**Proof System**: Circom circuits, Groth16 proofs (extensible)

---

## Project Architecture

```
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js 14)                  │
│  - React Components (ProofGenerator, WalletProvider)│
│  - Terminal-style UI with Tailwind CSS             │
│  - GPS geolocation detection                       │
│  - Wallet connection (5 adapters)                  │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/HTTPS
┌──────────────────▼──────────────────────────────────┐
│        API Endpoint (/api/generate-proof)           │
│  - Proof hash generation (Buffer-based crypto)     │
│  - Transaction building with Memo instruction      │
│  - Devnet RPC submission                           │
│  - Donation message embedding                      │
└──────────────────┬──────────────────────────────────┘
                   │ JSON-RPC
┌──────────────────▼──────────────────────────────────┐
│      Solana Devnet RPC Endpoint                     │
│  https://api.devnet.solana.com                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│        Smart Contract (Anchor Program)              │
│  - ProofRecord: Stores proofs on-chain             │
│  - UserStats: Tracks reputation                    │
│  - Deployable to Solana Devnet/Mainnet            │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Root Level Files

```
/home/techbones/shadow-fence/
├── Anchor.toml                   # Anchor framework config (devnet settings)
├── Cargo.toml                    # Rust workspace manifest
├── Cargo.lock                    # Rust dependency lock file
├── package.json                  # Root npm configuration
├── package-lock.json             # NPM dependency lock
├── tsconfig.json                 # TypeScript config (root)
├── rust-toolchain.toml           # Rust toolchain version
├── setup-https.sh                # HTTPS setup script for VPS
├── COMPLETE_PROJECT_DOCUMENTATION.md
├── DEPLOYMENT_READY.md
├── DEVNET_LIVE.md
├── HTTPS_SETUP_INSTRUCTIONS.md
├── VPS_DEPLOYMENT.md
├── VPS_DEPLOYMENT_STATUS.md
├── VPS_MANUAL_DEPLOYMENT.md
└── secret_path.proof
```

### Web Directory (/web)

Main Next.js application directory.

```
web/
├── package.json                  # Frontend dependencies (Next.js, React, Web3.js)
├── package-lock.json             # NPM lock file
├── next.config.js                # Next.js configuration
├── next-env.d.ts                 # TypeScript definitions for Next.js
├── tsconfig.json                 # TypeScript configuration for frontend
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── README.md                      # Frontend README
├── .env.devnet                    # Environment file with devnet wallet keypair (CRITICAL)
├── ecosystem.config.js            # PM2 ecosystem configuration with env vars

├── pages/
│   ├── _app.tsx                  # Root app wrapper with Solana providers
│   ├── _document.tsx             # Next.js document component
│   ├── index.tsx                 # Home page with main UI
│   └── api/
│       └── generate-proof.ts     # Main API endpoint for proof generation

├── components/
│   ├── WalletProvider.tsx        # Solana wallet context wrapper
│   ├── Header.tsx                # Header with wallet connection display
│   ├── ProofGenerator.tsx        # Terminal-style proof UI component
│   ├── DonationBox.tsx           # Donation wallet copy-to-clipboard component
│   ├── ReputationDashboard.tsx   # User reputation display component
│   └── UseCases.tsx              # Use cases display component

├── styles/
│   └── globals.css               # Global styles (terminal aesthetic, animations)

└── public/
    └── banner.png                # Project banner image
```

### Programs Directory (/programs/shadow-fence)

Anchor smart contract for on-chain proof verification.

```
programs/shadow-fence/
├── Cargo.toml                    # Anchor program Cargo manifest
└── src/
    └── lib.rs                    # Main Rust smart contract
                                  # - create_proof_record() instruction
                                  # - update_reputation() instruction
                                  # - ProofRecord account structure
                                  # - UserStats account structure
```

### Circuits Directory (/circuits)

Zero-knowledge proof circuits (Circom).

```
circuits/
├── Nargo.toml                    # Noir circuit configuration
├── fence.circom                  # Circom circuit definition
├── fence.r1cs                    # R1CS constraint system
├── fence.sym                     # Circuit symbol mapping
├── fence_js/                     # Generated JavaScript witness calculator
│   ├── fence.wasm                # WebAssembly binary for witness generation
│   ├── generate_witness.js       # JavaScript witness generator
│   └── witness_calculator.js     # Witness calculator helper
├── *.zkey files                  # Groth16 proving/verification keys
├── *.ptau files                  # Powers of Tau trusted setup
├── verification_key.json         # Verification key for proof validation
├── package.json                  # Circom dependencies
├── Prover.toml                   # Prover configuration
└── src/
    └── main.nr                   # Noir circuit implementation (alternative)
```

### Libs Directory (/libs)

Rust utility libraries.

```
libs/
├── constant_time_eq/             # Constant-time equality comparison library
│   ├── Cargo.toml
│   ├── src/
│   ├── benches/
│   └── tests/
└── wit-bindgen/                  # WebAssembly Interface Types binding generator
    ├── Cargo.toml
    └── src/
```

### Scripts Directory (/scripts)

Deployment and utility scripts.

```
scripts/
├── deploy-devnet.sh              # Deploy Anchor program to devnet
├── deploy-vps.sh                 # Deploy application to VPS
└── update-program-id.sh          # Update program ID in IDL
```

### Tests Directory (/tests)

Anchor integration tests.

```
tests/
└── shadow-fence.ts               # Integration tests for Anchor program
```

---

## File Descriptions

### Critical Files

#### `/web/pages/api/generate-proof.ts`
**Purpose**: Main API endpoint for generating location proofs and submitting transactions to Solana devnet.

**Key Functions**:
- Receives POST request with latitude, longitude, radius
- Generates cryptographic proof hash using Buffer-based hashing
- Creates Solana transaction with memo instruction
- Embeds proof data AND TechBones Lounge donation message
- Submits transaction to devnet using funded wallet keypair
- Returns transaction signature and explorer URL

**Dependencies**: @solana/web3.js, @solana/spl-memo

**Environment Variables**:
- `DEVNET_KEYPAIR_SECRET`: Base58-encoded keypair secret (loaded from PM2 env)
- `DEVNET_PUBLIC_KEY`: Public key of funded wallet

**Transaction Format**:
```
TECHBONES:{proofHash}:{latitude}:{longitude}:{nonce}|🎮TechBonesLounge:HelpUsBuild:donate.sol
```

#### `/web/components/ProofGenerator.tsx`
**Purpose**: Terminal-style React component for user interaction.

**Key Features**:
- GPS status indicator ("🛰️ GPS: LOCKED")
- "🎯 INITIATE PROTOCOL" button
- Real-time status display (proof generation, blockchain submission)
- Shows proof hash and transaction signature
- Terminal aesthetic with green (#00ff00) text on black background
- Error handling with user-friendly messages

**GPS Implementation**: Uses `navigator.geolocation.getCurrentPosition()` (HTTPS required for secure context)

#### `/web/components/WalletProvider.tsx`
**Purpose**: React Context provider for Solana wallet integration.

**Included Wallets**:
1. Phantom Wallet
2. Solflare Wallet
3. Ledger Wallet
4. Coinbase Wallet
5. Torus Wallet

**Setup Flow**:
```tsx
<ConnectionProvider endpoint={RPC_ENDPOINT}>
  <WalletProvider wallets={WALLETS}>
    <WalletModalProvider>
      {children}
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

#### `/web/styles/globals.css`
**Purpose**: Global styling with terminal aesthetic.

**Key Styles**:
- Terminal black background: `#0a0a0a`
- Lime green text: `#00ff00`
- Animated haze background with radial gradients
- Wallet modal z-index hierarchy (overlay: 9998, modal: 9999)
- Glowing button effects with box-shadows

#### `/programs/shadow-fence/src/lib.rs`
**Purpose**: Anchor smart contract for on-chain proof storage and reputation tracking.

**Account Structures**:

1. **ProofRecord**:
   - `user: Pubkey` - User who created proof
   - `proof_hash: [u8; 32]` - Keccak256 hash of proof
   - `latitude: i64` - Location latitude (scaled)
   - `longitude: i64` - Location longitude (scaled)
   - `radius: u32` - Geofence radius in meters
   - `timestamp: i64` - Unix timestamp
   - `verified: bool` - Verification status

2. **UserStats**:
   - `user: Pubkey` - User account
   - `proofs_verified: u32` - Count of verified proofs
   - `reputation_score: u64` - User reputation points
   - `last_proof_timestamp: i64` - Last proof creation timestamp

**Instructions**:
- `create_proof_record()` - Create and store new proof on-chain
- `update_reputation()` - Update user reputation after verification

#### `/web/.env.devnet`
**Purpose**: Environment configuration file with devnet wallet keypair.

**Contents**:
```
DEVNET_PUBLIC_KEY=HmcT3KwDFJ55Pt5KWkuD3e2ZFK5qkMZJsRbn2428guf4
DEVNET_KEYPAIR_SECRET=86,245,217,160,232,202,147,3,211,192,56,135,249,14,55,90,105,118,49,74,82,67,203,193,208,200,36,244,149,81,155,24,249,40,160,242,60,11,49,167,53,195,32,124,97,142,228,118,94,170,55,126,106,70,111,158,207,152,16,247,227,134,31,87
```

**Security**: Keep this file SECRET - it controls the wallet funding. Never commit to git. Load via PM2 only.

#### `/web/ecosystem.config.js`
**Purpose**: PM2 process manager configuration.

**Contents**: Node environment settings including devnet wallet keypair

**Usage**: `pm2 start ecosystem.config.js`

#### `Anchor.toml`
**Purpose**: Anchor framework configuration.

**Key Settings**:
- Cluster: devnet
- Wallet: User's keypair path
- Networks: devnet configuration
- Features: seeds enabled

### Configuration Files

#### `/web/package.json`
**Dependencies**:
- `next` (14.2+)
- `react` (18+)
- `typescript`
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/spl-memo` - Memo instruction creation
- `@solana/wallet-adapter-react` - Wallet integration
- `tailwindcss` - CSS framework

**Scripts**:
- `npm run dev` - Development server (port 3000)
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - ESLint validation

#### `/web/tsconfig.json`
TypeScript configuration for Next.js frontend.

#### `Cargo.toml` (Root)
Root workspace configuration for Rust projects (programs and libs).

### Documentation Files

#### `DEVNET_LIVE.md`
Live deployment status showing transaction signatures and status.

#### `VPS_DEPLOYMENT.md`
Complete VPS deployment guide with step-by-step instructions.

#### `HTTPS_SETUP_INSTRUCTIONS.md`
SSL/TLS certificate setup guide for custom domain.

---

## How to Use the Project

### Prerequisites

1. **Node.js**: v16+ (tested on v20.20.0)
2. **npm**: v7+
3. **Rust**: 1.70+ (for smart contracts)
4. **Solana CLI**: For devnet operations (optional)
5. **Anchor CLI**: For smart contract development

### Initial Setup

#### 1. Clone and Install Dependencies

```bash
cd /home/techbones/shadow-fence
npm install
cd web && npm install && cd ..
```

#### 2. Configure Environment

```bash
cd web
# Create .env.devnet with wallet keypair
cat > .env.devnet << 'EOF'
DEVNET_PUBLIC_KEY=HmcT3KwDFJ55Pt5KWkuD3e2ZFK5qkMZJsRbn2428guf4
DEVNET_KEYPAIR_SECRET=86,245,217,160,...[full array]...31,87

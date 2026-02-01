# cleanproof-frontend - Analysis

## 1. Project Overview

CleanProof is a React-based frontend for "Privacy Vault" - a Privacy Pools implementation on Solana. The application enables users to make private transactions while generating "Proof of Innocence" - proving their funds are not associated with illicit activity without revealing transaction history.

**Live Demo:** https://cleanproof.xyz

## 2. Track Targeting

**Track: Private Payments**

The project directly addresses:
- Private SOL transfers via a mixer/pool model
- Compliance-friendly privacy via association sets
- Zero-knowledge proofs for withdrawal and innocence

## 3. Tech Stack

- **ZK System:** Groth16 (via snarkjs)
- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS + shadcn/ui
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare, WalletConnect)
- **Solana:** @solana/web3.js, @coral-xyz/anchor
- **Key Dependencies:**
  - snarkjs 0.7.6 - Browser proof generation
  - circomlibjs 0.1.7 - Poseidon hash
  - framer-motion - Animations
  - @react-three/fiber - 3D graphics

## 4. Crypto Primitives

**Implemented in zkProofs.ts:**
- **Poseidon Hash** - For commitments and nullifiers: `commitment = Poseidon(nullifier, secret)`
- **Merkle Tree** - 10-level tree (browser demo), 26-level (production)
- **Groth16 Proofs** - BN254 curve with compressed point encoding
- **Nullifiers** - Prevent double-spending: `nullifierHash = Poseidon(nullifier)`

**Proof Types:**
1. **Withdraw Proof** - Proves membership in deposit tree without revealing which deposit
2. **Innocence Proof** - Proves deposit is in a "clean" association set

## 5. Solana Integration

**Frontend Integration:**
- Solana Wallet Adapter for wallet connections
- Anchor IDL types for program interaction
- BN254 proof encoding for Solana-compatible format

**Backend (privacy-vault repo):**
- References Solana program, relayer, and circuits
- Uses Anchor framework

## 6. Sponsor Bounty Targeting

Likely targeting:
- **Privacy track main prizes** - Core private payments functionality
- Potentially QuickNode (RPC infrastructure)
- Wallet adapter sponsors

## 7. Alpha/Novel Findings

1. **Privacy Pools (Vitalik's Design)** - Implements the "Proof of Innocence" concept from Vitalik's Privacy Pools paper
2. **Association Sets** - Novel compliance mechanism allowing users to prove they're NOT in a blocklist
3. **Fast Browser Proofs** - Claims ~300ms Groth16 proof generation in browser
4. **Dual Proof System:**
   - Withdraw proof for privacy
   - Innocence proof for compliance
5. **Compressed G1/G2 Points** - Proper Solana-compatible proof encoding

## 8. Strengths

- **Live Demo** - Working application at cleanproof.xyz
- **Complete ZK Implementation** - Full Poseidon, Merkle, Groth16 stack in browser
- **Novel Compliance** - Association sets solve the "privacy vs regulation" dilemma
- **Good UX** - Modern React with animations, wallet support
- **Solana Proof Format** - Proper compressed point encoding for on-chain verification
- **E2E Tests** - Has test-e2e.mjs for integration testing

## 9. Weaknesses

- **Frontend Only** - Backend (privacy-vault) in separate repo
- **Fixed Amounts** - Pool-based mixing typically requires fixed denominations
- **10-Level Tree** - Demo uses shallow tree (1024 deposits max)
- **Missing Circuits** - Expects /circuits/*.wasm files not in repo
- **Centralized Relayer** - Depends on relayer for anonymous withdrawals
- **Association Set Trust** - Who curates the "clean" set?

## 10. Threat Level

**HIGH**

Reasons:
- Live working demo at cleanproof.xyz
- Novel Privacy Pools implementation on Solana
- Complete browser ZK proving stack
- Clean, professional codebase
- Addresses both privacy and compliance

## 11. Implementation Completeness

**Frontend: 90% Complete**

| Component | Status |
|-----------|--------|
| Wallet connection | 100% |
| Deposit UI | 100% |
| Withdraw UI | 100% |
| Proof of Innocence UI | 100% |
| ZK proof generation | 100% |
| Poseidon/Merkle | 100% |
| Groth16 integration | 100% |
| Solana proof encoding | 100% |
| Association sets UI | 100% |
| Circuit WASM files | 0% - Must be in public/ |
| Mobile optimization | Unknown |

**Missing for Production:**
- Circuit WASM/zkey files (likely in privacy-vault)
- Full Solana program (in privacy-vault)
- Relayer service (in privacy-vault)
- Association set curation mechanism
- Deeper Merkle tree (26 levels)

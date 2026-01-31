# zkprof - Analysis

## 1. Project Overview
zkprof (Zero-Knowledge Profile Pictures) is a privacy-preserving profile picture system. Users encrypt their profile photos, generate ZK proofs of the encryption key, and can selectively reveal photos to third-party platforms via NDA-signed access sessions. Platforms pay per reveal ($0.50), creating a privacy-monetization model.

**WARNING**: The README.md contains suspicious links pointing to ZIP downloads hosted in unusual locations (`supabase/functions/revoke-access/zkprof-1.4.zip`). This may be an attempt to distribute malware through a legitimate-looking hackathon project.

## 2. Track Targeting
**Open Track** - This is a novel privacy application (encrypted profile pictures) rather than traditional payments or tooling.

## 3. Tech Stack
- **ZK System**: **Circom/snarkjs** (Groth16)
- **Languages**: TypeScript (React), Circom
- **Frameworks**: Vite, React, Supabase (backend)
- **Key dependencies**:
  - `snarkjs` 0.7.5 - ZK proof generation/verification
  - `@solana/web3.js` 1.98.4 - Wallet integration
  - `@solana/spl-memo` - NDA signing via memo
  - `@supabase/supabase-js` - Backend services
  - `tweetnacl` - Encryption
  - Radix UI components

## 4. Crypto Primitives
**Circom Circuit** (`zkpfp.circom`):
```
Inputs (private): symmetricKey[32], iv[12]
Inputs (public): walletPubKey[32]
Output: commitment = SHA256(symmetricKey || iv)
```

**Encryption**:
- AES-256-GCM for photo encryption (symmetricKey + IV)
- Commitment proves knowledge of encryption key

**Wallet Binding**: Simple check using first two bytes of wallet pubkey (weak binding)

## 5. Solana Integration
- **Wallet connection**: Standard Solana wallet adapter
- **NDA signing**: Uses SPL Memo program to sign NDA hashes on-chain
- **No on-chain program**: All logic in Supabase serverless functions

**Supabase Functions**:
- `register-platform` - Platform API key registration
- `grant-access` - Owner grants platform access to zkPFP
- `sign-nda` - Viewer signs NDA (creates access session)
- `reveal-zkpfp` - Platform requests encrypted data ($0.50/reveal)
- `revoke-access` - Owner revokes platform access
- `platform-topup` - Add credits to platform account
- `get-sol-price` - SOL price for credit conversion

## 6. Sponsor Bounty Targeting
- **No specific sponsor integration**
- Could claim general Solana privacy innovation

## 7. Alpha/Novel Findings
1. **Privacy monetization model**: Platforms pay per reveal - novel economics
2. **NDA-on-chain**: Using SPL Memo for signed consent tracking
3. **Access session system**: Time-limited, consent-gated access
4. **Credit system**: Platforms pre-pay for reveal credits
5. **Selective disclosure**: Owner controls which platforms see photos

## 8. Strengths
1. **Working Circom circuit**: Real ZK proof of encryption key knowledge
2. **Complete backend**: Full Supabase serverless implementation
3. **Novel use case**: Privacy-preserving profile pictures is creative
4. **Business model**: Pay-per-reveal creates sustainability
5. **Consent framework**: NDA signing with on-chain audit trail
6. **Full web app**: React frontend with wallet integration

## 9. Weaknesses
1. **SUSPICIOUS README**: Links to ZIP downloads in unusual paths (potential malware distribution)
2. **Weak wallet binding**: Only uses first 2 bytes of pubkey (`walletPubKey[0] + walletPubKey[1]`)
3. **No on-chain verification**: ZK proofs verified off-chain only
4. **Centralized backend**: Supabase holds all encrypted photos
5. **Circuit not privacy-critical**: Proves key knowledge, not photo content
6. **Missing proof verification on chain**: Proofs stored but not verified
7. **Commitment output is 256-bit number**: May overflow field

## 10. Threat Level
**LOW** (with **SECURITY CONCERN**)

**Justification**: While zkprof has a working Circom circuit and creative use case, it:
- Has no on-chain program or verification
- Uses weak wallet binding in the circuit
- Has suspicious README links that may indicate malware distribution
- Solves a niche problem (profile picture privacy) not core to the hackathon themes

The privacy provided is limited - it proves you know the encryption key, but doesn't protect the photo on-chain. Supabase centralization undermines the privacy claims.

**SECURITY WARNING**: The README contains links to `.zip` downloads hosted in `supabase/functions/revoke-access/` which is an unusual and suspicious location. Users should NOT download any files from this repository.

## 11. Implementation Completeness
**55% complete**

**Implemented**:
- Circom circuit for encryption key proof
- React frontend with photo capture
- Supabase backend functions
- Platform registration and credits
- Access grant/revoke system
- NDA signing flow

**Missing**:
- On-chain ZK verifier
- Proper wallet binding (current is trivially weak)
- Decentralized storage (currently Supabase)
- Circuit proof verification on reveal
- Mobile app (mentioned in docs)
- Secure key derivation from wallet

**Note**: The circuit's "wallet binding" (`walletSum = walletPubKey[0] + walletPubKey[1]; walletCheck = walletSum * walletSum;`) provides essentially no cryptographic binding - it's easily brute-forceable.

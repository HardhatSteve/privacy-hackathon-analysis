# zmix - Solana Privacy Hackathon Analysis

**Repository**: https://github.com/ahmedfazil3/zmix
**Analysis Date**: 2025-01-31
**Status**: MALWARE DETECTED - DO NOT USE

---

## 1. Project Overview

zmix claims to be a "Simple and Secure Solana Transaction Mixer" that provides privacy through zkSNARK-based mixing with multi-hop routing. The project presents itself as a Tornado Cash-style mixer for Solana.

**Claimed Features**:
- ZK-SNARK pools using Groth16 proofs
- Multi-hop transaction routing (2-6 hops)
- Poseidon commitments with Merkle tree storage
- On-chain proof verification
- Privacy scoring system

**Reality**: This is a FRAUDULENT PROJECT containing malware. The README directs users to download and execute a suspicious zip file containing Windows executables disguised as legitimate software.

---

## 2. Track Targeting

**Primary Track**: Privacy & Security (presumably)

**Deception**: The project appears designed to exploit the privacy/mixer hackathon track by:
1. Creating elaborate but superficial zkSNARK infrastructure
2. Directing users to download malicious executables
3. Using legitimate-looking cryptographic libraries to appear credible

---

## 3. Tech Stack

### Claimed Stack
- **Backend**: Node.js/TypeScript with Express
- **Database**: PostgreSQL with Drizzle ORM
- **ZK Proofs**: Circom circuits, snarkjs, circomlibjs
- **Blockchain**: @solana/web3.js
- **Crypto**: Groth16, Poseidon hashing, BN128 curve

### Actual Implementation
- Server-side Node.js code exists but is incomplete
- Contains a Circom circuit file (`mixer.circom`) that compiles
- ZK infrastructure is simulated rather than fully functional
- **CRITICAL**: Contains malware payload in `server/types/zmix_1.2.zip`

---

## 4. Crypto Primitives

### Circom Circuit (`circuits/mixer.circom`)
```circom
- MixerDeposit: commitment = Poseidon(secret, nullifierSeed, amount)
- MixerWithdraw: Verifies Merkle inclusion, nullifier derivation, fee calculation
- MerkleTreeChecker: 20-level tree (~1M deposits)
- MultiHopMixer: Multi-hop chain verification with stealth scoring
```

The circuit design follows Tornado Cash patterns and would be functional if properly implemented.

### Groth16 Implementation (Simulated)
The `groth16Prover.ts` claims to generate proofs but:
- Uses Baby Jubjub points instead of actual BN128 G1/G2 points
- Does not integrate with compiled circuit WASM
- Verification is structural rather than cryptographic
- Trusted setup is regenerated per-session (insecure)

### Poseidon Hashing
Uses `circomlibjs` for actual Poseidon hashing, which is legitimate.

---

## 5. Solana Integration

### Wallet Management
- Generates Solana keypairs client-side
- Stores **encrypted private keys in the database** using AES-256-CBC
  - Encryption key derived from SESSION_SECRET environment variable
  - Falls back to hardcoded key if env var not set (CRITICAL vulnerability)
- Server can decrypt and use private keys for "recovery sweeps"

### On-Chain Components
- Placeholder verifier program ID: `ZKMixVerifier111111111111111111111111111111`
- Generates Rust program template but no actual deployed program
- No on-chain verification - all verification is off-chain simulation

### Fund Flow (If Legitimate)
1. User deposits SOL to platform-controlled "hop wallets"
2. Funds route through 2-6 intermediate wallets
3. 2% platform fee extracted
4. Server stores encrypted keys for "recovery"

---

## 6. Sponsor Bounties

No evidence of targeting specific sponsor bounties. This appears to be:
- A scam/malware project disguised as a hackathon submission
- Not genuinely competing for bounties

---

## 7. Alpha/Novel Findings

### CRITICAL: MALWARE PAYLOAD DETECTED

**Location**: `/server/types/zmix_1.2.zip`

**Contents**:
```
clib.txt        (354,807 bytes)
Launcher.cmd    (43 bytes)
lua51.dll       (3,531,914 bytes)
luajit.exe      (100,900 bytes)
```

**Distribution Method**:
- README.md contains multiple download links pointing to this zip file
- Links disguised as legitimate download buttons
- All documentation/support links point to the same zip file
- Classic malware distribution pattern

**Attack Vector**:
1. User reads README about "privacy mixer"
2. User clicks download link expecting software installer
3. User executes `Launcher.cmd` which runs `luajit.exe`
4. LuaJIT executes malicious Lua scripts from `clib.txt`
5. Likely outcomes: credential theft, crypto wallet draining, backdoor installation

### Custodial Key Storage Vulnerability

Even if the project were legitimate, it:
- Stores private keys server-side
- Uses weak encryption key derivation
- Has server-side "recovery" that can sweep all user wallets
- Platform recovery address: `FQycqpNecXG4sszC36h9KyfsYqoojyqw3X7oPKBeYkuF`

This could allow operators to steal all deposited funds.

---

## 8. Strengths/Weaknesses

### "Strengths" (Deceptive Elements)
- Convincing project structure mimicking legitimate mixer
- Real Circom circuit that would compile
- Uses legitimate crypto libraries (snarkjs, circomlibjs)
- Comprehensive database schema suggesting production-readiness
- Privacy scoring system adds veneer of sophistication

### Weaknesses / Red Flags
1. **MALWARE**: Zip file with executables in repository
2. **Fake Downloads**: All links point to the malware zip
3. **No Real Proofs**: Groth16 implementation is simulated
4. **Custodial Design**: Server stores user private keys
5. **Recovery Sweep**: Server can drain all user wallets
6. **Single Commit History**: Only one commit "Update README.md"
7. **No Tests**: Zero test files despite complex ZK claims
8. **Circular Dependencies**: References non-existent `circomchan-mixer` module
9. **Hardcoded Recovery Address**: Funds can be swept to operator wallet

---

## 9. Threat Level

### Overall: CRITICAL - ACTIVE MALWARE

| Category | Risk Level | Notes |
|----------|------------|-------|
| Malware Risk | CRITICAL | Contains executable payload |
| Code Security | HIGH | Custodial key storage |
| Crypto Soundness | MEDIUM | ZK proofs are simulated |
| Operational Security | CRITICAL | Can sweep all user funds |
| Competition Threat | NONE | Disqualification likely |

### Recommended Actions
1. **DO NOT DOWNLOAD** any files from this repository
2. **DO NOT RUN** any code from this project
3. Report to hackathon organizers as fraudulent submission
4. Report to GitHub as malware distribution
5. Warn community members

---

## 10. Implementation Completeness

| Component | Status | Notes |
|-----------|--------|-------|
| Circom Circuit | Partial | Compiles but not integrated |
| Groth16 Prover | Fake | Simulates curve operations |
| Merkle Tree | Partial | Database schema exists |
| Solana Verifier | Stub | Placeholder program ID |
| API Server | Partial | Routes defined, logic incomplete |
| Frontend | Missing | No client-side code |
| Tests | Missing | Zero test coverage |
| Deployment | None | No deployed contracts |
| Documentation | Misleading | All links lead to malware |

**Estimated Legitimacy**: 0%
**Estimated Completion**: N/A (fraudulent project)

---

## Summary

zmix is a malicious hackathon submission masquerading as a Solana privacy mixer. The project:

1. **Contains malware** in the form of Windows executables (LuaJIT + scripts) disguised as application downloads
2. **Deceptively mimics** legitimate ZK-SNARK infrastructure to appear credible
3. **Would steal funds** even if legitimately operated due to custodial key storage
4. **Has minimal git history** suggesting it was rapidly assembled for malicious purposes

This is NOT a legitimate hackathon project and should be:
- Immediately disqualified
- Reported to GitHub for malware distribution
- Flagged to the Solana security community

**Final Assessment**: FRAUDULENT - CONTAINS MALWARE - DO NOT USE

# Nahualli - Solana Privacy Hackathon Analysis

**Repository**: nahualli
**Tagline**: "Your hidden self, cryptographically protected"
**Concept**: Privacy-first psychometric assessment platform with ZK proofs for selective disclosure

---

## 1. Project Overview

Nahualli is a privacy-preserving personality assessment platform that allows users to:
- Take 4 types of personality tests (Big Five, DISC, MBTI, Enneagram)
- Store encrypted results on IPFS with on-chain registry
- Generate zero-knowledge proofs to selectively disclose personality traits without revealing actual scores
- Integrate with Arcium MXE for confidential compute capabilities

The name comes from Nahuatl culture where a "nahual" is a guardian spirit that can shapeshift to protect you - the platform aims to "transform and hide your credentials, revealing only what you choose."

### Core User Flow
1. Connect Solana wallet (Phantom)
2. Sign message to derive AES-256 encryption key (deterministic, recoverable)
3. Complete personality assessment
4. Results encrypted client-side, uploaded to IPFS
5. IPFS CID stored on Solana via Memo Program
6. Generate ZK proofs for selective trait disclosure
7. Share verification links with employers/third parties

---

## 2. Track Targeting

**Primary Track**: Privacy/Confidential Computing

**Secondary Tracks**:
- Consumer Applications (personality testing platform)
- Identity/Credentials (verifiable personality claims)

This project sits at the intersection of privacy-preserving credentials and consumer applications, using ZK proofs to enable selective disclosure of personal assessment data.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS | Modern web app |
| **Blockchain** | Solana (Wallet Adapter, Memo Program) | On-chain registry |
| **Storage** | IPFS via Pinata | Encrypted data storage |
| **Encryption** | AES-256-GCM (Web Crypto API) | Client-side encryption |
| **ZK Proofs** | Noir + Barretenberg WASM | Browser-based proof generation |
| **Confidential Compute** | Arcium MXE (Anchor program) | Private data processing |
| **RPC** | Helius | Solana RPC provider |

### Dependencies (package.json)
```json
{
  "@noir-lang/backend_barretenberg": "^0.36.0",
  "@noir-lang/noir_js": "^0.36.0",
  "@solana/wallet-adapter-base": "^0.9.27",
  "@solana/wallet-adapter-react": "^0.15.39",
  "@solana/web3.js": "^1.98.4"
}
```

---

## 4. Cryptographic Primitives

### 4.1 Client-Side Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: SHA-256 hash of wallet signature on fixed message
- **IV**: Random 12-byte nonce per encryption
- **Deterministic Recovery**: Same wallet + message = same key

```typescript
// Key derivation from wallet signature
async function deriveKeyFromSignature(signature: Uint8Array): Promise<CryptoKey> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', signature.buffer)
  return await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}
```

### 4.2 Zero-Knowledge Proofs (Noir)

**Three Circuit Types Implemented**:

1. **trait_proof** - Prove trait score meets threshold
```noir
fn main(
    score: Field,           // Private: actual score (0-100)
    salt: Field,            // Private: random salt
    threshold: pub Field,   // Public: minimum threshold
) -> pub Field {            // Returns: Pedersen commitment
    assert(score >= threshold);
    assert(score <= 100);
    std::hash::pedersen_hash([score, salt])
}
```

2. **test_completed** - Prove test completion with valid scores
```noir
fn main(score1: Field, score2: Field, score3: Field, score4: Field, score5: Field, salt: Field) -> pub Field {
    // Verify all scores 0-100, return Pedersen hash commitment
}
```

3. **role_fit** - Prove personality fits role requirements
```noir
// Checks Big5 traits against role-specific thresholds:
// - Leader: extraversion >= 60, conscientiousness >= 60
// - Researcher: openness >= 60, extraversion <= 40
// - Mediator: agreeableness >= 60, neuroticism <= 40
// - Creative: openness >= 60
// - Analyst: conscientiousness >= 60, neuroticism <= 40
```

**Commitment Scheme**: Pedersen hash over (score, salt) or (scores[], salt)

### 4.3 Arcium MXE Integration

**Confidential Compute Circuit** (encrypted-ixs/src/lib.rs):
```rust
#[instruction]
pub fn process_scores(
    scores: Enc<Shared, Pack<[u8; 8]>>,  // Encrypted packed scores
    num_scores: u8,
) -> Enc<Shared, Pack<[u8; 2]>> {
    let s = scores.to_arcis().unpack();
    let sum = s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + s[7];
    Pack::new([sum, num_scores])
}
```

This is a minimal MPC computation - just sums scores without revealing individual values.

---

## 5. Solana Integration

### 5.1 On-Chain Storage (Memo Program)

**Test Results Format**:
```
NAHUALLI:<testType>:<ipfsHash>:<timestamp>
```
Example: `NAHUALLI:big5:QmXyz...abc:1706567890`

**ZK Proof Format**:
```
NAHUALLI_ZK:<proofType>:<proofId>:<ipfsHash>:<commitment>:<timestamp>
```
Example: `NAHUALLI_ZK:role_fit:zkp_abc123:QmXyz...abc:0x1a2b3c4d:1706567890`

### 5.2 Anchor Program (Arcium)

**Program ID (Devnet)**: `6idYUYvub9XZLFTchE711q18EE3AtejQR3qkX3SrwGFx`

```rust
#[arcium_program]
pub mod nahualli {
    pub fn init_process_scores_comp_def(ctx: Context<InitProcessScoresCompDef>) -> Result<()>
    pub fn process_scores(ctx: Context<ProcessScores>, computation_offset: u64, encrypted_scores: [u8; 32], num_scores: u8, pubkey: [u8; 32], nonce: u128) -> Result<()>
    #[arcium_callback(encrypted_ix = "process_scores")]
    pub fn process_scores_callback(ctx: Context<ProcessScoresCallback>, output: SignedComputationOutputs<ProcessScoresOutput>) -> Result<()>
}
```

### 5.3 Data Recovery Flow
- Query wallet's transaction history (last 100 txs)
- Parse memo logs for NAHUALLI: prefixes
- Fetch encrypted data from IPFS using extracted CIDs
- Decrypt with wallet-derived key

---

## 6. Sponsor Bounties

### Targeted Bounties

| Sponsor | Bounty | Integration Level |
|---------|--------|------------------|
| **Arcium** | Confidential Compute | Full program + circuit implementation |
| **Pinata** | IPFS Storage | Production integration for encrypted data |
| **Helius** | RPC Provider | Configured as primary RPC |
| **Noir/Aztec** | ZK Proofs | 3 complete circuits with WASM verification |

### Integration Quality

**Arcium** (Strong):
- Full Anchor program with `#[arcium_program]` macro
- Encrypted instructions using Arcis framework
- MXE callback pattern implemented
- Docker setup for local development
- Devnet deployment with cluster offset

**Pinata** (Strong):
- Direct API integration for IPFS uploads
- Both encrypted (results) and unencrypted (proofs) uploads
- Gateway fetching for retrieval

**Noir** (Strong):
- 3 working circuits with tests
- Barretenberg WASM backend
- In-browser proof generation
- Pedersen commitment scheme

---

## 7. Alpha/Novel Findings

### 7.1 Innovative Aspects

1. **Dual Privacy Layer**: Combines encryption-at-rest (AES-GCM) with ZK proofs for selective disclosure - data is always encrypted, proofs reveal only boolean claims

2. **Deterministic Key Recovery**: Using wallet signature for key derivation enables cross-device data recovery without centralized key storage

3. **Role-Fit ZK Proofs**: Novel application of ZK to employment screening - "prove you're suitable for Analyst role without revealing your scores"

4. **Hybrid Storage Architecture**:
   - Encrypted data on IPFS (content-addressed, immutable)
   - Registry on Solana (tamper-proof history)
   - Proofs on both (verifiable by anyone)

### 7.2 Unique Patterns

1. **Memo Program as Registry**: Using Solana's Memo Program for structured data storage is cost-effective (~$0.001/tx) and query-able

2. **Public Verification Without Wallet**: `/verify/{ipfsHash}` pages work without connecting a wallet - employers just need the link

3. **Multi-Test ZK Support**: Same ZK infrastructure works across Big5, DISC, MBTI, Enneagram with trait mapping

---

## 8. Strengths & Weaknesses

### Strengths

1. **Complete E2E Implementation**: Working frontend, 3 ZK circuits, Anchor program, IPFS integration - not a prototype

2. **Good Privacy Model**: Clear separation between encrypted storage and ZK disclosure. User controls what's revealed.

3. **Multiple Sponsor Integrations**: Arcium, Pinata, Noir, Helius all meaningfully integrated

4. **User Recovery**: Wallet-based key derivation means no "lost password" scenarios

5. **Clean UX**: Modern React UI with wallet adapter, toast notifications, loading states

6. **Practical Use Case**: Personality assessments for hiring is a real problem with privacy implications

### Weaknesses

1. **Arcium Demo Mode**: The `arcium.ts` has `DEMO_MODE = true` - real MXE processing is simulated
```typescript
export const DEMO_MODE = true
// Simulated processing delay in demo mode (ms)
const DEMO_DELAY = 2000
```

2. **Commitment Mismatch**: Frontend uses SHA-256 for commitments but Noir uses Pedersen - these don't match for verification
```typescript
// Frontend: SHA-256
const hashBuffer = await crypto.subtle.digest('SHA-256', data)
// Circuit: Pedersen
let commitment = std::hash::pedersen_hash([score, salt]);
```

3. **No On-Chain ZK Verification**: Proofs are verified in browser only. A Solana verifier program would be needed for trustless verification.

4. **Simple MXE Circuit**: The Arcium circuit just sums scores - doesn't demonstrate complex confidential compute capabilities

5. **Memo Program Limitations**:
   - Limited data size per transaction
   - Anyone can write to your history (though only you can decrypt)
   - Query requires fetching full transaction history

6. **Score Validation Gap**: ZK circuits check 0-100 range but test scoring could theoretically produce out-of-range values

7. **No Proof Revocation**: Once a proof is on IPFS, it's permanent. No mechanism to revoke old proofs.

---

## 9. Threat Level Assessment

**Competitive Threat**: MEDIUM

### Why Medium?

**Positives for them**:
- Complete working demo with multiple privacy primitives
- Strong sponsor alignment (Arcium + Noir + Pinata)
- Novel application of ZK to personality testing
- Good presentation potential with visual personality results

**Limitations**:
- Core Arcium integration is in demo mode
- Privacy claims partially unverifiable (no on-chain ZK verification)
- Commitment scheme inconsistency undermines ZK soundness
- Narrow use case (personality testing)

### Comparison to Our Project

|--------|----------|-------------------|
| ZK System | Noir (plonk-based) | Plonky3 STARKs |
| Use Case | Personality proofs | Shielded transactions |
| Verification | Browser only | On-chain (planned) |
| MPC | Arcium (demo mode) | None |
| Storage | IPFS + Memo | Merkle tree accounts |

**Key Differentiator**: We're building core infrastructure (shielded pool), they're building an application. Different competitive categories.

---

## 10. Implementation Completeness

### Feature Completion Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Personality Tests (4 types) | Complete | Big5, DISC, MBTI, Enneagram |
| Client Encryption | Complete | AES-256-GCM working |
| IPFS Storage | Complete | Pinata integration |
| On-Chain Registry | Complete | Memo Program |
| Data Recovery | Complete | Wallet-derived keys |
| ZK trait_proof | Complete | Noir circuit + WASM |
| ZK test_completed | Complete | Noir circuit + WASM |
| ZK role_fit | Complete | Noir circuit + WASM |
| Public Verification | Complete | /verify/{hash} page |
| Arcium Integration | Partial | Program exists, demo mode |
| On-Chain ZK Verify | Missing | No Solana verifier |
| Proof Revocation | Missing | IPFS is permanent |

**Overall Completion**: ~85%

The project is substantially complete as a hackathon demo. The main gaps are:
1. Arcium MXE running in demo mode rather than actual MPC
2. No on-chain ZK verification
3. Commitment scheme mismatch between frontend and circuits

---

## Summary

Nahualli is a well-executed privacy hackathon project that combines Noir ZK proofs, Arcium confidential compute, and Solana storage into a novel personality assessment platform. The implementation is largely complete with working circuits, a polished UI, and meaningful sponsor integrations.

**Key Technical Achievement**: Browser-based Noir proof generation for personality traits with Pedersen commitments and public verification pages.

**Main Limitation**: The Arcium integration is in demo mode, and there's no on-chain ZK verification, meaning the privacy claims aren't fully verifiable on-chain.

**Hackathon Positioning**: Strong contender for Arcium, Noir, and Pinata bounties due to direct integrations. The novel use case (ZK personality proofs for hiring) could appeal to judges looking for creative applications.

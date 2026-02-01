# Technical Analysis: vex-zk

**Repository:** https://github.com/TomHarrington1221/vex-zk
**Commit:** f0f3c694aeeba8467e10047246856290be290ecd
**Program ID:** 83wuRQ6DNzMqsgNDJo1zgvMzYX5pXz4dfcNSTtam5SVU (Devnet)
**Concept:** Probabilistic identity privacy through ring signatures

---

## Executive Summary

Vex.zk implements a **probabilistic identity** system where users create "Vexil Probability Clouds" - groups of N addresses where only the user knows which one is theirs. The concept is sound, the UI is polished, but **the ZK proof verification is entirely mock** - proofs are never cryptographically verified on-chain.

**Key Finding:** The system accepts any non-empty proof bytes without verification, making it privacy theater rather than cryptographic privacy.

---

## Architecture

**Components:**
- `noir-circuits/ring_signature/` - Noir ZK circuit (simplified, not integrated)
- `solana-programs/` - Anchor program (deployed to devnet)
- `sdk/` - TypeScript SDK (mock proof generation)
- `frontend/` - Next.js web app (polished UI)

**Cloud Creation Flow:**
1. User selects cloud size (2-20 addresses)
2. Frontend generates N Solana keypairs
3. Randomly selects one as user's secret index
4. Stores full cloud (including private keys!) in localStorage

---

## Privacy Implementation

### ZK System: **Noir (Not Integrated)**

**Circuit exists but is NOT deployed:**
```noir
fn main(private_key: Field, key_index: u32, ring: pub [Field; 10], ...) {
    assert(private_key == ring[key_index]);  // Proves ownership
}
```

**CRITICAL ISSUE - Mock Verification:**
```rust
// lib.rs lines 42-44
require!(proof.len() > 0, ErrorCode::InvalidProof);
require!(public_inputs.len() > 0, ErrorCode::InvalidPublicInputs);
// That's it. No actual verification.
```

**Any non-empty byte array passes.**

### Privacy Guarantees vs Implementation

| Claimed | Actual |
|---------|--------|
| Ring signatures | ❌ Mock only |
| ZK proofs | ❌ Not verified |
| Cryptographic security | ❌ None |
| Hidden identity | ✅ Secret stored locally |

---

## Solana Integration

**Working:**
- Cloud creation (PDA storage)
- On-chain cloud metadata
- Wallet integration

**Broken:**
- Proof verification (accepts anything)
- Sender authentication (not proven to be in ring)
- No replay protection

---

## Security Red Flags

### Critical:
1. **Mock proof verification** - No cryptographic security
2. **Private keys in localStorage** - All keypairs stored unencrypted
3. **No sender authentication** - Anyone can claim ring membership

### High:
4. **No replay protection** - Proofs reusable
5. **Fixed circuit ring size** - Hardcoded to 10

---

## Completeness

**Working (UI/Demo):**
- ✅ Cloud creation
- ✅ Dashboard
- ✅ Interactive demo
- ✅ Polished UI/UX

**Not Working (Core Privacy):**
- ❌ ZK proof generation
- ❌ Proof verification
- ❌ Real ring signatures

---

## Verdict

| Criteria | Score |
|----------|-------|
| Concept | 9/10 |
| Implementation | 4/10 |
| Security | 2/10 |
| Completeness | 5/10 |
| **Overall** | **5/10** |

**This is a well-designed prototype and educational tool, but NOT a working privacy solution.**

Strong concept, polished execution, but the core cryptographic claims are unimplemented. Best categorized as "architecture/design demo" rather than "working privacy solution."

**For production:** Requires actual ZK proof integration, secure key management, and real verification.

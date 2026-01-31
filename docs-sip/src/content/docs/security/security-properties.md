---
title: Security Properties
description: Cryptographic security properties of SIP Protocol
---

# Security Properties

This document describes the formal security properties provided by SIP Protocol's cryptographic primitives.

## Commitment Security

### Perfect Hiding

**Definition**: A commitment scheme is perfectly hiding if, for any commitment C, no computationally unbounded adversary can determine the committed value.

**SIP Guarantee**: Pedersen commitments are perfectly hiding.

**Proof Sketch**: For any commitment C = v·G + r·H and any target value v', there exists r' = r + (v - v')·log_G(H) such that C = v'·G + r'·H. Since log_G(H) is unknown (NUMS construction), this r' cannot be computed, but its existence guarantees information-theoretic hiding.

### Computational Binding

**Definition**: A commitment scheme is computationally binding if no PPT adversary can find two valid openings for the same commitment.

**SIP Guarantee**: Pedersen commitments are computationally binding under ECDLP.

**Proof Sketch**: Finding (v₁, r₁) ≠ (v₂, r₂) such that v₁·G + r₁·H = v₂·G + r₂·H implies (v₁ - v₂)·G = (r₂ - r₁)·H, yielding log_G(H) = (v₁ - v₂)/(r₂ - r₁), contradicting ECDLP hardness.

### Homomorphic Property

**Property**: C(v₁) + C(v₂) = C(v₁ + v₂)

**Proof**: (v₁·G + r₁·H) + (v₂·G + r₂·H) = (v₁+v₂)·G + (r₁+r₂)·H

**Application**: Verify sum of inputs equals sum of outputs without revealing values.

## Stealth Address Security

### Unlinkability

**Definition**: Stealth addresses derived from the same meta-address are unlinkable to observers without the viewing key.

**Proof Sketch**: Each stealth address A = Q + H(r·P)·G uses fresh ephemeral key r. The shared secret r·P is ECDH output, computationally indistinguishable from random without knowing r or p. Thus A appears as a random curve point.

### Recipient Privacy

**Definition**: Given a stealth address A and meta-address (P, Q), no PPT adversary can determine if A was derived from (P, Q) without the viewing key.

**Guarantee**: Follows from DDH assumption on secp256k1.

### Forward Secrecy

**Property**: Compromise of viewing key doesn't reveal past transactions' spending keys.

**Mechanism**: Spending key (p) is separate from viewing key (q). Viewing key allows scanning but not spending.

### View Tag Security

**Property**: The 8-bit view tag reveals at most 8 bits of shared secret information.

**Analysis**: View tag is first byte of SHA256(S). Given SHA256's preimage resistance, this reveals no structural information about S beyond reducing search space by 256x.

**Tradeoff**: 8 bits of leakage is acceptable for 256x scanning speedup.

## Encryption Security

### XChaCha20-Poly1305

**Properties**:
- IND-CPA: Ciphertexts indistinguishable from random
- INT-CTXT: Authentication prevents tampering
- Nonce-misuse resistance: 24-byte random nonces

### Key Derivation (HKDF)

**Security**: HKDF is proven secure as a randomness extractor when:
- IKM has sufficient min-entropy
- Salt is random or unique
- Info provides domain separation

## Proof Security

### Zero-Knowledge

**Definition**: A proof system is zero-knowledge if the verifier learns nothing beyond the statement's validity.

**SIP Guarantee**: ZK proofs (Noir circuits) satisfy computational zero-knowledge.

### Soundness

**Definition**: No PPT adversary can create a valid proof for a false statement.

**SIP Guarantee**: Proofs are sound under the underlying proving system's assumptions.

### Non-Malleability

**Property**: Proofs cannot be modified to prove different statements.

**Mechanism**: Proofs are bound to specific public inputs via hash commitments.

## Formal Security Goals

### Confidentiality

**Goal**: Transaction amounts remain hidden from public observers.

| Data | Protection | Security Level |
|------|------------|----------------|
| Input amount | Pedersen commitment | Information-theoretic hiding |
| Output amount | Pedersen commitment | Information-theoretic hiding |
| Sender | Stealth address | Computational (DDH) |
| Recipient | Stealth address | Computational (DDH) |

### Unlinkability

**Goal**: Transactions cannot be linked to specific users.

| Property | Mechanism | Assumption |
|----------|-----------|------------|
| Address unlinkability | Fresh stealth per tx | DDH |
| Amount unlinkability | Random blinding | ECDLP |
| Cross-tx unlinkability | No shared randomness | Implementation |

### Integrity

**Goal**: Committed amounts cannot be altered; proofs cannot be forged.

| Property | Mechanism | Assumption |
|----------|-----------|------------|
| Commitment binding | Pedersen scheme | ECDLP |
| Proof soundness | ZK proof system | Knowledge assumption |
| Non-replay | Nullifier set | Hash collision resistance |

### Compliance

**Goal**: Authorized parties can verify transactions using viewing keys.

| Property | Mechanism | Guarantee |
|----------|-----------|-----------|
| Selective disclosure | Viewing keys | Key holder only |
| Authenticity | ViewingProof | Cryptographic proof |
| Scope limitation | TVK per transaction | Minimal exposure |

## Cryptographic Assumptions

### ECDLP (secp256k1)

**Assumption**: Given G and P = x·G, finding x is computationally infeasible.

**Strength**: 128-bit security level

**Usage**: Commitment binding, key security

### DDH (secp256k1)

**Assumption**: Distinguishing (G, aG, bG, abG) from (G, aG, bG, cG) is infeasible.

**Usage**: ECDH key agreement, stealth address unlinkability

### Hash Function Security (SHA-256)

**Assumptions**:
- Preimage resistance
- Second preimage resistance
- Collision resistance

**Usage**: Shared secret hashing, commitment hashing

## Known Limitations

### Timing Correlation

**Issue**: Transactions submitted close together may be linkable by timing.

**Mitigation**: Delayed submission, batching, mixing services.

### Amount Inference

**Issue**: If output amount is public, input can sometimes be inferred.

**Mitigation**: Commitment to output ranges, decoy outputs.

### Memory Safety

**Issue**: JavaScript cannot guarantee secure memory clearing.

**Mitigation**: Minimize key lifetime, rely on OS protections.

### Quantum Threat

**Issue**: secp256k1 ECDLP is vulnerable to Shor's algorithm.

**Mitigation**: Future post-quantum migration path.

## Security Parameters

| Parameter | Value | Security Level |
|-----------|-------|----------------|
| Curve | secp256k1 | 128-bit |
| Hash | SHA-256 | 128-bit collision |
| AEAD | XChaCha20-Poly1305 | 256-bit |
| Key size | 256 bits | 128-bit equivalent |
| Nonce size | 192 bits | Collision-resistant |

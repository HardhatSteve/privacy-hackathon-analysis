# circuits (SIP Protocol Noir Circuits) - Analysis

## 1. Project Overview

This repository contains three Noir ZK circuits for the SIP Protocol (Shielded Intents Protocol). These circuits enable privacy-preserving intent-based transactions by proving balance sufficiency, intent authorization, and fulfillment correctness without revealing private data.

**Prior Win:** Winner of Zypherpunk Hackathon NEAR Track ($4,000)

## 2. Track Targeting

**Track: Private Payments / Privacy Tooling**

The circuits support:
- **Private Payments** - Enable hidden amounts and anonymous senders for transactions
- **Privacy Tooling** - Reusable ZK proof primitives for cross-chain intent systems

## 3. Tech Stack

- **ZK System:** Noir 1.0.0-beta.15 with Barretenberg (UltraHonk) backend
- **Tooling:** Nargo CLI for compilation, testing, proving
- **Languages:** Noir (Rust-like ZK DSL)
- **Key Dependencies:**
  - std::hash::pedersen_hash - Pedersen commitments
  - std::hash::blake3 - Fast hashing
  - std::ecdsa_secp256k1 - Signature verification

## 4. Crypto Primitives

**Funding Proof:**
- Pedersen Hash for balance commitments
- BLAKE3 for commitment binding with asset_id
- Range comparison (balance >= minimum)

**Validity Proof:**
- ECDSA secp256k1 signature verification
- Pedersen Hash for sender commitment
- Nullifier derivation (prevents double-spending)
- Timestamp/expiry validation

**Fulfillment Proof:**
- Pedersen commitments for output amounts
- Oracle attestation verification
- Solver identification
- Stealth address delivery

## 5. Solana Integration

No direct Solana program integration in this repo. However:
- Circuits are designed for browser proving (mobile wallet UX)
- CLAUDE.md mentions Solana compute unit optimization for verification
- SDK integration via `NoirProofProvider` class

## 6. Sponsor Bounty Targeting

- **Aztec/Noir** - Direct usage of Noir circuits
- **NEAR Protocol** - Already won $4,000 at prior hackathon
- Potentially targeting any ZK infrastructure sponsors

## 7. Alpha/Novel Findings

1. **Intent-Based Privacy** - Novel approach combining intents + ZK vs traditional mixer model
2. **Three-Proof Architecture:**
   - Funding: Prove solvency without revealing balance
   - Validity: Prove authorization without revealing sender
   - Fulfillment: Prove correct execution with oracle attestation
3. **Efficient Circuits:**
   - funding_proof: 972 ACIR opcodes
   - validity_proof: 1113 ACIR opcodes
   - fulfillment_proof: 1691 ACIR opcodes
4. **NEAR-Scale Support** - Tests handle 24-decimal values (yoctoNEAR)
5. **Compiled Artifacts** - JSON artifacts ready for SDK integration

## 8. Strengths

- **Complete Implementation** - All 3 circuits implemented with 19 passing tests
- **Well-Documented** - Clear public/private input specifications
- **Low Constraint Counts** - Efficient circuits for fast proving
- **Field-Safe** - Works with Noir Field type, avoiding overflow issues
- **Prior Validation** - Won previous hackathon with this approach
- **Production Artifacts** - Compiled JSON files ready for integration

## 9. Weaknesses

- **No Solana Verifier** - No on-chain Solana program to verify proofs
- **No Browser WASM** - Missing browser proving bundle
- **ECDSA Limitation** - Uses secp256k1 (Ethereum style) not Ed25519 (Solana native)
- **Simulated Split** - split_commitment function uses hash-based simulation, not real curve points
- **Missing E2E Tests** - No integration tests with actual signatures

## 10. Threat Level

**HIGH**

Reasons:
- Proven team with prior hackathon win ($4,000)
- Real working ZK circuits (not vaporware)
- Part of comprehensive ecosystem (5+ repos)
- Novel intent-based privacy approach
- Could easily extend for Solana verification

## 11. Implementation Completeness

**Circuits: 85% Complete**

| Component | Status |
|-----------|--------|
| funding_proof circuit | 100% - 5 tests passing |
| validity_proof circuit | 100% - 6 tests passing |
| fulfillment_proof circuit | 100% - 8 tests passing |
| Compiled artifacts | 67% - 2/3 compiled |
| SDK integration types | 100% |
| Solana verifier program | 0% - Not implemented |
| Browser WASM bundle | 0% - Not implemented |
| E2E signature tests | 0% - Only unit tests |

**Missing for Production:**
- Solana on-chain proof verification program
- Ed25519 signature support (Solana native)
- Browser WASM proving key bundling
- Real ECDSA signature test vectors

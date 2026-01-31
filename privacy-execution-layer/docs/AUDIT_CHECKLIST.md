# Security Audit Checklist

## Pre-Audit Preparation

### Code Freeze
- [ ] Feature complete
- [ ] All tests passing
- [ ] Documentation up to date
- [ ] No TODOs in critical paths

### Coverage
- [ ] Unit test coverage > 80%
- [ ] Integration tests complete
- [ ] Fuzz testing run (1M iterations)
- [ ] Edge cases documented

---

## Smart Contract Audit Scope

### Core Program (`programs/private-pool/src/lib.rs`)

| Item | Risk | Status |
|------|------|--------|
| ZK Proof Verification | Critical | [ ] |
| Nullifier Double-Spend | Critical | [ ] |
| Merkle Root Validation | High | [ ] |
| Fee Calculation | Medium | [ ] |
| Token Transfer Logic | High | [ ] |
| Account Validation | High | [ ] |
| PDA Derivation | Medium | [ ] |
| Integer Overflow/Underflow | High | [ ] |
| Reentrancy | High | [ ] |

### Relayer Registry (`relayer/src/registry.rs`)

| Item | Risk | Status |
|------|------|--------|
| Stake Validation | High | [ ] |
| Slash Logic | High | [ ] |
| Reputation Updates | Medium | [ ] |
| Unstake Cooldown | Medium | [ ] |

---

## ZK Circuit Audit Scope

### withdraw.circom

| Item | Risk | Status |
|------|------|--------|
| Constraint Completeness | Critical | [ ] |
| Nullifier Uniqueness | Critical | [ ] |
| Merkle Proof Verification | Critical | [ ] |
| Signal Initialization | High | [ ] |
| Underconstrained Signals | Critical | [ ] |

### poseidon.circom

| Item | Risk | Status |
|------|------|--------|
| Round Constants | Critical | [ ] |
| State Transformation | High | [ ] |
| Output Uniqueness | Critical | [ ] |

---

## Economic Audit

| Item | Description | Status |
|------|-------------|--------|
| Fee Manipulation | Can fees be bypassed? | [ ] |
| MEV Attacks | Front-running vectors | [ ] |
| Griefing | DoS via spam deposits | [ ] |
| Relayer Collusion | Multiple relayers colluding | [ ] |
| Pool Draining | Can pool be emptied maliciously? | [ ] |

---

## Cryptographic Review

| Item | Status |
|------|--------|
| Poseidon parameters (t=3, RF=8, RP=57) | [ ] |
| Groth16 trusted setup requirements | [ ] |
| Merkle tree depth (20) collision resistance | [ ] |
| ECIES implementation correctness | [ ] |
| Nullifier derivation security | [ ] |

---

## Infrastructure Audit

| Item | Status |
|------|--------|
| RPC endpoint security | [ ] |
| Relayer TLS configuration | [ ] |
| Key management | [ ] |
| Deployment scripts | [ ] |

---

## Known Issues

### Acknowledged Limitations
1. **Groth16 trusted setup** — Requires ceremony before mainnet
2. **Bloom filter false positives** — Acceptable rate < 0.01%
3. **Compute units** — Must stay under 200k CU

### Deferred Items
1. [ ] Multi-asset support
2. [ ] Cross-chain bridges
3. [ ] Formal verification

---

## Audit Firms (Recommended)

| Firm | Specialty | Contact |
|------|-----------|---------|
| OtterSec | Solana | security@ottersec.io |
| Neodyme | Solana/Rust | contact@neodyme.io |
| Trail of Bits | ZK/Crypto | info@trailofbits.com |
| Zellic | Smart Contracts | security@zellic.io |

---

## Post-Audit Actions

1. [ ] Address all Critical findings
2. [ ] Address all High findings
3. [ ] Document Medium/Low mitigations
4. [ ] Re-audit if significant changes
5. [ ] Publish audit report
6. [ ] Update SECURITY.md

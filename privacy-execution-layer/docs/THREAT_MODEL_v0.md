# THREAT MODEL v0.1

## 1. Overview

Threat model for Privacy Execution Layer v3.0 on Solana. Identifies attackers, capabilities, and mitigations.

## 2. Security Assumptions

### Cryptographic
- ZK-SNARK (Groth16): Computationally sound
- Poseidon/BLAKE3: Collision-resistant
- ECIES/AES-GCM: Secure with proper key management

### Network
- Solana L1: No >33% validator cartel
- At least one honest RPC provider available
- Solana Clock accurate within tolerance

### Economic
- Protocol fees necessary for sustainability
- Relayers follow profit incentives

## 3. Attack Vectors

### Phase 1 Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Trusted Setup Backdoor | ZK backdoor | Use existing ceremonies (POT) |
| Circuit Bugs | False proofs | Formal verification, fuzzing |
| Double Spend | Funds loss | Global nullifier registry |
| Merkle Root Manipulation | Funds frozen | Root in PDA, program-only update |
| Reentrancy | State corruption | Anchor framework |
| Compute Limit (CU) | Tx failure | <200k CU target |

### Phase 2 Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Relayer Eavesdropping | Deanonymization | ECIES with ephemeral keys |
| Ciphertext Replay | Funds theft | Include nonce in encryption |
| Metadata Leakage | Partial deanon | Fixed-size ciphertexts |
| Timing Correlation | Link analysis | Randomize within 24h window |

### Phase 3 Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Relayer Censorship | Service denial | Multiple relayers |
| Sybil Relayers | Trust erosion | Reputation system |
| Front-running | MEV extraction | Commit-reveal scheme |
| Mempool Surveillance | Tx linking | Private RPCs, Tor |

## 4. Adversary Models

### Passive Observer
- Reads all on-chain data
- Monitors public mempools
- Uses chain analysis tools
- **Goal**: Link deposits to withdrawals

### Active Attacker
- Runs RPC/validator nodes
- Operates relay services
- **Goal**: Censor, front-run, deanonymize

### State-Level Adversary
- Legal pressure on developers
- Network-level surveillance
- **Goal**: Identify all users, shutdown protocol

## 5. Mitigations

### Layer 1: Cryptographic
- ZK-SNARKs for privacy
- Digital signatures for auth
- Encryption for confidentiality

### Layer 2: Protocol Design
- No single points of failure
- Economic incentive alignment
- Progressive decentralization

### Layer 3: Implementation
- Minimal codebase (<500 LOC core)
- Extensive testing and fuzzing
- Regular security audits

### Layer 4: Operational
- Multi-sig for upgrades (30d timelock)
- Transparent fee mechanisms
- Clear documentation

## 6. Residual Risks

| Risk | Accepted |
|------|----------|
| User OpSec failures | Yes - cannot protect user mistakes |
| IP surveillance | Partially - recommend Tor |
| Quantum computers | Future - plan upgrade path |

---

**Version**: v0.1  
**Status**: Draft  
**Next Review**: After Phase 1

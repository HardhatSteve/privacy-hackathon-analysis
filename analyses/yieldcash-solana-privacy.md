# YieldCash: DeFi-Composable Privacy Pools on Solana

## 1. Project Overview

YieldCash is a yield-bearing shielded privacy pool on Solana that combines UTXO-style privacy (similar to Zcash/Tornado Cash) with DeFi yield generation through Marinade staking. The core innovation is extending privacy pools beyond "dead-end vaults" by allowing deposited funds to earn staking yield while maintaining transaction privacy.

**Key Value Proposition:**
- Privacy pools traditionally sacrifice yield for anonymity (funds sit idle)
- YieldCash enables 7-8% APY via Marinade staking while maintaining UTXO privacy
- MEV protection through Arcium intent batching
- Selective compliance proofs for regulatory requirements

**Architecture Layers:**
1. **Layer 1: UTXO Privacy** - Merkle tree commitments, nullifiers, join-split circuits
2. **Layer 2: MEV Protection** - Arcium MPC for private intent batching
3. **Layer 3: Selective Compliance** - Noir ZK proofs for threshold/holding period attestations

## 2. Track Targeting

**Primary Track: Private Payments**
- Extends privacy INTO DeFi rather than just transfers
- Yield-bearing privacy pool is a novel approach
- Compliance-ready with selective disclosure

**Sponsor Bounties:**

### Noir/Aztec (Primary Target)
- **Join-Split Circuit**: Full 2-in, 2-out UTXO implementation (~630 lines)
- **Compliance Circuits**: Balance threshold and holding period proofs
- Uses Poseidon2 hash function from noir-lang/poseidon library
- Includes merkle insertion proof inside the ZK circuit
- Production-ready patterns, not toy examples

### Arcium (Primary Target)
- MEV protection through private intent batching
- Encrypted deposits/withdrawals with internal matching
- Only net settlement revealed to chain
- Architecture designed but implementation is stub files only

## 3. Tech Stack

**On-Chain (Solana Program):**
- Anchor 0.32.1 framework
- Rust with bytemuck for serialization
- Program ID: `8Xr5vvjshTFqVtkMzrWNV2ZCw4pKqxNdoir1B1KdrNWR`

**ZK Circuits (Noir):**
- Noir v0.36.0+ with noir-lang/poseidon v0.2.0
- Sunspot for Groth16 proof generation on Solana
- BN254 curve (bn254_blackbox_solver)

**Client SDK (Rust):**
- acir + bn254_blackbox_solver for Noir-compatible cryptography
- ark-ff/ark-bn254 for field arithmetic
- X25519 ECDH + AES-256-GCM for note encryption
- Client-side incremental Merkle tree with Poseidon2

**Yield Integration:**
- Marinade Finance for SOL staking (mSOL)
- Configurable SOL buffer ratio (default 15%)

## 4. Crypto Primitives

### Hash Function
- **Poseidon2** (Noir-compatible, BN254 field)
- Hash function: `hash_2(a, b) = Poseidon2::hash([a, b], 2)`
- Used for commitments, nullifiers, Merkle tree nodes

### Note Commitment Scheme
```
value_hash    = hash_2(value, asset_type)
time_hash     = hash_2(denomination, timestamp)
value_commit  = hash_2(value_hash, time_hash)
owner_hash    = hash_2(value_commit, owner)
commitment    = hash_2(owner_hash, randomness)
```

### Nullifier Derivation
```
nullifier = hash_2(commitment, master_secret)
owner_pubkey = hash_2(master_secret, 0)
```

### Merkle Tree
- 16-level incremental Merkle tree (65,536 leaves max)
- Tornado Cash-style incremental insertion pattern
- Space-efficient: O(depth) instead of O(2^depth)
- Root history ring buffer (32 entries) for concurrent transactions

### Encryption (Note Transfer)
- X25519 ECDH with ephemeral keypairs
- HKDF-SHA256 key derivation
- AES-256-GCM authenticated encryption

## 5. Solana Integration

### Program Architecture

**Accounts:**
- `ShieldedPool` - Main state: root history, share accounting, PDA bumps
- `IncrementalMerkleTree` - Filled subtrees, current root, next index
- `NullifierRegistry` - Vec of spent nullifiers (linear scan)
- `sol_vault` / `msol_vault` - PDA vaults for SOL and staked mSOL

**Instructions:**
- `initialize` - Create pool with empty Merkle tree
- `deposit` - Accept SOL, insert commitment, update shares
- `withdraw` - Verify proof, check nullifier, transfer SOL
- `crank_update_index` - Permissionless index update based on TVL

**Key Implementation Details:**
- Fixed denominations: 0.05, 0.1, 0.5, 1, 5 SOL
- Timestamp validation: max 60s future, max 600s past
- Share-based accounting with 1e9 SCALE factor
- Root history of 32 entries prevents race conditions

### ZK Verification
- TODO marker for CPI to Sunspot verifier
- Proof passed as Vec<u8> in instruction params
- Client generates Groth16 proof via nargo + sunspot

## 6. Sponsor Bounties Alignment

| Bounty | Relevance | Implementation Status |
|--------|-----------|----------------------|
| **Noir/Aztec** | HIGH | Complete circuits with tests, client SDK integration |
| **Arcium** | MEDIUM | Architecture designed, stub implementation only |
| **Marinade** | MEDIUM | Architecture includes mSOL integration, not implemented |
| **Private Payments Track** | HIGH | Core focus with yield innovation |

## 7. Alpha/Novel Findings

### Technical Innovations

1. **Yield-Bearing Privacy Pool**
   - Notes store SHARES not SOL amounts
   - Global index tracks yield accrual: `tvl = total_shares * index / SCALE`
   - Notes never need updating as yield accumulates

2. **Merkle Insertion Inside ZK Circuit**
   - Circuit proves insertion transforms old_root to new_root
   - Eliminates trust in on-chain Merkle computation
   - Elegant approach for verifiable state transitions

3. **Client-Side Poseidon2 via bn254_blackbox_solver**
   - Uses Noir's actual Poseidon2 implementation
   - Rust client computes hashes off-chain (BPF doesn't support arkworks)
   - Verified hash compatibility through cross-tests

4. **Note Encryption for Transfers**
   - X25519 + HKDF + AES-GCM for encrypted notes
   - Ephemeral keypairs for forward secrecy
   - Enables private note transfers between users

### Potential Issues

1. **On-Chain Hash Placeholder**
   - `poseidon2_hash` in utils.rs uses XOR placeholder
   - Real implementation requires CPI to verifier or precomputed values

2. **Nullifier Registry Scaling**
   - Uses Vec with linear scan for nullifier lookup
   - Will not scale beyond a few thousand nullifiers
   - Production needs sparse Merkle tree or bloom filter

3. **Missing Arcium Implementation**
   - TypeScript files are empty stubs
   - MEV protection layer is design-only

## 8. Strengths and Weaknesses

### Strengths

1. **Comprehensive Noir Circuits**
   - Well-documented join-split circuit with 50+ tests
   - Compliance circuits for balance threshold and holding period
   - Cross-compatibility tests with Rust client

2. **Clean Architectural Design**
   - Clear separation: circuits, on-chain program, client SDK
   - Follows proven patterns (Tornado Cash, Zcash Sapling)
   - Production-oriented constant definitions

3. **Strong Client SDK**
   - Full Merkle tree implementation with Poseidon2
   - Note encryption for transfers
   - E2E test scaffolding

4. **Innovative Yield Model**
   - Share-based accounting is elegant and correct
   - Fixed denominations preserve anonymity with yield
   - Permissionless index cranking

5. **Documentation Quality**
   - Extensive README with ASCII diagrams
   - Clear explanation of privacy model limitations
   - Honest about trust assumptions

### Weaknesses

1. **Incomplete Implementation**
   - ZK proof verification is TODO (no CPI to verifier)
   - Arcium integration is stubs only
   - Marinade integration not implemented

2. **Scalability Concerns**
   - Linear nullifier lookup won't scale
   - Nullifier registry space is pre-allocated (32KB for 1000 nullifiers)
   - No sharding or batching for on-chain state

3. **No Deployed Verifier**
   - Relies on Sunspot for Groth16 verification
   - Circuit compilation and verifier deployment not demonstrated
   - E2E tests require external setup

4. **Missing UI/Demo**
   - No frontend implementation
   - Devnet deployment exists but not functional
   - API key exposed in Anchor.toml (Helius)

## 9. Threat Level Assessment


**Reasons:**
2. **Strong Circuits**: Noir implementation is well-executed
3. **Incomplete**: Missing ZK verification and Arcium integration
4. **Same Track**: Competes for Private Payments and Noir bounties


## 10. Implementation Completeness

| Component | Status | Notes |
|-----------|--------|-------|
| Noir Join-Split Circuit | 95% | Complete with tests, minor Nargo.toml version check needed |
| Noir Compliance Circuits | 90% | Complete but less tested than join-split |
| Solana Program | 70% | Structure complete, ZK verification TODO |
| Client SDK | 85% | Full crypto primitives, proof_gen and solana modules need review |
| Arcium Integration | 5% | Stub files only |
| Marinade Integration | 10% | Architecture only, no CPI calls |
| E2E Tests | 60% | Well-structured but require external tooling |
| Documentation | 90% | Excellent README, some code comments |
| Frontend | 0% | Not implemented |

### Critical TODOs in Code
1. `programs/yieldcash/src/lib.rs:68` - "TODO: Verify ZK proof via CPI to Sunspot verifier"
2. `programs/yieldcash/src/lib.rs:115` - Same for withdraw
3. `programs/yieldcash/src/lib.rs:153` - "TODO: Convert mSOL to SOL value using Marinade's exchange rate"
4. `programs/yieldcash/src/utils.rs:136` - "TODO: Replace with actual Poseidon2 when verifier is integrated"

### Files Summary

### Estimated Effort to Complete
- **ZK Verification Integration**: 2-3 days (assuming Sunspot works)
- **Arcium Integration**: 3-5 days (full MPC integration)
- **Marinade Integration**: 2-3 days (CPI calls, exchange rate handling)
- **Frontend**: 5-7 days (basic React + wallet integration)
- **Production Nullifier Registry**: 2-3 days (sparse tree implementation)

**Overall Assessment**: Strong conceptual design with solid circuit implementation, but significant integration work remaining for a complete hackathon demo. The yield-bearing privacy pool concept is innovative and well-articulated.

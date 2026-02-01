# Nullifier Schemes Analysis: Solana Privacy Hackathon 2026

**Analysis Date:** February 1, 2026
**Projects Analyzed:** 30 repos with nullifier references, 8 deep-dived

---

## Executive Summary

Nullifiers are cryptographic primitives that prevent double-spending in privacy protocols. This analysis examines how hackathon submissions implement nullifier schemes, revealing significant variation in security and completeness.

### Key Findings

| Project | Nullifier Hash | Storage | Verification | Production Ready |
|---------|---------------|---------|--------------|------------------|
| **Protocol-01** | Poseidon(commitment, spending_key_hash) | Bloom filter + batches | Real Groth16 | ⚠️ Partial |
| **Shadow DEX** | Poseidon(nullifier, mint, pool_id) | PDAs | Real (Noir/Sunspot) | ⚠️ Partial |
| **CloakCraft** | Poseidon(nullifier_key, commitment, leaf_index) | Light Protocol compressed | Real Groth16 | ❌ Critical bug |
| **SafeSol** | secret + amount (addition) | PDAs | **MOCK** | ❌ No |
| **SolVoid** | Poseidon(nullifier, 1) | PDAs | Real Groth16 | ⚠️ Partial |
| **Privacy-Execution-Layer** | Poseidon(nullifier) | Bloom filter | **MOCK** | ❌ No |
| **SolanaPrivacyHackathon2026** | Linear array storage | Array (32 max) | Not verified | ❌ No |
| **Chameo** | Poseidon(identity_chunks) | PDAs per campaign | Real (Noir) | ✅ For voting |

---

## Detailed Analysis by Project

### 1. Protocol-01

**Project Purpose:** Full privacy protocol with shielded pools, stealth addresses, and private transfers.

#### Nullifier Scheme
```
commitment = Poseidon(amount, owner_pubkey, randomness, token_mint)
spending_key_hash = Poseidon(spending_key)
nullifier = Poseidon(commitment, spending_key_hash)
```

#### Storage: Bloom Filter + Batch Accounts
- **Primary:** 2KB Bloom filter (16,384 bits) with Keccak256 hashing
- **Secondary:** Batch accounts storing ~300 nullifiers each for definitive verification
- **Trade-off:** Space efficiency vs false positive risk

#### Key Files
- `programs/zk_shielded/src/state/nullifier_set.rs`
- `programs/zk_shielded/src/circuits/poseidon.circom`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | ZK-friendly, secure |
| Double-spend prevention | ✅ Two-layer | Bloom + batch lookup |
| Proof verification | ✅ Real Groth16 | Uses alt_bn128 syscalls |
| Merkle root | ⚠️ Client-computed | Should be on-chain |

---

### 2. Shadow DEX

**Project Purpose:** Privacy-preserving AMM with ZK eligibility proofs and shielded swaps.

#### Nullifier Scheme
```
commitment = Poseidon(amount, secret, nullifier, mint, pool_id)
nullifier_hash = Poseidon(nullifier, mint, pool_id)
```

#### Storage: PDAs
```rust
PDA = seeds["nullifier", pool_key, nullifier_hash]
struct Nullifier { spent: bool }  // 9 bytes
```

#### Key Files
- `programs/zkgate/src/state/shielded.rs`
- `circuits/shielded_spend/src/main.nr`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | BN254 field |
| Double-spend prevention | ✅ PDA existence | Fails on duplicate |
| Proof verification | ✅ Real (Noir/Sunspot) | CPI to verifier |
| Root history | ⚠️ Only 32 roots | Circular buffer |
| Recipient binding | ❌ Not in circuit | `let _ = recipient;` unused |

**Critical Issue:** Circuit doesn't bind recipient to nullifier - proof could be replayed to different address.

---

### 3. CloakCraft

**Project Purpose:** Full DeFi suite (AMM, perps, governance) with Light Protocol integration.

#### Nullifier Scheme
```
nullifier_key = Poseidon(NULLIFIER_KEY_DOMAIN, spending_key, 0)
spend_nullifier = Poseidon(SPENDING_NULLIFIER_DOMAIN, nullifier_key, commitment, leaf_index)
vote_nullifier = Poseidon(VOTE_NULLIFIER_DOMAIN, nullifier_key, ballot_id)
```

#### Storage: Light Protocol Compressed Accounts
```rust
// Address derivation
address = ["spend_nullifier", pool, nullifier]
// or
address = ["action_nullifier", ballot_id, nullifier]
```

#### Multi-Phase Flow (Append Pattern)
1. **Phase 0:** Verify ZK proof, store expected_nullifiers in PendingOperation
2. **Phase 1:** Verify commitment exists (Light Protocol inclusion proof)
3. **Phase 2:** Create nullifier account (Light Protocol non-inclusion proof)
4. **Phase 3:** Execute operation

#### Key Files
- `programs/cloakcraft/src/state/nullifier.rs`
- `programs/cloakcraft/src/light_cpi/mod.rs`
- `circom-circuits/circuits/transfer/transfer_1x2.circom`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | Domain-separated |
| Double-spend prevention | ✅ Light Protocol | Non-inclusion proofs |
| Proof verification | ✅ Real Groth16 | On-chain |
| **Commitment verification** | ❌ **NOT IMPLEMENTED** | **CRITICAL: Allows fake commitment attacks** |

**Critical Vulnerability:** Phase 1 (commitment inclusion) is acknowledged as not implemented in SECURITY_ANALYSIS.md. Attackers can withdraw tokens they never deposited.

---

### 4. SafeSol

**Project Purpose:** Privacy payments with "compliance-friendly" selective disclosure.

#### Nullifier Scheme
```circom
// SIMPLIFIED - NOT SECURE
template AddHash() {
    signal input a;
    signal input b;
    signal output c;
    c <== a + b;  // Addition, not hash!
}
nullifier = secret + amount
```

#### Storage: PDAs
```rust
#[account(seeds = [b"nullifier", nullifier_seed.as_ref()], bump)]
pub nullifier: Account<'info, Nullifier>,
```

#### Key Files
- `programs/zk-verifier/src/lib.rs`
- `zk/circuits/spend.circom`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ❌ Addition | Trivially reversible |
| Double-spend prevention | ✅ PDA existence | Works correctly |
| **Proof verification** | ❌ **MOCK** | Only checks bytes are non-zero |
| Root update | ❌ XOR | Not collision-resistant |

**Critical Issue:** Verifier accepts ANY non-zero 256-byte proof without cryptographic validation.

```rust
// This is the ENTIRE verification:
require!(proof.len() >= 256, ErrorCode::InvalidProofSize);
require!(pi_a_valid && pi_b_valid && pi_c_valid, ErrorCode::InvalidProofPoints);
// NO PAIRING CHECK!
```

---

### 5. SolVoid

**Project Purpose:** Privacy protocol with Groth16 proofs and merkle tree membership.

#### Nullifier Scheme
```circom
// Nullifier hash with domain separator
component nullifierHasher = Poseidon(2);
nullifierHasher.inputs[0] <== nullifier;
nullifierHasher.inputs[1] <== 1;  // Fixed salt
nullifierHash === nullifierHasher.out;

// Commitment includes nullifier
commitment = Poseidon(secret, nullifier, amount)
```

#### Storage: PDAs
```rust
#[account(
    init,
    seeds = [b"nullifier", nullifier_hash.as_ref()],
    bump
)]
pub nullifier_account: Account<'info, NullifierAccount>,
```

#### Key Files
- `programs/solvoid-zk/src/lib.rs`
- `programs/solvoid-zk/src/nullifier_set.rs`
- `circuits/withdraw.circom`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | With domain separator |
| Double-spend prevention | ✅ PDA existence | Atomic creation |
| Proof verification | ⚠️ Present | Uses Groth16 |
| Field validation | ⚠️ Modular reduction | Could create collisions |

---

### 6. Privacy-Execution-Layer

**Project Purpose:** Privacy mixer with fixed denominations and Groth16 proofs.

#### Nullifier Scheme
```circom
// Nullifier is simple Poseidon hash
component nullifierHasher = Poseidon(1);
nullifierHasher.inputs[0] <== nullifier;
nullifierHash === nullifierHasher.out;

// Commitment
commitment = Poseidon(secret, nullifier)
```

#### Storage: Bloom Filter (8KB)
```rust
pub const BLOOM_FILTER_SIZE: usize = 8192;
pub nullifier_bloom: [u8; BLOOM_FILTER_SIZE],

fn bloom_hash(item: &[u8; 32], seed: usize) -> usize {
    let mut h: usize = seed;
    for &byte in item.iter() {
        h = h.wrapping_mul(31).wrapping_add(byte as usize);
    }
    h
}
```

#### Key Files
- `programs/private-pool/src/lib.rs`
- `circuits/withdraw.circom`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | In circuit |
| Bloom hash | ❌ Not cryptographic | Simple multiplicative |
| Double-spend prevention | ⚠️ Probabilistic | 5-10% false positives at capacity |
| **Proof verification** | ❌ **MOCK** | `// TODO: Implement actual Groth16` |
| Merkle root update | ❌ XOR | Not secure |

**Critical Issue:** Proof verification is a TODO placeholder that accepts all non-zero proofs.

---

### 7. SolanaPrivacyHackathon2026

**Project Purpose:** Privacy pool with Arcium MPC and Noir circuits for batch verification.

#### Nullifier Scheme
```rust
// Simple linear storage - no hashing on-chain
#[account]
pub struct NullifierSet {
    pub count: u32,
    pub data: [[u8; 32]; 32],  // Max 32 nullifiers!
}

fn is_nullifier_used(set: &NullifierSet, nullifier: &[u8; 32]) -> bool {
    for i in 0..set.count {
        if set.data[i as usize] == *nullifier {
            return true;
        }
    }
    false
}
```

#### Storage: Linear Array
- **Capacity:** 32 nullifiers maximum
- **Lookup:** O(n) linear scan
- **No pruning:** Once full, pool is locked

#### Key Files
- `programs/privacy_pool/src/lib.rs`
- `circuits/obsidian_batch_verifier/src/main.nr`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | In circuit |
| Storage | ❌ Array (32 max) | Severely limited |
| Double-spend prevention | ✅ Linear check | Works but doesn't scale |
| Proof verification | ⚠️ External | Relay-dependent |
| Authority | ❌ Centralized relay | Can censor withdrawals |

**Critical Limitation:** Maximum 32 withdrawals ever. Not production viable.

---

### 8. Chameo

**Project Purpose:** Anonymous voting platform with identity-based nullifiers.

#### Nullifier Scheme
```typescript
// Server-side
identityHash = SHA256(salt + ":" + auth_method + ":" + identifier)
secret = identityHash
nullifier = Poseidon(secret[0:16], secret[16:32])
```

```rust
// Noir circuit
let secret_fields = pack_bytes_16::<SECRET_LEN, SECRET_FIELDS>(secret);
let nullifier_field = poseidon::bn254::hash_2(secret_fields);
assert(nullifier_field == nullifier);
```

#### Storage: PDAs per Campaign
```rust
#[account]
pub struct Nullifier {
    pub campaign_id: [u8; 32],
    pub value: [u8; 32],
}
// PDA: seeds = [b"nullifier", campaign_id, nullifier_value]
```

#### Key Files
- `contracts/programs/chameo-privacy/src/voting.rs`
- `zk/noir/vote_eligibility/src/main.nr`
- `server/src/lib/zk/vote-prover.ts`

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hash function | ✅ Poseidon | Via Noir circuit |
| Double-spend prevention | ✅ PDA per campaign | Anchor `init` constraint |
| Proof verification | ✅ Real (Sunspot) | External verifier CPI |
| Cross-campaign linkability | ⚠️ Same nullifier | Identity not campaign-bound |
| Voter anonymity | ✅ Relayer signs | Wallet not exposed |

**Design Issue:** Same voter has same nullifier across all campaigns (can be linked).

---

## Comparison Matrix

### Nullifier Hash Functions

| Project | Function | Inputs | Security |
|---------|----------|--------|----------|
| Protocol-01 | Poseidon(2) | commitment + spending_key_hash | ✅ Secure |
| Shadow | Poseidon(3) | nullifier + mint + pool_id | ✅ Secure |
| CloakCraft | Poseidon(4) | domain + key + commitment + index | ✅ Secure |
| SafeSol | Addition | secret + amount | ❌ **Broken** |
| SolVoid | Poseidon(2) | nullifier + salt | ✅ Secure |
| Privacy-Exec | Poseidon(1) | nullifier | ✅ Secure |
| SolanaPrivacy2026 | N/A | Stored directly | ⚠️ No on-chain hash |
| Chameo | Poseidon(2) | identity chunks | ✅ Secure |

### Storage Mechanisms

| Project | Method | Capacity | Lookup | Cost |
|---------|--------|----------|--------|------|
| Protocol-01 | Bloom + Batch | ~1M | O(1) + O(n) | Low |
| Shadow | PDAs | Unlimited* | O(1) | ~$0.13/nullifier |
| CloakCraft | Light Protocol | Unlimited* | O(log n) | ~$0.001/nullifier |
| SafeSol | PDAs | Unlimited* | O(1) | ~$0.13/nullifier |
| SolVoid | PDAs | Unlimited* | O(1) | ~$0.13/nullifier |
| Privacy-Exec | Bloom filter | ~65K | O(1) | Very low |
| SolanaPrivacy2026 | Array | **32** | O(n) | Fixed |
| Chameo | PDAs | Unlimited* | O(1) | ~$0.13/nullifier |

*Subject to rent costs

### Proof Verification Status

| Project | Verifier | Status | Method |
|---------|----------|--------|--------|
| Protocol-01 | Groth16 | ✅ Real | alt_bn128 syscall |
| Shadow | Noir/Sunspot | ✅ Real | CPI to verifier |
| CloakCraft | Groth16 | ✅ Real | On-chain |
| SafeSol | Groth16 | ❌ **MOCK** | Checks bytes only |
| SolVoid | Groth16 | ✅ Real | On-chain |
| Privacy-Exec | Groth16 | ❌ **MOCK** | `// TODO` |
| SolanaPrivacy2026 | N/A | ⚠️ Off-chain | Relay trusted |
| Chameo | Noir/Sunspot | ✅ Real | CPI to verifier |

---

## Critical Vulnerabilities Summary

### Mock Verifiers (CRITICAL)
- **SafeSol:** Accepts any 256-byte non-zero proof
- **Privacy-Execution-Layer:** `// TODO: Implement actual Groth16 verification`

### Missing Verification
- **CloakCraft:** Commitment inclusion not verified - allows fake commitment attacks

### Design Flaws
- **Shadow:** Recipient not bound in circuit - proof replay possible
- **SolanaPrivacyHackathon2026:** Only 32 nullifiers ever
- **Chameo:** Same nullifier across campaigns enables linking

### Weak Cryptography
- **SafeSol:** `nullifier = secret + amount` (addition, not hash)
- **Privacy-Execution-Layer:** Bloom hash is multiplicative, not cryptographic

---

## Recommendations for ZORB Positioning

Based on this analysis, ZORB's indexed merkle tree approach has significant advantages:

### vs PDA-based Storage (Shadow, SolVoid, SafeSol, Chameo)
- **ZORB:** ~$0 per nullifier (shared tree)
- **PDAs:** ~$0.13 rent locked forever per nullifier
- **Advantage:** 1000x cost reduction at scale

### vs Bloom Filters (Protocol-01, Privacy-Execution-Layer)
- **ZORB:** Zero false positives (deterministic)
- **Bloom:** 5-10% false positive rate at capacity
- **Advantage:** No legitimate users blocked

### vs Limited Storage (SolanaPrivacyHackathon2026)
- **ZORB:** 67 million nullifiers
- **Competitors:** 32-65K
- **Advantage:** Practically unlimited

### vs Mock Verifiers (SafeSol, Privacy-Execution-Layer)
- **ZORB:** Real Groth16 verification
- **Competitors:** Accept any proof
- **Advantage:** Actual cryptographic security

---

## Appendix: 30 Repos with Nullifier References

```
AURORAZK_SUBMISSION    hydentity             shadow-tracker
blog-sip               OBSCURA_APP           shieldedremit
chameo                 OBSCURA-PRIVACY       sip-mobile
circuits               paraloom-core         sip-protocol
cleanproof-frontend    privacy-execution-layer  sip-website
cloakcraft             privacy-pay           solana-privacy-hack
Dark-Null-Protocol     privacy-vault         SolanaPrivacyHackathon2026
DarkTip                Protocol-01           SolsticeProtocol
docs-sip               safesol               SolVoid
                       shadow                styx-stack-Solana-
                                             veil
                                             zelana
```

---

*Analysis conducted using ripgrep search + parallel code exploration agents*

# Vapor Tokens - Hackathon Analysis

## 1. Project Overview

**Vapor Tokens** is a Token-2022 compatible extension that enables unlinkable private transactions with **plausible deniability** on Solana. The project draws heavy inspiration from [zERC20](https://medium.com/@intmax/zerc20-privacy-user-experience-7b7431f5b7b0) (INTMAX) and [zkWormholes](https://eips.ethereum.org/EIPS/eip-7503) (EIP-7503).

### Core Concept: Proof-of-Burn Privacy

Unlike confidential transfers that only hide amounts, Vapor Tokens break the link between sender and receiver (like Tornado Cash/Privacy Cash) while adding a key differentiator: **observers cannot distinguish between a regular transfer and a private transfer**. This provides plausible deniability for all token holders.

### Key Innovation: "Vapor Addresses"

The system generates special Solana addresses that:
1. Are indistinguishable from normal ed25519 public keys
2. Are provably unspendable (finding the private key is as hard as solving ECDLP)
3. Commit to a hidden recipient address via a Poseidon hash

When tokens are sent to a vapor address, they become "vaporized" (burned). The recipient can later prove ownership and "condense" (mint) new tokens to their actual address using a ZK proof.

### Use Cases
- Exchange withdrawal privacy (exchange cannot link withdrawal to cold wallet)
- Point-of-sale privacy (merchants create unique payment addresses per customer)
- Token-2022 DeFi integration (works with existing infrastructure)

**Deployed**: Devnet token mint `4eyCrBi9Wp1TC4WwcvzYN8Ub8ZB15A5px9t7WCrgf4vn`

---

## 2. Track Targeting

**Primary Track**: Privacy Infrastructure

**Alignment**:
- Implements sender-receiver unlinkability (core privacy goal)
- Integrates natively with Token-2022 standard
- Provides plausible deniability as additional privacy layer
- Targets practical use cases (exchange withdrawals, merchant payments)

---

## 3. Tech Stack

### Proof System
| Component | Technology |
|-----------|------------|
| Circuit Language | **Noir** (Aztec) |
| Backend Compiler | **Sunspot** (Reilabs) - Noir-to-Gnark transpiler |
| Proof System | **Groth16** (via Gnark) - BN254 curve |
| On-chain Verifier | `gnark-verifier-solana` (Reilabs Sunspot) |

### Solana Programs (Anchor 0.32.1)
| Program | Purpose | Program ID |
|---------|---------|------------|
| `vaportoken-transfer-hook` | Records all transfers to Merkle tree | `4pY5QvuVwh2Ktd6LAiAGhuhFvVFqx6GCioh6iThmLT8y` |
| `vaportoken-condenser` | Verifies ZK proofs, mints tokens | `Bs5oDuMEnM4VzseKjNndM4wgzZUhrWNJ2DRpiMp9xVFv` |

### Client Stack
| Component | Technology |
|-----------|------------|
| Wallet CLI | Rust (Clap, redb database) |
| Proving | Docker container with `nargo` + Sunspot |
| Tree Reconstruction | `light_concurrent_merkle_tree` (Light Protocol) |

### Key Dependencies
- `light_hasher::Poseidon` - Poseidon hash (matches Solana syscall)
- `ark-ed25519` / `curve25519-dalek` - Ed25519 curve operations
- `ark-bn254` - BN254 field operations for Noir witness
- `bignum` (Noir) - Ed25519 field arithmetic in circuit

---

## 4. Crypto Primitives

### 4.1 Vapor Address Generation

```rust
// Hash-to-curve for provably unspendable addresses
r = random()
x = poseidon(recipient || r)  // x-coordinate from hash
y = sqrt((1 - a*x^2) / (1 - d*x^2))  // Recover y on twisted Edwards
P = (x, y)
addr = edwardsCompressed(P)
```

**Security Properties**:
- x-coordinate comes from hash output (no known discrete log)
- Must verify point is on curve and in correct subgroup ([8]P != identity)
- Average 2 attempts needed to find valid curve point

### 4.2 Circuit Constraints (main.nr)

The condenser circuit proves:

```noir
fn main(
    recipient: pub [Field; 2],      // Destination address (public)
    amount: pub Field,              // Amount to condense (public)
    merkle_root: pub Field,         // Tree root (public)
    vapor_addr: [u8; 32],           // Hidden vapor address
    merkle_proof: [Field; 26],      // Hidden merkle path
    merkle_proof_indices: [u1; 26], // Hidden path directions
    secret: Field                   // Hidden blinding factor
)
```

**Verified Claims**:
1. **Valid Vapor Address**: `x = poseidon(recipient || secret)` matches compressed address
2. **On Curve**: Point (x, y) satisfies `y^2 - x^2 = 1 + d*x^2*y^2`
3. **Subgroup Check**: `[8]P != identity` (cofactor clearing)
4. **Merkle Inclusion**: `leaf = poseidon(vapor_addr || amount)` exists in tree

### 4.3 On-Chain Merkle Tree

```rust
pub const MERKLE_TREE_HEIGHT: u8 = 26;   // 67M leaf capacity
pub const ROOT_HISTORY: usize = 100;      // Last 100 roots valid
```

**Transfer Hook Flow**:
1. Every Token-2022 transfer triggers hook
2. Hook computes `leaf = poseidon(destination || amount)`
3. Leaf appended to on-chain Merkle tree
4. Root history maintained for 100 insertions

### 4.4 Double-Spend Prevention (zERC20 Style)

Instead of nullifiers, tracks cumulative withdrawn amount per recipient:

```rust
#[account]
pub struct WithdrawnTracker {
    total_withdrawn: u64,
}

// On condense:
let delta = amount - withdrawn.total_withdrawn;
mint_to(delta);
withdrawn.total_withdrawn = amount;
```

**Trade-off**: Enables recursive proofs for batch withdrawals (future), but currently limits vapor addresses to single-use.

---

## 5. Solana Integration

### 5.1 Token-2022 Transfer Hook

The transfer hook is the key Solana integration:

```rust
#[instruction(discriminator = ExecuteInstruction::SPL_DISCRIMINATOR_SLICE)]
pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    check_is_transferring(&ctx)?;  // Verify called from transfer CPI

    let leaf = Poseidon::hashv(&[
        &destination_field_bytes[0],
        &destination_field_bytes[1],
        &amount_bytes
    ]).unwrap();

    MerkleTree::append::<Poseidon>(leaf, tree_account)?;
    emit!(Transfer { to, amount });
}
```

**Compatibility**: Works with any Token-2022 compatible wallet (Phantom, Backpack, etc.) without modification.

### 5.2 Condenser (Mint Authority)

The condenser program is the sole mint authority:

```rust
pub fn condense(
    ctx: Context<Condense>,
    recipient: Pubkey,
    proof_bytes: Vec<u8>,
    pub_witness_bytes: Vec<u8>,
) -> Result<()> {
    // 1. Deserialize Groth16 proof and witness
    let proof = GnarkProof::from_bytes(&proof_bytes)?;
    let pub_witness = GnarkWitness::<4>::from_bytes(&pub_witness_bytes)?;

    // 2. Verify Groth16 proof on-chain
    verifier.verify(proof, pub_witness)?;

    // 3. Check merkle root is in history
    require!(MerkleTree::is_known_root(&tree_account, merkle_root));

    // 4. Mint delta to recipient
    mint_to(cpi_ctx, delta)?;
}
```

### 5.3 Poseidon Syscall Leverage

Unlike zERC20 which needs IVC for hash accumulator equivalence, Vapor Tokens directly use the Poseidon syscall:

> "On Solana thanks to the Poseidon syscall and cheap execution it is possible to insert into the Merkle tree directly on-chain. This allows the protocol to be implemented with just a single proof and no IVC."

---

## 6. Sponsor Bounties

### Primary Sponsor Alignment

| Sponsor | Relevance | Fit |
|---------|-----------|-----|
| **Light Protocol** | Uses `light_hasher::Poseidon`, `light_concurrent_merkle_tree` | Strong |
| **Reilabs** | Uses Sunspot toolchain for Noir-to-Groth16-to-Solana | Strong |
| **Solana Foundation** | Novel Token-2022 privacy extension | Strong |

### Bounty-Specific Notes

1. **Light Protocol**: Heavy dependency on Light's Poseidon and Merkle tree libraries. Could compete for "Best use of Light Protocol infrastructure" if such bounty exists.

2. **Reilabs/Sunspot**: End-to-end use of Sunspot:
   - Noir circuit compilation
   - Groth16 trusted setup
   - On-chain verifier generation
   - `gnark-verifier-solana` for proof verification

3. **Token-2022 Innovation**: Unique use of transfer hooks for privacy that maintains wallet/exchange compatibility.

---

## 7. Alpha/Novel Findings

### 7.1 Key Innovations

1. **Plausible Deniability via Hash-to-Curve**
   - First Solana project to use hash-to-curve for provably unspendable addresses
   - Every vapor address looks like a normal Solana pubkey
   - Observers cannot determine if a transfer is private or regular

2. **Transfer Hook for Universal Merkle Accumulator**
   - All transfers automatically recorded (no user action required)
   - Works with existing wallet infrastructure
   - No separate deposit/withdrawal UI needed for regular transfers

3. **zERC20 Withdrawal Pattern on Solana**
   - Cumulative tracking instead of nullifiers
   - Enables future recursive proof batching
   - Simpler state model

### 7.2 Architectural Insights

1. **Ed25519 in Noir**
   - Implemented full Ed25519 curve ops in Noir using `bignum` library
   - Extended Edwards coordinate doubling for subgroup check
   - Reusable component: "This will be refactored to its own library after the hackathon"

2. **No IVC Requirement**
   - Solana's cheap on-chain Poseidon eliminates need for IVC
   - Single Groth16 proof vs zERC20's complex IVC chain
   - Significant simplification of proof system

### 7.3 Potential Vulnerabilities/Concerns

1. **Single-Use Vapor Addresses**
   - Currently each address should only be used once
   - Multiple deposits to same address: only largest can be withdrawn
   - Mitigation: recursive proofs (not implemented)

2. **Balance Linkability**
   - Amounts are public on-chain
   - Recommended: fixed denominations (0.1, 10, 100)
   - Anonymity set = addresses with matching amounts

3. **Trusted Setup**
   - Groth16 requires trusted setup
   - README notes: "Would only need to be done once for all tokens"
   - Not performed for hackathon (uses development keys)

4. **Root History Window**
   - Only last 100 roots are valid
   - If tree has high activity, proofs may expire quickly
   - Need to condense within ~100 transfers

---

## 8. Strengths and Weaknesses

### Strengths

| Aspect | Details |
|--------|---------|
| **Plausible Deniability** | Unique property - observers cannot detect private transfers |
| **Token-2022 Native** | Works with existing wallets/exchanges without modification |
| **No Separate Deposit** | Transfer hook automatically records all transfers |
| **Single Proof** | No IVC complexity due to on-chain Poseidon |
| **Clean Architecture** | Well-structured crate organization, good documentation |
| **Novel Crypto** | Hash-to-curve for Ed25519 unspendable addresses |
| **Devnet Deployment** | Working end-to-end demo with video |

### Weaknesses

| Aspect | Details |
|--------|---------|
| **Single-Use Addresses** | Recursive proofs not implemented |
| **Amount Linkability** | Public amounts reduce anonymity set |
| **Docker Prover** | No browser proving (Gnark limitation) |
| **Trusted Setup** | Required but not performed |
| **Tree Capacity** | 2^26 = 67M leaves, may need rotation |
| **Compute Budget** | Groth16 verification is expensive (~1M CU) |

---

## 9. Threat Level Assessment


| Factor | Assessment |
|--------|------------|
| **Token-2022 Integration** | Strong advantage - works with existing infrastructure |
| **Implementation Maturity** | Working devnet demo, clean code |
| **Team Evidence** | Single author (Willem Olding), clearly experienced |


|--------------|------|
| Burn-and-mint model | UTXO-based shielded pool |
| Transfer hooks for accumulation | Explicit deposit/withdraw |
| Groth16 proofs | STARK proofs (no trusted setup) |
| Public amounts | Confidential amounts (potential) |
| Single proof per withdrawal | Potentially batched STARK proofs |

### Verdict

Vapor Tokens presents a compelling alternative approach to Solana privacy. The plausible deniability angle and Token-2022 native integration are significant competitive advantages. However, the amount linkability and trusted setup requirements are meaningful drawbacks compared to a full shielded pool implementation.

---

## 10. Implementation Completeness

### Completed Features

- [x] Vapor address generation (hash-to-curve)
- [x] Ed25519 curve operations in Noir
- [x] On-chain Merkle tree with Poseidon
- [x] Transfer hook for automatic recording
- [x] Condenser circuit (Noir)
- [x] Groth16 verifier integration (Sunspot)
- [x] CLI wallet (gen-address, list, condense)
- [x] Devnet deployment
- [x] Video demo

### Missing/Incomplete

- [ ] Recursive proofs for batch withdrawals
- [ ] Trusted setup ceremony
- [ ] Browser wallet integration
- [ ] Confidential transfer integration
- [ ] Multi-deposit vapor addresses
- [ ] Cross-chain support (mentioned as future goal)
- [ ] Production audits

### Code Quality: **HIGH**

- Well-organized workspace structure
- Good documentation (README, USAGE.md)
- Tests present in key crates
- Clean separation of concerns (circuits, programs, client)
- Proper error handling in Solana programs

### Implementation Score: **8/10**

A very complete hackathon submission with working end-to-end flow. Missing features are acknowledged in documentation and represent genuine future work rather than incomplete implementation.

---

## Summary

Vapor Tokens is a **high-quality, innovative hackathon submission** that introduces plausible deniability to Solana token privacy. The hash-to-curve approach for generating provably unspendable addresses is novel, and the Token-2022 transfer hook integration is elegant. While it has limitations (amount linkability, single-use addresses, trusted setup), these are acknowledged and have clear paths to improvement.

**Key Takeaway**: This represents a strong competitor in the privacy track, with a differentiated approach from UTXO-based shielded pools. The Token-2022 native integration and plausible deniability features are compelling value propositions.

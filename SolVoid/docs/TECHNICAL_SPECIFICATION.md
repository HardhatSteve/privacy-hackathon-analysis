#  Technical Specification: SolVoid Protocol

## 1. Cryptographic Primitives

### Hash Function: Poseidon
We utilize the Poseidon hash function over the BN254 scalar field.
- **Poseidon-3:** Used for 2-to-1 hashing in the Merkle Tree and 3-input commitments.
- **Parameters:** $M_{128}$, $128$-bit security level.
- **Implementation:** Optimized for R1CS constraints in Circom and parallel throughput in Rust.

### ZK-Proof System: Groth16
- **Curve:** BN254 (alt_bn128).
- **Prover:** SnarkJS (WASM based for browser compatibility).
- **Verifier:** On-chain Rust implementation/Solana ZK Precompiles.

---

## 2. Merkle Tree Structure

- **Depth:** $d = 20$.
- **Capacity:** $2^{20} = 1,048,576$ leaves.
- **Leaf Structure:** `Hash(secret, nullifier, amount)`.
- **Update Complexity:** $O(d)$ hashes per deposit.

---

## 3. Protocol Flow Detail

### Commitment Generation
Given a secret $s \in \mathbb{F}_r$, a nullifier $n \in \mathbb{F}_r$, and an amount $a \in \mathbb{G}$:
$$C = \text{Poseidon}(s, n, a)$$

### Nullifier Hash
To prevent double spending without revealing which commitment is being spent:
$$H_n = \text{Poseidon}(n, 1)$$

### Proof Statement
The circuit proves that for a public $Root$, $H_n$, $Recipient$, $Relayer$, $Fee$, and $Amount$, there exist private $s$, $n$, and $Path$:
1. $\text{Poseidon}(s, n, Amount) = Leaf$
2. $\text{Poseidon}(n, 1) = H_n$
3. $\text{VerifyMerklePath}(Leaf, Path, Root) = \text{True}$
4. $\text{StatementHash} = \text{Poseidon}(Recipient, Relayer, Fee, Root, Amount, H_n)$

---

## 4. Economic Model

### Fees
- **Protocol Fee:** A percentage (default 0.1%) of shielded volume, accumulated in the treasury.
- **Relayer Fee:** A flat or percentage-based fee paid by the user to the relayer in shielded assets.

### Emergency Multipliers
In times of high network volatility or security concern, the `emergency_multiplier` can be adjusted by the authority to disincentivize withdrawals or deposits.

---

## 5. Performance Benchmarks

| Operation | Environment | Time / Cost |
|-----------|-------------|-------------|
| Deposit (On-chain) | Solana | ~120,000 CU |
| Proof Generation | Browser (M1 Max) | ~1.2 seconds |
| Proof Generation | Mobile (iPhone 13) | ~4.5 seconds |
| Verification (On-chain) | Solana | ~200,000 CU |

---

## 6. Security Analysis

- **Input Sanitization:** All public inputs are cast to scalar field elements $\mathbb{F}_r$. Any input $x \geq r$ is rejected.
- **Nullifier-State Binding:** The nullifier hash is derived from the nullifier used in the commitment, ensuring a unique 1-to-1 mapping between a specific deposit and its spending eligibility.
- **Relayer Theft:** Protected by including the relayer's address in the `StatementHash`. If a relayer attempts to swap the recipient address, the proof verification will fail.

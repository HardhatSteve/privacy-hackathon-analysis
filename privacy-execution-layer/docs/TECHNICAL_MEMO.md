# TECHNICAL MEMO

## Technology Decisions & Rationale

### 1. Blockchain: Solana

**Choice**: Solana mainnet  
**Rationale**:
- High TPS (65,000+) for anonymity set growth
- Low fees (~$0.00025) enable small denominations
- Finality in ~400ms
- Large existing user base

**Alternatives Considered**:
- Ethereum L2s: Higher fees, smaller user base
- Other L1s: Less mature tooling

---

### 2. ZK Framework: Groth16/Circom

**Choice**: Groth16 proofs via Circom  
**Rationale**:
- Smallest proof size (128 bytes)
- Fastest verification (~10ms)
- Extensive documentation
- Proven in production (Tornado Cash)

**Constraints**:
- Requires trusted setup (use Powers of Tau)
- Circuit must be finalized before ceremony

**Alternatives Considered**:
- Plonk: Larger proofs, no trusted setup
- STARKs: Much larger proofs (100KB+)

---

### 3. Hash Function: Poseidon

**Choice**: Poseidon hash  
**Rationale**:
- Designed for ZK circuits
- Minimal constraints (~300 vs ~25000 for SHA256)
- Proven security

**Parameters**:
- Field: BN254 scalar field
- Width: 3 (for 2 inputs)
- Full rounds: 8
- Partial rounds: 57

---

### 4. Merkle Tree: Depth 20

**Choice**: Binary Merkle tree, depth 20  
**Rationale**:
- Capacity: 2^20 = 1,048,576 leaves
- Proof size: 20 * 32 = 640 bytes
- Sufficient for multi-year operation

**Storage**:
- On-chain: Only current root (32 bytes)
- Off-chain: Full tree for proof generation

---

### 5. Denominations

**Choice**: Fixed denominations  
**Values**: 0.1, 1, 10, 100 SOL

**Rationale**:
- Prevents amount correlation attacks
- Separate anonymity sets per denomination
- Covers typical use cases

---

### 6. Fee Structure

**Protocol Fee**: 0.3% (30 basis points)  
**Distribution**: 100% to developer wallet  
**Minimum Fee**: 5000 lamports (dust protection)

**Example**:
| Withdrawal | Fee |
|------------|-----|
| 0.1 SOL | 0.0003 SOL |
| 1 SOL | 0.003 SOL |
| 10 SOL | 0.03 SOL |
| 100 SOL | 0.3 SOL |

---

### 7. Compute Unit Budget

**Target**: <200,000 CU for withdraw  
**Breakdown**:
- Groth16 verification: ~150,000 CU
- Merkle root check: ~5,000 CU
- Nullifier check: ~10,000 CU
- Token transfer: ~5,000 CU
- Overhead: ~30,000 CU

---

### 8. Account Structure

```
PoolState (PDA)
├── merkle_root: [u8; 32]
├── nullifier_filter: [u8; 8192]  // Bloom filter
├── deposit_count: u64
├── token_mint: Pubkey
├── token_vault: Pubkey
└── protocol_fee_bps: u16

Commitments (PDA per pool)
└── leaves: Vec<[u8; 32]>

NullifierRegistry (PDA per pool)
└── Set<[u8; 32]>
```

---

### 9. Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.75+ | Program development |
| Anchor | 0.29+ | Solana framework |
| Circom | 2.0+ | ZK circuit compiler |
| SnarkJS | 0.7+ | Proof generation |
| Node.js | 20+ | Tests and CLI |

---

**Document Version**: v1.0  
**Last Updated**: 2026-01-21

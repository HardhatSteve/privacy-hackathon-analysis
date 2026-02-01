# ZORB Privacy Protocol

**Free private transfers on Solana using an indexed merkle tree that eliminates per-transaction rent costs.**

[![Solana Privacy Hack 2026](https://img.shields.io/badge/Solana%20Privacy%20Hack-2026-00D1FF)](https://solana.com/privacyhack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## The Problem

Every Solana privacy protocol today stores nullifiers (spent-note markers) as individual PDAs:

| Transactions | PDA Rent Locked | At $150/SOL |
|--------------|-----------------|-------------|
| 100 | 0.089 SOL | $13.35 |
| 10,000 | 8.9 SOL | $1,335 |
| 1,000,000 | 890 SOL | $133,500 |

This rent is locked **forever**. It doesn't scale.

## Our Solution: Indexed Merkle Tree

ZORB stores 67 million nullifiers in a single ~1KB account using an Aztec-style indexed merkle tree.

### How It Works

1. **Sorted Linked List**: Tree stores nullifiers in sorted order with "next" pointers
2. **Non-Membership Proofs**: To prove a nullifier hasn't been spent, find the "low element" where `low.value < nullifier < low.nextValue`
3. **Groth16 Verification**: ZK proof verifies the low element exists in tree and the gap proves the nullifier was not present
4. **Epoch Snapshots**: Historical proofs work while tree continues growing; old PDAs can be closed for rent reclamation

**Result**: Zero marginal cost per transaction. Infinite scalability.

## Deployed Programs (Devnet)

| Program | Address | Purpose |
|---------|---------|---------|
| Shielded Pool | [`GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6`](https://explorer.solana.com/address/GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6?cluster=devnet) | Core privacy operations, indexed merkle tree |
| Token Pool | [`7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S`](https://explorer.solana.com/address/7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S?cluster=devnet) | SPL token vault management |
| Unified SOL Pool | [`3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf`](https://explorer.solana.com/address/3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf?cluster=devnet) | Multi-LST yield-bearing shielded SOL |

## ZK Circuits

| Circuit | Constraints | Purpose |
|---------|-------------|---------|
| `transaction4` | ~35,620 | 4-input/4-output private transfers |
| `nullifierNonMembership4` | ~29,104 | Prove 4 nullifiers not in tree |
| `nullifierBatchInsert4/16/64` | ~12,000+ | Batch nullifier insertion proofs |
| `shieldedClaim` | ~8,500 | Private reward claims |
| `shieldedDeploy` | ~12,000 | Private deployment operations |

All circuits use Groth16 proving with BN254 (alt_bn128) curve for on-chain verification.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZORB Protocol                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Shielded     │    │ Token        │    │ Unified SOL      │  │
│  │ Pool         │◄───│ Pool         │◄───│ Pool             │  │
│  │              │    │              │    │ (Multi-LST)      │  │
│  └──────┬───────┘    └──────────────┘    └──────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │     Indexed Merkle Tree              │                      │
│  │     ────────────────────             │                      │
│  │     • Height: 26 (67M leaves)        │                      │
│  │     • Sorted linked list             │                      │
│  │     • ZK non-membership proofs       │                      │
│  │     • Epoch-based snapshots          │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │     Groth16 Verifier (alt_bn128)     │                      │
│  │     ────────────────────────────     │                      │
│  │     • Real pairing checks            │                      │
│  │     • Not a mock verifier            │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Innovations

### 1. Zero Rent Costs
Unlike PDA-per-nullifier approaches, ZORB's indexed merkle tree stores all nullifiers in a single account. The marginal cost per transaction approaches zero.

### 2. Two-Layer Security
- **Layer 1 (ZK Proof)**: Proves nullifier not in the epoch's merkle tree root
- **Layer 2 (PDA Check)**: Checks nullifier not in pending insertions since epoch snapshot

No gaps. No race conditions. No double-spends.

### 3. Batch Proofs
Amortize verification costs with batch proofs for 4, 16, or 64 nullifiers per ZK proof.

### 4. Yield While Shielded
The Unified SOL Pool supports multiple liquid staking tokens (LSTs). Earn staking rewards without unshielding.

### 5. Epoch-Based Rent Reclamation
Old nullifier PDAs can be closed after their epoch expires, returning rent to operators.

## Repository Structure

```
zorb/
├── programs/
│   ├── shielded-pool/      # Core privacy program
│   │   ├── src/
│   │   │   ├── indexed_merkle_tree.rs   # IMT implementation
│   │   │   ├── groth16.rs               # ZK proof verification
│   │   │   └── instructions/            # Program instructions
│   │   └── tests/                       # Integration tests
│   ├── token-pool/         # SPL token vaults
│   └── unified-sol-pool/   # Multi-LST support
└── circuits/
    ├── transaction*.circom              # Private transfer circuits
    ├── nullifierNonMembership4.circom   # Non-membership proofs
    ├── nullifierBatchInsert*.circom     # Batch insertion proofs
    └── lib/                             # Shared circuit templates
```

## Try It

- **Live Demo**: [zorb.cash/stress-test](https://zorb.cash/stress-test)
- **Explorer**: View deployed programs on [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet)

## Performance

- **Finality**: 400ms (1875x faster than Zcash's 12.5 minutes)
- **Storage Cost**: ~$0 marginal cost per transaction
- **Capacity**: 67 million nullifiers per tree

## Comparison

| Feature | ZORB | Competitors |
|---------|------|-------------|
| Nullifier Storage | Indexed Merkle Tree | Individual PDAs |
| Cost per Transaction | ~$0 | ~$0.13 locked forever |
| Max Capacity | 67 million | Rent-limited |
| Batch Proofs | 4/16/64 | None |
| Yield While Shielded | Yes | No |
| Rent Reclamation | Yes (epoch-based) | No |

## Building

### Programs (Rust/Anchor)

```bash
cd programs/shielded-pool
anchor build
anchor test
```

### Circuits (Circom)

```bash
cd circuits
circom nullifierNonMembership4.circom --r1cs --wasm --sym
snarkjs groth16 setup nullifierNonMembership4.r1cs pot26_final.ptau circuit.zkey
```

## Security

- **Real Groth16 Verification**: Full alt_bn128 pairing checks, not mock verifiers
- **Formal Specification**: 2000+ line protocol specification document
- **Two-Layer Coverage**: ZK + PDA ensures no double-spend windows

## License

MIT License - see [LICENSE](./LICENSE)

---

**Privacy should be free. ZORB makes it possible.**

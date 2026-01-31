# Developer Guide

## Quick Start

### Prerequisites
- Rust 1.75+
- Solana CLI 1.17+
- Anchor 0.29+
- Node.js 20+

### Installation

```bash
git clone https://github.com/privacy-execution-layer/protocol
cd protocol
npm install
```

### Build

```bash
anchor build
```

### Test

```bash
./scripts/test_all.sh
```

### Deploy to Devnet

```bash
./scripts/deploy_devnet.sh
```

---

## User Flow

### 1. Generate Credentials (Off-chain)

```javascript
import { poseidon } from 'circomlibjs';

const secret = randomBytes(32);
const nullifier = randomBytes(32);
const commitment = poseidon([secret, nullifier]);
const nullifierHash = poseidon([nullifier]);
```

### 2. Deposit

```javascript
await program.methods
  .deposit(commitment)
  .accounts({
    pool: poolAddress,
    depositor: wallet.publicKey,
    depositorToken: tokenAccount,
    tokenVault: vaultPDA,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

### 3. Generate Proof (Off-chain)

```javascript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  {
    root: merkleRoot,
    nullifierHash: nullifierHash,
    secret: secret,
    nullifier: nullifier,
    pathElements: merkleProof.elements,
    pathIndices: merkleProof.indices,
  },
  "withdraw.wasm",
  "withdraw_final.zkey"
);
```

### 4. Withdraw

```javascript
await program.methods
  .withdraw(
    proofBytes,
    merkleRoot,
    nullifierHash
  )
  .accounts({
    pool: poolAddress,
    recipientToken: recipientTokenAccount,
    developerToken: devTokenAccount,
    tokenVault: vaultPDA,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Relayer    │────▶│   Solana    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │ 1. Gen proof       │ 3. Submit tx       │
      │ 2. Encrypt         │                    │
      └────────────────────┴────────────────────┘
```

---

## Security Best Practices

1. **Keep secrets offline** - Never send secret/nullifier to any server
2. **Use fresh addresses** - Withdraw to new addresses only
3. **Wait before withdrawing** - Larger anonymity set = better privacy
4. **Use multiple relayers** - Prevents censorship
5. **Verify circuit** - Check you're using official circuits

---

## Common Issues

### "NullifierAlreadySpent"
Your commitment was already withdrawn. Each can only be used once.

### "InvalidMerkleRoot"
The merkle root changed. Regenerate your proof with current root.

### "InvalidProof"
Proof verification failed. Check your inputs match the circuit.

---

## Testing Locally

```bash
# Start local validator
solana-test-validator

# Deploy
anchor deploy

# Run tests
anchor test
```

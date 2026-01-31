# Noir ZK Integration

AuroraZK uses [Noir](https://noir-lang.org/) for zero-knowledge proofs that enable private order validation.

---

## Circuits

### 1. Commitment Helper

**Location**: `circuits/commitment_helper/src/main.nr`

Generates Pedersen hash commitments for order data:

```noir
use std::hash::pedersen_hash;

fn main(price: Field, size: Field, nonce: Field) -> pub Field {
    pedersen_hash([price, size, nonce])
}
```

The commitment is stored on-chain. Actual values stay private.

---

### 2. Range Proof

**Location**: `circuits/range_proof/src/main.nr`

Proves order parameters are valid WITHOUT revealing them:

```noir
fn main(
    // Private inputs (hidden)
    price: Field,
    size: Field,
    nonce: Field,
    
    // Public inputs (bounds)
    min_price: pub Field,
    max_price: pub Field,
    min_size: pub Field,
    max_size: pub Field
) -> pub Field {
    let commitment = pedersen_hash([price, size, nonce]);
    
    // Range checks
    assert(price as u64 >= min_price as u64);
    assert(price as u64 <= max_price as u64);
    assert(size as u64 >= min_size as u64);
    assert(size as u64 <= max_size as u64);
    
    commitment
}
```

**What this proves:**
- Price is within valid range
- Size is within valid range
- Prover knows the values that hash to the commitment

**What stays hidden:**
- Actual price
- Actual size
- Nonce

---

## Build & Test

```bash
# Install Noir
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup

# Compile
cd circuits/range_proof
nargo compile

# Test
nargo test

# Generate proof
nargo prove

# Verify
nargo verify
```

---

## Frontend Usage

```typescript
// app/lib/noir-proofs.ts
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';

async function generateRangeProof(price, size, nonce, bounds) {
  const circuit = await fetch('/circuits/range_proof.json').then(r => r.json());
  const backend = new BarretenbergBackend(circuit);
  const noir = new Noir(circuit, backend);
  
  const { proof, publicInputs } = await noir.generateProof({
    price, size, nonce, ...bounds
  });
  
  return { proof, commitment: publicInputs[0] };
}
```

---

## Roadmap

| Feature | Status |
|---------|--------|
| Commitment generation | ✅ Complete |
| Range proofs | ✅ Complete |
| Client-side proof generation | ✅ Complete |
| On-chain verification (Sunspot) | 🔜 Planned |
| Match validity proofs | 🔜 Planned |

---

## Resources

- [Noir Documentation](https://noir-lang.org/docs/)
- [Sunspot - Noir Verifier for Solana](https://github.com/reilabs/sunspot)
- [Noir Examples](https://github.com/noir-lang/noir-examples)

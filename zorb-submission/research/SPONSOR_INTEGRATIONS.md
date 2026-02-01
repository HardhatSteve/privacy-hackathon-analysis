# Zorb Privacy System - Sponsor Integrations

This document details how Zorb integrates with hackathon sponsor technologies.

---

## Helius Integration ($5,000 Bounty)

**Status:** Integrated
**Integration Level:** Full RPC provider support

### How Zorb Uses Helius

Zorb's infrastructure uses Helius as a premium RPC provider for:

1. **Frontend Apps** (zorb.cash, zorb.supply)
   - User wallet connections
   - Transaction submission
   - Real-time balance queries

2. **Backend Workers** (Cloudflare Workers)
   - Indexer worker - Event indexing and state synchronization
   - Relayer worker - Transaction relay and proof verification
   - Crank workers - Nullifier tree advancement, LST harvesting

### Configuration

**Frontend (Vite apps):**
```env
VITE_SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

**Workers (Cloudflare):**
```env
SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

### Files Modified

- `app/apps/zorb-cash/src/lib/network-config.ts` - Helius preset in UI
- `app/apps/zorb-cash/.env.local.example` - Configuration documentation
- `app/apps/miner-dapp/.env.local.example` - Configuration documentation
- `app/apps/indexer-worker/.env.example` - Worker configuration
- `app/apps/zorb-relayer-worker/.env.example` - Worker configuration

### Evidence

To verify Helius usage:
1. Open browser DevTools → Network tab
2. Filter by "helius-rpc.com"
3. Observe RPC calls for: getBalance, getAccountInfo, sendTransaction, etc.

---

## QuickNode Integration ($3,000 Bounty)

**Status:** Integrated
**Integration Level:** Full RPC provider support (fallback)

### How Zorb Uses QuickNode

QuickNode serves as a backup RPC provider for redundancy and load balancing:

1. **User-selectable in Settings**
   - Users can switch to QuickNode via network settings panel
   - Useful when primary RPC has issues

2. **Worker Fallback**
   - Configurable as alternative endpoint in worker secrets
   - Enables high availability for critical operations

### Configuration

**Frontend:**
```env
VITE_SOLANA_RPC_ENDPOINT=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_TOKEN/
```

**Workers:**
```env
SOLANA_RPC_ENDPOINT=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_TOKEN/
```

### Files Modified

- `app/apps/zorb-cash/src/lib/network-config.ts` - QuickNode preset added
- All `.env.example` files updated with QuickNode documentation

---

## Light Protocol / Track 03 ($18,000)

**Status:** Planned
**Integration Level:** Design complete, implementation ready

### Integration Design

Light Protocol's ZK compression can reduce Zorb's on-chain costs by compressing:

1. **Nullifier Storage** (Currently PDAs)
   - Each nullifier currently costs ~0.002 SOL rent
   - With Light compression: ~80% cost reduction

2. **Future: Note Metadata**
   - Commitment tree leaf data
   - Epoch state snapshots

### Implementation Files

```
zore/programs/shielded-pool/src/instructions/compressed_nullifier.rs (new)
app/packages/circuits/src/nullifier/compressed-client.ts (new)
```

### Code Sketch (Rust)

```rust
use light_sdk::{
    compressed_account::{CompressedAccount},
    merkle_context::MerkleContext,
};

pub fn create_compressed_nullifier(
    ctx: Context<CreateCompressedNullifier>,
    nullifier_hash: [u8; 32],
    merkle_context: MerkleContext,
) -> Result<()> {
    // Verify non-existence via Light's proof system
    verify_compressed_account_non_membership(&merkle_context, &nullifier_hash)?;

    // Create compressed account
    light_sdk::create_compressed_account(
        ctx.accounts.light_system_program.to_account_info(),
        &nullifier_hash,
        &merkle_context,
    )?;

    Ok(())
}
```

### Client Changes (TypeScript)

```typescript
import { createRpc, Rpc } from "@lightprotocol/stateless.js";

// Replace standard RPC with Light-aware RPC
const rpc: Rpc = createRpc(RPC_ENDPOINT, RPC_ENDPOINT, RPC_ENDPOINT);

// Fetch compressed nullifier state
const nullifierProof = await rpc.getCompressedAccountProof(nullifierAddress);
```

---

## Arcium Integration ($10,000)

**Status:** Planned
**Integration Level:** Design complete

### Use Case: Private Relayer Batching

Current architecture reveals transaction details to relayer. With Arcium:

```
Current:
  User → Relayer → [sees tx details] → Solana

With Arcium:
  User → Encrypted Intent → MXE Batch → [shuffled] → Relayer → Solana
```

### Benefits

1. **Privacy**: Relayer cannot link withdrawal recipients
2. **Batching**: Multiple transactions processed atomically
3. **Shuffling**: Output order randomized

---

## Inco Lightning Integration ($6,000)

**Status:** Planned
**Integration Level:** Design complete

### Use Case: Private Pool Statistics

Encrypt sensitive pool metadata:

```rust
#[account]
pub struct GlobalConfig {
    // Public stats
    pub total_deposits: u64,

    // Private stats (only authority can read)
    #[private(access = authority)]
    pub encrypted_tvl: EncryptedU128,

    // Auditor access (selective disclosure)
    #[private(access = auditor)]
    pub encrypted_audit_data: Option<EncryptedBytes>,
}
```

---

## Summary

| Sponsor | Prize | Status | Effort |
|---------|-------|--------|--------|
| Helius | $5,000 | Integrated | Complete |
| QuickNode | $3,000 | Integrated | Complete |
| Light Protocol | $18,000 | Designed | 3-5 days |
| Arcium | $10,000 | Designed | 2-3 days |
| Inco | $6,000 | Designed | 2-3 days |

**Total Addressable:** $42,000+

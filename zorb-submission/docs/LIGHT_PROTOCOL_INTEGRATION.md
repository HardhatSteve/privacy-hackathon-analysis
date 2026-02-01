# Light Protocol ZK Compression Integration for Zorb

**Prize Pool:** $18,000 (Track 03: Open Track)
**Estimated Effort:** 3-5 days
**Status:** Design Complete, Ready for Implementation

---

## Executive Summary

Light Protocol's ZK Compression can significantly reduce Zorb's on-chain storage costs while maintaining the same security guarantees. This integration targets nullifier storage, which currently consumes ~0.002 SOL per transaction in PDA rent.

**Cost Reduction Estimate:**
- Current: 0.002 SOL per nullifier PDA
- With Light: ~0.0004 SOL per compressed account (~80% reduction)
- At 10,000 transactions: 20 SOL → 4 SOL saved

---

## Current Architecture

### Nullifier Storage (PDA-based)

```
zore/programs/shielded-pool/src/state/nullifier.rs

┌─────────────────────────────────────────────┐
│ Nullifier PDA (64 bytes on-chain)           │
├─────────────────────────────────────────────┤
│ authority: Pubkey (32 bytes)                │
│ pending_index: u64 (8 bytes)                │
│ inserted_epoch: u64 (8 bytes)               │
│ bump: u8 (1 byte)                           │
│ _padding: [u8; 7] (7 bytes)                 │
└─────────────────────────────────────────────┘
```

**Current Flow:**
1. `ExecuteTransact` creates Nullifier PDA with sequential `pending_index`
2. `NullifierBatchInsert` sets `inserted_epoch` when adding to indexed tree
3. `CloseInsertedNullifier` closes PDA after it's been frozen in all provable epochs

### Indexed Merkle Tree

The nullifier system uses an indexed Merkle tree for non-membership proofs:

```
zore/programs/shielded-pool/src/state/nullifier_tree.rs

- 4-level tree (16 leaves per epoch)
- Epochs advance when tree fills
- Non-membership proof required for each transaction
- ~45,000 constraints per batch insert proof
```

---

## Proposed Light Protocol Integration

### Phase 1: Compressed Nullifier Accounts

Replace PDA-based nullifiers with Light Protocol compressed accounts.

**New Dependencies:**
```toml
# zore/programs/shielded-pool/Cargo.toml
[dependencies]
light-sdk = { version = "0.11", features = ["anchor"] }
light-system-program = "0.11"
light-compressed-token = "0.11"  # If needed for token pool
```

**New Module Structure:**
```
zore/programs/shielded-pool/src/
├── instructions/
│   ├── compressed_nullifier/           # NEW
│   │   ├── mod.rs
│   │   ├── create_compressed_nullifier.rs
│   │   └── verify_nullifier_non_existence.rs
│   └── nullifier_tree/                 # EXISTING (kept for migration)
```

### Implementation: Create Compressed Nullifier

```rust
// zore/programs/shielded-pool/src/instructions/compressed_nullifier/create.rs

use light_sdk::{
    compressed_account::{CompressedAccount, CompressedAccountData},
    merkle_context::MerkleContext,
    program::LightSystemProgram,
};
use pinocchio::prelude::*;

/// Compressed nullifier data layout (32 bytes - down from 64)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(C)]
pub struct CompressedNullifierData {
    /// The nullifier hash itself (used as address seed)
    pub nullifier_hash: [u8; 32],
}

/// Create a compressed nullifier instead of a PDA
pub fn create_compressed_nullifier(
    ctx: Context<CreateCompressedNullifier>,
    nullifier_hash: [u8; 32],
    merkle_context: MerkleContext,
) -> Result<()> {
    // Step 1: Verify nullifier doesn't already exist
    // Light Protocol provides built-in non-membership proofs
    light_sdk::verify_non_membership(
        &merkle_context,
        &nullifier_hash,
        ctx.accounts.light_system_program.key,
    )?;

    // Step 2: Prepare compressed account data
    let nullifier_data = CompressedNullifierData {
        nullifier_hash,
    };

    // Step 3: Create compressed account via Light CPI
    let seeds = &[b"compressed_nullifier", nullifier_hash.as_ref()];

    light_sdk::create_compressed_account(
        ctx.accounts.light_system_program.to_account_info(),
        ctx.accounts.registered_program_pda.to_account_info(),
        ctx.accounts.noop_program.to_account_info(),
        ctx.accounts.account_compression_program.to_account_info(),
        ctx.accounts.merkle_tree.to_account_info(),
        ctx.accounts.nullifier_queue.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.cpi_signer.to_account_info(),
        seeds,
        nullifier_data.try_to_vec()?,
        &merkle_context,
    )?;

    // Step 4: Emit event for indexer
    emit!(CompressedNullifierCreated {
        nullifier_hash,
        slot: Clock::get()?.slot,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CreateCompressedNullifier<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Light Protocol system program
    pub light_system_program: Program<'info, LightSystemProgram>,

    /// SPL Account Compression program
    /// CHECK: Validated by Light SDK
    pub account_compression_program: AccountInfo<'info>,

    /// SPL Noop program for logging
    /// CHECK: Validated by Light SDK
    pub noop_program: AccountInfo<'info>,

    /// Registered program PDA for this program
    /// CHECK: Validated by Light SDK
    pub registered_program_pda: AccountInfo<'info>,

    /// Merkle tree for compressed accounts
    #[account(mut)]
    /// CHECK: Validated by Light SDK
    pub merkle_tree: AccountInfo<'info>,

    /// Queue for nullifier operations
    #[account(mut)]
    /// CHECK: Validated by Light SDK
    pub nullifier_queue: AccountInfo<'info>,

    /// CPI signer for Light operations
    /// CHECK: Validated by Light SDK
    pub cpi_signer: AccountInfo<'info>,
}

#[event]
pub struct CompressedNullifierCreated {
    pub nullifier_hash: [u8; 32],
    pub slot: u64,
}
```

### Client SDK Changes

```typescript
// app/packages/circuits/src/nullifier/compressed-client.ts

import { Rpc, createRpc, bn } from "@lightprotocol/stateless.js";
import { PublicKey, Connection } from "@solana/web3.js";

export interface CompressedNullifierClient {
  rpc: Rpc;

  /**
   * Check if a nullifier exists in the compressed state
   */
  checkNullifierExists(nullifierHash: Uint8Array): Promise<boolean>;

  /**
   * Get proof for nullifier non-existence (for transaction verification)
   */
  getNonMembershipProof(nullifierHash: Uint8Array): Promise<NonMembershipProof | null>;

  /**
   * Get validity proof for inclusion in transaction
   */
  getValidityProof(nullifierHashes: Uint8Array[]): Promise<ValidityProof>;
}

export function createCompressedNullifierClient(
  rpcEndpoint: string,
  compressionEndpoint?: string
): CompressedNullifierClient {
  // Light Protocol uses a special RPC that supports compressed account queries
  const lightRpc = createRpc(
    rpcEndpoint,
    compressionEndpoint ?? rpcEndpoint,
    compressionEndpoint ?? rpcEndpoint
  );

  return {
    rpc: lightRpc,

    async checkNullifierExists(nullifierHash: Uint8Array): Promise<boolean> {
      try {
        // Query compressed account by address derivation
        const addressSeed = deriveNullifierAddress(nullifierHash);
        const compressedAccount = await lightRpc.getCompressedAccount(
          bn(addressSeed)
        );
        return compressedAccount !== null;
      } catch (error) {
        console.error("Error checking nullifier:", error);
        return false;
      }
    },

    async getNonMembershipProof(nullifierHash: Uint8Array): Promise<NonMembershipProof | null> {
      try {
        const addressSeed = deriveNullifierAddress(nullifierHash);

        // Light RPC provides non-membership proofs automatically
        const proof = await lightRpc.getValidityProof([bn(addressSeed)]);

        if (proof.compressedProof) {
          return {
            root: proof.root,
            proof: proof.compressedProof,
            leafIndex: proof.leafIndex,
          };
        }
        return null;
      } catch {
        return null;
      }
    },

    async getValidityProof(nullifierHashes: Uint8Array[]): Promise<ValidityProof> {
      const addressSeeds = nullifierHashes.map(h => bn(deriveNullifierAddress(h)));
      return lightRpc.getValidityProof(addressSeeds);
    }
  };
}

function deriveNullifierAddress(nullifierHash: Uint8Array): Uint8Array {
  // Derive address seed for compressed account lookup
  // This should match the seeds used in the program
  return hashWithPrefix("compressed_nullifier", nullifierHash);
}

interface NonMembershipProof {
  root: Uint8Array;
  proof: Uint8Array;
  leafIndex: number;
}

interface ValidityProof {
  root: Uint8Array;
  compressedProof: Uint8Array;
  leafIndex: number;
}
```

### Migration Strategy

**Hybrid Approach:** Support both legacy PDA and compressed nullifiers during transition.

```typescript
// app/packages/circuits/src/nullifier/hybrid-service.ts

export class HybridNullifierService {
  constructor(
    private legacyService: LegacyNullifierService,
    private compressedService: CompressedNullifierClient,
    private useCompression: boolean = true  // Feature flag
  ) {}

  /**
   * Check if nullifier is spent (either system)
   */
  async checkNullifierSpent(nullifierHash: Uint8Array): Promise<boolean> {
    // Check both systems during migration period
    const [legacySpent, compressedSpent] = await Promise.all([
      this.legacyService.checkPdaExists(nullifierHash),
      this.compressedService.checkNullifierExists(nullifierHash),
    ]);

    return legacySpent || compressedSpent;
  }

  /**
   * Create nullifier in appropriate system
   */
  async createNullifier(
    nullifierHash: Uint8Array
  ): Promise<TransactionInstruction[]> {
    if (this.useCompression) {
      return this.compressedService.createCompressedNullifier(nullifierHash);
    }
    return this.legacyService.createPdaNullifier(nullifierHash);
  }

  /**
   * Get proof for transaction submission
   */
  async getProofForTransaction(nullifierHash: Uint8Array): Promise<NullifierProof> {
    // For compressed: include Light validity proof
    // For legacy: include Merkle non-membership proof
    if (this.useCompression) {
      const proof = await this.compressedService.getNonMembershipProof(nullifierHash);
      return { type: "compressed", proof };
    }
    const proof = await this.legacyService.getNonMembershipProof(nullifierHash);
    return { type: "legacy", proof };
  }
}
```

---

## Phase 2: Compressed Commitment Tree (Future)

After nullifier compression is stable, consider compressing:

1. **Commitment Tree Leaves** - Currently stored in indexed tree state
2. **Epoch Root History** - Historical roots for proof verification
3. **Note Metadata** - If any off-chain note metadata is stored on-chain

---

## Testing Plan

### Unit Tests

```rust
// zore/programs/shielded-pool/tests/compressed_nullifier_test.rs

#[test]
fn test_create_compressed_nullifier() {
    // 1. Initialize Light Protocol test environment
    // 2. Create compressed nullifier
    // 3. Verify it exists in compressed state
    // 4. Verify non-membership proof fails for existing nullifier
}

#[test]
fn test_compressed_nullifier_double_spend_prevention() {
    // 1. Create nullifier
    // 2. Attempt to create same nullifier again
    // 3. Verify transaction fails
}

#[test]
fn test_legacy_and_compressed_coexistence() {
    // 1. Create legacy PDA nullifier
    // 2. Create compressed nullifier
    // 3. Verify both are detected by hybrid service
}
```

### Integration Tests

```typescript
// app/packages/circuits/tests/compressed-nullifier.test.ts

describe("Compressed Nullifier Integration", () => {
  it("should create compressed nullifier on-chain", async () => {
    // 1. Connect to Light test validator
    // 2. Submit transaction with compressed nullifier
    // 3. Verify nullifier exists via RPC
  });

  it("should include validity proof in transaction", async () => {
    // 1. Get validity proof for nullifier
    // 2. Include in transaction
    // 3. Verify on-chain verification passes
  });
});
```

---

## Deployment Checklist

### Prerequisites

- [ ] Light Protocol deployed on target network (devnet/mainnet)
- [ ] Light RPC endpoint available
- [ ] Compressed account Merkle trees initialized

### Program Deployment

1. [ ] Add Light SDK dependencies to Cargo.toml
2. [ ] Implement compressed nullifier instruction
3. [ ] Deploy updated program to devnet
4. [ ] Initialize Light Protocol state accounts
5. [ ] Test end-to-end flow

### Client Deployment

1. [ ] Add @lightprotocol/stateless.js to package.json
2. [ ] Implement compressed nullifier client
3. [ ] Integrate hybrid service
4. [ ] Deploy updated SDK

### Migration

1. [ ] Deploy with feature flag (legacy only)
2. [ ] Enable hybrid mode (read both, write compressed)
3. [ ] Monitor for issues
4. [ ] Full migration (compressed only)
5. [ ] Deprecate legacy PDA creation

---

## Evidence for Hackathon Submission

### Screenshots/Artifacts Needed

1. **Cost Comparison**
   - Screenshot of legacy nullifier rent cost
   - Screenshot of compressed nullifier cost
   - Calculated savings at scale

2. **Transaction Logs**
   - Successful compressed nullifier creation
   - Light Protocol CPI invocation
   - Event emission

3. **RPC Queries**
   - Compressed account lookup
   - Validity proof retrieval
   - Non-membership verification

4. **Code Integration**
   - Cargo.toml with Light dependencies
   - Compressed nullifier instruction
   - Client SDK integration

---

## Resources

- [Light Protocol Documentation](https://www.zkcompression.com/)
- [Light SDK GitHub](https://github.com/lightprotocol/light-protocol)
- [@lightprotocol/stateless.js](https://www.npmjs.com/package/@lightprotocol/stateless.js)
- [ZK Compression Devnet](https://devnet.helius-rpc.com/?api-key=<key>) - Helius supports Light RPC

---

## ROI Analysis

| Metric | Value |
|--------|-------|
| Implementation Effort | 3-5 days |
| Prize Pool | $18,000 |
| Cost Savings per Tx | ~0.0016 SOL |
| Break-even (at $100/SOL) | ~1,125 transactions |
| Competitive Advantage | High - Novel integration |

# Zorb Sponsor Bounty Eligibility & Integration Guide

**Generated**: 2026-02-01
**Total Addressable Prize Pool**: $57,000 (realistic) / $116,000+ (theoretical)

---

## Executive Summary

| Priority | Sponsor | Prize | Effort | Status |
|----------|---------|-------|--------|--------|
| 🟢 **DO NOW** | Helius | $5,000 | 30 min | RPC config |
| 🟢 **DO NOW** | Quicknode | $3,000 | 15 min | RPC fallback |
| 🟡 **HIGH ROI** | Light Protocol | $18,000 | 3-5 days | ZK compression |
| 🟡 **CONSIDER** | Arcium | $10,000 | 2-3 days | MPC batching |
| 🟡 **CONSIDER** | Inco Lightning | $6,000 | 2-3 days | Encrypted metadata |
| ⚠️ **LATER** | Aztec/Noir | $10,000 | 1-2 weeks | Circuit porting |
| ❌ **SKIP** | Privacy Cash | $15,000 | N/A | Competing product |
| ❌ **SKIP** | ShadowWire | $15,000 | N/A | Different crypto approach |

---

## Sponsor Bounty Summary (Total Pool: $116,000+)

### Main Tracks ($48,000)

| Track | Prize | Zorb Eligibility |
|-------|-------|------------------|
| **Track 01 - Private Payments** | $15,000 | ✅ **STRONG** - Core shielded pool |
| **Track 02 - Privacy Tooling** | $15,000 | ⚠️ MODERATE - SDK/client focus |
| **Track 03 - Open Track (Light Protocol)** | $18,000 | ✅ **STRONG** if integrated |

### Sponsor Bounties - Full Eligibility Matrix

| Sponsor | Prize | Eligibility | Effort | Integration Path |
|---------|-------|-------------|--------|------------------|
| **Privacy Cash** | $15,000 | ❌ CONFLICT | N/A | Competing product |
| **Radr/ShadowWire** | $15,000 | ❌ CONFLICT | N/A | Different approach (Bulletproofs) |
| **Arcium** | $10,000 | ✅ FEASIBLE | 🟡 2-3 days | Encrypted intent matching |
| **Aztec/Noir** | $10,000 | ⚠️ POSSIBLE | 🔴 1-2 weeks | Port Circom → Noir |
| **Anoncoin** | $10,000 | ❌ NO | N/A | Token creation focus |
| **Inco Lightning** | $6,000 | ✅ FEASIBLE | 🟡 2-3 days | Encrypted pool metadata |
| **Helius** | $5,000 | ✅ **EASY** | 🟢 30 min | RPC endpoint config |
| **MagicBlock** | $5,000 | ⚠️ LOW | 🔴 1 week | TEE prover architecture |
| **SilentSwap** | $5,000 | ❌ NO | N/A | Cross-chain focus |
| **Starpay** | $3,500 | ❌ NO | N/A | Payment cards |
| **Quicknode** | $3,000 | ✅ **EASY** | 🟢 15 min | RPC endpoint config |
| **PNP Exchange** | $2,500 | ❌ NO | N/A | AI prediction markets |
| **Range** | $1,500 | ⚠️ LOW | 🟡 MEDIUM | Compliance screening |
| **Encrypt.trade** | $1,000 | ❌ NO | N/A | Education content |

---

## TIER 1: Recommended Integrations (Do This)

### 1. Helius ($5,000) - IMMEDIATE

**Requirement**: Use Helius RPC infrastructure

**Integration Steps**:
```
Files to modify:
- app/.env.devnet, app/.env.mainnet
- app/apps/zorb-cash/src/lib/connection.ts
- app/apps/zorb-relayer-worker/src/config.ts
- app/apps/nullifier-crank-worker/src/config.ts
```

**Code Changes**:
```typescript
// Before (in connection factory)
const connection = new Connection(clusterApiUrl(cluster));

// After
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const connection = new Connection(
  `https://${cluster}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
);
```

**Effort**: 30 minutes
**Evidence Required**: Helius dashboard screenshot showing API usage

---

### 2. Quicknode ($3,000) - IMMEDIATE

**Requirement**: Open-source privacy tooling using Quicknode RPC

**Integration**: Same pattern as Helius, use as fallback

**Effort**: 15 minutes (after Helius)

---

### 3. Light Protocol / Open Track ($18,000) - MEDIUM EFFORT

**Requirement**: Use ZK Compression for state management

**How Zorb Could Integrate**:
Light Protocol's ZK compression would reduce on-chain costs for:
- Nullifier storage (currently PDAs)
- Commitment tree state
- User note metadata

**Integration Points in Zorb**:

```
Files to modify:
- zore/programs/shielded-pool/Cargo.toml (add @lightprotocol deps)
- zore/programs/shielded-pool/src/instructions/nullifier_tree/
- app/packages/circuits/src/transaction/builder.ts
```

**Architecture Change**:
```
Current Flow:
  Nullifier → PDA Creation → On-chain storage ($$$)

With Light Protocol:
  Nullifier → Compressed Account → Merkle proof → Lower cost
```

**Code Sketch** (Rust):
```rust
// In zore/programs/shielded-pool/Cargo.toml
[dependencies]
light-sdk = "0.x"
light-system-program = "0.x"

// In nullifier creation
use light_sdk::compressed_account::CompressedAccount;

pub fn create_compressed_nullifier(
    ctx: Context<CreateNullifier>,
    nullifier_hash: [u8; 32],
) -> Result<()> {
    // Create compressed account instead of PDA
    let compressed_nullifier = CompressedAccount::new(
        &nullifier_hash,
        ctx.accounts.light_system_program.key(),
    );
    compressed_nullifier.create(ctx)?;
    Ok(())
}
```

**Client SDK Changes** (TypeScript):
```typescript
// In app/packages/circuits/src/transaction/builder.ts
import { Rpc, createRpc } from "@lightprotocol/stateless.js";

// Replace standard RPC with Light-aware RPC
const rpc: Rpc = createRpc(RPC_ENDPOINT, RPC_ENDPOINT, RPC_ENDPOINT);

// Fetch compressed nullifier proofs
const nullifierProof = await rpc.getCompressedAccountProof(nullifierAddress);
```

**Effort**: 3-5 days
**Value**: Highest prize pool ($18k) + significant cost reduction

---

## TIER 2: Feasible Integrations (Consider)

### 4. Arcium ($10,000) - MPC for Encrypted State

**What Arcium Provides**:
- Multi-Party eXecution Environments (MXEs)
- Encrypted shared state
- Confidential computations

**Where Zorb Could Use It**:

1. **Encrypted Intent Matching** (if swap-intent exists):
   ```
   Current: Swap intents visible on-chain
   With Arcium: Encrypt intents → match in MXE → reveal only settlement
   ```

2. **Private Relayer Coordination**:
   ```
   Current: Relayer sees transaction details
   With Arcium: Batch in encrypted state → shuffle → submit
   ```

**Integration Path**:
```
Files to create/modify:
- zore/programs/shielded-pool/src/arcium_integration.rs (new)
- app/apps/zorb-relayer-worker/src/arcium_batch.ts (new)
```

**Code Example**:
```rust
// In arcium_integration.rs
use arcis::prelude::*;

#[confidential]
pub fn submit_encrypted_withdrawal(
    ctx: Context<EncryptedWithdraw>,
    encrypted_recipient: EncryptedData,
    amount_commitment: Commitment,
) -> Result<()> {
    // Recipient stays hidden until MXE execution
    arcium::queue_for_mxe(encrypted_recipient, amount_commitment)?;
    Ok(())
}
```

**Effort**: 2-3 days
**Prize**: $5k (best overall) + $3k (existing app integration)

---

### 5. Inco Lightning ($6,000) - FHE/TEE for Confidential Data

**What Inco Provides**:
- Private data types in Anchor programs
- Programmable access control
- TEE-based execution (different from Arcium's FHE)

**Where Zorb Could Use It**:

1. **Private Pool Statistics**:
   ```rust
   // Current: TVL is public
   pub total_value_locked: u128,

   // With Inco: TVL hidden, selective disclosure
   #[private(access = auditor)]
   pub encrypted_tvl: EncryptedU128,
   ```

2. **Private Fee Rates**:
   ```rust
   #[private(access = authority)]
   pub dynamic_fee_rate: EncryptedU16,
   ```

**Integration Path**:
```
Files to modify:
- zore/programs/shielded-pool/Cargo.toml
- zore/programs/shielded-pool/src/state/global_config.rs
- zore/programs/token-pool/src/state.rs
```

**Effort**: 2-3 days
**Prize**: $2k per category (DeFi, Payments, Consumer)

---

### 6. Aztec/Noir ($10,000) - Circuit Porting

**What's Required**: Port Circom circuits to Noir

**Current Zorb Circuits** (Circom):

| Circuit | Constraints | Purpose |
|---------|-------------|---------|
| transaction4.circom | ~74,000 | 4-in-4-out transfer |
| transaction16.circom | ~200,000 | 16-in-2-out consolidation |
| nullifierNonMembership4.circom | ~29,000 | Non-membership proof |
| nullifierBatchInsert4.circom | ~45,000 | Batch insertion |

**Porting Example** (Circom → Noir):
```noir
// Original Circom: packages/circuits/circom/lib/notes/compute-nullifier.circom
// template ComputeNullifier() {
//     signal input nk;
//     signal input cm;
//     signal input pathIndices;
//     signal output nullifier;
//     nullifier <== Poseidon(3)([nk, cm, pathIndices]);
// }

// Noir equivalent:
fn compute_nullifier(nk: Field, cm: Field, path_indices: Field) -> Field {
    poseidon::hash_3([nk, cm, path_indices])
}
```

**Files to Create**:
```
app/packages/circuits-noir/           (new package)
├── src/
│   ├── transaction.nr
│   ├── nullifier_non_membership.nr
│   ├── nullifier_batch_insert.nr
│   └── lib/
│       ├── poseidon.nr
│       ├── merkle.nr
│       └── notes.nr
├── Nargo.toml
└── README.md
```

**Effort**: 1-2 weeks
**Prize**: $5k best overall, $2.5k non-financial, $2.5k creative

---

## TIER 3: Not Recommended

### Privacy Cash ($15,000) - CONFLICT
Using Privacy Cash SDK would route funds through THEIR pool, not Zorb's. Architectural conflict.

### Radr/ShadowWire ($15,000) - INCOMPATIBLE
ShadowWire uses Bulletproofs for amount hiding. Zorb uses Groth16 nullifiers. Different cryptographic approach - would require parallel systems.

### Others
- **Anoncoin**: Token launchpad focus (Zorb is for existing tokens)
- **SilentSwap**: Cross-chain (Zorb is Solana-native)
- **Starpay**: Payment cards (not relevant)
- **PNP Exchange**: AI prediction markets (not relevant)
- **MagicBlock**: Would require major prover rearchitecture
- **Range**: Low prize ($1.5k) for compliance screening
- **Encrypt.trade**: Education content, not code

---

## Recommended Submission Strategy

### Phase 1: Immediate (Today)
1. ✅ **Helius RPC** - 30 min, $5k potential
2. ✅ **Quicknode RPC** - 15 min, $3k potential

### Phase 2: Pre-Judging (Before Feb 10)
3. ⚠️ **Light Protocol** - 3-5 days, $18k potential (highest ROI)

### Phase 3: Post-Hackathon
4. **Arcium/Inco** - When production ready
5. **Noir port** - Long-term circuit modernization

---

## Total Addressable Prize Pool

| Integration | Prize | Effort | ROI |
|-------------|-------|--------|-----|
| Track 01 (Private Payments) | $15,000 | Already done | ∞ |
| Helius | $5,000 | 30 min | Very High |
| Quicknode | $3,000 | 15 min | Very High |
| Light Protocol (Track 03) | $18,000 | 3-5 days | High |
| Arcium | $10,000 | 2-3 days | Medium |
| Inco | $6,000 | 2-3 days | Medium |
| **Realistic Total** | **$57,000** | | |

---

---

## DETAILED IMPLEMENTATION PLANS

### Implementation 1: Helius + Quicknode RPC ($8,000)

**Estimated Time**: 45 minutes

#### Step 1: Environment Configuration
```bash
# Files to create/modify
app/.env.devnet
app/.env.mainnet
app/apps/zorb-cash/.env.local
```

```env
# .env.devnet
HELIUS_API_KEY=your-helius-devnet-key
QUICKNODE_ENDPOINT=https://your-endpoint.solana-devnet.quiknode.pro/token/
SOLANA_RPC_PRIMARY=https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
SOLANA_RPC_FALLBACK=${QUICKNODE_ENDPOINT}
```

#### Step 2: Connection Factory Update
```typescript
// File: app/packages/react-common/src/lib/connection.ts (or similar)

import { Connection, clusterApiUrl, Cluster } from '@solana/web3.js';

export function createConnection(cluster: Cluster): Connection {
  const heliusKey = process.env.HELIUS_API_KEY || process.env.VITE_HELIUS_API_KEY;
  const quicknodeEndpoint = process.env.QUICKNODE_ENDPOINT || process.env.VITE_QUICKNODE_ENDPOINT;

  // Primary: Helius
  if (heliusKey) {
    const heliusUrl = cluster === 'mainnet-beta'
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
      : `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
    return new Connection(heliusUrl, 'confirmed');
  }

  // Fallback: Quicknode
  if (quicknodeEndpoint) {
    return new Connection(quicknodeEndpoint, 'confirmed');
  }

  // Default: Public RPC
  return new Connection(clusterApiUrl(cluster), 'confirmed');
}
```

#### Step 3: Worker Updates
```typescript
// Files to modify:
// - app/apps/zorb-relayer-worker/src/config.ts
// - app/apps/nullifier-crank-worker/src/config.ts
// - app/apps/unified-sol-pool-crank-worker/src/config.ts
// - app/apps/prover-coordinator/src/config.ts

export const RPC_CONFIG = {
  primary: process.env.HELIUS_RPC_URL,
  fallback: process.env.QUICKNODE_RPC_URL,
  commitment: 'confirmed' as const,
};
```

#### Verification
1. Deploy to devnet with new RPC config
2. Screenshot Helius dashboard showing API calls
3. Screenshot Quicknode dashboard showing API calls
4. Include in submission documentation

---

### Implementation 2: Light Protocol ZK Compression ($18,000)

**Estimated Time**: 3-5 days

#### Overview
Light Protocol provides "ZK compression" - compressed accounts stored off-chain with Merkle proofs for on-chain verification. This reduces rent costs for:
- Nullifier PDAs (currently ~0.002 SOL each)
- Future: Note metadata, user state

#### Step 1: Add Dependencies

```toml
# File: zore/programs/shielded-pool/Cargo.toml
[dependencies]
light-sdk = "0.11"
light-system-program = "0.11"
light-hasher = "0.11"
```

```json
// File: app/package.json (root)
{
  "dependencies": {
    "@lightprotocol/stateless.js": "^0.17",
    "@lightprotocol/compressed-token": "^0.17"
  }
}
```

#### Step 2: Create Compressed Nullifier Module

```rust
// File: zore/programs/shielded-pool/src/instructions/compressed_nullifier.rs (NEW)

use anchor_lang::prelude::*;
use light_sdk::{
    compressed_account::{CompressedAccount, CompressedAccountData},
    merkle_context::MerkleContext,
    verify_compressed_account_membership,
};

/// Create a compressed nullifier instead of PDA
pub fn create_compressed_nullifier(
    ctx: Context<CreateCompressedNullifier>,
    nullifier_hash: [u8; 32],
    merkle_context: MerkleContext,
) -> Result<()> {
    // Verify the nullifier doesn't already exist via Light's non-membership proof
    verify_compressed_account_non_membership(
        &merkle_context,
        &nullifier_hash,
    )?;

    // Create compressed account with nullifier data
    let nullifier_data = CompressedNullifier {
        hash: nullifier_hash,
        slot: Clock::get()?.slot,
    };

    light_sdk::create_compressed_account(
        ctx.accounts.light_system_program.to_account_info(),
        ctx.accounts.registered_program_pda.to_account_info(),
        ctx.accounts.noop_program.to_account_info(),
        ctx.accounts.account_compression_program.to_account_info(),
        ctx.accounts.cpi_signer.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        &nullifier_data.try_to_vec()?,
        &merkle_context,
    )?;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CompressedNullifier {
    pub hash: [u8; 32],
    pub slot: u64,
}

#[derive(Accounts)]
pub struct CreateCompressedNullifier<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Light Protocol system program
    pub light_system_program: Program<'info, LightSystemProgram>,

    /// Account compression program
    pub account_compression_program: AccountInfo<'info>,

    /// Noop program for logging
    pub noop_program: AccountInfo<'info>,

    /// Registered program PDA
    pub registered_program_pda: AccountInfo<'info>,

    /// CPI signer
    pub cpi_signer: AccountInfo<'info>,

    /// Merkle tree for compressed accounts
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,

    /// Queue for nullifier operations
    #[account(mut)]
    pub nullifier_queue: AccountInfo<'info>,
}
```

#### Step 3: Update Client SDK

```typescript
// File: app/packages/circuits/src/transaction/compressed-nullifier.ts (NEW)

import { Rpc, createRpc, bn } from "@lightprotocol/stateless.js";
import { PublicKey } from "@solana/web3.js";

export interface CompressedNullifierClient {
  rpc: Rpc;
  checkNullifierExists(nullifierHash: Uint8Array): Promise<boolean>;
  getNullifierProof(nullifierHash: Uint8Array): Promise<MerkleProof | null>;
}

export function createCompressedNullifierClient(
  rpcEndpoint: string
): CompressedNullifierClient {
  // Light Protocol requires special RPC that supports compression
  const rpc = createRpc(rpcEndpoint, rpcEndpoint, rpcEndpoint);

  return {
    rpc,

    async checkNullifierExists(nullifierHash: Uint8Array): Promise<boolean> {
      try {
        const compressedAccount = await rpc.getCompressedAccount(
          bn(nullifierHash)
        );
        return compressedAccount !== null;
      } catch {
        return false;
      }
    },

    async getNullifierProof(nullifierHash: Uint8Array): Promise<MerkleProof | null> {
      try {
        const proof = await rpc.getValidityProof([bn(nullifierHash)]);
        return proof;
      } catch {
        return null;
      }
    }
  };
}
```

#### Step 4: Migration Strategy

```typescript
// File: app/packages/circuits/src/nullifier/hybrid-nullifier.ts (NEW)

/**
 * Hybrid nullifier system supporting both:
 * - Legacy: PDA-based nullifiers
 * - New: Light Protocol compressed nullifiers
 *
 * Migration: New nullifiers use compression, old ones remain PDAs
 */
export class HybridNullifierService {
  constructor(
    private legacyService: LegacyNullifierService,
    private compressedService: CompressedNullifierClient,
    private useCompression: boolean = true  // Feature flag
  ) {}

  async checkNullifierSpent(nullifierHash: Uint8Array): Promise<boolean> {
    // Check both systems during migration
    const [legacySpent, compressedSpent] = await Promise.all([
      this.legacyService.checkPdaExists(nullifierHash),
      this.compressedService.checkNullifierExists(nullifierHash),
    ]);

    return legacySpent || compressedSpent;
  }

  async createNullifier(nullifierHash: Uint8Array): Promise<TransactionInstruction[]> {
    if (this.useCompression) {
      return this.createCompressedNullifier(nullifierHash);
    }
    return this.legacyService.createPdaNullifier(nullifierHash);
  }
}
```

#### Verification
1. Run Light Protocol's `light test-validator` locally
2. Execute deposit → transfer → withdraw flow with compressed nullifiers
3. Compare rent costs: PDA vs compressed
4. Document gas savings in submission

---

### Implementation 3: Arcium MPC Integration ($10,000)

**Estimated Time**: 2-3 days

#### Overview
Arcium provides Multi-Party eXecution Environments (MXEs) for encrypted computations. Best use case for Zorb: **private relayer batching**.

#### Architecture
```
Current:
  User → Relayer → [sees tx details] → Solana

With Arcium:
  User → Encrypted Intent → MXE Batch → [shuffled, details hidden] → Relayer → Solana
```

#### Step 1: Add Arcium Dependencies

```toml
# File: zore/programs/shielded-pool/Cargo.toml
[dependencies]
arcis = "0.6"
arcis-macros = "0.6"
```

```json
// File: app/package.json
{
  "dependencies": {
    "@arcium/client": "^0.6"
  }
}
```

#### Step 2: Create Encrypted Batch Submission

```rust
// File: zore/programs/shielded-pool/src/instructions/arcium_batch.rs (NEW)

use arcis::prelude::*;
use anchor_lang::prelude::*;

/// Encrypted batch submission using Arcium MXE
///
/// Flow:
/// 1. Users submit encrypted withdrawal intents
/// 2. Arcium MXE collects and shuffles
/// 3. Batch is decrypted and executed atomically
#[confidential]
pub fn submit_encrypted_batch(
    ctx: Context<EncryptedBatch>,
    encrypted_intents: Vec<EncryptedIntent>,
    mxe_proof: MxeExecutionProof,
) -> Result<()> {
    // Verify MXE execution proof
    arcium::verify_mxe_execution(&mxe_proof)?;

    // Process each intent (now decrypted by MXE)
    for intent in mxe_proof.decrypted_intents {
        process_withdrawal_intent(ctx, intent)?;
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct EncryptedIntent {
    /// X25519 ephemeral public key
    pub ephemeral_pubkey: [u8; 32],
    /// ChaCha20-Poly1305 ciphertext
    pub ciphertext: Vec<u8>,
    /// Poly1305 auth tag
    pub tag: [u8; 16],
}

#[derive(Accounts)]
pub struct EncryptedBatch<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Arcium MXE program
    pub arcium_program: Program<'info, ArciumMxe>,

    /// Cluster configuration
    pub cluster_config: AccountInfo<'info>,

    // ... other accounts for withdrawal processing
}
```

#### Step 3: Client-Side Encryption

```typescript
// File: app/apps/zorb-relayer-worker/src/arcium-batch.ts (NEW)

import { ArciumClient, encrypt, MxeCluster } from '@arcium/client';
import { Keypair } from '@solana/web3.js';

export interface WithdrawalIntent {
  recipient: string;
  amount: bigint;
  nullifier: Uint8Array;
  proof: Uint8Array;
}

export class ArciumBatchService {
  private arcium: ArciumClient;
  private cluster: MxeCluster;

  constructor(
    rpcEndpoint: string,
    clusterId: string
  ) {
    this.arcium = new ArciumClient(rpcEndpoint);
    this.cluster = this.arcium.getCluster(clusterId);
  }

  /**
   * Encrypt withdrawal intent for MXE processing
   */
  async encryptIntent(intent: WithdrawalIntent): Promise<EncryptedIntent> {
    const plaintext = serializeIntent(intent);
    const encrypted = await this.cluster.encrypt(plaintext);

    return {
      ephemeralPubkey: encrypted.ephemeralPubkey,
      ciphertext: encrypted.ciphertext,
      tag: encrypted.tag,
    };
  }

  /**
   * Submit batch of encrypted intents to MXE
   */
  async submitBatch(intents: WithdrawalIntent[]): Promise<string> {
    // Encrypt all intents
    const encrypted = await Promise.all(
      intents.map(i => this.encryptIntent(i))
    );

    // Submit to MXE for shuffled processing
    const tx = await this.arcium.submitBatch({
      cluster: this.cluster.id,
      intents: encrypted,
      callback: 'submit_encrypted_batch',  // Our program instruction
    });

    return tx.signature;
  }
}
```

#### Verification
1. Deploy Arcium-enabled program to devnet
2. Submit test batch of 3+ withdrawals
3. Verify outputs are shuffled (recipients not predictable)
4. Document privacy improvement in submission

---

### Implementation 4: Inco Lightning Integration ($6,000)

**Estimated Time**: 2-3 days

#### Overview
Inco provides encrypted data types for Anchor programs. Best use case: **private pool metadata**.

#### Step 1: Add Inco Dependencies

```toml
# File: zore/programs/shielded-pool/Cargo.toml
[dependencies]
inco-anchor = "0.1"
```

#### Step 2: Encrypted Pool Statistics

```rust
// File: zore/programs/shielded-pool/src/state/global_config.rs

use inco_anchor::prelude::*;

#[account]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub bump: u8,

    // Public stats (unchanged)
    pub total_deposits: u64,
    pub total_withdrawals: u64,

    // NEW: Private stats (only authority can read)
    #[private(access = authority)]
    pub encrypted_tvl: EncryptedU128,

    // NEW: Private fee configuration
    #[private(access = authority)]
    pub encrypted_fee_rate: EncryptedU16,

    // For auditor access (optional)
    pub auditor: Option<Pubkey>,

    #[private(access = auditor)]
    pub encrypted_audit_data: Option<EncryptedBytes>,
}

impl GlobalConfig {
    /// Update encrypted TVL (only callable by authority)
    pub fn update_encrypted_tvl(
        &mut self,
        new_tvl: u128,
        inco_ctx: &IncoContext,
    ) -> Result<()> {
        self.encrypted_tvl = inco_ctx.encrypt_u128(new_tvl)?;
        Ok(())
    }

    /// Read decrypted TVL (requires authority signature)
    pub fn read_tvl(
        &self,
        inco_ctx: &IncoContext,
        authority_signature: &Signature,
    ) -> Result<u128> {
        inco_ctx.decrypt_u128(&self.encrypted_tvl, authority_signature)
    }
}
```

#### Step 3: Client-Side Decryption

```typescript
// File: app/packages/circuits/src/pool/private-stats.ts (NEW)

import { IncoClient, decrypt } from '@inco/solana-sdk';
import { Keypair, PublicKey } from '@solana/web3.js';

export class PrivatePoolStats {
  private inco: IncoClient;

  constructor(rpcEndpoint: string) {
    this.inco = new IncoClient(rpcEndpoint);
  }

  /**
   * Read encrypted TVL (requires authority wallet)
   */
  async readTVL(
    poolConfig: PublicKey,
    authorityKeypair: Keypair
  ): Promise<bigint> {
    // Fetch encrypted data
    const config = await this.fetchPoolConfig(poolConfig);

    // Request decryption (requires signing)
    const decrypted = await this.inco.decrypt(
      config.encryptedTvl,
      authorityKeypair
    );

    return BigInt(decrypted);
  }

  /**
   * Grant auditor access to pool data
   */
  async grantAuditorAccess(
    poolConfig: PublicKey,
    auditorPubkey: PublicKey,
    authorityKeypair: Keypair
  ): Promise<string> {
    const tx = await this.inco.grantAccess({
      account: poolConfig,
      field: 'encrypted_audit_data',
      grantee: auditorPubkey,
      signer: authorityKeypair,
    });

    return tx.signature;
  }
}
```

#### Verification
1. Deploy Inco-enabled program to devnet
2. Verify TVL is encrypted on-chain (inspect account data)
3. Demonstrate decryption with authority key
4. Demonstrate auditor access grant
5. Document selective disclosure in submission

---

## Verification Checklist

### Before Submission
- [ ] Helius RPC configured and tested
- [ ] Quicknode RPC configured as fallback
- [ ] Light Protocol nullifiers working on devnet
- [ ] Arcium batch submission tested
- [ ] Inco encrypted stats deployed
- [ ] Screenshots of all sponsor dashboards
- [ ] Documentation of each integration

### Evidence for Judges
1. **Helius**: Dashboard API usage screenshot
2. **Quicknode**: Dashboard API usage screenshot
3. **Light Protocol**: On-chain compressed nullifier account
4. **Arcium**: MXE batch execution transaction
5. **Inco**: Encrypted account data + decryption demo

---

## Sources

- [Solana Privacy Hack](https://solana.com/privacyhack)
- [Arcium Docs](https://docs.arcium.com) | [Examples](https://github.com/arcium-hq/examples)
- [Light Protocol / ZK Compression](https://www.zkcompression.com/)
- [Inco SVM Docs](https://docs.inco.org/svm/home)
- [Noir Documentation](https://noir-lang.org/docs/)
- [ShadowWire GitHub](https://github.com/Radrdotfun/ShadowWire)
- [Helius RPC](https://docs.helius.dev)
- [Quicknode](https://www.quicknode.com/docs)

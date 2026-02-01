# ZORB Sponsor Bounty Eligibility Analysis

**Generated**: 2026-02-01
**Total Potential**: Up to $49,500 if all eligible bounties are pursued

---

## Executive Summary

| Sponsor | Prize | Eligibility | Effort | Recommendation |
|---------|-------|-------------|--------|----------------|
| **Helius** | $5,000 | ✅ HIGH | 🟢 LOW | **DO THIS** |
| **Quicknode** | $3,000 | ✅ HIGH | 🟢 LOW | **DO THIS** |
| **Arcium** | $10,000 | ⚠️ MEDIUM | 🟡 MEDIUM | Consider post-hackathon |
| **Inco** | $6,000 | ⚠️ MEDIUM | 🟡 MEDIUM | Consider post-hackathon |
| **Aztec/Noir** | $10,000 | ⚠️ MEDIUM | 🔴 HIGH | Port circuits later |
| **MagicBlock** | $5,000 | ⚠️ LOW | 🔴 HIGH | Significant rearchitecture |
| **Privacy Cash** | $15,000 | ❌ CONFLICT | N/A | Competing product |
| **Radr/ShadowWire** | $15,000 | ❌ CONFLICT | N/A | Competing approach |
| **Anoncoin** | $10,000 | ❌ NO | N/A | Token creation focus |
| **SilentSwap** | $5,000 | ❌ NO | N/A | Cross-chain focus |
| **Starpay** | $3,500 | ❌ NO | N/A | Payment card focus |
| **PNP Exchange** | $2,500 | ❌ NO | N/A | AI agents focus |
| **Range** | $1,500 | ⚠️ LOW | 🟡 MEDIUM | Compliance tools |
| **Encrypt.trade** | $1,000 | ❌ NO | N/A | Education focus |

---

## Tier 1: Immediate Integration (Do Today)

### 1. Helius - $5,000

**What They Want**: "Best privacy project utilizing their infrastructure"

**Current State**: ZORB likely uses default Solana RPC or a generic provider.

**Integration Required**:
```typescript
// In app/packages/zorb-wallet-react or apps/zorb-cash
// Change RPC endpoint configuration

// Before
const connection = new Connection("https://api.devnet.solana.com");

// After
const connection = new Connection("https://devnet.helius-rpc.com/?api-key=YOUR_KEY");
```

**Implementation in ZORB Codebase**:

1. **Environment Configuration** (`app/.env` or `app/environments/`):
```env
HELIUS_API_KEY=your-api-key
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
```

2. **Update Connection Factory** (likely in `app/packages/react-common/` or similar):
```typescript
export function createConnection(cluster: Cluster): Connection {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (heliusKey) {
    return new Connection(`https://${cluster}.helius-rpc.com/?api-key=${heliusKey}`);
  }
  return new Connection(clusterApiUrl(cluster));
}
```

3. **Update Workers** (`app/apps/*-worker/`):
   - `zorb-relayer-worker`
   - `nullifier-crank-worker`
   - `zorb-rollup-worker`

**Effort**: ~30 minutes
**Evidence for Submission**: Screenshot of Helius dashboard showing API usage from ZORB

---

### 2. Quicknode - $3,000

**What They Want**: "Most impactful open-source privacy tooling using Quicknode's RPC"

**Integration Required**: Same as Helius - just RPC endpoint configuration.

**Implementation**:
```typescript
// Alternative RPC configuration
const QUICKNODE_RPC = "https://your-endpoint.solana-devnet.quiknode.pro/your-token/";
```

**Effort**: ~15 minutes (if Helius is already done, just add as fallback)
**Can Stack**: Yes, can use both Helius and Quicknode (primary + fallback)

---

## Tier 2: Medium Effort Integration (Post-Deadline)

### 3. Arcium - $10,000

**What They Offer**: Encrypted shared state via Multi-party eXecution Environments (MXEs)

**How It Could Enhance ZORB**:

ZORB's current architecture has some metadata that's visible on-chain:
- Transaction timing
- Deposit/withdrawal amounts (at pool boundary)
- Relayer interactions

**Potential Integration Points**:

1. **Encrypted Intent Matching** (`zore/programs/swap-intent/`):
   - Current: Swap intents may leak trading preferences
   - With Arcium: Encrypt order details, match in MXE, reveal only final settlement

2. **Private Relayer Coordination** (`app/apps/zorb-relayer-worker/`):
   - Current: Relayer sees which transactions it processes
   - With Arcium: Batch and shuffle transactions in encrypted state before submission

**Implementation Sketch**:

```rust
// In zore/programs/swap-intent/src/lib.rs
// Add Arcium integration for private order matching

use arcis::prelude::*;

#[confidential]  // Arcium macro
pub fn submit_encrypted_intent(
    ctx: Context<SubmitIntent>,
    encrypted_intent: EncryptedData,
) -> Result<()> {
    // Intent details hidden until matching
    arcium::submit_to_mxe(encrypted_intent)?;
    Ok(())
}
```

**Required Changes**:
- Add `arcis` dependency to `zore/programs/swap-intent/Cargo.toml`
- Modify intent submission to use Arcium's encrypted channels
- Update TypeScript SDK to encrypt intents client-side

**Effort**: 2-3 days
**Status**: Arcium is on Public Testnet - may have compatibility issues

---

### 4. Inco Lightning - $6,000

**What They Offer**: Confidential computing with private data types and programmable access control

**How It Could Enhance ZORB**:

Similar to Arcium but with different primitives. Inco provides:
- Private data types in Anchor programs
- Programmable access control (who can see what)

**Potential Integration Points**:

1. **Private Pool Metadata** (`zore/programs/shielded-pool/`):
   - Hide pool TVL from public view
   - Selective disclosure to auditors

2. **Private Fee Rates**:
   - Current: Fee rates are public
   - With Inco: Dynamic fees based on encrypted conditions

**Implementation Sketch**:

```rust
// In zore/programs/shielded-pool/src/state/pool_config.rs

use inco::prelude::*;

#[account]
pub struct PoolConfig {
    pub authority: Pubkey,

    // Current: Public
    pub fee_rate_bps: u16,

    // With Inco: Private, only authority can read
    #[private(access = authority)]
    pub internal_fee_rate: EncryptedU16,
}
```

**Effort**: 2-3 days
**Status**: Inco SVM is in beta - experimental

---

### 5. Aztec/Noir - $10,000

**What They Want**: "Build zero-knowledge applications using Noir on Solana"

**Current State**: ZORB uses **Circom** for all circuits:
- `circuits/transaction4.circom` (~35k constraints)
- `circuits/nullifierNonMembership4.circom` (~29k constraints)
- `circuits/nullifierBatchInsert*.circom`

**What Noir Offers**:
- Higher-level DSL than Circom
- Rust-like syntax
- Backend agnostic (can target Groth16, Plonk, etc.)
- Growing ecosystem and tooling

**Porting Effort**:

Example - porting `nullifierNonMembership4.circom` to Noir:

```noir
// Current Circom (simplified):
template NullifierNonMembership(HEIGHT) {
    signal input nullifier_tree_root;
    signal input nullifiers[4];
    signal input low_elements[4];
    signal input merkle_proofs[4][HEIGHT];

    // Verify low element exists
    // Verify nullifier in gap
}

// Equivalent Noir:
fn main(
    nullifier_tree_root: pub Field,
    nullifiers: pub [Field; 4],
    low_elements: [LowElement; 4],
    merkle_proofs: [[Field; 26]; 4],
) {
    for i in 0..4 {
        // Verify low element membership
        assert(verify_merkle_proof(
            low_elements[i].hash(),
            merkle_proofs[i],
            nullifier_tree_root
        ));

        // Verify nullifier in gap
        assert(low_elements[i].value < nullifiers[i]);
        assert(nullifiers[i] < low_elements[i].next_value);
    }
}
```

**Required Changes**:
1. Port all 11 Circom circuits to Noir (~40-60 hours)
2. Update proving infrastructure in `app/packages/circuits/`
3. Integrate with Solana via [Sunspot](https://github.com/solana-foundation/noir-examples)
4. Update verifier in `zore/programs/shielded-pool/src/groth16.rs`

**Effort**: 1-2 weeks full-time
**Value**: Long-term - Noir has better tooling and growing adoption

---

### 6. MagicBlock Private Ephemeral Rollups - $5,000

**What They Offer**: Privacy through TEE-based ephemeral rollups

**How It Could Enhance ZORB**:

The prover/sequencer layer could run in a TEE:
- Proof generation happens in trusted environment
- Transaction ordering is hidden until commitment
- Prevents frontrunning of private transactions

**Potential Integration**:

```
Current Flow:
User -> Relayer -> Prover -> Solana

With MagicBlock:
User -> Relayer -> [TEE: Prover + Sequencer] -> Solana
                   ^-- Private Ephemeral Rollup
```

**Implementation**:
1. Modify `app/apps/prover-coordinator/` to delegate to TEE
2. Add MagicBlock SDK for TEE communication
3. Use `@ephemeral` and `@commit` macros in program

**Effort**: 1 week+
**Complexity**: HIGH - requires rearchitecting prover flow

---

## Tier 3: Not Recommended

### Privacy Cash ($15,000) - CONFLICT

**Why Not**: Privacy Cash is a competing shielded pool. Their bounty requires using their SDK, which means sending funds through **their** pool, not ZORB's.

Integrating would mean:
- Users deposit to Privacy Cash, not ZORB
- ZORB becomes a wrapper around Privacy Cash
- Loses ZORB's unique indexed merkle tree advantage

**Verdict**: Architectural conflict. Skip.

---

### Radr/ShadowWire ($15,000) - CONFLICT

**Why Not**: ShadowWire uses Bulletproofs for amount hiding - a fundamentally different approach from ZORB's Groth16 nullifier system.

Integration would mean:
- Running two parallel privacy systems
- User confusion about which to use
- No synergy with indexed merkle tree

**Verdict**: Competing approach. Skip.

---

### Anoncoin ($10,000) - WRONG TRACK

**Focus**: "Token creation infrastructure with confidential features"

ZORB is a privacy protocol for existing tokens, not a token launchpad.

---

### SilentSwap ($5,000) - WRONG TRACK

**Focus**: "Cross-chain transfers"

ZORB is Solana-native. No cross-chain component.

---

### Others

- **Starpay** ($3,500): Payment cards - not relevant
- **PNP Exchange** ($2,500): AI agents for prediction markets - not relevant
- **Range** ($1,500): Compliance tools - could add but low prize
- **Encrypt.trade** ($1,000): Education content - not code

---

## Recommended Submission Strategy

### Immediate (Today):

1. ✅ **Select "None" for sponsor bounties** (as originally planned)
   - Helius/Quicknode integration is trivial but needs API key setup
   - Don't risk disqualification by claiming bounties without full integration

### Post-Submission (Before Feb 7 judging):

2. **Add Helius RPC** (~30 min)
   - Get API key from helius.dev
   - Update environment config
   - Screenshot dashboard for evidence

3. **Add Quicknode RPC** (~15 min)
   - Same process
   - Use as fallback

4. **Contact sponsors directly**
   - Email Helius/Quicknode about ZORB
   - May get consideration even without formal bounty claim

### Future Development:

5. **Port circuits to Noir** (high value)
   - Better tooling
   - Growing ecosystem
   - $10k bounty available in future hackathons

6. **Evaluate Arcium/Inco** for metadata privacy
   - Depends on their production readiness

---

## Form Field 8 Update

Based on this analysis, keep the current answer:

```
None
```

**Rationale**:
- RPC integrations (Helius/Quicknode) require API keys and verified usage
- Other bounties require significant code changes
- Risk of disqualification outweighs potential gain
- Can still pursue bounties informally by contacting sponsors

---

## Quick Reference: Sponsor Resources

| Sponsor | Documentation | GitHub |
|---------|---------------|--------|
| Helius | https://docs.helius.dev | - |
| Quicknode | https://quicknode.com/docs | - |
| Arcium | https://docs.arcium.com/developers/ | - |
| Inco | https://docs.inco.org/svm/home | - |
| Noir/Aztec | https://noir-lang.org/docs | https://github.com/solana-foundation/noir-examples |
| MagicBlock | https://docs.magicblock.gg | - |

---

## Sources

- [Noir Documentation](https://noir-lang.org/docs/)
- [Solana Foundation Noir Examples](https://github.com/solana-foundation/noir-examples)
- [Aztec Noir 1.0 Announcement](https://aztec.network/blog/the-future-of-zk-development-is-here-announcing-the-noir-1-0-pre-release)
- [Arcium Developer Docs](https://docs.arcium.com/developers/)
- [Inco SVM Documentation](https://docs.inco.org/svm/home)

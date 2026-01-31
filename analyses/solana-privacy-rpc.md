# solana-privacy-rpc - Analysis

## 1. Project Overview
Privacy-preserving RPC infrastructure that implements K-Anonymity for Solana queries. Users' RPC queries are batched together so that RPC providers cannot link individual users to their on-chain activity. Includes an on-chain coordinator program, a Rust proxy server, and a TypeScript SDK.

## 2. Track Targeting
**Privacy Tooling** - RPC-layer privacy infrastructure rather than on-chain private payments.

## 3. Tech Stack
- **ZK System**: None (uses K-Anonymity batching, not cryptographic privacy)
- **Languages and frameworks**:
  - Rust/Anchor for coordinator program
  - Rust/Axum for proxy server
  - TypeScript for SDK
- **Key dependencies**:
  - anchor-lang ^0.32.1
  - axum (Rust web framework)
  - @solana/web3.js
  - @coral-xyz/anchor

## 4. Crypto Primitives
- **SHA-256 hashing**: Query content is hashed before on-chain submission
- **K-Anonymity**: Statistical privacy through batching (not cryptographic)
- **No ZK proofs**: Privacy comes from mixing queries, not proving

## 5. Solana Integration
**Full Anchor program:**

Program ID: `3LsgXZDcRaC3vGq3392WGuEa4AST76m8NPNQCaqDd3n6`

**Instructions:**
- `initialize` - Set K parameter (min/max batch size)
- `create_batch` - Create new query batch
- `submit_query` - Submit query hash to batch
- `finalize_batch` - Lock batch when K queries collected
- `complete_batch` - Mark batch as executed

**PDA Seeds:**
- CoordinatorState: `["coordinator"]`
- Batch: `["batch", batch_id.to_le_bytes()]`

**State:**
- `CoordinatorState`: authority, min_batch_size, max_batch_size, batch_counter
- `Batch`: status, query_count, query_hashes (Vec), submitters (Vec), timestamps

## 6. Sponsor Bounty Targeting
**QuickNode** - Explicitly built for QuickNode Hackathon 2026:
- README states "Built for QuickNode Hackathon 2026"
- Proxy forwards batched queries to QuickNode RPC
- `QUICKNODE_RPC_URL` environment variable

## 7. Alpha/Novel Findings
- **On-chain coordination is clever**: Using Solana PDAs to enforce K-anonymity is novel
- **Verifiable batching**: Proxy must verify on-chain finalization before executing
- **Query hashing**: Actual queries never touch the blockchain
- **SDK is drop-in compatible**: `PrivateConnection` extends standard web3.js patterns

## 8. Strengths
- **Complete architecture**: Program + Proxy + SDK all implemented
- **Well-documented**: Excellent README with architecture diagrams
- **Novel approach**: K-Anonymity at RPC layer is understudied
- **QuickNode bounty alignment**: Clearly targeting sponsor prize
- **Drop-in SDK**: Easy integration path for existing apps

## 9. Weaknesses
- **Latency overhead**: Must wait for K queries before execution
- **Trust in proxy**: Proxy operator could log queries before batching
- **K parameter tradeoff**: Low K = weak privacy, high K = high latency
- **No encrypted channels**: Results returned in plaintext (roadmap item)
- **Sybil attacks**: Bad actor could fill batch with own queries
- **Centralized proxy**: Single point of failure and trust

## 10. Threat Level
**MODERATE**

Justification:
- Strong implementation with clear sponsor targeting (QuickNode)
- Novel approach to an understudied problem (RPC privacy)
- However, K-Anonymity provides statistical privacy, not cryptographic
- Proxy trust assumption is a significant weakness
- Competes in Privacy Tooling, not Private Payments

## 11. Implementation Completeness
**80% complete**

What's implemented:
- Full Anchor coordinator program
- Rust/Axum proxy server
- TypeScript SDK with batching
- On-chain verification
- Demo CLI
- Devnet deployment ready

What's missing:
- Encrypted result channels
- Extended RPC method support (only basic methods)
- Mainnet deployment
- Sybil resistance mechanism
- Decentralized proxy network

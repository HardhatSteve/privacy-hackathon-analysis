# Competitor Technical Descriptions Reference

Example technical descriptions from top Solana Privacy Hackathon 2026 competitors. Use as reference for structure and depth.

---

## Protocol-01 (CRITICAL threat)

> Protocol-01 is the most comprehensive privacy ecosystem for Solana, combining multiple privacy primitives into a complete financial infrastructure. It features ZK shielded pools with a 2-in-2-out UTXO model (Zcash-style), stealth addresses derived via ECDH (adapted from Ethereum EIP-5564), and an off-chain relayer network for breaking transaction graph linkability.
>
> **Technical Stack**:
> - Circuits: Circom 2.1.0 with Merkle depth 20 (~1M notes)
> - Verification: ~200K CU via alt_bn128 syscalls
> - Hash: Poseidon for commitments, nullifiers, key derivation
> - Encryption: AES-256-GCM (PBKDF2 100K iterations), XChaCha20-Poly1305
> - Programs: 6 Anchor programs (shielded pool, stealth, subscriptions, streams, whitelist, fees)
>
> **Key Innovation**: Hybrid privacy model combining stealth addresses (receive privacy) + shielded pool (transfer privacy) + relayer (graph privacy) + configurable decoy outputs (0-16) for statistical obfuscation.
>
> **Deliverables**:
> - Chrome/Brave browser extension wallet
> - React Native mobile app (iOS/Android)
> - Multiple SDKs (@p01/zk-sdk, @p01/specter-sdk)
> - 2,175+ tests

---

## CloakCraft (CRITICAL threat)

> CloakCraft is a comprehensive privacy-preserving DeFi protocol on Solana featuring private token transfers via UTXO-like note system, private AMM swaps with constant product and StableSwap curves, private limit orders, private perpetual futures with up to 100x leverage, and private governance voting.
>
> **Technical Stack**:
> - Circuits: Circom 2.1 with Poseidon hashing on BabyJubJub curve
> - Verification: groth16-solana 0.2.0 (~200K CU)
> - State: Light Protocol SDK 0.17.1 for compressed accounts (5000x storage reduction)
> - Oracle: Pyth for perps pricing
> - Code Volume: ~52,300 lines (Rust: 20K, TS: 27K, Circom: 4K)
>
> **Key Innovations**:
> - Multi-Phase Transaction Pattern: Novel "Append Pattern" splitting ZK transactions across phases to work within Solana's size limits
> - First private perps on Solana: Pyth-integrated perpetual futures with ZK-proven positions
> - Private governance: Homomorphic tally accumulation, vote changing without revealing previous vote
>
> **Deployed Programs** (devnet):
> - Core: [program_id]
> - Perps: [program_id]

---

## Velum (HIGH threat)

> Velum enables private payment links on Solana where users create shareable URLs (e.g., `velum.cash/pay/abc123`) to receive funds privately. The sender deposits into a shielded pool, and recipients withdraw to any address without on-chain linkability.
>
> **Technical Stack**:
> - ZK: snarkjs Groth16 with WASM circuits (~3MB WASM, ~16MB zkey)
> - Base: Privacy Cash protocol (audited shielded pool)
> - Encryption: V3 uses NaCl Box with X25519 ephemeral keys
> - Frontend: Next.js 15, React 19, Three.js for 3D effects
>
> **Key Innovations**:
> - Third-party deposits: Novel extension allowing anyone to deposit for designated recipient
> - RecipientIdHash early termination: 8-byte hash prefix enables O(1) UTXO scanning (60x speedup)
> - V3 forward secrecy: Ephemeral keypair per encryption protects past deposits
>
> **Live**: velum.cash (mainnet)

---

## SIP Protocol (HIGH threat)

> SIP is a privacy-preserving payment protocol using Noir ZK proofs compiled to Groth16 via Sunspot toolchain. Features modular circuit architecture for transaction privacy, compliance proofs, and eligibility verification.
>
> **Technical Stack**:
> - Circuits: Noir 1.0 compiled via Sunspot → Gnark → Solana verifier
> - Verification: gnark-verifier-solana (BN254 curve)
> - Programs: Anchor-based shielded pool
>
> **Key Innovation**: First Noir-native ZK protocol on Solana with full toolchain.

---

## vapor-tokens (HIGH threat)

> Token-2022 extension enabling unlinkable private transactions with plausible deniability. Uses hash-to-curve for provably unspendable "vapor addresses" that look identical to normal Solana addresses.
>
> **Technical Stack**:
> - Circuits: Noir with Sunspot toolchain (Noir→Gnark transpiler)
> - Verification: gnark-verifier-solana (Groth16 on BN254)
> - Integration: Token-2022 transfer hook for automatic Merkle accumulation
>
> **Key Innovations**:
> - Hash-to-curve vapor addresses: First Solana project with provably unspendable addresses
> - Plausible deniability: Every holder has privacy by default
> - No separate deposit UI: Transfer hook auto-records all transfers

---

## ZORB (Our Submission)

> ZORB is a privacy protocol for Solana that eliminates the fundamental cost problem plaguing all existing implementations: per-transaction rent.
>
> **The Problem**:
> Every Solana privacy protocol today (Privacy Cash, Velum, etc.) stores nullifiers as individual PDAs. Each nullifier locks ~0.00089 SOL in rent (~$0.13) permanently. At scale: 10,000 tx = $1,300 locked forever.
>
> **Our Solution: Indexed Merkle Tree**
> We implemented an Aztec-style indexed merkle tree that stores 67 million nullifiers in a single ~1KB account. Instead of PDA lookups, we use ZK non-membership proofs.
>
> **How it works**:
> 1. Tree stores nullifiers in sorted order with "next" pointers (linked list)
> 2. To prove non-membership: find "low element" where low.value < nullifier < low.nextValue
> 3. Groth16 proof verifies gap exists, nullifier not present
> 4. Epoch-based snapshots allow historical proofs while tree grows
>
> **Circuits Built**:
> - nullifierNonMembership4: 4 nullifiers (~29K constraints)
> - nullifierBatchInsert4/16/64: Batch insertion proofs
> - transaction2/4: Note spend + output creation
>
> **Programs Built**:
> - shielded-pool: Core privacy operations
> - token-pool: SPL token vaults
> - unified-sol-pool: Multi-LST yield-while-shielded
>
> **Unique Feature: Yield While Shielded**
> Our unified-sol-pool accepts multiple LSTs (WSOL, vSOL, jitoSOL, mSOL) in the same pool with cross-LST fungibility. Users earn ~7-8% APY while funds remain fully shielded. No other hackathon submission has this working.
>
> **Deployed** (devnet):
> - Shielded Pool: GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6
> - Token Pool: 7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S
> - Unified SOL: 3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf

---

## Pattern Analysis

**Common Structure**:
1. Opening hook (what it does, unique value)
2. Technical stack table
3. Key innovations (numbered list)
4. Deliverables/deployed addresses
5. Quantified metrics

**Word count**: 200-500 words
**Tone**: Technical but accessible, specific not vague

**Avoid**:
- "Revolutionary" / "cutting-edge" / marketing speak
- AI-generated repetitive patterns
- Vague claims without evidence
- Missing program addresses

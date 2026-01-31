#  SolVoid Architecture

This document describes the high-level architecture of the SolVoid protocol, its components, and the security model governing the privacy-preserving transactions.

##  System Overview

SolVoid is built on top of the Solana blockchain, leveraging several distinct layers to achieve its privacy goals:

1.  **On-Chain (Solana Programs):** Manages the state of the Merkle Tree, stores public parameters, and verifies ZK-SNARK proofs.
2.  **ZK-Proving Layer (Circom/SnarkJS):** Generates Groth16 proofs locally on the user's device.
3.  **SDK Layer:** Provides high-level abstractions for interacting with the protocol, managing cryptographic secrets, and generating proofs.
4.  **Relayer Service (Optional):** Acts as a bridge to broadcast transactions for users who wish to remain completely disconnected from the on-chain gas fee payment system.

---

##  Component Breakdown

### 1. Smart Contracts (Anchor)
Located in `/programs/solvoid-zk`.
-   **State Management:** Tracks the Merkle Tree root history (up to 100 roots) to prevent race conditions during proof generation.
-   **Nullifier Set:** Stores "spent" nullifiers to prevent double-spending.
-   **Vault:** A PDA-controlled SOL account that holds all shielded funds.
-   **Verifier:** A dedicated module that implementing the `Groth16` verification logic using `ark-bn254`.

### 2. ZK Circuits (Circom)
Located in `/circuits`.
-   **Commitment Circuit:** Ensures that a user possesses the secret and nullifier that hash to a specific commitment stored in the Merkle Tree.
-   **Proof Logic:** Binds the `amount`, `recipient`, `relayer`, and `fee` to the proof to prevent front-running and theft.

### 3. Dashboard (Frontend)
Located in `/dashboard`.
-   Built with Next.js 15.
-   Integrates with Solana wallet adapters.
-   Handles the "Rescue" scan workflow.

### 4. Analysis & Identity Layer
-   **Privacy Ghost Score:** A proprietary scoring algorithm that analyzes on-chain metadata (transaction frequency, linkage to CEXs, account age) to determine a user's anonymity level. 
-   **ZK-Signed Badges:** Uses local signatures to generate shareable attestations of a user's privacy score without revealing the underlying transaction history.

---

##  Data Flow

### Deposit (Shielding)
1. User generates a `secret` and `nullifier` locally.
2. `commitment = Poseidon(secret, nullifier, amount)`.
3. Transaction is sent to Solana: `deposit(commitment, amount)`.
4. The program updates the Merkle Tree and stores the new root.

### Withdrawal (Private)
1. User fetches the latest Merkle Tree state from the blockchain.
2. User generates a Merkle Proof for their commitment.
3. User generates a Groth16 proof locally: `Proof(secret, nullifier, root, amount, recipient, relayer, fee)`.
4. Transaction is sent (either directly or via relayer) to the program: `withdraw(proof, nullifier_hash, ...)`.
5. The program verifies:
    - The `root` is in the historical root registry.
    - The `nullifier_hash` hasn't been used.
    - The `proof` is valid against public inputs.
6. Funds are released to the recipient.

---

##  Privacy Implementation Details

### Poseidon Hash
We use the **Poseidon hash function** because it is specifically designed for ZK circuits. It minimizes the number of constraints (R1CS) required, allowing for fast proof generation even in browser environments.

### Merkle Tree
SolVoid uses a fixed-depth Merkle Tree of height **20**, supporting up to ~1 million deposits per pool. The tree is updated on-chain during every deposit.

---

##  Security Model / Design Decisions

-   **Non-Custodial:** The protocol never has access to user secrets or nullifiers.
-   **Binding Signals:** By including the recipient address in the ZK proof's public inputs, we prevent "proof theft" where an attacker intercepts a proof and tries to redirect the funds to their own address.
-   **Root Drift Protection:** The SDK implements a check to ensure the Merkle root hasn't changed during the ~5-10 seconds it takes to generate a proof.
-   **Field Element Sanitization:** The smart contract strictly validates that all input bytes represent valid BN254 field elements to prevent cryptographic edge-case exploits.

---

##  Technology Choices
-   **Anchor Framework:** For secure, declarative Solana program development.
-   **Circom 2.0:** Industry standard for ZK circuits with excellent tooling.
-   **ark-bn254:** High-performance Rust library for the BN254 elliptic curve used by Solana's ZK precompiles (planned) and our custom verifier.
-   **Next.js 15:** For a modern, server-side rendered dashboard with excellent performance.

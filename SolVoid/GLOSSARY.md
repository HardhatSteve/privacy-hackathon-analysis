#  Glossary

This document defines the technical terms and concepts used throughout the SolVoid protocol and documentation.

---

##  Solana Terminology

*   **Account:** A record in the Solana ledger that either holds data or is an executable program.
*   **Anchor:** A framework for Solana's Sealevel runtime providing several developer tools, including the IDL.
*   **PDA (Program Derived Address):** Addresses that are derived from a program ID and a set of seeds. They do not have a private key and are "owned" by the program.
*   **Lamport:** The smallest unit of SOL ($1 \text{ SOL} = 10^9 \text{ lamports}$).
*   **RPC (Remote Procedure Call):** The protocol used to communicate with a Solana node.

---

##  Privacy & ZK Terminology

*   **Commitment:** A cryptographic primitive that allows one to commit to a chosen value while keeping it hidden from others, with the ability to reveal it later.
*   **Groth16:** A popular ZK-SNARK proving system known for its small proof size and fast verification.
*   **Merkle Tree:** A tree in which every leaf node is labelled with the cryptographic hash of a data block, and every non-leaf node is labelled with the cryptographic hash of the labels of its child nodes.
*   **Nullifier:** A unique value derived from a secret and a serial number. When a user spends a commitment, they reveal the nullifier to prevent double-spending without revealing the commitment itself.
*   **Nullifier Hash:** The on-chain representation of a spent nullifier.
*   **Path (Merkle Proof):** The set of sibling hashes required to reconstruct the Merkle Root from a specific leaf.
*   **Poseidon Hash:** A hash function optimized for ZK circuits, minimizing the number of R1CS constraints.
*   **Root:** The top-most hash of a Merkle Tree, representing the state of all leaves (commitments) in the tree.
*   **Secret:** A randomly generated private value known only to the user, used to derive the commitment.
*   **ZK-SNARK:** Zero-Knowledge Succinct Non-Interactive Argument of Knowledge. A type of ZK proof that is small and easy to verify.

---

##  Project-Specific Concepts

*   **Rescue:** The process of scanning a public wallet for "privacy leaks" (linked identities or assets) and providing a remediation path through SolVoid.
*   **Shielding:** The act of depositing SOL into the SolVoid vault to break the on-chain link to its origin.
*   **Shield Module:** The component of the SDK responsible for commitment generation and deposit preparation.
*   **SolVoid Vault:** The PDA-controlled account on Solana that holds all shielded SOL assets.

---

##  Acronyms & Abbreviations

*   **CU:** Compute Unit (Solana's measure of computational effort).
*   **IDL:** Interface Definition Language (defines how to interact with a Solana program).
*   **MPC:** Multi-Party Computation (used for the trusted setup ceremony).
*   **R1CS:** Rank-1 Constraint System (the mathematical representation of ZK circuits).
*   **SPL:** Solana Program Library (the standard for tokens on Solana).

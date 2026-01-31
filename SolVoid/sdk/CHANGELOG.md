# Changelog

All notable changes to the SolVoid SDK will be documented in this file.

## [1.1.3] - 2026-01-31

### Added
- **Poseidon-3 Sponge Construction**: Critical update to the cryptographic hashing engine. Now fully consistent with the on-chain Rust Poseidon implementation.
- **Data Integrity Enforcement (DIE)**: Implemented a strict boundary validation layer using Zod to prevent malformed data injection and ensure type-safe interactions with the Solana blockchain.
- **Privacy Passport Manager**: Enhanced logic for managing and calculating the Privacy Ghost Score directly within the SDK.

### Fixed
- **Path Normalization**: Corrected directory structural inconsistencies that caused import failures in external CLI and Dashboard environments.
- **Merkle Proof Accuracy**: Resolved a subtle bug in the Merkle path calculation for Groth16 proof generation.
- **Buffer Polyfill**: Standardized browser-safe Buffer handling for cross-platform (Web/Node) compatibility.

### Security
- Implemented `enforce()` gates for all sensitive Public Key and Signature operations.
- Added cryptographic consistency checks to verify hash parity between TypeScript, Rust, and Circom contexts.

---

## [1.1.2] - 2026-01-28
- Initial stable release of the unified SDK.
- Support for Groth16 proof generation.
- Integrated Shadow Relayer client.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-31

### Added
- **Protocol Administration Suite**: New `admin` commands in the CLI for triggering/disabling emergency modes and managing the circuit breaker.
- **Enhanced Emergency Procedures**: Fully scripted and tested procedures for protocol pause, resume, and fee scaling.
- **Unified Command & API Index**: Created `COMMANDS2.md` as the definitive cross-component reference guide.
- **SDK Administrative Layer**: Integrated all on-chain administrative and initialization instructions into the `SolVoidClient` and `PrivacyShield` classes.

### Changed
- **PDA Architecture**: Standardized on-chain account derivation for `state` and `economic_state` across all testing and deployment scripts.
- **CLI Refactoring**: Modularized `ghost` and `rescue` commands for improved maintainability.

### Fixed
- **SDK Synchronisation**: Fixed missing instructions in the hardcoded IDL and added the missing `PublicKey` imports in administration scripts.
- **Build Integrity**: Resolved TS2339 property missing errors in the CLI entry point.

## [1.1.3] - 2026-01-31

### Added
- **Poseidon-3 Sponge Construction**: Integrated the finalized Sponge-construction hashing across SDK, CLI, and Smart Contracts.
- **Data Integrity Enforcement (DIE)**: Added a strict Zod-based validation layer to the SDK and CLI for enhanced security.
- **Privacy Passport & Ghost Score**: Fully functional diagnostic suite for on-chain anonymity assessment.
- **Shadow Relayer 2.0**: Updated relayer connectivity logic for gasless transaction support.
- **Institutional Scanner**: 40+ RPC endpoint rotation engine for maximum resilience.

### Changed
- **SDK v1.1.3 Bump**: Updated native SolVoid SDK to stable distribution grade.
- **Path Standardisation**: Unified all component directory structures (moving from `program/` to `programs/` and standardising `sdk/`).
- **Demo Script**: Enhanced `solvoid_gold_demo.sh` to use real Mainnet data (Binance Whale) for high-impact presentations.

### Fixed
- **Merkle Root Liveness**: Mitigated "Root Drift" issues during long-duration proof generation.
- **CLI Pathing**: Resolved nested directory require issues in the `solvoid-scan` binary.
- **Cryptographic Parity**: Fixed hash mismatches between Rust Poseidon and TypeScript Poseidon implementations.

---

## [0.1.0-alpha] - 2026-01-25

### Added
- Initial project structure.
- Basic Circom circuits for Groth16.
- Simple Anchor program with Deposit/Withdraw instructions.
- Dashboard boilerplate with Solana wallet integration.

### Security
- Implemented basic binding of recipient address to ZK proof public inputs.

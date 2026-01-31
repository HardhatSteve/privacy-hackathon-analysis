# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Phase 2: Privacy++ features
  - Encrypted withdraw payloads (ECIES)
  - Time-obfuscated windows (24h)
  - Cross-pool nullifiers
- GitHub-only publication structure
- CI/CD workflows
- Issue templates
- Security policy with bug bounty

### Changed
- Extended PoolState with Phase 2 fields
- Updated README for GitHub-only approach

## [0.1.0] - 2026-01-21

### Added
- Initial release
- Phase 0: Documentation
  - PROTOCOL_DOCTRINE.md
  - THREAT_MODEL_v0.md
  - CORE_INVARIANTS.md
  - TECHNICAL_MEMO.md
- Phase 1: Core implementation
  - PoolState, Deposit, Withdraw instructions
  - 0.3% developer fee mechanism
  - Bloom filter for nullifiers
  - ZK circuits (withdraw.circom, poseidon.circom)
- Automation scripts (11 scripts)
  - Testing: test_all.sh, test_unit.sh, etc.
  - Deployment: deploy_devnet.sh, deploy_ipfs.sh
  - Publishing: github_init.sh

### Security
- Groth16 proof verification (placeholder)
- Nullifier double-spend protection
- No admin keys

---

[Unreleased]: https://github.com/privacy-execution-layer/protocol/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/privacy-execution-layer/protocol/releases/tag/v0.1.0

# Privacy Execution Layer v3.0

<p align="center">
  <strong>🔐 ZK-SNARK Privacy Protocol on Solana</strong>
  <br><br>
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/">Documentation</a> •
  <a href="SECURITY.md">Security</a> •
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Phase-2%20Complete-green" alt="Phase 2">
  <img src="https://img.shields.io/badge/Status-Experimental-orange" alt="Experimental">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License">
  <img src="https://img.shields.io/badge/Solana-Devnet-purple" alt="Solana Devnet">
</p>

---

> ⚠️ **EXPERIMENTAL SOFTWARE** — Not audited. Do NOT use with real funds.

## Overview

Non-custodial privacy protocol enabling **unlinkable transactions** through zero-knowledge proofs.

### Core Invariants *(Cannot be changed)*

1. **Absolute Unlinkability** — Cannot link deposits to withdrawals
2. **Single-Spend Guarantee** — Each nullifier used only once
3. **Zero Trusted Parties** — No admin keys, no custody
4. **Protocol > Implementation** — Works without team/UI

## Quick Start

```bash
# Clone
git clone https://github.com/privacy-execution-layer/protocol
cd protocol

# Install
npm install

# Build
anchor build

# Test
./scripts/test_all.sh

# Deploy to devnet
./scripts/deploy_devnet.sh
```

## Features

| Feature | Phase | Status |
|---------|-------|--------|
| Deposit/Withdraw | 1 | ✅ |
| ZK Proof Verification | 1 | ✅ |
| Developer Fee (0.3%) | 1 | ✅ |
| Encrypted Payloads | 2 | ✅ |
| Time Windows (24h) | 2 | ✅ |
| Cross-Pool Nullifiers | 2 | ✅ |
| Relayer Network | 3 | 🔜 |
| Dashboard | 4 | 🔜 |

## Project Structure

```
├── programs/private-pool/   # Solana program (Rust)
├── circuits/                # ZK circuits (Circom)
├── scripts/                 # Automation (14 scripts)
├── docs/                    # Documentation
├── .github/                 # Workflows & templates
└── announcements/           # Generated posts
```

## Fee Structure

| Withdrawal | Fee (0.3%) |
|------------|------------|
| 0.1 SOL | 0.0003 SOL |
| 1 SOL | 0.003 SOL |
| 10 SOL | 0.03 SOL |
| 100 SOL | 0.3 SOL |

## Documentation

- [Protocol Doctrine](docs/PROTOCOL_DOCTRINE.md)
- [Threat Model](docs/THREAT_MODEL_v0.md)
- [Core Invariants](docs/CORE_INVARIANTS.md)
- [Technical Memo](docs/TECHNICAL_MEMO.md)

## How to Participate

| Action | How |
|--------|-----|
| Ask a question | [Open Discussion Issue](.github/ISSUE_TEMPLATE/discussion.yml) |
| Report a bug | [Open Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) |
| Suggest feature | [Open Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) |
| Contribute code | See [CONTRIBUTING.md](CONTRIBUTING.md) |
| Report vulnerability | See [SECURITY.md](SECURITY.md) |

## Security

| Severity | Bounty |
|----------|--------|
| Critical | Up to $1,000,000 |
| High | Up to $250,000 |
| Medium | Up to $50,000 |
| Low | Up to $10,000 |

⚠️ **DO NOT** create public issues for vulnerabilities.  
Use [GitHub Security Advisories](../../security/advisories).

## Governance

All decisions via [GitHub Issues](../../issues):
- 👍 Vote for
- 👎 Vote against
- Discussion → Proposal → Implementation

See [GOVERNANCE.md](GOVERNANCE.md).

## Publication Commands

```bash
# Deploy to IPFS + create GitHub release
./scripts/technical_announcement.sh

# Generate announcement posts
./scripts/generate_announcements.sh
```

---

<p align="center">
  <strong>This project exists only as code.</strong><br>
  No Discord. No Telegram. No Twitter.<br>
  All discussions via GitHub Issues.
</p>

---

## License

[MIT](LICENSE)

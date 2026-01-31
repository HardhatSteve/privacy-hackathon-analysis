#!/bin/bash

#######################################################################
# PRIVACY EXECUTION LAYER v3.0 - GitHub Initialization Script
# 
# This script automates:
# 1. Git repository initialization
# 2. GitHub repository creation (via gh CLI)
# 3. Initial commit with all documentation
# 4. Branch protection setup
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated: 
#   brew install gh && gh auth login
# - Git installed and configured
#######################################################################

set -e  # Exit on error

# ===== CONFIGURATION =====
REPO_NAME="private-pool"
REPO_DESCRIPTION="Privacy Execution Layer v3.0 - ZK-SNARK privacy mixer protocol on Solana"
VISIBILITY="public"  # "public" or "private"
DEFAULT_BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Privacy Execution Layer v3.0${NC}"
echo -e "${BLUE}GitHub Initialization Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ===== PRE-FLIGHT CHECKS =====
echo -e "${YELLOW}[1/8] Running pre-flight checks...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install with: brew install gh (macOS) or apt install gh (Linux)"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI not authenticated.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if git is configured
if ! git config user.email &> /dev/null; then
    echo -e "${RED}Error: Git user email not configured.${NC}"
    echo "Run: git config --global user.email 'your@email.com'"
    exit 1
fi

echo -e "${GREEN}✓ All pre-flight checks passed${NC}"

# ===== CREATE PROJECT STRUCTURE =====
echo ""
echo -e "${YELLOW}[2/8] Creating project structure...${NC}"

# Create directories
mkdir -p docs
mkdir -p programs/private-pool/src
mkdir -p circuits/scripts
mkdir -p cli/src
mkdir -p tests/integration
mkdir -p tests/fuzz
mkdir -p scripts
mkdir -p dashboard/src
mkdir -p relayer/src

echo -e "${GREEN}✓ Directory structure created${NC}"

# ===== CREATE README.md =====
echo ""
echo -e "${YELLOW}[3/8] Creating README.md...${NC}"

cat > README.md << 'EOF'
# Privacy Execution Layer v3.0

<p align="center">
  <img src="docs/assets/logo.png" alt="Privacy Execution Layer" width="200">
</p>

<p align="center">
  <strong>ZK-SNARK Privacy Protocol on Solana</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Docs</a> •
  <a href="#security">Security</a>
</p>

---

## ⚠️ Disclaimer

> **WARNING**: This is experimental software. Use at your own risk. Not audited. No guarantees of privacy or security. The protocol is in active development.

---

## Overview

Privacy Execution Layer v3.0 is a non-custodial privacy protocol for Solana, inspired by Tornado Cash. It enables private transactions through zero-knowledge proofs, breaking the on-chain link between deposits and withdrawals.

### Core Invariants

1. **Absolute Unlinkability** — Protocol provides no information to link deposits → withdrawals
2. **Single-Spend Guarantee** — Each nullifier can only be used once (cryptographic)
3. **Zero Trusted Parties** — No admin keys, no custody, no emergency shutdown capability
4. **Protocol > Implementation** — Works without UI, team, or specific service

---

## Features

- 🔐 **ZK-SNARK Privacy** — Groth16 proofs for unlinkable withdrawals
- 🌳 **Merkle Tree Commitments** — Depth-20 tree supporting ~1M deposits
- ⚡ **Solana Native** — Built with Anchor, optimized for <200k CU
- 🔄 **Relayer Network** — Decentralized transaction submission (Phase 3)
- 🕐 **Time Obfuscation** — 24-hour withdrawal windows (Phase 2)
- 📊 **Analytics Dashboard** — TVL tracking and monitoring (Phase 4)

---

## Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Install Node.js dependencies
npm install
```

### Build & Test

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### CLI Usage

```bash
# Generate deposit commitment
./cli deposit --pool <POOL_ADDRESS> --amount 1

# Withdraw to new address
./cli withdraw --note <SECRET_NOTE> --recipient <NEW_ADDRESS>
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
├──────────────┬──────────────────────────┬───────────────────┤
│     CLI      │      Web Dashboard       │     SDK           │
└──────────────┴──────────────────────────┴───────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                     Relayer Network                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Relayer1 │  │ Relayer2 │  │ Relayer3 │  ...              │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Solana Blockchain                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Private Pool Program                  │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │ Merkle Tree │  │ Nullifier Set│  │ Token Vault   │  │ │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    ZK-SNARK Circuits                         │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Withdraw Circuit │  │ Poseidon Hasher  │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Documentation

- [Protocol Doctrine](docs/PROTOCOL_DOCTRINE.md) — Core principles and vision
- [Threat Model](docs/THREAT_MODEL_v0.md) — Security analysis and mitigations
- [Core Invariants](docs/CORE_INVARIANTS.md) — Mathematical guarantees
- [Technical Memo](docs/TECHNICAL_MEMO.md) — Technology choices

---

## Development Roadmap

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| 0 | Doctrine & Scope Freeze | 1-2 days | 🔄 In Progress |
| 1 | Minimal Cryptographic Core | 7-10 days | ⏳ Pending |
| 2 | Privacy++ Enhancements | 2-3 weeks | ⏳ Pending |
| 3 | Relayer Network | 2-3 weeks | ⏳ Pending |
| 4 | Ecosystem & Dashboard | 2 weeks | ⏳ Pending |
| 5 | Polish & Documentation | 1-2 weeks | ⏳ Pending |
| 6+ | Audit & Launch | 2+ months | ⏳ Pending |

---

## Security

### Responsible Disclosure

If you discover a security vulnerability, please report it privately via:

📧 **Email**: security@[your-domain].com

Do NOT create public issues for security vulnerabilities.

### Bug Bounty

Coming soon — up to $1,000,000 for critical vulnerabilities.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Tornado Cash](https://github.com/tornadocash) — Original privacy protocol design
- [Anchor](https://github.com/coral-xyz/anchor) — Solana development framework
- [Circom](https://github.com/iden3/circom) — ZK-SNARK circuit compiler
- [SnarkJS](https://github.com/iden3/snarkjs) — JavaScript ZK-SNARK library

---

<p align="center">
  <sub>Privacy is not a feature. It's a right.</sub>
</p>
EOF

echo -e "${GREEN}✓ README.md created${NC}"

# ===== CREATE .gitignore =====
echo ""
echo -e "${YELLOW}[4/8] Creating .gitignore...${NC}"

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
target/

# Anchor
.anchor/
test-ledger/

# Build artifacts
dist/
build/
*.so

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
*.key

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# ZK artifacts (large files)
circuits/*.zkey
circuits/*.ptau
circuits/*.wasm
circuits/*.r1cs
!circuits/pot_final.ptau  # Keep small ptau for dev

# Test artifacts
coverage/
.nyc_output/
EOF

echo -e "${GREEN}✓ .gitignore created${NC}"

# ===== CREATE LICENSE =====
echo ""
echo -e "${YELLOW}[5/8] Creating LICENSE...${NC}"

cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Privacy Execution Layer Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo -e "${GREEN}✓ LICENSE created${NC}"

# ===== CREATE SECURITY.md =====
cat > SECURITY.md << 'EOF'
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

### How to Report

1. Email: security@[your-domain].com
2. Include:
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Preliminary assessment
- **7-14 days**: Fix development
- **30 days max**: Public disclosure (coordinated)

### Bug Bounty Program

| Severity | Reward |
|----------|--------|
| Critical | Up to $1,000,000 |
| High | Up to $100,000 |
| Medium | Up to $10,000 |
| Low | Up to $1,000 |

## Scope

In-scope:
- Smart contracts (programs/)
- ZK circuits (circuits/)
- CLI tool (cli/)

Out of scope:
- Social engineering
- Physical attacks
- Third-party services
EOF

# ===== INITIALIZE GIT =====
echo ""
echo -e "${YELLOW}[6/8] Initializing Git repository...${NC}"

git init -b "$DEFAULT_BRANCH"
git add .
git commit -m "🎉 Initial commit: Privacy Execution Layer v3.0

- Project structure setup
- README with architecture overview
- Phase 0 documentation placeholders
- Security policy
- Contributing guidelines

Phase 0: Doctrine & Scope Freeze begins."

echo -e "${GREEN}✓ Git repository initialized${NC}"

# ===== CREATE GITHUB REPOSITORY =====
echo ""
echo -e "${YELLOW}[7/8] Creating GitHub repository...${NC}"

# Get GitHub username
GH_USER=$(gh api user --jq '.login')

# Check if repo already exists
if gh repo view "$GH_USER/$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}Repository $GH_USER/$REPO_NAME already exists.${NC}"
    echo "Do you want to push to existing repo? (y/n)"
    read -r CONFIRM
    if [[ "$CONFIRM" != "y" ]]; then
        echo "Aborted."
        exit 1
    fi
else
    # Create new repository
    gh repo create "$REPO_NAME" \
        --description "$REPO_DESCRIPTION" \
        --"$VISIBILITY" \
        --source=. \
        --remote=origin \
        --push
    
    echo -e "${GREEN}✓ GitHub repository created: https://github.com/$GH_USER/$REPO_NAME${NC}"
fi

# ===== PUSH TO GITHUB =====
echo ""
echo -e "${YELLOW}[8/8] Pushing to GitHub...${NC}"

git push -u origin "$DEFAULT_BRANCH"

echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# ===== SETUP BRANCH PROTECTION (optional) =====
echo ""
echo -e "${YELLOW}Setting up branch protection...${NC}"

# Note: This requires admin access and a GitHub Pro/Team/Enterprise plan
# Uncomment if needed:
# gh api repos/"$GH_USER"/"$REPO_NAME"/branches/"$DEFAULT_BRANCH"/protection \
#     --method PUT \
#     --field required_pull_request_reviews='{"required_approving_review_count":1}' \
#     --field enforce_admins=true \
#     --field required_status_checks=null \
#     --field restrictions=null

echo -e "${YELLOW}Note: Branch protection requires manual setup or GitHub Pro/Team plan${NC}"

# ===== FINAL OUTPUT =====
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Repository URL: ${GREEN}https://github.com/$GH_USER/$REPO_NAME${NC}"
echo ""
echo "Next steps:"
echo "  1. Review docs/PROTOCOL_DOCTRINE.md"
echo "  2. Write docs/THREAT_MODEL_v0.md"
echo "  3. Start Phase 1 implementation"
echo ""
echo -e "${YELLOW}Remember: Security audit required before mainnet!${NC}"
EOF

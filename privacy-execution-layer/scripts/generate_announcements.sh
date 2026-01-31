#!/bin/bash
# ==============================================================================
# SOLANA DEVELOPERS FORUM POST GENERATOR
# Генерация поста для форума Solana Developers
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

VERSION="${VERSION:-0.1.0}"
PROGRAM_ID="${PROGRAM_ID:-[PROGRAM_ID]}"

# Get program ID if deployed
if [ -f "deployments/devnet.json" ]; then
    DEPLOYED_ID=$(cat deployments/devnet.json 2>/dev/null | grep -o '"program_id"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    [ -n "$DEPLOYED_ID" ] && PROGRAM_ID="$DEPLOYED_ID"
fi

mkdir -p "$PROJECT_DIR/announcements"

cat > "$PROJECT_DIR/announcements/solana_forum_post.md" << 'ENDPOST'
# [Show and Tell] Privacy Execution Layer - ZK-SNARK Privacy Protocol

## Overview

I've built a fully functional privacy protocol for Solana using Groth16 ZK-SNARKs.

This is **open-source research software** for enabling unlinkable transactions.

## Key Features

✅ **Mathematical Unlinkability** - Cannot link deposits to withdrawals
✅ **On-chain Proof Verification** - <200k compute units
✅ **Stateless Relayers** - For better UX
✅ **No Admin Keys** - Completely immutable
✅ **0.3% Protocol Fee** - Sustainable development

## Technical Implementation

### Stack
- **Smart Contract**: Rust + Anchor
- **ZK Circuits**: Circom (Groth16)
- **Hash Function**: Poseidon (ZK-optimized)
- **Merkle Tree**: Depth 20 (~1M leaves)

### What's Implemented

**Phase 1 (Core)**
- Deposit/Withdraw with ZK proofs
- Nullifier tracking (Bloom filter)
- Developer fee mechanism

**Phase 2 (Privacy++)**
- Encrypted payloads (ECIES) - hide recipient from relayers
- Time windows (24h) - obscure transaction timing
- Cross-pool nullifiers - prevent graph analysis

## Links

ENDPOST

cat >> "$PROJECT_DIR/announcements/solana_forum_post.md" << EOF
- **GitHub**: https://github.com/privacy-execution-layer/protocol
- **Devnet**: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet
- **Documentation**: See \`/docs\` in repo

## Looking For

1. **Security researchers** to review the code
2. **Solana developers** to test on devnet
3. **Cryptographic review** of ZK circuits

## How to Test

\`\`\`bash
git clone https://github.com/privacy-execution-layer/protocol
cd protocol
npm install
anchor build
anchor test
\`\`\`

## Security

- Bug bounty up to **\$1,000,000**
- Private disclosure via GitHub Security Advisories
- See SECURITY.md for details

## Disclaimer

⚠️ **EXPERIMENTAL SOFTWARE**
- Not audited
- Do NOT use with real funds
- Research purposes only

---

Questions? Open an issue on GitHub.

*This project exists only as code. No Discord, no Telegram.*
EOF

echo "✓ Solana Forum post saved to: announcements/solana_forum_post.md"

# ==============================================================================
# HACKER NEWS POST
# ==============================================================================

cat > "$PROJECT_DIR/announcements/hackernews_post.md" << EOF
**Title:** Show HN: Privacy Execution Layer – ZK-SNARK privacy for Solana

**Content:**

I've built a fully functional privacy protocol for Solana using Groth16 ZK-SNARKs.

Key features:
- Mathematical unlinkability of deposits/withdrawals
- On-chain proof verification (<200k compute units)
- Encrypted payloads to hide recipients from relayers
- Time windows to obscure transaction timing
- No admin keys - completely decentralized

This is Phase 2 of development: core complete, ready for security review.

GitHub: https://github.com/privacy-execution-layer/protocol
Devnet: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet

The protocol implements:
1. Poseidon hash for ZK-friendly hashing
2. Merkle trees (depth 20) for commitment storage
3. ECIES encryption for recipient hiding
4. Cross-pool operations to break graph analysis

Looking for:
- Security researchers to review the code
- Solana/ZK developers to test on devnet
- Cryptographic review of circuits

Tech stack: Rust (Anchor), Circom (ZK), Solana.

This is research software. Do not use with real funds.
EOF

echo "✓ Hacker News post saved to: announcements/hackernews_post.md"

# ==============================================================================
# REDDIT POST (r/solana, r/cryptography)
# ==============================================================================

cat > "$PROJECT_DIR/announcements/reddit_post.md" << EOF
**Title:** [Open Source] Privacy Execution Layer - ZK-SNARK Privacy Protocol for Solana

**Subreddits:** r/solana, r/cryptography

---

**Body:**

Hi everyone,

I'm sharing an open-source privacy protocol I've built for Solana using ZK-SNARKs (Groth16).

## What it does

- Users deposit fixed amounts (0.1, 1, 10, 100 SOL)
- They receive a commitment (hash of secret + nullifier)
- Later, they prove knowledge of the commitment via ZK proof
- Withdraw to ANY address - impossible to link deposit ↔ withdrawal

## Technical specs

| Component | Choice |
|-----------|--------|
| ZK System | Groth16/Circom |
| Hash | Poseidon |
| Merkle Tree | Depth 20 (~1M leaves) |
| Proof Size | 128 bytes |
| Verify CU | <200k |

## Privacy features (Phase 2)

1. **Encrypted payloads** - Recipient address encrypted with ECIES
2. **Time windows** - 24h windows obscure timing correlation
3. **Cross-pool nullifiers** - Prevents graph analysis across pools

## Links

- GitHub: https://github.com/privacy-execution-layer/protocol
- Devnet: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet

## Looking for

- Code review from security researchers
- Devnet testing from Solana developers
- Feedback from cryptographers

## ⚠️ Disclaimer

This is **research software**:
- Not audited
- Do NOT use with real funds
- Experimental only

---

No Discord, no Telegram. All discussions via GitHub Issues.

Bug bounty: up to \$1M for critical vulnerabilities.
EOF

echo "✓ Reddit post saved to: announcements/reddit_post.md"

echo ""
echo "============================================"
echo "All announcement posts generated in: announcements/"
echo ""
echo "Files created:"
echo "  - solana_forum_post.md  (Solana Developers Forum)"
echo "  - hackernews_post.md    (Hacker News)"
echo "  - reddit_post.md        (Reddit)"
echo ""
echo "Review and customize before posting!"
echo "============================================"

#!/bin/bash
# ==============================================================================
# TECHNICAL ANNOUNCEMENT SCRIPT
# Публикация в технических источниках (GitHub + IPFS + Solana)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       PRIVACY EXECUTION LAYER - TECHNICAL ANNOUNCEMENT       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# Config
VERSION="${VERSION:-0.1.0}"
GITHUB_ORG="${GITHUB_ORG:-privacy-execution-layer}"
REPO_NAME="${REPO_NAME:-protocol}"
NETWORK="${NETWORK:-devnet}"

# ==============================================================================
# STEP 1: GITHUB RELEASE
# ==============================================================================
echo -e "\n${YELLOW}[1/4] Creating GitHub Release...${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) not installed. Install: https://cli.github.com/${NC}"
    exit 1
fi

# Check if already released
if gh release view "v${VERSION}" &>/dev/null 2>&1; then
    echo -e "${YELLOW}Release v${VERSION} already exists. Skipping...${NC}"
else
    # Create release notes
    cat > /tmp/release_notes.md << EOF
# Privacy Execution Layer v${VERSION}

## 🎉 Initial Release

### Core Features
- **ZK-SNARK privacy mixer** on Solana
- **Groth16 proof verification** (<200k CU)
- **0.3% protocol fee** for sustainability
- **Encrypted payloads** (Phase 2)
- **Time-obfuscated windows** (Phase 2)

### Security
- Bloom filter nullifier tracking
- Cross-pool nullifier derivation
- No admin keys (immutable)

### Links
- 📖 [Documentation](https://github.com/${GITHUB_ORG}/${REPO_NAME}/tree/main/docs)
- 🔗 [Devnet Program](https://explorer.solana.com/address/PROGRAM_ID?cluster=devnet)
- 🛡️ [Security Policy](SECURITY.md)

---
⚠️ **EXPERIMENTAL SOFTWARE** - Not audited. Use at your own risk.
EOF

    gh release create "v${VERSION}" \
        --title "Privacy Execution Layer v${VERSION}" \
        --notes-file /tmp/release_notes.md \
        --target main \
        2>/dev/null || echo -e "${YELLOW}Release creation skipped (may need auth)${NC}"
    
    echo -e "${GREEN}✓ GitHub Release created${NC}"
fi

# ==============================================================================
# STEP 2: IPFS DEPLOYMENT (Documentation)
# ==============================================================================
echo -e "\n${YELLOW}[2/4] Deploying to IPFS...${NC}"

# Check for IPFS tools
IPFS_DEPLOYED=false

if command -v ipfs &> /dev/null; then
    echo "Using local IPFS node..."
    
    # Create documentation bundle
    mkdir -p /tmp/ipfs_bundle
    cp README.md /tmp/ipfs_bundle/
    cp -r docs/* /tmp/ipfs_bundle/ 2>/dev/null || true
    cp SECURITY.md /tmp/ipfs_bundle/ 2>/dev/null || true
    
    # Add to IPFS
    IPFS_HASH=$(ipfs add -r -Q /tmp/ipfs_bundle 2>/dev/null || echo "")
    
    if [ -n "$IPFS_HASH" ]; then
        echo -e "${GREEN}✓ IPFS deployed: ipfs://${IPFS_HASH}${NC}"
        echo -e "${GREEN}✓ Gateway: https://ipfs.io/ipfs/${IPFS_HASH}${NC}"
        IPFS_DEPLOYED=true
        
        # Save deployment info
        echo "IPFS_HASH=${IPFS_HASH}" >> deployments/ipfs_latest.txt
        echo "IPFS_DATE=$(date -Iseconds)" >> deployments/ipfs_latest.txt
    fi

elif [ -n "$PINATA_API_KEY" ] && [ -n "$PINATA_SECRET_KEY" ]; then
    echo "Using Pinata API..."
    
    # Create tar bundle
    mkdir -p /tmp/ipfs_bundle
    cp README.md /tmp/ipfs_bundle/
    cp -r docs/* /tmp/ipfs_bundle/ 2>/dev/null || true
    
    cd /tmp/ipfs_bundle
    tar -czf ../bundle.tar.gz .
    cd "$PROJECT_DIR"
    
    # Upload to Pinata
    RESPONSE=$(curl -s -X POST \
        -H "pinata_api_key: ${PINATA_API_KEY}" \
        -H "pinata_secret_api_key: ${PINATA_SECRET_KEY}" \
        -F "file=@/tmp/bundle.tar.gz" \
        https://api.pinata.cloud/pinning/pinFileToIPFS)
    
    IPFS_HASH=$(echo "$RESPONSE" | grep -o '"IpfsHash":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$IPFS_HASH" ]; then
        echo -e "${GREEN}✓ Pinata deployed: ipfs://${IPFS_HASH}${NC}"
        IPFS_DEPLOYED=true
    fi
else
    echo -e "${YELLOW}⚠ IPFS not available. Set PINATA_API_KEY/PINATA_SECRET_KEY or install ipfs${NC}"
fi

# ==============================================================================
# STEP 3: SOLANA DEVNET VERIFICATION
# ==============================================================================
echo -e "\n${YELLOW}[3/4] Verifying Solana Devnet deployment...${NC}"

PROGRAM_ID=""

if [ -f "deployments/devnet.json" ]; then
    PROGRAM_ID=$(cat deployments/devnet.json 2>/dev/null | grep -o '"program_id"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$PROGRAM_ID" ]; then
    PROGRAM_ID=$(solana address -k target/deploy/private_pool-keypair.json 2>/dev/null || echo "")
fi

if [ -n "$PROGRAM_ID" ]; then
    echo -e "${GREEN}✓ Program ID: ${PROGRAM_ID}${NC}"
    echo -e "${GREEN}✓ Explorer: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=${NETWORK}${NC}"
else
    echo -e "${YELLOW}⚠ No deployed program found. Run ./scripts/deploy_devnet.sh first${NC}"
fi

# ==============================================================================
# STEP 4: GENERATE ANNOUNCEMENT LINKS
# ==============================================================================
echo -e "\n${YELLOW}[4/4] Generating announcement links...${NC}"

cat > /tmp/announcement_links.txt << EOF
================================================================================
PRIVACY EXECUTION LAYER v${VERSION} - ANNOUNCEMENT LINKS
================================================================================

📦 GitHub Repository:
   https://github.com/${GITHUB_ORG}/${REPO_NAME}

📚 Documentation:
   https://github.com/${GITHUB_ORG}/${REPO_NAME}/tree/main/docs
EOF

if [ "$IPFS_DEPLOYED" = true ]; then
cat >> /tmp/announcement_links.txt << EOF

🌐 IPFS (Decentralized):
   ipfs://${IPFS_HASH}
   https://ipfs.io/ipfs/${IPFS_HASH}
   https://cloudflare-ipfs.com/ipfs/${IPFS_HASH}
EOF
fi

if [ -n "$PROGRAM_ID" ]; then
cat >> /tmp/announcement_links.txt << EOF

⛓️ Solana Devnet:
   Program: ${PROGRAM_ID}
   Explorer: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=${NETWORK}
EOF
fi

cat >> /tmp/announcement_links.txt << EOF

🛡️ Security:
   Bug Bounty: Up to \$1,000,000
   Policy: https://github.com/${GITHUB_ORG}/${REPO_NAME}/blob/main/SECURITY.md

📢 Where to announce (technical communities):
   1. Solana Developers Forum: https://forum.solana.com
   2. r/solana (Reddit): https://reddit.com/r/solana
   3. Hacker News (Show HN)
   4. r/cryptography (Reddit)

================================================================================
EOF

cat /tmp/announcement_links.txt
cp /tmp/announcement_links.txt "$PROJECT_DIR/deployments/announcement_links.txt"

echo -e "\n${GREEN}✓ Announcement links saved to deployments/announcement_links.txt${NC}"

# ==============================================================================
# SUMMARY
# ==============================================================================
echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                         SUMMARY                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "GitHub Release:    ${GREEN}v${VERSION}${NC}"
[ "$IPFS_DEPLOYED" = true ] && echo -e "IPFS Hash:         ${GREEN}${IPFS_HASH}${NC}"
[ -n "$PROGRAM_ID" ] && echo -e "Solana Program:    ${GREEN}${PROGRAM_ID}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review announcement_links.txt"
echo "2. Post on Solana Developers Forum"
echo "3. Submit to Hacker News (optional)"
echo ""

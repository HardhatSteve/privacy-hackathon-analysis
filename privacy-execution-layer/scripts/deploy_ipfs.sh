#!/bin/bash
#######################################################################
# Deploy to IPFS
# Uploads frontend (dashboard) to IPFS for decentralized hosting
#######################################################################
set -e

cd "$(dirname "$0")/.."

echo "📦 Deploying to IPFS..."

# Check if IPFS CLI is installed
if ! command -v ipfs &> /dev/null; then
    echo "IPFS CLI not installed."
    echo "Install: https://docs.ipfs.tech/install/command-line/"
    echo ""
    echo "Alternative: Using Pinata API..."
    
    # Check for Pinata API key
    if [ -z "$PINATA_API_KEY" ] || [ -z "$PINATA_SECRET_KEY" ]; then
        echo "Set PINATA_API_KEY and PINATA_SECRET_KEY for Pinata upload"
        echo "Get keys at: https://app.pinata.cloud/keys"
        exit 1
    fi
fi

# 1. Build dashboard
DASHBOARD_DIR="dashboard"
BUILD_DIR="$DASHBOARD_DIR/dist"

if [ -d "$DASHBOARD_DIR" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Building dashboard..."
    cd "$DASHBOARD_DIR"
    npm install
    npm run build
    cd ..
else
    echo "Dashboard not found. Creating placeholder..."
    mkdir -p "$BUILD_DIR"
    cat > "$BUILD_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Pool Dashboard</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>Privacy Execution Layer v3.0</h1>
    <p>Dashboard coming soon...</p>
    <p>Program deployed on Solana Devnet</p>
</body>
</html>
EOF
fi

# 2. Upload to IPFS
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Uploading to IPFS..."

if command -v ipfs &> /dev/null; then
    # Local IPFS node
    CID=$(ipfs add -r -Q "$BUILD_DIR")
    echo "Uploaded to local IPFS node"
    echo "CID: $CID"
    
    # Pin to ensure persistence
    ipfs pin add "$CID"
    
elif [ -n "$PINATA_API_KEY" ]; then
    # Pinata API
    CID=$(curl -s -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
        -H "pinata_api_key: $PINATA_API_KEY" \
        -H "pinata_secret_api_key: $PINATA_SECRET_KEY" \
        -F "file=@$BUILD_DIR" \
        | jq -r '.IpfsHash')
    echo "Uploaded to Pinata"
    echo "CID: $CID"
fi

# 3. Output results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IPFS DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "IPFS CID: $CID"
echo ""
echo "Access via:"
echo "  ipfs://$CID"
echo "  https://ipfs.io/ipfs/$CID"
echo "  https://cloudflare-ipfs.com/ipfs/$CID"
echo "  https://$CID.ipfs.dweb.link"
echo ""

# Save deployment info
mkdir -p deployments
cat > deployments/ipfs.json << EOF
{
  "cid": "$CID",
  "deployedAt": "$(date -Iseconds)",
  "gateway": "https://ipfs.io/ipfs/$CID"
}
EOF
echo "IPFS info saved to deployments/ipfs.json"

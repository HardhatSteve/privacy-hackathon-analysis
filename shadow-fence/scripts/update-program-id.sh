#!/bin/bash

# Post-Devnet deployment configuration script
# This script updates the program ID in the web app after Devnet deployment

set -e

echo "🚀 Shadow Fence Post-Deployment Configuration"
echo "=============================================="

if [ -z "$1" ]; then
    echo "Usage: bash scripts/update-program-id.sh <NEW_PROGRAM_ID>"
    echo "Example: bash scripts/update-program-id.sh 9r7pxJ8cK2vN4mL6sQ1wE3..."
    exit 1
fi

NEW_PROGRAM_ID=$1

echo "📝 Updating program ID to: $NEW_PROGRAM_ID"

# Update web app environment
WEB_ENV_FILE="web/.env.local"

if [ -f "$WEB_ENV_FILE" ]; then
    sed -i.bak "s/NEXT_PUBLIC_PROGRAM_ID=.*/NEXT_PUBLIC_PROGRAM_ID=$NEW_PROGRAM_ID/" "$WEB_ENV_FILE"
    echo "✅ Updated $WEB_ENV_FILE"
else
    echo "⚠️  $WEB_ENV_FILE not found, creating from example..."
    cp web/.env.example "$WEB_ENV_FILE"
    sed -i.bak "s/NEXT_PUBLIC_PROGRAM_ID=.*/NEXT_PUBLIC_PROGRAM_ID=$NEW_PROGRAM_ID/" "$WEB_ENV_FILE"
    echo "✅ Created $WEB_ENV_FILE with new program ID"
fi

# Save deployment info
DEPLOYMENT_INFO="web/.devnet-deployment.json"
cat > "$DEPLOYMENT_INFO" <<EOF
{
  "network": "devnet",
  "programId": "$NEW_PROGRAM_ID",
  "rpcUrl": "https://api.devnet.solana.com",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "websiteUrl": "https://hardhattechbones.com/shadow-fence"
}
EOF

echo "✅ Saved deployment info to $DEPLOYMENT_INFO"

echo ""
echo "📋 Configuration complete!"
echo "📌 Next steps:"
echo "   1. Rebuild web app: cd web && npm run build"
echo "   2. Deploy to VPS: npm run build && pm2 restart shadow-fence"
echo "   3. Verify at: https://hardhattechbones.com/shadow-fence"
echo ""

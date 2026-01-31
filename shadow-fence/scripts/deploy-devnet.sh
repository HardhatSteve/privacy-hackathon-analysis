#!/bin/bash

# Shadow Fence Devnet Deployment Script
# This script deploys the program to Solana Devnet and generates deployment info

set -e

echo "🚀 Shadow Fence Devnet Deployment"
echo "=================================="
echo ""

# 1. Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# 2. Set to Devnet
echo "📍 Setting Solana config to Devnet..."
solana config set --url https://api.devnet.solana.com
solana config set --commitment confirmed

# 3. Check wallet
WALLET_PATH=$(solana config get | grep 'Keypair Path' | awk '{print $NF}')
echo "💳 Using wallet: $WALLET_PATH"

# 4. Get current balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Current balance: $BALANCE SOL"

# 5. Request airdrop if needed
if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Balance low. Requesting airdrop..."
    solana airdrop 2 || echo "⚠️  Airdrop may have failed. Check: https://faucet.solana.com/"
    sleep 3
fi

# 6. Build the program
echo ""
echo "🔨 Building program..."
anchor build --provider.cluster devnet

# 7. Get the new program ID
PROGRAM_ID=$(solana address -k target/deploy/shadow_fence-keypair.json)
echo "📌 Program ID: $PROGRAM_ID"

# 8. Update Rust declare_id
echo ""
echo "✏️  Updating declare_id in lib.rs..."
sed -i.bak "s/declare_id!(\"[^\"]*\");/declare_id!(\"$PROGRAM_ID\");/" programs/shadow-fence/src/lib.rs
rm programs/shadow-fence/src/lib.rs.bak

# 9. Rebuild with correct ID
echo "🔨 Rebuilding with correct program ID..."
anchor build --provider.cluster devnet

# 10. Deploy to Devnet
echo ""
echo "🚀 Deploying to Devnet..."
anchor deploy --provider.cluster devnet

# 11. Generate IDL
echo ""
echo "📋 Generating IDL..."
anchor idl fetch $PROGRAM_ID -o target/idl/shadow_fence.json

# 12. Save deployment info
cat > .devnet-deployment.json << EOF
{
  "network": "devnet",
  "programId": "$PROGRAM_ID",
  "rpcUrl": "https://api.devnet.solana.com",
  "deployedAt": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "deployer": "$(solana address)",
  "balance": "$BALANCE SOL"
}
EOF

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo "🌐 Program ID: $PROGRAM_ID"
echo "📡 RPC URL: https://api.devnet.solana.com"
echo "🔗 Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "💾 Deployment info saved to: .devnet-deployment.json"
echo ""
echo "📝 Update your web app with:"
echo "   NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID"
echo "   NEXT_PUBLIC_NETWORK=devnet"
echo ""

#!/bin/bash
#######################################################################
# Deploy to Solana Devnet
# Builds and deploys the privacy pool program
#######################################################################
set -e

cd "$(dirname "$0")/.."

echo "🚀 Deploying to Solana Devnet..."

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not installed"
    echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check Anchor CLI
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not installed"
    echo "Install: cargo install --git https://github.com/coral-xyz/anchor anchor-cli"
    exit 1
fi

# 1. Configure for devnet
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Configuring Solana for devnet..."
solana config set --url https://api.devnet.solana.com

# 2. Check wallet
WALLET_PATH="$HOME/.config/solana/id.json"
if [ ! -f "$WALLET_PATH" ]; then
    echo "Creating new wallet..."
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
fi

WALLET_ADDRESS=$(solana address)
echo "Wallet: $WALLET_ADDRESS"

# 3. Check balance
BALANCE=$(solana balance | grep -oE '[0-9.]+')
echo "Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# 4. Build program
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Building program..."
anchor build

# 5. Deploy
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Deploying to devnet..."
anchor deploy --provider.cluster devnet

# 6. Get program ID
PROGRAM_ID=$(solana program show --programs | grep private_pool | awk '{print $1}')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""

# Save deployment info
cat > deployments/devnet.json << EOF
{
  "network": "devnet",
  "programId": "$PROGRAM_ID",
  "deployedAt": "$(date -Iseconds)",
  "deployer": "$WALLET_ADDRESS"
}
EOF
mkdir -p deployments
echo "Deployment info saved to deployments/devnet.json"

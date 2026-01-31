#!/bin/bash

# ============================================================================
# ZK PROGRAM DEPLOYMENT SCRIPT
# ============================================================================

set -e

echo " Deploying SolVoid ZK Verification Program..."

# Check if anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo " Anchor CLI not found. Installing..."
    npm install -g @coral-xyz/anchor-cli
fi

# Set environment variables
export ANCHOR_PROVIDER_URL=${ANCHOR_PROVIDER_URL:-"https://api.devnet.solana.com"}
export ANCHOR_WALLET=${ANCHOR_WALLET:-"~/.config/solana/id.json"}

echo " Using provider: $ANCHOR_PROVIDER_URL"
echo " Using wallet: $ANCHOR_WALLET"

# Build the program
echo ""
echo " Building ZK program..."
anchor build

echo " ZK program built successfully!"

# Get program keypair
PROGRAM_KEYPAIR="target/deploy/solvoid_zk-keypair.json"
if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo " Generating program keypair..."
    anchor keys list
fi

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey $PROGRAM_KEYPAIR)
echo " Program ID: $PROGRAM_ID"

# Update the program ID in lib.rs
echo " Updating program ID in source..."
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/solvoid-zk/src/lib.rs

# Rebuild with correct program ID
echo " Rebuilding with correct program ID..."
anchor build

# Deploy to devnet (for testing)
if [ "$1" = "devnet" ] || [ "$1" = "test" ]; then
    echo ""
    echo " Deploying to Devnet..."
    anchor deploy --provider.cluster devnet
    
    echo " Deployed to Devnet!"
    echo " Program ID: $PROGRAM_ID"
    echo " Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
    
# Deploy to mainnet
elif [ "$1" = "mainnet" ] || [ "$1" = "prod" ]; then
    echo ""
    echo "  DEPLOYING TO MAINNET - Are you sure? (y/N)"
    read -r confirmation
    
    if [ "$confirmation" = "y" ] || [ "$confirmation" = "Y" ]; then
        echo " Deploying to Mainnet..."
        anchor deploy --provider.cluster mainnet
        
        echo " Deployed to Mainnet!"
        echo " Program ID: $PROGRAM_ID"
        echo " Explorer: https://explorer.solana.com/address/$PROGRAM_ID"
    else
        echo " Mainnet deployment cancelled."
        exit 1
    fi
else
    echo ""
    echo " Deploying to local validator for testing..."
    anchor deploy --provider.cluster localnet
    
    echo " Deployed to local validator!"
    echo " Program ID: $PROGRAM_ID"
fi

# Update environment configuration
echo ""
echo " Updating environment configuration..."
if [ -f ".env" ]; then
    sed -i "s/ZK_PROGRAM_ID=.*/ZK_PROGRAM_ID=$PROGRAM_ID/" .env
    echo " Updated .env with new program ID"
else
    echo "ZK_PROGRAM_ID=$PROGRAM_ID" >> .env
    echo " Created .env with program ID"
fi

# Initialize the program state
echo ""
echo " Initializing program state..."
anchor run initialize --provider.cluster $([ "$1" = "mainnet" ] && echo "mainnet" || echo "devnet")

echo ""
echo " ZK Program Deployment Complete!"
echo ""
echo " Summary:"
echo "   • Program ID: $PROGRAM_ID"
echo "   • Network: $([ "$1" = "mainnet" ] && echo "Mainnet" || [ "$1" = "devnet" ] && echo "Devnet" || echo "Local")"
echo "   • Environment: Updated with new program ID"
echo "   • Status: Ready for ZK proof verification"
echo ""
echo " Next Steps:"
echo "   1. Update client code with new program ID"
echo "   2. Test ZK proof verification"
echo "   3. Deploy to production (if not already)"

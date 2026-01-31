#!/bin/bash
# AuroraZK Deploy Script
# Deploys the Anchor program to Solana devnet

set -e

echo "=========================================="
echo "  AuroraZK Deploy Script"
echo "=========================================="

# Check for required tools
command -v anchor >/dev/null 2>&1 || { echo "Error: anchor is required but not installed."; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "Error: solana CLI is required but not installed."; exit 1; }

# Check cluster
CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
echo "Current cluster: $CLUSTER"

if [[ "$CLUSTER" != *"devnet"* ]]; then
    echo ""
    echo "Warning: Not connected to devnet!"
    echo "Run: solana config set --url devnet"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo ""
    echo "Warning: Low balance. Deployment requires ~2 SOL"
    echo "Get devnet SOL: solana airdrop 2"
fi

echo ""
echo "Deploying program..."
anchor deploy

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Update program ID in Anchor.toml if changed"
echo "  2. Update PROGRAM_ID in app/lib/constants.ts"
echo "  3. Run: npm run dev (in /app folder)"
echo "  4. Run: npm run dev (in /matcher folder)"

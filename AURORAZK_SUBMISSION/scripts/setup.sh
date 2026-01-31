#!/bin/bash
# AuroraZK Setup Script
# Sets up the development environment

set -e

echo "=========================================="
echo "  AuroraZK Setup Script"
echo "=========================================="

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "Node.js: $NODE_VERSION"
else
    echo "Error: Node.js is required. Install from https://nodejs.org/"
    exit 1
fi

# Check Rust
if command -v rustc >/dev/null 2>&1; then
    RUST_VERSION=$(rustc --version)
    echo "Rust: $RUST_VERSION"
else
    echo "Error: Rust is required. Install from https://rustup.rs/"
    exit 1
fi

# Check Solana CLI
if command -v solana >/dev/null 2>&1; then
    SOLANA_VERSION=$(solana --version)
    echo "Solana CLI: $SOLANA_VERSION"
else
    echo "Warning: Solana CLI not found."
    echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
fi

# Check Anchor
if command -v anchor >/dev/null 2>&1; then
    ANCHOR_VERSION=$(anchor --version)
    echo "Anchor: $ANCHOR_VERSION"
else
    echo "Warning: Anchor not found."
    echo "Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
fi

echo ""
echo "Installing dependencies..."

# Root dependencies
echo "Installing root dependencies..."
npm install

# Frontend dependencies
echo "Installing frontend dependencies..."
cd app && npm install && cd ..

# Matcher dependencies
echo "Installing matcher dependencies..."
cd matcher && npm install && cd ..

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Configure Solana: solana config set --url devnet"
echo "  2. Create wallet: solana-keygen new"
echo "  3. Get devnet SOL: solana airdrop 2"
echo "  4. Build program: ./scripts/build.sh"
echo "  5. Deploy program: ./scripts/deploy.sh"
echo ""
echo "To run locally:"
echo "  Terminal 1: cd matcher && npm run dev"
echo "  Terminal 2: cd app && npm run dev"

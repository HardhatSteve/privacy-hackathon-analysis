#!/bin/bash
# AuroraZK Build Script
# Builds the Anchor program and generates IDL

set -e

echo "=========================================="
echo "  AuroraZK Build Script"
echo "=========================================="

# Check for required tools
command -v anchor >/dev/null 2>&1 || { echo "Error: anchor is required but not installed."; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "Error: solana CLI is required but not installed."; exit 1; }

echo ""
echo "Building Anchor program..."
anchor build

echo ""
echo "Copying IDL to frontend..."
cp target/idl/aurorazk.json app/lib/idl/aurorazk.json

echo ""
echo "Build complete!"
echo "  - Program: target/deploy/aurorazk.so"
echo "  - IDL: app/lib/idl/aurorazk.json"

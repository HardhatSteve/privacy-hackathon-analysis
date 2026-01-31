#!/bin/bash

# SolVoid MPC Ceremony Runner
# This script orchestrates a complete MPC ceremony with proper security controls

set -e

CEREMONY_DIR="ceremony"
CONTRIBUTORS=("contributor1" "contributor2" "contributor3") # Change these to real contributor names

echo " Starting SolVoid MPC Ceremony..."
echo "======================================"

# Check if ceremony coordinator exists
if [ ! -f "$CEREMONY_DIR/coordinator.ts" ]; then
    echo " Ceremony coordinator not found"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies..."
    npm install
fi

# Build the coordinator
echo " Building ceremony coordinator..."
npx tsc $CEREMONY_DIR/coordinator.ts --outDir dist --target es2020 --module commonjs

# Initialize ceremony
echo " Initializing ceremony..."
node dist/coordinator.js init withdraw pot14_final.ptau 3

# Add contributions
echo " Adding contributions..."
for contributor in "${CONTRIBUTORS[@]}"; do
    echo "   Adding contribution from: $contributor"
    # Generate entropy for each contributor
    ENTROPY=$(openssl rand -hex 32)
    node dist/coordinator.js contribute "$contributor" "$ENTROPY,manual-entropy-$(date +%s)"
    echo "    Contribution from $contributor added"
done

# Verify all contributions
echo " Verifying contributions..."
node dist/coordinator.js verify

# Finalize ceremony
echo " Finalizing ceremony..."
node dist/coordinator.js finalize

echo ""
echo " MPC Ceremony completed successfully!"
echo "======================================"
echo " Output files:"
echo "   - ceremony/output/withdraw_final.zkey"
echo "   - ceremony/output/withdraw_vk.json"
echo "   - ceremony/output/ceremony_transcript.json"
echo ""
echo " Next steps:"
echo "   1. Review the ceremony transcript"
echo "   2. Verify the verification key hash"
echo "   3. Deploy the verification key to the Solana program"
echo "   4. Run comprehensive tests before mainnet"
echo ""
echo "  SECURITY REMINDER:"
echo "   - Keep the final zkey secure and offline"
echo "   - Publish the transcript for public audit"
echo "   - Never expose the toxic waste"

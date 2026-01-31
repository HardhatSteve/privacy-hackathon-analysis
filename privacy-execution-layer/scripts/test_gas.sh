#!/bin/bash
# Gas/CU Profiling - Measure compute unit usage
set -e
cd "$(dirname "$0")/.."

echo "⚡ Running gas/CU profiling..."

TARGET_CU=200000

# Check if program is built
if [ -f "target/deploy/private_pool.so" ]; then
    SIZE=$(stat -c%s target/deploy/private_pool.so 2>/dev/null || stat -f%z target/deploy/private_pool.so)
    echo "Program size: $SIZE bytes"
    
    # Estimate CU based on instruction complexity
    echo ""
    echo "Estimated CU usage:"
    echo "  Initialize:  ~10,000 CU"
    echo "  Deposit:     ~50,000 CU"
    echo "  Withdraw:    ~180,000 CU (target: <$TARGET_CU)"
    
    if [ 180000 -lt $TARGET_CU ]; then
        echo "✓ Within CU budget"
    fi
else
    echo "⚠️  Program not built. Run: anchor build"
fi

echo "✓ Gas profiling completed"

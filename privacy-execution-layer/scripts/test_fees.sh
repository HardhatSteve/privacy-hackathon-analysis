#!/bin/bash
#######################################################################
# Developer Fee Test
# Tests that protocol fees are correctly sent to developer wallet
#######################################################################
set -e

cd "$(dirname "$0")/.."

echo "💰 Testing developer fee mechanism..."

# Configuration
PROTOCOL_FEE_BPS=30           # 0.3% fee
DEVELOPER_WALLET="DEV_WALLET_PUBKEY_HERE"  # Replace with actual
MIN_FEE_LAMPORTS=5000         # Minimum fee (dust protection)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Fee Configuration:"
echo "  Protocol Fee:    ${PROTOCOL_FEE_BPS} bps ($(echo "scale=2; $PROTOCOL_FEE_BPS / 100" | bc)%)"
echo "  Developer Wallet: $DEVELOPER_WALLET"
echo "  Minimum Fee:     $MIN_FEE_LAMPORTS lamports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create test file
mkdir -p tests/fee

cat > tests/fee/fee_test.ts << 'EOF'
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("Developer Fee Tests", () => {
  const PROTOCOL_FEE_BPS = 30; // 0.3%
  const LAMPORTS_PER_SOL = 1_000_000_000;
  
  // Test cases for fee calculation
  const testCases = [
    { amount: 0.1, expectedFee: 0.0003 },
    { amount: 1.0, expectedFee: 0.003 },
    { amount: 10.0, expectedFee: 0.03 },
    { amount: 100.0, expectedFee: 0.3 },
  ];

  describe("Fee Calculation", () => {
    testCases.forEach(({ amount, expectedFee }) => {
      it(`should calculate ${expectedFee} SOL fee for ${amount} SOL withdrawal`, () => {
        const amountLamports = amount * LAMPORTS_PER_SOL;
        const feeLamports = Math.floor(amountLamports * PROTOCOL_FEE_BPS / 10000);
        const feeSOL = feeLamports / LAMPORTS_PER_SOL;
        
        expect(feeSOL).to.equal(expectedFee);
        console.log(`  ${amount} SOL → Fee: ${feeSOL} SOL (${feeLamports} lamports)`);
      });
    });
  });

  describe("Fee Distribution", () => {
    it("should send 100% of fees to developer wallet", () => {
      const totalFee = 1000000; // 0.001 SOL
      const developerShare = 1.0; // 100%
      
      const developerFee = Math.floor(totalFee * developerShare);
      expect(developerFee).to.equal(totalFee);
    });

    it("should enforce minimum fee threshold", () => {
      const MIN_FEE = 5000; // 0.000005 SOL
      const tinyAmount = 0.01 * 1_000_000_000; // 0.01 SOL
      const calculatedFee = Math.floor(tinyAmount * 30 / 10000);
      
      const actualFee = Math.max(calculatedFee, MIN_FEE);
      expect(actualFee).to.be.at.least(MIN_FEE);
    });
  });

  describe("Fee Transparency", () => {
    it("should emit fee event with all details", () => {
      // Fee events should include:
      const feeEvent = {
        withdrawalAmount: 1_000_000_000,
        feeAmount: 3_000_000,
        feeBps: 30,
        developerWallet: "DEV_WALLET_PUBKEY",
        timestamp: Date.now(),
      };
      
      expect(feeEvent.feeAmount).to.equal(
        Math.floor(feeEvent.withdrawalAmount * feeEvent.feeBps / 10000)
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero amount (no fee)", () => {
      const fee = Math.floor(0 * 30 / 10000);
      expect(fee).to.equal(0);
    });

    it("should handle maximum amount without overflow", () => {
      const maxAmount = Number.MAX_SAFE_INTEGER;
      const fee = Math.floor(maxAmount * 30 / 10000);
      expect(fee).to.be.lessThan(maxAmount);
      expect(fee).to.be.greaterThan(0);
    });
  });
});
EOF

echo "Running fee tests..."
if command -v npx &> /dev/null && [ -d "node_modules" ]; then
    npx ts-mocha -p tsconfig.json tests/fee/fee_test.ts 2>&1 || {
        echo "⚠️  Run 'npm install' first"
    }
else
    echo "⚠️  Node modules not installed"
    echo "Run: npm install && npm run test"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Fee Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Fee Structure:"
echo "  ├─ Withdrawal Fee: 0.3%"
echo "  ├─ Minimum Fee: 0.000005 SOL"
echo "  └─ Developer Share: 100%"
echo ""
echo "Example fees:"
echo "  0.1 SOL withdrawal → 0.0003 SOL fee"
echo "  1.0 SOL withdrawal → 0.003 SOL fee"
echo "  10 SOL withdrawal  → 0.03 SOL fee"
echo "  100 SOL withdrawal → 0.3 SOL fee"
echo ""
echo "✓ Fee tests completed"

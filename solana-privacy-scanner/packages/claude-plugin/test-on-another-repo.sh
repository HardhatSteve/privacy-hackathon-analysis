#!/bin/bash

# Script to test the plugin on another repository
# This simulates what users will experience when installing the plugin

set -e

echo "🧪 Testing Solana Privacy Scanner Plugin on Another Repo"
echo ""

# Step 1: Create a test directory
TEST_DIR="/tmp/plugin-test-$(date +%s)"
echo "📁 Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Step 2: Pack the plugin
echo ""
echo "📦 Packing the plugin..."
PLUGIN_DIR="/Users/taylorferran/Desktop/dev/solana-privacy-scanner/packages/claude-plugin"
cd "$PLUGIN_DIR"
npm pack
TARBALL=$(ls solana-privacy-scanner-plugin-*.tgz | head -1)
mv "$TARBALL" "$TEST_DIR/"

# Step 3: Install from tarball
echo ""
echo "📥 Installing plugin from tarball..."
cd "$TEST_DIR"
npm install "$TARBALL"

# Step 4: Verify installation
echo ""
echo "✅ Verifying installation..."
node -e "const p = require('solana-privacy-scanner-plugin'); console.log('✓ Plugin loaded successfully')"

# Step 5: Check files
echo ""
echo "📂 Checking plugin files..."
if [ -f "node_modules/solana-privacy-scanner-plugin/.claude-plugin/plugin.json" ]; then
    echo "✓ plugin.json found"
    cat "node_modules/solana-privacy-scanner-plugin/.claude-plugin/plugin.json"
else
    echo "✗ plugin.json NOT found"
    exit 1
fi

echo ""
if [ -d "node_modules/solana-privacy-scanner-plugin/skills" ]; then
    echo "✓ Skills directory found"
    ls -la "node_modules/solana-privacy-scanner-plugin/skills/"
else
    echo "✗ Skills directory NOT found"
    exit 1
fi

echo ""
if [ -d "node_modules/solana-privacy-scanner-plugin/dist" ]; then
    echo "✓ Dist directory found"
    ls -la "node_modules/solana-privacy-scanner-plugin/dist/" | head -10
else
    echo "✗ Dist directory NOT found"
    exit 1
fi

# Step 6: Test with a sample repo
echo ""
echo "📝 Creating sample Solana code to test..."
mkdir -p src
cat > src/test-transaction.ts << 'EOF'
import { Connection, Keypair, Transaction, SystemProgram } from '@solana/web3.js';

// BAD: Fee payer reuse
const FEE_PAYER = Keypair.generate();

export async function sendTransaction() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const recipient = Keypair.generate();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: FEE_PAYER.publicKey,
      toPubkey: recipient.publicKey,
      lamports: 1000000,
    })
  );

  // BAD: PII in memo
  transaction.add({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from('Payment to john.doe@example.com for services'),
  });

  await connection.sendTransaction(transaction, [FEE_PAYER]);
}
EOF

echo "✓ Sample code created"

# Step 7: Instructions for manual testing
echo ""
echo "=========================================="
echo "✅ Plugin installation successful!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Navigate to test directory:"
echo "   cd $TEST_DIR"
echo ""
echo "2. Start Claude Code:"
echo "   claude code"
echo ""
echo "3. Test the plugin skills:"
echo "   /scan-code src/test-transaction.ts"
echo "   /explain-risk fee-payer-reuse"
echo "   /suggest-fix fee-payer-reuse"
echo ""
echo "Expected results:"
echo "- /scan-code should detect 2 privacy issues"
echo "- /explain-risk should show detailed explanation"
echo "- /suggest-fix should provide code examples"
echo ""
echo "Test directory: $TEST_DIR"
echo "(Will be cleaned up on next system restart)"
echo ""

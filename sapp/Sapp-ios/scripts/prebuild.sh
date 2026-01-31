#!/bin/bash
set -e

# Navigate to Sapp-ios directory
cd "$(dirname "$0")/.."

echo "========================================"
echo "[prebuild] Starting P2P bundle process"
echo "========================================"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "[prebuild] ERROR: Node.js 18+ required, found v$NODE_VERSION"
  exit 1
fi
echo "[prebuild] Node.js version: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "[prebuild] Installing npm dependencies..."
  npm install
else
  echo "[prebuild] node_modules exists, skipping install"
fi

# Create output directories
mkdir -p ./worklets
mkdir -p ./addons

# Check if worklet source exists
if [ ! -f "./worklets/hypercore.js" ]; then
  echo "[prebuild] ERROR: worklets/hypercore.js not found!"
  echo "[prebuild] Please ensure the JavaScript worklet file exists"
  exit 1
fi

# Check if bare-link and bare-pack are available
if [ ! -f "./node_modules/.bin/bare-link" ]; then
  echo "[prebuild] ERROR: bare-link not found. Run npm install first."
  exit 1
fi

if [ ! -f "./node_modules/.bin/bare-pack" ]; then
  echo "[prebuild] ERROR: bare-pack not found. Run npm install first."
  exit 1
fi

# Link native addons for iOS
echo "[prebuild] Running bare-link for iOS..."
./node_modules/.bin/bare-link --preset ios --out ./addons . || {
  echo "[prebuild] Warning: bare-link failed (may be okay if no native addons needed)"
}

# Bundle the hypercore worklet
# Note: bare-* modules are native addons provided by BareKit at runtime
echo "[prebuild] Running bare-pack..."
./node_modules/.bin/bare-pack \
  --preset ios \
  --base . \
  --builtins ./builtins.json \
  --out ./worklets/hypercore.bundle \
  ./worklets/hypercore.js

echo "========================================"
echo "[prebuild] SUCCESS!"
echo "[prebuild] Bundle: worklets/hypercore.bundle"
echo "========================================"
ls -la ./worklets/

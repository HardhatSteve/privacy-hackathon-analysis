#!/bin/bash

# ============================================================================
# DASHBOARD BUILD AND SERVE SCRIPT
# ============================================================================

set -e

echo " Building SolVoid Dashboard..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo " package.json not found. Please run from dashboard directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies..."
    npm install
fi

# Create dist directory
mkdir -p dist

# Copy static files
echo " Copying static files..."
cp -r src/* dist/
cp -r public/* dist/ 2>/dev/null || true

# Copy to root for easy access
echo " Copying to project root..."
cp -r dist/* ../dashboard/dist/ 2>/dev/null || mkdir -p ../dashboard/dist && cp -r dist/* ../dashboard/dist/

echo ""
echo " Dashboard build complete!"
echo ""
echo " To start the dashboard server:"
echo "   npm run dev"
echo ""
echo " Or serve directly:"
echo "   npx http-server dist -p 3000 -c-1 --cors"
echo ""
echo " Dashboard will be available at: http://localhost:3000"

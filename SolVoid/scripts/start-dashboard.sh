#!/bin/bash

# ============================================================================
# DASHBOARD SERVER STARTUP SCRIPT
# ============================================================================

set -e

echo " Starting SolVoid Dashboard Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo " package.json not found. Please run from project root."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies..."
    npm install
fi

# Set environment variables
export PORT=${PORT:-3001}
export NODE_ENV=${NODE_ENV:-production}

# Create logs directory
mkdir -p logs

echo ""
echo " Starting dashboard server..."
echo " Dashboard: http://localhost:$PORT"
echo " WebSocket: ws://localhost:$((PORT + 1))"
echo ""

# Start the server
node cli/utils/dashboard-server.js

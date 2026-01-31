#!/bin/bash

# Shadow Fence VPS Deployment Script
set -e

VPS_HOST="techbones@159.89.137.24"
VPS_PATH="/home/techbones/shadow-fence"
WEB_PATH="$VPS_PATH/web"

echo "🚀 Shadow Fence VPS Deployment"
echo "=============================="
echo "Target: $VPS_HOST"
echo "Path: $WEB_PATH"
echo ""

# Step 1: Build locally
echo "📦 Building web app locally..."
cd /home/techbones/shadow-fence/web
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Sync to VPS
echo "📤 Syncing files to VPS..."
rsync -avz --exclude=node_modules --exclude=.next --exclude=.git \
  /home/techbones/shadow-fence/web/ $VPS_HOST:$WEB_PATH/
echo "✅ Files synced"
echo ""

# Step 3: SSH commands to run on VPS
echo "🔧 Setting up on VPS..."
ssh $VPS_HOST << 'EOFVPS'
  set -e
  cd /home/techbones/shadow-fence/web
  
  echo "Installing production dependencies..."
  npm install --production
  
  echo "Setting up PM2..."
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi
  
  # Stop existing process if running
  pm2 stop shadow-fence 2>/dev/null || true
  pm2 delete shadow-fence 2>/dev/null || true
  
  # Start with PM2
  pm2 start npm --name "shadow-fence" -- start
  pm2 save
  
  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "PM2 Status:"
  pm2 status
  echo ""
  echo "PM2 Logs:"
  pm2 logs shadow-fence --lines 5
EOFVPS

echo ""
echo "🎉 VPS Deployment Successful!"
echo ""
echo "Access your web app:"
echo "  - Direct: http://159.89.137.24:3000"
echo "  - Domain: https://hardhattechbones.com/shadow-fence (after Nginx setup)"
echo ""
echo "Manage on VPS:"
echo "  - View logs: pm2 logs shadow-fence"
echo "  - Restart: pm2 restart shadow-fence"
echo "  - Stop: pm2 stop shadow-fence"

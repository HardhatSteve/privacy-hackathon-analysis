#!/bin/bash

# Configuration for Sapp
PROJECT_NAME="Sapp"
SCHEME_NAME="Sapp"
BUNDLE_ID="-xVampirot.Sapp"

# Device names
DEVICE1="iPhone 17"
DEVICE2="iPhone Air"
DEVICE3="iPhone Air"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting 3 simulators for Sapp...${NC}"

# Boot simulators
xcrun simctl boot "$DEVICE1" 2>/dev/null && echo "✓ Booted $DEVICE1" || echo "• $DEVICE1 already running"
xcrun simctl boot "$DEVICE2" 2>/dev/null && echo "✓ Booted $DEVICE2" || echo "• $DEVICE2 already running"
xcrun simctl boot "$DEVICE3" 2>/dev/null && echo "✓ Booted $DEVICE3" || echo "• $DEVICE3 already running"

# Open Simulator app
open -a Simulator

echo -e "\n${BLUE}🔨 Building Sapp...${NC}"

# Build the project
xcodebuild -scheme "$SCHEME_NAME" \
  -destination "platform=iOS Simulator,name=$DEVICE1" \
  -configuration Debug \
  -derivedDataPath ./build \
  build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Build successful!${NC}"

# Find the .app bundle
APP_PATH=$(find ./build/Build/Products/Debug-iphonesimulator -name "*.app" | head -n 1)

if [ -z "$APP_PATH" ]; then
    echo -e "${RED}❌ Could not find .app bundle${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Installing Sapp on simulators...${NC}"

# Install on all 3 simulators
xcrun simctl install "$DEVICE1" "$APP_PATH" && echo "✓ Installed on $DEVICE1"
xcrun simctl install "$DEVICE2" "$APP_PATH" && echo "✓ Installed on $DEVICE2"
xcrun simctl install "$DEVICE3" "$APP_PATH" && echo "✓ Installed on $DEVICE3"

echo -e "\n${BLUE}🚀 Launching Sapp...${NC}"

# Launch on all 3 simulators
xcrun simctl launch "$DEVICE1" "$BUNDLE_ID" && echo "✓ Launched on $DEVICE1"
xcrun simctl launch "$DEVICE2" "$BUNDLE_ID" && echo "✓ Launched on $DEVICE2"
xcrun simctl launch "$DEVICE3" "$BUNDLE_ID" && echo "✓ Launched on $DEVICE3"

echo -e "\n${GREEN}✅ All done! Sapp is running on 3 simulators.${NC}"
echo -e "${BLUE}💡 Perfect for testing Privy authentication with multiple users!${NC}"

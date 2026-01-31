#!/bin/bash

# quick_launch.sh - Fast relaunch on 3 simulators (after initial build)

BUNDLE_ID="-xVampirot.Sapp"

# Device names
DEVICE1="iPhone 17"
DEVICE2="iPhone Air"
DEVICE3="iPhone Air"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick launching Sapp on 3 simulators...${NC}"

# Boot and launch on each device
for device in "$DEVICE1" "$DEVICE2" "$DEVICE3"; do 
  xcrun simctl boot "$device" 2>/dev/null
  xcrun simctl launch "$device" "$BUNDLE_ID" && echo "✓ Launched on $device"
done

# Open Simulator app
open -a Simulator

echo -e "\n${GREEN}✅ Sapp launched on 3 simulators!${NC}"

#!/bin/bash

# sim_utils.sh - Utility commands for managing Sapp on simulators

BUNDLE_ID="-xVampirot.Sapp"
DEVICE1="iPhone 17"
DEVICE2="iPhone 15"
DEVICE3="iPhone 14 Plus"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_menu() {
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}   Sapp Simulator Utilities${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo "1) Terminate Sapp on all simulators"
    echo "2) Uninstall Sapp from all simulators"
    echo "3) Reset all 3 simulators (clean slate)"
    echo "4) Shutdown all simulators"
    echo "5) Boot all 3 simulators"
    echo "6) List all running simulators"
    echo "7) Open Simulator logs"
    echo "0) Exit"
    echo ""
    echo -n "Select option: "
}

terminate_app() {
    echo -e "${YELLOW}🛑 Terminating Sapp on all simulators...${NC}"
    for device in "$DEVICE1" "$DEVICE2" "$DEVICE3"; do
        xcrun simctl terminate "$device" "$BUNDLE_ID" 2>/dev/null && echo "✓ Terminated on $device" || echo "• Not running on $device"
    done
    echo -e "${GREEN}✅ Done${NC}"
}

uninstall_app() {
    echo -e "${YELLOW}🗑️  Uninstalling Sapp from all simulators...${NC}"
    for device in "$DEVICE1" "$DEVICE2" "$DEVICE3"; do
        xcrun simctl uninstall "$device" "$BUNDLE_ID" 2>/dev/null && echo "✓ Uninstalled from $device" || echo "• Not installed on $device"
    done
    echo -e "${GREEN}✅ Done${NC}"
}

reset_simulators() {
    echo -e "${RED}⚠️  This will erase ALL data from the 3 simulators!${NC}"
    echo -n "Are you sure? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🔄 Resetting simulators...${NC}"
        for device in "$DEVICE1" "$DEVICE2" "$DEVICE3"; do
            xcrun simctl shutdown "$device" 2>/dev/null
            xcrun simctl erase "$device" && echo "✓ Reset $device"
        done
        echo -e "${GREEN}✅ All simulators reset${NC}"
    else
        echo "Cancelled"
    fi
}

shutdown_all() {
    echo -e "${YELLOW}⏹️  Shutting down all simulators...${NC}"
    xcrun simctl shutdown all
    echo -e "${GREEN}✅ All simulators shut down${NC}"
}

boot_all() {
    echo -e "${BLUE}🚀 Booting all 3 simulators...${NC}"
    xcrun simctl boot "$DEVICE1" 2>/dev/null && echo "✓ Booted $DEVICE1" || echo "• $DEVICE1 already running"
    xcrun simctl boot "$DEVICE2" 2>/dev/null && echo "✓ Booted $DEVICE2" || echo "• $DEVICE2 already running"
    xcrun simctl boot "$DEVICE3" 2>/dev/null && echo "✓ Booted $DEVICE3" || echo "• $DEVICE3 already running"
    open -a Simulator
    echo -e "${GREEN}✅ Done${NC}"
}

list_running() {
    echo -e "${BLUE}📱 Running simulators:${NC}"
    xcrun simctl list devices | grep "(Booted)"
}

open_logs() {
    echo -e "${BLUE}📋 Opening simulator logs...${NC}"
    open ~/Library/Logs/CoreSimulator/
    echo -e "${GREEN}✅ Finder opened${NC}"
}

# Main loop
while true; do
    show_menu
    read -r option
    echo ""
    
    case $option in
        1) terminate_app ;;
        2) uninstall_app ;;
        3) reset_simulators ;;
        4) shutdown_all ;;
        5) boot_all ;;
        6) list_running ;;
        7) open_logs ;;
        0) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    
    echo ""
    echo -n "Press Enter to continue..."
    read -r
    clear
done

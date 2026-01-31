#!/bin/bash

# setup.sh - One-time setup to make all scripts executable

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up Sapp simulator scripts...${NC}"
echo ""

# Make scripts executable
chmod +x run_3_sims.sh
chmod +x quick_launch.sh
chmod +x sim_utils.sh

echo -e "${GREEN}✅ run_3_sims.sh is now executable${NC}"
echo -e "${GREEN}✅ quick_launch.sh is now executable${NC}"
echo -e "${GREEN}✅ sim_utils.sh is now executable${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Available commands:"
echo ""
echo -e "  ${BLUE}./run_3_sims.sh${NC}     - Build and run on 3 simulators"
echo -e "  ${BLUE}./quick_launch.sh${NC}   - Quick relaunch (if already built)"
echo -e "  ${BLUE}./sim_utils.sh${NC}      - Utilities menu"
echo ""
echo "Read SIMULATOR_SCRIPTS_README.md for full documentation."
echo ""
echo -e "${GREEN}Try it now:${NC} ./run_3_sims.sh"
echo ""

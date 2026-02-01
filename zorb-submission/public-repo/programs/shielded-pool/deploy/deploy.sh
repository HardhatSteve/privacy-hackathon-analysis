#!/bin/bash

# Deploy shielded-pool program to solana-test-validator
# Usage: ./deploy.sh [--start-validator] [--init] [--register-asset <mint>]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRATE_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$CRATE_DIR/cli"
PROGRAM_KEYPAIR="$SCRIPT_DIR/shielded-pool-keypair.json"
PROGRAM_SO="$CRATE_DIR/target/deploy/shielded_pool.so"
CLI_BIN="$CLI_DIR/target/debug/shielded-pool"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Shielded Pool Deployment Script ===${NC}"

# Parse arguments
START_VALIDATOR=false
INIT_POOL=false
REGISTER_MINT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --start-validator)
            START_VALIDATOR=true
            shift
            ;;
        --init)
            INIT_POOL=true
            shift
            ;;
        --register-asset)
            REGISTER_MINT="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Start validator if requested
if $START_VALIDATOR; then
    echo -e "${YELLOW}Starting solana-test-validator in background...${NC}"
    solana-test-validator --reset &
    VALIDATOR_PID=$!
    echo "Validator PID: $VALIDATOR_PID"

    # Wait for validator to be ready
    echo "Waiting for validator to start..."
    sleep 5

    for i in {1..30}; do
        if solana cluster-version 2>/dev/null; then
            echo -e "${GREEN}Validator is ready!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}Timeout waiting for validator${NC}"
            exit 1
        fi
        sleep 1
    done
fi

# Configure solana CLI to use localhost
echo -e "${YELLOW}Configuring Solana CLI for localhost...${NC}"
solana config set --url http://localhost:8899

## Check if validator is running
#if ! solana cluster-version 2>/dev/null; then
#    echo -e "${RED}Error: solana-test-validator is not running${NC}"
#    echo "Start it with: solana-test-validator --reset"
#    echo "Or run this script with: ./deploy.sh --start-validator"
#    exit 1
#fi

# Build the program if .so doesn't exist or source is newer
if [[ ! -f "$PROGRAM_SO" ]]; then
    echo -e "${YELLOW}Program binary not found. Building...${NC}"
    cd "$CRATE_DIR"
    cargo build-sbf --features test-mode
fi

# Check if keypair exists
if [[ ! -f "$PROGRAM_KEYPAIR" ]]; then
    echo -e "${YELLOW}Creating new program keypair...${NC}"
    solana-keygen new --no-bip39-passphrase -o "$PROGRAM_KEYPAIR"
fi

# Get program ID from keypair
PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KEYPAIR")
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"

# Airdrop SOL to deployer if needed
DEPLOYER_BALANCE=$(solana balance 2>/dev/null | grep -oE '[0-9.]+' | head -1)
if (( $(echo "$DEPLOYER_BALANCE < 10" | bc -l 2>/dev/null || echo 1) )); then
    echo -e "${YELLOW}Airdropping SOL to deployer...${NC}"
    solana airdrop 100  || true
fi

# Deploy the program
echo -e "${YELLOW}Deploying program...${NC}"
solana program deploy \
    --program-id "$PROGRAM_KEYPAIR" \
    "$PROGRAM_SO"

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "Program ID: ${GREEN}$PROGRAM_ID${NC}"

# Initialize if requested
if $INIT_POOL; then
    echo ""
    echo -e "${YELLOW}=== Initializing Shielded Pool ===${NC}"

    # Build CLI if needed
    if [[ ! -f "$CLI_BIN" ]]; then
        echo "Building CLI..."
        cd "$CLI_DIR"
        cargo build
    fi

    # Run initialize command
    "$CLI_BIN" --program-id "$PROGRAM_ID" initialize --output "$SCRIPT_DIR/accounts.json"

    echo -e "${GREEN}Accounts saved to $SCRIPT_DIR/accounts.json${NC}"
fi

# Register asset if requested
if [[ -n "$REGISTER_MINT" ]]; then
    echo ""
    echo -e "${YELLOW}=== Registering Asset ===${NC}"

    # Build CLI if needed
    if [[ ! -f "$CLI_BIN" ]]; then
        echo "Building CLI..."
        cd "$CLI_DIR"
        cargo build
    fi

    # Check if accounts.json exists
    if [[ ! -f "$SCRIPT_DIR/accounts.json" ]]; then
        echo -e "${RED}Error: accounts.json not found. Run with --init first.${NC}"
        exit 1
    fi

    # Get global config from accounts.json
    GLOBAL_CONFIG=$(cat "$SCRIPT_DIR/accounts.json" | grep -o '"global_config": "[^"]*"' | cut -d'"' -f4)

    "$CLI_BIN" --program-id "$PROGRAM_ID" register-asset \
        --mint "$REGISTER_MINT" \
        --global-config "$GLOBAL_CONFIG"
fi

echo ""
echo "To verify deployment:"
echo "  solana program show $PROGRAM_ID"
echo ""
echo "To initialize (if not done):"
echo "  cd $CLI_DIR && cargo build"
echo "  ./target/debug/shielded-pool --program-id $PROGRAM_ID initialize"
echo ""
echo "To register an asset:"
echo "  ./target/debug/shielded-pool --program-id $PROGRAM_ID register-asset --mint <MINT_ADDRESS> --global-config <CONFIG_ADDRESS>"

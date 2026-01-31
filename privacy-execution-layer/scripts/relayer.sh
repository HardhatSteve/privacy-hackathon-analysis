#!/bin/bash
# ==============================================================================
# RELAYER RUNNER SCRIPT
# Запуск и управление релейером
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RELAYER_DIR="$PROJECT_DIR/relayer"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Config
KEYPAIR="${RELAYER_KEYPAIR:-~/.config/solana/relayer.json}"
RPC_URL="${RPC_URL:-https://api.devnet.solana.com}"
PORT="${RELAYER_PORT:-8080}"
FEE_BPS="${RELAYER_FEE:-50}"

show_help() {
    cat << EOF
Privacy Execution Layer - Relayer Management

USAGE:
    $0 <command> [options]

COMMANDS:
    register    Register as a new relayer
    start       Start relayer server
    status      Check relayer status
    update      Update relayer config
    unstake     Request to unstake (7 day cooldown)
    withdraw    Withdraw stake after cooldown

OPTIONS:
    --keypair   Path to relayer keypair
    --rpc       Solana RPC URL
    --port      Server port (default: 8080)
    --fee       Fee in basis points (default: 50)

EXAMPLES:
    $0 register --fee 50
    $0 start --port 8080
    $0 status

EOF
}

generate_encryption_key() {
    echo -e "${YELLOW}Generating ECIES encryption keypair...${NC}"
    
    # Generate random 32 bytes
    openssl rand -hex 32 > "$PROJECT_DIR/deployments/relayer_encryption.key"
    
    echo -e "${GREEN}✓ Encryption key saved to deployments/relayer_encryption.key${NC}"
}

register_relayer() {
    echo -e "${YELLOW}Registering as relayer...${NC}"
    
    # Check keypair
    if [ ! -f "$KEYPAIR" ]; then
        echo -e "${RED}Keypair not found: $KEYPAIR${NC}"
        echo "Generate with: solana-keygen new -o $KEYPAIR"
        exit 1
    fi
    
    # Check balance (need 1+ SOL for stake)
    BALANCE=$(solana balance "$KEYPAIR" --url "$RPC_URL" 2>/dev/null | awk '{print $1}' || echo "0")
    
    if (( $(echo "$BALANCE < 1" | bc -l) )); then
        echo -e "${RED}Insufficient balance: $BALANCE SOL${NC}"
        echo "Need at least 1 SOL for stake"
        echo "Get devnet SOL: solana airdrop 2 --url devnet"
        exit 1
    fi
    
    # Generate encryption key
    generate_encryption_key
    
    echo ""
    echo -e "${GREEN}Relayer registration ready:${NC}"
    echo "  Keypair: $KEYPAIR"
    echo "  Fee: $FEE_BPS bps ($(echo "scale=2; $FEE_BPS / 100" | bc)%)"
    echo "  Stake: 1 SOL"
    echo ""
    echo -e "${YELLOW}To complete registration, run on-chain transaction:${NC}"
    echo "  anchor run register-relayer -- --fee $FEE_BPS"
}

start_server() {
    echo -e "${YELLOW}Starting relayer server...${NC}"
    
    # Check if already running
    if pgrep -f "relayer-server" > /dev/null; then
        echo -e "${RED}Relayer already running${NC}"
        exit 1
    fi
    
    echo ""
    echo "Configuration:"
    echo "  RPC: $RPC_URL"
    echo "  Port: $PORT"
    echo "  Fee: $FEE_BPS bps"
    echo ""
    
    # Create simple HTTP server (demo)
    cat > /tmp/relayer_server.py << 'PYEOF'
#!/usr/bin/env python3
import http.server
import json
import socketserver
import os

PORT = int(os.environ.get('RELAYER_PORT', 8080))
FEE = int(os.environ.get('RELAYER_FEE', 50))

class RelayerHandler(http.server.BaseHTTPRequestHandler):
    processed = 0
    
    def do_GET(self):
        if self.path == '/health':
            self.send_json({'status': 'ok'})
        elif self.path == '/info':
            self.send_json({
                'fee_bps': FEE,
                'processed': RelayerHandler.processed,
                'version': '0.1.0'
            })
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/relay':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            
            try:
                request = json.loads(body)
                # Process relay request
                RelayerHandler.processed += 1
                
                self.send_json({
                    'tx_signature': f'MockSig{RelayerHandler.processed}',
                    'status': 'submitted'
                })
            except Exception as e:
                self.send_json({
                    'status': 'error',
                    'error': str(e)
                }, status=400)
        else:
            self.send_error(404)
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        print(f"[Relayer] {args[0]}")

print(f"Relayer server starting on port {PORT}...")
with socketserver.TCPServer(("", PORT), RelayerHandler) as httpd:
    print(f"Listening on http://0.0.0.0:{PORT}")
    print("Endpoints: /health, /info, POST /relay")
    httpd.serve_forever()
PYEOF

    RELAYER_PORT=$PORT RELAYER_FEE=$FEE_BPS python3 /tmp/relayer_server.py
}

check_status() {
    echo -e "${YELLOW}Checking relayer status...${NC}"
    
    # Check local server
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        INFO=$(curl -s "http://localhost:$PORT/info")
        echo -e "${GREEN}✓ Local server running on port $PORT${NC}"
        echo "  $INFO"
    else
        echo -e "${RED}✗ Local server not running${NC}"
    fi
    
    # Check on-chain registration
    echo ""
    echo "On-chain status: (run 'anchor run check-relayer')"
}

case "${1:-help}" in
    register)
        register_relayer
        ;;
    start)
        start_server
        ;;
    status)
        check_status
        ;;
    update)
        echo "Update via: anchor run update-relayer"
        ;;
    unstake)
        echo "Unstake via: anchor run request-unstake"
        ;;
    withdraw)
        echo "Withdraw via: anchor run withdraw-stake"
        ;;
    *)
        show_help
        ;;
esac

#!/bin/bash
# ==============================================================================
# PRE-DEPLOYMENT VERIFICATION
# Полная проверка перед деплоем
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          PRE-DEPLOYMENT VERIFICATION CHECKLIST                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

PASSED=0
FAILED=0
WARNINGS=0

check() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        ((FAILED++))
        return 1
    fi
}

warn() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $name (warning)"
        ((WARNINGS++))
    fi
}

echo -e "\n${YELLOW}[1/6] Build Verification${NC}"
echo "─────────────────────────"

check "Cargo.toml exists" "[ -f Cargo.toml ]"
check "Anchor.toml exists" "[ -f Anchor.toml ]"
check "Program source exists" "[ -f programs/private-pool/src/lib.rs ]"
warn "Anchor build succeeds" "anchor build 2>&1"
warn "Program .so exists" "[ -f target/deploy/private_pool.so ]"

echo -e "\n${YELLOW}[2/6] Tests${NC}"
echo "─────────────────────────"

warn "Cargo test passes" "cargo test 2>&1"
warn "Clippy clean" "cargo clippy -- -D warnings 2>&1"
check "Cargo fmt check" "cargo fmt --check 2>&1"

echo -e "\n${YELLOW}[3/6] Security Checks${NC}"
echo "─────────────────────────"

check "No hardcoded secrets" "! grep -rE '(private_key|secret_key).*=' --include='*.rs' programs/"
check "No unsafe in main program" "! grep -n 'unsafe' programs/private-pool/src/lib.rs"
warn "Cargo audit" "cargo audit 2>&1"
check "SECURITY.md exists" "[ -f SECURITY.md ]"

echo -e "\n${YELLOW}[4/6] Documentation${NC}"
echo "─────────────────────────"

check "README.md exists" "[ -f README.md ]"
check "PROTOCOL_DOCTRINE exists" "[ -f docs/PROTOCOL_DOCTRINE.md ]"
check "API_REFERENCE exists" "[ -f docs/API_REFERENCE.md ]"
check "DEVELOPER_GUIDE exists" "[ -f docs/DEVELOPER_GUIDE.md ]"
check "CHANGELOG exists" "[ -f CHANGELOG.md ]"

echo -e "\n${YELLOW}[5/6] Circuit Files${NC}"
echo "─────────────────────────"

check "withdraw.circom exists" "[ -f circuits/withdraw.circom ]"
check "poseidon.circom exists" "[ -f circuits/poseidon.circom ]"
warn "Circuit compiles" "[ -f circuits/withdraw.r1cs ] || circom circuits/withdraw.circom --r1cs -o /tmp 2>&1"

echo -e "\n${YELLOW}[6/6] Deployment Files${NC}"
echo "─────────────────────────"

check "deploy_devnet.sh exists" "[ -x scripts/deploy_devnet.sh ]"
check "github_init.sh exists" "[ -x scripts/github_init.sh ]"
check ".github/workflows exists" "[ -d .github/workflows ]"
warn "Solana CLI available" "command -v solana"
warn "Anchor CLI available" "command -v anchor"

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "                          SUMMARY"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Passed with warnings. Review before deployment.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ $FAILED checks failed. Fix issues before deployment.${NC}"
    exit 1
fi

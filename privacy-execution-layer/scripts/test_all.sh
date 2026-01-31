#!/bin/bash

#######################################################################
# PRIVACY EXECUTION LAYER v3.0 - Test Runner
# 
# Master script that runs all tests in sequence:
# 1. Unit tests (Rust)
# 2. Integration tests (Anchor/TypeScript)
# 3. Circuit tests (Circom)
# 4. Fuzzing tests
# 5. Security checks
# 6. Gas/CU profiling
#######################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Privacy Execution Layer v3.0 - Test Suite           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track results
PASSED=0
FAILED=0
SKIPPED=0

run_test() {
    local name="$1"
    local script="$2"
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$script" ]; then
        if bash "$script"; then
            echo -e "${GREEN}✓ $name PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ $name FAILED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⊘ $name SKIPPED (script not found)${NC}"
        ((SKIPPED++))
    fi
    echo ""
}

# ===== RUN ALL TESTS =====
START_TIME=$(date +%s)

run_test "Unit Tests (Rust)" "$SCRIPT_DIR/test_unit.sh"
run_test "Integration Tests (Anchor)" "$SCRIPT_DIR/test_integration.sh"
run_test "Circuit Tests (Circom)" "$SCRIPT_DIR/test_circuits.sh"
run_test "Fuzzing Tests" "$SCRIPT_DIR/test_fuzz.sh"
run_test "Security Audit" "$SCRIPT_DIR/test_security.sh"
run_test "Gas/CU Profiling" "$SCRIPT_DIR/test_gas.sh"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# ===== SUMMARY =====
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo -e "  Duration: ${DURATION}s"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed. Please fix before proceeding.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi

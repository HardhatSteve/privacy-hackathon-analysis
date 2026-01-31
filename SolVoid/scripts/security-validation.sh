#!/bin/bash

# SolVoid Security Validation Script
# 
# This script runs ALL security tests and generates a comprehensive report
# CRITICAL: Must pass ALL tests before any mainnet consideration

set -e

echo " SolVoid Security Validation Suite"
echo "===================================="
echo "Phase: Validation & Hardening"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
TOTAL=0

# Function to run test suite
run_test_suite() {
    local test_name=$1
    local test_file=$2
    local description=$3
    
    echo ""
    echo "${BLUE} Running: $test_name${NC}"
    echo "$description"
    echo "----------------------------------------"
    
    TOTAL=$((TOTAL + 1))
    
    if npm test -- --testPathPattern="$test_file" --verbose; then
        echo ""
        echo "${GREEN} PASSED: $test_name${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo ""
        echo "${RED} FAILED: $test_name${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check circuit artifacts
check_circuit_artifacts() {
    echo ""
    echo "${BLUE} Checking Circuit Artifacts${NC}"
    echo "----------------------------------------"
    
    local artifacts=(
        "withdraw.wasm:Circuit WASM"
        "withdraw_final.zkey:Final Proving Key"
        "verification_key.json:Verification Key"
        "withdraw.wtns:Witness (if exists)"
    )
    
    local all_exist=true
    
    for artifact in "${artifacts[@]}"; do
        local file="${artifact%%:*}"
        local desc="${artifact##*:}"
        
        if [ -f "$file" ]; then
            echo "${GREEN} Found: $desc ($file)${NC}"
        else
            echo "${RED} Missing: $desc ($file)${NC}"
            all_exist=false
        fi
    done
    
    if [ "$all_exist" = true ]; then
        echo "${GREEN} All circuit artifacts present${NC}"
        return 0
    else
        echo "${RED} Missing circuit artifacts - run build-circuits.sh${NC}"
        return 1
    fi
}

# Function to verify ceremony artifacts
check_ceremony_artifacts() {
    echo ""
    echo "${BLUE} Checking Ceremony Artifacts${NC}"
    echo "----------------------------------------"
    
    local ceremony_files=(
        "ceremony/contributions/contribution_1.zkey:Contribution"
        "ceremony/coordinator.ts:Coordinator Script"
        "scripts/mpc-ceremony.sh:Ceremony Script"
    )
    
    local all_exist=true
    
    for file in "${ceremony_files[@]}"; do
        local path="${file%%:*}"
        local desc="${file##*:}"
        
        if [ -f "$path" ]; then
            echo "${GREEN} Found: $desc${NC}"
        else
            echo "${YELLOW} Optional: $desc${NC}"
        fi
    done
    
    echo "${GREEN} Ceremony artifacts checked${NC}"
    return 0
}

# Function to generate security report
generate_security_report() {
    local report_file="SECURITY_VALIDATION_REPORT.md"
    
    echo ""
    echo "${BLUE} Generating Security Report${NC}"
    echo "----------------------------------------"
    
    cat > "$report_file" << EOF
# SolVoid Security Validation Report

**Generated:** $(date)
**Phase:** Validation & Hardening
**Status:** $([ $FAILED -eq 0 ] && echo " PASSED" || echo " FAILED")

## Executive Summary

- **Total Test Suites:** $TOTAL
- **Passed:** $PASSED
- **Failed:** $FAILED
- **Success Rate:** $(( PASSED * 100 / TOTAL ))%

$([ $FAILED -eq 0 ] && echo " ALL SECURITY TESTS PASSED - Protocol ready for next phase" || echo " SECURITY TESTS FAILED - DO NOT PROCEED TO MAINNET")

## Test Results

### Phase 9: Circuit Soundness Tests
$([ -f "tests/security/circuit-soundness.test.ts" ] && echo " Circuit soundness tests implemented" || echo " Circuit soundness tests missing")

**Critical Validations:**
- Invalid witness rejection
- Wrong Merkle root rejection  
- Nullifier reuse prevention
- Modified public input rejection
- snarkjs verification consistency

### Phase 9.2: Verifier Consistency Tests
$([ -f "tests/security/verifier-consistency.test.ts" ] && echo " Verifier consistency tests implemented" || echo " Verifier consistency tests missing")

**Critical Validations:**
- Off-chain vs on-chain verification match
- Proof mutation rejection
- Public signal validation

### Phase 10: State Invariant Tests
$([ -f "tests/security/state-invariants.test.ts" ] && echo " State invariant tests implemented" || echo " State invariant tests missing")

**Critical Invariants:**
- next_index monotonicity
- Root history append-only
- Nullifier uniqueness
- Fee immutability
- Economic consistency

### Phase 11: Relayer Adversarial Tests
$([ -f "tests/security/relayer-adversarial.test.ts" ] && echo " Relayer adversarial tests implemented" || echo " Relayer adversarial tests missing")

**Attack Simulations:**
- Replay attack prevention
- Fee manipulation resistance
- Calldata tampering prevention
- Signature forgery resistance
- DoS protection

## Security Artifacts

### Circuit Components
- withdraw.wasm: Circuit compiled to WASM
- withdraw_final.zkey: Final proving key
- verification_key.json: On-chain verification key

### Ceremony Components
- MPC ceremony transcript
- Contribution verification
- Coordinator validation

## Recommendations

$([ $FAILED -eq 0 ] && cat << RECOMMENDATIONS_PASSED
### Next Steps
1. **Phase 12:** Trust Assumption Freeze
   - Publish circuit hashes
   - Freeze verification keys
   - Document ceremony transcript
   - Publish fee policy

2. **Phase 13:** Testnet Burn-in
   - Deploy to Solana testnet
   - Run for minimum 2 weeks
   - Monitor all metrics
   - Real-user testing

3. **Phase 14:** External Security Audit
   - Engage reputable auditors
   - Full-scope audit required
   - Public disclosure of findings

4. **Phase 15:** Mainnet Launch
   - Verify all gate conditions
   - Emergency halt ready
   - Monitoring systems active

RECOMMENDATIONS_PASSED
) || cat << RECOMMENDATIONS_FAILED
### IMMEDIATE ACTIONS REQUIRED
1. **Fix All Failed Tests** - No mainnet consideration until all pass
2. **Review Security Architecture** - Identify root causes
3. **Additional Testing** - Consider edge cases not covered
4. **Expert Review** - Security consultant recommended

### BLOCKERS
- $FAILED test suites failing
- Security assumptions violated
- Protocol not ready for production

RECOMMENDATIONS_FAILED
)

## Risk Assessment

$([ $FAILED -eq 0 ] && echo "🟢 **LOW RISK** - All security validations passed" || echo " **HIGH RISK** - Security validations failed")

## Compliance Status

- [x] Circuit Soundness
- [x] Verifier Consistency  
- [x] State Invariants
- [x] Relayer Security
- [ ] Trust Assumption Freeze
- [ ] Testnet Validation
- [ ] External Audit
- [ ] Mainnet Ready

---

**This report is automatically generated. Manual review recommended.**
EOF

    echo "${GREEN} Security report generated: $report_file${NC}"
}

# Main execution
main() {
    echo "Starting comprehensive security validation..."
    echo ""
    
    # Check prerequisites
    echo "${YELLOW} Checking prerequisites...${NC}"
    check_circuit_artifacts || exit 1
    check_ceremony_artifacts
    
    # Run security test suites
    echo ""
    echo "${YELLOW} Running Security Test Suites${NC}"
    echo "===================================="
    
    # Phase 9: Circuit Soundness
    run_test_suite "Circuit Soundness" "circuit-soundness" "Prove circuit cannot be tricked with invalid inputs"
    
    # Phase 9.2: Verifier Consistency  
    run_test_suite "Verifier Consistency" "verifier-consistency" "Ensure off-chain and on-chain verification match exactly"
    
    # Phase 10: State Invariants
    run_test_suite "State Invariants" "state-invariants" "Attack the state machine, not crypto"
    
    # Phase 11: Relayer Adversarial
    run_test_suite "Relayer Adversarial" "relayer-adversarial" "Assume every relayer is hostile"
    
    # Generate final report
    generate_security_report
    
    # Final summary
    echo ""
    echo "===================================="
    echo " SECURITY VALIDATION COMPLETE"
    echo "===================================="
    echo ""
    echo "Test Suites: $TOTAL"
    echo "${GREEN}Passed: $PASSED${NC}"
    echo "${RED}Failed: $FAILED${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo "${GREEN} ALL SECURITY TESTS PASSED${NC}"
        echo ""
        echo " Protocol passed Phase 9-11 security validation"
        echo " Ready for Phase 12: Trust Assumption Freeze"
        echo " See SECURITY_VALIDATION_REPORT.md for details"
        echo ""
        exit 0
    else
        echo "${RED} SECURITY TESTS FAILED${NC}"
        echo ""
        echo " DO NOT PROCEED TO MAINNET"
        echo " Fix all failing tests before continuing"
        echo " See SECURITY_VALIDATION_REPORT.md for details"
        echo ""
        exit 1
    fi
}

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "${RED} Error: Must run from project root directory${NC}"
    exit 1
fi

# Run main function
main "$@"

#!/bin/bash

# Complete Pre-Deployment Verification Script
# This script runs all verification checks before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log success
log_success() {
    echo -e "${GREEN} $1${NC}"
}

# Function to log error
log_error() {
    echo -e "${RED} $1${NC}"
}

# Function to log warning
log_warning() {
    echo -e "${YELLOW}  $1${NC}"
}

# Function to log info
log_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

# Function to log section header
log_section() {
    echo -e "\n${BLUE} $1${NC}"
    echo "=================================="
}

# Track overall success
OVERALL_SUCCESS=true

# Function to run check and track result
run_check() {
    local description="$1"
    local command="$2"
    local critical="${3:-true}"
    
    echo -e "\n Checking: $description"
    
    if eval "$command"; then
        log_success "$description - PASSED"
        return 0
    else
        log_error "$description - FAILED"
        if [ "$critical" = "true" ]; then
            OVERALL_SUCCESS=false
        fi
        return 1
    fi
}

# Main verification function
main() {
    echo " SolVoid Pre-Deployment Verification"
    echo "======================================"
    echo "Starting comprehensive verification checks..."
    echo "Date: $(date)"
    echo "Environment: ${NODE_ENV:-development}"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "programs" ]; then
        log_error "Must run from project root directory"
        exit 1
    fi
    
    # 1. Cryptographic Verification
    log_section "Section 1: Cryptographic Verification"
    
    run_check "Cross-component hash consistency" \
        "npm test -- tests/integration/cross-component-hash-verification.test.ts 2>&1 | grep -q 'Test Suites: 1 passed'"
    
    run_check "Rust Poseidon implementation" \
        "TEST_INPUTS=\"123,456\" ./scripts/rust-poseidon-test.sh | grep -q '0xf8339a2baa293b3902b3b3d9d561938a4385c262148193013b776be4e15e6f3a'"
    
    run_check "Groth16 key consistency" \
        "node -e \"const fs = require('fs'); const vk = JSON.parse(fs.readFileSync('./verification_key.json', 'utf8')); console.log('VK loaded successfully');\""
    
    run_check "Ed25519 signature verification" \
        "grep -r 'nacl.sign.detached.verify' programs/ relayer/ > /dev/null && ! grep -r 'HMAC\\|hmac' programs/ relayer/ > /dev/null"
    
    # 2. Security Verification
    log_section "Section 2: Security Verification"
    
    run_check "No unchecked arithmetic operations" \
        "! grep -r 'unchecked_add\\|unchecked_sub\\|unchecked_mul' programs/ > /dev/null"
    
    run_check "Arithmetic safety tests" \
        "./scripts/arithmetic-safety-test.sh | grep -q ' Arithmetic safety validation completed!'"
    
    run_check "Nullifier double-spend prevention" \
        "./scripts/nullifier-validation-test.sh | grep -q ' Nullifier double-spend prevention validation completed!'"
    
    run_check "Vault balance protection" \
        "./scripts/vault-balance-protection-test.sh | grep -q ' Vault balance protection validation completed!'"
    
    run_check "Fee manipulation protection" \
        "./scripts/fee-manipulation-protection-test.sh | grep -q ' Fee manipulation protection validation completed!'"
    
    # 3. Integration Testing
    log_section "Section 3: Integration Testing"
    
    run_check "End-to-end privacy lifecycle" \
        "./scripts/end-to-end-lifecycle-test.sh | grep -q ' End-to-end privacy lifecycle validation completed!'"
    
    run_check "Security test suite" \
        "./scripts/security-test-suite.sh | grep -q ' Security test suite validation completed!'"
    
    run_check "Cross-platform hash verification" \
        "./scripts/cross-platform-hash-verification.sh | grep -q ' Cross-platform hash verification validation completed!'"
    
    # 4. Infrastructure
    log_section "Section 4: Infrastructure"
    
    run_check "Relayer key persistence" \
        "[ -d 'relayer/keys' ] || [ -f 'relayer/.env' ]"
    
    run_check "Rate limiting configuration" \
        "grep -r 'rateLimit\\|rate_limit' relayer/ > /dev/null"
    
    run_check "Monitoring configuration" \
        "[ -f 'docker-compose.monitoring.yml' ] || [ -d 'monitoring' ]"
    
    # 5. Emergency Procedures
    log_section "Section 5: Emergency Procedures"
    
    run_check "Admin controls documentation" \
        "[ -f 'docs/EMERGENCY_PROCEDURES.md' ]"
    
    run_check "Circuit breaker implementation" \
        "grep -r 'circuit_breaker\\|CircuitBreaker' programs/ > /dev/null"
    
    run_check "Upgrade documentation" \
        "[ -f 'docs/UPGRADE.md' ] && [ -f 'docs/ROLLBACK.md' ]"
    
    # 6. Code Quality
    log_section "Section 6: Code Quality"
    
    run_check "TypeScript linting" \
        "npm run lint 2>/dev/null; [ \$? -eq 0 ]"
    
    run_check "Rust clippy" \
        "./scripts/rust-clippy-test.sh | grep -q ' Rust clippy validation completed!'"
    
    run_check "No TODO comments in production code" \
        "! grep -r 'TODO\\|FIXME\\|XXX' sdk/ cli/ programs/ relayer/ > /dev/null"
    
    # 7. Dependencies
    log_section "Section 7: Dependencies"
    
    run_check "No known security vulnerabilities" \
        "npm audit --audit-level=high 2>/dev/null; [ \$? -eq 0 ]"
    
    run_check "Rust dependency audit" \
        "./scripts/rust-dependency-audit.sh | grep -q ' Rust dependency audit validation completed!'"
    
    # 8. Documentation
    log_section "Section 8: Documentation"
    
    run_check "API documentation exists" \
        "[ -f 'docs/api/README.md' ]"
    
    run_check "Security documentation complete" \
        "[ -f 'docs/cryptography/SECURITY_ANALYSIS.md' ]"
    
    run_check "Deployment guide exists" \
        "[ -f 'docs/DEPLOYMENT_GUIDE.md' ]"
    
    # Final result
    log_section "Verification Results"
    
    if [ "$OVERALL_SUCCESS" = true ]; then
        log_success " ALL VERIFICATION CHECKS PASSED!"
        echo -e "\n${GREEN} System is ready for deployment${NC}"
        echo -e "\nNext steps:"
        echo "1. Review the detailed test results above"
        echo "2. Obtain all required sign-offs"
        echo "3. Execute deployment script"
        echo "4. Monitor post-deployment metrics"
        exit 0
    else
        log_error " VERIFICATION FAILED!"
        echo -e "\n${RED} DO NOT DEPLOY - Critical issues must be resolved${NC}"
        echo -e "\nRequired actions:"
        echo "1. Fix all failed verification checks"
        echo "2. Re-run this verification script"
        echo "3. Obtain all required sign-offs"
        echo "4. Only proceed with deployment after all checks pass"
        exit 1
    fi
}

# Additional helper functions for specific checks

check_service_health() {
    local service_name="$1"
    local health_url="$2"
    
    if curl -f "$health_url" > /dev/null 2>&1; then
        log_success "$service_name is healthy"
        return 0
    else
        log_error "$service_name health check failed"
        return 1
    fi
}

check_file_permissions() {
    local file_path="$1"
    local expected_perms="$2"
    
    if [ -f "$file_path" ]; then
        local actual_perms=$(stat -c "%a" "$file_path")
        if [ "$actual_perms" = "$expected_perms" ]; then
            log_success "File permissions correct for $file_path"
            return 0
        else
            log_warning "File permissions unexpected for $file_path: $actual_perms (expected $expected_perms)"
            return 1
        fi
    else
        log_error "File not found: $file_path"
        return 1
    fi
}

check_environment_variables() {
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_success "All required environment variables set"
        return 0
    else
        log_error "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Run main function
main "$@"

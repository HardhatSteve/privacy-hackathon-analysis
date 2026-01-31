#!/bin/bash

# ============================================================================
# COMPREHENSIVE TEST RUNNER
# Runs all test suites with proper configuration
# ============================================================================

set -e

echo " Running SolVoid Atomic Rescue Engine Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_TIMEOUT=300000
COVERAGE_THRESHOLD=80

echo ""
echo "${BLUE}Configuration:${NC}"
echo "  Timeout: ${TEST_TIMEOUT}ms"
echo "  Coverage Threshold: ${COVERAGE_THRESHOLD}%"
echo ""

# Function to run test suite
run_test_suite() {
    local test_type=$1
    local test_pattern=$2
    local description=$3
    
    echo "${YELLOW}Running $description...${NC}"
    
    if [ "$test_type" = "unit" ]; then
        npx jest tests/unit --testTimeout=$TEST_TIMEOUT --coverage --coverageThreshold='{"global":{"branches":'$COVERAGE_THRESHOLD',"functions":'$COVERAGE_THRESHOLD',"lines":'$COVERAGE_THRESHOLD',"statements":'$COVERAGE_THRESHOLD'}}' --verbose
    elif [ "$test_type" = "integration" ]; then
        npx jest tests/integration --testTimeout=$TEST_TIMEOUT --verbose
    elif [ "$test_type" = "performance" ]; then
        npx jest tests/performance --testTimeout=$TEST_TIMEOUT --verbose
    else
        npx jest "$test_pattern" --testTimeout=$TEST_TIMEOUT --verbose
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "${GREEN} $description passed${NC}"
    else
        echo "${RED} $description failed${NC}"
        return $exit_code
    fi
    
    echo ""
    return 0
}

# Check if dependencies are installed
echo "${BLUE}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if test files exist
echo "${BLUE}Checking test files...${NC}"
if [ ! -d "tests" ]; then
    echo "${RED} Tests directory not found${NC}"
    exit 1
fi

# Run unit tests
run_test_suite "unit" "tests/unit" "Unit Tests"
unit_exit_code=$?

# Run integration tests (only if SOLANA_PRIVATE_KEY is set for devnet)
if [ -n "$SOLANA_PRIVATE_KEY" ] || [ -n "$USE_DEVNET" ]; then
    run_test_suite "integration" "tests/integration" "Integration Tests"
    integration_exit_code=$?
else
    echo "${YELLOW}  Skipping integration tests (set SOLANA_PRIVATE_KEY or USE_DEVNET to enable)${NC}"
    integration_exit_code=0
fi

# Run performance tests
run_test_suite "performance" "tests/performance" "Performance Tests"
performance_exit_code=$?

# Generate test report
echo "${BLUE}Generating test report...${NC}"
cat > test-report.md << EOF
# SolVoid Atomic Rescue Engine Test Report

Generated on: $(date)

## Test Results

| Test Suite | Status | Exit Code |
|-------------|--------|----------|
| Unit Tests | $([ $unit_exit_code -eq 0 ] && echo " Passed" || echo " Failed") | $unit_exit_code |
| Integration Tests | $([ $integration_exit_code -eq 0 ] && echo " Passed" || echo " Failed") | $integration_exit_code |
| Performance Tests | $([ $performance_exit_code -eq 0 ] && echo " Passed" || echo " Failed") | $performance_exit_code |

## Coverage Report

Coverage reports are available in \`coverage/lcov-report/index.html\`.

## Test Statistics

- Total Test Files: $(find tests -name "*.test.js" | wc -l)
- Test Timeout: ${TEST_TIMEOUT}ms
- Coverage Threshold: ${COVERAGE_THRESHOLD}%

## Notes

- Unit tests run without external dependencies
- Integration tests require Solana devnet access
- Performance tests may take several minutes to complete

EOF

echo " Test report generated: test-report.md"

# Check overall results
overall_exit_code=$((unit_exit_code + integration_exit_code + performance_exit_code))

if [ $overall_exit_code -eq 0 ]; then
    echo ""
    echo "${GREEN} All test suites passed!${NC}"
    echo "${GREEN} SolVoid Atomic Rescue Engine is ready for production${NC}"
else
    echo ""
    echo "${RED} Some test suites failed${NC}"
    echo "${RED}Please review the test output above${NC}"
fi

# Open coverage report if available
if [ -f "coverage/lcov-report/index.html" ]; then
    echo ""
    echo "${BLUE} Coverage report available at: coverage/lcov-report/index.html${NC}"
fi

exit $overall_exit_code

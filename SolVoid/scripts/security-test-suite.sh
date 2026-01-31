#!/bin/bash

# Security test suite script
# This script validates security test components

echo " Testing security test suite..."

# Test 1: Check for security test files
echo "Test 1: Checking for security test files"
if [ -f "tests/security/security-test-suite.test.ts" ] && [ -d "tests/security/" ]; then
    echo " Found security test files"
else
    echo " No security test files found"
    exit 1
fi

# Test 2: Check for basic security test files
echo "Test 2: Checking for basic security tests"
if [ -f "tests/security/basic-security.test.ts" ] || [ -f "tests/security/circuit-soundness.test.ts" ]; then
    echo " Found basic security tests"
else
    echo " No basic security tests found"
    exit 1
fi

# Test 3: Check for circuit soundness tests
echo "Test 3: Checking for circuit soundness tests"
if find tests/ -name "*circuit*" -o -name "*soundness*" 2>/dev/null | grep -q .; then
    echo " Found circuit soundness tests"
else
    echo " No circuit soundness tests found"
    exit 1
fi

# Test 4: Check for attack simulation tests
echo "Test 4: Checking for attack simulation tests"
if grep -r "attack\|malicious\|adversarial" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found attack simulation tests"
else
    echo "  No explicit attack simulation tests found"
fi

# Test 5: Check for boundary condition tests
echo "Test 5: Checking for boundary condition tests"
if grep -r "boundary\|edge.*case\|limit" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found boundary condition tests"
else
    echo "  No explicit boundary condition tests found"
fi

# Test 6: Check for input validation tests
echo "Test 6: Checking for input validation tests"
if grep -r "input.*validation\|validate.*input" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found input validation tests"
else
    echo "  No explicit input validation tests found"
fi

# Test 7: Check for cryptographic tests
echo "Test 7: Checking for cryptographic tests"
if grep -r "poseidon\|groth16\|zk-snark\|nullifier" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found cryptographic tests"
else
    echo " No cryptographic tests found"
    exit 1
fi

# Test 8: Check for replay protection tests
echo "Test 8: Checking for replay protection tests"
if grep -r "replay\|double.*spend\|nullifier.*duplicate" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found replay protection tests"
else
    echo "  No explicit replay protection tests found"
fi

# Test 9: Check for privacy preservation tests
echo "Test 9: Checking for privacy preservation tests"
if grep -r "privacy\|anonymity\|confidential" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found privacy preservation tests"
else
    echo "  No explicit privacy preservation tests found"
fi

# Test 10: Check for security assertions
echo "Test 10: Checking for security assertions"
if grep -r "expect.*fail\|should.*reject\|security.*assert" tests/security/ 2>/dev/null | grep -q .; then
    echo " Found security assertions"
else
    echo "  No explicit security assertions found"
fi

# Test 11: Validate test file structure
echo "Test 11: Validating test file structure"
if [ -s "tests/security/security-test-suite.test.ts" ] && [ -s "tests/security/basic-security.test.ts" ]; then
    echo " Security test files have content"
else
    echo " Security test files are empty"
    exit 1
fi

# Test 12: Check for comprehensive security coverage
echo "Test 12: Checking for comprehensive security coverage"
security_files=$(find tests/security/ -name "*.test.ts" | wc -l)
if [ "$security_files" -ge 2 ]; then
    echo " Found multiple security test files ($security_files files)"
else
    echo "  Limited security test coverage ($security_files files)"
fi

echo " Security test suite validation completed!"
exit 0

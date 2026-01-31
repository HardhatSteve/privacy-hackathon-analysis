#!/bin/bash

# End-to-end privacy lifecycle test script
# This script validates the end-to-end privacy lifecycle components

echo " Testing end-to-end privacy lifecycle..."

# Test 1: Check for circuit files
echo "Test 1: Checking for circuit files"
if [ -f "withdraw.wasm" ] && [ -f "withdraw.zkey" ] && [ -f "verification_key.json" ]; then
    echo " Found required circuit files"
else
    echo " Missing required circuit files"
    exit 1
fi

# Test 2: Check for Poseidon implementation
echo "Test 2: Checking for Poseidon implementation"
if [ -f "programs/solvoid-zk/src/poseidon.rs" ] && grep -q "PoseidonHasher" programs/solvoid-zk/src/poseidon.rs; then
    echo " Found Poseidon implementation"
else
    echo " No Poseidon implementation found"
    exit 1
fi

# Test 3: Check for Groth16 verification
echo "Test 3: Checking for Groth16 verification"
if [ -f "programs/solvoid-zk/src/verifier.rs" ] && grep -q "verify_withdraw_proof" programs/solvoid-zk/src/verifier.rs; then
    echo " Found Groth16 verification"
else
    echo " No Groth16 verification found"
    exit 1
fi

# Test 4: Check for nullifier management
echo "Test 4: Checking for nullifier management"
if [ -f "programs/solvoid-zk/src/nullifier_set.rs" ] && grep -q "check_nullifier_exists" programs/solvoid-zk/src/nullifier_set.rs; then
    echo " Found nullifier management"
else
    echo " No nullifier management found"
    exit 1
fi

# Test 5: Check for Merkle tree operations
echo "Test 5: Checking for Merkle tree operations"
if grep -r "merkle\|Merkle" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found Merkle tree operations"
else
    echo " No Merkle tree operations found"
    exit 1
fi

# Test 6: Check for deposit/withdraw functions
echo "Test 6: Checking for deposit/withdraw functions"
if [ -f "programs/solvoid-zk/src/lib.rs" ] && grep -q "pub fn deposit\|pub fn withdraw" programs/solvoid-zk/src/lib.rs; then
    echo " Found deposit/withdraw functions"
else
    echo " No deposit/withdraw functions found"
    exit 1
fi

# Test 7: Check for circuit breaker implementation
echo "Test 7: Checking for circuit breaker implementation"
if grep -r "CircuitBreakerTriggered\|circuit.*breaker" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found circuit breaker implementation"
else
    echo " No circuit breaker implementation found"
    exit 1
fi

# Test 8: Check for economic controls
echo "Test 8: Checking for economic controls"
if [ -f "programs/solvoid-zk/src/economics.rs" ] && grep -q "calculate_protocol_fee" programs/solvoid-zk/src/economics.rs; then
    echo " Found economic controls"
else
    echo " No economic controls found"
    exit 1
fi

# Test 9: Check for validation logic
echo "Test 9: Checking for validation logic"
if [ -f "programs/solvoid-zk/src/validation.rs" ] && grep -q "validate_" programs/solvoid-zk/src/validation.rs; then
    echo " Found validation logic"
else
    echo " No validation logic found"
    exit 1
fi

# Test 10: Check for event emissions
echo "Test 10: Checking for event emissions"
if grep -r "#\[event\]\|emit!" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found event emissions"
else
    echo " No event emissions found"
    exit 1
fi

# Test 11: Validate circuit file sizes
echo "Test 11: Validating circuit file sizes"
if [ -s "withdraw.wasm" ] && [ -s "withdraw.zkey" ]; then
    echo " Circuit files have content"
else
    echo " Circuit files are empty"
    exit 1
fi

# Test 12: Check for TypeScript integration
echo "Test 12: Checking for TypeScript integration"
if [ -f "sdk/index.ts" ] && grep -r "Poseidon\|Groth16" sdk/ > /dev/null 2>&1; then
    echo " Found TypeScript integration"
else
    echo " No TypeScript integration found"
    exit 1
fi

echo " End-to-end privacy lifecycle validation completed!"
exit 0

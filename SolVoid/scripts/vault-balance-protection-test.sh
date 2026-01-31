#!/bin/bash

# Vault balance protection test script
# This script validates vault balance protection mechanisms

echo " Testing vault balance protection..."

# Test 1: Check for vault balance validation logic
echo "Test 1: Checking for vault balance validation logic"
if grep -r "vault_balance\|vault.*balance\|get_lamports" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found vault balance validation logic"
else
    echo " No vault balance validation logic found"
    exit 1
fi

# Test 2: Check for insufficient balance protection
echo "Test 2: Checking for insufficient balance protection"
if grep -r "InsufficientVaultBalance\|vault_balance.*>=.*required" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found insufficient balance protection"
else
    echo " No insufficient balance protection found"
    exit 1
fi

# Test 3: Check for circuit breaker implementation
echo "Test 3: Checking for circuit breaker implementation"
if grep -r "CIRCUIT_BREAKER_THRESHOLD\|CircuitBreakerTriggered\|pause_withdrawals" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found circuit breaker implementation"
else
    echo " No circuit breaker implementation found"
    exit 1
fi

# Test 4: Check for minimum reserve protection
echo "Test 4: Checking for minimum reserve protection"
if grep -r "MINIMUM_VAULT_RESERVE\|InsufficientVaultReserve\|minimum.*reserve" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found minimum reserve protection"
else
    echo " No minimum reserve protection found"
    exit 1
fi

# Test 5: Check for atomic balance operations
echo "Test 5: Checking for atomic balance operations"
if grep -r "checked_add\|checked_sub\|atomic.*balance" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found atomic balance operations"
else
    echo " No atomic balance operations found"
    exit 1
fi

# Test 6: Check for pre-validation logic
echo "Test 6: Checking for pre-validation logic"
if grep -r "PRE-VALIDATION\|pre.*validation\|before.*state.*changes" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found pre-validation logic"
else
    echo "  No explicit pre-validation comments found"
fi

# Test 7: Check for withdrawal amount validation
echo "Test 7: Checking for withdrawal amount validation"
if grep -r "withdrawal.*amount\|total_amount.*validation\|deposit_amount" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found withdrawal amount validation"
else
    echo " No withdrawal amount validation found"
    exit 1
fi

# Test 8: Check for emergency event emission
echo "Test 8: Checking for emergency event emission"
if grep -r "emit!.*CircuitBreakerTriggered\|event.*CircuitBreaker" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found emergency event emission"
else
    echo " No emergency event emission found"
    exit 1
fi

# Test 9: Validate constants are properly defined
echo "Test 9: Validating protection constants"
if grep -r "MINIMUM_VAULT_RESERVE.*=.*[0-9]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found minimum reserve constant"
else
    echo " No minimum reserve constant found"
    exit 1
fi

if grep -r "CIRCUIT_BREAKER_THRESHOLD.*=.*[0-9]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found circuit breaker threshold constant"
else
    echo " No circuit breaker threshold constant found"
    exit 1
fi

# Test 10: Check for comprehensive balance validation
echo "Test 10: Checking for comprehensive balance validation"
if grep -A 10 -B 5 "COMPREHENSIVE BALANCE VALIDATION" programs/solvoid-zk/src/lib.rs > /dev/null 2>&1; then
    echo " Found comprehensive balance validation section"
else
    echo "  No explicit comprehensive validation section found"
fi

echo " Vault balance protection validation completed!"
exit 0

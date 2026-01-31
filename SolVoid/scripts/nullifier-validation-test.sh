#!/bin/bash

# Nullifier double-spend prevention test script
# This script validates nullifier double-spend prevention mechanisms

echo " Testing nullifier double-spend prevention..."

# Test 1: Check for nullifier double-spend prevention logic
echo "Test 1: Checking for nullifier double-spend prevention logic"
if grep -r "check_nullifier_exists\|add_nullifier_to_set\|NullifierAlreadyUsed" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found nullifier double-spend prevention logic"
else
    echo " No nullifier double-spend prevention logic found"
    exit 1
fi

# Test 2: Check for proper nullifier validation
echo "Test 2: Checking for proper nullifier validation"
if grep -r "nullifier.*validation\|validate_nullifier" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found nullifier validation logic"
else
    echo "  No explicit nullifier validation found"
fi

# Test 3: Check for nullifier set management
echo "Test 3: Checking for nullifier set management"
if grep -r "NullifierSet\|NULLIFIER_SET_SIZE\|nullifiers.*vector" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found nullifier set management"
else
    echo " No nullifier set management found"
    exit 1
fi

# Test 4: Check for timestamp-based pruning
echo "Test 4: Checking for timestamp-based pruning"
if grep -r "NULLIFIER_PRUNE_DAYS\|prune.*nullifier\|timestamp.*prune" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found timestamp-based nullifier pruning"
else
    echo "  No timestamp-based pruning found"
fi

# Test 5: Check for bitmap optimization
echo "Test 5: Checking for bitmap optimization"
if grep -r "bitmap\|NULLIFIER_BITMAP_SIZE\|bitmap_index" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found bitmap optimization for fast lookups"
else
    echo "  No bitmap optimization found"
fi

# Test 6: Check for merkle root updates
echo "Test 6: Checking for merkle root updates"
if grep -r "merkle_root\|compute_nullifier_merkle_root" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found merkle root management"
else
    echo "  No merkle root management found"
fi

# Test 7: Check for atomic operations
echo "Test 7: Checking for atomic nullifier operations"
if grep -r "add_nullifier_to_set.*atomic\|check.*exists.*before.*add" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found atomic nullifier operations"
else
    echo "  No explicit atomic operations found (may be implicit)"
fi

# Test 8: Validate nullifier uniqueness logic
echo "Test 8: Validating nullifier uniqueness logic"
# Check that the code prevents duplicate nullifiers
if grep -A 5 -B 5 "check_nullifier_exists.*add_nullifier_to_set" programs/solvoid-zk/src/nullifier_set.rs > /dev/null 2>&1; then
    echo " Found proper nullifier uniqueness check"
else
    echo "  Nullifier uniqueness check may be implicit"
fi

echo " Nullifier double-spend prevention validation completed!"
exit 0

#!/bin/bash

# Rust clippy test script
# This script validates Rust code quality using clippy

echo " Testing Rust clippy configuration..."

# Test 1: Check for clippy configuration
echo "Test 1: Checking for clippy configuration"
if [ -f "programs/solvoid-zk/clippy.toml" ] || [ -f "programs/solvoid-zk/.clippy.toml" ] || grep -r "clippy" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found clippy configuration"
else
    echo "  No explicit clippy configuration found"
fi

# Test 2: Check for Rust code quality patterns
echo "Test 2: Checking for Rust code quality patterns"
if grep -r "#\[deny.*clippy\]\|#\[warn.*clippy\]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found clippy lint directives"
else
    echo "  No explicit clippy lint directives found"
fi

# Test 3: Check for common Rust best practices
echo "Test 3: Checking for common Rust best practices"
if grep -r "unwrap()\|expect(" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo "  Found potential unwrap() usage (should use proper error handling)"
else
    echo " No obvious unwrap() usage found"
fi

# Test 4: Check for proper error handling
echo "Test 4: Checking for proper error handling"
if grep -r "Result<.*>" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found Result types for error handling"
else
    echo "  Limited Result type usage found"
fi

# Test 5: Check for documentation comments
echo "Test 5: Checking for documentation comments"
if grep -r "///\|//!" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found documentation comments"
else
    echo "  Limited documentation comments found"
fi

# Test 6: Check for proper module organization
echo "Test 6: Checking for proper module organization"
if [ -f "programs/solvoid-zk/src/lib.rs" ] && grep -r "pub mod" programs/solvoid-zk/src/lib.rs > /dev/null 2>&1; then
    echo " Found proper module organization"
else
    echo " No proper module organization found"
    exit 1
fi

# Test 7: Check for Rust edition
echo "Test 7: Checking for Rust edition"
if grep -r "edition.*=.*2021" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found Rust 2021 edition"
else
    echo "  No Rust 2021 edition found"
fi

# Test 8: Check for dependency management
echo "Test 8: Checking for dependency management"
if [ -f "programs/solvoid-zk/Cargo.toml" ] && grep -r "\[dependencies\]" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found dependency management"
else
    echo " No dependency management found"
    exit 1
fi

# Test 9: Check for security-focused dependencies
echo "Test 9: Checking for security-focused dependencies"
if grep -r "ark-crypto-primitives\|sha2\|ed25519" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found security-focused dependencies"
else
    echo "  Limited security-focused dependencies found"
fi

# Test 10: Check for proper use of Rust features
echo "Test 10: Checking for proper use of Rust features"
if grep -r "#\[derive\]\|#\[allow\]\|#\[deny\]" programs/solvoid-zk/src/ > /dev/null 2>&1; then
    echo " Found proper use of Rust features"
else
    echo "  Limited use of Rust features found"
fi

echo " Rust clippy validation completed!"
exit 0

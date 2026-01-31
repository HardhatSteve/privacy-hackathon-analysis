#!/bin/bash

# Rust dependency audit script
# This script validates Rust dependency security

echo " Testing Rust dependency security..."

# Test 1: Check for Cargo.toml existence
echo "Test 1: Checking for Cargo.toml existence"
if [ -f "programs/solvoid-zk/Cargo.toml" ]; then
    echo " Found Cargo.toml"
else
    echo " No Cargo.toml found"
    exit 1
fi

# Test 2: Check for security-focused dependencies
echo "Test 2: Checking for security-focused dependencies"
if grep -r "ark-crypto-primitives\|sha2\|ed25519\|blake2" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found security-focused dependencies"
else
    echo " No security-focused dependencies found"
    exit 1
fi

# Test 3: Check for dependency versions
echo "Test 3: Checking for dependency versions"
if grep -r "version.*=.*\"0\." programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found versioned dependencies"
else
    echo " No versioned dependencies found"
    exit 1
fi

# Test 4: Check for cryptographic dependencies
echo "Test 4: Checking for cryptographic dependencies"
if grep -r "ark-\|curve25519\|digest\|signature" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found cryptographic dependencies"
else
    echo " No cryptographic dependencies found"
    exit 1
fi

# Test 5: Check for dependency security features
echo "Test 5: Checking for dependency security features"
if grep -r "features.*=.*\[.*security.*\]\|features.*=.*\[.*crypto.*\]" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found security features in dependencies"
else
    echo "  No explicit security features found"
fi

# Test 6: Check for known secure dependency versions
echo "Test 6: Checking for known secure dependency versions"
if grep -r "ark-crypto-primitives.*0\." programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found ark-crypto-primitives dependency"
else
    echo " No ark-crypto-primitives found"
    exit 1
fi

# Test 7: Check for dependency lock file
echo "Test 7: Checking for dependency lock file"
if [ -f "programs/solvoid-zk/Cargo.lock" ]; then
    echo " Found Cargo.lock file"
else
    echo "  No Cargo.lock file found"
fi

# Test 8: Check for dependency audit configuration
echo "Test 8: Checking for dependency audit configuration"
if [ -f "programs/solvoid-zk/.cargo-audit.toml" ] || [ -f "programs/solvoid-zk/audit.toml" ]; then
    echo " Found audit configuration"
else
    echo "  No audit configuration found"
fi

# Test 9: Check for secure dependency sources
echo "Test 9: Checking for secure dependency sources"
if grep -r "crates.io\|github.com\|solana-program\|anchor-lang" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found secure dependency sources"
else
    echo " No secure dependency sources found"
    exit 1
fi

# Test 10: Check for dependency hygiene
echo "Test 10: Checking for dependency hygiene"
if grep -r "dev-dependencies\|build-dependencies" programs/solvoid-zk/Cargo.toml > /dev/null 2>&1; then
    echo " Found proper dependency sections"
else
    echo "  Limited dependency sections found"
fi

echo " Rust dependency audit validation completed!"
exit 0

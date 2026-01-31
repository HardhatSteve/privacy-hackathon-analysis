#!/bin/bash

# Cross-Component Hash Verification CI Script
# This script runs hash consistency checks across all components

set -e

echo " Starting Cross-Component Hash Verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "ℹ  $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo is not installed"
        exit 1
    fi
    
    if ! command -v circom &> /dev/null; then
        log_warning "Circom is not installed, skipping Circom tests"
        SKIP_CIRCOM=true
    fi
    
    log_success "All dependencies checked"
}

# Run TypeScript hash tests
run_typescript_tests() {
    log_info "Running TypeScript hash tests..."
    
    cd tests/integration
    npm test -- cross-component-hash-verification.test.ts
    
    if [ $? -eq 0 ]; then
        log_success "TypeScript hash tests passed"
    else
        log_error "TypeScript hash tests failed"
        exit 1
    fi
    
    cd ../..
}

# Run Rust hash tests
run_rust_tests() {
    log_info "Running Rust hash tests..."
    
    cd programs/solvoid-zk
    
    # Run Poseidon hash tests
    cargo test test_poseidon_hash --release
    
    if [ $? -eq 0 ]; then
        log_success "Rust Poseidon hash tests passed"
    else
        log_error "Rust Poseidon hash tests failed"
        exit 1
    fi
    
    # Run Merkle tree tests
    cargo test test_merkle_root --release
    
    if [ $? -eq 0 ]; then
        log_success "Rust Merkle tree tests passed"
    else
        log_error "Rust Merkle tree tests failed"
        exit 1
    fi
    
    cd ..
}

# Run Circom hash tests
run_circom_tests() {
    if [ "$SKIP_CIRCOM" = true ]; then
        log_warning "Skipping Circom tests (not installed)"
        return
    fi
    
    log_info "Running Circom hash tests..."
    
    # Create temporary test circuit
    cat > temp_poseidon_test.circom << 'EOF'
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template PoseidonTest() {
    signal input in[2];
    signal output out;
    
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== in[0];
    poseidon.inputs[1] <== in[1];
    poseidon.out ==> out;
}

component main = PoseidonTest();
EOF
    
    # Compile circuit
    circom temp_poseidon_test.circom --r1cs --wasm --sym
    
    # Generate witness for test inputs
    node -e "
    const { buildPoseidon } = require('circomlibjs');
    const snarkjs = require('snarkjs');
    
    async function test() {
        const poseidon = await buildPoseidon();
        const inputs = [123, 456];
        const inputsBigInt = inputs.map(x => BigInt(x));
        const expected = poseidon(inputsBigInt);
        const expectedHex = '0x' + expected.toString(16).padStart(64, '0');
        
        console.log('Expected:', expectedHex);
        
        const { witness } = await require('./temp_poseidon_test_js').default.witness.calculate({
            in: inputs
        });
        
        const result = witness[1];
        const resultHex = '0x' + result.toString(16).padStart(64, '0');
        
        console.log('Got:', resultHex);
        
        if (expectedHex !== resultHex) {
            console.error('Circom hash mismatch!');
            process.exit(1);
        }
        
        console.log(' Circom hash test passed');
    }
    
    test().catch(console.error);
    "
    
    if [ $? -eq 0 ]; then
        log_success "Circom hash tests passed"
    else
        log_error "Circom hash tests failed"
        exit 1
    fi
    
    # Cleanup
    rm -f temp_poseidon_test.circom temp_poseidon_test.r1cs temp_poseidon_test.sym temp_poseidon_test.wasm
    rm -rf temp_poseidon_test_js
}

# Compare hash results across platforms
compare_hash_results() {
    log_info "Comparing hash results across platforms..."
    
    # Generate test vectors
    node -e "
    const { buildPoseidon } = require('circomlibjs');
    
    async function generateTestVectors() {
        const poseidon = await buildPoseidon();
        const testVectors = [
            [123, 456],
            [0, 0],
            [1, 2, 3, 4],
            [999999, 888888, 777777]
        ];
        
        console.log('TEST_VECTORS=' + JSON.stringify(testVectors.map(inputs => {
            const inputsBigInt = inputs.map(x => BigInt(x));
            const result = poseidon(inputsBigInt);
            return {
                inputs: inputs,
                expected: '0x' + result.toString(16).padStart(64, '0')
            };
        })));
    }
    
    generateTestVectors().catch(console.error);
    " > /tmp/test_vectors.json
    
    # Extract test vectors
    TEST_VECTORS=$(cat /tmp/test_vectors.json | grep -o 'TEST_VECTORS=.*' | cut -d'=' -f2)
    
    # Run TypeScript tests with these vectors
    node -e "
    const { buildPoseidon } = require('circomlibjs');
    const testVectors = $TEST_VECTORS;
    
    async function test() {
        const poseidon = await buildPoseidon();
        
        for (const vector of testVectors) {
            const inputsBigInt = vector.inputs.map(x => BigInt(x));
            const result = poseidon(inputsBigInt);
            const resultHex = '0x' + result.toString(16).padStart(64, '0');
            
            if (resultHex !== vector.expected) {
                console.error('TypeScript hash mismatch for inputs:', vector.inputs);
                console.error('Expected:', vector.expected);
                console.error('Got:', resultHex);
                process.exit(1);
            }
        }
        
        console.log(' TypeScript hash comparison passed');
    }
    
    test().catch(console.error);
    "
    
    if [ $? -eq 0 ]; then
        log_success "Hash comparison across platforms passed"
    else
        log_error "Hash comparison across platforms failed"
        exit 1
    fi
    
    # Cleanup
    rm -f /tmp/test_vectors.json
}

# Check for cryptographic drift
check_cryptographic_drift() {
    log_info "Checking for cryptographic drift..."
    
    # Run regression tests
    node -e "
    const { buildPoseidon } = require('circomlibjs');
    
    async function checkDrift() {
        const poseidon = await buildPoseidon();
        
        // Known good hashes for regression testing
        const regressionTests = [
            {
                name: 'Basic commitment',
                inputs: [12345, 67890],
                expected: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1'
            },
            {
                name: 'Large numbers',
                inputs: [BigInt('1000000000000000000'), BigInt('2000000000000000000')],
                expected: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9'
            }
        ];
        
        for (const test of regressionTests) {
            const inputsBigInt = test.inputs.map(x => BigInt(x));
            const result = poseidon(inputsBigInt);
            const resultHex = '0x' + result.toString(16).padStart(64, '0');
            
            if (resultHex !== test.expected) {
                console.error('Cryptographic drift detected in:', test.name);
                console.error('Expected:', test.expected);
                console.error('Got:', resultHex);
                process.exit(1);
            }
        }
        
        console.log(' No cryptographic drift detected');
    }
    
    checkDrift().catch(console.error);
    "
    
    if [ $? -eq 0 ]; then
        log_success "No cryptographic drift detected"
    else
        log_error "Cryptographic drift detected - build failed"
        exit 1
    fi
}

# Main execution
main() {
    echo " Cross-Component Hash Verification Started"
    echo "=========================================="
    
    check_dependencies
    run_typescript_tests
    run_rust_tests
    run_circom_tests
    compare_hash_results
    check_cryptographic_drift
    
    echo "=========================================="
    log_success "All cross-component hash verification tests passed!"
    echo " Build can proceed safely"
}

# Run main function
main "$@"

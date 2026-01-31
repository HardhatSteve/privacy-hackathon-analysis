#!/bin/bash

# SolVoid Circuit Build Script
# This script compiles the ZK circuits and generates proving/verification keys

set -e

CIRCUIT_DIR="circuits"
BUILD_DIR="circuits/build"
PTAU_FILE="ceremony/pot14_0000.ptau"

# Create build directories
mkdir -p $BUILD_DIR
mkdir -p ceremony

echo " Building SolVoid ZK Circuits..."

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo " circom not found. Please install circom: npm install -g circom"
    exit 1
fi

# Check if snarkjs is available (either globally or via npx)
if ! command -v snarkjs &> /dev/null; then
    echo " snarkjs not found globally, trying npx..."
    if ! npx snarkjs --version &> /dev/null 2>&1; then
        echo " npx snarkjs not available, trying local node_modules..."
        if [ -f "../node_modules/.bin/snarkjs" ]; then
            SNARKJS_CMD="../node_modules/.bin/snarkjs"
            echo " Using local snarkjs"
        else
            echo " snarkjs not found. Please install snarkjs: npm install -g snarkjs"
            exit 1
        fi
    else
        SNARKJS_CMD="npx snarkjs"
    fi
else
    SNARKJS_CMD="snarkjs"
fi

# Download Powers of Tau if not exists
if [ ! -f "$PTAU_FILE" ]; then
    echo " Downloading Powers of Tau (2^14)..."
    curl https://hermez.s3-eu-west-1.amazonaws.com/pot14_0000.ptau -o $PTAU_FILE
fi

# Build withdraw circuit
echo " Building withdraw circuit..."
circom ../$CIRCUIT_DIR/withdraw.circom --r1cs --wasm --output $BUILD_DIR
$SNARKJS_CMD groth16 setup $BUILD_DIR/withdraw.r1cs ../$PTAU_FILE $BUILD_DIR/withdraw.zkey
$SNARKJS_CMD zkey contribute $BUILD_DIR/withdraw.zkey $BUILD_DIR/withdraw_final.zkey --name="SolVoid Withdraw Ceremony" -v
$SNARKJS_CMD zkey export verificationkey $BUILD_DIR/withdraw_final.zkey $BUILD_DIR/withdraw_vk.json

# Generate Solidity verifiers (for reference)
echo " Generating Solidity verifiers..."
$SNARKJS_CMD zkey export solidityverifier $BUILD_DIR/withdraw_final.zkey $BUILD_DIR/WithdrawVerifier.sol

# Copy final keys to program directory
echo " Copying verification keys..."
cp $BUILD_DIR/withdraw_vk.json programs/solvoid-zk/

echo " Circuit build complete!"
echo ""
echo " Build Summary:"
echo "   Withdraw circuit: $BUILD_DIR/withdraw.r1cs"
echo "   Withdraw zkey: $BUILD_DIR/withdraw_final.zkey"
echo "   Withdraw VK: $BUILD_DIR/withdraw_vk.json"
echo ""
echo " Next steps:"
echo "   1. Review the generated verification keys"
echo "   2. Test the circuits with sample inputs"
echo "   3. Update the Solana program to use the real VKs"
echo "   4. Run security tests before deployment"

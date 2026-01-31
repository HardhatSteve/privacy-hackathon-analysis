#!/bin/bash
set -e

# Real ZK Build System for PrivacyZero
# This script replaces the mock system with real Circom compilation and SNARKJS ceremony.

CIRCUIT_NAME="withdraw"
PTAU_FILE="pot14_final.ptau"
BUILD_DIR="./build-zk"

mkdir -p $BUILD_DIR

echo "--- Phase 1: Circom Compilation ---"
circom -l "/home/elliot/Documents/Solana privacy/privacy-zero/" circuits/$CIRCUIT_NAME.circom --r1cs --wasm --sym --output $BUILD_DIR

echo "--- Phase 2: Powers of Tau ---"
if [ ! -f "$PTAU_FILE" ]; then
    echo "Generating new Powers of Tau (pot14)..."
    npx snarkjs powersoftau new bn128 14 $BUILD_DIR/pot14_0000.ptau -v
    npx snarkjs powersoftau contribute $BUILD_DIR/pot14_0000.ptau $BUILD_DIR/pot14_0001.ptau --name="First contribution" -v -e="some random text"
    npx snarkjs powersoftau prepare phase2 $BUILD_DIR/pot14_0001.ptau $PTAU_FILE -v
fi

echo "--- Phase 3: Groth16 Setup ---"
npx snarkjs groth16 setup $BUILD_DIR/$CIRCUIT_NAME.r1cs $PTAU_FILE $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey
npx snarkjs zkey contribute $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey --name="Second contribution" -v -e="more randomness"

echo "--- Phase 4: Verification Key Export ---"
npx snarkjs zkey export verificationkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey $BUILD_DIR/verification_key.json

echo "ZK Build Complete. Artifacts in $BUILD_DIR"

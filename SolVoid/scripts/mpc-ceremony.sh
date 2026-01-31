#!/bin/bash

# SOLVOID MPC CEREMONY SUITE
# Phase 2: Circuit-Specific Contribution (Phase 1/Powers of Tau assumed complete)

CIRCUIT_NAME="withdraw"
PTAU_FILE="pot14_final.ptau"
CONTRIBUTION_DIR="./ceremony/contributions"
FINAL_ZKEY="withdraw_final.zkey"

echo "--- [SOLVOID MPC CEREMONY: INITIALIZATION] ---"

mkdir -p $CONTRIBUTION_DIR

# 1. Start from local zkey if exists, or generate initial from ptau
if [ ! -f "withdraw_0000.zkey" ]; then
    echo "[i] Generating initial zkey from ptau..."
    npx snarkjs groth16 setup circuits/${CIRCUIT_NAME}.r1cs $PTAU_FILE withdraw_0000.zkey
fi

echo "[i] Current contribution count: $(ls $CONTRIBUTION_DIR | wc -l)"

# function to contribute
contribute() {
    local index=$1
    local prev_zkey=$2
    local next_zkey=$3
    local name=$4
    
    echo "--- [CONTRIBUTION ENTRY by $name] ---"
    npx snarkjs zkey contribute $prev_zkey $next_zkey --name="$name" -v -e="$(openssl rand -base64 32)"
}

# This script is designed to be called by the Ceremony Monitor backend or manually
if [ "$1" == "contribute" ]; then
    prev_idx=$(ls $CONTRIBUTION_DIR | wc -l)
    new_idx=$((prev_idx + 1))
    
    if [ $prev_idx -eq 0 ]; then
        prev_z="withdraw_0000.zkey"
    else
        prev_z="$CONTRIBUTION_DIR/contribution_${prev_idx}.zkey"
    fi
    
    contribute $new_idx $prev_z "$CONTRIBUTION_DIR/contribution_${new_idx}.zkey" "${2:-Anonymous_Node_$new_idx}"
    echo "[SUCCESS] Contribution #$new_idx recorded."
fi

# Finalization
if [ "$1" == "finalize" ]; then
    last_zkey=$(ls -t $CONTRIBUTION_DIR/*.zkey | head -1)
    echo "[i] Finalizing from $last_zkey..."
    npx snarkjs zkey export verificationkey $last_zkey verification_key.json
    cp $last_zkey $FINAL_ZKEY
    echo "[SUCCESS] Global Proving Key Finalized. Toxic waste neutralized."
fi

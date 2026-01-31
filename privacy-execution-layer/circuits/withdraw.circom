pragma circom 2.1.0;

include "poseidon.circom";

/*
 * Privacy Execution Layer v3.0 - Withdraw Circuit
 * 
 * Proves knowledge of (secret, nullifier) such that:
 * 1. commitment = Poseidon(secret, nullifier) exists in merkle tree
 * 2. nullifierHash = Poseidon(nullifier)
 * 
 * Public Inputs:
 *   - root: Current merkle tree root
 *   - nullifierHash: Hash of nullifier (to prevent double-spend)
 * 
 * Private Inputs:
 *   - secret: User's secret (32 bytes)
 *   - nullifier: User's nullifier (32 bytes)
 *   - pathElements[20]: Merkle proof siblings
 *   - pathIndices[20]: Merkle proof directions (0=left, 1=right)
 */

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal hashes[levels + 1];
    hashes[0] <== leaf;

    component hashers[levels];

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        // Swap based on path index
        var left = (1 - pathIndices[i]) * hashes[i] + pathIndices[i] * pathElements[i];
        var right = pathIndices[i] * hashes[i] + (1 - pathIndices[i]) * pathElements[i];
        
        hashers[i].inputs[0] <== left;
        hashers[i].inputs[1] <== right;
        hashes[i + 1] <== hashers[i].out;
    }

    // Final hash must equal root
    root === hashes[levels];
}

template Withdraw(levels) {
    // ===== PUBLIC INPUTS =====
    signal input root;
    signal input nullifierHash;
    
    // ===== PRIVATE INPUTS =====
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    // ===== STEP 1: Compute commitment =====
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;
    signal commitment <== commitmentHasher.out;
    
    // ===== STEP 2: Verify nullifier hash =====
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash === nullifierHasher.out;
    
    // ===== STEP 3: Verify merkle membership =====
    component merkleChecker = MerkleTreeChecker(levels);
    merkleChecker.leaf <== commitment;
    merkleChecker.root <== root;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }
}

// Main component with 20 levels (~1M leaves)
component main {public [root, nullifierHash]} = Withdraw(20);

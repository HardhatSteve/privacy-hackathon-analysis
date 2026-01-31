pragma circom 2.0.0;

// Import the Poseidon Hashing function (It's like SHA-256 but built for ZK)
include "./node_modules/circomlib/circuits/poseidon.circom";

template ShadowFence() {
    // Private Input: This is your secret password/location
    signal input location_secret;

    // Public Input: This is the hash everyone can see on-chain
    signal input stored_hash;

    // 1. Setup the Hasher
    component hasher = Poseidon(1);
    hasher.inputs[0] <== location_secret;

    // 2. The Verification
    // We check if "Hash(Secret) == Stored_Hash"
    stored_hash === hasher.out;
}

// Define the main component
component main {public [stored_hash]} = ShadowFence();

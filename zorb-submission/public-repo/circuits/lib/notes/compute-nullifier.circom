pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Compute nullifier for spending a note (position-independent)
// nullifier = Poseidon(nk, rho, commitment)
//
// Position-independent nullifier derivation (Orchard model):
// - nk: Nullifier deriving key (derived from nsk)
// - rho: Uniqueness parameter (from spent note that created this note)
// - commitment: Defense-in-depth binding to note content
template ComputeNullifier() {
    signal input nk;
    signal input rho;              // Replaces pathIndices
    signal input commitment;       // Kept for defense-in-depth
    signal output nullifier;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== nk;
    hasher.inputs[1] <== rho;
    hasher.inputs[2] <== commitment;
    nullifier <== hasher.out;
}

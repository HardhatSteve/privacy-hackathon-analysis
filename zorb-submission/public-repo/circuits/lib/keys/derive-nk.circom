pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Derive nullifier key from nullifier secret
// nk = Poseidon(nsk)
template DeriveNk() {
    signal input nsk;
    signal output nk;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== nsk;
    nk <== hasher.out;
}

pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Derive authorization key from spend authorizing secret
// ak = Poseidon(ask)
template DeriveAk() {
    signal input ask;
    signal output ak;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== ask;
    ak <== hasher.out;
}

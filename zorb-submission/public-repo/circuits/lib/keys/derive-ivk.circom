pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Derive incoming viewing key from (ak, nk)
// ivk = Poseidon(ak, nk)
template DeriveIvk() {
    signal input ak;
    signal input nk;
    signal output ivk;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== ak;
    hasher.inputs[1] <== nk;
    ivk <== hasher.out;
}

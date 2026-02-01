pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Derive public key from incoming viewing key
// pk = Poseidon(ivk)
template DerivePk() {
    signal input ivk;
    signal output pk;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== ivk;
    pk <== hasher.out;
}

pragma circom 2.0.0;

include "./derive-ak.circom";
include "./derive-nk.circom";
include "./derive-ivk.circom";
include "./derive-pk.circom";

// Full key derivation chain from secret keys to public key
// (ask, nsk) -> ak, nk -> ivk -> pk
//
// This is the main template used in the transaction circuit.
// It exposes all intermediate keys for use in commitment and nullifier computation.
template DeriveKeys() {
    signal input ask;   // Spend authorizing secret key
    signal input nsk;   // Nullifier secret key

    signal output ak;   // Authorization key (public)
    signal output nk;   // Nullifier deriving key (public)
    signal output ivk;  // Incoming viewing key
    signal output pk;   // Public key (used in note commitments)

    component deriveAk = DeriveAk();
    deriveAk.ask <== ask;
    ak <== deriveAk.ak;

    component deriveNk = DeriveNk();
    deriveNk.nsk <== nsk;
    nk <== deriveNk.nk;

    component deriveIvk = DeriveIvk();
    deriveIvk.ak <== ak;
    deriveIvk.nk <== nk;
    ivk <== deriveIvk.ivk;

    component derivePk = DerivePk();
    derivePk.ivk <== ivk;
    pk <== derivePk.pk;
}

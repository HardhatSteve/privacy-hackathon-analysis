pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/comparators.circom";

// Select a value from an array using an index signal
// Uses O(n) equality checks to find the matching slot
template IndexSelect(n) {
    signal input arr[n];
    signal input index;
    signal output out;
    signal output indexEq[n];  // Expose equality signals for reuse

    component isIdx[n];
    signal accum[n + 1];
    accum[0] <== 0;

    for (var i = 0; i < n; i++) {
        isIdx[i] = IsEqual();
        isIdx[i].in[0] <== index;
        isIdx[i].in[1] <== i;
        indexEq[i] <== isIdx[i].out;

        accum[i + 1] <== accum[i] + arr[i] * indexEq[i];
    }

    out <== accum[n];
}

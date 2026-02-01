pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/comparators.circom";

// Verify that all nullifiers in a transaction are unique
// Prevents double-spending within a single transaction
template EnforceNullifierUniqueness(n) {
    signal input nullifiers[n];

    component eq[n * (n - 1) / 2];

    var idx = 0;
    for (var i = 0; i < n - 1; i++) {
        for (var j = i + 1; j < n; j++) {
            eq[idx] = IsEqual();
            eq[idx].in[0] <== nullifiers[i];
            eq[idx].in[1] <== nullifiers[j];
            eq[idx].out === 0;  // Must not be equal
            idx++;
        }
    }
}

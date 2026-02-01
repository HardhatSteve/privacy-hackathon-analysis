pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";

// Division by constant 1e18 (accumulator precision)
// Proves: dividend = quotient * 1e18 + remainder, where 0 <= remainder < 1e18
//
// The prover provides the remainder as a hint. The circuit verifies:
// 1. quotient * 1e18 + remainder === dividend
// 2. remainder < 1e18 (range check)
template DivBy1e18() {
    signal input dividend;
    signal input remainder;  // Private hint: dividend mod 1e18
    signal output out;       // The quotient = floor(dividend / 1e18)

    var SCALE = 1000000000000000000;  // 1e18

    // Compute quotient (unconstrained computation)
    signal quotient <-- (dividend - remainder) / SCALE;

    // Verify division: quotient * SCALE + remainder === dividend
    signal product <== quotient * SCALE;
    product + remainder === dividend;

    // Range check: remainder must be in [0, 1e18)
    // First, prove remainder fits in 60 bits (1e18 < 2^60)
    component remainderBits = Num2Bits(60);
    remainderBits.in <== remainder;

    // Then, prove remainder < 1e18 exactly
    component remainderLt = LessThan(64);
    remainderLt.in[0] <== remainder;
    remainderLt.in[1] <== SCALE;
    remainderLt.out === 1;

    out <== quotient;
}

pragma circom 2.0.0;

include "./div-by-1e18.circom";

// Compute accrued reward for a note
// reward = floor(amount * (globalAccumulator - noteAccumulator) / 1e18)
//
// The accumulator difference represents the yield earned per unit since the note was created.
// Multiplying by amount and dividing by 1e18 gives the actual reward.
template ComputeReward() {
    signal input amount;
    signal input globalAccumulator;    // Current global reward accumulator
    signal input noteAccumulator;      // Accumulator snapshot when note was created
    signal input remainder;            // Division hint: (amount * diff) mod 1e18
    signal output reward;
    signal output totalValue;          // amount + reward (for value conservation)

    // Compute accumulator difference
    signal accumulatorDiff <== globalAccumulator - noteAccumulator;

    // Compute unscaled reward: amount * accumulatorDiff
    signal unscaledReward <== amount * accumulatorDiff;

    // Scale down by 1e18
    component scaler = DivBy1e18();
    scaler.dividend <== unscaledReward;
    scaler.remainder <== remainder;

    reward <== scaler.out;
    totalValue <== amount + reward;
}

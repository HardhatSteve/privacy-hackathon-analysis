pragma circom 2.0.0;

// =============================================================================
// SHARED NULLIFIER CIRCUIT COMPONENTS
// =============================================================================
// Common templates used by both:
//   - nullifier-non-membership.circom (non-membership proofs)
//   - nullifier-batch-insert.circom (batch insertion proofs)
//
// =============================================================================

include "../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/switcher.circom";

// Re-export MerkleProof from shared merkle lib
include "../merkle/merkle-proof.circom";

// =============================================================================
// INDEXED LEAF HASH
// =============================================================================
// Compute: Poseidon(value, next_index, next_value)
// Following Aztec's indexed merkle tree design with 3-input Poseidon
template IndexedLeafHash() {
    signal input value;
    signal input next_value;
    signal input next_index;
    signal output hash;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== value;
    hasher.inputs[1] <== next_index;
    hasher.inputs[2] <== next_value;

    hash <== hasher.out;
}

// =============================================================================
// FIELD LESS THAN
// =============================================================================
// Compares two BN254 field elements: returns 1 if in[0] < in[1], 0 otherwise.
//
// Unlike circomlib's LessThan(n) which only works for values < 2^n, this
// template correctly handles the full BN254 field range [0, p) where
// p ≈ 2^254.
//
// Algorithm:
//   1. Decompose both inputs to 254 bits
//   2. Compare bit by bit from MSB (bit 253) to LSB (bit 0)
//   3. The first differing bit determines the result:
//      - If in[0]'s bit is 0 and in[1]'s bit is 1 → in[0] < in[1]
//      - If in[0]'s bit is 1 and in[1]'s bit is 0 → in[0] > in[1]
//      - If all bits equal → in[0] == in[1] (not less than)
//
// Constraints: ~1271 (vs ~504 for LessThan(252))
// Trade-off: More constraints but correct for ALL field elements
// Note: Full bit decomposition is necessary - cannot be reduced for arbitrary
// field elements like Poseidon hashes which may exceed 2^252.
//
template FieldLessThan() {
    signal input in[2];
    signal output out;

    // Decompose both inputs to 254 bits
    // BN254 field modulus p < 2^254, so all field elements fit in 254 bits
    component bits0 = Num2Bits(254);
    component bits1 = Num2Bits(254);
    bits0.in <== in[0];
    bits1.in <== in[1];

    // For each bit position:
    // lt[i] = 1 iff bits0[i] < bits1[i] (i.e., bits0[i]=0 AND bits1[i]=1)
    // eq[i] = 1 iff bits0[i] == bits1[i]
    signal lt[254];
    signal eq[254];

    for (var i = 0; i < 254; i++) {
        // bits0 < bits1 at position i means: bits0=0 AND bits1=1
        lt[i] <== (1 - bits0.out[i]) * bits1.out[i];

        // bits0 == bits1 at position i
        // eq = (1-a)(1-b) + ab = 1 - a - b + 2ab
        eq[i] <== 1 - bits0.out[i] - bits1.out[i] + 2 * bits0.out[i] * bits1.out[i];
    }

    // allEqAbove[i] = 1 iff all bits from MSB (253) down to position i are equal
    // This tracks whether we've found a differing bit yet (scanning from MSB)
    signal allEqAbove[255];
    allEqAbove[254] <== 1;  // No bits above position 253

    for (var i = 253; i >= 0; i--) {
        allEqAbove[i] <== allEqAbove[i + 1] * eq[i];
    }

    // contribution[i] = 1 iff position i is the FIRST differing bit AND in[0] < in[1] there
    // At most one contribution[i] can be 1 (the first difference)
    signal contribution[254];
    for (var i = 0; i < 254; i++) {
        contribution[i] <== allEqAbove[i + 1] * lt[i];
    }

    // Sum all contributions - result is 0 or 1
    // (0 if in[0] >= in[1], 1 if in[0] < in[1])
    // Using linear combination (free in R1CS) instead of intermediate signals
    var total = 0;
    for (var i = 0; i < 254; i++) {
        total += contribution[i];
    }
    out <== total;
}

// =============================================================================
// ORDERING CHECK
// =============================================================================
// Checks: low_value < nullifier < low_next_value (or low_next_value == 0)
//
// This is the core constraint for indexed merkle tree operations:
//   - Non-membership proofs: proves nullifier is NOT in the tree
//   - Insertion proofs: proves correct position in sorted linked list
//
// Edge case: When low_next_value == 0, it represents infinity (last element
// in the sorted list per Aztec's indexed merkle tree spec). Any nullifier
// greater than low_value is valid in this case.
//
// IMPORTANT: Uses FieldLessThan for full BN254 field element support.
// Nullifiers are Poseidon hashes which can be any value in [0, p).
//
template OrderingCheck() {
    signal input low_value;
    signal input nullifier;
    signal input low_next_value;

    // low_value < nullifier (using field-safe comparison)
    component lt1 = FieldLessThan();
    lt1.in[0] <== low_value;
    lt1.in[1] <== nullifier;
    lt1.out === 1;

    // Check if low_next_value == 0 (represents infinity/last element)
    component isNextZero = IsZero();
    isNextZero.in <== low_next_value;

    // Check if nullifier < low_next_value (using field-safe comparison)
    component lt2 = FieldLessThan();
    lt2.in[0] <== nullifier;
    lt2.in[1] <== low_next_value;

    // Valid if: nullifier < low_next_value OR low_next_value == 0
    // OR gate: a OR b = a + b - a*b
    signal validUpperBound <== lt2.out + isNextZero.out - lt2.out * isNextZero.out;
    validUpperBound === 1;
}

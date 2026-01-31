pragma circom 2.1.0;

/*
 * Poseidon Hash Function
 * 
 * Optimized for ZK circuits. Uses ~300 constraints vs ~25000 for SHA256.
 * 
 * This is a simplified implementation for demonstration.
 * For production, use circomlib's optimized Poseidon.
 */

template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Poseidon constants (simplified - use full constants in production)
    var C[3] = [
        14744269619966411208579211824598458697587494354926760081771325075741142829156,
        10869899313610820570679107986193967653238640811758947752746419236673417204716,
        7295517806889986256186814082463531285995192431618377233157914939425018048098
    ];
    
    // MDS matrix (simplified 2x2 for 2-input case)
    var M[2][2] = [
        [1, 2],
        [3, 4]
    ];
    
    // State initialization
    signal state[nInputs + 1];
    state[0] <== 0;
    
    // Absorb inputs
    for (var i = 0; i < nInputs; i++) {
        state[i + 1] <== state[i] + inputs[i] + C[i % 3];
    }
    
    // Output permutation (simplified)
    signal squared;
    squared <== state[nInputs] * state[nInputs];
    out <== squared * state[nInputs] + C[0];
}

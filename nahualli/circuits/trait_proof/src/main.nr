// Nahualli ZK Proof Circuit
// Proves a personality trait meets a threshold without revealing the exact score

// Private inputs (known only to prover)
// - score: the actual trait score (0-100)
// - salt: random value for commitment

// Public inputs/outputs (visible to verifier)
// - threshold: minimum score to prove
// - commitment: returned hash commitment of the score (computed inside circuit)

fn main(
    score: Field,           // Private: actual score
    salt: Field,            // Private: random salt
    threshold: pub Field,   // Public: minimum threshold to prove
) -> pub Field {            // Returns: commitment hash
    // 1. Verify score >= threshold
    let score_u64 = score as u64;
    let threshold_u64 = threshold as u64;
    assert(score_u64 >= threshold_u64, "Score below threshold");
    
    // 2. Verify score is in valid range (0-100)
    assert(score_u64 <= 100, "Score out of range");
    
    // 3. Compute and return commitment (Pedersen hash of score + salt)
    let commitment = std::hash::pedersen_hash([score, salt]);
    commitment
}

#[test]
fn test_valid_proof() {
    // Score of 75, threshold of 70 - should pass
    let score: Field = 75;
    let salt: Field = 12345;
    let threshold: Field = 70;
    
    let commitment = main(score, salt, threshold);
    // Verify commitment is computed correctly
    assert(commitment == std::hash::pedersen_hash([score, salt]));
}

#[test]
fn test_exact_threshold() {
    // Score of 70, threshold of 70 - should pass
    let score: Field = 70;
    let salt: Field = 99999;
    let threshold: Field = 70;
    
    let commitment = main(score, salt, threshold);
    assert(commitment == std::hash::pedersen_hash([score, salt]));
}

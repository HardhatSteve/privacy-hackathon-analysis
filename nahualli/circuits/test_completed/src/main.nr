// Nahualli ZK Proof Circuit - Test Completed
// Proves that a user has completed a psychometric test with valid scores

// Private inputs:
// - scores: array of 5 trait scores (0-100 each)
// - salt: random value for commitment

// Public outputs:
// - commitment: hash of scores + salt (proves ownership without revealing scores)

fn main(
    score1: Field,          // Private: first trait score
    score2: Field,          // Private: second trait score  
    score3: Field,          // Private: third trait score
    score4: Field,          // Private: fourth trait score
    score5: Field,          // Private: fifth trait score
    salt: Field,            // Private: random salt
) -> pub Field {            // Returns: commitment hash
    // 1. Verify all scores are in valid range (0-100)
    let s1 = score1 as u64;
    let s2 = score2 as u64;
    let s3 = score3 as u64;
    let s4 = score4 as u64;
    let s5 = score5 as u64;
    
    assert(s1 <= 100, "Score 1 out of range");
    assert(s2 <= 100, "Score 2 out of range");
    assert(s3 <= 100, "Score 3 out of range");
    assert(s4 <= 100, "Score 4 out of range");
    assert(s5 <= 100, "Score 5 out of range");
    
    // 2. Compute and return commitment (Pedersen hash of all scores + salt)
    let commitment = std::hash::pedersen_hash([score1, score2, score3, score4, score5, salt]);
    commitment
}

#[test]
fn test_valid_completion() {
    let s1: Field = 75;
    let s2: Field = 60;
    let s3: Field = 80;
    let s4: Field = 55;
    let s5: Field = 70;
    let salt: Field = 12345;
    
    let commitment = main(s1, s2, s3, s4, s5, salt);
    assert(commitment == std::hash::pedersen_hash([s1, s2, s3, s4, s5, salt]));
}

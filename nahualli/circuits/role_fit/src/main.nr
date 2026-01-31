// Nahualli ZK Proof Circuit - Role Fit
// Proves that a user's personality profile fits a specific role
// without revealing their actual scores

// Role fit is determined by checking if relevant traits meet minimum thresholds
// Each role has different trait requirements

// Private inputs:
// - scores: trait scores
// - salt: random value for commitment

// Public inputs:
// - role_id: identifier for the role (1-5)
//   1 = Leader (high extraversion + conscientiousness)
//   2 = Researcher (high openness + low extraversion)
//   3 = Mediator (high agreeableness + emotional stability)
//   4 = Creative (high openness + intuition)
//   5 = Analyst (high conscientiousness + thinking)

// Public outputs:
// - commitment: hash proving ownership of scores

fn main(
    openness: Field,           // Private: openness score (0-100)
    conscientiousness: Field,  // Private: conscientiousness score
    extraversion: Field,       // Private: extraversion score
    agreeableness: Field,      // Private: agreeableness score
    neuroticism: Field,        // Private: neuroticism score (lower = more stable)
    salt: Field,               // Private: random salt
    role_id: pub Field,        // Public: which role to check fit for
) -> pub Field {               // Returns: commitment hash
    // Convert to u64 for comparisons
    let o = openness as u64;
    let c = conscientiousness as u64;
    let e = extraversion as u64;
    let a = agreeableness as u64;
    let n = neuroticism as u64;
    let role = role_id as u64;
    
    // Verify all scores are in valid range
    assert(o <= 100, "Openness out of range");
    assert(c <= 100, "Conscientiousness out of range");
    assert(e <= 100, "Extraversion out of range");
    assert(a <= 100, "Agreeableness out of range");
    assert(n <= 100, "Neuroticism out of range");
    assert(role >= 1, "Invalid role");
    assert(role <= 5, "Invalid role");
    
    // Check role-specific requirements (threshold = 60)
    let threshold: u64 = 60;
    let low_threshold: u64 = 40; // For traits that should be LOW
    
    // Role 1: Leader - high extraversion AND high conscientiousness
    if role == 1 {
        assert(e >= threshold, "Not fit for Leader: low extraversion");
        assert(c >= threshold, "Not fit for Leader: low conscientiousness");
    }
    
    // Role 2: Researcher - high openness AND low extraversion (introverted)
    if role == 2 {
        assert(o >= threshold, "Not fit for Researcher: low openness");
        assert(e <= low_threshold, "Not fit for Researcher: too extraverted");
    }
    
    // Role 3: Mediator - high agreeableness AND emotional stability (low neuroticism)
    if role == 3 {
        assert(a >= threshold, "Not fit for Mediator: low agreeableness");
        assert(n <= low_threshold, "Not fit for Mediator: high neuroticism");
    }
    
    // Role 4: Creative - high openness
    if role == 4 {
        assert(o >= threshold, "Not fit for Creative: low openness");
    }
    
    // Role 5: Analyst - high conscientiousness AND low neuroticism
    if role == 5 {
        assert(c >= threshold, "Not fit for Analyst: low conscientiousness");
        assert(n <= low_threshold, "Not fit for Analyst: high neuroticism");
    }
    
    // Compute and return commitment
    let commitment = std::hash::pedersen_hash([openness, conscientiousness, extraversion, agreeableness, neuroticism, salt]);
    commitment
}

#[test]
fn test_leader_fit() {
    let o: Field = 70;
    let c: Field = 75;
    let e: Field = 80;
    let a: Field = 60;
    let n: Field = 30;
    let salt: Field = 12345;
    let role: Field = 1;
    
    let commitment = main(o, c, e, a, n, salt, role);
    assert(commitment == std::hash::pedersen_hash([o, c, e, a, n, salt]));
}

#[test]
fn test_researcher_fit() {
    let o: Field = 85;
    let c: Field = 70;
    let e: Field = 30; // Low extraversion for researcher
    let a: Field = 50;
    let n: Field = 40;
    let salt: Field = 99999;
    let role: Field = 2;
    
    let commitment = main(o, c, e, a, n, salt, role);
    assert(commitment == std::hash::pedersen_hash([o, c, e, a, n, salt]));
}

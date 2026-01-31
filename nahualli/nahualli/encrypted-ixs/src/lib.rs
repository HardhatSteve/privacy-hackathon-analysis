use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    /// Generic psychometric score processor
    /// Accepts up to 8 scores from any test (Big-5, DISC, MBTI dimensions, etc.)
    /// Input: packed scores array
    /// Output: [sum, count] - client calculates avg
    #[instruction]
    pub fn process_scores(
        scores: Enc<Shared, Pack<[u8; 8]>>,
        num_scores: u8,
    ) -> Enc<Shared, Pack<[u8; 2]>> {
        let s = scores.to_arcis().unpack();
        
        // Simple sum of all scores (unused slots should be 0)
        let sum = s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + s[7];
        
        // Pack results: [sum, num_scores]
        let result = Pack::new([sum, num_scores]);
        scores.owner.from_arcis(result)
    }
}

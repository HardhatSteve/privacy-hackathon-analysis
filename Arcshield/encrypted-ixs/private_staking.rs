use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct StakingInput {
        amount: u64,
        action: u8, // 0 = stake, 1 = unstake
        staking_period: u64, // Days
    }

    pub struct StakingOutput {
        amount: u64,
        rewards: u64,
    }

    #[instruction]
    pub fn private_stake(input_ctxt: Enc<Shared, StakingInput>) -> Enc<Shared, StakingOutput> {
        let input = input_ctxt.to_arcis();
        
        // Calculate staking rewards (simplified)
        // In production, this would use time-based APY calculation
        let rewards = if input.action == 0 {
            // Staking: calculate rewards based on period
            // Simple calculation: amount * period * daily_rate
            let daily_rate_bps = 100u64; // 1% daily (example)
            (input.amount * input.staking_period * daily_rate_bps) / 10000
        } else {
            // Unstaking: return original amount
            0u64
        };
        
        let output = StakingOutput {
            amount: input.amount,
            rewards,
        };
        
        input_ctxt.owner.from_arcis(output)
    }
}

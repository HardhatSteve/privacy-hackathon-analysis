use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct SwapInput {
        amount_in: u64,
        min_amount_out: u64, // Minimum amount out (slippage protection)
        token_in: [u8; 32],  // Token mint address
        token_out: [u8; 32], // Token mint address
    }

    #[instruction]
    pub fn private_swap(input_ctxt: Enc<Shared, SwapInput>) -> Enc<Shared, u64> {
        let input = input_ctxt.to_arcis();
        // Calculate swap amount (simplified - in production would use AMM formula)
        // For demo: simple 1:1 swap with fee deduction
        let fee_bps = 30u64; // 0.3% fee
        let fee_amount = (input.amount_in * fee_bps) / 10000;
        let amount_out = input.amount_in - fee_amount;
        
        // Ensure minimum amount out is met
        let final_amount = if amount_out >= input.min_amount_out {
            amount_out
        } else {
            input.min_amount_out // Would revert in production
        };
        
        input_ctxt.owner.from_arcis(final_amount)
    }
}

use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct LendingInput {
        amount: u64,
        action: u8, // 0 = lend, 1 = borrow
        interest_rate: u64, // Basis points (e.g., 500 = 5%)
    }

    pub struct LendingOutput {
        amount: u64,
        interest_accrued: u64,
    }

    #[instruction]
    pub fn private_lend(input_ctxt: Enc<Shared, LendingInput>) -> Enc<Shared, LendingOutput> {
        let input = input_ctxt.to_arcis();
        
        // Calculate interest (simplified calculation)
        // In production, this would use time-based compounding
        let interest_accrued = if input.action == 0 {
            // Lending: earn interest
            (input.amount * input.interest_rate) / 10000
        } else {
            // Borrowing: pay interest
            (input.amount * input.interest_rate) / 10000
        };
        
        let output = LendingOutput {
            amount: input.amount,
            interest_accrued,
        };
        
        input_ctxt.owner.from_arcis(output)
    }
}

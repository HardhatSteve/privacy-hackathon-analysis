use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct PaymentInput {
        amount: u64,
        recipient: [u8; 32], // Public key bytes
        memo: [u8; 64], // Optional memo (encrypted)
    }

    pub struct PaymentOutput {
        amount: u64,
        success: u8, // 1 = success, 0 = failure
    }

    #[instruction]
    pub fn private_payment(input_ctxt: Enc<Shared, PaymentInput>) -> Enc<Shared, PaymentOutput> {
        let input = input_ctxt.to_arcis();
        
        // Validate payment (simplified)
        // In production, would check balances, validate recipient, etc.
        let success = if input.amount > 0 {
            1u8
        } else {
            0u8
        };
        
        let output = PaymentOutput {
            amount: input.amount,
            success,
        };
        
        input_ctxt.owner.from_arcis(output)
    }
}

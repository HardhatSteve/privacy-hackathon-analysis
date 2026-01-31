use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct TransferInput {
        amount: u64,
        recipient: [u8; 32], // Public key bytes
    }

    #[instruction]
    pub fn private_transfer(input_ctxt: Enc<Shared, TransferInput>) -> Enc<Shared, u64> {
        let input = input_ctxt.to_arcis();
        // In a real implementation, this would interact with token accounts
        // For now, we return the amount to be transferred
        input_ctxt.owner.from_arcis(input.amount)
    }
}

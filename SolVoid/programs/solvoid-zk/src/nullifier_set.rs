use anchor_lang::prelude::*;
use anchor_lang::Accounts;

#[account]
#[derive(Default, Debug)]
pub struct NullifierAccount {
    pub nullifier: [u8; 32],
    pub is_used: bool,
    pub bump: u8,
}

impl NullifierAccount {
    pub const SIZE: usize = 8 + 32 + 1 + 1;
}

pub fn mark_nullifier_used_pda(_ctx: Context<MarkNullifier>) -> Result<()> {
    // solana pda init handles the uniqueness for us. 
    // if the seed is there, it exists. easy.
    msg!("Nullifier marked as used locally");
    Ok(())
}

#[derive(Accounts)]
#[instruction(nullifier_hash: [u8; 32])]
pub struct MarkNullifier<'info> {
    #[account(
        init,
        payer = payer,
        space = NullifierAccount::SIZE,
        seeds = [b"nullifier", nullifier_hash.as_ref()],
        bump
    )]
    pub nullifier_account: Account<'info, NullifierAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

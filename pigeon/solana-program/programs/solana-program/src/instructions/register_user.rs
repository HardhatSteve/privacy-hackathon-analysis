use anchor_lang::prelude::*;
use crate::state::UserAccount;
use crate::constants::USER_ACCOUNT_SIZE;

pub fn handler(ctx: Context<RegisterUser>, encryption_key: Pubkey) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.encryption_pubkey = encryption_key;
    Ok(())
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = authority,
        space = USER_ACCOUNT_SIZE,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

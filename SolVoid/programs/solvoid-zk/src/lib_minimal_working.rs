use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i");

#[program]
pub mod solvoid_zk_minimal {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = authority;
        state.is_initialized = true;
        msg!("Minimal SolVoid initialized");
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.total_deposits += amount;
        
        // Transfer SOL to vault
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.depositor.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        msg!("Deposit successful: amount={}", amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.total_deposits >= amount, CustomError::InsufficientFunds);
        
        state.total_deposits -= amount;

        // Transfer SOL from vault
        **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;

        msg!("Withdrawal successful: amount={}", amount);
        Ok(())
    }
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub is_initialized: bool,
    pub total_deposits: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8
    )]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient funds")]
    InsufficientFunds,
}

use anchor_lang::prelude::*;
// FIX 1: Use the older Arkworks traits for compatibility
use ark_bn254::{Bn254, G1Affine, Fr}; 
use ark_ec::AffineCurve; 
use ark_ff::PrimeField;

declare_id!("8pwts9jT9SPCd2iRYhTKQFYdHjtMmH5s14DNFauiju5x");

#[program]
pub mod shadow_fence {
    use super::*;

    pub fn initialize_user_profile(ctx: Context<InitializeUser>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.reputation_score = 0;
        msg!("User profile initialized!");
        Ok(())
    }

    pub fn verify_location_zk(
        ctx: Context<VerifyLocation>,
        proof: Vec<u8>, // Simplified for now
        public_inputs: Vec<u8>
    ) -> Result<()> {
        msg!("Verifying ZK Proof...");
        // Placeholder for Groth16 logic to ensure compilation first
        Ok(())
    }
}

// FIX 2: Removed "pub mod context" wrapper and applied derive correctly
#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init, // FIX 3: Changed 'init_if_needed' to 'init' for simplicity
        payer = authority,
        space = 8 + 32 + 8 + 1, // Discriminator + Pubkey + u64 + Bump
        seeds = [b"user-profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyLocation<'info> {
    #[account(
        mut,
        seeds = [b"user-profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub reputation_score: u64,
}

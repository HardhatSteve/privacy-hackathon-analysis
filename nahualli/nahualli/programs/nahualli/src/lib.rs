use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

const COMP_DEF_OFFSET_PROCESS_SCORES: u32 = comp_def_offset("process_scores");

declare_id!("6idYUYvub9XZLFTchE711q18EE3AtejQR3qkX3SrwGFx");

#[arcium_program]
pub mod nahualli {
    use super::*;

    /// Initialize the computation definition for generic score processing
    pub fn init_process_scores_comp_def(ctx: Context<InitProcessScoresCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    /// Submit psychometric scores for confidential processing
    /// Generic: works with Big-5, DISC, MBTI dimensions, or any test with up to 8 scores
    pub fn process_scores(
        ctx: Context<ProcessScores>,
        computation_offset: u64,
        // Encrypted packed scores (Pack<[u8; 8]>)
        encrypted_scores: [u8; 32],
        // Number of valid scores (1-8)
        num_scores: u8,
        pubkey: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        require!(num_scores >= 1 && num_scores <= 8, ErrorCode::InvalidScoreCount);
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        
        // ArgBuilder for process_scores(Enc<Shared, Pack<[u8; 8]>>, u8)
        let args = ArgBuilder::new()
            .x25519_pubkey(pubkey)
            .plaintext_u128(nonce)
            .encrypted_u8(encrypted_scores)
            .plaintext_u8(num_scores)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ProcessScoresCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[]
            )?],
            1,
            0,
        )?;
        Ok(())
    }

    /// Callback when score processing is complete
    #[arcium_callback(encrypted_ix = "process_scores")]
    pub fn process_scores_callback(
        ctx: Context<ProcessScoresCallback>,
        output: SignedComputationOutputs<ProcessScoresOutput>,
    ) -> Result<()> {
        let o = match output.verify_output(&ctx.accounts.cluster_account, &ctx.accounts.computation_account) {
            Ok(ProcessScoresOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        // Emit event with encrypted results [avg, min, max, count]
        emit!(ScoresProcessedEvent {
            encrypted_result: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
            owner: ctx.accounts.result_account.owner,
        });
        
        // Store the encrypted result
        ctx.accounts.result_account.encrypted_result = o.ciphertexts[0];
        ctx.accounts.result_account.nonce = o.nonce.to_le_bytes();
        ctx.accounts.result_account.processed_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

#[queue_computation_accounts("process_scores", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ProcessScores<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_PROCESS_SCORES)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("process_scores")]
#[derive(Accounts)]
pub struct ProcessScoresCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_PROCESS_SCORES)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"result", payer.key().as_ref()],
        bump,
    )]
    pub result_account: Account<'info, ScoreResult>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[init_computation_definition_accounts("process_scores", payer)]
#[derive(Accounts)]
pub struct InitProcessScoresCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Account to store encrypted score results
#[account]
pub struct ScoreResult {
    pub owner: Pubkey,
    pub encrypted_result: [u8; 32],  // [avg, min, max, count] packed
    pub nonce: [u8; 16],
    pub processed_at: i64,
    pub bump: u8,
}

impl ScoreResult {
    pub const SIZE: usize = 8 + 32 + 32 + 16 + 8 + 1;
}

#[event]
pub struct ScoresProcessedEvent {
    pub encrypted_result: [u8; 32],
    pub nonce: [u8; 16],
    pub owner: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
    #[msg("Invalid score count (must be 1-16)")]
    InvalidScoreCount,
}

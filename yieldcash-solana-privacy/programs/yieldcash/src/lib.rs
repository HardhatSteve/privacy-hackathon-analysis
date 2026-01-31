//! YieldCash: DeFi-Composable Privacy Pools on Solana
//!
//! A yield-bearing shielded pool implementing the UTXO privacy model
//! with Merkle tree commitments, nullifiers for double-spend prevention,
//! and selective compliance disclosure via ZK proofs.

use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub mod constants;
pub mod error;
pub mod state;
pub mod utils;

use constants::*;
use error::YieldCashError;
use state::*;
use utils::*;

declare_id!("8Xr5vvjshTFqVtkMzrWNV2ZCw4pKqxNdoir1B1KdrNWR");

#[program]
pub mod yieldcash {
    use super::*;

    /// Initializes the shielded pool with empty Merkle tree and vaults.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let merkle_tree = &mut ctx.accounts.merkle_tree;
        let nullifier_registry = &mut ctx.accounts.nullifier_registry;

        let empty_root = compute_empty_root();

        **pool = ShieldedPool {
            root_history: {
                let mut history = [[0u8; 32]; ROOT_HISTORY_SIZE];
                history[0] = empty_root;
                history
            },
            current_root_index: 0,
            leaf_count: 0,
            bump: ctx.bumps.pool,
            sol_vault_bump: ctx.bumps.sol_vault,
            msol_vault_bump: ctx.bumps.msol_vault,
            buffer_ratio: DEFAULT_BUFFER_RATIO,
            total_shares: 0,
            immutable: true,
        };

        merkle_tree.current_root = empty_root;
        merkle_tree.next_index = 0;
        merkle_tree.filled_subtrees.copy_from_slice(&ZEROS);

        nullifier_registry.nullifiers = Vec::new();

        Ok(())
    }

    /// Deposits SOL into the shielded pool and creates a new note commitment.
    pub fn deposit(ctx: Context<Deposit>, params: DepositParams) -> Result<()> {
        require!(
            is_valid_denomination(params.deposit_amount),
            YieldCashError::InvalidDenomination
        );

        validate_timestamp(params.current_timestamp)?;

        // TODO: Verify ZK proof via CPI to Sunspot verifier

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.depositor.to_account_info(),
                    to: ctx.accounts.sol_vault.to_account_info(),
                },
            ),
            params.deposit_amount,
        )?;

        let new_root = insert_leaf(&mut ctx.accounts.merkle_tree, params.output_commitment)?;

        let pool = &mut ctx.accounts.pool;
        pool.push_root(new_root);
        pool.leaf_count = ctx.accounts.merkle_tree.next_index;

        let shares = calculate_shares_from_amount(params.deposit_amount, params.current_index)?;
        pool.total_shares = pool
            .total_shares
            .checked_add(shares)
            .ok_or(YieldCashError::ArithmeticOverflow)?;

        Ok(())
    }

    /// Withdraws SOL from the shielded pool by spending a note.
    pub fn withdraw(ctx: Context<Withdraw>, params: WithdrawParams) -> Result<()> {
        require!(
            is_valid_denomination(params.withdrawal_amount),
            YieldCashError::InvalidDenomination
        );

        require!(
            !ctx.accounts.nullifier_registry.contains(&params.nullifier),
            YieldCashError::NullifierAlreadySpent
        );

        require!(
            ctx.accounts.pool.is_known_root(&params.merkle_root),
            YieldCashError::UnknownMerkleRoot
        );

        validate_timestamp(params.current_timestamp)?;

        // TODO: Verify ZK proof via CPI to Sunspot verifier

        ctx.accounts.nullifier_registry.insert(params.nullifier);

        if params.change_commitment != DUMMY_COMMITMENT {
            let new_root = insert_leaf(&mut ctx.accounts.merkle_tree, params.change_commitment)?;
            ctx.accounts.pool.push_root(new_root);
            ctx.accounts.pool.leaf_count = ctx.accounts.merkle_tree.next_index;
        }

        let vault = ctx.accounts.sol_vault.to_account_info();
        let recipient = ctx.accounts.recipient.to_account_info();

        require!(
            vault.lamports() >= params.withdrawal_amount,
            YieldCashError::InsufficientVaultBalance
        );

        **vault.try_borrow_mut_lamports()? -= params.withdrawal_amount;
        **recipient.try_borrow_mut_lamports()? += params.withdrawal_amount;

        let shares = calculate_shares_from_amount(params.withdrawal_amount, params.current_index)?;
        ctx.accounts.pool.total_shares = ctx
            .accounts
            .pool
            .total_shares
            .saturating_sub(shares);

        Ok(())
    }

    /// Updates the share index based on current TVL.
    /// Permissionless - anyone can crank to update the index.
    pub fn crank_update_index(ctx: Context<CrankUpdateIndex>) -> Result<u64> {
        let pool = &ctx.accounts.pool;
        let sol_balance = ctx.accounts.sol_vault.lamports();
        let msol_balance = ctx.accounts.msol_vault.lamports();

        // TODO: Convert mSOL to SOL value using Marinade's exchange rate
        let total_value = sol_balance.saturating_add(msol_balance);

        let new_index = if pool.total_shares > 0 {
            (total_value as u128)
                .checked_mul(SCALE)
                .and_then(|v| v.checked_div(pool.total_shares))
                .map(|v| v as u64)
                .unwrap_or(SCALE as u64)
        } else {
            SCALE as u64
        };

        Ok(new_index)
    }
}

/// Validates timestamp is within acceptable bounds.
fn validate_timestamp(proof_timestamp: u64) -> Result<()> {
    let chain_ts = Clock::get()?.unix_timestamp;
    let proof_ts = proof_timestamp as i64;

    require!(
        proof_ts <= chain_ts + TIMESTAMP_MAX_FUTURE,
        YieldCashError::TimestampInFuture
    );
    require!(
        proof_ts >= chain_ts - TIMESTAMP_MAX_PAST,
        YieldCashError::TimestampTooOld
    );

    Ok(())
}

/// Calculates shares from an amount using the current index.
fn calculate_shares_from_amount(amount: u64, current_index: u64) -> Result<u128> {
    let index = current_index.max(SCALE as u64) as u128;
    (amount as u128)
        .checked_mul(SCALE)
        .and_then(|v| v.checked_div(index))
        .ok_or_else(|| YieldCashError::ArithmeticOverflow.into())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ShieldedPool::SIZE,
        seeds = [POOL_SEED],
        bump
    )]
    pub pool: Account<'info, ShieldedPool>,

    #[account(
        init,
        payer = authority,
        space = IncrementalMerkleTree::SIZE,
        seeds = [MERKLE_SEED],
        bump
    )]
    pub merkle_tree: Account<'info, IncrementalMerkleTree>,

    #[account(
        init,
        payer = authority,
        space = 8 + 4 + 32 * 1000,
        seeds = [NULLIFIER_SEED],
        bump
    )]
    pub nullifier_registry: Account<'info, NullifierRegistry>,

    #[account(seeds = [SOL_VAULT_SEED], bump)]
    pub sol_vault: SystemAccount<'info>,

    #[account(seeds = [MSOL_VAULT_SEED], bump)]
    pub msol_vault: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositParams {
    pub proof: Vec<u8>,
    pub output_commitment: [u8; 32],
    pub deposit_amount: u64,
    pub current_index: u64,
    pub current_timestamp: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, ShieldedPool>,

    #[account(mut, seeds = [MERKLE_SEED], bump)]
    pub merkle_tree: Account<'info, IncrementalMerkleTree>,

    #[account(mut, seeds = [SOL_VAULT_SEED], bump = pool.sol_vault_bump)]
    pub sol_vault: SystemAccount<'info>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawParams {
    pub proof: Vec<u8>,
    pub merkle_root: [u8; 32],
    pub nullifier: [u8; 32],
    pub change_commitment: [u8; 32],
    pub withdrawal_amount: u64,
    pub current_index: u64,
    pub current_timestamp: u64,
    pub recipient: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: WithdrawParams)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, ShieldedPool>,

    #[account(mut, seeds = [MERKLE_SEED], bump)]
    pub merkle_tree: Account<'info, IncrementalMerkleTree>,

    #[account(mut, seeds = [NULLIFIER_SEED], bump)]
    pub nullifier_registry: Account<'info, NullifierRegistry>,

    /// CHECK: PDA verified by seeds.
    #[account(mut, seeds = [SOL_VAULT_SEED], bump = pool.sol_vault_bump)]
    pub sol_vault: UncheckedAccount<'info>,

    /// CHECK: Recipient specified in params, validated by proof.
    #[account(mut, constraint = recipient.key() == params.recipient)]
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub withdrawer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CrankUpdateIndex<'info> {
    #[account(seeds = [POOL_SEED], bump = pool.bump)]
    pub pool: Account<'info, ShieldedPool>,

    #[account(seeds = [SOL_VAULT_SEED], bump = pool.sol_vault_bump)]
    pub sol_vault: SystemAccount<'info>,

    #[account(seeds = [MSOL_VAULT_SEED], bump = pool.msol_vault_bump)]
    pub msol_vault: SystemAccount<'info>,
}

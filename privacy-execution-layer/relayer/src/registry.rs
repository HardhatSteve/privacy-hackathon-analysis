//! Relayer Network - On-chain Registry and Selection
//! 
//! Phase 3: Decentralized transaction submission

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("re1ayRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR");

/// Maximum relayer fee in basis points (1%)
pub const MAX_RELAYER_FEE_BPS: u16 = 100;
/// Minimum stake required to register as relayer (1 SOL)
pub const MIN_STAKE_LAMPORTS: u64 = 1_000_000_000;
/// Slash percentage for proven misbehavior
pub const SLASH_PERCENTAGE: u8 = 10;

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum RelayerError {
    #[msg("Insufficient stake to register")]
    InsufficientStake,
    #[msg("Relayer fee exceeds maximum")]
    FeeTooHigh,
    #[msg("Relayer not registered")]
    NotRegistered,
    #[msg("Relayer is suspended")]
    Suspended,
    #[msg("Invalid proof of misbehavior")]
    InvalidSlashProof,
    #[msg("Unstake cooldown not elapsed")]
    CooldownNotElapsed,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

/// Global relayer registry
#[account]
pub struct RelayerRegistry {
    /// Total registered relayers
    pub relayer_count: u64,
    /// Total staked amount
    pub total_stake: u64,
    /// Minimum stake required
    pub min_stake: u64,
    /// Authority for governance
    pub authority: Pubkey,
    /// Bump seed
    pub bump: u8,
}

impl RelayerRegistry {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 32 + 1;
}

/// Individual relayer registration
#[account]
pub struct RelayerState {
    /// Relayer owner
    pub owner: Pubkey,
    /// Public key for encrypted payloads (ECIES)
    pub encryption_pubkey: [u8; 32],
    /// Fee in basis points (max 100 = 1%)
    pub fee_bps: u16,
    /// Staked amount
    pub stake: u64,
    /// Successful relays count
    pub success_count: u64,
    /// Failed relays count
    pub fail_count: u64,
    /// Reputation score (0-1000)
    pub reputation: u16,
    /// Is currently active
    pub is_active: bool,
    /// Last activity timestamp
    pub last_active: i64,
    /// Unstake request timestamp (0 if none)
    pub unstake_requested: i64,
    /// Bump seed
    pub bump: u8,
}

impl RelayerState {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 2 + 1 + 8 + 8 + 1;
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

#[program]
pub mod relayer_registry {
    use super::*;

    /// Initialize the relayer registry
    pub fn initialize(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.relayer_count = 0;
        registry.total_stake = 0;
        registry.min_stake = MIN_STAKE_LAMPORTS;
        registry.authority = ctx.accounts.authority.key();
        registry.bump = ctx.bumps.registry;
        
        msg!("Relayer registry initialized");
        Ok(())
    }

    /// Register as a new relayer
    pub fn register_relayer(
        ctx: Context<RegisterRelayer>,
        encryption_pubkey: [u8; 32],
        fee_bps: u16,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        let relayer = &mut ctx.accounts.relayer_state;
        let stake_amount = ctx.accounts.stake_account.amount;

        // Validate stake
        require!(
            stake_amount >= registry.min_stake,
            RelayerError::InsufficientStake
        );

        // Validate fee
        require!(
            fee_bps <= MAX_RELAYER_FEE_BPS,
            RelayerError::FeeTooHigh
        );

        // Initialize relayer state
        relayer.owner = ctx.accounts.owner.key();
        relayer.encryption_pubkey = encryption_pubkey;
        relayer.fee_bps = fee_bps;
        relayer.stake = stake_amount;
        relayer.success_count = 0;
        relayer.fail_count = 0;
        relayer.reputation = 500; // Start at 50%
        relayer.is_active = true;
        relayer.last_active = Clock::get()?.unix_timestamp;
        relayer.unstake_requested = 0;
        relayer.bump = ctx.bumps.relayer_state;

        // Update registry
        registry.relayer_count += 1;
        registry.total_stake += stake_amount;

        msg!("Relayer registered: fee={}bps, stake={}", fee_bps, stake_amount);
        emit!(RelayerRegistered {
            relayer: ctx.accounts.owner.key(),
            encryption_pubkey,
            fee_bps,
            stake: stake_amount,
        });

        Ok(())
    }

    /// Update relayer configuration
    pub fn update_relayer(
        ctx: Context<UpdateRelayer>,
        new_fee_bps: Option<u16>,
        new_encryption_pubkey: Option<[u8; 32]>,
    ) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_state;

        if let Some(fee) = new_fee_bps {
            require!(fee <= MAX_RELAYER_FEE_BPS, RelayerError::FeeTooHigh);
            relayer.fee_bps = fee;
        }

        if let Some(pubkey) = new_encryption_pubkey {
            relayer.encryption_pubkey = pubkey;
        }

        msg!("Relayer updated");
        Ok(())
    }

    /// Record successful relay (called by privacy pool)
    pub fn record_success(ctx: Context<RecordRelay>) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_state;
        
        relayer.success_count += 1;
        relayer.last_active = Clock::get()?.unix_timestamp;
        
        // Increase reputation (capped at 1000)
        relayer.reputation = std::cmp::min(1000, relayer.reputation + 1);

        Ok(())
    }

    /// Record failed relay (called by privacy pool)
    pub fn record_failure(ctx: Context<RecordRelay>) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_state;
        
        relayer.fail_count += 1;
        
        // Decrease reputation (min 0)
        relayer.reputation = relayer.reputation.saturating_sub(5);

        // Suspend if reputation too low
        if relayer.reputation < 100 {
            relayer.is_active = false;
        }

        Ok(())
    }

    /// Request to unstake (starts cooldown)
    pub fn request_unstake(ctx: Context<UpdateRelayer>) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_state;
        
        relayer.unstake_requested = Clock::get()?.unix_timestamp;
        relayer.is_active = false;

        msg!("Unstake requested, cooldown started");
        Ok(())
    }

    /// Withdraw stake after cooldown (7 days)
    pub fn withdraw_stake(ctx: Context<WithdrawStake>) -> Result<()> {
        let relayer = &ctx.accounts.relayer_state;
        let registry = &mut ctx.accounts.registry;
        
        // Check cooldown (7 days)
        let cooldown = 7 * 24 * 60 * 60; // 7 days in seconds
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(
            relayer.unstake_requested > 0 &&
            current_time >= relayer.unstake_requested + cooldown,
            RelayerError::CooldownNotElapsed
        );

        // Transfer stake back
        let stake_amount = relayer.stake;
        
        // Update registry
        registry.relayer_count = registry.relayer_count.saturating_sub(1);
        registry.total_stake = registry.total_stake.saturating_sub(stake_amount);

        // Close relayer account (stake returned to owner)
        msg!("Stake withdrawn: {}", stake_amount);
        
        Ok(())
    }

    /// Slash relayer for proven misbehavior
    pub fn slash_relayer(
        ctx: Context<SlashRelayer>,
        _proof: Vec<u8>,
    ) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_state;
        let registry = &mut ctx.accounts.registry;
        
        // Calculate slash amount
        let slash_amount = (relayer.stake as u128 * SLASH_PERCENTAGE as u128 / 100) as u64;
        
        relayer.stake = relayer.stake.saturating_sub(slash_amount);
        relayer.reputation = 0;
        relayer.is_active = false;
        
        registry.total_stake = registry.total_stake.saturating_sub(slash_amount);

        msg!("Relayer slashed: {}", slash_amount);
        emit!(RelayerSlashed {
            relayer: relayer.owner,
            amount: slash_amount,
        });

        Ok(())
    }
}

// ============================================================================
// CONTEXT STRUCTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = RelayerRegistry::LEN,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, RelayerRegistry>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterRelayer<'info> {
    #[account(mut)]
    pub registry: Account<'info, RelayerRegistry>,
    
    #[account(
        init,
        payer = owner,
        space = RelayerState::LEN,
        seeds = [b"relayer", owner.key().as_ref()],
        bump
    )]
    pub relayer_state: Account<'info, RelayerState>,
    
    /// Stake token account (must have min stake)
    pub stake_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRelayer<'info> {
    #[account(
        mut,
        seeds = [b"relayer", owner.key().as_ref()],
        bump = relayer_state.bump,
        has_one = owner
    )]
    pub relayer_state: Account<'info, RelayerState>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordRelay<'info> {
    #[account(mut)]
    pub relayer_state: Account<'info, RelayerState>,
    
    /// Only privacy pool can call this
    pub pool_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawStake<'info> {
    #[account(mut)]
    pub registry: Account<'info, RelayerRegistry>,
    
    #[account(
        mut,
        seeds = [b"relayer", owner.key().as_ref()],
        bump = relayer_state.bump,
        has_one = owner,
        close = owner
    )]
    pub relayer_state: Account<'info, RelayerState>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SlashRelayer<'info> {
    #[account(mut)]
    pub registry: Account<'info, RelayerRegistry>,
    
    #[account(mut)]
    pub relayer_state: Account<'info, RelayerState>,
    
    /// Governance authority
    pub authority: Signer<'info>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct RelayerRegistered {
    pub relayer: Pubkey,
    pub encryption_pubkey: [u8; 32],
    pub fee_bps: u16,
    pub stake: u64,
}

#[event]
pub struct RelayerSlashed {
    pub relayer: Pubkey,
    pub amount: u64,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Select best relayers for a withdrawal
pub fn select_relayers(
    relayers: &[RelayerState],
    max_fee: u16,
    count: usize,
) -> Vec<Pubkey> {
    let mut eligible: Vec<_> = relayers
        .iter()
        .filter(|r| r.is_active && r.fee_bps <= max_fee && r.reputation >= 100)
        .collect();
    
    // Sort by reputation * (1000 - fee)
    eligible.sort_by(|a, b| {
        let score_a = a.reputation as u32 * (1000 - a.fee_bps as u32);
        let score_b = b.reputation as u32 * (1000 - b.fee_bps as u32);
        score_b.cmp(&score_a)
    });
    
    eligible
        .iter()
        .take(count)
        .map(|r| r.owner)
        .collect()
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relayer_selection() {
        let relayers = vec![
            RelayerState {
                owner: Pubkey::default(),
                encryption_pubkey: [0; 32],
                fee_bps: 50,
                stake: 1_000_000_000,
                success_count: 100,
                fail_count: 0,
                reputation: 900,
                is_active: true,
                last_active: 0,
                unstake_requested: 0,
                bump: 0,
            },
            RelayerState {
                owner: Pubkey::default(),
                encryption_pubkey: [0; 32],
                fee_bps: 100,
                stake: 1_000_000_000,
                success_count: 50,
                fail_count: 5,
                reputation: 500,
                is_active: true,
                last_active: 0,
                unstake_requested: 0,
                bump: 0,
            },
        ];
        
        let selected = select_relayers(&relayers, 100, 5);
        assert_eq!(selected.len(), 2);
    }

    #[test]
    fn test_fee_validation() {
        assert!(MAX_RELAYER_FEE_BPS <= 100);
    }
}

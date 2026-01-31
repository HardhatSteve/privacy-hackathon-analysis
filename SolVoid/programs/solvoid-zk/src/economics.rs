use crate::AdminControlWithEconomics;
use crate::PrivacyError;
use anchor_lang::prelude::*;

// Simplified economics for BPF compatibility
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CircuitBreakerTrigger {
    ManualActivation,
    VaultReserveBreach,
    HourlyLimitExceeded,
    RapidWithdrawalPattern,
    StateInconsistency,
    CrossLayerFailure,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CircuitBreakerResult {
    pub allowed: bool,
    pub reason: CircuitBreakerTrigger,
    pub message: String,
}

// Simplified circuit breaker for BPF constraints
#[account]
pub struct EconomicState {
    pub authority: Pubkey,
    pub total_volume: u64,
    pub total_fees_collected: u64,
    pub emergency_multiplier: u64,
    pub is_emergency_active: bool,
    pub emergency_start_time: i64,
    pub emergency_duration: i64,
    pub circuit_breaker_active: bool,
    pub circuit_breaker_threshold: u64,
    pub hourly_limit: u64,
    pub minimum_reserve: u64,
    pub last_withdrawal_time: i64,
    pub hourly_withdrawal_total: u64,
}

impl EconomicState {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 8 + 1 + 8 + 8 + 1 + 8 + 8 + 8 + 8 + 8 + 8;
}

pub fn new() -> EconomicState {
    let current_time = Clock::get().unwrap().unix_timestamp;
    EconomicState {
        authority: Pubkey::default(),
        total_volume: 0,
        total_fees_collected: 0,
        emergency_multiplier: 1,
        is_emergency_active: false,
        emergency_start_time: 0,
        emergency_duration: 3600,
        circuit_breaker_active: false,
        circuit_breaker_threshold: 500_000_000, // 0.5 SOL
        hourly_limit: 5_000_000_000, // 5 SOL per hour
        minimum_reserve: 100_000_000, // 0.1 SOL
        last_withdrawal_time: current_time,
        hourly_withdrawal_total: 0,
    }
}

// Simplified fee calculation for BPF compatibility
pub fn calculate_protocol_fee_atomic(
    amount: u64,
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<u64> {
    // Reset hourly total if more than 1 hour has passed
    if current_time - economic_state.last_withdrawal_time > 3600 {
        economic_state.hourly_withdrawal_total = 0;
        economic_state.last_withdrawal_time = current_time;
    }
    
    // Check if we need to activate circuit breaker
    if economic_state.hourly_withdrawal_total + amount > economic_state.hourly_limit {
        economic_state.circuit_breaker_active = true;
        return Err(PrivacyError::RateLimitExceeded.into());
    }
    
    // Update hourly total
    economic_state.hourly_withdrawal_total += amount;
    
    // Calculate fee (0.1% base rate, multiplied by emergency multiplier)
    let base_fee = amount / 1000; // 0.1%
    let protocol_fee = base_fee * economic_state.emergency_multiplier;
    
    // Update totals
    economic_state.total_volume += amount;
    economic_state.total_fees_collected += protocol_fee;
    
    Ok(protocol_fee)
}

// Simplified circuit breaker check
pub fn check_withdrawal_limits(
    amount: u64,
    vault_balance: u64,
    economic_state: &EconomicState,
) -> Result<CircuitBreakerResult> {
    // Check minimum reserve
    if vault_balance.saturating_sub(amount) < economic_state.minimum_reserve {
        return Ok(CircuitBreakerResult {
            allowed: false,
            reason: CircuitBreakerTrigger::VaultReserveBreach,
            message: "Insufficient vault reserves".to_string(),
        });
    }
    
    // Check circuit breaker threshold
    if amount > economic_state.circuit_breaker_threshold {
        return Ok(CircuitBreakerResult {
            allowed: false,
            reason: CircuitBreakerTrigger::HourlyLimitExceeded,
            message: "Amount exceeds circuit breaker threshold".to_string(),
        });
    }
    
    // Check if circuit breaker is active
    if economic_state.circuit_breaker_active {
        return Ok(CircuitBreakerResult {
            allowed: false,
            reason: CircuitBreakerTrigger::ManualActivation,
            message: "Circuit breaker is active".to_string(),
        });
    }
    
    Ok(CircuitBreakerResult {
        allowed: true,
        reason: CircuitBreakerTrigger::ManualActivation,
        message: "Withdrawal allowed".to_string(),
    })
}

// Admin emergency controls
pub fn trigger_emergency_mode(
    ctx: Context<AdminControlWithEconomics>,
    multiplier: u64,
    _reason: String,
) -> Result<()> {
    let economic_state = &mut ctx.accounts.economic_state;
    require!(multiplier >= 1 && multiplier <= 10, PrivacyError::InvalidMultiplier);
    
    economic_state.emergency_multiplier = multiplier;
    economic_state.is_emergency_active = true;
    economic_state.emergency_start_time = Clock::get()?.unix_timestamp;
    
    msg!("Emergency mode activated: multiplier={}x", multiplier);
    Ok(())
}

pub fn disable_emergency_mode(ctx: Context<AdminControlWithEconomics>) -> Result<()> {
    let economic_state = &mut ctx.accounts.economic_state;
    economic_state.is_emergency_active = false;
    economic_state.emergency_multiplier = 1;
    
    msg!("Emergency mode disabled");
    Ok(())
}

pub fn trigger_circuit_breaker(ctx: Context<AdminControlWithEconomics>) -> Result<()> {
    let economic_state = &mut ctx.accounts.economic_state;
    economic_state.circuit_breaker_active = true;
    
    msg!("Circuit breaker triggered");
    Ok(())
}

pub fn reset_circuit_breaker(ctx: Context<AdminControlWithEconomics>) -> Result<()> {
    let economic_state = &mut ctx.accounts.economic_state;
    economic_state.circuit_breaker_active = false;
    economic_state.hourly_withdrawal_total = 0;
    economic_state.last_withdrawal_time = Clock::get()?.unix_timestamp;
    
    msg!("Circuit breaker reset");
    Ok(())
}

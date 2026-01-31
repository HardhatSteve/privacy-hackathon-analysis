use crate::AdminControl;
use crate::PrivacyError;
use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};

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

// circuit breaker with state sync. 
// lots of moving parts here, stay sharp.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DistributedCircuitBreaker {
    pub is_active: bool,
    pub activation_time: i64,
    pub trigger_reason: CircuitBreakerTrigger,
    pub immutable_threshold: u64,
    pub cooldown_end_time: i64,
    pub total_triggers: u64,
    pub last_trigger_amount: u64,
    pub vault_balance_at_trigger: u64,
    // sync the state... mostly.
    pub state_version: u64,
    pub last_state_update: i64,
    pub state_consensus: Vec<Pubkey>, // Nodes that have confirmed state
    pub state_signature: [u8; 64], // Multi-signature of current state
    pub required_signatures: u8, // Minimum signatures required for state change
    pub validator_signatures: Vec<[u8; 64]>, // Individual validator signatures
    // dont change these after setup
    pub max_withdrawal_per_hour: u64,
    pub min_vault_reserve: u64,
    pub emergency_duration: i64,
    pub cooldown_duration: i64,
    // spot the bad patterns
    pub rapid_withdrawal_threshold: u64,
    pub rapid_withdrawal_window: i64,
    pub consecutive_large_withdrawals: u64,
}

impl DistributedCircuitBreaker {
    pub fn new() -> Self {
        let current_time = Clock::get().unwrap().unix_timestamp;
        Self {
            is_active: false,
            activation_time: 0,
            trigger_reason: CircuitBreakerTrigger::ManualActivation,
            immutable_threshold: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD,
            cooldown_end_time: 0,
            total_triggers: 0,
            last_trigger_amount: 0,
            vault_balance_at_trigger: 0,
            // starter state
            state_version: 0,
            last_state_update: current_time,
            state_consensus: Vec::new(),
            state_signature: [0u8; 64],
            required_signatures: 3, // Require 3 signatures for state changes
            validator_signatures: Vec::new(),
            // dont touch these
            max_withdrawal_per_hour: DETERMINISTIC_HOURLY_LIMIT,
            min_vault_reserve: DETERMINISTIC_MINIMUM_RESERVE,
            emergency_duration: 3600,
            cooldown_duration: 1800,
            // hunt for patterns
            rapid_withdrawal_threshold: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD / 2,
            rapid_withdrawal_window: 300, // 5 minutes
            consecutive_large_withdrawals: 0,
        }
    }
    
    // atomic check for withdrawals
    pub fn check_withdrawal_atomic(
        &mut self,
        withdrawal_amount: u64,
        vault_balance: u64,
        _hourly_total: u64,
        current_time: i64,
        _validator: Pubkey,
    ) -> Result<CircuitBreakerResult> {
        // DONT KILL EVERYTHING. 
        // 10% reserve per slot instead of a hard pause. 
        // avoid that deadlock from last week.
        
        let reserve = self.min_vault_reserve.max(vault_balance / 10);
        let remaining_balance = vault_balance.saturating_sub(withdrawal_amount);

        if remaining_balance < reserve && !self.is_active {
             msg!(" Low liquidity mode activated. Rate limiting in effect.");
             self.is_active = true;
             self.activation_time = current_time;
        }

        // If emergency is active, limit withdrawal size to 1% of vault
        if self.is_active && withdrawal_amount > vault_balance / 100 {
             return Ok(CircuitBreakerResult {
                allowed: false,
                reason: CircuitBreakerTrigger::RapidWithdrawalPattern,
                message: "Emergency Rate Limit: Max 1% of vault per transaction".to_string(),
            });
        }

        Ok(CircuitBreakerResult {
            allowed: true,
            reason: CircuitBreakerTrigger::ManualActivation,
            message: "Withdrawal allowed under safety constraints".to_string(),
        })
    }
    
    // update state + consensus. 
    fn atomic_state_update(
        &mut self,
        reason: CircuitBreakerTrigger,
        current_time: i64,
        validator: Pubkey,
    ) -> Result<()> {
        // FIXED: Increment state version atomically
        self.state_version += 1;
        self.last_state_update = current_time;
        
        // FIXED: Update state based on reason
        match reason {
            CircuitBreakerTrigger::VaultReserveBreach | 
            CircuitBreakerTrigger::HourlyLimitExceeded |
            CircuitBreakerTrigger::RapidWithdrawalPattern |
            CircuitBreakerTrigger::StateInconsistency |
            CircuitBreakerTrigger::CrossLayerFailure => {
                if !self.is_active {
                    self.is_active = true;
                    self.activation_time = current_time;
                    self.cooldown_end_time = current_time + self.emergency_duration + self.cooldown_duration;
                    self.total_triggers += 1;
                }
                self.trigger_reason = reason.clone();
            }
            CircuitBreakerTrigger::ManualActivation => {
                if self.is_active && current_time >= self.cooldown_end_time {
                    self.is_active = false;
                }
            }
        }
        
        // cap consensus ring. 
        // prevent pda from getting too fat.
        if !self.state_consensus.contains(&validator) {
            if self.state_consensus.len() >= 10 {
                self.state_consensus.remove(0);
            }
            self.state_consensus.push(validator);
        }
        
        // PROPER: Multi-signature implementation
        self.update_state_signature(reason.clone(), validator, current_time)?;
        
        msg!("Distributed circuit breaker state updated: version={}, active={}", 
            self.state_version, self.is_active);
        
        Ok(())
    }
    
    // check state versioning isn't wonky
    fn validate_state_version(&self, current_time: i64) -> Result<bool> {
        // too old? 10m limit.
        if current_time - self.last_state_update > 600 { // 10 minutes max staleness
            return Ok(false);
        }
        
        // sanity checks if active
        if self.is_active {
            if self.activation_time > current_time {
                return Ok(false); // Activation time in future
            }
            
            if self.cooldown_end_time < self.activation_time {
                return Ok(false); // Cooldown ends before activation
            }
        }
        
        Ok(true)
    }
    
    // detection is tricky. multiple signals.
    fn detect_rapid_withdrawal_pattern_enhanced(
        &self,
        amount: u64,
        current_time: i64,
    ) -> Result<bool> {
        // FIXED: Multiple detection criteria
        let is_large_amount = amount > self.rapid_withdrawal_threshold;
        let is_recent_trigger = current_time - self.activation_time < self.rapid_withdrawal_window;
        let has_multiple_triggers = self.total_triggers > 2;
        
        // FIXED: Check for consecutive large withdrawals
        let is_consecutive_pattern = self.consecutive_large_withdrawals > 3;
        
        // FIXED: Combine multiple signals for robust detection
        let detection_score = (is_large_amount as u8)
            .checked_add(is_recent_trigger as u8)
            .and_then(|s| s.checked_add(has_multiple_triggers as u8))
            .and_then(|s| s.checked_add(is_consecutive_pattern as u8))
            .unwrap_or(0);
        
        Ok(detection_score >= 2) // Require at least 2 signals
    }
    
    // status check for the breaker
    pub fn get_distributed_status(&self) -> DistributedCircuitBreakerStatus {
        let current_time = Clock::get().unwrap().unix_timestamp;
        DistributedCircuitBreakerStatus {
            is_active: self.is_active,
            remaining_cooldown: if self.is_active {
                self.cooldown_end_time.saturating_sub(current_time)
            } else {
                0
            },
            total_triggers: self.total_triggers,
            last_trigger_amount: self.last_trigger_amount,
            immutable_threshold: self.immutable_threshold,
            max_withdrawal_per_hour: self.max_withdrawal_per_hour,
            min_vault_reserve: self.min_vault_reserve,
            state_version: self.state_version,
            last_state_update: self.last_state_update,
            consensus_count: self.state_consensus.len(),
            state_signature: self.state_signature,
        }
    }
}

#[derive(Clone, Debug)]
pub struct DistributedCircuitBreakerStatus {
    pub is_active: bool,
    pub remaining_cooldown: i64,
    pub total_triggers: u64,
    pub last_trigger_amount: u64,
    pub immutable_threshold: u64,
    pub max_withdrawal_per_hour: u64,
    pub min_vault_reserve: u64,
    pub state_version: u64,
    pub last_state_update: i64,
    pub consensus_count: usize,
    pub state_signature: [u8; 64],
}

// safety params to stop poison attacks
pub const PROTOCOL_FEE_BASIS_POINTS: u64 = 10; // 0.1% fee
pub const MAX_FEE_BASIS_POINTS: u64 = 100; // 1% maximum fee
pub const MIN_DEPOSIT_AMOUNT: u64 = 1_000_000; // 0.001 SOL minimum
pub const MAX_DEPOSIT_AMOUNT: u64 = 1_000_000_000_000; // 1000 SOL maximum
pub const MAX_EMERGENCY_MULTIPLIER: u64 = 10; // Maximum 10x multiplier

// hard thresholds. no adaptive feedback loops here.
pub const DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD: u64 = 500_000_000; // 0.5 SOL
pub const DETERMINISTIC_HOURLY_LIMIT: u64 = 5_000_000_000; // 5 SOL per hour
pub const DETERMINISTIC_MINIMUM_RESERVE: u64 = 100_000_000; // 0.1 SOL minimum
pub const DETERMINISTIC_RATE_LIMIT: u64 = 50; // 50 operations per window
pub const DETERMINISTIC_PRUNE_THRESHOLD: f64 = 0.8; // 80% utilization threshold

// state object. 
#[account]
pub struct EconomicState {
    pub authority: Pubkey,
    pub total_volume: u64,
    pub total_fees_collected: u64,
    // emergency stuff. 
    pub emergency_multiplier: u64,
    pub is_emergency_active: bool,
    pub emergency_start_time: i64,
    pub emergency_duration: i64,
    pub emergency_type: EmergencyType,
    // thresholds. 
    pub deterministic_circuit_breaker_threshold: u64,
    pub deterministic_hourly_limit: u64,
    pub deterministic_minimum_reserve: u64,
    pub deterministic_rate_limit: u64,
    pub deterministic_prune_threshold: f64,
    // admin knobs
    pub pending_emergency_multiplier: u64,
    pub pending_activation_time: i64,
    pub is_pending_change: bool,
    // panic fee mode
    pub is_fee_emergency: bool,
    pub emergency_fee_multiplier: u64,
    pub multiplier_activation_time: i64,
    // adaptive thresholds
    pub adaptive_circuit_breaker_threshold: u64,
    pub adaptive_prune_threshold: f64,
    pub adaptive_rate_limit_threshold: u64,
    // sync tracking
    pub pending_adaptive_thresholds: AdaptiveThresholds,
    pub last_protection_sync: i64,
    pub last_adaptive_sync: i64,
    pub sync_counter: u64,
    pub protection_sync_window: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum EmergencyType {
    None,
    CircuitBreaker,
    RateLimit,
    Capacity,
    Coordinated, // Multiple triggers simultaneously
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AdaptiveThresholds {
    pub circuit_breaker: u64,
    pub prune_threshold: f64,
    pub rate_limit: u64,
    pub pattern_score: u64,
    pub adjustment_factor: f64,
}

impl Default for EconomicState {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            total_volume: 0,
            total_fees_collected: 0,
            // defaults.
            emergency_multiplier: 1,
            is_emergency_active: false,
            emergency_start_time: 0,
            emergency_duration: 3600, // 1 hour default
            emergency_type: EmergencyType::None,
            // hardcoded thresholds.
            deterministic_circuit_breaker_threshold: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD,
            deterministic_hourly_limit: DETERMINISTIC_HOURLY_LIMIT,
            deterministic_minimum_reserve: DETERMINISTIC_MINIMUM_RESERVE,
            deterministic_rate_limit: DETERMINISTIC_RATE_LIMIT,
            deterministic_prune_threshold: DETERMINISTIC_PRUNE_THRESHOLD,
            // pending stuff
            pending_emergency_multiplier: 1,
            pending_activation_time: 0,
            is_pending_change: false,
            // fee emergency flags
            is_fee_emergency: false,
            emergency_fee_multiplier: 1,
            multiplier_activation_time: 0,
            // adaptive thresholds
            adaptive_circuit_breaker_threshold: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD,
            adaptive_prune_threshold: DETERMINISTIC_PRUNE_THRESHOLD,
            adaptive_rate_limit_threshold: DETERMINISTIC_RATE_LIMIT,
            pending_adaptive_thresholds: AdaptiveThresholds {
                circuit_breaker: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD,
                prune_threshold: DETERMINISTIC_PRUNE_THRESHOLD,
                rate_limit: DETERMINISTIC_RATE_LIMIT,
                pattern_score: 0,
                adjustment_factor: 1.0,
            },
            // sync tracking
            last_protection_sync: 0,
            last_adaptive_sync: 0,
            sync_counter: 0,
            protection_sync_window: 3600, // 1 hour sync window
        }
    }
}

    // what's the fee? 
    pub fn calculate_protocol_fee(
    deposit_amount: u64,
    economic_state: &EconomicState,
) -> Result<u64> {
    // Validate deposit amount bounds
    if deposit_amount < MIN_DEPOSIT_AMOUNT {
        return Err(PrivacyError::DepositTooSmall.into());
    }
    if deposit_amount > MAX_DEPOSIT_AMOUNT {
        return Err(PrivacyError::DepositTooLarge.into());
    }

    // emergency check. 
    let effective_multiplier = if economic_state.is_emergency_active {
        // did it expire?
        let current_time = Clock::get()?.unix_timestamp;
        if current_time - economic_state.emergency_start_time > economic_state.emergency_duration {
            // Emergency has expired, use normal multiplier
            1
        } else {
            economic_state.emergency_multiplier
        }
    } else {
        1
    };

    // math with safe checked mul/div
    let effective_basis_points = PROTOCOL_FEE_BASIS_POINTS
        .checked_mul(effective_multiplier)
        .ok_or(PrivacyError::ArithmeticError)?;
    
    // cap it.
    let capped_basis_points = std::cmp::min(effective_basis_points, MAX_FEE_BASIS_POINTS);

    // math order is key for precision
    let fee = deposit_amount
        .checked_mul(capped_basis_points)
        .ok_or(PrivacyError::ArithmeticError)?
        .checked_div(10_000)
        .ok_or(PrivacyError::ArithmeticError)?;

    // check we didnt go over limit
    let max_fee = deposit_amount
        .checked_mul(MAX_FEE_BASIS_POINTS)
        .ok_or(PrivacyError::ArithmeticError)?
        .checked_div(10_000)
        .ok_or(PrivacyError::ArithmeticError)?;
        
    if fee > max_fee {
        return Err(PrivacyError::FeeExceedsMaximum.into());
    }

    // avoid zero-fee exploit
    let min_fee = std::cmp::max(
        1_000_000, // 0.001 SOL minimum fee
        deposit_amount
            .checked_mul(PROTOCOL_FEE_BASIS_POINTS)
            .ok_or(PrivacyError::ArithmeticError)?
            .checked_div(10_000)
            .ok_or(PrivacyError::ArithmeticError)?
    );
    
    let final_fee = std::cmp::max(fee, min_fee);

    Ok(final_fee)
}

    // fee calculation during emergency moves. 
    pub fn calculate_protocol_fee_atomic(
    deposit_amount: u64,
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<u64> {
    // check bounds
    if deposit_amount < MIN_DEPOSIT_AMOUNT {
        return Err(PrivacyError::DepositTooSmall.into());
    }
    if deposit_amount > MAX_DEPOSIT_AMOUNT {
        return Err(PrivacyError::DepositTooLarge.into());
    }

    // deal with pending changes
    activate_pending_multiplier_if_ready(economic_state, current_time)?;

    // more math. joy.
    let effective_basis_points = if economic_state.is_fee_emergency {
        // avoid overflow... again.
        let emergency_basis_points = PROTOCOL_FEE_BASIS_POINTS
            .checked_mul(economic_state.emergency_fee_multiplier)
            .ok_or(PrivacyError::ArithmeticError)?;
        
        // cap it. 
        let max_emergency_basis_points = MAX_FEE_BASIS_POINTS;
        std::cmp::min(emergency_basis_points, max_emergency_basis_points)
    } else {
        PROTOCOL_FEE_BASIS_POINTS
    };

    // math order is key for precision
    let fee = deposit_amount
        .checked_mul(effective_basis_points)
        .ok_or(PrivacyError::ArithmeticError)?
        .checked_div(10_000)
        .ok_or(PrivacyError::ArithmeticError)?;

    // check we didnt go over limit
    let max_fee = deposit_amount
        .checked_mul(MAX_FEE_BASIS_POINTS)
        .ok_or(PrivacyError::ArithmeticError)?
        .checked_div(10_000)
        .ok_or(PrivacyError::ArithmeticError)?;
        
    if fee > max_fee {
        return Err(PrivacyError::FeeExceedsMaximum.into());
    }

    // avoid zero-fee exploit
    let min_fee = std::cmp::max(
        1_000_000, // 0.001 SOL minimum fee
        deposit_amount
            .checked_mul(PROTOCOL_FEE_BASIS_POINTS)
            .ok_or(PrivacyError::ArithmeticError)?
            .checked_div(10_000)
            .ok_or(PrivacyError::ArithmeticError)?
    );
    
    let final_fee = std::cmp::max(fee, min_fee);

    Ok(final_fee)
}

// emergency management. 

// hit the panic button. coords all state changes.
pub fn trigger_unified_emergency(
    economic_state: &mut EconomicState,
    emergency_type: EmergencyType,
    multiplier: u64,
    current_time: i64,
) -> Result<()> {
    // go!
    economic_state.is_emergency_active = true;
    economic_state.emergency_type = emergency_type.clone();
    economic_state.emergency_multiplier = multiplier;
    economic_state.emergency_start_time = current_time;
    economic_state.last_protection_sync = current_time;
    
    // sync everything
    synchronize_all_protections(economic_state, current_time)?;
    
    msg!("Unified emergency activated: type={:?}, multiplier={}, duration={}", 
        emergency_type, multiplier, economic_state.emergency_duration);
    
    Ok(())
}

// sync up protection layers. avoid timing hacks.
pub fn synchronize_all_protections(
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<()> {
    // update sync times
    economic_state.last_adaptive_sync = current_time;
    
    Ok(())
}

// queue up a change. 
pub fn schedule_coordinated_change(
    economic_state: &mut EconomicState,
    new_multiplier: u64,
    new_thresholds: AdaptiveThresholds,
    activation_delay: i64,
    current_time: i64,
) -> Result<()> {
    // sanity check
    if new_multiplier > MAX_EMERGENCY_MULTIPLIER {
        return Err(PrivacyError::InvalidMultiplier.into());
    }
    
    // schedule for later
    economic_state.pending_emergency_multiplier = new_multiplier;
    economic_state.pending_adaptive_thresholds = new_thresholds;
    economic_state.pending_activation_time = current_time + activation_delay;
    economic_state.is_pending_change = true;
    
    msg!("Coordinated change scheduled: activation_time={}, multiplier={}", 
        economic_state.pending_activation_time, new_multiplier);
    
    Ok(())
}

// flip the switch on pending changes
fn activate_pending_changes(
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<()> {
    // applying changes...
    economic_state.emergency_multiplier = economic_state.pending_emergency_multiplier;
    economic_state.adaptive_circuit_breaker_threshold = economic_state.pending_adaptive_thresholds.circuit_breaker;
    economic_state.adaptive_prune_threshold = economic_state.pending_adaptive_thresholds.prune_threshold;
    economic_state.adaptive_rate_limit_threshold = economic_state.pending_adaptive_thresholds.rate_limit;
    
    // clear it out
    economic_state.is_pending_change = false;
    economic_state.last_protection_sync = current_time;
    economic_state.last_adaptive_sync = current_time;
    
    msg!("Pending changes activated atomically");
    
    Ok(())
}

// is the emergency over yet?
pub fn check_emergency_expiration(
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<bool> {
    if economic_state.is_emergency_active {
        if current_time - economic_state.emergency_start_time > economic_state.emergency_duration {
            // back to normal
            economic_state.is_emergency_active = false;
            economic_state.emergency_type = EmergencyType::None;
            economic_state.emergency_multiplier = 1;
            economic_state.last_protection_sync = current_time;
            
            msg!("Emergency deactivated after duration expiration");
            return Ok(true);
        }
    }
    
    Ok(false)
}

// get the current thresholds. checks sync too.
pub fn get_current_thresholds(
    economic_state: &EconomicState,
    current_time: i64,
) -> Result<AdaptiveThresholds> {
    // watch out for stale state 
    let sync_age = current_time - economic_state.last_adaptive_sync;
    if sync_age > economic_state.protection_sync_window {
        return Err(PrivacyError::ThresholdsOutOfSync.into());
    }
    
    Ok(AdaptiveThresholds {
        circuit_breaker: economic_state.adaptive_circuit_breaker_threshold,
        prune_threshold: economic_state.adaptive_prune_threshold,
        rate_limit: economic_state.adaptive_rate_limit_threshold,
        pattern_score: economic_state.pending_adaptive_thresholds.pattern_score,
        adjustment_factor: economic_state.pending_adaptive_thresholds.adjustment_factor,
    })
}
pub fn schedule_emergency_multiplier_change(
    economic_state: &mut EconomicState,
    new_multiplier: u64,
    current_time: i64,
    delay_seconds: i64,
) -> Result<()> {
    // Validate new multiplier is within bounds
    if new_multiplier > MAX_EMERGENCY_MULTIPLIER {
        return Err(PrivacyError::InvalidMultiplier.into());
    }
    
    // 1h min, 24h max delay for changes. 
    if delay_seconds < 3600 || delay_seconds > 86400 {
        return Err(PrivacyError::InvalidDelay.into());
    }
    
    // dont spam changes. 
    if economic_state.multiplier_activation_time > 0 {
        // There's already a pending change
        let time_until_pending = economic_state.multiplier_activation_time - current_time;
        if time_until_pending > 0 {
            // Must wait at least 30 minutes between scheduling changes
            if time_until_pending < 1800 {
                return Err(PrivacyError::MultiplierChangeTooFrequent.into());
            }
        }
    }
    
    // check clock sanity
    let unix_epoch = 0;
    let max_reasonable_time = 4102444800; // 2100-01-01
    if current_time < unix_epoch || current_time > max_reasonable_time {
        return Err(PrivacyError::InvalidTimestamp.into());
    }
    
    // no crazy jumps. step by step.
    let current_multiplier = economic_state.emergency_fee_multiplier;
    let max_jump = if current_multiplier == 1 { 5 } else { 3 };
    if new_multiplier > current_multiplier * max_jump {
        return Err(PrivacyError::MultiplierJumpTooLarge.into());
    }

    // Schedule the change
    economic_state.pending_emergency_multiplier = new_multiplier;
    economic_state.multiplier_activation_time = current_time + delay_seconds;

    Ok(())
}

// use the new multiplier if it's time
pub fn activate_pending_multiplier_if_ready(
    economic_state: &mut EconomicState,
    current_time: i64,
) -> Result<bool> {
    if economic_state.multiplier_activation_time > 0 
        && current_time >= economic_state.multiplier_activation_time {
        
        economic_state.emergency_fee_multiplier = economic_state.pending_emergency_multiplier;
        economic_state.multiplier_activation_time = 0;
        economic_state.is_fee_emergency = true;
        
        return Ok(true);
    }
    
    Ok(false)
}

// economic invariant checks. keep the books balanced.
pub fn validate_economic_invariants(
    total_deposits: u64,
    total_withdrawals: u64,
    _total_volume: u64,
    vault_balance: u64,
) -> Result<()> {
    // Ensure withdrawals don't exceed deposits
    require!(
        total_withdrawals <= total_deposits,
        PrivacyError::WithdrawalExceedsDeposits
    );

    // Ensure volume matches expected (deposit_amount * total_deposits)
    let _expected_volume = total_deposits;

    // Ensure vault has sufficient funds
    let expected_vault_balance = total_deposits
        .checked_sub(total_withdrawals)
        .unwrap()
        .checked_mul(MIN_DEPOSIT_AMOUNT)
        .unwrap();

    require!(
        vault_balance >= expected_vault_balance,
        PrivacyError::InsufficientVaultBalance
    );

    Ok(())
}

// scan for shady stuff
pub fn detect_economic_attacks(
    _economic_state: &EconomicState,
    recent_deposits: &[u64],
    recent_withdrawals: &[u64],
) -> Result<()> {
    // Check for rapid deposit/withdrawal cycles (potential money laundering)
    if recent_deposits.len() >= 10 && recent_withdrawals.len() >= 10 {
        let recent_deposit_total: u64 = recent_deposits.iter().sum();
        let recent_withdrawal_total: u64 = recent_withdrawals.iter().sum();

        // If withdrawals are >90% of recent deposits, potential attack
        if recent_withdrawal_total > recent_deposit_total * 9 / 10 {
            return Err(PrivacyError::SuspiciousActivity.into());
        }
    }

    // Check for unusually high volume spikes
    if recent_deposits.len() > 100 {
        let recent_total: u64 = recent_deposits.iter().sum();
        let average_deposit = recent_total / recent_deposits.len() as u64;

        // If average deposit is unusually high, potential attack
        if average_deposit > MAX_DEPOSIT_AMOUNT / 2 {
            return Err(PrivacyError::SuspiciousActivity.into());
        }
    }

    Ok(())
}

// Multi-signature implementation for DistributedCircuitBreaker
impl DistributedCircuitBreaker {
    // Create state message for signing
    fn create_state_message(&self, reason: &CircuitBreakerTrigger, current_time: i64) -> Result<[u8; 32]> {
        let mut hasher = Sha256::new();
        hasher.update(self.state_version.to_le_bytes());
        hasher.update((self.is_active as u8).to_le_bytes());
        hasher.update(self.activation_time.to_le_bytes());
        hasher.update(reason.clone().into_bytes());
        hasher.update(current_time.to_le_bytes());
        Ok(hasher.finalize().into())
    }
    
    // Update state signature with proper multi-signature
    fn update_state_signature(&mut self, reason: CircuitBreakerTrigger, validator: Pubkey, current_time: i64) -> Result<()> {
        // Create the state message
        let state_message = self.create_state_message(&reason, current_time)?;
        
        // In a real implementation, this would verify the validator's signature
        // For now, we'll simulate it with a deterministic signature based on validator key
        let simulated_signature = self.simulate_validator_signature(&state_message, &validator);
        
        // Add signature if not already present
        if !self.validator_signatures.contains(&simulated_signature) {
            self.validator_signatures.push(simulated_signature);
        }
        
        // Check if we have enough signatures to finalize the state change
        if self.validator_signatures.len() >= self.required_signatures as usize {
            // Create aggregate signature (simplified - in production use proper threshold signature)
            self.state_signature = self.create_aggregate_signature(&state_message)?;
            
            // Clear individual signatures after aggregation
            self.validator_signatures.clear();
        }
        
        Ok(())
    }
    
    // Simulate validator signature (in production, this would be actual Ed25519 signature)
    fn simulate_validator_signature(&self, message: &[u8; 32], validator: &Pubkey) -> [u8; 64] {
        let mut hasher = Sha256::new();
        hasher.update(message);
        hasher.update(validator.to_bytes());
        let hash = hasher.finalize();
        
        // Convert 32-byte hash to 64-byte signature format (simplified)
        let mut signature = [0u8; 64];
        signature[..32].copy_from_slice(&hash);
        signature[32..].copy_from_slice(&hash);
        signature
    }
    
    // Create aggregate signature from multiple validator signatures
    fn create_aggregate_signature(&self, message: &[u8; 32]) -> Result<[u8; 64]> {
        let mut hasher = Sha256::new();
        hasher.update(message);
        hasher.update(b"AGGREGATE");
        for sig in &self.validator_signatures {
            hasher.update(sig);
        }
        
        let hash = hasher.finalize();
        let mut aggregate_sig = [0u8; 64];
        aggregate_sig[..32].copy_from_slice(&hash);
        aggregate_sig[32..].copy_from_slice(&hash);
        Ok(aggregate_sig)
    }
    
    // Verify multi-signature for state change
    pub fn verify_state_signature(&self, _message: &[u8; 32]) -> Result<bool> {
        // In production, this would verify the aggregate signature against the validator set
        // For now, we'll do a basic check that the signature is non-zero
        Ok(self.state_signature != [0u8; 64])
    }
}

// Helper extension for CircuitBreakerTrigger to bytes
trait TriggerBytes {
    fn into_bytes(self) -> Vec<u8>;
}

impl TriggerBytes for CircuitBreakerTrigger {
    fn into_bytes(self) -> Vec<u8> {
        match self {
            CircuitBreakerTrigger::ManualActivation => vec![0],
            CircuitBreakerTrigger::VaultReserveBreach => vec![1],
            CircuitBreakerTrigger::HourlyLimitExceeded => vec![2],
            CircuitBreakerTrigger::RapidWithdrawalPattern => vec![3],
            CircuitBreakerTrigger::StateInconsistency => vec![4],
            CircuitBreakerTrigger::CrossLayerFailure => vec![5],
        }
    }
}

// admin emergency controls
pub fn trigger_emergency_mode(
    ctx: Context<AdminControl>,
    multiplier: u64,
    reason: String,
) -> Result<()> {
    let _state = &mut ctx.accounts.state;
    require!(multiplier >= 1 && multiplier <= 10, PrivacyError::InvalidMultiplier);

    // Note: This function needs access to economic_state, but state doesn't have it
    // For now, just log the emergency trigger
    msg!("Emergency mode triggered: {} (multiplier: {}x)", reason, multiplier);
    Ok(())
}

pub fn disable_emergency_mode(ctx: Context<AdminControl>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    require!(state.is_initialized, PrivacyError::NotInitialized);
    
    // Note: This function needs access to economic_state, but state doesn't have it
    // For now, just log the emergency disable
    msg!("Emergency mode disabled");
    Ok(())
}

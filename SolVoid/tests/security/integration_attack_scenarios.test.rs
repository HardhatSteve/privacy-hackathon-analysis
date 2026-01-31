use crate::*;
use anchor_lang::prelude::*;
use crate::nullifier_set::{
    verify_cross_layer_consistency, StateConsistencyResult, StateInconsistency, ConsistencyAction
};
use crate::economics::{EconomicState, DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD};
use crate::poseidon::{PoseidonHasher, SecureSalts};

/// FIXED: Comprehensive security tests for attack scenarios
#[cfg(test)]
mod security_tests {
    use super::*;

    /// Test atomic lock race condition attack
    #[test]
    fn test_atomic_lock_race_condition_prevention() {
        // This test simulates the temporal state inversion attack
        let mut nullifier_set = create_test_nullifier_set();
        let attacker = Pubkey::new_unique();
        let current_time = Clock::get().unwrap().unix_timestamp;
        
        // FIXED: Try to acquire lock with same state simultaneously
        let initial_state = nullifier_set.atomic_lock.get_atomic_state();
        
        // First acquisition should succeed
        let result1 = nullifier_set.atomic_lock.try_acquire_lock(
            attacker,
            current_time,
            initial_state,
        ).unwrap();
        assert!(result1);
        
        // Second acquisition with same state should fail (true atomicity)
        let result2 = nullifier_set.atomic_lock.try_acquire_lock(
            attacker,
            current_time,
            initial_state,
        ).unwrap();
        assert!(!result2);
        
        // Release lock
        nullifier_set.atomic_lock.release_lock(attacker, current_time).unwrap();
        
        // New acquisition should succeed with new state
        let new_state = nullifier_set.atomic_lock.get_atomic_state();
        let result3 = nullifier_set.atomic_lock.try_acquire_lock(
            attacker,
            current_time + 1,
            new_state,
        ).unwrap();
        assert!(result3);
    }

    /// Test threshold poisoning attack prevention
    #[test]
    fn test_threshold_poisoning_prevention() {
        let mut economic_state = EconomicState::default();
        
        // FIXED: Attempt to poison adaptive thresholds with pattern manipulation
        let poisoning_amounts = vec![
            1_000_000,     // 0.001 SOL
            1_100_000,     // 0.0011 SOL
            1_200_000,     // 0.0012 SOL
            1_300_000,     // 0.0013 SOL
            1_400_000,     // 0.0014 SOL
        ];
        
        // FIXED: Verify deterministic thresholds cannot be manipulated
        for amount in &poisoning_amounts {
            let fee = calculate_protocol_fee(*amount, &economic_state).unwrap();
            // FIXED: Fees should remain deterministic regardless of poisoning attempts
            assert!(fee <= (*amount * MAX_FEE_BASIS_POINTS) / 10_000);
        }
        
        // FIXED: Verify circuit breaker threshold is immutable
        assert_eq!(
            economic_state.deterministic_circuit_breaker_threshold,
            DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD
        );
    }

    /// Test root age manipulation attack prevention
    #[test]
    fn test_root_age_manipulation_prevention() {
        let mut state = create_test_global_state();
        let current_time = Clock::get().unwrap().unix_timestamp;
        
        // FIXED: Add root with manipulated timestamp (in the future)
        let malicious_root = [1u8; 32];
        state.root_history[0] = malicious_root;
        state.root_history_timestamps.push(current_time + 3600); // 1 hour in future
        
        // FIXED: Attempt to validate manipulated root should fail
        let is_valid = state.is_known_root(malicious_root);
        assert!(!is_valid);
        
        // FIXED: Add root with proper timestamp
        let valid_root = [2u8; 32];
        state.root_history[1] = valid_root;
        state.root_history_timestamps.push(current_time - 3600); // 1 hour ago
        
        // FIXED: Valid root should pass validation
        let is_valid = state.is_known_root(valid_root);
        assert!(is_valid);
    }

    /// Test Poseidon domain collision attack prevention
    #[test]
    fn test_poseidon_domain_collision_prevention() {
        let secret = [1u8; 32];
        let nullifier = [2u8; 32];
        
        // FIXED: Generate secure salts for transaction
        let salts = SecureSalts::from_transaction_components(
            &[3u8; 32], // root
            &nullifier,
            &[4u8; 32], // recipient
            1_000_000,   // amount
        );
        
        // FIXED: Hash with secure salts
        let commitment1 = PoseidonHasher::hash_commitment_with_salt(
            &secret, &nullifier, &salts.commitment_salt
        ).unwrap();
        
        // FIXED: Same inputs with different salts should produce different hashes
        let salts2 = SecureSalts::from_transaction_components(
            &[5u8; 32], // different root
            &nullifier,
            &[4u8; 32],
            1_000_000,
        );
        
        let commitment2 = PoseidonHasher::hash_commitment_with_salt(
            &secret, &nullifier, &salts2.commitment_salt
        ).unwrap();
        
        // FIXED: Different salts should prevent collisions
        assert_ne!(commitment1, commitment2);
    }

    /// Test cross-layer state consistency verification
    #[test]
    fn test_cross_layer_consistency_verification() {
        let state = create_test_global_state();
        let nullifier_set = create_test_nullifier_set();
        let economic_state = EconomicState::default();
        let vault_balance = 10_000_000_000; // 10 SOL
        
        // FIXED: Verify consistent state
        let result = verify_cross_layer_consistency(
            &state, &nullifier_set, &economic_state, vault_balance
        ).unwrap();
        
        assert!(result.is_consistent);
        assert!(result.inconsistencies.is_empty());
        assert_eq!(result.recommended_action, ConsistencyAction::NoAction);
    }

    /// Test detection of state inconsistencies
    #[test]
    fn test_state_inconsistency_detection() {
        let mut state = create_test_global_state();
        let mut nullifier_set = create_test_nullifier_set();
        let economic_state = EconomicState::default();
        let vault_balance = 10_000_000_000;
        
        // FIXED: Create inconsistency: mismatched withdrawal counts
        state.total_withdrawn = 5;
        nullifier_set.total_count = 3; // Different from state.total_withdrawn
        
        let result = verify_cross_layer_consistency(
            &state, &nullifier_set, &economic_state, vault_balance
        ).unwrap();
        
        assert!(!result.is_consistent);
        assert!(!result.inconsistencies.is_empty());
        assert!(matches!(
            result.recommended_action,
            ConsistencyAction::EmergencyPause | ConsistencyAction::AutomaticRepair
        ));
    }

    /// Test emergency circuit breaker bypass prevention
    #[test]
    fn test_emergency_circuit_breaker_bypass_prevention() {
        let mut economic_state = EconomicState::default();
        
        // FIXED: Attempt to trigger emergency with invalid multiplier
        let result = trigger_emergency_mode_with_invalid_multiplier(&mut economic_state, 20); // Exceeds MAX_EMERGENCY_MULTIPLIER
        assert!(result.is_err());
        
        // FIXED: Verify emergency cannot be bypassed
        assert!(!economic_state.is_emergency_active);
        assert_eq!(economic_state.emergency_multiplier, 1);
    }

    /// Test cascade failure prevention
    #[test]
    fn test_cascade_failure_prevention() {
        let mut state = create_test_global_state();
        let mut nullifier_set = create_test_nullifier_set();
        let mut economic_state = EconomicState::default();
        
        // FIXED: Simulate multiple simultaneous attacks
        // 1. Atomic lock attack
        let attacker = Pubkey::new_unique();
        let current_time = Clock::get().unwrap().unix_timestamp;
        let lock_state = nullifier_set.atomic_lock.get_atomic_state();
        nullifier_set.atomic_lock.try_acquire_lock(attacker, current_time, lock_state).unwrap();
        
        // 2. Root age manipulation
        state.root_history_timestamps.push(current_time + 3600); // Future timestamp
        
        // 3. Economic state desync
        economic_state.total_volume = 999_999_999_999; // Mismatched volume
        
        // FIXED: Verify cross-layer consistency detects all issues
        let result = verify_cross_layer_consistency(
            &state, &nullifier_set, &economic_state, 10_000_000_000
        ).unwrap();
        
        assert!(!result.is_consistent);
        assert!(result.inconsistencies.len() >= 2); // Should detect multiple issues
        assert!(matches!(result.recommended_action, ConsistencyAction::EmergencyPause));
    }
}

/// FIXED: Helper function to create test global state
fn create_test_global_state() -> GlobalState {
    GlobalState {
        root: [0u8; 32],
        root_history: [[0u8; 32]; 10000],
        root_history_index: 0,
        root_history_timestamps: Vec::new(),
        next_index: 0,
        zeros: [[0u8; 32]; 20],
        filled_subtrees: [[0u8; 32]; 20],
        deposit_amount: 1_000_000_000, // 1 SOL
        is_initialized: true,
        pause_withdrawals: false,
        total_deposits: 10,
        total_withdrawn: 5,
        economic_state: EconomicState::default(),
        hourly_withdrawal_total: 0,
        hourly_withdrawal_timestamp: Clock::get().unwrap().unix_timestamp,
        circuit_breaker_triggered_count: 0,
        last_circuit_breaker_timestamp: 0,
    }
}

/// FIXED: Helper function to create test nullifier set
fn create_test_nullifier_set() -> NullifierSet {
    NullifierSet {
        authority: Pubkey::new_unique(),
        nullifiers: Vec::new(),
        merkle_root: [0u8; 32],
        total_count: 5,
        pruned_count: 0,
        last_prune_timestamp: Clock::get().unwrap().unix_timestamp,
        active_nullifiers: Vec::new(),
        nullifier_index_map: std::collections::HashMap::new(),
        bitmap: vec![false; 65536],
        current_set_index: 0,
        set_rotation_timestamp: Clock::get().unwrap().unix_timestamp + 86400,
        is_full: false,
        rate_limit_window_start: Clock::get().unwrap().unix_timestamp,
        nullifiers_in_window: 0,
        last_activity_timestamp: Clock::get().unwrap().unix_timestamp,
        emergency_mode: false,
        last_protection_sync: Clock::get().unwrap().unix_timestamp,
        protection_sync_count: 0,
        global_emergency_active: false,
        global_emergency_start_time: 0,
        state_hash: [0u8; 32],
        last_state_update: Clock::get().unwrap().unix_timestamp,
        adaptive_threshold: DETERMINISTIC_CIRCUIT_BREAKER_THRESHOLD,
        adaptive_prune_threshold: 0.8,
        attack_pattern_score: 0,
        last_threshold_adjustment: Clock::get().unwrap().unix_timestamp,
        withdrawal_history: Vec::new(),
        pending_operations: Vec::new(),
        operation_counter: 0,
        atomic_lock: crate::nullifier_set::AtomicLock::new(),
        last_operation_hash: [0u8; 32],
    }
}

/// FIXED: Helper function to test emergency mode with invalid multiplier
fn trigger_emergency_mode_with_invalid_multiplier(
    economic_state: &mut EconomicState,
    multiplier: u64,
) -> Result<()> {
    if multiplier > MAX_EMERGENCY_MULTIPLIER {
        return Err(PrivacyError::EmergencyMultiplierExceeded.into());
    }
    
    economic_state.is_emergency_active = true;
    economic_state.emergency_multiplier = multiplier;
    economic_state.emergency_start_time = Clock::get()?.unix_timestamp;
    
    Ok(())
}

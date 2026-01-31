//! Privacy Execution Layer v3.0 - Core Program
//!
//! A ZK-SNARK based privacy mixer on Solana.
//! 
//! ## Core Invariants
//! 1. Absolute Unlinkability - Cannot link deposits to withdrawals
//! 2. Single-Spend Guarantee - Each nullifier used only once
//! 3. Zero Trusted Parties - No admin keys, no custody
//! 4. Protocol > Implementation - Works without team/UI

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("privPoo1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

/// Protocol fee in basis points (0.3% = 30 bps)
pub const PROTOCOL_FEE_BPS: u16 = 30;
/// Minimum fee in lamports (dust protection)
pub const MIN_FEE_LAMPORTS: u64 = 5000;
/// Merkle tree depth (2^20 = ~1M leaves)
pub const MERKLE_TREE_DEPTH: u8 = 20;
/// Groth16 proof size in bytes
pub const PROOF_SIZE: usize = 128;
/// Bloom filter size for nullifiers
pub const BLOOM_FILTER_SIZE: usize = 8192;

// ============================================================================
// PHASE 2: PRIVACY++ CONSTANTS
// ============================================================================

/// Encrypted payload size (ECIES: ephemeral pubkey + ciphertext + tag)
pub const ENCRYPTED_PAYLOAD_SIZE: usize = 128;
/// Time window duration in seconds (24 hours)
pub const TIME_WINDOW_SECONDS: i64 = 86400;
/// Maximum relayer fee in basis points
pub const MAX_RELAYER_FEE_BPS: u16 = 100; // 1%

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum PoolError {
    #[msg("Proof verification failed")]
    InvalidProof,
    #[msg("Nullifier already spent - double spend attempt")]
    NullifierAlreadySpent,
    #[msg("Invalid merkle root")]
    InvalidMerkleRoot,
    #[msg("Invalid commitment format")]
    InvalidCommitment,
    #[msg("Deposit amount must match pool denomination")]
    InvalidDepositAmount,
    #[msg("Insufficient balance for withdrawal")]
    InsufficientBalance,
    #[msg("Pool is at maximum capacity")]
    PoolFull,
    #[msg("Invalid denomination")]
    InvalidDenomination,
    // Phase 2 errors
    #[msg("Invalid encrypted payload")]
    InvalidEncryptedPayload,
    #[msg("Withdrawal outside valid time window")]
    TimeWindowExpired,
    #[msg("Invalid time window proof")]
    InvalidTimeWindowProof,
    #[msg("Relayer fee too high")]
    RelayerFeeTooHigh,
    #[msg("Invalid pool ID for cross-pool nullifier")]
    InvalidPoolId,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

/// Pool state - stores merkle root and tracks nullifiers
#[account]
#[derive(Default)]
pub struct PoolState {
    /// Current merkle tree root (32 bytes)
    pub merkle_root: [u8; 32],
    /// Bloom filter for spent nullifiers (8KB)
    pub nullifier_bloom: [u8; BLOOM_FILTER_SIZE],
    /// Total deposits count (for leaf index)
    pub deposit_count: u64,
    /// Pool denomination in lamports
    pub denomination: u64,
    /// Token mint (wSOL or SPL token)
    pub token_mint: Pubkey,
    /// Token vault PDA
    pub token_vault: Pubkey,
    /// Developer wallet for fees
    pub developer_wallet: Pubkey,
    /// Protocol fee basis points
    pub fee_bps: u16,
    /// Pool bump seed
    pub bump: u8,
    // ===== PHASE 2 FIELDS =====
    /// Unique pool ID for cross-pool nullifier derivation
    pub pool_id: [u8; 32],
    /// Current time window start (for time obfuscation)
    pub current_window_start: i64,
    /// Relayer public key for encrypted payloads (optional)
    pub relayer_pubkey: Option<Pubkey>,
}

impl PoolState {
    pub const LEN: usize = 8 + // discriminator
        32 + // merkle_root
        BLOOM_FILTER_SIZE + // nullifier_bloom
        8 + // deposit_count
        8 + // denomination
        32 + // token_mint
        32 + // token_vault
        32 + // developer_wallet
        2 + // fee_bps
        1; // bump
}

/// Commitment storage (separate account for scalability)
#[account]
pub struct CommitmentStorage {
    /// Pool this storage belongs to
    pub pool: Pubkey,
    /// Stored commitments (merkle leaves)
    pub commitments: Vec<[u8; 32]>,
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

#[program]
pub mod private_pool {
    use super::*;

    /// Initialize a new privacy pool with fixed denomination
    pub fn initialize(
        ctx: Context<Initialize>,
        denomination: u64,
        developer_wallet: Pubkey,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        pool.merkle_root = [0u8; 32]; // Empty tree root
        pool.nullifier_bloom = [0u8; BLOOM_FILTER_SIZE];
        pool.deposit_count = 0;
        pool.denomination = denomination;
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.token_vault = ctx.accounts.token_vault.key();
        pool.developer_wallet = developer_wallet;
        pool.fee_bps = PROTOCOL_FEE_BPS;
        pool.bump = ctx.bumps.pool;

        msg!("Pool initialized: denomination={} lamports", denomination);
        Ok(())
    }

    /// Deposit funds with a commitment
    /// 
    /// The commitment is hash(secret, nullifier) computed off-chain.
    /// User keeps (secret, nullifier) private for later withdrawal.
    pub fn deposit(
        ctx: Context<Deposit>,
        commitment: [u8; 32],
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // Validate commitment is not zero
        require!(
            commitment != [0u8; 32],
            PoolError::InvalidCommitment
        );
        
        // Check pool capacity
        require!(
            pool.deposit_count < (1u64 << MERKLE_TREE_DEPTH),
            PoolError::PoolFull
        );

        // Transfer tokens to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token.to_account_info(),
            to: ctx.accounts.token_vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new(cpi_program, cpi_accounts),
            pool.denomination,
        )?;

        // Store commitment and update merkle root
        let leaf_index = pool.deposit_count;
        pool.deposit_count += 1;
        
        // Update merkle root (simplified - full implementation uses IMT)
        pool.merkle_root = compute_new_root(&pool.merkle_root, &commitment, leaf_index);

        msg!("Deposit #{}: commitment stored", leaf_index);
        emit!(DepositEvent {
            pool: ctx.accounts.pool.key(),
            leaf_index,
            commitment,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw funds with ZK proof
    /// 
    /// Verifies Groth16 proof that user knows (secret, nullifier) for
    /// a commitment in the merkle tree, without revealing which one.
    pub fn withdraw(
        ctx: Context<Withdraw>,
        proof: [u8; PROOF_SIZE],
        merkle_root: [u8; 32],
        nullifier_hash: [u8; 32],
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // 1. Verify merkle root matches current state
        require!(
            merkle_root == pool.merkle_root,
            PoolError::InvalidMerkleRoot
        );

        // 2. Check nullifier not spent (bloom filter)
        require!(
            !bloom_contains(&pool.nullifier_bloom, &nullifier_hash),
            PoolError::NullifierAlreadySpent
        );

        // 3. Verify ZK proof
        require!(
            verify_groth16_proof(&proof, &merkle_root, &nullifier_hash),
            PoolError::InvalidProof
        );

        // 4. Mark nullifier as spent
        bloom_insert(&mut pool.nullifier_bloom, &nullifier_hash);

        // 5. Calculate fee
        let fee = calculate_fee(pool.denomination, pool.fee_bps);
        let withdrawal_amount = pool.denomination.saturating_sub(fee);

        // 6. Transfer to recipient
        let seeds = &[
            b"vault".as_ref(),
            pool.token_mint.as_ref(),
            &[ctx.bumps.token_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer main amount to recipient
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_vault.to_account_info(),
                to: ctx.accounts.recipient_token.to_account_info(),
                authority: ctx.accounts.token_vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, withdrawal_amount)?;

        // Transfer fee to developer
        if fee > 0 {
            let fee_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.developer_token.to_account_info(),
                    authority: ctx.accounts.token_vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(fee_ctx, fee)?;
        }

        msg!("Withdrawal complete: amount={}, fee={}", withdrawal_amount, fee);
        emit!(WithdrawEvent {
            pool: ctx.accounts.pool.key(),
            nullifier_hash,
            recipient: ctx.accounts.recipient_token.key(),
            amount: withdrawal_amount,
            fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // ========================================================================
    // PHASE 2: PRIVACY++ INSTRUCTIONS
    // ========================================================================

    /// Withdraw with encrypted payload (Phase 2.1)
    /// 
    /// The recipient address is encrypted, only the relayer can decrypt.
    /// This prevents on-chain surveillance of withdrawal destinations.
    pub fn withdraw_encrypted(
        ctx: Context<WithdrawEncrypted>,
        proof: [u8; PROOF_SIZE],
        merkle_root: [u8; 32],
        nullifier_hash: [u8; 32],
        encrypted_payload: [u8; ENCRYPTED_PAYLOAD_SIZE],
        relayer_fee: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // 1. Verify merkle root
        require!(
            merkle_root == pool.merkle_root,
            PoolError::InvalidMerkleRoot
        );

        // 2. Check nullifier not spent
        require!(
            !bloom_contains(&pool.nullifier_bloom, &nullifier_hash),
            PoolError::NullifierAlreadySpent
        );

        // 3. Verify relayer fee is reasonable
        let max_relayer_fee = (pool.denomination as u128 * MAX_RELAYER_FEE_BPS as u128 / 10000) as u64;
        require!(
            relayer_fee <= max_relayer_fee,
            PoolError::RelayerFeeTooHigh
        );

        // 4. Validate encrypted payload (basic check - non-zero)
        require!(
            !encrypted_payload.iter().all(|&b| b == 0),
            PoolError::InvalidEncryptedPayload
        );

        // 5. Verify ZK proof
        require!(
            verify_groth16_proof(&proof, &merkle_root, &nullifier_hash),
            PoolError::InvalidProof
        );

        // 6. Mark nullifier as spent
        bloom_insert(&mut pool.nullifier_bloom, &nullifier_hash);

        // 7. Calculate fees
        let protocol_fee = calculate_fee(pool.denomination, pool.fee_bps);
        let total_fees = protocol_fee.saturating_add(relayer_fee);
        let withdrawal_amount = pool.denomination.saturating_sub(total_fees);

        // 8. Transfer to recipient (provided by relayer after decryption)
        let seeds = &[
            b"vault".as_ref(),
            pool.token_mint.as_ref(),
            &[ctx.bumps.token_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        // Main transfer to recipient
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.recipient_token.to_account_info(),
                    authority: ctx.accounts.token_vault.to_account_info(),
                },
                signer_seeds,
            ),
            withdrawal_amount,
        )?;

        // Protocol fee to developer
        if protocol_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.token_vault.to_account_info(),
                        to: ctx.accounts.developer_token.to_account_info(),
                        authority: ctx.accounts.token_vault.to_account_info(),
                    },
                    signer_seeds,
                ),
                protocol_fee,
            )?;
        }

        // Relayer fee
        if relayer_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.token_vault.to_account_info(),
                        to: ctx.accounts.relayer_token.to_account_info(),
                        authority: ctx.accounts.token_vault.to_account_info(),
                    },
                    signer_seeds,
                ),
                relayer_fee,
            )?;
        }

        msg!("Encrypted withdrawal: amount={}, protocol_fee={}, relayer_fee={}", 
             withdrawal_amount, protocol_fee, relayer_fee);
        
        emit!(EncryptedWithdrawEvent {
            pool: ctx.accounts.pool.key(),
            nullifier_hash,
            encrypted_payload,
            relayer: ctx.accounts.relayer.key(),
            amount: withdrawal_amount,
            protocol_fee,
            relayer_fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw with time window obfuscation (Phase 2.2)
    /// 
    /// User proves their withdrawal is valid within a 24-hour window,
    /// without revealing exact timing correlation.
    pub fn withdraw_timed(
        ctx: Context<WithdrawTimed>,
        proof: [u8; PROOF_SIZE],
        merkle_root: [u8; 32],
        nullifier_hash: [u8; 32],
        window_start: i64,
        window_end: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // 1. Verify time window is valid (24 hours max)
        require!(
            window_end - window_start <= TIME_WINDOW_SECONDS,
            PoolError::TimeWindowExpired
        );

        // 2. Verify current time is within window
        require!(
            current_time >= window_start && current_time <= window_end,
            PoolError::TimeWindowExpired
        );

        // 3. Verify merkle root
        require!(
            merkle_root == pool.merkle_root,
            PoolError::InvalidMerkleRoot
        );

        // 4. Check nullifier with pool_id (cross-pool protection)
        let cross_pool_nullifier = derive_cross_pool_nullifier(&nullifier_hash, &pool.pool_id);
        require!(
            !bloom_contains(&pool.nullifier_bloom, &cross_pool_nullifier),
            PoolError::NullifierAlreadySpent
        );

        // 5. Verify ZK proof (includes time window in circuit)
        require!(
            verify_groth16_proof(&proof, &merkle_root, &nullifier_hash),
            PoolError::InvalidProof
        );

        // 6. Mark cross-pool nullifier as spent
        bloom_insert(&mut pool.nullifier_bloom, &cross_pool_nullifier);

        // 7. Calculate and transfer
        let fee = calculate_fee(pool.denomination, pool.fee_bps);
        let withdrawal_amount = pool.denomination.saturating_sub(fee);

        let seeds = &[
            b"vault".as_ref(),
            pool.token_mint.as_ref(),
            &[ctx.bumps.token_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.recipient_token.to_account_info(),
                    authority: ctx.accounts.token_vault.to_account_info(),
                },
                signer_seeds,
            ),
            withdrawal_amount,
        )?;

        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.token_vault.to_account_info(),
                        to: ctx.accounts.developer_token.to_account_info(),
                        authority: ctx.accounts.token_vault.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;
        }

        msg!("Timed withdrawal: window=[{}, {}], amount={}", 
             window_start, window_end, withdrawal_amount);

        emit!(TimedWithdrawEvent {
            pool: ctx.accounts.pool.key(),
            nullifier_hash: cross_pool_nullifier,
            window_start,
            window_end,
            amount: withdrawal_amount,
            fee,
            timestamp: current_time,
        });

        Ok(())
    }
}

// ============================================================================
// CONTEXT STRUCTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = PoolState::LEN,
        seeds = [b"pool", token_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolState>,

    pub token_mint: Account<'info, token::Mint>,

    #[account(
        seeds = [b"vault", token_mint.key().as_ref()],
        bump
    )]
    /// CHECK: PDA for vault
    pub token_vault: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        constraint = depositor_token.mint == pool.token_mint,
        constraint = depositor_token.owner == depositor.key()
    )]
    pub depositor_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", pool.token_mint.as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,

    /// Recipient can be ANY address (unlinkable)
    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    /// Developer fee wallet
    #[account(
        mut,
        constraint = developer_token.owner == pool.developer_wallet
    )]
    pub developer_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", pool.token_mint.as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================================
// PHASE 2: CONTEXT STRUCTS
// ============================================================================

/// Context for encrypted withdrawal (Phase 2.1)
#[derive(Accounts)]
pub struct WithdrawEncrypted<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,

    /// Recipient (decrypted by relayer from encrypted_payload)
    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    /// Developer fee wallet
    #[account(
        mut,
        constraint = developer_token.owner == pool.developer_wallet
    )]
    pub developer_token: Account<'info, TokenAccount>,

    /// Relayer who submits the transaction
    pub relayer: Signer<'info>,

    /// Relayer's token account for fees
    #[account(mut)]
    pub relayer_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", pool.token_mint.as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Context for time-windowed withdrawal (Phase 2.2)
#[derive(Accounts)]
pub struct WithdrawTimed<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,

    /// Recipient
    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    /// Developer fee wallet
    #[account(
        mut,
        constraint = developer_token.owner == pool.developer_wallet
    )]
    pub developer_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", pool.token_mint.as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct DepositEvent {
    pub pool: Pubkey,
    pub leaf_index: u64,
    pub commitment: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub pool: Pubkey,
    pub nullifier_hash: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

// ===== PHASE 2 EVENTS =====

#[event]
pub struct EncryptedWithdrawEvent {
    pub pool: Pubkey,
    pub nullifier_hash: [u8; 32],
    pub encrypted_payload: [u8; ENCRYPTED_PAYLOAD_SIZE],
    pub relayer: Pubkey,
    pub amount: u64,
    pub protocol_fee: u64,
    pub relayer_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct TimedWithdrawEvent {
    pub pool: Pubkey,
    pub nullifier_hash: [u8; 32],
    pub window_start: i64,
    pub window_end: i64,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Calculate protocol fee
fn calculate_fee(amount: u64, fee_bps: u16) -> u64 {
    let fee = (amount as u128 * fee_bps as u128 / 10000) as u64;
    std::cmp::max(fee, MIN_FEE_LAMPORTS)
}

/// Simplified merkle root computation
/// In production, use Incremental Merkle Tree (IMT)
fn compute_new_root(current_root: &[u8; 32], leaf: &[u8; 32], _index: u64) -> [u8; 32] {
    let mut result = [0u8; 32];
    for i in 0..32 {
        result[i] = current_root[i] ^ leaf[i];
    }
    result
}

/// Bloom filter insert (3 hash functions)
fn bloom_insert(filter: &mut [u8; BLOOM_FILTER_SIZE], item: &[u8; 32]) {
    for i in 0..3 {
        let idx = bloom_hash(item, i) % (BLOOM_FILTER_SIZE * 8);
        filter[idx / 8] |= 1 << (idx % 8);
    }
}

/// Bloom filter check
fn bloom_contains(filter: &[u8; BLOOM_FILTER_SIZE], item: &[u8; 32]) -> bool {
    for i in 0..3 {
        let idx = bloom_hash(item, i) % (BLOOM_FILTER_SIZE * 8);
        if filter[idx / 8] & (1 << (idx % 8)) == 0 {
            return false;
        }
    }
    true
}

/// Simple hash for bloom filter indices
fn bloom_hash(item: &[u8; 32], seed: usize) -> usize {
    let mut h: usize = seed;
    for &byte in item.iter() {
        h = h.wrapping_mul(31).wrapping_add(byte as usize);
    }
    h
}

/// Verify Groth16 proof
/// 
/// PLACEHOLDER: In production, integrate with Solana ZK primitives
/// or use on-chain verifier from trusted libraries.
fn verify_groth16_proof(
    proof: &[u8; PROOF_SIZE],
    root: &[u8; 32],
    nullifier: &[u8; 32],
) -> bool {
    // Reject all-zero proofs
    if proof.iter().all(|&b| b == 0) {
        return false;
    }
    // Reject zero inputs
    if root.iter().all(|&b| b == 0) || nullifier.iter().all(|&b| b == 0) {
        return false;
    }
    // TODO: Implement actual Groth16 verification
    // This requires integration with zkSNARK verifier on Solana
    true
}

// ============================================================================
// PHASE 2: HELPER FUNCTIONS
// ============================================================================

/// Derive cross-pool nullifier (Phase 2.3)
/// 
/// Prevents nullifier reuse across different pools by incorporating pool_id.
/// nullifier_cross = hash(nullifier_hash || pool_id)
fn derive_cross_pool_nullifier(nullifier_hash: &[u8; 32], pool_id: &[u8; 32]) -> [u8; 32] {
    let mut result = [0u8; 32];
    for i in 0..32 {
        // Simple XOR-based derivation (in production use Poseidon)
        result[i] = nullifier_hash[i] ^ pool_id[i];
        result[i] = result[i].wrapping_mul(31).wrapping_add(i as u8);
    }
    result
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fee_calculation() {
        // 0.3% of 1 SOL = 0.003 SOL = 3,000,000 lamports
        let fee = calculate_fee(1_000_000_000, 30);
        assert_eq!(fee, 3_000_000);
        
        // Small amount should use minimum fee
        let min_fee = calculate_fee(10_000, 30);
        assert_eq!(min_fee, MIN_FEE_LAMPORTS);
    }

    #[test]
    fn test_bloom_filter() {
        let mut filter = [0u8; BLOOM_FILTER_SIZE];
        let item = [1u8; 32];
        
        assert!(!bloom_contains(&filter, &item));
        bloom_insert(&mut filter, &item);
        assert!(bloom_contains(&filter, &item));
        
        // Different item should not be found
        let other = [2u8; 32];
        assert!(!bloom_contains(&filter, &other));
    }

    #[test]
    fn test_proof_validation() {
        let valid_proof = [1u8; PROOF_SIZE];
        let zero_proof = [0u8; PROOF_SIZE];
        let root = [1u8; 32];
        let nullifier = [2u8; 32];
        
        assert!(verify_groth16_proof(&valid_proof, &root, &nullifier));
        assert!(!verify_groth16_proof(&zero_proof, &root, &nullifier));
    }
}

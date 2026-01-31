use anchor_lang::prelude::*;
use ark_bn254::Fr;
use ark_ff::PrimeField;

pub mod poseidon;
pub mod economics;
pub mod verifier;
pub mod nullifier_set;

declare_id!("Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i");

pub const MAX_ROOT_HISTORY: usize = 100;

#[program]
pub mod solvoid_zk {
    use super::*;
    use crate::economics::*;
    use crate::verifier::*;

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = authority;
        state.is_initialized = true;
        state.merkle_root = [0u8; 32]; // zeros for now...
        state.leaf_count = 0;
        
        // setup subtrees w/ zero hashes. 
        // depth is 20, dont forget.
        let mut current_zero = [0u8; 32];
        for i in 0..20 {
            state.filled_subtrees[i] = current_zero;
            current_zero = poseidon::PoseidonHasherWrapper::hash_multiple_bytes(&[current_zero, current_zero])?;
        }
        state.merkle_root = current_zero; // the actual root of an empty tree. finally.
        
        Ok(())
    }

    // init the vk for the verifier pda
    pub fn initialize_verifier(
        ctx: Context<InitializeVerifier>,
        vk: verifier::VerificationKeyData,
    ) -> Result<()> {
        let verifier_state = &mut ctx.accounts.verifier_state;
        require!(
            ctx.accounts.authority.key() == ctx.accounts.state.authority,
            PrivacyError::Unauthorized
        );
        
        verifier_state.withdraw_vk = vk;
        verifier_state.is_initialized = true;
        Ok(())
    }

    // root history tracker - needed for withdraws
    pub fn initialize_root_history(ctx: Context<InitializeRootHistory>) -> Result<()> {
        let root_history = &mut ctx.accounts.root_history;
        root_history.current_index = 0;
        root_history.roots = [[0u8; 32]; MAX_ROOT_HISTORY];
        Ok(())
    }

    // treasury pda for fees
    pub fn initialize_treasury(_ctx: Context<InitializeTreasury>) -> Result<()> {
        msg!("Treasury initialized");
        Ok(())
    }

    // init economics state
    pub fn initialize_economics(ctx: Context<InitializeEconomics>) -> Result<()> {
        let economic_state = &mut ctx.accounts.economic_state;
        economic_state.authority = ctx.accounts.authority.key();
        economic_state.is_emergency_active = false;
        economic_state.emergency_multiplier = 1;
        economic_state.emergency_fee_multiplier = 1;
        msg!("Economic state initialized");
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        commitment: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        require!(amount >= 1_000_000, PrivacyError::DepositTooSmall); 
        require!(amount <= 1_000_000_000_000, PrivacyError::DepositTooLarge); 

        let state = &mut ctx.accounts.state;
        let root_history = &mut ctx.accounts.root_history;

        // actual tree update. depth 20. 
        let mut current_level_hash = commitment;
        let mut index = state.leaf_count;
        
        // recaculate zeros or pull from state. 
        // HACK: maybe store these in a const later? its slow.
        let mut zeros = [[0u8; 32]; 20];
        let mut z = [0u8; 32];
        for i in 0..20 {
            zeros[i] = z;
            z = poseidon::PoseidonHasherWrapper::hash_multiple_bytes(&[z, z])?;
        }

        for i in 0..20 {
            if (index >> i) & 1 == 0 {
                state.filled_subtrees[i] = current_level_hash;
                current_level_hash = poseidon::PoseidonHasherWrapper::hash_multiple_bytes(&[
                    current_level_hash,
                    zeros[i],
                ])?;
            } else {
                current_level_hash = poseidon::PoseidonHasherWrapper::hash_multiple_bytes(&[
                    state.filled_subtrees[i],
                    current_level_hash,
                ])?;
            }
        }

        state.merkle_root = current_level_hash;
        state.leaf_count += 1;

        // save root so withdraws can check it later
        let idx = (root_history.current_index % MAX_ROOT_HISTORY as u64) as usize;
        root_history.roots[idx] = state.merkle_root;
        root_history.current_index += 1;

        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.depositor.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        msg!("Deposit successful: amount={}, root={:?}", amount, state.merkle_root);
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        proof: verifier::ProofData,
        root: [u8; 32],
        nullifier_hash: [u8; 32],
        recipient: Pubkey,
        relayer: Pubkey,
        fee: u64,
        amount: u64,
    ) -> Result<()> {
        // check field elements. dont want overflows here.
        check_field_element(&root)?;
        check_field_element(&nullifier_hash)?;

        // ensure addresses match the proof sigs
        require_keys_eq!(ctx.accounts.recipient.key(), recipient, PrivacyError::RecipientMismatch);
        require_keys_eq!(ctx.accounts.relayer.key(), relayer, PrivacyError::RelayerMismatch);

        // check historical root
        let root_history = &ctx.accounts.root_history;
        let mut root_valid = false;
        
        // Only check initialized roots up to the limit
        let limit = root_history.current_index.min(MAX_ROOT_HISTORY as u64) as usize;
        for i in 0..limit {
            if root_history.roots[i] == root {
                root_valid = true;
                break;
            }
        }
        require!(root_valid, PrivacyError::InvalidRoot);

        // verify the actual proof. finally working.
        let verifier_state = &ctx.accounts.verifier_state;
        let is_valid = verifier::verify_withdraw_proof(
            verifier_state,
            &proof,
            &root,
            &nullifier_hash,
            &recipient,
            &relayer,
            fee,
            amount,
        )?;
        require!(is_valid, PrivacyError::InvalidProof);

        // mark nullifier so no double spends
        ctx.accounts.nullifier_account.is_used = true;

        // handle the money
        let current_time = Clock::get()?.unix_timestamp;
        let protocol_fee = economics::calculate_protocol_fee_atomic(
            amount, 
            &mut ctx.accounts.economic_state, 
            current_time
        )?;

        // safety check. dont exit if we dont have funds.
        let total_outflow = amount;
        require!(
            ctx.accounts.vault.lamports() >= total_outflow,
            PrivacyError::InsufficientVaultBalance
        );

        let recipient_amount = amount.checked_sub(protocol_fee)
            .and_then(|a| a.checked_sub(fee))
            .ok_or(PrivacyError::ArithmeticError)?;

        // do the transfers. careful!
        **ctx.accounts.vault.try_borrow_mut_lamports()? -= total_outflow;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += recipient_amount;
        **ctx.accounts.relayer.try_borrow_mut_lamports()? += fee;
        **ctx.accounts.protocol_fee_accumulator.try_borrow_mut_lamports()? += protocol_fee;

        msg!("Withdrawal successful: amount={}, fee={}", amount, fee);
        Ok(())
    }
}

use ark_bn254::Fr;
use ark_ff::PrimeField;

pub fn check_field_element(bytes: &[u8; 32]) -> Result<()> {
    // check if bytes are < BN254 prime. 
    // prime is 30644e72e1...f0000001
    let fr = Fr::from_le_bytes_mod_order(bytes);
    let normalized = fr.into_bigint().to_bytes_le();
    let mut normalized_32 = [0u8; 32];
    normalized_32[..normalized.len()].copy_from_slice(&normalized);
    
    require!(
        &normalized_32 == bytes,
        PrivacyError::InvalidFieldElement
    );
    
    Ok(())
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub leaf_count: u64,
    pub filled_subtrees: [[u8; 32]; 20],
    pub is_initialized: bool,
}

impl ProgramState {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + (32 * 20) + 1;
}

#[account]
pub struct RootHistory {
    pub roots: [[u8; 32]; MAX_ROOT_HISTORY],
    pub current_index: u64,
}

impl RootHistory {
    pub const SIZE: usize = 8 + (32 * MAX_ROOT_HISTORY) + 8;
}

#[derive(Accounts)]
pub struct AdminControl<'info> {
    #[account(
        has_one = authority @ PrivacyError::Unauthorized,
    )]
    pub state: Account<'info, ProgramState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeVerifier<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 1024, // vk is big
        seeds = [b"verifier", state.key().as_ref()],
        bump
    )]
    pub verifier_state: Account<'info, verifier::VerifierState>,
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeRootHistory<'info> {
    #[account(
        init,
        payer = authority,
        space = RootHistory::SIZE,
        seeds = [b"root_history"],
        bump
    )]
    pub root_history: Account<'info, RootHistory>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8, // just a marker
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeEconomics<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 1024, // big enough for for now
        seeds = [b"economic_state"],
        bump
    )]
    pub economic_state: Account<'info, economics::EconomicState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,
    #[account(mut, seeds = [b"root_history"], bump)]
    pub root_history: Account<'info, RootHistory>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    /// CHECK: Vault account holding funds
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    proof: verifier::ProofData,
    root: [u8; 32],
    nullifier_hash: [u8; 32],
)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,
    
    /// CHECK: Vault account holding funds
    #[account(
        mut, 
        seeds = [b"vault"], 
        bump
    )]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    
    #[account(mut)]
    pub relayer: Signer<'info>,
    
    // ensure fee pda is actually our pda
    #[account(
        mut, 
        seeds = [b"treasury"], 
        bump
    )]
    pub protocol_fee_accumulator: AccountInfo<'info>,
    
    #[account(
        seeds = [b"verifier", state.key().as_ref()],
        bump
    )]
    pub verifier_state: Account<'info, verifier::VerifierState>,
    
    #[account(
        seeds = [b"root_history"],
        bump
    )]
    pub root_history: Account<'info, RootHistory>,
    
    #[account(
        init,
        payer = relayer,
        space = nullifier_set::NullifierAccount::SIZE,
        seeds = [b"nullifier", nullifier_hash.as_ref()],
        bump
    )]
    pub nullifier_account: Account<'info, nullifier_set::NullifierAccount>,
    
    #[account(
        mut,
        seeds = [b"economic_state"],
        bump
    )]
    pub economic_state: Account<'info, economics::EconomicState>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum PrivacyError {
    #[msg("Recipient address does not match proof")]
    RecipientMismatch,
    #[msg("Relayer address does not match proof")]
    RelayerMismatch,
    #[msg("Invalid ZK proof")]
    InvalidProof,
    #[msg("Nullifier already used")]
    NullifierAlreadyUsed,
    #[msg("Arithmetic overflow or underflow")]
    ArithmeticError,
    #[msg("Deposit amount too small")]
    DepositTooSmall,
    #[msg("Deposit amount too large")]
    DepositTooLarge,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Provided root is not in historical registry")]
    InvalidRoot,
    #[msg("Input is not a valid BN254 field element")]
    InvalidFieldElement,
}

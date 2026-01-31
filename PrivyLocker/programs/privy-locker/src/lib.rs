use inco_lightning::cpi::accounts::Operation;
use inco_lightning::cpi::{e_add, new_euint128};
use inco_lightning::types::Euint128;
use inco_lightning::ID as INCO_LIGHTNING_ID;

declare_id!("4TSoksGkK9L1scc8MBqbPwaNuxM7Jfxj49HGF21pX5CG");

#[program]
pub mod privy_locker {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.user.key();
        user_profile.document_count = 0;
        msg!("User Profile Initialized: {:?}", user_profile.authority);
        Ok(())
    }

    pub fn upload_document(
        ctx: Context<UploadDocument>,
        doc_fingerprint: String,
        encrypted_blob_uri: String,
        encrypted_aadhar_ciphertext: Vec<u8>,
    ) -> Result<()> {
        let document = &mut ctx.accounts.document;
        
        // Initialize confidential fields using Inco CPI
        let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation {
                signer: ctx.accounts.user.to_account_info(),
            },
        );

        // Create encrypted handle for Aadhar number
        let encrypted_aadhar = new_euint128(cpi_ctx, encrypted_aadhar_ciphertext, 0)?;
        
        // Note: Client must call `allow` to grant themselves access if needed.

        document.encrypted_aadhar = encrypted_aadhar;
        document.owner = ctx.accounts.user.key();
        document.doc_fingerprint = doc_fingerprint;
        document.encrypted_blob_uri = encrypted_blob_uri;
        document.created_at = Clock::get()?.unix_timestamp;
        
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.document_count = user_profile.document_count.checked_add(1).unwrap();
        
        msg!("Document Uploaded: {}", document.doc_fingerprint);
        Ok(())
    }

    pub fn create_share_session(
        ctx: Context<CreateShareSession>,
        verifier: Pubkey,
        expires_in_seconds: i64,
    ) -> Result<()> {
        let share_session = &mut ctx.accounts.share_session;
        let document = &ctx.accounts.document;

        // Perform re-encryption (identity addition) to create a unique handle for this session
         let cpi_ctx = CpiContext::new(
            ctx.accounts.inco_lightning_program.to_account_info(),
            Operation {
                signer: ctx.accounts.user.to_account_info(),
            },
        );
        
        // Identity operation (x + 0) to get a new handle to the same underlying value
        // Clone the input Euint128 as e_add expects value, and pass 0 (instruction byte/flags)
        let session_aadhar = e_add(cpi_ctx, document.encrypted_aadhar.clone(), Euint128(0), 0)?;

        // Grant access to the verifier (Client side must call allow)
        // Note: Client must fetch the session_aadhar handle and call `allow` for the verifier.

        share_session.session_aadhar = session_aadhar;
        share_session.owner = ctx.accounts.user.key();
        share_session.document = ctx.accounts.document.key();
        share_session.verifier = verifier;
        share_session.expires_at = Clock::get()?.unix_timestamp + expires_in_seconds;
        share_session.revoked = false;
        
        msg!("Share Session Created for Verifier: {}", verifier);
        Ok(())
    }

    pub fn revoke_share_session(ctx: Context<RevokeShareSession>) -> Result<()> {
        let share_session = &mut ctx.accounts.share_session;
        require!(share_session.owner == ctx.accounts.user.key(), ErrorCode::Unauthorized);
        share_session.revoked = true;
        msg!("Share Session Revoked");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateShareSession<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 16, // +16 for session_aadhar (Euint128)
        seeds = [b"share", document.key().as_ref(), verifier.key().as_ref()], // Simple seed for demo
        bump
    )]
    pub share_session: Account<'info, ShareSession>,
    
    #[account(
        constraint = document.owner == user.key()
    )]
    pub document: Account<'info, Document>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: The verifier pubkey (could be a PDA or user wallet)
    pub verifier: AccountInfo<'info>,

    /// CHECK: Inco Lightning program for confidential operations
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeShareSession<'info> {
    #[account(mut)]
    pub share_session: Account<'info, ShareSession>,
    pub user: Signer<'info>,
}

#[account]
pub struct ShareSession {
    pub owner: Pubkey,
    pub document: Pubkey,
    pub verifier: Pubkey,
    pub expires_at: i64,
    pub revoked: bool,
    pub session_aadhar: Euint128,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}

// Previous structs here... (UserProfile, Document) - ensuring we don't overwrite them
#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + 32 + 8,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UploadDocument<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + 32 + (4 + 64) + (4 + 200) + 8 + 16, // +16 for encrypted_aadhar (Euint128)
        seeds = [b"document", user_profile.key().as_ref(), &user_profile.document_count.to_le_bytes()],
        bump
    )]
    pub document: Account<'info, Document>,
    
    #[account(
        mut,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Inco Lightning program for confidential operations
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub document_count: u64,
}

#[account]
pub struct Document {
    pub owner: Pubkey,
    pub doc_fingerprint: String,
    pub encrypted_blob_uri: String,
    pub created_at: i64,
    pub encrypted_aadhar: Euint128,
}

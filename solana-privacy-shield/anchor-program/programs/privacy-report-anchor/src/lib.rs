use anchor_lang::prelude::*;

declare_id!("PRiVRpT1111111111111111111111111111111111111");

#[program]
pub mod privacy_report_anchor {
    use super::*;

    /// Anchors a privacy report hash on-chain
    /// Creates a PDA account storing the report metadata
    pub fn anchor_report(
        ctx: Context<AnchorReport>,
        analyzed_wallet: Pubkey,
        report_hash: [u8; 32],
    ) -> Result<()> {
        let report = &mut ctx.accounts.anchored_report;
        let clock = Clock::get()?;

        report.reporter = ctx.accounts.reporter.key();
        report.analyzed_wallet = analyzed_wallet;
        report.report_hash = report_hash;
        report.created_at = clock.unix_timestamp;

        msg!("Report anchored successfully");
        msg!("Reporter: {}", report.reporter);
        msg!("Analyzed Wallet: {}", report.analyzed_wallet);
        msg!("Hash: {:?}", report.report_hash);
        msg!("Timestamp: {}", report.created_at);

        Ok(())
    }

    /// Verifies if a report hash exists on-chain
    /// Returns the stored data if found
    pub fn verify_report(ctx: Context<VerifyReport>) -> Result<()> {
        let report = &ctx.accounts.anchored_report;
        
        msg!("Report verified");
        msg!("Reporter: {}", report.reporter);
        msg!("Analyzed Wallet: {}", report.analyzed_wallet);
        msg!("Created At: {}", report.created_at);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(analyzed_wallet: Pubkey, report_hash: [u8; 32])]
pub struct AnchorReport<'info> {
    #[account(
        init,
        payer = reporter,
        space = AnchoredReport::SPACE,
        seeds = [
            b"report",
            reporter.key().as_ref(),
            &report_hash
        ],
        bump
    )]
    pub anchored_report: Account<'info, AnchoredReport>,

    #[account(mut)]
    pub reporter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyReport<'info> {
    pub anchored_report: Account<'info, AnchoredReport>,
}

#[account]
pub struct AnchoredReport {
    /// The wallet that submitted the anchor transaction
    pub reporter: Pubkey,
    /// The wallet that was analyzed
    pub analyzed_wallet: Pubkey,
    /// SHA-256 hash of the report payload
    pub report_hash: [u8; 32],
    /// Unix timestamp when the report was anchored
    pub created_at: i64,
}

impl AnchoredReport {
    /// Account discriminator (8) + reporter (32) + analyzed_wallet (32) + report_hash (32) + created_at (8)
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8;
}

#[error_code]
pub enum PrivacyReportError {
    #[msg("Report hash already anchored by this reporter")]
    DuplicateReport,
    #[msg("Invalid report hash format")]
    InvalidHash,
}

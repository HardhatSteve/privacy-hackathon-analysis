//! Score command implementation

use anyhow::{Context, Result, bail};
use colored::*;
use privacylens_analyzer::{Analyzer, AnalysisConfig, AnalysisDepth, Severity};
use std::path::Path;
use std::fs;

use crate::config::Config;

/// Run the score command
pub async fn run(
    program: &str,
    threshold: Option<u8>,
    fail_below: bool,
    config: &Config,
) -> Result<()> {
    // Determine if input is an address or file path
    let bytecode = if Path::new(program).exists() {
        fs::read(program).with_context(|| format!("Failed to read file: {}", program))?
    } else {
        super::analyze::fetch_program_bytecode_simple(program, &config.solana.rpc_url).await?
    };

    // Quick analysis for score only
    let analysis_config = AnalysisConfig {
        depth: AnalysisDepth::Quick,
        min_severity: Severity::Medium,
        include_recommendations: false,
        include_code_examples: false,
        focus_areas: vec![],
    };

    let analyzer = Analyzer::new();
    let result = analyzer.analyze(&bytecode, &analysis_config)
        .map_err(|e| anyhow::anyhow!("Analysis failed: {}", e))?;

    let score = result.score.overall;

    // Output score
    let score_color = if score >= 80 {
        "green"
    } else if score >= 60 {
        "yellow"
    } else {
        "red"
    };

    println!("{}", format!("{}", score).color(score_color).bold());

    // Check threshold
    if let Some(threshold) = threshold {
        if fail_below && score < threshold {
            eprintln!(
                "{} Score {} is below threshold {}",
                "FAIL:".red().bold(),
                score,
                threshold
            );
            std::process::exit(1);
        }
    }

    Ok(())
}

// Helper to fetch bytecode (simplified version)
pub async fn fetch_program_bytecode_simple(address: &str, rpc_url: &str) -> Result<Vec<u8>> {
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;

    let pubkey = Pubkey::from_str(address)
        .with_context(|| format!("Invalid program address: {}", address))?;

    let client = RpcClient::new(rpc_url.to_string());

    let account = client
        .get_account(&pubkey)
        .with_context(|| format!("Failed to fetch account: {}", address))?;

    Ok(account.data)
}

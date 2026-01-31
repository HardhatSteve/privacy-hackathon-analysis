//! Analyze command implementation

use anyhow::{Context, Result, bail};
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use privacylens_analyzer::{Analyzer, AnalysisConfig, AnalysisDepth, Severity};
use std::path::Path;
use std::fs;

use crate::config::Config;
use crate::output;

/// Run the analyze command
pub async fn run(
    program: &str,
    depth: &str,
    severity: &str,
    output_path: Option<&str>,
    no_upload: bool,
    format: &str,
    config: &Config,
) -> Result<()> {
    // Determine if input is an address or file path
    let bytecode = if Path::new(program).exists() {
        // Load from file
        println!("{} Loading bytecode from file...", "->".blue());
        fs::read(program).with_context(|| format!("Failed to read file: {}", program))?
    } else {
        // Fetch from network
        println!("{} Fetching program from Solana...", "->".blue());
        fetch_program_bytecode(program, &config.solana.rpc_url).await?
    };

    println!("{} Bytecode size: {} bytes", "->".blue(), bytecode.len());

    // Parse analysis configuration
    let analysis_depth = match depth.to_lowercase().as_str() {
        "quick" => AnalysisDepth::Quick,
        "standard" => AnalysisDepth::Standard,
        "deep" => AnalysisDepth::Deep,
        _ => bail!("Invalid depth: {}. Use: quick, standard, deep", depth),
    };

    let min_severity = match severity.to_lowercase().as_str() {
        "critical" => Severity::Critical,
        "high" => Severity::High,
        "medium" => Severity::Medium,
        "low" | "all" => Severity::Low,
        _ => bail!("Invalid severity: {}. Use: critical, high, medium, low, all", severity),
    };

    let analysis_config = AnalysisConfig {
        depth: analysis_depth,
        min_severity,
        include_recommendations: config.analysis.include_recommendations,
        include_code_examples: config.analysis.include_code_examples,
        focus_areas: vec![],
    };

    // Create progress bar
    let pb = if config.output.progress {
        let pb = ProgressBar::new(100);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}% {msg}")
                .unwrap()
                .progress_chars("#>-"),
        );
        Some(pb)
    } else {
        None
    };

    // Run analysis
    if let Some(ref pb) = pb {
        pb.set_message("Parsing bytecode...");
        pb.set_position(10);
    }

    let analyzer = Analyzer::new();

    if let Some(ref pb) = pb {
        pb.set_message("Running detectors...");
        pb.set_position(40);
    }

    let result = analyzer.analyze(&bytecode, &analysis_config)
        .map_err(|e| anyhow::anyhow!("Analysis failed: {}", e))?;

    if let Some(ref pb) = pb {
        pb.set_message("Generating report...");
        pb.set_position(90);
        pb.finish_with_message("Analysis complete!");
    }

    println!();

    // Output results
    match format.to_lowercase().as_str() {
        "json" => {
            let json = serde_json::to_string_pretty(&result)?;
            if let Some(path) = output_path {
                fs::write(path, &json)?;
                println!("{} Results saved to: {}", "->".green(), path);
            } else {
                println!("{}", json);
            }
        }
        "markdown" => {
            let md = output::to_markdown(&result);
            if let Some(path) = output_path {
                fs::write(path, &md)?;
                println!("{} Results saved to: {}", "->".green(), path);
            } else {
                println!("{}", md);
            }
        }
        _ => {
            // Table format (default)
            output::print_table(&result, config.output.colors);
        }
    }

    // Print summary
    println!();
    let score_color = if result.score.overall >= 80 {
        "green"
    } else if result.score.overall >= 60 {
        "yellow"
    } else {
        "red"
    };

    println!(
        "{} Privacy Score: {}",
        "=>".bold(),
        format!("{}", result.score.overall).color(score_color).bold()
    );
    println!(
        "   Vulnerabilities: {} critical, {} high, {} medium, {} low",
        result.vulnerabilities.iter().filter(|v| v.severity == Severity::Critical).count(),
        result.vulnerabilities.iter().filter(|v| v.severity == Severity::High).count(),
        result.vulnerabilities.iter().filter(|v| v.severity == Severity::Medium).count(),
        result.vulnerabilities.iter().filter(|v| v.severity == Severity::Low).count(),
    );
    println!(
        "   Recommendations: {}",
        result.recommendations.len()
    );

    // Upload if enabled
    if !no_upload && config.api.api_key.is_some() {
        println!();
        println!("{} Uploading results to PrivacyLens...", "->".blue());
        // Upload logic would go here
    }

    Ok(())
}

/// Fetch program bytecode from Solana network
async fn fetch_program_bytecode(address: &str, rpc_url: &str) -> Result<Vec<u8>> {
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;

    let pubkey = Pubkey::from_str(address)
        .with_context(|| format!("Invalid program address: {}", address))?;

    let client = RpcClient::new(rpc_url.to_string());

    let account = client
        .get_account(&pubkey)
        .with_context(|| format!("Failed to fetch account: {}", address))?;

    if !account.executable {
        bail!("Account is not an executable program: {}", address);
    }

    Ok(account.data)
}

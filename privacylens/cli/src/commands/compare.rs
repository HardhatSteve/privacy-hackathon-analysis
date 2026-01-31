//! Compare command implementation

use anyhow::Result;
use colored::*;

use crate::config::Config;

/// Run the compare command
pub async fn run(
    _analysis1: &str,
    _analysis2: &str,
    _format: &str,
    _config: &Config,
) -> Result<()> {
    println!("{} Compare feature coming soon!", "Info:".blue().bold());
    println!("This will allow you to compare two analyses and see:");
    println!("  - Score changes");
    println!("  - New vulnerabilities");
    println!("  - Fixed vulnerabilities");
    println!("  - Trend analysis");

    Ok(())
}

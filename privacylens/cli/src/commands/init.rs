//! Init command implementation

use anyhow::{Result, bail};
use colored::*;
use std::io::{self, Write};

use crate::config::{self, Config};

/// Run the init command
pub fn run(force: bool) -> Result<()> {
    let config_path = config::config_path();

    // Check if config already exists
    if config_path.exists() && !force {
        println!(
            "{} Configuration file already exists: {}",
            "Warning:".yellow().bold(),
            config_path.display()
        );
        print!("Overwrite? [y/N] ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;

        if !input.trim().eq_ignore_ascii_case("y") {
            println!("Aborted.");
            return Ok(());
        }
    }

    // Create config directory if needed
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Write default config
    std::fs::write(&config_path, Config::default_toml())?;

    println!(
        "{} Configuration file created: {}",
        "Success:".green().bold(),
        config_path.display()
    );

    println!();
    println!("Next steps:");
    println!("  1. Edit the configuration file to add your API key");
    println!("  2. Run 'privacylens login' to verify your credentials");
    println!("  3. Run 'privacylens analyze <program>' to analyze a program");

    Ok(())
}

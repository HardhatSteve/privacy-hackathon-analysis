//! PrivacyLens CLI - Privacy analysis for Solana programs

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use colored::*;

mod commands;
mod config;
mod output;

use commands::{analyze, init, login, report, score};

/// PrivacyLens - Privacy analysis and scoring for Solana programs
#[derive(Parser)]
#[command(name = "privacylens")]
#[command(author = "PrivacyLens Team")]
#[command(version)]
#[command(about = "Privacy analysis and scoring for Solana programs", long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    /// Increase verbosity (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    verbose: u8,

    /// Output format (table, json, markdown)
    #[arg(short, long, default_value = "table", global = true)]
    format: String,

    /// Configuration file path
    #[arg(short, long, global = true)]
    config: Option<String>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze a Solana program for privacy issues
    Analyze {
        /// Program address or path to bytecode file
        program: String,

        /// Analysis depth: quick, standard, deep
        #[arg(short, long, default_value = "standard")]
        depth: String,

        /// Minimum severity to report: critical, high, medium, low, all
        #[arg(short, long, default_value = "low")]
        severity: String,

        /// Output file path
        #[arg(short, long)]
        output: Option<String>,

        /// Don't upload results to PrivacyLens cloud
        #[arg(long)]
        no_upload: bool,
    },

    /// Get only the privacy score for a program
    Score {
        /// Program address or path to bytecode file
        program: String,

        /// Minimum acceptable score (exit 1 if below)
        #[arg(short, long)]
        threshold: Option<u8>,

        /// Exit with code 1 if score is below threshold
        #[arg(long)]
        fail_below: bool,
    },

    /// Compare two analyses
    Compare {
        /// First analysis ID or program address
        analysis1: String,

        /// Second analysis ID or program address
        analysis2: String,
    },

    /// Watch a program for changes
    Watch {
        /// Program address
        program: String,

        /// Check interval (e.g., "1h", "30m", "1d")
        #[arg(short, long, default_value = "1h")]
        interval: String,
    },

    /// Initialize configuration file
    Init {
        /// Force overwrite existing configuration
        #[arg(short, long)]
        force: bool,
    },

    /// Login to PrivacyLens
    Login {
        /// API key (or use PRIVACYLENS_API_KEY env var)
        #[arg(short, long, env = "PRIVACYLENS_API_KEY")]
        api_key: Option<String>,
    },

    /// Generate a report from analysis
    Report {
        /// Analysis ID
        analysis_id: String,

        /// Report format: pdf, json, markdown, sarif
        #[arg(short, long, default_value = "markdown")]
        format: String,

        /// Output file path
        #[arg(short, long)]
        output: Option<String>,
    },

    /// Show version information
    Version,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Set up logging based on verbosity
    setup_logging(cli.verbose);

    // Load configuration
    let config = config::load_config(cli.config.as_deref())?;

    // Execute command
    let result = match cli.command {
        Commands::Analyze {
            program,
            depth,
            severity,
            output,
            no_upload,
        } => {
            analyze::run(&program, &depth, &severity, output.as_deref(), no_upload, &cli.format, &config).await
        }

        Commands::Score {
            program,
            threshold,
            fail_below,
        } => {
            score::run(&program, threshold, fail_below, &config).await
        }

        Commands::Compare { analysis1, analysis2 } => {
            commands::compare::run(&analysis1, &analysis2, &cli.format, &config).await
        }

        Commands::Watch { program, interval } => {
            commands::watch::run(&program, &interval, &config).await
        }

        Commands::Init { force } => {
            init::run(force)
        }

        Commands::Login { api_key } => {
            login::run(api_key.as_deref(), &config).await
        }

        Commands::Report {
            analysis_id,
            format,
            output,
        } => {
            report::run(&analysis_id, &format, output.as_deref(), &config).await
        }

        Commands::Version => {
            println!("{} {}", "PrivacyLens CLI".bold(), env!("CARGO_PKG_VERSION"));
            println!("Analyzer version: {}", privacylens_analyzer::VERSION);
            Ok(())
        }
    };

    if let Err(e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);
        std::process::exit(1);
    }

    Ok(())
}

fn setup_logging(verbosity: u8) {
    let level = match verbosity {
        0 => log::LevelFilter::Warn,
        1 => log::LevelFilter::Info,
        2 => log::LevelFilter::Debug,
        _ => log::LevelFilter::Trace,
    };

    env_logger::Builder::new()
        .filter_level(level)
        .format_timestamp(None)
        .init();
}

//! Configuration management for PrivacyLens CLI

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// CLI Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// API configuration
    #[serde(default)]
    pub api: ApiConfig,

    /// Analysis defaults
    #[serde(default)]
    pub analysis: AnalysisConfig,

    /// Output preferences
    #[serde(default)]
    pub output: OutputConfig,

    /// Solana RPC configuration
    #[serde(default)]
    pub solana: SolanaConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    /// API endpoint
    #[serde(default = "default_api_url")]
    pub url: String,

    /// API key (can also use PRIVACYLENS_API_KEY env var)
    pub api_key: Option<String>,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            url: default_api_url(),
            api_key: None,
        }
    }
}

fn default_api_url() -> String {
    "https://api.privacylens.io".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisConfig {
    /// Default analysis depth
    #[serde(default = "default_depth")]
    pub depth: String,

    /// Default minimum severity
    #[serde(default = "default_severity")]
    pub min_severity: String,

    /// Include recommendations in output
    #[serde(default = "default_true")]
    pub include_recommendations: bool,

    /// Include code examples in output
    #[serde(default = "default_true")]
    pub include_code_examples: bool,

    /// Patterns to ignore (vulnerability IDs or patterns)
    #[serde(default)]
    pub ignore_patterns: Vec<String>,
}

impl Default for AnalysisConfig {
    fn default() -> Self {
        Self {
            depth: default_depth(),
            min_severity: default_severity(),
            include_recommendations: true,
            include_code_examples: true,
            ignore_patterns: vec![],
        }
    }
}

fn default_depth() -> String {
    "standard".to_string()
}

fn default_severity() -> String {
    "low".to_string()
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    /// Default output format
    #[serde(default = "default_format")]
    pub format: String,

    /// Use colors in output
    #[serde(default = "default_true")]
    pub colors: bool,

    /// Show progress indicators
    #[serde(default = "default_true")]
    pub progress: bool,
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            format: default_format(),
            colors: true,
            progress: true,
        }
    }
}

fn default_format() -> String {
    "table".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolanaConfig {
    /// RPC URL
    #[serde(default = "default_rpc_url")]
    pub rpc_url: String,

    /// Commitment level
    #[serde(default = "default_commitment")]
    pub commitment: String,
}

impl Default for SolanaConfig {
    fn default() -> Self {
        Self {
            rpc_url: default_rpc_url(),
            commitment: default_commitment(),
        }
    }
}

fn default_rpc_url() -> String {
    "https://api.mainnet-beta.solana.com".to_string()
}

fn default_commitment() -> String {
    "confirmed".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            api: ApiConfig::default(),
            analysis: AnalysisConfig::default(),
            output: OutputConfig::default(),
            solana: SolanaConfig::default(),
        }
    }
}

impl Config {
    /// Create default configuration file content
    pub fn default_toml() -> String {
        r#"# PrivacyLens CLI Configuration

[api]
# API endpoint (default: https://api.privacylens.io)
url = "https://api.privacylens.io"
# API key (or use PRIVACYLENS_API_KEY env var)
# api_key = "your-api-key"

[analysis]
# Default analysis depth: quick, standard, deep
depth = "standard"
# Minimum severity to report: critical, high, medium, low, all
min_severity = "low"
# Include recommendations in output
include_recommendations = true
# Include code examples in output
include_code_examples = true
# Patterns to ignore (vulnerability IDs or patterns)
ignore_patterns = []

[output]
# Default output format: table, json, markdown
format = "table"
# Use colors in output
colors = true
# Show progress indicators
progress = true

[solana]
# Solana RPC URL
rpc_url = "https://api.mainnet-beta.solana.com"
# Commitment level
commitment = "confirmed"
"#.to_string()
    }
}

/// Get the default config file path
pub fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("privacylens")
        .join("config.toml")
}

/// Load configuration from file
pub fn load_config(custom_path: Option<&str>) -> Result<Config> {
    let path = custom_path
        .map(PathBuf::from)
        .unwrap_or_else(config_path);

    if path.exists() {
        let content = std::fs::read_to_string(&path)
            .with_context(|| format!("Failed to read config file: {}", path.display()))?;

        toml::from_str(&content)
            .with_context(|| format!("Failed to parse config file: {}", path.display()))
    } else {
        // Return default config if no file exists
        Ok(Config::default())
    }
}

/// Save configuration to file
pub fn save_config(config: &Config, path: &PathBuf) -> Result<()> {
    let content = toml::to_string_pretty(config)
        .context("Failed to serialize config")?;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    std::fs::write(path, content)
        .with_context(|| format!("Failed to write config file: {}", path.display()))
}

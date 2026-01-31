//! Login command implementation

use anyhow::{Result, bail};
use colored::*;
use std::io::{self, Write};

use crate::config::{self, Config};

/// Run the login command
pub async fn run(api_key: Option<&str>, config: &Config) -> Result<()> {
    let key = if let Some(k) = api_key {
        k.to_string()
    } else if let Some(ref k) = config.api.api_key {
        k.clone()
    } else {
        // Prompt for API key
        print!("Enter your API key: ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        input.trim().to_string()
    };

    if key.is_empty() {
        bail!("API key is required. Get one at https://privacylens.io/settings/api-keys");
    }

    // Validate API key with server
    println!("{} Validating API key...", "->".blue());

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/v1/auth/validate", config.api.url))
        .header("X-API-Key", &key)
        .send()
        .await?;

    if response.status().is_success() {
        // Save API key to config
        let config_path = config::config_path();
        let mut new_config = config.clone();
        new_config.api.api_key = Some(key);
        config::save_config(&new_config, &config_path)?;

        println!("{} Successfully logged in!", "Success:".green().bold());
        println!("API key saved to: {}", config_path.display());
    } else {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        bail!("Authentication failed ({}): {}", status, body);
    }

    Ok(())
}

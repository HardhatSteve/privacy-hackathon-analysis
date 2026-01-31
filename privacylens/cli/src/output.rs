//! Output formatting for CLI

use colored::*;
use privacylens_analyzer::{AnalysisResult, Severity};
use tabled::{Table, Tabled, settings::{Style, Modify, object::Rows}};

/// Print analysis results as a formatted table
pub fn print_table(result: &AnalysisResult, use_colors: bool) {
    println!();
    println!("{}", "=".repeat(60));
    println!("{}", " PRIVACYLENS ANALYSIS REPORT ".bold());
    println!("{}", "=".repeat(60));
    println!();

    // Score section
    let score = result.score.overall;
    let score_display = if use_colors {
        if score >= 80 {
            format!("{}", score).green().bold().to_string()
        } else if score >= 60 {
            format!("{}", score).yellow().bold().to_string()
        } else {
            format!("{}", score).red().bold().to_string()
        }
    } else {
        format!("{}", score)
    };

    println!("Privacy Score: {} / 100  (Grade: {})", score_display, result.score.grade());
    println!();

    // Category scores
    println!("{}", "Category Breakdown:".bold());
    println!("  Encryption:      {}/100", result.score.encryption);
    println!("  Access Control:  {}/100", result.score.access_control);
    println!("  Data Privacy:    {}/100", result.score.data_privacy);
    println!("  Side-Channel:    {}/100", result.score.side_channel);
    println!("  PII Handling:    {}/100", result.score.pii_handling);
    println!();

    // Vulnerabilities
    if !result.vulnerabilities.is_empty() {
        println!("{}", "Vulnerabilities Found:".bold());
        println!("{}", "-".repeat(60));

        for vuln in &result.vulnerabilities {
            let severity_display = if use_colors {
                match vuln.severity {
                    Severity::Critical => "CRITICAL".red().bold().to_string(),
                    Severity::High => "HIGH".red().to_string(),
                    Severity::Medium => "MEDIUM".yellow().to_string(),
                    Severity::Low => "LOW".blue().to_string(),
                    Severity::Info => "INFO".white().to_string(),
                }
            } else {
                format!("{:?}", vuln.severity)
            };

            println!();
            println!("[{}] {}", severity_display, vuln.title.bold());
            println!("  Category: {}", vuln.category.as_str());
            println!("  {}", vuln.description);
            if let Some(ref cwe) = vuln.cwe_id {
                println!("  Reference: {}", cwe);
            }
            println!("  Recommendation: {}", vuln.recommendation);
        }
        println!();
    } else {
        println!("{}", "No vulnerabilities found!".green().bold());
        println!();
    }

    // Recommendations
    if !result.recommendations.is_empty() {
        println!("{}", "Recommendations:".bold());
        println!("{}", "-".repeat(60));

        for (i, rec) in result.recommendations.iter().enumerate() {
            println!("{}. {} [{}]", i + 1, rec.title, format!("{:?}", rec.priority).to_lowercase());
            println!("   {}", rec.description);
            println!();
        }
    }

    // Stats
    println!("{}", "-".repeat(60));
    println!(
        "Analyzed {} bytes, {} instructions in {}ms",
        result.stats.bytecode_size,
        result.stats.instructions_analyzed,
        result.stats.duration_ms
    );
    println!("Confidence: {:.0}%", result.score.confidence * 100.0);
}

/// Convert analysis result to markdown
pub fn to_markdown(result: &AnalysisResult) -> String {
    let mut md = String::new();

    md.push_str("# PrivacyLens Analysis Report\n\n");
    md.push_str(&format!("## Privacy Score: {}/100 ({})\n\n", result.score.overall, result.score.grade()));

    // Category breakdown
    md.push_str("### Score Breakdown\n\n");
    md.push_str("| Category | Score |\n");
    md.push_str("|----------|-------|\n");
    md.push_str(&format!("| Encryption | {} |\n", result.score.encryption));
    md.push_str(&format!("| Access Control | {} |\n", result.score.access_control));
    md.push_str(&format!("| Data Privacy | {} |\n", result.score.data_privacy));
    md.push_str(&format!("| Side-Channel | {} |\n", result.score.side_channel));
    md.push_str(&format!("| PII Handling | {} |\n", result.score.pii_handling));
    md.push_str("\n");

    // Vulnerabilities
    if !result.vulnerabilities.is_empty() {
        md.push_str("## Vulnerabilities\n\n");

        for vuln in &result.vulnerabilities {
            md.push_str(&format!("### [{:?}] {}\n\n", vuln.severity, vuln.title));
            md.push_str(&format!("**Category:** {}\n\n", vuln.category.as_str()));
            md.push_str(&format!("{}\n\n", vuln.description));
            md.push_str(&format!("**Recommendation:** {}\n\n", vuln.recommendation));
            if let Some(ref cwe) = vuln.cwe_id {
                md.push_str(&format!("**Reference:** {}\n\n", cwe));
            }
            md.push_str("---\n\n");
        }
    } else {
        md.push_str("## Vulnerabilities\n\nNo vulnerabilities found.\n\n");
    }

    // Recommendations
    if !result.recommendations.is_empty() {
        md.push_str("## Recommendations\n\n");

        for (i, rec) in result.recommendations.iter().enumerate() {
            md.push_str(&format!("{}. **{}** [{:?}]\n", i + 1, rec.title, rec.priority));
            md.push_str(&format!("   {}\n\n", rec.description));
        }
    }

    // Stats
    md.push_str("---\n\n");
    md.push_str(&format!(
        "*Analyzed {} bytes, {} instructions in {}ms. Confidence: {:.0}%*\n",
        result.stats.bytecode_size,
        result.stats.instructions_analyzed,
        result.stats.duration_ms,
        result.score.confidence * 100.0
    ));

    md
}

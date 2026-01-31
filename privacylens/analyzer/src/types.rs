//! Core types for the privacy analyzer

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Severity levels for vulnerabilities
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

impl Severity {
    /// Get the weight for scoring purposes
    pub fn weight(&self) -> i32 {
        match self {
            Severity::Critical => 30,
            Severity::High => 20,
            Severity::Medium => 10,
            Severity::Low => 5,
            Severity::Info => 0,
        }
    }

    /// Get display name
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Critical => "Critical",
            Severity::High => "High",
            Severity::Medium => "Medium",
            Severity::Low => "Low",
            Severity::Info => "Info",
        }
    }
}

/// Vulnerability category types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VulnerabilityCategory {
    PiiExposure,
    TimingAttack,
    StateLeakage,
    TransactionPrivacy,
    AccessControl,
    Cryptographic,
    SideChannel,
    DataAggregation,
    Configuration,
    Other,
}

impl VulnerabilityCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            VulnerabilityCategory::PiiExposure => "PII Exposure",
            VulnerabilityCategory::TimingAttack => "Timing Attack",
            VulnerabilityCategory::StateLeakage => "State Leakage",
            VulnerabilityCategory::TransactionPrivacy => "Transaction Privacy",
            VulnerabilityCategory::AccessControl => "Access Control",
            VulnerabilityCategory::Cryptographic => "Cryptographic",
            VulnerabilityCategory::SideChannel => "Side Channel",
            VulnerabilityCategory::DataAggregation => "Data Aggregation",
            VulnerabilityCategory::Configuration => "Configuration",
            VulnerabilityCategory::Other => "Other",
        }
    }
}

/// A detected vulnerability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vulnerability {
    /// Unique identifier
    pub id: String,
    /// Short title
    pub title: String,
    /// Detailed description
    pub description: String,
    /// Severity level
    pub severity: Severity,
    /// Category
    pub category: VulnerabilityCategory,
    /// Location in bytecode (instruction offset)
    pub location: Option<usize>,
    /// Line range if source map available
    pub line_start: Option<u32>,
    pub line_end: Option<u32>,
    /// Impact description
    pub impact: String,
    /// Attack scenario
    pub attack_scenario: Option<String>,
    /// Recommended fix
    pub recommendation: String,
    /// Vulnerable code example
    pub code_example: Option<String>,
    /// Fixed code example
    pub fixed_example: Option<String>,
    /// CWE identifier
    pub cwe_id: Option<String>,
    /// OWASP identifier
    pub owasp_id: Option<String>,
    /// References
    pub references: Vec<String>,
    /// Detection confidence (0.0 - 1.0)
    pub confidence: f64,
    /// Detector that found this
    pub detector_id: String,
}

/// A recommendation for improving privacy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    /// Unique identifier
    pub id: String,
    /// Title
    pub title: String,
    /// Description
    pub description: String,
    /// Category
    pub category: RecommendationCategory,
    /// Priority
    pub priority: Priority,
    /// Implementation effort
    pub effort: Effort,
    /// Expected impact
    pub impact: Impact,
    /// Code example
    pub code_example: Option<String>,
    /// Related vulnerability IDs
    pub related_vulnerability_ids: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RecommendationCategory {
    Encryption,
    AccessControl,
    DataMinimization,
    KeyManagement,
    TimingProtection,
    StateManagement,
    BestPractice,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Effort {
    Easy,
    Medium,
    Hard,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Impact {
    High,
    Medium,
    Low,
}

/// Privacy score breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyScore {
    /// Overall score (0-100)
    pub overall: u8,
    /// Encryption score
    pub encryption: u8,
    /// Access control score
    pub access_control: u8,
    /// Data privacy score
    pub data_privacy: u8,
    /// Side-channel resistance score
    pub side_channel: u8,
    /// PII handling score
    pub pii_handling: u8,
    /// Confidence level (0.0 - 1.0)
    pub confidence: f64,
    /// Percentile compared to similar programs
    pub percentile: Option<f64>,
}

impl PrivacyScore {
    /// Create a new score with default values
    pub fn new() -> Self {
        Self {
            overall: 100,
            encryption: 100,
            access_control: 100,
            data_privacy: 100,
            side_channel: 100,
            pii_handling: 100,
            confidence: 1.0,
            percentile: None,
        }
    }

    /// Get the letter grade
    pub fn grade(&self) -> &'static str {
        match self.overall {
            95..=100 => "A+",
            90..=94 => "A",
            85..=89 => "A-",
            80..=84 => "B+",
            75..=79 => "B",
            70..=74 => "B-",
            65..=69 => "C+",
            60..=64 => "C",
            55..=59 => "C-",
            50..=54 => "D+",
            45..=49 => "D",
            40..=44 => "D-",
            _ => "F",
        }
    }
}

impl Default for PrivacyScore {
    fn default() -> Self {
        Self::new()
    }
}

/// Analysis depth configuration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum AnalysisDepth {
    Quick,
    Standard,
    Deep,
}

impl Default for AnalysisDepth {
    fn default() -> Self {
        Self::Standard
    }
}

/// Analysis configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisConfig {
    /// Analysis depth
    pub depth: AnalysisDepth,
    /// Minimum severity to report
    pub min_severity: Severity,
    /// Focus areas (empty = all)
    pub focus_areas: Vec<VulnerabilityCategory>,
    /// Include recommendations
    pub include_recommendations: bool,
    /// Include code examples
    pub include_code_examples: bool,
}

impl Default for AnalysisConfig {
    fn default() -> Self {
        Self {
            depth: AnalysisDepth::Standard,
            min_severity: Severity::Low,
            focus_areas: vec![],
            include_recommendations: true,
            include_code_examples: true,
        }
    }
}

/// Complete analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    /// Analysis ID
    pub id: String,
    /// Program address
    pub program_address: Option<String>,
    /// Bytecode hash (SHA256)
    pub bytecode_hash: String,
    /// Privacy score
    pub score: PrivacyScore,
    /// Detected vulnerabilities
    pub vulnerabilities: Vec<Vulnerability>,
    /// Recommendations
    pub recommendations: Vec<Recommendation>,
    /// Analysis statistics
    pub stats: AnalysisStats,
    /// Analysis timestamp
    pub analyzed_at: String,
    /// Analyzer version
    pub analyzer_version: String,
}

/// Analysis statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisStats {
    /// Size of analyzed bytecode
    pub bytecode_size: usize,
    /// Number of instructions analyzed
    pub instructions_analyzed: usize,
    /// Analysis duration in milliseconds
    pub duration_ms: u64,
    /// Number of detectors run
    pub detectors_run: usize,
    /// Vulnerability counts by severity
    pub vulnerability_counts: HashMap<String, usize>,
}

impl AnalysisStats {
    pub fn new() -> Self {
        Self {
            bytecode_size: 0,
            instructions_analyzed: 0,
            duration_ms: 0,
            detectors_run: 0,
            vulnerability_counts: HashMap::new(),
        }
    }
}

impl Default for AnalysisStats {
    fn default() -> Self {
        Self::new()
    }
}

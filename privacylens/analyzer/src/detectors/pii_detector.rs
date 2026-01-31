//! PII (Personally Identifiable Information) Exposure Detector

use super::{generate_vuln_id, Detector};
use crate::parser::ParsedProgram;
use crate::types::*;
use regex::Regex;

/// Detector for PII exposure vulnerabilities
pub struct PiiDetector {
    patterns: Vec<PiiPattern>,
}

struct PiiPattern {
    name: &'static str,
    regex: Regex,
    severity: Severity,
    description: &'static str,
}

impl PiiDetector {
    pub fn new() -> Self {
        Self {
            patterns: vec![
                PiiPattern {
                    name: "Email Address",
                    regex: Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap(),
                    severity: Severity::High,
                    description: "Email address pattern found in program data",
                },
                PiiPattern {
                    name: "IP Address",
                    regex: Regex::new(r"\b(?:\d{1,3}\.){3}\d{1,3}\b").unwrap(),
                    severity: Severity::Medium,
                    description: "IP address pattern found in program data",
                },
                PiiPattern {
                    name: "Phone Number",
                    regex: Regex::new(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b").unwrap(),
                    severity: Severity::High,
                    description: "Phone number pattern found in program data",
                },
                PiiPattern {
                    name: "SSN Pattern",
                    regex: Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap(),
                    severity: Severity::Critical,
                    description: "Social Security Number pattern found in program data",
                },
                PiiPattern {
                    name: "Credit Card",
                    regex: Regex::new(r"\b(?:\d{4}[-\s]?){3}\d{4}\b").unwrap(),
                    severity: Severity::Critical,
                    description: "Credit card number pattern found in program data",
                },
            ],
        }
    }

    /// Check data sections for PII patterns
    fn check_data_sections(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        for (section_name, data) in &program.data_sections {
            // Convert data to string for pattern matching
            let data_str = String::from_utf8_lossy(data);

            for pattern in &self.patterns {
                if pattern.regex.is_match(&data_str) {
                    vulnerabilities.push(Vulnerability {
                        id: generate_vuln_id("PII", index),
                        title: format!("{} Exposure in Data Section", pattern.name),
                        description: format!(
                            "{} was detected in the {} section. This data may be visible on-chain and could expose user privacy.",
                            pattern.description, section_name
                        ),
                        severity: pattern.severity,
                        category: VulnerabilityCategory::PiiExposure,
                        location: None,
                        line_start: None,
                        line_end: None,
                        impact: format!(
                            "User {} could be exposed on the public blockchain, leading to privacy breaches and potential identity theft.",
                            pattern.name.to_lowercase()
                        ),
                        attack_scenario: Some(format!(
                            "An attacker could scan the blockchain for {} patterns and correlate them with user transactions.",
                            pattern.name.to_lowercase()
                        )),
                        recommendation: format!(
                            "Remove or encrypt {} data before storing on-chain. Consider using hashing or zero-knowledge proofs for verification without exposure.",
                            pattern.name.to_lowercase()
                        ),
                        code_example: None,
                        fixed_example: None,
                        cwe_id: Some("CWE-359".to_string()),
                        owasp_id: Some("A3:2017".to_string()),
                        references: vec![
                            "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/13-Testing_for_Sensitive_Data_Exposure".to_string()
                        ],
                        confidence: 0.9,
                        detector_id: self.id().to_string(),
                    });
                    index += 1;
                }
            }
        }

        vulnerabilities
    }

    /// Check for unencrypted storage patterns
    fn check_storage_patterns(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100; // Start at 100 to avoid ID conflicts

        // Look for common storage-related syscalls without encryption
        let storage_syscalls = [
            "sol_set_return_data",
            "sol_log_data",
            "sol_log",
        ];

        for symbol in &program.symbols {
            for syscall in &storage_syscalls {
                if symbol.name.contains(syscall) {
                    // Check if encryption is likely used nearby
                    let has_encryption = program.symbols.iter().any(|s| {
                        s.name.contains("encrypt")
                            || s.name.contains("cipher")
                            || s.name.contains("aes")
                            || s.name.contains("chacha")
                    });

                    if !has_encryption {
                        vulnerabilities.push(Vulnerability {
                            id: generate_vuln_id("PII", index),
                            title: "Potentially Unencrypted Data Storage".to_string(),
                            description: format!(
                                "The program uses {} without apparent encryption. Data written to logs or return data may be visible in plain text.",
                                syscall
                            ),
                            severity: Severity::Medium,
                            category: VulnerabilityCategory::PiiExposure,
                            location: Some(symbol.address as usize),
                            line_start: None,
                            line_end: None,
                            impact: "Sensitive user data could be exposed in transaction logs or return data.".to_string(),
                            attack_scenario: Some("An attacker could monitor transaction logs to extract sensitive information.".to_string()),
                            recommendation: "Encrypt sensitive data before logging or returning. Use established encryption libraries.".to_string(),
                            code_example: None,
                            fixed_example: None,
                            cwe_id: Some("CWE-312".to_string()),
                            owasp_id: None,
                            references: vec![],
                            confidence: 0.6,
                            detector_id: self.id().to_string(),
                        });
                        index += 1;
                        break; // Only report once per storage type
                    }
                }
            }
        }

        vulnerabilities
    }
}

impl Default for PiiDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for PiiDetector {
    fn id(&self) -> &'static str {
        "PII"
    }

    fn name(&self) -> &'static str {
        "PII Exposure Detector"
    }

    fn description(&self) -> &'static str {
        "Detects exposure of personally identifiable information in program data and storage patterns"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_data_sections(program));
        vulnerabilities.extend(self.check_storage_patterns(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::PiiExposure]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_pattern() {
        let detector = PiiDetector::new();
        let pattern = &detector.patterns[0];
        assert!(pattern.regex.is_match("test@example.com"));
        assert!(!pattern.regex.is_match("not an email"));
    }

    #[test]
    fn test_ssn_pattern() {
        let detector = PiiDetector::new();
        let pattern = &detector.patterns[3];
        assert!(pattern.regex.is_match("123-45-6789"));
        assert!(!pattern.regex.is_match("123456789"));
    }
}

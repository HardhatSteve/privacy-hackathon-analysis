//! State Leakage Detector

use super::{generate_vuln_id, Detector};
use crate::parser::ParsedProgram;
use crate::types::*;

/// Detector for state leakage vulnerabilities
pub struct StateDetector;

impl StateDetector {
    pub fn new() -> Self {
        Self
    }

    /// Check for exposed internal state
    fn check_exposed_state(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        // Look for patterns suggesting state exposure
        let sensitive_patterns = [
            "internal", "private", "secret", "key", "seed", "nonce",
            "balance", "amount", "counter", "state",
        ];

        for (section_name, data) in &program.data_sections {
            let data_str = String::from_utf8_lossy(data).to_lowercase();

            for pattern in &sensitive_patterns {
                if data_str.contains(pattern) {
                    vulnerabilities.push(Vulnerability {
                        id: generate_vuln_id("STATE", index),
                        title: format!("Potential Sensitive State in {} Section", section_name),
                        description: format!(
                            "The {} section contains data that appears to be sensitive (contains '{}' pattern). If this data is meant to be private, it should not be stored in readable program data.",
                            section_name, pattern
                        ),
                        severity: Severity::Medium,
                        category: VulnerabilityCategory::StateLeakage,
                        location: None,
                        line_start: None,
                        line_end: None,
                        impact: "Internal state or configuration could be exposed to anyone who can read the program's deployed bytecode.".to_string(),
                        attack_scenario: Some("An attacker could read the program bytecode to discover internal configuration, state management details, or embedded secrets.".to_string()),
                        recommendation: "Move sensitive data to program-derived addresses (PDAs) with proper access control, or encrypt sensitive configuration.".to_string(),
                        code_example: None,
                        fixed_example: None,
                        cwe_id: Some("CWE-200".to_string()),
                        owasp_id: None,
                        references: vec![],
                        confidence: 0.5,
                        detector_id: self.id().to_string(),
                    });
                    index += 1;
                    break; // Only report once per pattern per section
                }
            }
        }

        vulnerabilities
    }

    /// Check for missing account validation
    fn check_account_validation(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100;

        // Look for account-related functions without validation
        let account_functions = ["deserialize", "unpack", "load", "from_account"];
        let validation_functions = ["is_signer", "is_writable", "owner", "key", "check"];

        let has_account_loading = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            account_functions.iter().any(|f| name.contains(f))
        });

        let has_validation = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            validation_functions.iter().any(|f| name.contains(f))
        });

        if has_account_loading && !has_validation {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("STATE", index),
                title: "Potential Missing Account Validation".to_string(),
                description: "The program appears to load account data but may lack proper validation of account ownership, signer status, or writability.".to_string(),
                severity: Severity::High,
                category: VulnerabilityCategory::StateLeakage,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Without proper account validation, an attacker could pass in crafted accounts to read or modify state they shouldn't have access to.".to_string(),
                attack_scenario: Some("An attacker could pass in a fake account that looks like a legitimate program account, potentially extracting private state or causing unauthorized state modifications.".to_string()),
                recommendation: "Always validate account ownership, check if required accounts are signers, verify account is writable when needed, and use PDAs to derive expected account addresses.".to_string(),
                code_example: Some("// Vulnerable: No validation\nlet data = MyState::unpack(&account.data.borrow())?;".to_string()),
                fixed_example: Some("// Fixed: With validation\nif account.owner != program_id {\n    return Err(ProgramError::IllegalOwner);\n}\nif !account.is_signer {\n    return Err(ProgramError::MissingRequiredSignature);\n}\nlet data = MyState::unpack(&account.data.borrow())?;".to_string()),
                cwe_id: Some("CWE-284".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.6,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }

    /// Check for cross-program information leakage
    fn check_cross_program_leakage(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 200;

        // Look for CPI (Cross-Program Invocation) patterns
        let has_cpi = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("invoke") || name.contains("cpi")
        });

        // Look for data passing patterns
        let passes_data = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("serialize") || name.contains("pack")
        });

        if has_cpi && passes_data {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("STATE", index),
                title: "Cross-Program Data Exposure".to_string(),
                description: "The program performs cross-program invocations and appears to pass data. Ensure that sensitive information is not inadvertently shared with other programs.".to_string(),
                severity: Severity::Low,
                category: VulnerabilityCategory::StateLeakage,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Sensitive data passed to other programs during CPI could be logged, stored, or mishandled by those programs.".to_string(),
                attack_scenario: Some("A malicious program called via CPI could log or store sensitive data passed to it.".to_string()),
                recommendation: "Only pass the minimum necessary data in CPIs. Consider encrypting sensitive data before passing it to other programs.".to_string(),
                code_example: None,
                fixed_example: None,
                cwe_id: Some("CWE-201".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.4,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }
}

impl Default for StateDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for StateDetector {
    fn id(&self) -> &'static str {
        "STATE"
    }

    fn name(&self) -> &'static str {
        "State Leakage Detector"
    }

    fn description(&self) -> &'static str {
        "Detects potential state leakage vulnerabilities including exposed internal state and cross-program information disclosure"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_exposed_state(program));
        vulnerabilities.extend(self.check_account_validation(program));
        vulnerabilities.extend(self.check_cross_program_leakage(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::StateLeakage]
    }
}

//! Access Control Detector

use super::{generate_vuln_id, Detector};
use crate::parser::ParsedProgram;
use crate::types::*;

/// Detector for access control vulnerabilities
pub struct AccessDetector;

impl AccessDetector {
    pub fn new() -> Self {
        Self
    }

    /// Check for missing signer verification
    fn check_signer_verification(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        // Look for account usage without signer checks
        let has_account_use = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("account") || name.contains("from_account") || name.contains("deserialize")
        });

        let has_signer_check = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("is_signer") || name.contains("signer") || name.contains("require_signer")
        });

        if has_account_use && !has_signer_check {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("ACCESS", index),
                title: "Potential Missing Signer Verification".to_string(),
                description: "The program processes accounts but shows no evidence of verifying that required accounts are signers.".to_string(),
                severity: Severity::Critical,
                category: VulnerabilityCategory::AccessControl,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Without signer verification, anyone could invoke the program and manipulate state that should require authorization.".to_string(),
                attack_scenario: Some("An attacker could call the program without proper authorization, modifying state or draining funds that should be protected.".to_string()),
                recommendation: "Always verify that the appropriate accounts are signers before performing sensitive operations.".to_string(),
                code_example: Some("// Vulnerable: No signer check\nlet authority = next_account_info(account_info_iter)?;\nstate.value = new_value; // Anyone can modify!".to_string()),
                fixed_example: Some("// Fixed: With signer check\nlet authority = next_account_info(account_info_iter)?;\nif !authority.is_signer {\n    return Err(ProgramError::MissingRequiredSignature);\n}\nstate.value = new_value;".to_string()),
                cwe_id: Some("CWE-862".to_string()),
                owasp_id: Some("A5:2017".to_string()),
                references: vec![],
                confidence: 0.7,
                detector_id: self.id().to_string(),
            });
            index += 1;
        }

        vulnerabilities
    }

    /// Check for owner verification
    fn check_owner_verification(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100;

        let has_account_read = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("unpack") || name.contains("deserialize") || name.contains("try_from")
        });

        let has_owner_check = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("owner") || name.contains("check_program_account")
        });

        if has_account_read && !has_owner_check {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("ACCESS", index),
                title: "Potential Missing Owner Verification".to_string(),
                description: "The program reads account data but may not verify account ownership. Accounts passed to the program might be owned by a different program.".to_string(),
                severity: Severity::High,
                category: VulnerabilityCategory::AccessControl,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Without owner verification, an attacker could pass in accounts they control that look like legitimate program accounts.".to_string(),
                attack_scenario: Some("An attacker creates a fake account with crafted data that mimics a legitimate program account, then passes it to the program to bypass access controls.".to_string()),
                recommendation: "Always verify that accounts passed to the program are owned by the expected program.".to_string(),
                code_example: Some("// Vulnerable: No owner check\nlet state = State::unpack(&account.data.borrow())?;".to_string()),
                fixed_example: Some("// Fixed: With owner check\nif account.owner != program_id {\n    return Err(ProgramError::IncorrectProgramId);\n}\nlet state = State::unpack(&account.data.borrow())?;".to_string()),
                cwe_id: Some("CWE-284".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.6,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }

    /// Check for privilege escalation patterns
    fn check_privilege_escalation(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 200;

        // Look for admin/authority modification without proper checks
        let has_authority_update = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            (name.contains("set_authority") || name.contains("update_authority") || name.contains("change_owner"))
        });

        let has_admin_check = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("is_admin") || name.contains("check_authority") || name.contains("validate_authority")
        });

        if has_authority_update && !has_admin_check {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("ACCESS", index),
                title: "Potential Privilege Escalation".to_string(),
                description: "The program appears to allow authority/ownership changes but may lack proper validation of who can perform this operation.".to_string(),
                severity: Severity::Critical,
                category: VulnerabilityCategory::AccessControl,
                location: None,
                line_start: None,
                line_end: None,
                impact: "An attacker could potentially take over authority of program accounts, gaining full control over protected operations.".to_string(),
                attack_scenario: Some("An attacker calls the authority update function without proper authorization, setting themselves as the new authority.".to_string()),
                recommendation: "Implement strict access control for authority changes. Require the current authority to sign, and consider multi-sig for critical operations.".to_string(),
                code_example: None,
                fixed_example: None,
                cwe_id: Some("CWE-269".to_string()),
                owasp_id: Some("A5:2017".to_string()),
                references: vec![],
                confidence: 0.7,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }
}

impl Default for AccessDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for AccessDetector {
    fn id(&self) -> &'static str {
        "ACCESS"
    }

    fn name(&self) -> &'static str {
        "Access Control Detector"
    }

    fn description(&self) -> &'static str {
        "Detects access control vulnerabilities including missing authorization checks and privilege escalation"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_signer_verification(program));
        vulnerabilities.extend(self.check_owner_verification(program));
        vulnerabilities.extend(self.check_privilege_escalation(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::AccessControl]
    }
}

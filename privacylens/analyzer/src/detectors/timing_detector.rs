//! Timing Attack Detector

use super::{generate_vuln_id, Detector};
use crate::parser::{Instruction, ParsedProgram};
use crate::types::*;

/// Detector for timing attack vulnerabilities
pub struct TimingDetector;

impl TimingDetector {
    pub fn new() -> Self {
        Self
    }

    /// Check for non-constant-time comparisons
    fn check_non_constant_time(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        // Look for patterns that suggest early-exit comparisons
        let instructions = &program.instructions;

        for (i, inst) in instructions.iter().enumerate() {
            // Check for comparison followed by conditional branch
            if inst.is_comparison() && i + 1 < instructions.len() {
                let next = &instructions[i + 1];
                if next.is_branch() {
                    // This pattern could indicate early-exit comparison
                    // Check if it's in a loop (look for back-edge)
                    let is_in_loop = self.is_likely_loop(instructions, i);

                    if is_in_loop {
                        vulnerabilities.push(Vulnerability {
                            id: generate_vuln_id("TIMING", index),
                            title: "Potential Non-Constant-Time Comparison".to_string(),
                            description: "A comparison operation followed by a conditional branch was detected in what appears to be a loop. This pattern may leak timing information about the data being compared.".to_string(),
                            severity: Severity::High,
                            category: VulnerabilityCategory::TimingAttack,
                            location: Some(inst.offset),
                            line_start: None,
                            line_end: None,
                            impact: "An attacker could measure timing differences to infer secret values being compared, such as passwords, keys, or other sensitive data.".to_string(),
                            attack_scenario: Some("By measuring the time taken for comparisons, an attacker can determine at which byte a secret value differs from their guess, allowing byte-by-byte recovery of secrets.".to_string()),
                            recommendation: "Use constant-time comparison functions that always compare all bytes regardless of intermediate results. For example, use crypto_verify or similar constant-time primitives.".to_string(),
                            code_example: Some("// Vulnerable: early-exit comparison\nfn compare_secrets(a: &[u8], b: &[u8]) -> bool {\n    for (x, y) in a.iter().zip(b.iter()) {\n        if x != y { return false; } // Early exit leaks timing\n    }\n    true\n}".to_string()),
                            fixed_example: Some("// Fixed: constant-time comparison\nfn compare_secrets(a: &[u8], b: &[u8]) -> bool {\n    let mut result = 0u8;\n    for (x, y) in a.iter().zip(b.iter()) {\n        result |= x ^ y; // No early exit\n    }\n    result == 0\n}".to_string()),
                            cwe_id: Some("CWE-208".to_string()),
                            owasp_id: None,
                            references: vec![
                                "https://codahale.com/a-lesson-in-timing-attacks/".to_string(),
                                "https://cwe.mitre.org/data/definitions/208.html".to_string(),
                            ],
                            confidence: 0.7,
                            detector_id: self.id().to_string(),
                        });
                        index += 1;
                    }
                }
            }
        }

        vulnerabilities
    }

    /// Check if instruction is likely in a loop
    fn is_likely_loop(&self, instructions: &[Instruction], index: usize) -> bool {
        // Look for backward branches which indicate loops
        for i in index..std::cmp::min(index + 20, instructions.len()) {
            let inst = &instructions[i];
            if inst.is_branch() && inst.off < 0 {
                return true;
            }
        }
        false
    }

    /// Check for time-dependent operations
    fn check_time_dependent(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100;

        // Check for symbols that suggest time-based operations
        let time_functions = ["clock", "time", "timestamp", "slot", "unix_time"];

        for symbol in &program.symbols {
            let name_lower = symbol.name.to_lowercase();
            for time_fn in &time_functions {
                if name_lower.contains(time_fn) {
                    // Check if this is used in access control
                    let near_auth = program.symbols.iter().any(|s| {
                        let n = s.name.to_lowercase();
                        (n.contains("auth") || n.contains("check") || n.contains("verify"))
                            && (s.address as i64 - symbol.address as i64).abs() < 1000
                    });

                    if near_auth {
                        vulnerabilities.push(Vulnerability {
                            id: generate_vuln_id("TIMING", index),
                            title: "Time-Dependent Access Control".to_string(),
                            description: format!(
                                "A time-related function ({}) appears to be used near access control logic. Time-based access control can be manipulated by validators or exploited through timing attacks.",
                                symbol.name
                            ),
                            severity: Severity::Medium,
                            category: VulnerabilityCategory::TimingAttack,
                            location: Some(symbol.address as usize),
                            line_start: None,
                            line_end: None,
                            impact: "Access control decisions based on time can be manipulated or predicted by attackers, especially since blockchain time is not perfectly accurate.".to_string(),
                            attack_scenario: Some("A validator could manipulate the slot timestamp, or an attacker could carefully time their transaction to exploit race conditions in time-based logic.".to_string()),
                            recommendation: "Avoid using time for security-critical decisions. If time must be used, add buffer periods and don't rely on exact timing.".to_string(),
                            code_example: None,
                            fixed_example: None,
                            cwe_id: Some("CWE-367".to_string()),
                            owasp_id: None,
                            references: vec![],
                            confidence: 0.6,
                            detector_id: self.id().to_string(),
                        });
                        index += 1;
                    }
                    break;
                }
            }
        }

        vulnerabilities
    }
}

impl Default for TimingDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for TimingDetector {
    fn id(&self) -> &'static str {
        "TIMING"
    }

    fn name(&self) -> &'static str {
        "Timing Attack Detector"
    }

    fn description(&self) -> &'static str {
        "Detects potential timing attack vulnerabilities including non-constant-time operations and time-dependent logic"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_non_constant_time(program));
        vulnerabilities.extend(self.check_time_dependent(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::TimingAttack]
    }
}

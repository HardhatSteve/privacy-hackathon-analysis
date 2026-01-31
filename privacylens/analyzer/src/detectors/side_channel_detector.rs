//! Side Channel Detector

use super::{generate_vuln_id, Detector};
use crate::parser::ParsedProgram;
use crate::types::*;

/// Detector for side-channel vulnerabilities
pub struct SideChannelDetector;

impl SideChannelDetector {
    pub fn new() -> Self {
        Self
    }

    /// Check for memory access patterns that could leak information
    fn check_memory_access_patterns(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        // Look for variable memory access in loops (table lookups)
        let mut in_potential_loop = false;
        let mut loop_start = 0;
        let mut memory_accesses_in_loop = Vec::new();

        for (i, inst) in program.instructions.iter().enumerate() {
            // Detect loop start (backward branch target)
            if inst.is_branch() && inst.off < 0 {
                in_potential_loop = true;
                loop_start = i;
            }

            // Track memory accesses in loops
            if in_potential_loop && inst.is_memory_access() {
                memory_accesses_in_loop.push(inst.offset);
            }

            // End of potential loop region
            if in_potential_loop && i > loop_start + 50 {
                if memory_accesses_in_loop.len() > 3 {
                    vulnerabilities.push(Vulnerability {
                        id: generate_vuln_id("SIDE", index),
                        title: "Potential Cache-Timing Side Channel".to_string(),
                        description: "Multiple memory accesses detected in what appears to be a loop structure. If these accesses are based on secret data, they could leak information through cache timing.".to_string(),
                        severity: Severity::Medium,
                        category: VulnerabilityCategory::SideChannel,
                        location: Some(loop_start),
                        line_start: None,
                        line_end: None,
                        impact: "An attacker monitoring cache timing could infer secret values based on which memory locations are accessed.".to_string(),
                        attack_scenario: Some("Table lookups indexed by secret values (like S-boxes in cryptography) can leak the secret through cache timing analysis.".to_string()),
                        recommendation: "Use constant-time implementations that don't have secret-dependent memory access patterns. Consider bitsliced implementations for cryptographic operations.".to_string(),
                        code_example: Some("// Vulnerable: Table lookup with secret index\nlet value = SBOX[secret_byte as usize];".to_string()),
                        fixed_example: Some("// Fixed: Constant-time lookup\nlet mut value = 0u8;\nfor (i, &sbox_val) in SBOX.iter().enumerate() {\n    let mask = ((i as u8) == secret_byte) as u8 * 0xFF;\n    value |= sbox_val & mask;\n}".to_string()),
                        cwe_id: Some("CWE-208".to_string()),
                        owasp_id: None,
                        references: vec![
                            "https://www.bearssl.org/constanttime.html".to_string(),
                        ],
                        confidence: 0.5,
                        detector_id: self.id().to_string(),
                    });
                    index += 1;
                }
                in_potential_loop = false;
                memory_accesses_in_loop.clear();
            }
        }

        vulnerabilities
    }

    /// Check for branching on secrets
    fn check_secret_branching(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100;

        // Look for symbols suggesting secret-dependent branching
        let secret_indicators = ["secret", "key", "password", "private"];
        let branch_indicators = ["if", "match", "switch", "branch"];

        let has_secrets = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            secret_indicators.iter().any(|ind| name.contains(ind))
        });

        let has_conditional = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            branch_indicators.iter().any(|ind| name.contains(ind))
        });

        // Count branch instructions
        let branch_count = program.instructions.iter().filter(|i| i.is_branch()).count();

        if has_secrets && branch_count > 10 {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("SIDE", index),
                title: "Potential Secret-Dependent Branching".to_string(),
                description: "The program handles secrets and has significant branching logic. If branches depend on secret values, this could leak information through timing differences.".to_string(),
                severity: Severity::Medium,
                category: VulnerabilityCategory::SideChannel,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Different branches may take different amounts of time to execute, allowing attackers to infer information about secrets.".to_string(),
                attack_scenario: Some("An attacker measures execution time across many operations to statistically determine which branches are taken based on secret inputs.".to_string()),
                recommendation: "Implement constant-time algorithms that always execute the same operations regardless of secret values.".to_string(),
                code_example: Some("// Vulnerable: Different branches for different secrets\nif secret[i] == guess {\n    return true; // Early return\n}".to_string()),
                fixed_example: Some("// Fixed: Same operations regardless of match\nlet mut result = 0;\nfor i in 0..length {\n    result |= secret[i] ^ guess[i];\n}\nresult == 0 // Only branch at the end".to_string()),
                cwe_id: Some("CWE-208".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.4,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }

    /// Check for compute unit (gas) variations
    fn check_compute_variations(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 200;

        // Look for variable-length operations
        let variable_ops = ["loop", "iter", "while", "for"];

        let has_variable_iteration = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            variable_ops.iter().any(|op| name.contains(op))
        });

        let handles_secrets = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            ["encrypt", "decrypt", "sign", "verify", "hash"].iter().any(|op| name.contains(op))
        });

        if has_variable_iteration && handles_secrets {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("SIDE", index),
                title: "Potential Compute Unit Leakage".to_string(),
                description: "The program appears to have variable-length iterations while handling cryptographic operations. The number of compute units used could leak information about the input.".to_string(),
                severity: Severity::Low,
                category: VulnerabilityCategory::SideChannel,
                location: None,
                line_start: None,
                line_end: None,
                impact: "On-chain compute unit usage is publicly visible. Variable compute based on secrets could reveal information about those secrets.".to_string(),
                attack_scenario: Some("An attacker analyzes the compute units used by transactions to infer information about encrypted inputs or keys.".to_string()),
                recommendation: "Ensure cryptographic operations use constant compute regardless of input values. Pad operations to fixed compute unit counts if necessary.".to_string(),
                code_example: None,
                fixed_example: None,
                cwe_id: Some("CWE-208".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.4,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }
}

impl Default for SideChannelDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for SideChannelDetector {
    fn id(&self) -> &'static str {
        "SIDE"
    }

    fn name(&self) -> &'static str {
        "Side Channel Detector"
    }

    fn description(&self) -> &'static str {
        "Detects potential side-channel vulnerabilities including cache timing, branching leaks, and compute unit variations"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_memory_access_patterns(program));
        vulnerabilities.extend(self.check_secret_branching(program));
        vulnerabilities.extend(self.check_compute_variations(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::SideChannel]
    }
}

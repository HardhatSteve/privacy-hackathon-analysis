//! Main analyzer module

use crate::detectors::DetectorRegistry;
use crate::parser::Parser;
use crate::scorer::PrivacyScorer;
use crate::types::*;
use std::time::Instant;

/// Main analyzer for Solana programs
pub struct Analyzer {
    detectors: DetectorRegistry,
    scorer: PrivacyScorer,
}

impl Analyzer {
    /// Create a new analyzer
    pub fn new() -> Self {
        Self {
            detectors: DetectorRegistry::new(),
            scorer: PrivacyScorer::new(),
        }
    }

    /// Analyze bytecode with the given configuration
    pub fn analyze(&self, bytecode: &[u8], config: &AnalysisConfig) -> Result<AnalysisResult, String> {
        let start = Instant::now();

        // Parse the bytecode
        let program = Parser::parse(bytecode)
            .map_err(|e| format!("Failed to parse bytecode: {}", e))?;

        // Get applicable detectors
        let detectors = self.detectors.for_categories(&config.focus_areas);

        // Run detection
        let mut vulnerabilities: Vec<Vulnerability> = Vec::new();
        for detector in &detectors {
            let found = detector.detect(&program, config);
            vulnerabilities.extend(found);
        }

        // Filter by severity
        vulnerabilities.retain(|v| v.severity >= config.min_severity);

        // Sort by severity (most severe first)
        vulnerabilities.sort_by(|a, b| b.severity.cmp(&a.severity));

        // Calculate score
        let score = self.scorer.calculate(&vulnerabilities, &program);

        // Generate recommendations if requested
        let recommendations = if config.include_recommendations {
            self.generate_recommendations(&vulnerabilities)
        } else {
            Vec::new()
        };

        // Build statistics
        let mut vulnerability_counts = std::collections::HashMap::new();
        for v in &vulnerabilities {
            *vulnerability_counts.entry(v.severity.as_str().to_string()).or_insert(0) += 1;
        }

        let stats = AnalysisStats {
            bytecode_size: bytecode.len(),
            instructions_analyzed: program.instructions.len(),
            duration_ms: start.elapsed().as_millis() as u64,
            detectors_run: detectors.len(),
            vulnerability_counts,
        };

        Ok(AnalysisResult {
            id: generate_id(),
            program_address: None,
            bytecode_hash: program.hash,
            score,
            vulnerabilities,
            recommendations,
            stats,
            analyzed_at: current_timestamp(),
            analyzer_version: crate::VERSION.to_string(),
        })
    }

    /// Generate recommendations based on vulnerabilities
    fn generate_recommendations(&self, vulnerabilities: &[Vulnerability]) -> Vec<Recommendation> {
        let mut recommendations = Vec::new();
        let mut index = 0;

        // Group vulnerabilities by category
        let mut by_category: std::collections::HashMap<VulnerabilityCategory, Vec<&Vulnerability>> =
            std::collections::HashMap::new();
        for v in vulnerabilities {
            by_category.entry(v.category).or_default().push(v);
        }

        // Generate category-specific recommendations
        for (category, vulns) in by_category {
            let (title, description, rec_category, code_example) = match category {
                VulnerabilityCategory::PiiExposure => (
                    "Implement Data Encryption",
                    "Encrypt all personally identifiable information before storing on-chain. Consider using client-side encryption or zero-knowledge proofs.",
                    RecommendationCategory::Encryption,
                    Some("// Use encryption for sensitive data\nlet encrypted = encrypt_data(&pii_data, &encryption_key)?;\nstore_encrypted(&encrypted);"),
                ),
                VulnerabilityCategory::TimingAttack => (
                    "Use Constant-Time Operations",
                    "Replace timing-sensitive operations with constant-time implementations to prevent timing side-channel attacks.",
                    RecommendationCategory::TimingProtection,
                    Some("// Use constant-time comparison\nuse subtle::ConstantTimeEq;\nif a.ct_eq(&b).into() { ... }"),
                ),
                VulnerabilityCategory::AccessControl => (
                    "Strengthen Access Control",
                    "Implement comprehensive access control checks including signer verification, owner checks, and authority validation.",
                    RecommendationCategory::AccessControl,
                    Some("// Always validate signer and owner\nrequire!(authority.is_signer, ErrorCode::Unauthorized);\nrequire!(account.owner == program_id, ErrorCode::InvalidOwner);"),
                ),
                VulnerabilityCategory::Cryptographic => (
                    "Improve Cryptographic Implementation",
                    "Use modern, well-audited cryptographic libraries and follow best practices for key management and algorithm selection.",
                    RecommendationCategory::KeyManagement,
                    Some("// Use strong encryption with proper nonce handling\nlet nonce = generate_random_nonce();\nlet ciphertext = aes_gcm_encrypt(&key, &nonce, &plaintext);"),
                ),
                VulnerabilityCategory::StateLeakage => (
                    "Minimize State Exposure",
                    "Review all stored state for sensitive data exposure. Use PDAs with proper seeds and consider encrypting sensitive fields.",
                    RecommendationCategory::StateManagement,
                    None,
                ),
                VulnerabilityCategory::SideChannel => (
                    "Mitigate Side-Channel Risks",
                    "Implement constant-time algorithms and ensure that compute unit usage doesn't reveal information about secrets.",
                    RecommendationCategory::TimingProtection,
                    None,
                ),
                _ => (
                    "Review Security Practices",
                    "Review the identified vulnerabilities and implement appropriate mitigations.",
                    RecommendationCategory::BestPractice,
                    None,
                ),
            };

            let priority = if vulns.iter().any(|v| v.severity == Severity::Critical) {
                Priority::Critical
            } else if vulns.iter().any(|v| v.severity == Severity::High) {
                Priority::High
            } else if vulns.iter().any(|v| v.severity == Severity::Medium) {
                Priority::Medium
            } else {
                Priority::Low
            };

            let effort = if vulns.len() > 5 { Effort::Hard } else if vulns.len() > 2 { Effort::Medium } else { Effort::Easy };
            let impact = if vulns.iter().any(|v| v.severity >= Severity::High) { Impact::High } else { Impact::Medium };

            recommendations.push(Recommendation {
                id: format!("REC_{:04}", index),
                title: title.to_string(),
                description: description.to_string(),
                category: rec_category,
                priority,
                effort,
                impact,
                code_example: code_example.map(|s| s.to_string()),
                related_vulnerability_ids: vulns.iter().map(|v| v.id.clone()).collect(),
            });
            index += 1;
        }

        // Add general best practice recommendations
        if vulnerabilities.is_empty() {
            recommendations.push(Recommendation {
                id: format!("REC_{:04}", index),
                title: "Maintain Security Practices".to_string(),
                description: "Continue following security best practices and consider regular audits to maintain your strong privacy posture.".to_string(),
                category: RecommendationCategory::BestPractice,
                priority: Priority::Low,
                effort: Effort::Easy,
                impact: Impact::Medium,
                code_example: None,
                related_vulnerability_ids: vec![],
            });
        }

        recommendations
    }
}

impl Default for Analyzer {
    fn default() -> Self {
        Self::new()
    }
}

/// Generate a random ID
fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:x}", timestamp)
}

/// Get current timestamp as ISO string
fn current_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap();
    let secs = duration.as_secs();
    format!("{}", secs)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyzer_creation() {
        let analyzer = Analyzer::new();
        assert!(analyzer.detectors.count() > 0);
    }

    #[test]
    fn test_analyze_empty_bytecode() {
        let analyzer = Analyzer::new();
        let config = AnalysisConfig::default();
        let result = analyzer.analyze(&[], &config);
        // Empty bytecode should still parse (as raw)
        assert!(result.is_ok());
    }

    #[test]
    fn test_analyze_minimal_bytecode() {
        let analyzer = Analyzer::new();
        let config = AnalysisConfig::default();
        // Minimal BPF exit instruction
        let bytecode = vec![0x95, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        let result = analyzer.analyze(&bytecode, &config);
        assert!(result.is_ok());
        let analysis = result.unwrap();
        assert!(analysis.score.overall <= 100);
    }
}

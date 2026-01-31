//! Privacy scoring algorithm

use crate::parser::ParsedProgram;
use crate::types::*;
use std::collections::HashMap;

/// Privacy scorer that calculates scores based on vulnerabilities and best practices
pub struct PrivacyScorer {
    /// Weights for different score components
    weights: ScoreWeights,
}

struct ScoreWeights {
    vulnerability: f64,
    best_practices: f64,
    pii_handling: f64,
}

impl Default for ScoreWeights {
    fn default() -> Self {
        Self {
            vulnerability: 0.50, // 50% weight
            best_practices: 0.30, // 30% weight
            pii_handling: 0.20, // 20% weight
        }
    }
}

impl PrivacyScorer {
    /// Create a new scorer
    pub fn new() -> Self {
        Self {
            weights: ScoreWeights::default(),
        }
    }

    /// Calculate the privacy score
    pub fn calculate(&self, vulnerabilities: &[Vulnerability], program: &ParsedProgram) -> PrivacyScore {
        // Calculate vulnerability score (start at 100, deduct for issues)
        let vuln_score = self.calculate_vulnerability_score(vulnerabilities);

        // Calculate best practices score
        let (bp_score, bp_breakdown) = self.calculate_best_practices_score(program);

        // Calculate PII handling score
        let pii_score = self.calculate_pii_score(vulnerabilities, program);

        // Calculate category scores
        let category_scores = self.calculate_category_scores(vulnerabilities);

        // Calculate weighted overall score
        let overall = (
            vuln_score as f64 * self.weights.vulnerability +
            bp_score as f64 * self.weights.best_practices +
            pii_score as f64 * self.weights.pii_handling
        ).round() as u8;

        // Ensure score is in valid range
        let overall = overall.min(100);

        // Calculate confidence based on analysis depth
        let confidence = self.calculate_confidence(vulnerabilities, program);

        PrivacyScore {
            overall,
            encryption: category_scores.get("encryption").copied().unwrap_or(100),
            access_control: category_scores.get("access_control").copied().unwrap_or(100),
            data_privacy: category_scores.get("data_privacy").copied().unwrap_or(100),
            side_channel: category_scores.get("side_channel").copied().unwrap_or(100),
            pii_handling: pii_score,
            confidence,
            percentile: None, // Set later when comparing to database
        }
    }

    /// Calculate score based on vulnerabilities
    fn calculate_vulnerability_score(&self, vulnerabilities: &[Vulnerability]) -> u8 {
        let mut score: i32 = 100;

        for vuln in vulnerabilities {
            let deduction = vuln.severity.weight();
            score -= deduction;
        }

        // Clamp to valid range
        score.max(0).min(100) as u8
    }

    /// Calculate best practices score
    fn calculate_best_practices_score(&self, program: &ParsedProgram) -> (u8, HashMap<String, bool>) {
        let mut score = 0u8;
        let mut breakdown = HashMap::new();

        let symbols: Vec<String> = program.symbols.iter()
            .map(|s| s.name.to_lowercase())
            .collect();

        // Check for encryption usage (+15 points)
        let has_encryption = ["aes", "chacha", "encrypt", "cipher"]
            .iter()
            .any(|e| symbols.iter().any(|s| s.contains(e)));
        breakdown.insert("encryption".to_string(), has_encryption);
        if has_encryption {
            score += 15;
        }

        // Check for access control (+10 points)
        let has_access_control = ["is_signer", "owner", "authority", "check"]
            .iter()
            .any(|e| symbols.iter().any(|s| s.contains(e)));
        breakdown.insert("access_control".to_string(), has_access_control);
        if has_access_control {
            score += 10;
        }

        // Check for data validation (+10 points)
        let has_validation = ["validate", "verify", "check", "require"]
            .iter()
            .any(|e| symbols.iter().any(|s| s.contains(e)));
        breakdown.insert("data_validation".to_string(), has_validation);
        if has_validation {
            score += 10;
        }

        // Check for secure key management (+10 points)
        let has_key_management = ["derive", "pda", "seed", "keypair"]
            .iter()
            .any(|e| symbols.iter().any(|s| s.contains(e)));
        breakdown.insert("key_management".to_string(), has_key_management);
        if has_key_management {
            score += 10;
        }

        // Check for privacy-preserving patterns (+5 points)
        let has_privacy_patterns = ["zk", "proof", "commit", "blind"]
            .iter()
            .any(|e| symbols.iter().any(|s| s.contains(e)));
        breakdown.insert("privacy_patterns".to_string(), has_privacy_patterns);
        if has_privacy_patterns {
            score += 5;
        }

        // Normalize to 0-100 (max possible is 50)
        let normalized = ((score as f64 / 50.0) * 100.0).min(100.0) as u8;

        (normalized, breakdown)
    }

    /// Calculate PII handling score
    fn calculate_pii_score(&self, vulnerabilities: &[Vulnerability], program: &ParsedProgram) -> u8 {
        // Check for PII-related vulnerabilities
        let pii_vulns: Vec<_> = vulnerabilities.iter()
            .filter(|v| v.category == VulnerabilityCategory::PiiExposure)
            .collect();

        if pii_vulns.is_empty() {
            // No PII vulnerabilities found
            return 100;
        }

        // Check if PII is encrypted
        let symbols: Vec<String> = program.symbols.iter()
            .map(|s| s.name.to_lowercase())
            .collect();

        let has_pii_encryption = symbols.iter().any(|s| {
            (s.contains("pii") || s.contains("personal") || s.contains("user")) &&
            (s.contains("encrypt") || s.contains("hash"))
        });

        if has_pii_encryption {
            return 80; // PII exists but is encrypted
        }

        // PII exposed - deduct based on severity
        let mut score = 100i32;
        for vuln in &pii_vulns {
            score -= vuln.severity.weight();
        }

        score.max(0) as u8
    }

    /// Calculate per-category scores
    fn calculate_category_scores(&self, vulnerabilities: &[Vulnerability]) -> HashMap<String, u8> {
        let mut scores = HashMap::new();

        // Group vulnerabilities by category
        let mut by_category: HashMap<VulnerabilityCategory, Vec<&Vulnerability>> = HashMap::new();
        for v in vulnerabilities {
            by_category.entry(v.category).or_default().push(v);
        }

        // Calculate score for each category
        let categories = [
            ("encryption", VulnerabilityCategory::Cryptographic),
            ("access_control", VulnerabilityCategory::AccessControl),
            ("data_privacy", VulnerabilityCategory::StateLeakage),
            ("side_channel", VulnerabilityCategory::SideChannel),
            ("pii", VulnerabilityCategory::PiiExposure),
            ("timing", VulnerabilityCategory::TimingAttack),
        ];

        for (name, category) in &categories {
            let vulns = by_category.get(category).map(|v| v.as_slice()).unwrap_or(&[]);
            let mut score = 100i32;
            for v in vulns {
                score -= v.severity.weight();
            }
            scores.insert(name.to_string(), score.max(0).min(100) as u8);
        }

        scores
    }

    /// Calculate confidence level of the analysis
    fn calculate_confidence(&self, vulnerabilities: &[Vulnerability], program: &ParsedProgram) -> f64 {
        let mut confidence = 1.0;

        // Reduce confidence if program is very small (might be incomplete)
        if program.bytecode.len() < 1000 {
            confidence *= 0.8;
        }

        // Reduce confidence if few instructions analyzed
        if program.instructions.len() < 100 {
            confidence *= 0.9;
        }

        // Reduce confidence if many low-confidence detections
        let low_confidence_count = vulnerabilities.iter()
            .filter(|v| v.confidence < 0.5)
            .count();
        if low_confidence_count > 0 {
            confidence *= 1.0 - (low_confidence_count as f64 * 0.05);
        }

        // Increase confidence if we have symbol information
        if !program.symbols.is_empty() {
            confidence = (confidence * 1.1).min(1.0);
        }

        confidence.max(0.0).min(1.0)
    }
}

impl Default for PrivacyScorer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scorer_creation() {
        let scorer = PrivacyScorer::new();
        assert!(scorer.weights.vulnerability > 0.0);
    }

    #[test]
    fn test_vulnerability_score_no_vulns() {
        let scorer = PrivacyScorer::new();
        let score = scorer.calculate_vulnerability_score(&[]);
        assert_eq!(score, 100);
    }

    #[test]
    fn test_vulnerability_score_with_critical() {
        let scorer = PrivacyScorer::new();
        let vulns = vec![Vulnerability {
            id: "test".to_string(),
            title: "Test".to_string(),
            description: "Test".to_string(),
            severity: Severity::Critical,
            category: VulnerabilityCategory::Other,
            location: None,
            line_start: None,
            line_end: None,
            impact: "Test".to_string(),
            attack_scenario: None,
            recommendation: "Test".to_string(),
            code_example: None,
            fixed_example: None,
            cwe_id: None,
            owasp_id: None,
            references: vec![],
            confidence: 0.9,
            detector_id: "test".to_string(),
        }];
        let score = scorer.calculate_vulnerability_score(&vulns);
        assert_eq!(score, 70); // 100 - 30 (critical weight)
    }
}

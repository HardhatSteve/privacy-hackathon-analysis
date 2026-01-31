//! Privacy pattern definitions and matching

use serde::{Deserialize, Serialize};

/// A privacy pattern (good practice or anti-pattern)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyPattern {
    /// Pattern ID
    pub id: String,
    /// Pattern name
    pub name: String,
    /// Description
    pub description: String,
    /// Whether this is a good pattern (true) or anti-pattern (false)
    pub is_good_pattern: bool,
    /// Category
    pub category: PatternCategory,
    /// Detection hints
    pub detection_hints: Vec<String>,
    /// Related CWE IDs
    pub cwe_ids: Vec<String>,
    /// Recommendation
    pub recommendation: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PatternCategory {
    Encryption,
    AccessControl,
    DataMinimization,
    KeyManagement,
    TimingProtection,
    ZeroKnowledge,
    StateManagement,
}

/// Collection of known privacy patterns
pub struct PatternLibrary {
    patterns: Vec<PrivacyPattern>,
}

impl PatternLibrary {
    pub fn new() -> Self {
        Self {
            patterns: Self::load_builtin_patterns(),
        }
    }

    /// Get all patterns
    pub fn all(&self) -> &[PrivacyPattern] {
        &self.patterns
    }

    /// Get good patterns only
    pub fn good_patterns(&self) -> Vec<&PrivacyPattern> {
        self.patterns.iter().filter(|p| p.is_good_pattern).collect()
    }

    /// Get anti-patterns only
    pub fn anti_patterns(&self) -> Vec<&PrivacyPattern> {
        self.patterns.iter().filter(|p| !p.is_good_pattern).collect()
    }

    /// Get patterns by category
    pub fn by_category(&self, category: PatternCategory) -> Vec<&PrivacyPattern> {
        self.patterns.iter().filter(|p| p.category == category).collect()
    }

    /// Load builtin patterns
    fn load_builtin_patterns() -> Vec<PrivacyPattern> {
        vec![
            // Good Patterns
            PrivacyPattern {
                id: "ENC001".to_string(),
                name: "AES-GCM Encryption".to_string(),
                description: "Use of authenticated encryption (AES-GCM) for protecting sensitive data".to_string(),
                is_good_pattern: true,
                category: PatternCategory::Encryption,
                detection_hints: vec!["aes".to_string(), "gcm".to_string(), "encrypt".to_string()],
                cwe_ids: vec![],
                recommendation: "Continue using AES-GCM or similar authenticated encryption for sensitive data".to_string(),
            },
            PrivacyPattern {
                id: "ENC002".to_string(),
                name: "ChaCha20-Poly1305".to_string(),
                description: "Use of ChaCha20-Poly1305 authenticated encryption".to_string(),
                is_good_pattern: true,
                category: PatternCategory::Encryption,
                detection_hints: vec!["chacha".to_string(), "poly1305".to_string()],
                cwe_ids: vec![],
                recommendation: "ChaCha20-Poly1305 is an excellent choice for authenticated encryption".to_string(),
            },
            PrivacyPattern {
                id: "AC001".to_string(),
                name: "Signer Verification".to_string(),
                description: "Proper verification that required accounts are signers".to_string(),
                is_good_pattern: true,
                category: PatternCategory::AccessControl,
                detection_hints: vec!["is_signer".to_string(), "require_signer".to_string()],
                cwe_ids: vec![],
                recommendation: "Continue verifying signers for all privileged operations".to_string(),
            },
            PrivacyPattern {
                id: "AC002".to_string(),
                name: "Owner Verification".to_string(),
                description: "Verification that accounts are owned by expected programs".to_string(),
                is_good_pattern: true,
                category: PatternCategory::AccessControl,
                detection_hints: vec!["owner".to_string(), "check_program".to_string()],
                cwe_ids: vec![],
                recommendation: "Always verify account ownership before trusting account data".to_string(),
            },
            PrivacyPattern {
                id: "KM001".to_string(),
                name: "PDA Key Derivation".to_string(),
                description: "Use of Program Derived Addresses for deterministic key generation".to_string(),
                is_good_pattern: true,
                category: PatternCategory::KeyManagement,
                detection_hints: vec!["pda".to_string(), "find_program_address".to_string(), "derive".to_string()],
                cwe_ids: vec![],
                recommendation: "PDAs are a secure way to derive account addresses".to_string(),
            },
            PrivacyPattern {
                id: "ZK001".to_string(),
                name: "Zero-Knowledge Proof".to_string(),
                description: "Use of zero-knowledge proofs for privacy-preserving verification".to_string(),
                is_good_pattern: true,
                category: PatternCategory::ZeroKnowledge,
                detection_hints: vec!["zk".to_string(), "groth16".to_string(), "plonk".to_string(), "proof".to_string()],
                cwe_ids: vec![],
                recommendation: "ZK proofs are excellent for privacy-preserving verification".to_string(),
            },
            PrivacyPattern {
                id: "TP001".to_string(),
                name: "Constant-Time Comparison".to_string(),
                description: "Use of constant-time comparison to prevent timing attacks".to_string(),
                is_good_pattern: true,
                category: PatternCategory::TimingProtection,
                detection_hints: vec!["constant_time".to_string(), "ct_eq".to_string(), "subtle".to_string()],
                cwe_ids: vec![],
                recommendation: "Always use constant-time operations when comparing secrets".to_string(),
            },

            // Anti-Patterns
            PrivacyPattern {
                id: "AP_ENC001".to_string(),
                name: "Weak Hash Function".to_string(),
                description: "Use of cryptographically weak hash functions (MD5, SHA1)".to_string(),
                is_good_pattern: false,
                category: PatternCategory::Encryption,
                detection_hints: vec!["md5".to_string(), "sha1".to_string()],
                cwe_ids: vec!["CWE-327".to_string(), "CWE-328".to_string()],
                recommendation: "Replace with SHA-256 or SHA-3".to_string(),
            },
            PrivacyPattern {
                id: "AP_ENC002".to_string(),
                name: "ECB Mode Encryption".to_string(),
                description: "Use of ECB mode which doesn't hide patterns".to_string(),
                is_good_pattern: false,
                category: PatternCategory::Encryption,
                detection_hints: vec!["ecb".to_string()],
                cwe_ids: vec!["CWE-327".to_string()],
                recommendation: "Use authenticated encryption modes like GCM or CCM".to_string(),
            },
            PrivacyPattern {
                id: "AP_KM001".to_string(),
                name: "Hardcoded Key".to_string(),
                description: "Cryptographic key embedded directly in code".to_string(),
                is_good_pattern: false,
                category: PatternCategory::KeyManagement,
                detection_hints: vec!["private_key".to_string(), "secret_key".to_string()],
                cwe_ids: vec!["CWE-321".to_string(), "CWE-798".to_string()],
                recommendation: "Derive keys at runtime or use secure key storage".to_string(),
            },
            PrivacyPattern {
                id: "AP_AC001".to_string(),
                name: "Missing Authorization".to_string(),
                description: "Operations performed without checking authorization".to_string(),
                is_good_pattern: false,
                category: PatternCategory::AccessControl,
                detection_hints: vec![],
                cwe_ids: vec!["CWE-862".to_string(), "CWE-863".to_string()],
                recommendation: "Always verify authorization before privileged operations".to_string(),
            },
            PrivacyPattern {
                id: "AP_TP001".to_string(),
                name: "Early-Exit Comparison".to_string(),
                description: "Comparison that exits early, leaking timing information".to_string(),
                is_good_pattern: false,
                category: PatternCategory::TimingProtection,
                detection_hints: vec![],
                cwe_ids: vec!["CWE-208".to_string()],
                recommendation: "Use constant-time comparison functions".to_string(),
            },
            PrivacyPattern {
                id: "AP_DM001".to_string(),
                name: "Excessive Data Storage".to_string(),
                description: "Storing more user data than necessary on-chain".to_string(),
                is_good_pattern: false,
                category: PatternCategory::DataMinimization,
                detection_hints: vec![],
                cwe_ids: vec!["CWE-359".to_string()],
                recommendation: "Only store the minimum necessary data on-chain".to_string(),
            },
        ]
    }
}

impl Default for PatternLibrary {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_library() {
        let library = PatternLibrary::new();
        assert!(!library.all().is_empty());
        assert!(!library.good_patterns().is_empty());
        assert!(!library.anti_patterns().is_empty());
    }
}

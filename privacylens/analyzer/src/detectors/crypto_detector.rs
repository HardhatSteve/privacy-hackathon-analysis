//! Cryptographic Issue Detector

use super::{generate_vuln_id, Detector};
use crate::parser::ParsedProgram;
use crate::types::*;

/// Detector for cryptographic vulnerabilities
pub struct CryptoDetector;

impl CryptoDetector {
    pub fn new() -> Self {
        Self
    }

    /// Check for weak or missing encryption
    fn check_encryption_usage(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 0;

        // Strong encryption indicators
        let strong_crypto = ["aes", "chacha", "xchacha", "ed25519", "curve25519", "sha256", "sha3", "blake"];
        // Weak or deprecated crypto
        let weak_crypto = ["md5", "sha1", "des", "rc4", "ecb"];

        let symbols: Vec<String> = program.symbols.iter().map(|s| s.name.to_lowercase()).collect();
        let data_str: String = program.data_sections
            .values()
            .map(|d| String::from_utf8_lossy(d).to_lowercase())
            .collect::<Vec<_>>()
            .join(" ");

        // Check for weak crypto usage
        for weak in &weak_crypto {
            if symbols.iter().any(|s| s.contains(weak)) || data_str.contains(weak) {
                vulnerabilities.push(Vulnerability {
                    id: generate_vuln_id("CRYPTO", index),
                    title: format!("Weak Cryptographic Algorithm: {}", weak.to_uppercase()),
                    description: format!(
                        "The program appears to use {}, which is considered cryptographically weak or deprecated.",
                        weak.to_uppercase()
                    ),
                    severity: Severity::High,
                    category: VulnerabilityCategory::Cryptographic,
                    location: None,
                    line_start: None,
                    line_end: None,
                    impact: "Weak cryptographic algorithms can be broken, allowing attackers to decrypt protected data or forge signatures.".to_string(),
                    attack_scenario: Some(format!(
                        "{} has known vulnerabilities that allow practical attacks. Attackers could potentially break the encryption or find collisions.",
                        weak.to_uppercase()
                    )),
                    recommendation: format!(
                        "Replace {} with a modern, secure alternative. For hashing, use SHA-256 or SHA-3. For encryption, use AES-GCM or ChaCha20-Poly1305.",
                        weak.to_uppercase()
                    ),
                    code_example: None,
                    fixed_example: None,
                    cwe_id: Some("CWE-327".to_string()),
                    owasp_id: Some("A3:2017".to_string()),
                    references: vec![
                        "https://cwe.mitre.org/data/definitions/327.html".to_string(),
                    ],
                    confidence: 0.8,
                    detector_id: self.id().to_string(),
                });
                index += 1;
            }
        }

        // Check for missing encryption
        let has_strong_crypto = strong_crypto.iter().any(|c| {
            symbols.iter().any(|s| s.contains(c)) || data_str.contains(*c)
        });

        let has_sensitive_data = ["password", "secret", "key", "token", "credential"]
            .iter()
            .any(|s| data_str.contains(s));

        if has_sensitive_data && !has_strong_crypto {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("CRYPTO", index),
                title: "Potentially Missing Encryption for Sensitive Data".to_string(),
                description: "The program appears to handle sensitive data but shows no evidence of strong encryption usage.".to_string(),
                severity: Severity::High,
                category: VulnerabilityCategory::Cryptographic,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Sensitive data stored or transmitted without encryption could be exposed to unauthorized parties.".to_string(),
                attack_scenario: Some("An attacker with access to the blockchain could read sensitive data in plain text.".to_string()),
                recommendation: "Implement encryption for all sensitive data using modern algorithms like AES-256-GCM or ChaCha20-Poly1305.".to_string(),
                code_example: None,
                fixed_example: None,
                cwe_id: Some("CWE-311".to_string()),
                owasp_id: Some("A3:2017".to_string()),
                references: vec![],
                confidence: 0.6,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }

    /// Check for poor key management
    fn check_key_management(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 100;

        // Check for hardcoded keys or seeds
        for (section_name, data) in &program.data_sections {
            // Look for patterns that might be hardcoded keys
            // Keys are often 32 or 64 bytes of high-entropy data
            if data.len() >= 32 {
                let entropy = Self::calculate_entropy(data);
                if entropy > 7.5 && data.len() <= 64 {
                    vulnerabilities.push(Vulnerability {
                        id: generate_vuln_id("CRYPTO", index),
                        title: "Potential Hardcoded Key or Seed".to_string(),
                        description: format!(
                            "High-entropy data of key-like length ({} bytes) found in {} section. This could be a hardcoded cryptographic key or seed.",
                            data.len(), section_name
                        ),
                        severity: Severity::Critical,
                        category: VulnerabilityCategory::Cryptographic,
                        location: None,
                        line_start: None,
                        line_end: None,
                        impact: "Hardcoded keys can be extracted by anyone who can read the program bytecode, completely compromising the security of any encryption using that key.".to_string(),
                        attack_scenario: Some("An attacker reads the program bytecode, extracts the hardcoded key, and uses it to decrypt all protected data or forge signatures.".to_string()),
                        recommendation: "Never hardcode cryptographic keys. Use PDAs with proper seeds, or derive keys from secure sources at runtime.".to_string(),
                        code_example: None,
                        fixed_example: None,
                        cwe_id: Some("CWE-321".to_string()),
                        owasp_id: None,
                        references: vec![],
                        confidence: 0.7,
                        detector_id: self.id().to_string(),
                    });
                    index += 1;
                }
            }
        }

        vulnerabilities
    }

    /// Calculate Shannon entropy of data
    fn calculate_entropy(data: &[u8]) -> f64 {
        if data.is_empty() {
            return 0.0;
        }

        let mut counts = [0u64; 256];
        for &byte in data {
            counts[byte as usize] += 1;
        }

        let len = data.len() as f64;
        counts.iter()
            .filter(|&&c| c > 0)
            .map(|&c| {
                let p = c as f64 / len;
                -p * p.log2()
            })
            .sum()
    }

    /// Check for nonce/IV reuse
    fn check_nonce_reuse(&self, program: &ParsedProgram) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();
        let mut index = 200;

        // Check for encryption without apparent nonce generation
        let has_encryption = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("encrypt") || name.contains("cipher") || name.contains("seal")
        });

        let has_nonce_generation = program.symbols.iter().any(|s| {
            let name = s.name.to_lowercase();
            name.contains("nonce") || name.contains("random") || name.contains("iv")
        });

        if has_encryption && !has_nonce_generation {
            vulnerabilities.push(Vulnerability {
                id: generate_vuln_id("CRYPTO", index),
                title: "Potential Nonce/IV Reuse".to_string(),
                description: "The program appears to perform encryption but shows no evidence of nonce or IV generation. Reusing nonces with the same key completely breaks the security of many encryption schemes.".to_string(),
                severity: Severity::Critical,
                category: VulnerabilityCategory::Cryptographic,
                location: None,
                line_start: None,
                line_end: None,
                impact: "Nonce reuse allows attackers to XOR ciphertexts together and recover plaintext, or in authenticated encryption, forge new valid ciphertexts.".to_string(),
                attack_scenario: Some("If the same nonce is used twice with the same key, an attacker can XOR the two ciphertexts to get the XOR of the plaintexts, often leading to complete recovery of both messages.".to_string()),
                recommendation: "Always generate a fresh, random nonce for each encryption operation. For AES-GCM, use 96-bit random nonces. For ChaCha20-Poly1305, use 192-bit extended nonces (XChaCha).".to_string(),
                code_example: None,
                fixed_example: None,
                cwe_id: Some("CWE-323".to_string()),
                owasp_id: None,
                references: vec![],
                confidence: 0.6,
                detector_id: self.id().to_string(),
            });
        }

        vulnerabilities
    }
}

impl Default for CryptoDetector {
    fn default() -> Self {
        Self::new()
    }
}

impl Detector for CryptoDetector {
    fn id(&self) -> &'static str {
        "CRYPTO"
    }

    fn name(&self) -> &'static str {
        "Cryptographic Issue Detector"
    }

    fn description(&self) -> &'static str {
        "Detects cryptographic vulnerabilities including weak algorithms, poor key management, and nonce reuse"
    }

    fn detect(&self, program: &ParsedProgram, _config: &AnalysisConfig) -> Vec<Vulnerability> {
        let mut vulnerabilities = Vec::new();

        vulnerabilities.extend(self.check_encryption_usage(program));
        vulnerabilities.extend(self.check_key_management(program));
        vulnerabilities.extend(self.check_nonce_reuse(program));

        vulnerabilities
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::Cryptographic]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entropy_calculation() {
        // Random-looking data should have high entropy
        let random_data: Vec<u8> = (0..256).collect();
        let entropy = CryptoDetector::calculate_entropy(&random_data);
        assert!(entropy > 7.0);

        // Repeated data should have low entropy
        let repeated: Vec<u8> = vec![0; 256];
        let entropy = CryptoDetector::calculate_entropy(&repeated);
        assert!(entropy < 0.1);
    }
}

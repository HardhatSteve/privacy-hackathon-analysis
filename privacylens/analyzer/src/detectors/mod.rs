//! Privacy vulnerability detectors

pub mod pii_detector;
pub mod timing_detector;
pub mod state_detector;
pub mod crypto_detector;
pub mod access_detector;
pub mod side_channel_detector;

use crate::parser::ParsedProgram;
use crate::types::*;

/// Trait for all vulnerability detectors
pub trait Detector: Send + Sync {
    /// Detector ID
    fn id(&self) -> &'static str;

    /// Detector name
    fn name(&self) -> &'static str;

    /// Detector description
    fn description(&self) -> &'static str;

    /// Run detection on parsed program
    fn detect(&self, program: &ParsedProgram, config: &AnalysisConfig) -> Vec<Vulnerability>;

    /// Categories this detector covers
    fn categories(&self) -> Vec<VulnerabilityCategory>;
}

/// Collection of all detectors
pub struct DetectorRegistry {
    detectors: Vec<Box<dyn Detector>>,
}

impl DetectorRegistry {
    /// Create registry with all detectors
    pub fn new() -> Self {
        Self {
            detectors: vec![
                Box::new(pii_detector::PiiDetector::new()),
                Box::new(timing_detector::TimingDetector::new()),
                Box::new(state_detector::StateDetector::new()),
                Box::new(crypto_detector::CryptoDetector::new()),
                Box::new(access_detector::AccessDetector::new()),
                Box::new(side_channel_detector::SideChannelDetector::new()),
            ],
        }
    }

    /// Get all detectors
    pub fn all(&self) -> &[Box<dyn Detector>] {
        &self.detectors
    }

    /// Get detectors for specific categories
    pub fn for_categories(&self, categories: &[VulnerabilityCategory]) -> Vec<&dyn Detector> {
        if categories.is_empty() {
            return self.detectors.iter().map(|d| d.as_ref()).collect();
        }

        self.detectors
            .iter()
            .filter(|d| {
                d.categories()
                    .iter()
                    .any(|c| categories.contains(c))
            })
            .map(|d| d.as_ref())
            .collect()
    }

    /// Get detector count
    pub fn count(&self) -> usize {
        self.detectors.len()
    }
}

impl Default for DetectorRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper to generate vulnerability IDs
pub fn generate_vuln_id(detector_id: &str, index: usize) -> String {
    format!("{}_{:04}", detector_id, index)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_registry_creation() {
        let registry = DetectorRegistry::new();
        assert!(registry.count() > 0);
    }

    #[test]
    fn test_vuln_id_generation() {
        let id = generate_vuln_id("PII", 1);
        assert_eq!(id, "PII_0001");
    }
}

//! PrivacyLens Analyzer - Privacy analysis engine for Solana programs
//!
//! This library provides comprehensive privacy analysis for Solana bytecode,
//! including vulnerability detection, scoring, and recommendations.

pub mod analyzer;
pub mod detectors;
pub mod parser;
pub mod patterns;
pub mod scorer;
pub mod types;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use analyzer::Analyzer;
pub use scorer::PrivacyScorer;
pub use types::*;

/// Initialize the analyzer (for WASM)
#[cfg(feature = "wasm")]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}

//! WASM bindings for browser execution

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::{Analyzer, AnalysisConfig, AnalysisDepth, Severity, VulnerabilityCategory};

/// Initialize the WASM module
#[cfg(feature = "wasm")]
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// WASM-compatible analyzer wrapper
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct WasmAnalyzer {
    analyzer: Analyzer,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl WasmAnalyzer {
    /// Create a new analyzer
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            analyzer: Analyzer::new(),
        }
    }

    /// Analyze bytecode and return JSON result
    #[wasm_bindgen]
    pub fn analyze(&self, bytecode: &[u8], config_json: Option<String>) -> Result<String, JsValue> {
        let config = if let Some(json) = config_json {
            serde_json::from_str(&json)
                .map_err(|e| JsValue::from_str(&format!("Invalid config: {}", e)))?
        } else {
            AnalysisConfig::default()
        };

        let result = self.analyzer.analyze(bytecode, &config)
            .map_err(|e| JsValue::from_str(&e))?;

        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Analyze bytecode with quick scan
    #[wasm_bindgen]
    pub fn analyze_quick(&self, bytecode: &[u8]) -> Result<String, JsValue> {
        let config = AnalysisConfig {
            depth: AnalysisDepth::Quick,
            min_severity: Severity::Medium,
            ..Default::default()
        };

        self.analyze(bytecode, Some(serde_json::to_string(&config).unwrap()))
    }

    /// Analyze bytecode with deep scan
    #[wasm_bindgen]
    pub fn analyze_deep(&self, bytecode: &[u8]) -> Result<String, JsValue> {
        let config = AnalysisConfig {
            depth: AnalysisDepth::Deep,
            min_severity: Severity::Low,
            ..Default::default()
        };

        self.analyze(bytecode, Some(serde_json::to_string(&config).unwrap()))
    }

    /// Get just the privacy score
    #[wasm_bindgen]
    pub fn get_score(&self, bytecode: &[u8]) -> Result<u8, JsValue> {
        let config = AnalysisConfig {
            depth: AnalysisDepth::Quick,
            include_recommendations: false,
            include_code_examples: false,
            ..Default::default()
        };

        let result = self.analyzer.analyze(bytecode, &config)
            .map_err(|e| JsValue::from_str(&e))?;

        Ok(result.score.overall)
    }

    /// Get analyzer version
    #[wasm_bindgen]
    pub fn version(&self) -> String {
        crate::VERSION.to_string()
    }
}

#[cfg(feature = "wasm")]
impl Default for WasmAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse config from JSON string
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn parse_config(json: &str) -> Result<JsValue, JsValue> {
    let config: AnalysisConfig = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid config: {}", e)))?;

    Ok(serde_wasm_bindgen::to_value(&config)?)
}

/// Get default config as JSON
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn default_config() -> String {
    serde_json::to_string(&AnalysisConfig::default()).unwrap()
}

/// Get available severity levels
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn severity_levels() -> Vec<JsValue> {
    vec![
        JsValue::from_str("CRITICAL"),
        JsValue::from_str("HIGH"),
        JsValue::from_str("MEDIUM"),
        JsValue::from_str("LOW"),
        JsValue::from_str("INFO"),
    ]
}

/// Get available vulnerability categories
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn vulnerability_categories() -> Vec<JsValue> {
    vec![
        JsValue::from_str("PII_EXPOSURE"),
        JsValue::from_str("TIMING_ATTACK"),
        JsValue::from_str("STATE_LEAKAGE"),
        JsValue::from_str("TRANSACTION_PRIVACY"),
        JsValue::from_str("ACCESS_CONTROL"),
        JsValue::from_str("CRYPTOGRAPHIC"),
        JsValue::from_str("SIDE_CHANNEL"),
        JsValue::from_str("DATA_AGGREGATION"),
        JsValue::from_str("CONFIGURATION"),
        JsValue::from_str("OTHER"),
    ]
}

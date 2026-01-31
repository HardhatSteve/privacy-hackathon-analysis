//! Relayer HTTP Server
//! 
//! Stateless relayer that submits encrypted withdrawals

use std::sync::Arc;
use tokio::sync::RwLock;

/// Relayer configuration
#[derive(Clone)]
pub struct RelayerConfig {
    /// Relayer's Solana keypair path
    pub keypair_path: String,
    /// Encryption private key (for ECIES)
    pub encryption_key: [u8; 32],
    /// RPC endpoint
    pub rpc_url: String,
    /// Fee in basis points
    pub fee_bps: u16,
    /// Server port
    pub port: u16,
}

impl Default for RelayerConfig {
    fn default() -> Self {
        Self {
            keypair_path: "~/.config/solana/relayer.json".to_string(),
            encryption_key: [0u8; 32],
            rpc_url: "https://api.devnet.solana.com".to_string(),
            fee_bps: 50, // 0.5%
            port: 8080,
        }
    }
}

/// Relay request from user
#[derive(Debug, Clone)]
pub struct RelayRequest {
    /// Pool address
    pub pool: String,
    /// ZK proof (base64)
    pub proof: String,
    /// Merkle root (hex)
    pub merkle_root: String,
    /// Nullifier hash (hex)
    pub nullifier_hash: String,
    /// Encrypted recipient (base64)
    pub encrypted_recipient: String,
    /// Maximum relayer fee user will pay
    pub max_fee: u64,
}

/// Relay response
#[derive(Debug, Clone)]
pub struct RelayResponse {
    /// Transaction signature
    pub tx_signature: String,
    /// Status
    pub status: String,
    /// Error message if failed
    pub error: Option<String>,
}

/// Relayer server state
pub struct RelayerServer {
    config: RelayerConfig,
    pending_requests: Arc<RwLock<Vec<RelayRequest>>>,
    processed_count: Arc<RwLock<u64>>,
}

impl RelayerServer {
    pub fn new(config: RelayerConfig) -> Self {
        Self {
            config,
            pending_requests: Arc::new(RwLock::new(Vec::new())),
            processed_count: Arc::new(RwLock::new(0)),
        }
    }

    /// Process a relay request
    pub async fn process_request(&self, request: RelayRequest) -> RelayResponse {
        // 1. Validate request
        if let Err(e) = self.validate_request(&request) {
            return RelayResponse {
                tx_signature: String::new(),
                status: "error".to_string(),
                error: Some(e),
            };
        }

        // 2. Decrypt recipient
        let recipient = match self.decrypt_recipient(&request.encrypted_recipient) {
            Ok(r) => r,
            Err(e) => {
                return RelayResponse {
                    tx_signature: String::new(),
                    status: "error".to_string(),
                    error: Some(format!("Decryption failed: {}", e)),
                };
            }
        };

        // 3. Build and submit transaction
        match self.submit_withdrawal(&request, &recipient).await {
            Ok(sig) => {
                // Update stats
                let mut count = self.processed_count.write().await;
                *count += 1;

                RelayResponse {
                    tx_signature: sig,
                    status: "submitted".to_string(),
                    error: None,
                }
            }
            Err(e) => RelayResponse {
                tx_signature: String::new(),
                status: "error".to_string(),
                error: Some(format!("Submission failed: {}", e)),
            },
        }
    }

    fn validate_request(&self, request: &RelayRequest) -> Result<(), String> {
        // Check proof is not empty
        if request.proof.is_empty() {
            return Err("Empty proof".to_string());
        }

        // Check nullifier format (64 hex chars)
        if request.nullifier_hash.len() != 64 {
            return Err("Invalid nullifier hash format".to_string());
        }

        // Check merkle root format
        if request.merkle_root.len() != 64 {
            return Err("Invalid merkle root format".to_string());
        }

        // Check fee
        if request.max_fee < self.calculate_fee(request) {
            return Err("Max fee too low".to_string());
        }

        Ok(())
    }

    fn calculate_fee(&self, _request: &RelayRequest) -> u64 {
        // For demo: fixed fee based on config
        // In production: based on pool denomination
        100_000_000 * self.config.fee_bps as u64 / 10000
    }

    fn decrypt_recipient(&self, _encrypted: &str) -> Result<String, String> {
        // ECIES decryption placeholder
        // In production: use real ECIES with self.config.encryption_key
        Ok("DecryptedRecipientPubkey".to_string())
    }

    async fn submit_withdrawal(
        &self,
        request: &RelayRequest,
        recipient: &str,
    ) -> Result<String, String> {
        // In production: build and submit Solana transaction
        // For now, return mock signature
        
        println!(
            "Submitting withdrawal: pool={}, recipient={}, nullifier={}...",
            request.pool,
            recipient,
            &request.nullifier_hash[..8]
        );

        // Mock signature
        Ok("5wHu1qwD7q4H3pZ...MockSignature".to_string())
    }

    /// Get server stats
    pub async fn get_stats(&self) -> (u64, usize) {
        let count = *self.processed_count.read().await;
        let pending = self.pending_requests.read().await.len();
        (count, pending)
    }
}

/// HTTP server routes (pseudo-code, needs actix-web/axum)
pub mod routes {
    use super::*;

    /// POST /relay
    pub async fn relay_handler(
        server: Arc<RelayerServer>,
        request: RelayRequest,
    ) -> RelayResponse {
        server.process_request(request).await
    }

    /// GET /info
    pub async fn info_handler(server: Arc<RelayerServer>) -> String {
        let (processed, pending) = server.get_stats().await;
        format!(
            r#"{{"fee_bps": {}, "processed": {}, "pending": {}}}"#,
            server.config.fee_bps,
            processed,
            pending
        )
    }

    /// GET /health
    pub async fn health_handler() -> &'static str {
        r#"{"status": "ok"}"#
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_relay_server() {
        let config = RelayerConfig::default();
        let server = RelayerServer::new(config);

        let request = RelayRequest {
            pool: "pool123".to_string(),
            proof: "base64proof".to_string(),
            merkle_root: "a".repeat(64),
            nullifier_hash: "b".repeat(64),
            encrypted_recipient: "encrypted".to_string(),
            max_fee: 1_000_000_000,
        };

        let response = server.process_request(request).await;
        assert_eq!(response.status, "submitted");
    }
}

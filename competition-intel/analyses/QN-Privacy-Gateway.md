# QN Privacy Gateway - Analysis

## 1. Project Overview

QN Privacy Gateway is a privacy-preserving Solana JSON-RPC gateway that sits between clients and QuickNode. It reduces metadata leakage and fingerprinting by normalizing requests, providing deterministic hashing, and caching responses. The gateway is fully compatible with existing Solana wallets and dApps while adding a privacy layer at the RPC level.

## 2. Track Targeting

**Track: Privacy Tooling**

Infrastructure-level privacy tooling:
- RPC request normalization
- Client fingerprinting reduction
- Metadata leakage prevention
- QuickNode integration

## 3. Tech Stack

- **ZK System**: None (network-layer privacy)
- **Languages**: Rust
- **Frameworks**:
  - Axum 0.7 (web framework)
  - Tokio (async runtime)
  - tokio-tungstenite (WebSocket)
- **Key Dependencies**:
  - `reqwest` v0.11 (HTTP client)
  - `sha2` v0.10 (request hashing)
  - `serde_json` v1 (JSON handling)
  - `chrono` v0.4 (timestamps)
  - `dotenvy` v0.15 (config)

## 4. Crypto Primitives

- **SHA-256 Hashing**: Deterministic request hashing for cache keys
- No ZK proofs, encryption, or advanced cryptography
- Focus is on network-layer privacy, not cryptographic privacy

## 5. Solana Integration

**No On-Chain Component**: Pure infrastructure/middleware.

**RPC Proxy Features**:
- HTTP JSON-RPC proxy to QuickNode
- WebSocket proxy for subscriptions
- Method-level caching with configurable TTL
- Request normalization for fingerprint reduction

**Supported Methods**: All standard Solana JSON-RPC methods proxied through.

## 6. Sponsor Bounty Targeting

- **QuickNode**: Primary sponsor target - built specifically for QuickNode RPC
- **Privacy Tooling Track**: Infrastructure privacy tool

## 7. Alpha/Novel Findings

1. **RPC-Level Privacy**: Novel angle on privacy at infrastructure layer
2. **Deterministic Hashing**: Reduces request fingerprinting
3. **Request Normalization**: Removes client-identifying variance
4. **Privacy Modes**: Three levels (strict, balanced, dev)
5. **Retro Dashboard**: CRT-style monitoring UI
6. **Linear Backoff**: Retry logic with configurable attempts

## 8. Strengths

1. **Complete Rust Implementation**: Full working proxy with all features
2. **QuickNode Focus**: Strong sponsor alignment
3. **Docker Ready**: Easy deployment
4. **Well-Documented**: Comprehensive README with architecture
5. **WebSocket Support**: Real-time subscription proxying
6. **Configurable Privacy**: Multiple modes for different use cases
7. **Metrics Endpoint**: Observability built in
8. **Production Patterns**: Retry logic, rate limiting considerations

## 9. Weaknesses

1. **No Cryptographic Privacy**: Just network-layer obfuscation
2. **Limited Privacy Guarantees**: Metadata reduced, not eliminated
3. **Trust Requirement**: Users must trust the gateway operator
4. **QuickNode Still Sees Requests**: Privacy from clients, not from RPC
5. **No Mix Network**: Single proxy, not multi-hop
6. **Cache Timing Attacks**: Cached vs uncached responses distinguishable
7. **No Encryption**: Requests still travel in cleartext to QuickNode
8. **Centralized Point**: Gateway becomes a privacy bottleneck

## 10. Threat Level

**LOW-MODERATE**

Justification:
- Unique infrastructure angle not covered by other projects
- Strong QuickNode bounty alignment
- Complete, working implementation
- However, limited privacy guarantees (network-layer only)
- No ZK or cryptographic innovations
- May be seen as "not privacy enough" for a privacy hackathon
- Good for QuickNode prize, weak for overall privacy track

## 11. Implementation Completeness

**85% Complete**

**Implemented**:
- Full HTTP JSON-RPC proxy
- WebSocket proxy for subscriptions
- Request normalization engine
- Deterministic SHA-256 hashing
- TTL-based caching
- Three privacy modes
- Metrics endpoint
- Live dashboard
- Retry with backoff
- Docker deployment
- Environment configuration

**Missing**:
- Prometheus metrics export
- Rate limiting (roadmap)
- Batch request handling
- Multi-backend load balancing
- TTL jitter for timing fingerprints
- Request signing/authentication
- HTTPS termination (would need reverse proxy)

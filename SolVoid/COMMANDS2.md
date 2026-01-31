# SolVoid Unified Command & API Index

This document serves as the definitive reference for all interactive components of the SolVoid Protocol.

## 1. SolVoid Command Line Interface (CLI)
The `solvoid-scan` CLI is the primary user interface for wallet analysis, shielding, and rescue operations.

### Core Commands
| Command | Arguments | Description |
|---------|-----------|-------------|
| `shield` | `<amount>` | Deposit SOL into the privacy pool. Includes ZK commitment generation. |
| `withdraw` | `<secret> <nullifier> <recipient> <amount>` | Withdraw SOL via ZK-SNARK proof. Relayer-compatible. |
| `protect` | `<address>` | Analyze a wallet for privacy leaks. Options: `--stats`, `--json`. |
| `ghost` | `<address>` | Generate Privacy Ghost Score with visual report. |
| `rescue` | `<wallet>` | Atomic rescue of compromised assets. One-click remediation. |

### Extended Flags
*   **`ghost` Flags**:
    *   `--badge`: Generate a shareable ZK-proven privacy badge.
    *   `--share`: Display social media sharing templates for X/Discord.
    *   `--json`: Machine-readable output for integration.
    *   `--verify <proof>`: Verify a third-party privacy badge proof.
*   **`rescue` Flags**:
    *   `--to <address>`: Specify destination. Can use `--auto-generate` for fresh wallets.
    *   `--emergency`: Trigger priority execution (<2s) with high-density fees.
    *   `--jito-bundle`: Use Jito bundles to front-run potential attackers/drainers.
    *   `--monitor`: Start real-time threat detection after rescue completion.
    *   `--dry-run`: Simulate the entire rescue pipeline without moving funds.

---

## 2. On-Chain Administrative Instructions
Managed via `Anchor` and the `SolVoid SDK`. Registered under Program ID: `Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i`.

### Initialization
| Instruction | Account seeds | Purpose |
|-------------|---------------|---------|
| `initialize` | `["state"]` | Main protocol state and authority setup. |
| `initialize_verifier` | `["verifier", state]` | SNARK Verification Key (VK) registration. |
| `initialize_root_history` | `["root_history"]` | Merkle tree root history buffer (size 100). |
| `initialize_economics` | `["economic_state"]` | Economic safety layer and circuit breaker config. |

### Protocol Health & Emergency
| Instruction | Parameters | Effect |
|-------------|------------|--------|
| `trigger_emergency_mode` | `multiplier`, `reason` | Adjusts protocol fees (1x-10x) globally. |
| `disable_emergency_mode` | - | Resets fees to baseline. |
| `trigger_circuit_breaker` | - | Pauses all withdrawals immediately. |
| `reset_circuit_breaker` | - | Resumes withdrawals and resets hourly limits. |

---

## 3. Shadow Relayer API
Production-grade endpoint for gasless transactions and identity decoupling. Default: `http://localhost:8080`.

### Public Endpoints
*   `GET /health`: Node status, uptime, and peer counts.
*   `GET /network`: Live network telemetry (Slots, BlockHeight).
*   `POST /relay`: Push a ZK-proven transaction to the network.
*   `POST /register`: Nodes register in the P2P relay network.
*   `POST /encrypt-route`: Generate onion-routed paths for multi-hop privacy.

### Restricted/Admin Endpoints
*   `GET /status/:publicKey`: Detailed reputation and latency metrics for a specific node.
*   `GET /admin/metrics`: Aggregated protocol throughput and bounty distribution.
*   `POST /admin/slash`: Authorized slashing of malicious or underperforming nodes.

---

## 4. Deep-Tech Security Scripts
Automated verification and validation tools located in `./scripts/`.

### Cryptographic Auditing
*   `./scripts/cross-platform-hash-verification.sh`: Validates Poseidon-3 consistency (Rust vs TS vs Circom).
*   `./scripts/rust-poseidon-test.sh`: Direct unit testing of the BPF-optimized hasher.
*   `./scripts/verify-deployment.sh`: Auditor for on-chain bytecode vs local source.

### Economic & Safety Testing
*   `./scripts/test-infrastructure.sh`: Verifies rate limiting, load balancing, and health checks.
*   `./scripts/nullifier-validation-test.sh`: Ensures 0% double-spend success rate.
*   `./scripts/arithmetic-safety-test.sh`: Proactive check for overflows in fee logic.
*   `./scripts/vault-balance-protection-test.sh`: Validates that vault exits never exceed entries.

### Deployment & Lifecycle
*   `./scripts/deploy-secure-system.sh`: Orchestrates Build -> Ceremony -> Audit -> Deploy.
*   `./scripts/end-to-end-lifecycle-test.sh`: Full user journey (Shield -> Mix -> Withdraw).
*   `./scripts/run-security-tests.sh`: Executes the complete test suite + generates report.

---

## 5. ZK Proof System
Powered by `Groth16` and the `ark-bn254` curves.

*   **Tree Depth**: 20 (Supports ~1M concurrent users)
*   **Hasher**: Poseidon-3 (Optimal for SNARK constraints)
*   **Verification**: On-chain via `groth16-solana` integration.
*   **Ceremony**: Periodic MPC updates via `./scripts/run-ceremony.sh`.

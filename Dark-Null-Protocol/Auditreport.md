# Dark Null Protocol v1 —  Audit Report

**Date:** January 10, 2026  
**Protocol Version:** v1.0 (Dark Null Protocol v1)  
**Target Network:** Solana Devnet  
**Program ID:** `33Uw9kiVRrn6wVmR439gA9QWh4MLv87N97taj2sLrkE4`  
**API Endpoint:** https://api.parad0xlabs.com  

---

## 1. Audit Scope & Repository Mapping

This audit covers the following specific components within the Dark Null Protocol repository.

### On-chain (Rust/Anchor)
- `programs/paradox/src/lib.rs` (Legacy Reference)
- `programs/paradox_v18/src/lib.rs` (**Dark Null v1 Target** - Deployed to `33Uw...rkE4`)
- `programs/paradox_v18/src/verifier.rs` (Groth16 Verifier Implementation)

### Zero-Knowledge (ZK)
- `circuits/withdraw.circom`
- `circuits/paradox.circom`
- `circuits/build/paradox_final.zkey`
- `circuits/build/vkey.json`

### Infrastructure & Relayer
- `infra/relayer/src/server.ts`
- `infra/relayer/src/types.ts`
- `infra/relayer/src/crypto.ts`
- `infra/shared/src/**` (Focus: ProofPack, Intent Binding, Memo Anchoring, Expiry, Denom Rules)
- `infra/sdk/src/**`

### Integrations
- `integrations/x402-middleware/**`
- `integrations/mcp-tools/**`

### Public Interfaces & Documentation
- `idl/dark_null_v1.json`
- `docs/API.md`, `docs/getting-started.md`, `docs/integration-guide.md`
- `tests/examples/shield.ts`, `tests/examples/unshield.ts`, `tests/examples/balance.ts`
- `LIVE_TEST_RESULTS.md`, `VERIFICATION.md`, `AUDIT.md`, `SECURITY.md`

### Operational (Out-of-Git)
- `deploy_blackbox/**` (Deployment artifacts & secrets handling)

---

## 2. "No Surprises" Identity Check

**Goal:** Prove the devnet deployment unequivocally corresponds to `programs/paradox_v18`.

### 2.1 Program Identity Confirmation
The auditor must reproduce the build and match hashes for:
1. The program `.so` artifact.
2. The embedded verifying key (VK) bytes.
3. Any compile-time feature flags.

**Hard Rule:** No "skip verify" or "dev mode" paths enabled in the release build.

#### Auditor Runbook
```bash
# Verify Environment
anchor --version
solana --version
rustc --version

# Build Program
anchor build -p paradox_v18

# Verify On-Chain Data
solana program show 33Uw9kiVRrn6wVmR439gA9QWh4MLv87N97taj2sLrkE4 --url devnet
```

---

## 3. ZK Integrity: VK/ZKey/Circuit Consistency

**Priority:** Critical / Highest

### 3.1 Deterministic Circuit Compilation
Files: `circuits/withdraw.circom`, `circuits/paradox.circom`

**Required Outputs:**
- `vkey.json` must match the VK used by `programs/paradox_v18/src/verifier.rs`.

**Auditor Verification Commands:**
```bash
cd circuits
# Compile
circom paradox.circom --r1cs --wasm --sym -o build/

# Verify Keys
snarkjs zkey verify build/paradox.r1cs build/powersOfTau28_hez_final_XX.ptau build/paradox_final.zkey
snarkjs zkey export verificationkey build/paradox_final.zkey build/vkey.json
```

### 3.2 "VK Byte-for-Byte Match" Gate
**Requirement:** A script must exist that extracts the VK from the program and compares it against `circuits/build/vkey.json`.

**Deliverable:** `scripts/verify_vk_match.ts` (or equivalent shell script).

**Evidence Required:**
- SHA256 of `circuits/build/vkey.json`.
- SHA256 of `circuits/build/paradox_final.zkey`.
- SHA256 of the Rust verifier VK constants.
- Script output proving identity.

---

## 4. Proof Encoding & ProofPack Rules

**Priority:** High

### 4.1 Encoding Single Source of Truth
Location: `infra/shared/src/**`

**Documentation Requirement (`docs/VERIFICATION.md`):**
- Endianness rules.
- Fr (Scalar Field) reduction rules.
- Proof A/B/C transformation logic.
- Expected byte lengths.
- Versioning rules.

### 4.2 Mandatory Test Vectors
Location: `tests/vectors/`

**Required Vectors:**
- `valid_pack_*.json`
- `tampered_pack_*.json` (Modified contents)
- `expired_pack_*.json` (Old blockhash/slot)
- `wrong_cluster_pack_*.json`
- `wrong_program_pack_*.json`
- `wrong_amount_pack_*.json`
- `invalid_proof_bytes_*.json` (Malformed G1/G2 points)

**Gates:**
- TS validation must pass/fail exactly as specified.
- On-chain verifier must reject all invalid cases.
- Relayer must reject invalid/replayed packs with structured errors.

---

## 5. On-Chain Program: Invariants & Fuzzing

### 5.1 Critical Invariants (`programs/paradox_v18/src/lib.rs`)
| ID | Invariant | Description |
|----|-----------|-------------|
| **I1** | **Nullifier** | Cannot be spent twice. |
| **I2** | **Root Ring** | Merkle root must exist in the history ring. |
| **I3** | **Amount** | `Proof Amount == Transfer Amount - Fee`. |
| **I4** | **Fee Math** | BPS safe, overflow-safe, correct rounding. |
| **I5** | **Maturity** | Enforced via slot math; no bypass allowed. |
| **I6** | **Recipient** | Intent signature must enforce recipient address. |
| **I7** | **Denom** | Only supported denominations allowed (if enforced). |
| **I8** | **Authority** | Config changes require correct Admin Signer + PDA seeds. |

**Minimum Tests:**
- Unit tests (Rust) for math, slot, and seed logic.
- Anchor tests for full instruction flows.
- Regression tests for known issues (G2 decode, compute, Fr range).

### 5.2 Mandatory Fuzzing
**Target:** `programs/paradox_v18/fuzz/`
**Inputs:**
- Malformed proof bytes (random lengths).
- Public inputs with leading zeros / overflows.
- Invalid G2 points / sign bits.
- Nullifier page boundary conditions.
- Root ring edge conditions (wrap-around, index errors).

**Requirement:** Nightly CI job running fuzz for N minutes, uploading corpus.

---

## 6. Infrastructure Security: Relayer Trust Model

**Assumption:** Relayer must be assumed malicious.

### 6.1 Theft Prevention
**Location:** `infra/relayer/src/` (server.ts, crypto.ts, types.ts)

**Controls:**
1. **Intent Signature:** Required for withdrawals (Prevent QR theft).
2. **Pack Verification:** Strict SHA256 check of ProofPack.
3. **Expiry:** Strict server-side `expirySlot` enforcement.
4. **Replay Protection:** Nonce or DB memory of spent Pack IDs.
5. **Rate Limiting:** IP + Wallet-based.

**Audit Scenarios (Must Fail):**
- Relayer tries to redirect recipient.
- Relayer tries to reuse a pack.
- Relayer tries to submit after expiry.
- Relayer tries to modify amount.

### 6.2 Operational Controls
**Target:** https://api.parad0xlabs.com
- WAF / DDoS controls.
- Request signing for privileged endpoints (optional).
- Immutable (append-only) logs.
- Alerts on unusual failure spikes.

---

## 7. Secrets & Blackbox Deployment

**Folder:** `deploy_blackbox/` (Excluded from Git)

### 7.1 Diamond Rules
1. `deploy_blackbox/relayer-keypair.json` must **NEVER** appear in any build image layer.
2. Builds must pull secrets at runtime only.
3. Documented rotation + incident drill procedures.

**Evidence:**
- Secret scanning report (Git history + Container images).
- Rotation procedure documentation.
- Timestamp of last rotation.

---

## 8. Integration Security

**Scope:** `integrations/x402-middleware/**`, `integrations/mcp-tools/**`

### 8.1 Binding Requirements
Payment requests must cryptographically bind:
- Amount
- Cluster
- Program ID
- Expiry Slot / TTL
- Recipient

**Constraints:**
- Must not accept "floating" requests susceptible to replay.
- Must not leak ProofPack contents via logs or telemetry.

---

## 9. CI/CD Gates (Diamond Automation)

The following pipelines must be active:

1.  **`onchain_build_and_lint`**
    *   `cargo fmt --check`
    *   `cargo clippy -D warnings`
    *   `cargo audit`
    *   `anchor build -p paradox_v18`

2.  **`zk_build_verify`**
    *   Compile Circom
    *   Verify ZKey
    *   Export `vkey.json`
    *   Run VK match script

3.  **`vectors_and_examples`**
    *   Run `tests/examples/*.ts` against devnet.
    *   Verify all invalid vectors fail.

4.  **`fuzz_nightly`**
    *   Run fuzz for 15–60 mins.
    *   Upload corpus + crash logs.

5.  **`sbom_and_attestation`**
    *   Generate SBOM (Rust + Node).
    *   Output release hashes (`vkey.json`, `.zkey`, `.so`, `IDL`).

---

## 10. Audit Focus Areas & Deliverables

### 10.1 Key Risk Areas (Auditor Focus)
1.  **ZK Circuit Correctness:** Unconstrained signals, wrong statements, missing bindings.
2.  **Proof Encoding:** Endianness issues, Fr mapping, G2 transforms.
3.  **Pack Validation:** Anti-replay, intent binding, QR theft prevention.

### 10.2 Audit Binder (Documentation)
**New Files:**
- `docs/THREAT_MODEL.md`
- `docs/ENCODING_SPEC.md`
- `docs/KEYS_AND_SETUP.md`
- `docs/SECURITY_CONTROLS.md`
- `docs/INCIDENT_RESPONSE.md`
- `docs/REPRO_BUILD.md`

**Updates:**
- `AUDIT.md`: Scope definition.
- `VERIFICATION.md`: VK-match procedure & vector checks.
- `LIVE_TEST_RESULTS.md`: Date-stamped devnet receipts.

---




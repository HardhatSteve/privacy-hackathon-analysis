#  Testing Strategy

Quality and security are paramount for a privacy protocol. SolVoid employs a multi-layered testing strategy to ensure the integrity of the ZK logic and the robustness of the Solana programs.

---

##  Testing Layers

### 1. Unit Tests (Rust)
Located in `programs/solvoid-zk/src/`.
-   **Poseidon Hash:** Verified against standard reference implementations.
-   **Merkle Tree:** Tested for correct path calculation and root updates.
-   **Economics:** Validates fee calculations and emergency multipliers.

### 2. Integration Tests (TypeScript)
Located in `tests/`.
-   Uses `anchor test`.
-   Simulates full user flows: `Initialize -> Deposit -> Wait -> Withdraw`.
-   Tests edge cases: Double spending, invalid roots, and unauthorized access.

### 3. Circuit Tests (Circom)
Located in `circuits/tests/`.
-   Uses `mocha` and `chai` with `snarkjs`.
-   Verifies that the circuit correctly accepts valid witness data and rejects invalid inputs.

---

##  Running Tests

### Standard Anchor Tests
```bash
anchor test
```

### Specific Integration Tests
```bash
yarn ts-mocha -p ./tsconfig.json -t 1000000 tests/full-cycle.ts
```

### SDK Tests
```bash
cd sdk && npm test
```

---

##  Coverage Requirements
-   **Core Math:** 100% coverage.
-   **Program Instructions:** > 90% coverage.
-   **SDK Methods:** > 80% coverage.

---

##  Mock Data & Fixtures
We use pre-calculated commitments and proofs in `tests/fixtures/` to speed up integration testing. These are updated whenever the circuits or IDL change.

---

##  Security Testing
-   **Fuzzing:** We use `trident` (planned) for fuzzing program inputs to find arithmetic crashes.
-   **Under-constrained Circuit Audits:** Manual review of all `===` constraints in Circom to ensure no private signal can be manipulated without invalidating the proof.

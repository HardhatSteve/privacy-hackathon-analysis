#  Master Command Cheat Sheet

This document is the absolute, exhaustive reference for every command, flag, and API method in the SolVoid ecosystem. **No stone is left unturned.**

---

##  Primary CLI: `solvoid-scan`
The main entry point for users and developers.

###  Global Flags
These flags can be used with any command to override defaults or environment variables.
- `--rpc <URL>`: Override the Solana RPC endpoint (Def: Mainnet Beta).
- `--program <ID>`: Override the SolVoid Program ID.
- `--relayer <URL>`: Override the Shadow Relayer URL (Def: http://localhost:3000).
- `--help`: View contextual help for any command.

---

###  `protect <address>`
Scan a specific Solana address for privacy leaks and retrieve its **Privacy Passport**.
- **Arguments:**
    - `<address>`: The base58 public key to analyze.
- **Example:** `solvoid-scan protect 9WzDXw... --rpc https://api.mainnet-beta.solana.com`

###  `rescue <wallet>`
The "Nuclear Option": Atomic shielding of all leaked assets. This is the ultimate tool for compromised wallets.
- **Arguments:**
    - `<wallet>`: Can be a Public Key (analysis only) or a Private Key (for atomic execution).
- **Flags:**
    - `--to <ADDRESS>`: Specification of a safe destination wallet.
    - `--auto-generate`: Creates a fresh, private safe wallet on the fly (Recommended).
    - `--emergency`: High-priority fee injection for <2s execution.
    - `--reason <type>`: Sets context: `key-leak`, `mev-attack`, `drainer`, `privacy`.
    - `--dry-run`: Performs a full simulation without spending gas or moving funds.
    - `--jito-bundle`: Uses Jito MEV bundles to front-run attackers and hide from public mempools.
    - `--mev-protection`: Enables advanced MEV-resistant transaction routing.
    - `--monitor`: Starts a real-time monitoring loop after the rescue completes.

###  `shield <amount>`
Execute a surgically precise private deposit into the SolVoid vault.
- **Arguments:**
    - `<amount>`: Total SOL to shield (e.g., `1.5`).
- **Logic:** Converts SOL to Lamports and generates a secure ZK commitment.
- **Output:** Returns your `Secret` and `Nullifier`. **LOSS OF THESE = LOSS OF FUNDS.**

###  `withdraw <secret> <nullifier> <recipient> <amount>`
The inverse of shielding. Unlinks your funds via ZK-SNARKs.
- **Arguments:**
    - `<secret>`: The unique hex secret from your deposit.
    - `<nullifier>`: The unique hex nullifier from your deposit.
    - `<recipient>`: The fresh, unlinked destination public key.
    - `<amount>`: The exact amount (in SOL) to withdraw.
- **Flags:**
    - `--relayer <URL>`: Use a Shadow Relayer for IP-anonymous broadcasting.

###  `ghost <address>`
Generates the **Privacy Ghost Score**—a visual, shareable assessment of your on-chain anonymity.
- **Flags:**
    - `--badge`: Generates a high-quality terminal badge with a cryptographically signed score.
    - `--share`: Displays pre-formatted posts for Twitter/X and Discord.
    - `--json`: Outputs the ghost score and scan results in raw JSON (Ideal for CI/CD).
    - `--verify <PROOF>`: Verifies a third-party's Privacy Badge proof without seeing their wallet.

---

##  Specialized Scanners
Used for high-throughput or automated environments.

### `ultimate-privacy-scan.js`
- **Focus:** Maximum resilience. Uses 40+ RPCs with automatic failover and IP rotation.
- **Flags:**
    - `--stats`: Displays real-time performance and success rates for the global RPC network.

### `simple-scan.js`
- **Focus:** Quick audits with minimal dependencies.
- **Flags:**
    - `--network <NAME>`: Choose between `mainnet-beta`, `devnet`, or `testnet`.

---

##  SDK API Reference: `SolVoidClient`

| Method | Signature | Description |
|--------|-----------|-------------|
| `protect` | `async protect(address: PublicKey): Promise<ScanResult[]>` | Deep-scan for privacy leaks. |
| `getPassport` | `async getPassport(address: string): Promise<PrivacyPassport>` | Fetch score and badges. |
| `shield` | `async shield(amount: number): Promise<CommitmentResult>` | Prepare a private deposit. |
| `prepareWithdrawal` | `async prepareWithdrawal(secret, nullifier, amount, recipient, commitments, wasm, zkey)` | Generate Groth16 proof. |
| `rescue` | `async rescue(address: PublicKey): Promise<RescueResult>` | Prep atomic migration plan. |

---

##  Shadow Relayer API (`/relayer`)
The relayer infrastructure for gasless and IP-anonymous transactions.

### Endpoints
- `GET /health`: Retrieve node status, uptime, and network metrics.
- `POST /register`: Join the relayer network as a peer.
- `POST /relay`: Submit a ZK-signed transaction for broadcasting.
- `POST /encrypt-route`: Prepare onion-routed payloads for multi-hop anonymity.

### Environment Variables
- `PORT`: Port to listen on (Default: `8080`).
- `RPC_ENDPOINT`: Target Solana RPC.
- `NODE_ID`: Unique identifier for the relayer instance.
- `BOUNTY_RATE`: Fee in SOL per relayed transaction.

---

##  Security & Testing Scripts (`/scripts`)
For contributors and auditors, these scripts execute the rigorous security guarantees of the SolVoid protocol.

###  Validation Suites
- `./scripts/run-security-tests.sh`: The master security test runner.
- `./scripts/security-test-suite.sh`: Comprehensive suite covering multiple threat vectors.
- `./scripts/end-to-end-lifecycle-test.sh`: Full simulation from deposit to withdrawal.

###  Cryptographic Integrity
- `./scripts/verify-hash-consistency.sh`: Ensures Poseidon hashes match across Rust/TypeScript/Circom.
- `./scripts/cross-platform-hash-verification.sh`: Intense stress-test of cross-language hash consistency.
- `./scripts/arithmetic-safety-test.sh`: Checks for overflows and field-element edge cases.

###  Economic & Vault Security
- `./scripts/vault-balance-protection-test.sh`: Verifies funds cannot be drained via phantom withdrawals.
- `./scripts/fee-manipulation-protection-test.sh`: Ensures relayer/protocol fees cannot be bypassed.
- `./scripts/nullifier-validation-test.sh`: Hammer-test for double-spending prevention.

###  Advanced Deployment
- `./scripts/deploy-secure-system.sh`: Production-grade deployment with tiered authorities.
- `./scripts/mpc-ceremony.sh`: Coordinates a local Multi-Party Computation trusted setup.
- `./scripts/run-ceremony.sh`: Automates the generation of proving/verification keys.
- `./scripts/verify-deployment.sh`: Post-deployment audit of on-chain program state.

---

##  DevOps & Build Lifecycle

### Automation Scripts (`package.json`)
- `npm run build`: Full TypeScript compilation.
- `npm test`: Runs units (`test:unit`) and integration (`test:integration`) tests.
- `npm run lint`: Strict ESLint audit.
- `npm run docs`: Generates technical SDK documentation via TypeDoc.
- `npm run dashboard:dev / build / start`: Manage the Next.js visual interface.

### Circuit Tools (`/scripts`)
- `./scripts/build-zk.sh`: Compiles Circom circuits, generates `.wasm`, and exports Groth16 `.zkey`.
- `./scripts/generate-types.sh`: Syncs Anchor IDL with SDK TypeScript interfaces.

### Smart Contract Development (`Anchor.toml`)
- `anchor build`: Bytecode compilation.
- `anchor test`: Integrated validator-based testing.
- `anchor deploy`: Production deployment to specified cluster.
- `anchor run init`: Protocol-level state initialization.

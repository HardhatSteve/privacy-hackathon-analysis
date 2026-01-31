#  CI/CD Pipeline Documentation

SolVoid uses GitHub Actions to automate testing, building, and deployment across the entire monorepo.

##  Pipeline Overview

1.  **Linting & Code Quality:** Runs Prettier, ESLint, and `cargo fmt`.
2.  **Test Suite:** Executes Rust unit tests and TypeScript integration tests.
3.  **ZK Build:** Compiles Circom circuits (on changes to `/circuits`).
4.  **Artifact Generation:** Generates SDK types and IDLs.
5.  **Deployment:** Automatically updates the Dashboard and Relayer.

---

##  GitHub Actions Configuration

Workflows are located in `.github/workflows/`.

### `test.yml`
Triggered on every Pull Request.
```yaml
jobs:
  test-rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run anchor test
        run: anchor test
```

### `deploy-dashboard.yml`
Triggered on push to `main`.
- Deploys the `dashboard` folder to Vercel/Netlify.
- Updates the Program ID if a new deployment was detected.

---

##  Secrets Management

The following secrets must be configured in GitHub Repository Settings:
- `SOLANA_DEPLOYER_KEY`: Private key for the deployment wallet.
- `VERCEL_TOKEN`: For dashboard deployments.
- `RPC_URL_MAINNET`: Secure RPC endpoint for Mainnet deployments.

---

##  Security Scanning

We have integrated the following security checks into the pipeline:
- **Cargo Audit:** Checks for vulnerabilities in Rust dependencies.
- **NPM Audit:** Scans for issues in JavaScript packages.
- **Mythril (Planned):** Automated smart contract security analysis.

---

##  Troubleshooting the Pipeline

- **Circuit Build Timeout:** Circom compilation can take a long time. If the action times out, consider using a larger GitHub runner or pre-compiling keys and storing them as artifacts.
- **Anchor Version Mismatch:** Ensure the `anchor-cli` version in the GitHub Actions runner matches the version used in development (`v0.30.0`).

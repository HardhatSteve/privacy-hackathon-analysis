---
sidebar_position: 3
---

# Init Setup Wizard

The `init` command is an interactive setup wizard that scaffolds privacy scanning infrastructure into your project. It generates configuration files, CI/CD workflows, git hooks, and testing boilerplate so you can start enforcing privacy policies immediately.

```bash
solana-privacy-scanner init
```

If a `.privacyrc` file already exists, the wizard will ask for confirmation before overwriting it.

## Configuration Presets

The first prompt asks you to choose a preset. This determines the contents of the generated `.privacyrc` file, which controls how strict your privacy policy is.

### Development (Permissive)

Designed for exploration and development. Nothing blocks, nothing fails.

```json
{
  "maxRiskLevel": "HIGH",
  "enforceInCI": false,
  "blockOnFailure": false,
  "thresholds": {
    "maxHighSeverity": 5
  }
}
```

- **maxRiskLevel: HIGH** — Scans will pass even if the overall risk is HIGH.
- **enforceInCI: false** — CI pipelines will not enforce privacy checks.
- **blockOnFailure: false** — Builds and commits are never blocked.
- **maxHighSeverity: 5** — Up to 5 high-severity signals are tolerated.

Use this when you're integrating the scanner for the first time and want to see what it detects without disrupting your workflow.

### Production (Strict)

For projects where privacy is a hard requirement.

```json
{
  "maxRiskLevel": "LOW",
  "enforceInCI": true,
  "blockOnFailure": true,
  "thresholds": {
    "maxHighSeverity": 0,
    "maxMediumSeverity": 2,
    "minPrivacyScore": 80
  }
}
```

- **maxRiskLevel: LOW** — Only LOW risk reports pass. Anything above fails.
- **enforceInCI: true** — CI pipelines actively enforce the privacy policy.
- **blockOnFailure: true** — Commits and builds are blocked on violations.
- **maxHighSeverity: 0** — Zero high-severity signals allowed.
- **maxMediumSeverity: 2** — At most 2 medium-severity signals.
- **minPrivacyScore: 80** — Requires a minimum privacy score of 80/100.

Use this for production applications where privacy regressions must be caught before merge.

### Custom

Lets you configure each setting individually:

1. **Maximum acceptable risk level** — LOW, MEDIUM, or HIGH
2. **Enforce privacy checks in CI/CD?** — Yes/No
3. **Block builds/commits on violations?** — Yes/No

The resulting config uses `maxHighSeverity: 0` by default, which you can adjust manually in `.privacyrc` after generation.

## Test Wallet Address

The wizard prompts for an optional devnet wallet address. This address is stored in `.privacyrc` under `testWallets.devnet` and is used by the generated GitHub Actions workflow and pre-commit hook as the target for automated scans.

```json
{
  "testWallets": {
    "devnet": "YourWalletAddressHere"
  }
}
```

The address must be a valid 44-character base58 Solana address. You can leave it blank and add it later.

## Integrations

The final prompt lets you select which integrations to scaffold. All three are selected by default.

### GitHub Actions

**Generated file:** `.github/workflows/privacy-check.yml`

Creates a workflow that:

1. Triggers on pull requests and pushes to `main`/`develop`
2. Installs the privacy scanner globally
3. Reads the test wallet from `.privacyrc`
4. Runs `scan-wallet` and outputs `privacy-report.json`
5. Compares the report's `overallRisk` against the configured `maxRiskLevel`
6. Fails the check if the risk exceeds the threshold
7. Uploads the privacy report as a build artifact (available even on failure)

If no test wallet is configured, the scan step is skipped.

**Example failure output in CI:**
```
Risk Level: HIGH
Max Allowed: LOW
Privacy policy violated!
```

### Pre-commit Hook

**Generated file:** `.husky/pre-commit`

Creates a git hook that runs the privacy scanner before each commit:

1. Reads the test wallet from `.privacyrc`
2. Runs `scan-wallet` against the test wallet
3. Blocks the commit if the result is HIGH risk
4. Prints instructions for bypassing with `git commit --no-verify`

**Prerequisites:** Requires [husky](https://typicode.github.io/husky/) to be installed:

```bash
npm install --save-dev husky && npx husky install
```

If husky is not installed, the hook file will exist but won't be triggered by git.

### Testing Matchers

**Generated files:**
- `tests/setup.ts` — Loads custom Vitest matchers
- `tests/privacy.example.test.ts` — Example test file

The setup file imports matchers from the scanner package:

```typescript
import '@solana-privacy-scanner/ci-tools/matchers';
```

The example test demonstrates how to use `simulateTransactionPrivacy()` with the custom matchers:

```typescript
const report = await simulateTransactionPrivacy(tx, connection);

expect(report).toHavePrivacyRisk('LOW');
expect(report).toHaveNoHighRiskSignals();
expect(report).toHaveAtMostSignals(2);
```

**Available matchers:**

| Matcher | Description |
|---------|-------------|
| `toHavePrivacyRisk(level)` | Asserts the overall risk equals the given level |
| `toHaveNoHighRiskSignals()` | Asserts no HIGH severity signals exist |
| `toHaveAtMostSignals(n)` | Asserts total signal count is at most `n` |

To use these in your project, add the setup file to your Vitest config:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  },
});
```

## The `.privacyrc` File

All configuration lives in `.privacyrc` at the project root. This is a JSON file that the scanner, CI workflow, and pre-commit hook all read from. You can edit it manually after running `init`.

The full schema supports additional fields beyond what the wizard generates:

```json
{
  "maxRiskLevel": "MEDIUM",
  "enforceInCI": true,
  "blockOnFailure": false,
  "testWallets": {
    "devnet": "...",
    "testnet": "...",
    "mainnet": "..."
  },
  "thresholds": {
    "maxHighSeverity": 0,
    "maxMediumSeverity": 2,
    "minPrivacyScore": 80
  },
  "excludePatterns": [],
  "requiredHeuristics": []
}
```

The scanner also checks for `.privacyrc.json`, `privacy.config.json`, and a `privacy` field in `package.json`, in that order.

## Generated Files Summary

| File | Integration | Purpose |
|------|------------|---------|
| `.privacyrc` | Always | Privacy policy configuration |
| `.github/workflows/privacy-check.yml` | GitHub Actions | CI/CD workflow |
| `.husky/pre-commit` | Pre-commit Hook | Git hook script |
| `tests/setup.ts` | Testing Matchers | Vitest matcher setup |
| `tests/privacy.example.test.ts` | Testing Matchers | Example test |

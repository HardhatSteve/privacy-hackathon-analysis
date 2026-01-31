# solana-privacy-scanner - Analysis

## 1. Project Overview
An open-source privacy analysis tool that scans Solana wallets, transactions, and programs for privacy risks. Uses 13 heuristic-based detectors to identify privacy leaks like fee payer reuse, signer overlap, memo exposure, and interaction with known entities. Includes CLI, core library, Claude Code plugin, and web UI.

## 2. Track Targeting
**Privacy Tooling** - Diagnostic/educational tool for measuring privacy exposure rather than providing privacy.

## 3. Tech Stack
- **ZK System**: None (analysis tool, not privacy implementation)
- **Languages and frameworks**:
  - TypeScript/Node.js
  - Vitest for testing
  - Docusaurus for documentation
  - esbuild for bundling
- **Key dependencies**:
  - @solana/web3.js ^1.95.8
  - zod (schema validation)
  - @typescript-eslint/typescript-estree (static analysis)
  - glob (file matching)

## 4. Crypto Primitives
None - this is an analysis tool, not a cryptographic implementation.

## 5. Solana Integration
**Read-only RPC integration:**
- Uses QuickNode built-in endpoint (no API key required)
- Fetches transaction history for wallets
- Analyzes instruction patterns and account interactions
- Identifies known program IDs and entity addresses

**No on-chain program** - purely off-chain analysis.

## 6. Sponsor Bounty Targeting
**QuickNode** - Strong targeting:
- README badge: "Powered by QuickNode"
- Built-in QuickNode RPC endpoint
- States "An open source public good built with QuickNode"
- Zero-configuration experience using QuickNode infrastructure

## 7. Alpha/Novel Findings
- **13 privacy heuristics**: Comprehensive detection framework
- **Static code analyzer**: Catches privacy leaks in source code BEFORE deployment
- **Claude Code plugin**: AI-assisted privacy analysis integration
- **Known entity database**: Community-maintained address labels (exchanges, bridges, KYC services)
- **Narrative generation**: Human-readable reports from heuristic signals

**Heuristics implemented:**
1. Fee Payer Reuse (CRITICAL)
2. Signer Overlap (HIGH)
3. Memo Exposure (HIGH)
4. Known Entity Interaction (HIGH)
5. Identity Metadata Exposure (HIGH)
6. ATA Linkage (HIGH)
7. Address Reuse (MEDIUM)
8. Counterparty Reuse (MEDIUM)
9. Instruction Fingerprinting (MEDIUM)
10. Token Account Lifecycle (MEDIUM)
11. Priority Fee Fingerprinting (MEDIUM)
12. Staking Delegation (MEDIUM)
13. Timing Patterns (MEDIUM)

## 8. Strengths
- **Extremely polished**: Published npm packages, full documentation, web UI
- **Comprehensive heuristics**: 13 detectors cover most known privacy leaks
- **Developer-focused**: CLI, library, and static analyzer for CI/CD
- **QuickNode integration**: Clear sponsor alignment
- **Educational value**: Teaches developers about on-chain privacy risks
- **Production-ready**: Version 0.7.0, proper semver, changelogs

## 9. Weaknesses
- **Not a privacy solution**: Diagnoses problems but doesn't fix them
- **Heuristic-based**: May have false positives/negatives
- **Requires transparency**: Cannot analyze obfuscated activity
- **No remediation tooling**: Tells you what's wrong but not how to fix it
- **Centralized known-addresses**: Database could become stale

## 10. Threat Level
**HIGH** (for winning Privacy Tooling track)

Justification:
- Most polished, production-ready project in Privacy Tooling category
- Clear QuickNode sponsor alignment
- Novel approach (privacy analysis rather than privacy provision)
- Educational/public good positioning is compelling narrative
- Already has npm package downloads and GitHub stars
- Only weakness is it doesn't provide actual privacy

## 11. Implementation Completeness
**95% complete**

What's implemented:
- Core scanning engine with 13 heuristics
- CLI with wallet/transaction/program scanning
- Static code analyzer for source files
- Claude Code plugin
- Web UI (Docusaurus-based)
- npm packages published
- Full documentation
- Known entity database
- CI/CD integration examples

What's missing:
- Remediation suggestions (tells you problems, not solutions)
- Privacy score benchmarking across ecosystem
- Real-time monitoring/alerting

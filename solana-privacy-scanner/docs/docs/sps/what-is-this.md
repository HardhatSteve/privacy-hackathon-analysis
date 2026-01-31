# What is SPS?

Solana Privacy Scanner is a developer toolkit for analyzing Solana privacy risks using public on-chain data, transaction simulations, and static code analysis.

It is a completely open-source, free to use public good tool, that can be taken and extended where necessary.

## Tools Available

- **Core Library** (`solana-privacy-scanner-core`) - Scanner engine for integrating privacy analysis into apps
- **Toolkit** (`solana-privacy-scanner`) - Complete developer toolkit including CLI, static code analyzer, testing matchers, transaction simulator, and CI/CD integration
- **Claude Code Plugin** - Interactive plugin that combines static analysis with AI-powered fixing and explanations

## What it does

- Scans wallets, transactions, or programs
- Detects 13 privacy risk patterns
- Returns deterministic risk reports (LOW/MEDIUM/HIGH)
- Provides mitigation guidance

:::warning[Important]
**This tool does not deanonymize users.** It surfaces **privacy risk signals** that already exist due to public blockchain data.
:::

## How it works

**On-Chain Analysis** (Core Library, Toolkit)
Analyzes public blockchain data using standard Solana RPC calls (`getSignaturesForAddress`, `getTransaction`, etc).

**Static Code Analysis** (Toolkit)
Parses your TypeScript/JavaScript source code using AST (Abstract Syntax Tree) analysis to detect privacy anti-patterns before deployment. Runs locally on your code, no on-chain data needed.

**AI-Assisted Analysis** (Claude Code Plugin)
Combines the static analyzer with Claude's intelligence to explain issues and propose context-aware fixes. Interactive code review for privacy.

## Output

- Overall risk score (LOW / MEDIUM / HIGH)
- Individual risk signals with evidence
- Mitigation recommendations
- JSON or human-readable format

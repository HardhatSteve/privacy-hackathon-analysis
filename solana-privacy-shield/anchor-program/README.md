# Solana Privacy Report Anchor Program

This directory contains the Anchor program for anchoring privacy reports on Solana Devnet.

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)

## Setup

```bash
# Install dependencies
anchor build

# Deploy to devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

## Program Structure

The program stores anchored reports with:
- `reporter`: The wallet that anchored the report
- `analyzed_wallet`: The wallet that was analyzed
- `report_hash`: SHA-256 hash of the report payload
- `created_at`: Unix timestamp of anchoring

## PDA Derivation

Reports are stored at PDAs derived from:
```
seeds = ["report", reporter.key, report_hash]
```

This prevents duplicate anchoring of the same hash by the same reporter.

## After Deployment

1. Copy the deployed program ID
2. Update `ANCHOR_PROGRAM_ID` in `src/lib/anchor-program.ts`
3. The frontend will automatically use the custom program

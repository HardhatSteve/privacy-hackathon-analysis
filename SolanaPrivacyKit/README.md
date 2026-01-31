# privacy-devkit-solana

Monorepo for the Solana Privacy Devkit: SDK, CLI, and demo app.

**This project is devnet-only.** Mainnet is not supported; all RPC and config default to Solana devnet.

## Structure

- **packages/sdk** – TypeScript SDK for privacy-preserving Solana operations (builds with `tsc`)
- **packages/cli** – CLI built with Commander.js
- **apps/demo** – Next.js 14+ demo app (App Router, TypeScript)

## Prerequisites

- Node.js 18+
- npm 9+ (for workspaces)

## Setup

```bash
npm install
```

## Build

```bash
# Build all workspaces
npm run build

# Build SDK only
npm run build:sdk

# Build CLI only
npm run build:cli
```

## Development

```bash
# Run demo app
npm run dev:demo
```

## Workspaces

This repo uses [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). Workspaces are defined in the root `package.json`:

- `packages/*` – SDK, CLI
- `apps/*` – Demo Next.js app

## License

MIT
=======
# SolanaPrivacyKit
Privacy DevKit for Solana – developer toolkit for plug-and-play privacy

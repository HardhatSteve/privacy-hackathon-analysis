 # Solana Privacy Devkit — Demo App

Next.js 14+ demo for the Privacy Devkit: connect Phantom (devnet), shield, transfer, and verify proofs via API routes.

## Run locally

```bash
# From repo root (recommended: install all workspaces first)
pnpm install
pnpm run build:sdk

# From apps/demo
cd apps/demo
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment (optional)

Create `apps/demo/.env.local` if you want to override SDK config used by the API routes (server-side):

```env
# Optional: RPC URL (default: devnet)
RPC_URL=https://api.devnet.solana.com

# Optional: ShadowWire backend (set both to use ShadowWire instead of mock)
# SHADOWWIRE_API_KEY=your_key
# SHADOWWIRE_WALLET=your_wallet_base58
```

If these are not set, the app uses the **mock** backend (format-only verification, stub shield/transfer).

## Features

- **Connect wallet** — Phantom via `@solana/wallet-adapter-react` (devnet).
- **Shield** — Amount + token (SOL/USDC); calls `POST /api/shield` → `sdk.shieldAmount`.
- **Shielded balance** — Placeholder (real balance would come from a backend/API).
- **Private transfer** — Recipient + amount; calls `POST /api/transfer` → `sdk.createPrivateTransfer`.
- **Verify proof** — Proof hex + optional public inputs; calls `POST /api/verify` → `sdk.verifyZKProof`.

All SDK usage is server-side only (API routes). The frontend does not import the SDK.

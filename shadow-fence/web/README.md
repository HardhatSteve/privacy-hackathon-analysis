# Shadow Fence Web UI

Privacy-preserving location verification on Solana using Zero-Knowledge Proofs.

## Setup

```bash
npm install
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_PROGRAM_ID=<your-program-id-on-devnet>
NEXT_PUBLIC_NETWORK=devnet
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Features

- 🔐 Zero-Knowledge Proof generation
- 💼 Wallet connection (Phantom, Solflare, Ledger)
- 📊 Reputation dashboard
- 🗺️ Geofencing verification
- ✨ Responsive Tailwind UI

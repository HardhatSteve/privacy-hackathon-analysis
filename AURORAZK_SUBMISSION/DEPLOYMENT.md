# Deployment Guide

## Prerequisites

- Node.js 18+
- Solana CLI (optional)
- [Helius API Key](https://helius.dev) (free)

---

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/PotluckProtocol/AuroraZK.git
cd AuroraZK
npm install
```

### 2. Configure Matcher

```bash
cd matcher
cp .env.example .env
node src/generate-keys.js
# Copy the output values to .env
```

**matcher/.env:**
```env
PORT=3001
SOLANA_RPC=https://api.devnet.solana.com
MATCHER_WALLET=./matcher-wallet.json
MATCHER_ENCRYPTION_SECRET=<from generate-keys.js>
PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi
```

### 3. Configure Frontend

```bash
cd app
cp .env.example .env.local
```

**app/.env.local:**
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MATCHER_URL=http://localhost:3001
NEXT_PUBLIC_HELIUS_API_KEY=<your-helius-key>
NEXT_PUBLIC_PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi
```

### 4. Fund Matcher Wallet

```bash
solana airdrop 2 <MATCHER_PUBLIC_KEY> --url devnet
```

### 5. Start Services

**Terminal 1:**
```bash
cd matcher && npm start
```

**Terminal 2:**
```bash
cd app && npm run dev
```

### 6. Seed Orders

```bash
cd matcher && node src/seed-onchain.js
```

Visit `http://localhost:3000`

---

## Cloud Deployment

### Matcher → Railway

1. Create project at [railway.app](https://railway.app)
2. Connect GitHub repo
3. Set root directory: `matcher`
4. Add environment variables:

```env
PORT=3001
SOLANA_RPC=https://api.devnet.solana.com
PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi
MATCHER_WALLET_KEY=<base64-encoded-wallet>
MATCHER_ENCRYPTION_SECRET=<secret>
```

**Encode wallet for Railway:**
```bash
# PowerShell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("matcher-wallet.json"))

# Linux/Mac
cat matcher-wallet.json | base64
```

### Frontend → Vercel

1. Create project at [vercel.com](https://vercel.com)
2. Connect GitHub repo
3. Set root directory: `app`
4. Add environment variables:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MATCHER_URL=https://your-matcher.up.railway.app
NEXT_PUBLIC_HELIUS_API_KEY=<your-key>
NEXT_PUBLIC_PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi
```

---

## Verify Deployment

```bash
# Matcher health
curl https://your-matcher.up.railway.app/health

# Order book stats
curl https://your-matcher.up.railway.app/stats

# Load seeded orders
curl -X POST https://your-matcher.up.railway.app/load-onchain-orders
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Orders not matching | Re-run `seed-onchain.js`, then `/load-onchain-orders` |
| Insufficient funds | Airdrop more devnet SOL to matcher wallet |
| Light Protocol errors | Check Helius API key is valid |
| CORS errors | Verify `NEXT_PUBLIC_MATCHER_URL` is correct |

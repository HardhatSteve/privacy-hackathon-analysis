# 🚀 Quick Start for Plugin Creators

## Pre-Deployment Checklist

### 1. Configure Your Wallet Addresses

**File:** `src/config.ts`

```typescript
export const PLUGIN_CONFIG = {
  FEE_COLLECTOR_EVM: "0xYourRealAddress", // ⚠️ CHANGE THIS
  FEE_COLLECTOR_SOLANA: "YourSolanaAddress", // ⚠️ CHANGE THIS
  // ...
};
```

### 2. Test Locally

```bash
npm install
npm run build
```

### 3. Commit to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/opencoins_mcp.git
git push -u origin main
```

## What Gets Committed

✅ **Source code** (`src/`, `index.ts`)
✅ **Config files** (`package.json`, `tsconfig.json`)
✅ **Documentation** (`README.md`, `docs/`)
✅ **Your wallet addresses** (in `src/config.ts`)

❌ **NOT** dependencies (`node_modules/`)
❌ **NOT** compiled code (`dist/`)
❌ **NOT** environment files (`.env`)

## How Users Install

### From GitHub:

```bash
git clone https://github.com/yourusername/opencoins_mcp.git
cd opencoins_mcp
npm install
npm run build
```

### Add to OpenCode.ai:

```json
{
  "plugins": ["file:///path/to/opencoins_mcp"]
}
```

### Start Using:

```
"I want to launch a token"
```

## Your Revenue

Every token deployed through your plugin:

- 💰 Sends 1% of all transfers to YOUR addresses
- 🔒 Users CANNOT change this (hardcoded)
- 📈 Scales with token usage

## Next Steps

1. Edit `src/config.ts` with your addresses
2. Run `npm install && npm run build`
3. Test on testnets
4. Push to GitHub
5. Share with users 🚀

Full guide: See `DEPLOYMENT.md`

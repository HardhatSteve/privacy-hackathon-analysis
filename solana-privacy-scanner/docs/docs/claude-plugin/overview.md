---
sidebar_position: 1
---

# Claude Plugin

AI-powered privacy analysis integrated directly into Claude Code.

## Installation

**Step 1:** Run this in your terminal to add the marketplace:

```bash
node -e "const fs=require('fs'),p=require('os').homedir()+'/.claude/settings.json';let s={};try{s=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}s.extraKnownMarketplaces={...s.extraKnownMarketplaces,'solana-privacy-scanner-marketplace':{source:{source:'github',repo:'taylorferran/solana-privacy-scanner'}}};fs.mkdirSync(require('os').homedir()+'/.claude',{recursive:true});fs.writeFileSync(p,JSON.stringify(s,null,2))"
```

**Step 2:** Restart Claude Code (fully close and reopen)

**Step 3:** Inside Claude Code, run `/plugins`, go to the **Discover** tab, and install `solana-privacy-scanner`

## Available Skills

- `/scan-wallet` - Analyze on-chain wallet privacy
- `/scan-code` - Detect privacy risks in source code
- `/explain-risk` - Learn about specific privacy risks
- `/suggest-fix` - Get code fixes for detected issues
- `/privacy-audit` - Full codebase privacy audit

## Quick Examples

**Scan a wallet:**

```
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
```

**Analyze your code:**

```
/scan-code src/transactions.ts
```

**Learn about a risk:**

```
/explain-risk fee-payer-reuse
```

**Get a fix suggestion:**

```
/suggest-fix fee-payer-reuse
```

## Configuration

**Custom RPC endpoint:**

```bash
export SOLANA_RPC=https://your-rpc-url.com
```

Or use the `--rpc` flag:

```
/scan-wallet ADDRESS --rpc https://your-rpc.com
```

**Limit transaction depth:**

```
/scan-wallet ADDRESS --max-signatures 50
```

## Next Steps

- **[Skills Reference](./skills)** - Complete skill documentation

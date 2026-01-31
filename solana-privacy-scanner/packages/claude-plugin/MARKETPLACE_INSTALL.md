# Install Solana Privacy Scanner Plugin - Marketplace

This is the **recommended** way to install the Solana Privacy Scanner plugin for Claude Code.

## Quick Install

**Step 1:** Run this in your terminal to add the marketplace:

```bash
node -e "const fs=require('fs'),p=require('os').homedir()+'/.claude/settings.json';let s={};try{s=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}s.extraKnownMarketplaces={...s.extraKnownMarketplaces,'solana-privacy-scanner-marketplace':{source:{source:'github',repo:'taylorferran/solana-privacy-scanner'}}};fs.mkdirSync(require('os').homedir()+'/.claude',{recursive:true});fs.writeFileSync(p,JSON.stringify(s,null,2))"
```

**Step 2:** Restart Claude Code (fully close and reopen)

**Step 3:** Inside Claude Code, run `/plugins`, go to the **Discover** tab, and install `solana-privacy-scanner`

## What You Get

Four powerful skills for Solana privacy analysis:

### `/scan-code` - Static Code Analysis
Detect privacy anti-patterns in your source code.

```shell
/scan-code src/transactions.ts
/scan-code src/**/*.ts
```

**Detects:**
- Fee payer reuse patterns (CRITICAL)
- PII in transaction memos
- Address reuse issues
- Signer overlap problems

### `/scan-wallet` - On-Chain Wallet Analysis
Analyze real wallet privacy using blockchain data.

```shell
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
/scan-wallet YOUR_WALLET --max-signatures 50
/scan-wallet YOUR_WALLET --rpc https://your-rpc.com
```

**Provides:**
- Overall risk assessment (LOW/MEDIUM/HIGH)
- Detailed privacy signals with evidence
- Actionable mitigation recommendations

### `/explain-risk` - Learn About Privacy Risks
Get AI-powered explanations of specific privacy risks.

```shell
/explain-risk fee-payer-reuse
/explain-risk memo-pii
/explain-risk signer-overlap
```

**Includes:**
- What the risk is and why it matters
- Real-world deanonymization examples
- Detection methods
- Fix strategies
- Best practices

### `/suggest-fix` - Get Code Fixes
Receive AI-generated code fixes for detected issues.

```shell
/suggest-fix fee-payer-reuse
/suggest-fix memo-pii
```

**Provides:**
- Before/after code examples
- Step-by-step implementation guide
- Testing recommendations

## Complete Workflow Example

Here's how to do a full privacy audit:

```shell
# 1. Scan your code
/scan-code src/transactions.ts

# Output shows:
# ⚠️ Found 2 CRITICAL issues:
#   - Fee payer reuse pattern detected
#   - PII detected in memo field

# 2. Learn about the risks
/explain-risk fee-payer-reuse

# Output shows detailed 10-section explanation

# 3. Get a fix
/suggest-fix fee-payer-reuse

# Output shows before/after code with implementation steps

# 4. Apply the fix
# [Implement the suggested changes]

# 5. Verify the fix worked
/scan-code src/transactions.ts

# Output shows:
# ✅ No privacy risks detected
```

## Installation Details

### Step 1: Add the Marketplace

Run this in your terminal (not inside Claude Code):

```bash
node -e "const fs=require('fs'),p=require('os').homedir()+'/.claude/settings.json';let s={};try{s=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}s.extraKnownMarketplaces={...s.extraKnownMarketplaces,'solana-privacy-scanner-marketplace':{source:{source:'github',repo:'taylorferran/solana-privacy-scanner'}}};fs.mkdirSync(require('os').homedir()+'/.claude',{recursive:true});fs.writeFileSync(p,JSON.stringify(s,null,2))"
```

This adds the marketplace to your `~/.claude/settings.json` without overwriting any existing settings. The marketplace is hosted on GitHub at:
https://github.com/taylorferran/solana-privacy-scanner

### Step 2: Restart Claude Code

Fully close and reopen Claude Code so it picks up the new marketplace.

### Step 3: Install the Plugin

Inside Claude Code, run `/plugins`, go to the **Discover** tab, and install `solana-privacy-scanner`.

### Step 4: Verify Installation

Run `/plugins` and check the **Installed** tab. You should see:

```
solana-privacy-scanner@solana-privacy-scanner-marketplace (enabled)
```

## Update the Plugin

When new versions are released:

```shell
# Update the marketplace to see new versions
/plugin marketplace update solana-privacy-scanner-marketplace

# Update the plugin
/plugin update solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## Uninstall

```shell
# Remove the plugin
/plugin uninstall solana-privacy-scanner@solana-privacy-scanner-marketplace

# Remove the marketplace (optional)
/plugin marketplace remove solana-privacy-scanner-marketplace
```

## Configuration

### Custom RPC Endpoint

Set a custom Solana RPC endpoint:

```bash
export SOLANA_RPC=https://your-quicknode-endpoint.com
```

Or pass it as a flag:

```shell
/scan-wallet ADDRESS --rpc https://your-rpc.com
```

### Scan Limits

Control how much data to fetch:

```shell
/scan-wallet ADDRESS --max-signatures 100
```

Lower values = faster scans, less comprehensive
Higher values = slower scans, more comprehensive

## Troubleshooting

### Plugin Not Found

**Error:** "Plugin not found in marketplace"

**Solution:**
```shell
# Refresh the marketplace
/plugin marketplace update solana-privacy-scanner-marketplace

# Try installing again
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

### Skills Not Working

**Error:** "Unknown command: /scan-code"

**Solutions:**
1. Verify plugin is enabled:
   ```shell
   /plugin list
   ```

2. Enable if disabled:
   ```shell
   /plugin enable solana-privacy-scanner@solana-privacy-scanner-marketplace
   ```

3. Restart Claude Code session

### RPC Errors

**Error:** "Failed to fetch wallet data" or rate limiting

**Solutions:**
1. Use a custom RPC endpoint: `--rpc https://your-rpc.com`
2. Reduce batch size: `--max-signatures 10`
3. Wait a moment and retry (rate limits are temporary)
4. Check internet connection

### Dependencies Missing

**Error:** Module not found errors

**Cause:** Plugin installation issue

**Solution:**
```shell
# Uninstall and reinstall
/plugin uninstall solana-privacy-scanner@solana-privacy-scanner-marketplace
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## Why Use the Marketplace?

Benefits over npm installation:

✅ **Automatic updates** - Get notified of new versions
✅ **Easier installation** - Two commands, no npm required
✅ **Native integration** - Designed for Claude Code
✅ **Version management** - Easy to switch versions
✅ **Discovery** - Browse available plugins
✅ **Dependencies handled** - Claude Code manages everything

## Example Use Cases

### 1. Pre-Commit Privacy Check

```shell
# Before committing code
/scan-code src/**/*.ts

# If issues found, learn and fix
/explain-risk <risk-id>
/suggest-fix <risk-id>
```

### 2. Wallet Privacy Audit

```shell
# Check your development wallet
/scan-wallet YOUR_DEV_WALLET

# Review the signals and mitigations
# Apply recommended changes
```

### 3. Learning Privacy Concepts

```shell
# Explore all available risks
/explain-risk fee-payer-reuse
/explain-risk memo-pii
/explain-risk signer-overlap
/explain-risk address-reuse
```

### 4. Code Review

```shell
# During PR review
/scan-code src/changed-file.ts

# Check if changes introduce privacy risks
# Request fixes if needed
```

## Getting Help

- **Documentation:** https://taylorferran.github.io/solana-privacy-scanner
- **Issues:** https://github.com/taylorferran/solana-privacy-scanner/issues
- **Examples:** See `/docs` in the repository

## What's Next?

Try these commands to get started:

```shell
# Learn about all privacy risks
/explain-risk fee-payer-reuse

# Scan a test wallet
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy

# Analyze your project
/scan-code src/**/*.ts
```

## Plugin Information

- **Name:** solana-privacy-scanner
- **Marketplace:** solana-privacy-scanner-marketplace
- **Version:** 0.1.0
- **License:** MIT
- **Author:** Taylor Ferran
- **Repository:** https://github.com/taylorferran/solana-privacy-scanner
- **Homepage:** https://taylorferran.github.io/solana-privacy-scanner

Happy privacy scanning! 🔒

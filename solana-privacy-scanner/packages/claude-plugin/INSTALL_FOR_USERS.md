# Installing Solana Privacy Scanner Plugin for Claude Code

This guide is for **users** who want to install and use the Solana Privacy Scanner plugin with Claude Code.

## Prerequisites

1. **Claude Code CLI** installed and authenticated
   ```bash
   # Check if Claude Code is installed
   claude --version
   ```

2. **Node.js** version 18 or higher
   ```bash
   node --version
   ```

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g solana-privacy-scanner-plugin
```

### Option 2: Install in a specific project

```bash
# In your project directory
npm install --save-dev solana-privacy-scanner-plugin
```

## Verify Installation

Check that the plugin is installed correctly:

```bash
# Global installation
npm list -g solana-privacy-scanner-plugin

# Local installation
npm list solana-privacy-scanner-plugin
```

## Configure Claude Code

Claude Code should automatically detect the plugin if it's installed. To verify, start a Claude Code session:

```bash
claude code
```

Then try running a plugin skill:

```
/scan-code --help
```

If the skill is recognized, the plugin is working!

## Available Skills

### 1. `/scan-code` - Analyze Source Code

Scan your Solana code for privacy anti-patterns:

```
/scan-code src/transactions.ts
/scan-code src/**/*.ts
```

**Detects:**
- Fee payer reuse patterns
- PII in transaction memos
- Address reuse issues
- Signer overlap problems

### 2. `/scan-wallet` - Analyze Wallet Privacy

Analyze on-chain wallet privacy:

```
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
/scan-wallet YOUR_WALLET --max-signatures 50
/scan-wallet YOUR_WALLET --rpc https://your-rpc.com
```

**Provides:**
- Overall risk assessment (LOW/MEDIUM/HIGH)
- Privacy signals with evidence
- Mitigation recommendations

### 3. `/explain-risk` - Learn About Privacy Risks

Get detailed explanations of specific privacy risks:

```
/explain-risk fee-payer-reuse
/explain-risk memo-pii
/explain-risk signer-overlap
```

**Includes:**
- What the risk is
- Why it matters
- Real-world examples
- How to detect it
- How to fix it
- Best practices

### 4. `/suggest-fix` - Get Code Fixes

Generate code fixes for detected privacy issues:

```
/suggest-fix fee-payer-reuse
/suggest-fix memo-pii
```

**Provides:**
- Before/after code examples
- Step-by-step implementation
- Testing recommendations

## Example Workflow

Here's a complete privacy audit workflow:

```
# 1. Scan your code
/scan-code src/transactions.ts

# 2. Review the findings
# [Claude will show detected issues]

# 3. Learn about a specific risk
/explain-risk fee-payer-reuse

# 4. Get a fix suggestion
/suggest-fix fee-payer-reuse

# 5. Apply the fix to your code
# [Implement the suggested changes]

# 6. Verify the fix
/scan-code src/transactions.ts
```

## Configuration Options

### Custom RPC Endpoint

Set a custom Solana RPC endpoint:

```bash
export SOLANA_RPC=https://your-quicknode-endpoint.com
```

Or pass it as a flag:

```
/scan-wallet ADDRESS --rpc https://your-rpc.com
```

### Scan Limits

Control how much data to fetch:

```
/scan-wallet ADDRESS --max-signatures 100
```

## Troubleshooting

### Plugin Not Found

**Error:** "Unknown skill" or command not recognized

**Solutions:**
1. Verify installation: `npm list -g solana-privacy-scanner-plugin`
2. Restart Claude Code session
3. Try local installation: `npm install solana-privacy-scanner-plugin`
4. Check Node.js version: `node --version` (needs 18+)

### RPC Errors

**Error:** "Failed to fetch wallet data" or rate limiting

**Solutions:**
1. Use a custom RPC endpoint: `--rpc https://your-rpc.com`
2. Reduce batch size: `--max-signatures 10`
3. Wait a moment and retry (rate limits are temporary)
4. Check internet connection

### No Risks Detected

**Message:** "No privacy risks detected"

This is good! It means your code/wallet follows privacy best practices. To verify the scanner is working:

```
# Test with a known bad pattern
/explain-risk fee-payer-reuse
# This will show what the scanner looks for
```

## Best Practices

1. **Scan Early, Scan Often**
   - Run `/scan-code` before committing code
   - Include privacy checks in your PR process

2. **Learn from Explanations**
   - Use `/explain-risk` to understand why issues matter
   - Review the "Why It Matters" sections

3. **Verify Fixes**
   - Re-scan after applying fixes
   - Test your changes thoroughly

4. **Wallet Analysis**
   - Scan your development wallets regularly
   - Use `--max-signatures` to control scan depth

## Getting Help

- **Documentation:** https://taylorferran.github.io/solana-privacy-scanner
- **Issues:** https://github.com/taylorferran/solana-privacy-scanner/issues
- **Examples:** See `/docs` in the repository

## What's Next?

Try these commands to get started:

```
# List available risks to learn about
/explain-risk --list

# Scan a test wallet
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy

# Analyze your project
/scan-code src/**/*.ts
```

## Uninstalling

```bash
# Global installation
npm uninstall -g solana-privacy-scanner-plugin

# Local installation
npm uninstall solana-privacy-scanner-plugin
```

## Plugin Information

- **Version:** 0.1.0
- **License:** MIT
- **Author:** Taylor Ferran
- **Repository:** https://github.com/taylorferran/solana-privacy-scanner

Happy privacy scanning! 🔒

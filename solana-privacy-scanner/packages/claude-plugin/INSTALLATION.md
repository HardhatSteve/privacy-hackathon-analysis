# Claude Code Plugin Installation Guide

## Prerequisites

1. **Claude Code CLI installed** and authenticated
2. **Plugin built** - Run `npm run build` in `packages/claude-plugin`
3. **Dependencies installed** - Both `packages/core` and `packages/cli` built

## Installation Steps

### Option 1: Install from Local Directory (Recommended for Testing)

Claude Code can load plugins from local directories:

```bash
# From the claude-plugin directory
cd packages/claude-plugin

# Make sure everything is built
npm run build

# The plugin is now ready - Claude Code can reference this directory
pwd
# Copy this path - you'll need it
```

### Option 2: Symlink to Claude's Plugin Directory

If Claude Code has a plugins directory (check Claude Code docs), you can symlink:

```bash
# Find Claude's plugin directory (example paths, check docs)
# MacOS: ~/.claude/plugins/
# Linux: ~/.config/claude/plugins/

# Create symlink
ln -s /Users/taylorferran/Desktop/dev/solana-privacy-scanner/packages/claude-plugin ~/.claude/plugins/solana-privacy-scanner
```

### Option 3: Package as NPM Module

For distribution, you can publish to npm:

```bash
# In packages/claude-plugin
npm pack
# Creates solana-privacy-scanner-plugin-0.1.0.tgz

# Install globally or in project
npm install -g solana-privacy-scanner-plugin-0.1.0.tgz
```

## Verify Plugin Structure

The plugin should have this structure:

```
packages/claude-plugin/
├── .claude-plugin/
│   └── manifest.json          # ✅ Plugin metadata
├── skills/
│   ├── scan-code/
│   │   ├── skill.md           # ✅ Skill definition
│   │   └── handler.ts         # ✅ Handler (source)
│   ├── scan-wallet/
│   ├── explain-risk/
│   └── suggest-fix/
├── dist/
│   ├── skills/                # ✅ Compiled handlers
│   └── src/                   # ✅ Compiled APIs
├── package.json               # ✅ Dependencies
└── node_modules/              # ✅ Dependencies installed
```

## Check Plugin Manifest

Verify the manifest is correct:

```bash
cat .claude-plugin/manifest.json
```

Should show:
```json
{
  "name": "solana-privacy-scanner-plugin",
  "version": "0.1.0",
  "description": "AI-powered Solana privacy analysis for developers",
  "skills": [
    { "name": "scan-code", "path": "skills/scan-code" },
    { "name": "scan-wallet", "path": "skills/scan-wallet" },
    { "name": "explain-risk", "path": "skills/explain-risk" },
    { "name": "suggest-fix", "path": "skills/suggest-fix" }
  ]
}
```

## Using the Plugin in Claude Code

### Start Claude Code Session

```bash
# Start Claude Code in your project directory
claude code

# Or start in test-toolkit directory to test
cd ../../test-toolkit
claude code
```

### Test Each Skill

Once in Claude Code session:

**1. Test scan-code:**
```
/scan-code src/fee-payer-bad.ts
```

Expected: Should detect 2 CRITICAL fee payer issues

**2. Test scan-wallet:**
```
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 20
```

Expected: Should show privacy report with signals

**3. Test explain-risk:**
```
/explain-risk fee-payer-reuse
```

Expected: Should show 10-section detailed explanation

**4. Test suggest-fix:**
```
/suggest-fix fee-payer-reuse
```

Expected: Should show before/after code

**5. Test workflow:**
```
/scan-code src/fee-payer-bad.ts
[Review results]

/explain-risk fee-payer-reuse
[Learn about the risk]

/suggest-fix fee-payer-reuse
[Get the fix]
```

## Troubleshooting

### Plugin Not Found

**Issue:** Claude Code says "Unknown skill" or doesn't recognize commands

**Solutions:**
1. Check plugin directory path is correct
2. Verify manifest.json exists in `.claude-plugin/`
3. Restart Claude Code session
4. Check Claude Code logs for errors

### Skills Not Loading

**Issue:** Plugin recognized but skills don't work

**Solutions:**
1. Verify `npm run build` completed successfully
2. Check `dist/` directory has compiled files
3. Verify handler files exist: `dist/skills/*/handler.js`
4. Check for TypeScript compilation errors

### Dependencies Not Found

**Issue:** Errors about missing modules

**Solutions:**
```bash
# Install dependencies
npm install

# Rebuild everything
npm run clean
npm run build

# Check core and cli packages are built
cd ../core && npm run build
cd ../cli && npm run build
cd ../claude-plugin
```

### RPC Errors

**Issue:** Wallet scanning fails with RPC errors

**Solutions:**
1. Check internet connection
2. Use custom RPC: `/scan-wallet ADDRESS --rpc https://your-rpc.com`
3. Reduce batch size: `--max-signatures 10`
4. Rate limiting is normal - scanner has automatic retries

## Environment Variables

Set these for better experience:

```bash
# Optional: Custom Solana RPC
export SOLANA_RPC=https://your-quicknode-endpoint.com

# The plugin will use this automatically
```

## Testing Checklist

Before using in production, verify:

- [ ] All 4 skills load successfully
- [ ] `/scan-code` detects issues in test files
- [ ] `/scan-wallet` can scan real wallets
- [ ] `/explain-risk` shows detailed explanations
- [ ] `/suggest-fix` provides code examples
- [ ] Workflows can be chained together
- [ ] Error handling works (invalid inputs)
- [ ] Output is readable and formatted

## Next Steps

Once plugin is working:

1. **Test with Your Code**
   ```
   /scan-code src/**/*.ts
   ```

2. **Analyze Your Wallets**
   ```
   /scan-wallet YOUR_WALLET_ADDRESS
   ```

3. **Learn Privacy Concepts**
   ```
   /explain-risk --list
   /explain-risk <risk-id>
   ```

4. **Apply Fixes**
   ```
   /suggest-fix <risk-id>
   ```

## Distribution

To share the plugin with others:

1. **Publish to NPM:**
   ```bash
   npm publish
   ```

2. **Create GitHub Release:**
   - Tag version: `v0.1.0`
   - Attach packaged plugin
   - Include installation instructions

3. **Submit to Claude Code Plugin Registry:**
   - Follow Claude Code submission guidelines
   - Include demo/screenshots
   - Provide documentation

## Support

If you encounter issues:

1. Check `TEST_GUIDE.md` for manual testing
2. Run integration tests: `npm test`
3. Check Claude Code logs
4. Open issue on GitHub

## Plugin Info

- **Name:** solana-privacy-scanner-plugin
- **Version:** 0.1.0
- **Skills:** 4 (scan-code, scan-wallet, explain-risk, suggest-fix)
- **Author:** Taylor Ferran
- **License:** MIT
- **Repository:** https://github.com/taylorferran/solana-privacy-scanner

Ready to use! 🚀

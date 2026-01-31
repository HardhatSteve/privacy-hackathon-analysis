# 📦 Publishing to npm - Easy Installation for Users

## Why Publish to npm?

Once published to npm, users can install with just:

```json
{
  "plugins": ["@opencoins/launchpad-mcp"]
}
```

**No build required!** OpenCode.ai downloads the pre-compiled package.

## Prerequisites

### 1. npm Account

Create account at https://www.npmjs.com/signup

### 2. Choose Package Name

Check availability: https://www.npmjs.com/package/@yourusername/opencoins-launchpad-mcp

Update `package.json`:

```json
{
  "name": "@yourusername/opencoins-launchpad-mcp",
  ...
}
```

## Publication Steps

### Step 1: Configure Your Wallets

**CRITICAL**: Edit `src/config.ts` with YOUR addresses:

```typescript
export const PLUGIN_CONFIG = {
  FEE_COLLECTOR_EVM: '0xYourRealAddress',
  FEE_COLLECTOR_SOLANA: 'YourRealSolanaAddress',
  ...
}
```

### Step 2: Update package.json

```json
{
  "name": "@yourusername/opencoins-launchpad-mcp",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/opencoins_mcp.git"
  },
  "author": "Your Name <your@email.com>",
  ...
}
```

### Step 3: Build the Package

```bash
# Install dependencies
npm install

# Build TypeScript → JavaScript
npm run build
```

This creates `dist/` folder with compiled code.

### Step 4: Test Locally

```bash
# Test the built package
npm pack

# This creates opencoins-launchpad-mcp-1.0.0.tgz
# Install it locally to test
npm install -g ./opencoins-launchpad-mcp-1.0.0.tgz
```

### Step 5: Login to npm

```bash
npm login
```

Enter your npm credentials.

### Step 6: Publish

```bash
# For scoped packages (recommended)
npm publish --access public

# The build runs automatically via prepublishOnly script
```

## What Gets Published to npm

✅ **dist/** - Compiled JavaScript (your wallet addresses compiled in)
✅ **src/** - Source TypeScript (for reference)
✅ **docs/** - Documentation
✅ **README.md** - Main documentation
✅ **LICENSE** - License file
✅ **package.json** - Package metadata

❌ **node_modules/** - Not included
❌ **.env** - Not included
❌ **test files** - Not included

## After Publishing

### Users Install With:

```json
{
  "plugins": ["@yourusername/opencoins-launchpad-mcp"]
}
```

That's it! OpenCode.ai:

1. Downloads from npm
2. Installs dependencies automatically
3. Uses the pre-compiled `dist/` code
4. Ready to use immediately

### Check Your Package

View at: `https://www.npmjs.com/package/@yourusername/opencoins-launchpad-mcp`

## Updating the Plugin

### Version 1.1.0 Example

```bash
# 1. Make your changes to src/

# 2. Update version
npm version patch  # 1.0.0 → 1.0.1
# OR
npm version minor  # 1.0.0 → 1.1.0
# OR
npm version major  # 1.0.0 → 2.0.0

# 3. Update CHANGELOG.md

# 4. Publish
npm publish
```

Users get the update automatically (or when they update OpenCode.ai).

## Package Versions

Follow [Semantic Versioning](https://semver.org/):

- **1.0.0** → **1.0.1** (patch): Bug fixes
- **1.0.0** → **1.1.0** (minor): New features, backwards compatible
- **1.0.0** → **2.0.0** (major): Breaking changes

## Complete Publication Checklist

- [ ] Wallet addresses configured in `src/config.ts`
- [ ] Tested on testnets (Sepolia, Devnet)
- [ ] All docs updated
- [ ] GitHub repository created and pushed
- [ ] Package name available on npm
- [ ] `package.json` has correct name and metadata
- [ ] `npm run build` works successfully
- [ ] `npm pack` and local test successful
- [ ] Logged into npm (`npm login`)
- [ ] README has installation instructions
- [ ] CHANGELOG.md updated
- [ ] Ready to publish!

## npm Publication Command

```bash
# Final check
npm run build
npm test  # if you have tests

# Publish
npm publish --access public

# Success! 🎉
```

## After First Publication

### Update README

````markdown
## Installation

```json
{
  "plugins": ["@yourusername/opencoins-launchpad-mcp"]
}
```
````

That's it! No build required.

```

### Announce

- Twitter/X
- Reddit (r/cryptocurrency, r/ethdev)
- Discord servers
- Your website

### Example Announcement:

```

🚀 OpenCoins Launchpad is now on npm!

Deploy tokens on EVM & Solana with AI assistance.

Install:
{
"plugins": ["@yourusername/opencoins-launchpad-mcp"]
}

Features:
✨ Interactive guided wizard
🔒 Professional smart contracts
💰 Only 1% service fee
🌐 Multi-chain support

npm: https://www.npmjs.com/package/@yourusername/opencoins-launchpad-mcp

````

## Maintaining the Package

### Monitor Downloads

```bash
npm info @yourusername/opencoins-launchpad-mcp
````

View stats at: https://npm-stat.com/charts.html?package=@yourusername/opencoins-launchpad-mcp

### Respond to Issues

- GitHub Issues for bug reports
- npm page for package info
- Update regularly with fixes

### Regular Updates

```bash
# Monthly or as needed
npm version patch
npm publish
```

## Revenue Tracking

With each download/usage:

- Users deploy tokens through your plugin
- 1% of all transfers → YOUR wallets
- Monitor your wallet balances
- Scale with adoption! 📈

## Troubleshooting

### "Package name already exists"

Change name in `package.json`:

```json
{
  "name": "@yourusername/opencoins-launchpad-v2"
}
```

### "Access denied"

For scoped packages:

```bash
npm publish --access public
```

### "Build folder empty"

```bash
npm run build
# Check dist/ exists
ls dist/
```

### "prepublishOnly failed"

Ensure TypeScript compiles:

```bash
npm run build
```

Fix any TypeScript errors before publishing.

## Best Practices

1. ✅ Always test locally before publishing
2. ✅ Update version number for each release
3. ✅ Maintain CHANGELOG.md
4. ✅ Test on multiple platforms if possible
5. ✅ Respond to user issues promptly
6. ✅ Keep dependencies updated
7. ✅ Document breaking changes clearly

## Need Help?

- npm docs: https://docs.npmjs.com/
- Semantic Versioning: https://semver.org/
- Package.json guide: https://docs.npmjs.com/cli/v9/configuring-npm/package-json

## Success!

Once published:

- ✅ Users install instantly with just package name
- ✅ No build steps required
- ✅ Automatic updates
- ✅ Professional distribution
- ✅ Start earning from your launchpad! 💰

# 📦 Deployment & Distribution Guide

## Before You Deploy

### 1. Configure Your Wallet Addresses

**CRITICAL**: Edit `src/config.ts` and add YOUR wallet addresses:

```typescript
export const PLUGIN_CONFIG = {
  // ⚠️ REPLACE WITH YOUR REAL ADDRESSES ⚠️
  FEE_COLLECTOR_EVM: "0xYourRealEvmAddress", // Your Ethereum/BSC/Polygon wallet
  FEE_COLLECTOR_SOLANA: "YourRealSolanaAddress", // Your Solana wallet

  PLUGIN_NAME: "OpenCoins Launchpad",
  PLUGIN_VERSION: "1.0.0",
  FEE_PERCENTAGE: 1,

  SUPPORT_URL: "https://github.com/yourusername/opencoins_mcp",
  DOCUMENTATION_URL: "https://github.com/yourusername/opencoins_mcp/docs",
} as const;
```

### 2. Test Locally First

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Test on testnets
# (Deploy test tokens on Sepolia, Devnet, etc.)
```

## What to Commit to GitHub

### ✅ DO Commit (Source Code):

```
✅ src/                      # All source TypeScript files
✅ docs/                    # Documentation
✅ index.ts                 # Plugin entry point
✅ package.json             # Dependencies
✅ tsconfig.json            # TypeScript config
✅ jest.config.js           # Testing config
✅ .gitignore               # Git exclusions
✅ .env.example             # Environment template
✅ README.md                # Main docs
✅ CONFIGURATION.md         # Setup guide
✅ CHANGELOG.md             # Version history
✅ LICENSE                  # License file
```

### ❌ DON'T Commit (Already in .gitignore):

```
❌ node_modules/           # Dependencies (users install these)
❌ dist/                   # Compiled code (users build this)
❌ .env                    # Environment variables (sensitive)
❌ *.log                   # Log files
```

## How Users Install Your Plugin

### Option 1: From GitHub (Recommended for now)

Users will:

1. **Clone your repository:**

```bash
git clone https://github.com/yourusername/opencoins_mcp.git
cd opencoins_mcp
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the plugin:**

```bash
npm run build
```

4. **Add to OpenCode.ai config:**

Edit `~/.opencode/config.json`:

```json
{
  "plugins": ["file:///full/path/to/opencoins_mcp"]
}
```

5. **Start using:**

```
"I want to launch a token"
```

### Option 2: From npm (Future)

When you publish to npm, users will simply:

```bash
npm install -g @opencoins/launchpad-mcp
```

## Publishing to npm (Optional)

If you want to make it even easier for users:

### 1. Update package.json

```json
{
  "name": "@yourusername/opencoins-launchpad-mcp",
  "version": "1.0.0",
  "description": "Token launchpad service for OpenCode.ai",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/opencoins_mcp.git"
  },
  "author": "Your Name",
  "license": "MIT"
}
```

### 2. Build for production

```bash
npm run build
```

### 3. Publish to npm

```bash
# Login to npm (first time only)
npm login

# Publish
npm publish --access public
```

### 4. Users install from npm

```bash
npm install -g @yourusername/opencoins-launchpad-mcp
```

## Repository Setup Steps

### Step 1: Initialize Git (if not done)

```bash
cd c:\Users\josep\Documents\GitHub\opencoins_mcp
git init
git add .
git commit -m "Initial commit: OpenCoins Launchpad MCP plugin"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create repository (e.g., `opencoins_mcp`)
3. **Don't** initialize with README (you already have one)

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/yourusername/opencoins_mcp.git
git branch -M main
git push -u origin main
```

### Step 4: Add GitHub Repository Details

Update these files with your actual GitHub URL:

**README.md:**

```markdown
- GitHub Issues: [https://github.com/yourusername/opencoins_mcp/issues]...
```

**src/config.ts:**

```typescript
SUPPORT_URL: 'https://github.com/yourusername/opencoins_mcp',
```

## What Happens When Users Install

### 1. They Clone/Download

```bash
git clone https://github.com/yourusername/opencoins_mcp.git
```

They get:

- ✅ Your source code (with YOUR hardcoded wallet addresses)
- ✅ All documentation
- ✅ package.json with dependencies

### 2. They Install Dependencies

```bash
npm install
```

This installs:

- ethers.js
- @solana/web3.js
- @opencode-ai/plugin
- All other dependencies

### 3. They Build

```bash
npm run build
```

This:

- Compiles TypeScript → JavaScript
- Creates `dist/` folder with compiled code
- **Your wallet addresses are compiled into the code**
- Users **CANNOT change** the fee collector addresses

### 4. They Configure OpenCode.ai

Add plugin path to OpenCode config:

```json
{
  "plugins": ["file:///path/to/opencoins_mcp"]
}
```

### 5. They Use It

```
"I want to launch a token"
```

Every token deployed:

- ✅ Automatically includes 1% fee
- ✅ Fee goes to YOUR addresses (hardcoded)
- ✅ Users pay for the service
- ✅ You earn passive income!

## Security Checklist Before Publishing

- [ ] Your wallet addresses are in `src/config.ts`
- [ ] `.env` is in `.gitignore` (it is)
- [ ] No private keys committed
- [ ] Tested on testnets
- [ ] Documentation is complete
- [ ] README has correct GitHub links
- [ ] CONFIGURATION.md explains the service model
- [ ] License file is present

## README Badge (Optional)

Add to top of README.md:

```markdown
[![npm version](https://badge.fury.io/js/@yourusername%2Fopencoins-launchpad-mcp.svg)](https://www.npmjs.com/package/@yourusername/opencoins-launchpad-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Marketing Your Launchpad

### Create a Landing Page (Optional)

Features to highlight:

- 🚀 AI-powered token deployment
- 💰 1% service fee (fair pricing)
- 🔒 Professional smart contracts
- 🌐 Multi-chain support
- 📱 Interactive wizard

### Social Media Announcement

```
🚀 Launching OpenCoins Launchpad!

Deploy tokens on Ethereum, BSC, Polygon, Solana with AI assistance.

✨ Guided wizard walks you through everything
🔒 Professional smart contracts
💰 Only 1% service fee on transfers

Try it now: [GitHub link]
```

### Documentation Website (Optional)

Consider creating a docs site with:

- GitBook
- Docusaurus
- GitHub Pages

## Collecting Your Fees

### EVM Networks

Fees accumulate automatically in your EVM wallet:

- Check balance at your address
- Tokens appear as you receive fees
- Withdraw/swap on DEXs as needed

### Solana

With Token-2022, fees are withheld:

```bash
# Check your fee collector address
solana balance YourSolanaAddress

# Withdraw accumulated fees (requires custom script)
# See Solana Token-2022 documentation
```

## Updating the Plugin

When you make updates:

```bash
# Update version in package.json
# Update CHANGELOG.md

git add .
git commit -m "Version 1.1.0: Added new features"
git tag v1.1.0
git push origin main --tags

# If published to npm
npm publish
```

Users update with:

```bash
cd opencoins_mcp
git pull
npm install
npm run build
```

## Support & Maintenance

Set up support channels:

- GitHub Issues for bug reports
- Discord/Telegram for community
- Email for business inquiries

Update `src/config.ts`:

```typescript
SUPPORT_URL: 'https://discord.gg/yourdiscord',
```

## Next Steps

1. ✅ Configure wallet addresses in `src/config.ts`
2. ✅ Test thoroughly on testnets
3. ✅ Update all GitHub URLs in docs
4. ✅ Create GitHub repository
5. ✅ Push code to GitHub
6. ✅ Write announcement posts
7. ✅ Share with potential users
8. 💰 Start earning from your launchpad!

## Questions?

- Check `docs/` folder for detailed guides
- Review `CONFIGURATION.md` for setup help
- See `SECURITY.md` for security best practices

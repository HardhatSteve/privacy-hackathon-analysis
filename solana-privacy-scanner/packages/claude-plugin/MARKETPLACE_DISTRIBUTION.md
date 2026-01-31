# Distributing via Claude Code Marketplace

This guide covers publishing your plugin to the Claude Code marketplace.

## What We're Distributing

- **Plugin:** Solana Privacy Scanner
- **Marketplace:** solana-privacy-scanner-marketplace
- **Method:** GitHub-hosted marketplace
- **Users install with:** `/plugin marketplace add taylorferran/solana-privacy-scanner`

## Pre-Distribution Checklist

### 1. Plugin Structure ✅

Your plugin structure is correct:
```
packages/claude-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── scan-code/
│   │   ├── SKILL.md         # Skill definition
│   │   └── handler.ts       # TypeScript handler
│   ├── scan-wallet/
│   ├── explain-risk/
│   └── suggest-fix/
├── dist/                     # Compiled JavaScript
└── src/                      # TypeScript source
```

### 2. Marketplace Structure ✅

Marketplace is at repository root:
```
.claude-plugin/
└── marketplace.json          # Marketplace catalog
```

### 3. Build the Plugin

```bash
cd packages/claude-plugin
npm run clean
npm install
npm run build
```

**Expected:** `dist/` directory contains compiled `.js` files

### 4. Validate the Marketplace

```bash
# From repository root
claude plugin validate .
```

Or from within Claude Code:
```shell
/plugin validate .
```

**Expected:** No validation errors

## Testing Locally

Before pushing to GitHub, test the marketplace locally.

### Test 1: Local Marketplace Add

```bash
# Start Claude Code in your project
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner
claude code
```

Then in Claude Code:
```shell
# Add local marketplace
/plugin marketplace add .

# List marketplaces to verify
/plugin marketplace list

# Should show: solana-privacy-scanner-marketplace
```

### Test 2: Install Plugin Locally

```shell
# Install from local marketplace
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Verify it's installed
/plugin list

# Should show: solana-privacy-scanner@solana-privacy-scanner-marketplace (enabled)
```

### Test 3: Test All Skills

```shell
# Test scan-code
/scan-code packages/claude-plugin/skills/scan-code/handler.ts

# Test explain-risk
/explain-risk fee-payer-reuse

# Test suggest-fix
/suggest-fix fee-payer-reuse

# Test scan-wallet (requires internet)
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10
```

**Expected:** All skills work correctly

### Test 4: Test on Another Repo

```bash
# Create a test directory
mkdir -p /tmp/plugin-test
cd /tmp/plugin-test

# Create sample Solana code
cat > bad-example.ts << 'EOF'
import { Connection, Keypair } from '@solana/web3.js';

// BAD: Fee payer reuse
const FEE_PAYER = Keypair.generate();

export async function sendTransaction() {
  // Uses the same fee payer
  const tx = await connection.sendTransaction(transaction, [FEE_PAYER]);
}
EOF

# Start Claude Code
claude code
```

In Claude Code:
```shell
# Add your local marketplace (use full path)
/plugin marketplace add /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Install plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Test scanning
/scan-code bad-example.ts
```

**Expected:** Detects fee payer reuse issue

## Publishing to GitHub

Once local testing passes, publish to GitHub.

### Step 1: Commit and Push

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Add marketplace files
git add .claude-plugin/marketplace.json
git add packages/claude-plugin/.claude-plugin/plugin.json
git add packages/claude-plugin/MARKETPLACE_INSTALL.md
git add packages/claude-plugin/MARKETPLACE_DISTRIBUTION.md

# Commit
git commit -m "Add Claude Code marketplace distribution

- Created marketplace.json at repository root
- Updated plugin.json with full metadata
- Added marketplace installation guide
- Ready for /plugin marketplace add taylorferran/solana-privacy-scanner"

# Push to GitHub
git push origin main
```

### Step 2: Create a Release Tag

```bash
# Tag the release
git tag -a v0.1.0 -m "Solana Privacy Scanner Plugin v0.1.0

First release of the Claude Code plugin.

Features:
- /scan-code - Static code analysis
- /scan-wallet - On-chain wallet analysis
- /explain-risk - Risk explanations
- /suggest-fix - Automated fixes

Install:
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace"

# Push the tag
git push origin v0.1.0
```

### Step 3: Create GitHub Release

Go to: https://github.com/taylorferran/solana-privacy-scanner/releases

1. Click "Create a new release"
2. Choose tag: `v0.1.0`
3. Release title: "Solana Privacy Scanner Plugin v0.1.0"
4. Description:

```markdown
# Solana Privacy Scanner - Claude Code Plugin v0.1.0

AI-powered privacy analysis for Solana developers, integrated directly into Claude Code.

## Installation

Add the marketplace:
```shell
/plugin marketplace add taylorferran/solana-privacy-scanner
```

Install the plugin:
```shell
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## Features

### 🔍 Static Code Analysis
Detect privacy anti-patterns in your source code.
```shell
/scan-code src/transactions.ts
```

### 💰 Wallet Privacy Analysis
Analyze on-chain wallet privacy using blockchain data.
```shell
/scan-wallet YOUR_WALLET_ADDRESS
```

### 📚 Risk Explanations
Get detailed explanations of specific privacy risks.
```shell
/explain-risk fee-payer-reuse
```

### 🔧 Automated Fixes
Receive AI-generated code fixes for detected issues.
```shell
/suggest-fix fee-payer-reuse
```

## Documentation

See [MARKETPLACE_INSTALL.md](./packages/claude-plugin/MARKETPLACE_INSTALL.md) for complete installation and usage instructions.

## What's Included

- 4 Claude Code skills (scan-code, scan-wallet, explain-risk, suggest-fix)
- 13 Solana-specific privacy heuristics
- Support for on-chain analysis
- AI-powered explanations and fixes

## Links

- **Documentation:** https://taylorferran.github.io/solana-privacy-scanner
- **Repository:** https://github.com/taylorferran/solana-privacy-scanner
- **Issues:** https://github.com/taylorferran/solana-privacy-scanner/issues

## License

MIT © Taylor Ferran
```

5. Click "Publish release"

## Testing the Published Marketplace

**Critical:** Test that users can actually install from GitHub.

### Test in a Fresh Environment

```bash
# On a different machine or fresh directory
cd ~/Desktop
mkdir test-marketplace-install
cd test-marketplace-install

# Start Claude Code
claude code
```

In Claude Code:
```shell
# Add the GitHub marketplace
/plugin marketplace add taylorferran/solana-privacy-scanner

# Should show success message

# List marketplaces
/plugin marketplace list

# Should show: solana-privacy-scanner-marketplace

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Should download and install successfully

# Verify installation
/plugin list

# Should show: solana-privacy-scanner@solana-privacy-scanner-marketplace (enabled)

# Test a skill
/explain-risk fee-payer-reuse

# Should work!
```

**Expected:** Everything works identically to local testing.

## Update the Main README

Add marketplace installation to your main README:

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner
```

Add this section to `README.md`:

```markdown
## 🔌 Claude Code Plugin

Install the Claude Code plugin for AI-powered privacy analysis:

```shell
# Add the marketplace
/plugin marketplace add taylorferran/solana-privacy-scanner

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

Available skills:
- `/scan-code` - Detect privacy risks in source code
- `/scan-wallet` - Analyze wallet privacy on-chain
- `/explain-risk` - Get detailed risk explanations
- `/suggest-fix` - Receive automated fix suggestions

See [marketplace installation guide](./packages/claude-plugin/MARKETPLACE_INSTALL.md) for details.
```

Commit and push:

```bash
git add README.md
git commit -m "Add Claude Code marketplace installation to README"
git push origin main
```

## Announcing the Plugin

### Twitter/X

```
🚀 Just released a Claude Code plugin for Solana privacy analysis!

Install in 2 commands:
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

Features:
✅ Static code analysis
✅ On-chain wallet analysis
✅ AI risk explanations
✅ Automated fixes

Try it: /scan-code src/transactions.ts

#Solana #Privacy #ClaudeCode
```

### Reddit (r/solana)

```
Title: New Claude Code Plugin for Solana Privacy Analysis

I've released a Claude Code plugin that helps Solana developers find and fix privacy issues.

Installation:
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

Features:
- Static code analysis for privacy anti-patterns
- On-chain wallet privacy analysis
- AI-powered explanations of privacy risks
- Automated fix suggestions

Example workflow:
1. /scan-code src/transactions.ts
2. /explain-risk fee-payer-reuse
3. /suggest-fix fee-payer-reuse

Documentation: https://taylorferran.github.io/solana-privacy-scanner

Feedback welcome!
```

### Solana Discord

Post in #dev-tools or similar channel with the installation instructions and a demo.

## User Installation (What They'll Do)

When someone wants to use your plugin:

```shell
# 1. Add your marketplace
/plugin marketplace add taylorferran/solana-privacy-scanner

# 2. Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# 3. Use the skills
/scan-code src/transactions.ts
/scan-wallet their-wallet-address
/explain-risk fee-payer-reuse
/suggest-fix fee-payer-reuse
```

That's it! No npm, no build steps, no configuration.

## Updating the Plugin

When you release a new version:

### 1. Update Version

```bash
# Update plugin version
# Edit packages/claude-plugin/.claude-plugin/plugin.json
# Change "version": "0.1.0" to "version": "0.2.0"

# Update marketplace version
# Edit .claude-plugin/marketplace.json
# Change "version": "0.1.0" to "version": "0.2.0" in the plugin entry
```

### 2. Build and Test

```bash
cd packages/claude-plugin
npm run build
npm test
```

### 3. Commit and Tag

```bash
git add .
git commit -m "Release v0.2.0"
git tag -a v0.2.0 -m "Version 0.2.0"
git push origin main --tags
```

### 4. Create GitHub Release

Follow the same process as Step 3 in "Publishing to GitHub"

### 5. Users Update

Users update with:
```shell
/plugin marketplace update solana-privacy-scanner-marketplace
/plugin update solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## Monitoring and Support

### Check Usage

Monitor:
- GitHub stars/forks
- GitHub issues/discussions
- Social media mentions

### Respond to Issues

When users report issues:
1. Respond on GitHub issues
2. Fix bugs quickly
3. Release patch versions
4. Update documentation

### Collect Feedback

Ask users:
- Which skills are most useful?
- What features are missing?
- What's confusing?
- What privacy risks should be added?

## Troubleshooting Distribution

### Marketplace Validation Fails

```bash
claude plugin validate .
```

Common issues:
- Missing `name` field
- Duplicate plugin names
- Invalid JSON syntax
- Missing plugin.json

### Plugin Installation Fails for Users

Check:
- Repository is public
- Files are committed and pushed
- Path in marketplace.json is correct
- Plugin is built (dist/ directory)

### Skills Don't Work

Check:
- Handler files are compiled (`.js` not just `.ts`)
- Dependencies are bundled
- Paths use `${CLAUDE_PLUGIN_ROOT}` where needed

## Advanced: Private Marketplace

For teams, you can create a private marketplace:

```bash
# Users set GitHub token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Add private marketplace
/plugin marketplace add your-org/private-plugins

# Install from private marketplace
/plugin install team-plugin@your-org-marketplace
```

See [Private repositories](https://code.claude.com/docs/en/marketplaces#private-repositories) in the docs.

## Success Metrics

Track:
- GitHub stars/forks
- Installations (ask users to star if they use it)
- Issues/PRs
- Community feedback
- Blog posts/tweets mentioning it

## Next Steps After Publishing

1. **Monitor Installation**: Watch for issues from users
2. **Gather Feedback**: Ask early users what they think
3. **Iterate**: Release updates based on feedback
4. **Document**: Add examples, tutorials, videos
5. **Promote**: Share in Solana communities

## Summary

Your plugin is distributed via:
- **GitHub Repository:** taylorferran/solana-privacy-scanner
- **Marketplace Name:** solana-privacy-scanner-marketplace
- **Plugin Name:** solana-privacy-scanner
- **Installation:**
  ```shell
  /plugin marketplace add taylorferran/solana-privacy-scanner
  /plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
  ```

Ready to publish? Start with "Testing Locally" above! 🚀

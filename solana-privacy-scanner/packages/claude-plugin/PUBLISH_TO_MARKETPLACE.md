# Publish to Claude Code Marketplace - Quick Start

Follow these steps in order to distribute your plugin via the Claude Code marketplace.

## What You're Publishing

- **Plugin Name:** solana-privacy-scanner
- **Marketplace Name:** solana-privacy-scanner-marketplace
- **Installation (for users):**
  ```shell
  /plugin marketplace add taylorferran/solana-privacy-scanner
  /plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
  ```

## Steps to Publish

### ✅ Step 1: Build the Plugin (2 minutes)

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner/packages/claude-plugin

# Clean and rebuild
npm run clean
npm install
npm run build
```

**Expected:** No errors, `dist/` directory created with `.js` files

### ✅ Step 2: Validate the Marketplace (1 minute)

```bash
# From repository root
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Validate
claude plugin validate .
```

**Expected:** "Validation successful" or no errors

If you get errors, they'll tell you exactly what to fix.

### ✅ Step 3: Test Locally (10 minutes)

**CRITICAL:** Test before pushing to GitHub.

```bash
# Make sure you're in the repo root
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Start Claude Code here
claude code
```

In the Claude Code session:

```shell
# Add the local marketplace
/plugin marketplace add .

# Verify it was added
/plugin marketplace list
# Should show: solana-privacy-scanner-marketplace

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Verify it installed
/plugin list
# Should show: solana-privacy-scanner@solana-privacy-scanner-marketplace (enabled)

# Test each skill
/scan-code packages/claude-plugin/skills/scan-code/handler.ts
/explain-risk fee-payer-reuse
/suggest-fix fee-payer-reuse
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy --max-signatures 10
```

**Expected:** All skills work correctly

**If anything fails:** Fix it before proceeding. Don't push broken code to GitHub.

### ✅ Step 4: Test on Another Directory (10 minutes)

Test that it works outside your repo:

```bash
# Create test directory
mkdir -p /tmp/marketplace-test
cd /tmp/marketplace-test

# Create sample Solana code with issues
cat > bad-example.ts << 'EOF'
import { Connection, Keypair, Transaction } from '@solana/web3.js';

// BAD: Fee payer reuse
const FEE_PAYER = Keypair.generate();

export async function sendTransaction() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const tx = new Transaction();
  await connection.sendTransaction(tx, [FEE_PAYER]);
}

export async function anotherTransaction() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const tx = new Transaction();
  // BAD: Same fee payer used again
  await connection.sendTransaction(tx, [FEE_PAYER]);
}
EOF

# Start Claude Code
claude code
```

In Claude Code:

```shell
# Add marketplace using full path
/plugin marketplace add /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Install plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Test scanning
/scan-code bad-example.ts
# Should detect fee payer reuse

# Test explanation
/explain-risk fee-payer-reuse
# Should show detailed explanation

# Test fix suggestion
/suggest-fix fee-payer-reuse
# Should show code example
```

**Expected:** Everything works, detects the fee payer reuse issue

### ✅ Step 5: Commit and Push to GitHub (5 minutes)

If tests pass, push to GitHub:

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner

# Check what's changed
git status

# Add the new files
git add .claude-plugin/marketplace.json
git add packages/claude-plugin/.claude-plugin/plugin.json
git add packages/claude-plugin/MARKETPLACE_INSTALL.md
git add packages/claude-plugin/MARKETPLACE_DISTRIBUTION.md
git add packages/claude-plugin/PUBLISH_TO_MARKETPLACE.md

# Commit
git commit -m "Add Claude Code marketplace distribution

- Created marketplace.json for plugin distribution
- Updated plugin.json with full metadata
- Added marketplace installation guides
- Ready for: /plugin marketplace add taylorferran/solana-privacy-scanner"

# Push to main
git push origin main
```

### ✅ Step 6: Create Release Tag (2 minutes)

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Solana Privacy Scanner Plugin v0.1.0

First release of the Claude Code plugin.

Features:
- /scan-code - Static code analysis for privacy anti-patterns
- /scan-wallet - On-chain wallet privacy analysis
- /explain-risk - AI-powered risk explanations
- /suggest-fix - Automated fix suggestions

Installation:
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace"

# Push the tag
git push origin v0.1.0
```

### ✅ Step 7: Create GitHub Release (5 minutes)

1. Go to: https://github.com/taylorferran/solana-privacy-scanner/releases
2. Click "Create a new release"
3. Choose tag: `v0.1.0` (should be in dropdown)
4. Release title: `Solana Privacy Scanner Plugin v0.1.0`
5. Description: Copy this:

```markdown
# Solana Privacy Scanner - Claude Code Plugin v0.1.0

AI-powered privacy analysis for Solana developers, integrated directly into Claude Code.

## 🚀 Quick Install

```shell
# Add the marketplace
/plugin marketplace add taylorferran/solana-privacy-scanner

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## ✨ Features

### 🔍 `/scan-code` - Static Code Analysis
Detect privacy anti-patterns in your source code.
```shell
/scan-code src/transactions.ts
```

### 💰 `/scan-wallet` - Wallet Privacy Analysis
Analyze on-chain wallet privacy using blockchain data.
```shell
/scan-wallet YOUR_WALLET_ADDRESS
```

### 📚 `/explain-risk` - Risk Explanations
Get detailed explanations of specific privacy risks.
```shell
/explain-risk fee-payer-reuse
```

### 🔧 `/suggest-fix` - Automated Fixes
Receive AI-generated code fixes for detected issues.
```shell
/suggest-fix fee-payer-reuse
```

## 📖 Documentation

- **Installation Guide:** [MARKETPLACE_INSTALL.md](./packages/claude-plugin/MARKETPLACE_INSTALL.md)
- **Full Docs:** https://taylorferran.github.io/solana-privacy-scanner
- **Issues:** https://github.com/taylorferran/solana-privacy-scanner/issues

## 📦 What's Included

- 4 Claude Code skills (scan-code, scan-wallet, explain-risk, suggest-fix)
- 13 Solana-specific privacy heuristics
- Support for on-chain analysis
- AI-powered explanations and fixes

## 🔒 Privacy Risks Detected

- Fee payer reuse (CRITICAL)
- PII in transaction memos
- Signer overlap patterns
- Address reuse
- Known entity interactions
- And 8 more...

## 📝 License

MIT © Taylor Ferran
```

6. Click "Publish release"

### ✅ Step 8: Test the Published Version (10 minutes)

**CRITICAL:** Test that users can actually install from GitHub.

Open a new terminal window:

```bash
# Go to a completely different directory
cd ~/Desktop
mkdir test-published-plugin
cd test-published-plugin

# Start Claude Code
claude code
```

In Claude Code:

```shell
# Add the marketplace from GitHub (not local!)
/plugin marketplace add taylorferran/solana-privacy-scanner

# Should show success message

# List marketplaces to verify
/plugin marketplace list
# Should show: solana-privacy-scanner-marketplace

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# Should download from GitHub and install

# Verify
/plugin list
# Should show: solana-privacy-scanner@solana-privacy-scanner-marketplace (enabled)

# Test a skill
/explain-risk fee-payer-reuse
# Should work!
```

**Expected:** Everything works exactly like your local tests.

**If it fails:**
- Check that you pushed to GitHub
- Check that the tag is pushed
- Verify files are committed
- Look at GitHub repo to ensure marketplace.json is there

### ✅ Step 9: Update Main README (5 minutes)

Add installation instructions to your main README:

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner
```

Edit `README.md` and add this section (near the top):

```markdown
## 🔌 Claude Code Plugin

Install the Claude Code plugin for AI-powered privacy analysis:

```shell
# Add the marketplace
/plugin marketplace add taylorferran/solana-privacy-scanner

# Install the plugin
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

**Available Skills:**
- `/scan-code` - Detect privacy risks in source code
- `/scan-wallet` - Analyze wallet privacy on-chain
- `/explain-risk` - Get detailed risk explanations
- `/suggest-fix` - Receive automated fix suggestions

See [marketplace installation guide](./packages/claude-plugin/MARKETPLACE_INSTALL.md) for complete documentation.
```

Commit and push:

```bash
git add README.md
git commit -m "Add Claude Code marketplace installation to README"
git push origin main
```

### ✅ Step 10: Announce (Optional, 10 minutes)

Share the news!

**Twitter/X:**
```
🚀 Just released a Claude Code plugin for Solana privacy analysis!

Install in 2 commands:
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

Features:
✅ Static code analysis
✅ On-chain wallet scanning
✅ AI explanations
✅ Auto-fix suggestions

#Solana #Privacy #ClaudeCode
```

**Reddit (r/solana):**
Post with installation instructions and a demo of detecting a privacy issue.

**Solana Discord:**
Share in dev channels with a quick walkthrough.

## ✅ Done!

Your plugin is now publicly available!

Users can install it with:
```shell
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## What Users Will Experience

1. They run `/plugin marketplace add taylorferran/solana-privacy-scanner`
2. Claude Code fetches your marketplace.json from GitHub
3. They run `/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace`
4. Claude Code downloads the plugin from your repo
5. All 4 skills become available immediately
6. They can use `/scan-code`, `/scan-wallet`, `/explain-risk`, `/suggest-fix`

## Updating the Plugin

When you make changes:

```bash
# Make your changes
# ...

# Update version in plugin.json and marketplace.json
# "version": "0.1.0" → "0.2.0"

# Build
cd packages/claude-plugin
npm run build

# Commit and tag
cd ../..
git add .
git commit -m "Release v0.2.0"
git tag -a v0.2.0 -m "Version 0.2.0"
git push origin main --tags

# Create new GitHub release
```

Users update with:
```shell
/plugin marketplace update solana-privacy-scanner-marketplace
/plugin update solana-privacy-scanner@solana-privacy-scanner-marketplace
```

## Troubleshooting

### "Marketplace not found"

- Check you pushed to GitHub: `git push origin main`
- Check the tag is pushed: `git push origin v0.1.0`
- Verify on GitHub: https://github.com/taylorferran/solana-privacy-scanner

### "Plugin installation failed"

- Check `dist/` directory exists and has `.js` files
- Run `npm run build` in packages/claude-plugin
- Commit and push the changes

### "Skills don't work"

- Verify handlers are compiled (`.js` files in dist/skills/)
- Check plugin.json is valid JSON
- Test locally first with `/plugin marketplace add .`

## Next Steps

1. **Monitor Issues:** Watch GitHub for user feedback
2. **Update Docs:** Add examples and tutorials
3. **Iterate:** Release updates based on feedback
4. **Promote:** Share in Solana communities

## Support

If users have issues, point them to:
- **Installation guide:** packages/claude-plugin/MARKETPLACE_INSTALL.md
- **Documentation:** https://taylorferran.github.io/solana-privacy-scanner
- **GitHub issues:** https://github.com/taylorferran/solana-privacy-scanner/issues

---

Ready to start? Begin with **Step 1: Build the Plugin** 🚀

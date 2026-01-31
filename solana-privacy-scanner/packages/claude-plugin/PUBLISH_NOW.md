# Ready to Publish: Step-by-Step Guide

Your plugin is ready for distribution! Follow these steps in order.

## Quick Checklist

- [x] Dependencies updated to use published npm packages
- [x] User installation guide created (INSTALL_FOR_USERS.md)
- [x] Distribution guide created (DISTRIBUTION.md)
- [x] Test script created (test-on-another-repo.sh)

## Steps to Publish

### 1. Build and Test (5 minutes)

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner/packages/claude-plugin

# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build

# Run tests
npm test
```

**Expected:** All tests pass.

### 2. Verify Package Contents (2 minutes)

```bash
npm pack --dry-run
```

**Check for:**
- `.claude-plugin/plugin.json` ✓
- `dist/` directory ✓
- `skills/` directory ✓
- `README.md` ✓
- Size: ~80-100KB ✓

### 3. Test Locally (5 minutes)

```bash
# Run the test script
./test-on-another-repo.sh
```

This will:
1. Pack the plugin
2. Install it in a fresh directory
3. Create test Solana code
4. Give you instructions to test with Claude Code

**Expected:** Plugin installs successfully, all files present.

### 4. Test with Claude Code (10 minutes)

Follow the instructions from the test script:

```bash
cd /tmp/plugin-test-XXXXXX
claude code
```

Then test each skill:
```
/scan-code src/test-transaction.ts
/explain-risk fee-payer-reuse
/suggest-fix fee-payer-reuse
```

**Expected:** All skills work correctly.

### 5. Publish to npm (2 minutes)

**IMPORTANT:** You need an npm account. If you don't have one:
1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email

Then:

```bash
# Login to npm
npm login
# Enter your username, password, and email

# Publish (use dry-run first to be safe)
npm publish --dry-run

# If all looks good, publish for real
npm publish --access public
```

**Expected:** Package published successfully.

### 6. Verify Publication (2 minutes)

```bash
# Check on npm
npm view solana-privacy-scanner-plugin

# Expected output:
# solana-privacy-scanner-plugin@0.1.0
# AI-powered Solana privacy analysis for developers
# ...

# Try installing it globally
npm install -g solana-privacy-scanner-plugin

# Verify it installed
npm list -g solana-privacy-scanner-plugin
```

### 7. Test the Published Package (10 minutes)

**Critical step:** Test that users can actually install and use it.

```bash
# In a completely separate directory
cd ~/Desktop
mkdir plugin-user-test
cd plugin-user-test

# Install the published package
npm install -g solana-privacy-scanner-plugin

# Create a test file
cat > test.ts << 'EOF'
const FEE_PAYER = "constant";
EOF

# Start Claude Code
claude code

# Test the skills
> /scan-code test.ts
> /explain-risk fee-payer-reuse
```

**Expected:** Everything works just like your local version.

### 8. Create GitHub Release (5 minutes)

```bash
# Tag the release
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner
git tag -a plugin-v0.1.0 -m "Claude Code Plugin v0.1.0"
git push origin plugin-v0.1.0
```

Then on GitHub:
1. Go to https://github.com/taylorferran/solana-privacy-scanner/releases
2. Click "Create a new release"
3. Choose tag: `plugin-v0.1.0`
4. Title: "Solana Privacy Scanner Plugin v0.1.0"
5. Description:
   ```markdown
   # Claude Code Plugin v0.1.0

   AI-powered privacy analysis for Solana developers.

   ## Installation

   ```bash
   npm install -g solana-privacy-scanner-plugin
   ```

   ## Features

   - Static code analysis
   - On-chain wallet analysis
   - AI risk explanations
   - Automated fix suggestions

   See [INSTALL_FOR_USERS.md](./packages/claude-plugin/INSTALL_FOR_USERS.md) for full documentation.
   ```
6. Click "Publish release"

### 9. Update Documentation (5 minutes)

Update the main README:

```bash
cd /Users/taylorferran/Desktop/dev/solana-privacy-scanner
```

Add this section to the main `README.md`:

```markdown
## 🔌 Claude Code Plugin

Install the Claude Code plugin for AI-powered privacy analysis:

```bash
npm install -g solana-privacy-scanner-plugin
```

Available skills:
- `/scan-code` - Analyze source code for privacy issues
- `/scan-wallet` - Analyze wallet privacy on-chain
- `/explain-risk` - Get detailed risk explanations
- `/suggest-fix` - Receive automated fix suggestions

See [installation guide](./packages/claude-plugin/INSTALL_FOR_USERS.md) for details.
```

Commit and push:

```bash
git add README.md packages/claude-plugin/
git commit -m "Add Claude Code plugin distribution"
git push origin main
```

### 10. Announce (Optional, 10 minutes)

Share the news:

**Twitter/X:**
```
🚀 Just released a Claude Code plugin for Solana privacy analysis!

✅ Detect privacy leaks in your code
✅ Analyze wallets on-chain
✅ Get AI-powered fix suggestions

Install: npm install -g solana-privacy-scanner-plugin

Try: /scan-code src/transactions.ts

#Solana #Privacy #AI
```

**Reddit (r/solana):**
```
Title: New Claude Code Plugin for Solana Privacy Analysis

Body:
I've released a Claude Code plugin that helps Solana developers find and fix privacy issues in their code.

Features:
- Static code analysis for privacy anti-patterns
- On-chain wallet privacy analysis
- AI-powered explanations
- Automated fix suggestions

Installation: npm install -g solana-privacy-scanner-plugin

Feedback welcome!
```

## Summary

After following these steps, your plugin will be:

✅ Published on npm
✅ Available globally via `npm install -g`
✅ Documented with user guides
✅ Tagged and released on GitHub
✅ Ready for users to install and use

## What Users Will Do

When someone wants to use your plugin:

```bash
# 1. Install globally
npm install -g solana-privacy-scanner-plugin

# 2. Start Claude Code in their project
cd their-project
claude code

# 3. Use the skills
> /scan-code src/transactions.ts
> /scan-wallet their-wallet-address
> /explain-risk fee-payer-reuse
> /suggest-fix fee-payer-reuse
```

That's it! 🎉

## Troubleshooting

### "Package name already exists"

The name might be taken. Options:
1. Use a scoped package: `@your-username/solana-privacy-scanner-plugin`
2. Choose a different name: `solana-privacy-plugin`
3. Contact the current owner if it's abandoned

Update `package.json` name field and try again.

### "Permission denied"

Make sure you're logged in:
```bash
npm whoami  # Should show your username
npm login   # If not logged in
```

### "Files not included"

Check `package.json` `files` field:
```json
"files": [
  "dist/**/*",
  ".claude-plugin/**/*",
  "skills/**/*",
  "README.md"
]
```

## Next Steps After Publishing

1. **Monitor Usage**
   - Check npm downloads: `npm view solana-privacy-scanner-plugin`
   - Watch for GitHub issues

2. **Gather Feedback**
   - Ask early users for feedback
   - Collect feature requests

3. **Plan Updates**
   - Bug fixes as needed
   - New skills/features
   - Keep dependencies up to date

4. **Support Users**
   - Respond to issues on GitHub
   - Update documentation based on common questions
   - Create examples and tutorials

## Version Updates

For future releases:

```bash
# Update version
npm version patch  # 0.1.0 → 0.1.1

# Build and test
npm run build
npm test

# Publish
npm publish

# Tag and push
git push origin main --tags
```

---

Ready to publish? Start with Step 1! 🚀

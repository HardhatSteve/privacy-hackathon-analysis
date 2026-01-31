# Distribution Checklist for Solana Privacy Scanner Plugin

This guide covers **publishing** the plugin so others can install it.

## Pre-Publication Checklist

### 1. Verify Package Configuration

- [x] `package.json` has correct metadata
  - Name: `solana-privacy-scanner-plugin`
  - Version: `0.1.0`
  - Description, author, license, repository

- [x] Dependencies use published npm packages (not `file:` references)
  ```json
  "dependencies": {
    "solana-privacy-scanner": "^0.6.0",
    "solana-privacy-scanner-core": "^0.7.0"
  }
  ```

- [x] `files` field includes all necessary files
  ```json
  "files": [
    "dist/**/*",
    ".claude-plugin/**/*",
    "skills/**/*",
    "README.md"
  ]
  ```

### 2. Build and Test

```bash
# From packages/claude-plugin
cd packages/claude-plugin

# Clean previous builds
npm run clean

# Install dependencies from npm (not local)
rm -rf node_modules package-lock.json
npm install

# Build the package
npm run build

# Run tests
npm test

# Verify package contents
npm pack --dry-run
```

### 3. Verify Package Contents

Run `npm pack --dry-run` and ensure:

- [ ] `.claude-plugin/plugin.json` is included
- [ ] `dist/` directory with compiled JavaScript
- [ ] `skills/` directory with SKILL.md files
- [ ] `README.md` is included
- [ ] No unnecessary files (node_modules, test files, etc.)

Expected size: ~80-100KB

### 4. Test Locally Before Publishing

```bash
# Create a tarball
npm pack

# Install in a test directory
cd /tmp
mkdir test-plugin && cd test-plugin
npm install /path/to/solana-privacy-scanner-plugin-0.1.0.tgz

# Verify it works
node -e "const p = require('solana-privacy-scanner-plugin'); console.log(p)"
```

### 5. Update README for npm

Ensure `README.md` is user-facing:

- [ ] Clear description of what the plugin does
- [ ] Installation instructions for users
- [ ] Quick start examples
- [ ] Links to documentation

## Publishing Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials.

### Step 2: Verify You're Publishing the Right Package

```bash
npm pack --dry-run
```

Check the output carefully. Ensure:
- Package name is correct
- Version is correct
- File list looks right

### Step 3: Publish (Dry Run First)

```bash
# Dry run to see what would happen
npm publish --dry-run

# If everything looks good, publish for real
npm publish --access public
```

### Step 4: Verify Publication

```bash
# Check on npm
npm view solana-privacy-scanner-plugin

# Try installing it globally
npm install -g solana-privacy-scanner-plugin

# Test the installed version
which solana-privacy-scanner-plugin
```

## Post-Publication Tasks

### 1. Create GitHub Release

```bash
# Tag the release
git tag -a plugin-v0.1.0 -m "Claude Code Plugin v0.1.0"
git push origin plugin-v0.1.0
```

On GitHub:
1. Go to Releases → Create new release
2. Select tag `plugin-v0.1.0`
3. Title: "Solana Privacy Scanner Plugin v0.1.0"
4. Description:
   ```markdown
   # Solana Privacy Scanner - Claude Code Plugin v0.1.0

   AI-powered privacy analysis for Solana developers, integrated directly into Claude Code.

   ## Installation

   ```bash
   npm install -g solana-privacy-scanner-plugin
   ```

   ## Features

   - Static code analysis for privacy anti-patterns
   - On-chain wallet privacy analysis
   - AI-powered risk explanations
   - Automated fix suggestions

   ## Documentation

   See [INSTALL_FOR_USERS.md](./packages/claude-plugin/INSTALL_FOR_USERS.md) for installation and usage instructions.

   ## Skills Included

   - `/scan-code` - Analyze source code
   - `/scan-wallet` - Analyze wallet privacy
   - `/explain-risk` - Learn about privacy risks
   - `/suggest-fix` - Get code fixes
   ```

5. Attach the tarball: `solana-privacy-scanner-plugin-0.1.0.tgz`
6. Publish release

### 2. Update Documentation Site

Add installation instructions to the docs:

```bash
# In docs/docs/
# Create new page: docs/docs/plugin/installation.md
```

### 3. Announce the Plugin

**Update main README:**
```markdown
## Claude Code Plugin

Install the plugin for AI-powered privacy analysis in Claude Code:

```bash
npm install -g solana-privacy-scanner-plugin
```

See [plugin documentation](./packages/claude-plugin/INSTALL_FOR_USERS.md) for usage.
```

**Social announcements:**
- Twitter/X announcement
- Solana developer communities
- Reddit (r/solana, r/solanaDev)

### 4. Test Installation on Another Machine

**Critical:** Test the published package on a clean environment:

```bash
# On a different machine or VM
npm install -g solana-privacy-scanner-plugin

# Start Claude Code and test all skills
claude code
> /scan-code --help
> /scan-wallet --help
> /explain-risk --help
> /suggest-fix --help
```

## Troubleshooting Publication Issues

### "You do not have permission to publish"

**Solution:** Check package name isn't taken:
```bash
npm view solana-privacy-scanner-plugin
```

If taken, consider:
- `@your-username/solana-privacy-scanner-plugin`
- `solana-privacy-plugin`
- Contact current owner if abandoned

### "Package size exceeds maximum"

**Solution:** Reduce package size:
```bash
# Add .npmignore
echo "*.test.ts" >> .npmignore
echo "*.md" >> .npmignore  # Except README.md
echo "test/" >> .npmignore

# Rebuild and check size
npm run build
npm pack --dry-run
```

### Dependencies Not Resolving

**Solution:** Ensure dependencies are published:
```bash
npm view solana-privacy-scanner
npm view solana-privacy-scanner-core
```

If not published, publish those first.

## Version Update Workflow

For future releases:

```bash
# 1. Update version
npm version patch  # 0.1.0 → 0.1.1
# or
npm version minor  # 0.1.0 → 0.2.0
# or
npm version major  # 0.1.0 → 1.0.0

# 2. Build and test
npm run clean
npm install
npm run build
npm test

# 3. Publish
npm publish

# 4. Tag and push
git push origin main --tags
```

## Maintenance Checklist

### Regular Updates

- [ ] Update dependencies monthly
  ```bash
  npm outdated
  npm update
  ```

- [ ] Keep in sync with core/cli packages
  ```bash
  npm install solana-privacy-scanner@latest
  npm install solana-privacy-scanner-core@latest
  ```

- [ ] Test with latest Claude Code version

### Monitoring

- [ ] Watch npm download stats
  ```bash
  npm view solana-privacy-scanner-plugin
  ```

- [ ] Monitor GitHub issues for plugin-specific problems
- [ ] Track user feedback and feature requests

## Distribution Channels

### Primary

1. **npm Registry** (main distribution)
   - `npm install -g solana-privacy-scanner-plugin`

2. **GitHub Releases**
   - Direct download of `.tgz` files

### Future Channels (Planned)

3. **Claude Code Plugin Registry**
   - Official plugin directory (when available)
   - Submit plugin for inclusion

4. **Standalone Installer**
   - Shell script for one-command install
   ```bash
   curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash
   ```

## Success Metrics

Track these after publication:

- npm downloads per week
- GitHub stars/forks on main repo
- Issues/PRs specifically for plugin
- User feedback and testimonials
- Integration in other projects

## Support Plan

After publication, commit to:

1. **Bug fixes** within 48 hours of report
2. **Security updates** within 24 hours
3. **Feature requests** evaluated monthly
4. **Documentation updates** as needed

## Ready to Publish?

Final checklist before running `npm publish`:

- [ ] All tests passing
- [ ] Dependencies are correct
- [ ] README is user-friendly
- [ ] Version number is correct
- [ ] You're logged into npm
- [ ] You've tested locally
- [ ] You've backed up your work
- [ ] You're ready to support users

If all checked, run:

```bash
npm publish --access public
```

Good luck! 🚀

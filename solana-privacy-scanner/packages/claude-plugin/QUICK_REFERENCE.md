# Quick Reference Card

## For You (Developer/Publisher)

### Publish the Plugin
```bash
# 1. Build
cd packages/claude-plugin && npm run build

# 2. Verify
cd ../.. && ./packages/claude-plugin/verify-marketplace-ready.sh

# 3. Test locally
claude code
> /plugin marketplace add .
> /plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace

# 4. Push to GitHub
git add .
git commit -m "Add marketplace distribution"
git push origin main
git tag -a v0.1.0 -m "Version 0.1.0"
git push origin v0.1.0

# 5. Create GitHub Release
# Go to: https://github.com/taylorferran/solana-privacy-scanner/releases
```

### Update the Plugin
```bash
# 1. Make changes
# 2. Update version in plugin.json
# 3. Build
cd packages/claude-plugin && npm run build

# 4. Release
git commit -am "Release v0.2.0"
git tag -a v0.2.0 -m "Version 0.2.0"
git push origin main --tags
```

## For Users

### Install
```shell
/plugin marketplace add taylorferran/solana-privacy-scanner
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

### Update
```shell
/plugin marketplace update solana-privacy-scanner-marketplace
/plugin update solana-privacy-scanner@solana-privacy-scanner-marketplace
```

### Use
```shell
/scan-code src/transactions.ts
/scan-wallet YOUR_WALLET_ADDRESS
/explain-risk fee-payer-reuse
/suggest-fix fee-payer-reuse
```

### Uninstall
```shell
/plugin uninstall solana-privacy-scanner@solana-privacy-scanner-marketplace
/plugin marketplace remove solana-privacy-scanner-marketplace
```

## File Structure

```
solana-privacy-scanner/
├── .claude-plugin/
│   └── marketplace.json              # Marketplace catalog
└── packages/
    └── claude-plugin/
        ├── .claude-plugin/
        │   └── plugin.json            # Plugin manifest
        ├── skills/                    # 4 skills
        │   ├── scan-code/
        │   ├── scan-wallet/
        │   ├── explain-risk/
        │   └── suggest-fix/
        ├── dist/                      # Compiled JS
        ├── src/                       # TypeScript source
        ├── MARKETPLACE_INSTALL.md     # User installation guide
        ├── MARKETPLACE_DISTRIBUTION.md # Publisher guide
        ├── PUBLISH_TO_MARKETPLACE.md  # Step-by-step publish guide
        └── QUICK_REFERENCE.md         # This file
```

## Installation Commands Summary

| Command | Description |
|---------|-------------|
| `/plugin marketplace add taylorferran/solana-privacy-scanner` | Add the marketplace |
| `/plugin marketplace list` | List all marketplaces |
| `/plugin marketplace update <name>` | Update marketplace catalog |
| `/plugin marketplace remove <name>` | Remove marketplace |
| `/plugin install <name>@<marketplace>` | Install a plugin |
| `/plugin list` | List installed plugins |
| `/plugin update <name>@<marketplace>` | Update a plugin |
| `/plugin enable <name>@<marketplace>` | Enable a plugin |
| `/plugin disable <name>@<marketplace>` | Disable a plugin |
| `/plugin uninstall <name>@<marketplace>` | Uninstall a plugin |

## Skills Reference

### `/scan-code`
```shell
/scan-code <file-or-pattern>
/scan-code src/transactions.ts
/scan-code src/**/*.ts
```

### `/scan-wallet`
```shell
/scan-wallet <address> [--max-signatures N] [--rpc URL]
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
/scan-wallet ADDRESS --max-signatures 50
/scan-wallet ADDRESS --rpc https://your-rpc.com
```

### `/explain-risk`
```shell
/explain-risk <risk-id>
/explain-risk fee-payer-reuse
/explain-risk memo-pii
/explain-risk signer-overlap
```

### `/suggest-fix`
```shell
/suggest-fix <risk-id>
/suggest-fix fee-payer-reuse
/suggest-fix memo-pii
```

## Privacy Risks Detected (13 Heuristics)

1. **Fee Payer Reuse** (CRITICAL) - Same wallet pays fees for multiple accounts
2. **Signer Overlap** (HIGH) - Repeated signer combinations
3. **Memo Exposure** (HIGH/MEDIUM/LOW) - PII or identifying info in memos
4. **Identity Metadata Exposure** (HIGH/MEDIUM) - .sol domain and NFT metadata linkage
5. **ATA Linkage** (HIGH/MEDIUM) - One wallet funding token accounts for multiple owners
6. **Address Reuse** (MEDIUM/LOW) - Lack of address rotation
7. **Known Entity Interaction** (VARIES) - CEX/bridge/KYC interactions
8. **Counterparty Reuse** (VARIES) - Repeated counterparty patterns
9. **Instruction Fingerprinting** (MEDIUM) - Unique program usage patterns
10. **Token Account Lifecycle** (MEDIUM) - Rent refunds linking accounts
11. **Priority Fee Fingerprinting** (MEDIUM/LOW) - Consistent priority fee amounts
12. **Staking Delegation** (MEDIUM/LOW) - Concentrated validator delegation patterns
13. **Timing Patterns** (MEDIUM) - Transaction bursts and regularity

## Troubleshooting

### Plugin not found
```shell
/plugin marketplace update solana-privacy-scanner-marketplace
/plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace
```

### Skills not working
```shell
/plugin list  # Check if enabled
/plugin enable solana-privacy-scanner@solana-privacy-scanner-marketplace
```

### RPC errors
```shell
/scan-wallet ADDRESS --rpc https://your-custom-rpc.com
/scan-wallet ADDRESS --max-signatures 10  # Reduce load
```

## Links

- **Marketplace:** taylorferran/solana-privacy-scanner
- **Plugin Name:** solana-privacy-scanner
- **Marketplace Name:** solana-privacy-scanner-marketplace
- **GitHub:** https://github.com/taylorferran/solana-privacy-scanner
- **Docs:** https://taylorferran.github.io/solana-privacy-scanner
- **Issues:** https://github.com/taylorferran/solana-privacy-scanner/issues

## Version Info

- **Current Version:** 0.1.0
- **License:** MIT
- **Author:** Taylor Ferran

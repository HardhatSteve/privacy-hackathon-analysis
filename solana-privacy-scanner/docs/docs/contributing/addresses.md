# Contributing Addresses

## Add Known Entities

The known addresses database is **community-maintained** and lives at the repository root. Submit PRs to add addresses without waiting for package releases.

## Database Location

**`known-addresses.json`** (repository root)

This file is automatically included in published packages, but PRs update it immediately for all users of the repository.

## Requirements

1. **Verified ownership** - Public proof the address belongs to the entity (Solscan, official docs, etc.)
2. **Privacy relevance** - Address impacts privacy analysis (CEXs, bridges, major protocols)
3. **Active use** - Currently in use (defunct entities marked as such)
4. **Accurate categorization** - Use correct type field

## Format

Edit `known-addresses.json` at the repository root:

```json
{
  "address": "YourAddressHere...",
  "name": "Entity Name",
  "type": "exchange",
  "description": "Brief description with verification source"
}
```

### Type Field Options

| Type | Description | Privacy Impact |
|------|-------------|----------------|
| `exchange` | Centralized exchanges (Binance, Coinbase, etc.) | **HIGH** - KYC linkage |
| `fee-payer` | Fee payer / relay services (Tuktuk, Clockwork, Octane) | **HIGH** - Transaction visibility |
| `bridge` | Cross-chain bridges (Wormhole, deBridge, etc.) | **MEDIUM** - Cross-chain correlation |
| `marketplace` | NFT marketplaces (Magic Eden, Tensor, etc.) | **MEDIUM** - Social profile linkage |
| `protocol` | DeFi protocols (Jupiter, Raydium, etc.) | **LOW** - Usage fingerprinting |
| `privacy` | Privacy-enhancing protocols (Arcium, Light Protocol) | **LOW** - Privacy tool usage visible |
| `mixer` | Transaction mixing / tumbling services | **LOW** - Privacy tool usage visible |
| `oracle` | Oracle providers (Pyth, Switchboard) | **LOW** - Protocol dependencies |
| `validator` | Notable validators (Jito, Helius, etc.) | **LOW** - Staking preferences |
| `gaming` | Gaming / entertainment protocols (Star Atlas, Aurory) | **LOW** - Behavioral patterns |
| `wallet` | Wallet provider addresses (Phantom, Solflare) | **LOW** - Wallet usage |
| `token` | Token mints (USDC, stablecoins, LSTs) | **INFO** - Asset tracking |
| `mev` | MEV infrastructure (Jito tips, etc.) | **INFO** - MEV participation |
| `program` | Core Solana programs | **INFO** - Standard operations |
| `other` | Uncategorized known entities | **INFO** - General tracking |

## Submission Steps

1. **Fork the repository**
   ```bash
   git clone https://github.com/taylorferran/solana-privacy-scanner.git
   cd solana-privacy-scanner
   ```

2. **Edit `known-addresses.json`**
   - Add your entry to the `labels` array
   - Maintain alphabetical order within each category
   - Include verification source in description

3. **Verify the format**
   ```bash
   npm run build  # Ensures JSON is valid
   ```

4. **Create PR with**
   - Address being added
   - Verification source (Solscan link, official docs)
   - Why this address matters for privacy analysis

## Example PR Description

```
Add Kraken hot wallet addresses

Addresses:
- Kr4k3nH0tWa113t... (verified on Solscan)

Source: https://solscan.io/account/Kr4k3n...
Type: exchange
Impact: HIGH - KYC linkage for Kraken users
```

## Bulk Additions

For adding multiple related addresses (e.g., all Jito tip accounts), group them logically:

```json
{
  "address": "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "name": "Jito Tip Account 1",
  "type": "mev",
  "description": "Jito MEV tip account"
},
{
  "address": "HFqU5x63VTqvQss8hp11i4bVmkSQG8j2Dn9HwwP65esD",
  "name": "Jito Tip Account 2",
  "type": "mev",
  "description": "Jito MEV tip account"
}
```

## What Gets Accepted

✅ **High-value additions:**
- Major CEX hot wallets
- Popular bridge contracts
- Widely-used DeFi protocols
- MEV infrastructure
- Major stablecoin mints
- Fee payer / relay services (Tuktuk, Clockwork, Octane)
- NFT marketplaces (Magic Eden, Tensor)
- Privacy protocols (Arcium, Light Protocol)
- Oracle providers (Pyth, Switchboard)
- Notable validators
- Gaming protocols with significant usage

❌ **Low-value additions:**
- Individual user wallets (not entities)
- Inactive/defunct protocols (unless historically significant)
- Obscure tokens
- Unverified addresses
- Small validators with minimal delegation

## After Your PR

1. Maintainers verify the addresses
2. PR is merged
3. **Immediately available** to repository users
4. Included in next npm package release

[Submit PR →](https://github.com/taylorferran/solana-privacy-scanner/pulls)

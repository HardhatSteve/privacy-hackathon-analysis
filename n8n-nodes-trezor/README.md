# n8n-nodes-trezor

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

Comprehensive n8n community node for Trezor hardware wallets providing 26 resources and 200+ operations for Bitcoin, Ethereum, Cardano, Solana, and 15+ blockchain networks. Includes transaction signing, device management, CoinJoin privacy, and real-time event triggers.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **26 Resource Categories** - Device management, multi-chain support, security features
- **200+ Operations** - Comprehensive blockchain interactions
- **20+ Blockchain Networks** - Bitcoin, Ethereum, Cardano, Solana, Ripple, Stellar, and more
- **Hardware Security** - All signing operations happen on device
- **Real-time Triggers** - Device connection and blockchain event monitoring
- **CoinJoin Privacy** - Enhanced privacy for Bitcoin transactions
- **Multi-signature Support** - Complex signing workflows
- **WebAuthn/FIDO2** - Hardware-backed authentication

## Installation

### Community Nodes (Recommended)

1. Open n8n Settings
2. Go to "Community Nodes"
3. Search for `n8n-nodes-trezor`
4. Click Install

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-trezor
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/velocity-bpa/n8n-nodes-trezor.git
cd n8n-nodes-trezor

# Install dependencies
npm install

# Build
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-trezor

# Restart n8n
```

## Credentials Setup

### Trezor Device API

| Field | Description |
|-------|-------------|
| Connection Type | USB (direct) or Bridge (via Trezor Bridge) |
| Device Path | Optional specific device path |
| Passphrase | Optional BIP39 passphrase for hidden wallets |

### Trezor Connect API

| Field | Description |
|-------|-------------|
| Manifest Email | Contact email for Trezor Connect |
| Manifest App URL | Your application URL |
| Use Core Mode | Enable for headless operation |

## Resources & Operations

### Device Management
- **Device**: Get features, ping, wipe, reset, recover, apply settings
- **Firmware**: Check version, verify integrity
- **Backup**: Create seed backup, verify backup
- **Security**: Change PIN, enable/disable passphrase, lock device
- **Label**: Set device label, get device state

### Cryptocurrency Operations
- **Bitcoin**: Get address, sign transaction, sign/verify message, get UTXO
- **Bitcoin-like**: Litecoin, Dogecoin, Dash, Bitcoin Cash, Zcash, and more
- **Ethereum**: Get address, sign transaction, sign message, sign typed data
- **EVM Chains**: Polygon, BSC, Avalanche, Arbitrum, Optimism, Base, Fantom
- **Cardano**: Get address/stake address, sign transaction
- **Solana**: Get address, sign transaction
- **Ripple (XRP)**: Get address, sign transaction
- **Stellar (XLM)**: Get address, sign transaction
- **Tezos (XTZ)**: Get address, sign transaction
- **EOS**: Get public key, sign transaction
- **Binance Chain**: Get address, sign transaction

### Advanced Features
- **Multi-currency**: Batch operations across multiple coins
- **CoinJoin**: Privacy-enhanced Bitcoin transactions
- **Signing**: Raw message signing, proof of ownership
- **Passphrase**: Hidden wallet management
- **WebAuthn**: FIDO2 credential management
- **Suite**: Trezor Suite integration

## Trigger Node

The TrezorTrigger node monitors for real-time events:

- **Device Events**: Connection, disconnection, button press, PIN entry
- **Blockchain Events**: New transactions, confirmations, balance changes
- **Security Events**: Failed PIN attempts, passphrase changes

## Usage Examples

### Get Bitcoin Address

```javascript
// In n8n workflow
{
  "resource": "bitcoin",
  "operation": "getAddress",
  "coin": "btc",
  "path": "m/84'/0'/0'/0/0",
  "showOnDevice": true
}
```

### Sign Ethereum Transaction

```javascript
{
  "resource": "ethereum",
  "operation": "signTransaction",
  "chainId": 1,
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEaC",
  "value": "1000000000000000000",
  "gasLimit": "21000",
  "maxFeePerGas": "50000000000"
}
```

### Multi-chain Address Discovery

```javascript
{
  "resource": "multiCurrency",
  "operation": "batchGetAddresses",
  "coins": ["btc", "eth", "ltc", "ada"],
  "accountIndex": 0
}
```

## Blockchain Networks

| Network | Coin Type | Address Format |
|---------|-----------|----------------|
| Bitcoin | BTC | P2PKH, P2SH-P2WPKH, P2WPKH |
| Ethereum | ETH | EIP-55 checksum |
| Litecoin | LTC | P2PKH, P2SH-P2WPKH |
| Cardano | ADA | Bech32 |
| Solana | SOL | Base58 |
| Ripple | XRP | Base58check |
| Stellar | XLM | Ed25519 public key |
| Dogecoin | DOGE | P2PKH |
| Bitcoin Cash | BCH | CashAddr |
| Polygon | MATIC | EIP-55 |
| Arbitrum | ARB | EIP-55 |
| Optimism | OP | EIP-55 |

## Error Handling

The node provides detailed error information:

- **DeviceNotFound**: No Trezor device detected
- **ActionCancelled**: User cancelled operation on device
- **PinInvalid**: Incorrect PIN entered
- **PassphraseMismatch**: Passphrase confirmation failed
- **FirmwareOutdated**: Device firmware needs update
- **TransportError**: Communication failure with device

## Security Best Practices

1. **Always verify addresses on device** - Enable `showOnDevice` for address operations
2. **Use passphrases for high-value accounts** - Adds an extra layer of security
3. **Keep firmware updated** - Ensures latest security patches
4. **Verify transaction details on device** - Never blind-sign transactions
5. **Use dedicated workflows** - Isolate sensitive operations
6. **Implement rate limiting** - Prevent automated attacks
7. **Log all operations** - Maintain audit trail

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## Support

- **Documentation**: [GitHub Wiki](https://github.com/velocity-bpa/n8n-nodes-trezor/wiki)
- **Issues**: [GitHub Issues](https://github.com/velocity-bpa/n8n-nodes-trezor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/velocity-bpa/n8n-nodes-trezor/discussions)
- **Commercial Support**: [licensing@velobpa.com](mailto:licensing@velobpa.com)

## Acknowledgments

- [Trezor](https://trezor.io) - Hardware wallet manufacturer
- [n8n](https://n8n.io) - Workflow automation platform
- [SatoshiLabs](https://satoshilabs.com) - Trezor Connect SDK

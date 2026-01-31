# ShieldedRemit

Privacy-preserving cross-border remittance platform built on Solana, integrating SilentSwap for obfuscated routing and ShadowWire for private transfers.

## Features

- **Privacy by Default** - Choose from three privacy levels: standard, amount-private, or fully anonymous
- **Instant Settlements** - Powered by Solana's high-speed blockchain, transactions settle in seconds
- **Ultra-Low Fees** - Typical transaction fees under $0.01
- **Global Reach** - Send money anywhere in the world with supported currencies
- **Secure & Compliant** - Optional compliance features with Range Protocol integration

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Blockchain**: Solana (web3.js, wallet-adapter)
- **Privacy**: SilentSwap SDK, ShadowWire (Radr Labs)
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form + Zod validation
- **UI**: Framer Motion, Recharts, Lucide icons

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- A Solana wallet (Phantom, Backpack, Solflare)
- Helius API key (recommended for RPC)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourorg/shieldedremit.git
cd shieldedremit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional (for full features)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key
NEXT_PUBLIC_SILENTSWAP_API_KEY=your_silentswap_key
RANGE_API_KEY=your_range_key
```

## Privacy Architecture

ShieldedRemit implements a multi-layered privacy approach:

### Privacy Levels

| Level | Name | Description | Fee |
|-------|------|-------------|-----|
| None | Standard | Direct on-chain transfer | ~$0.001 |
| Medium | Amount Privacy | Hidden amounts using ZK proofs (ShadowWire) | ~$0.01 |
| High | Full Anonymity | Complete obfuscation via multi-hop routing (SilentSwap) | ~0.5% |

### How It Works

1. **Standard Transfer**: Direct Solana transaction, all details visible on-chain
2. **Amount Privacy (ShadowWire)**: Uses Bulletproofs to hide transaction amounts while keeping sender/recipient visible
3. **Full Anonymity (SilentSwap + ShadowWire)**: Combines multi-hop obfuscated routing with hidden amounts for complete privacy

### Privacy Guarantees

**Protected:**
- Transaction amounts (Medium/High)
- Sender identity (High only)
- Recipient identity (High only)
- Transaction timing (High only)

**Not Protected:**
- IP addresses (use VPN for additional privacy)
- Wallet metadata (use fresh wallets for maximum privacy)

## Project Structure

```
/shieldedremit
├── /src
│   ├── /app              # Next.js App Router pages
│   │   ├── /send         # Send money flow
│   │   ├── /receive      # Receive money & QR codes
│   │   ├── /history      # Transaction history
│   │   └── /settings     # User preferences
│   ├── /components       # Reusable UI components
│   │   ├── /ui           # Base shadcn/ui components
│   │   ├── /layout       # Header, Footer, etc.
│   │   └── /providers    # Context providers
│   ├── /lib              # Utility functions & services
│   │   ├── /solana       # Solana connection & transactions
│   │   ├── /privacy      # SilentSwap & ShadowWire integration
│   │   ├── /prices       # Price feeds (Jupiter, Pyth)
│   │   └── /validation   # Zod schemas
│   ├── /hooks            # Custom React hooks
│   ├── /stores           # Zustand state stores
│   └── /types            # TypeScript type definitions
├── /public               # Static assets
├── /docs                 # Documentation
└── /tests                # Test suites
```

## Supported Currencies

- **SOL** - Native Solana token
- **USDC** - USD Coin (SPL token)
- **USDT** - Tether (SPL token)

## Compliance Features

ShieldedRemit optionally integrates with Range Protocol for:

- Wallet screening (sanctions, PEPs, watchlists)
- Transaction risk scoring
- AML/CFT compliance
- Selective disclosure for regulatory requirements

KYC levels with configurable transaction limits are available for users who need higher limits.

## Development

### Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Conventional commits recommended

## Security

- No private keys are ever stored or transmitted
- All sensitive operations happen client-side
- Optional compliance features are privacy-preserving
- Regular security audits recommended for production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Solana](https://solana.com) - High-performance blockchain
- [SilentSwap](https://silentswap.io) - Privacy routing protocol
- [ShadowWire](https://radr.io) - Zero-knowledge transfers
- [Range Protocol](https://range.io) - Compliance infrastructure
- [Helius](https://helius.xyz) - Enhanced Solana RPC

---

Built with privacy in mind. Your money, your control.

# Obscura Dark OTC RFQ Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple.svg)](https://explorer.solana.com/?cluster=devnet)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue.svg)](https://sepolia.etherscan.io/)

Privacy-preserving Request for Quote (RFQ) system built on Obscura infrastructure. Enables bilateral trading between market makers and takers with cryptographic privacy guarantees including stealth addresses, WOTS+ post-quantum signatures, and zero-knowledge proofs.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Privacy Infrastructure](#privacy-infrastructure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development](#development)
- [Technology Stack](#technology-stack)
- [Security](#security)
- [License](#license)

## Features

- **Privacy-Preserving Trading**: Stealth addresses and WOTS+ one-time signatures for unlinkable transactions
- **Post-Quantum Security**: WOTS+ (Winternitz One-Time Signature Plus) cryptographic signatures
- **Off-Chain Balance Tracking**: Encrypted balance management via Arcium cSPL (Rescue cipher)
- **ZK Compression**: Solana storage optimization via Light Protocol (1000x cost reduction)
- **Multi-Chain Support**: Solana Devnet and Ethereum Sepolia testnet
- **Relayer Network**: Private transaction submission through Obscura-LLMS infrastructure
- **Real-Time Quote Management**: Active quote counting and expiration handling
- **Private Messaging**: Encrypted communication between takers and market makers
- **Whitelist Management**: Permissioned and permissionless market maker modes

## Architecture

```
obscura-dark-otc-rfq-be (Express TypeScript)
├── RFQ Core Service
│   ├── Quote Request Management
│   ├── Quote Submission & Selection
│   └── Settlement Execution
├── Privacy Service
│   ├── Stealth Address Generation
│   ├── Pedersen Commitments
│   └── Nullifier Generation
├── Obscura-LLMS Client
│   ├── Balance Verification
│   ├── Deposit Management
│   └── Settlement via Relayer
├── Signature Service
│   ├── WOTS+ Verification
│   └── Signature Reuse Prevention
└── Supabase Database
    ├── Quote Requests
    ├── Quotes
    ├── Messages
    └── Whitelist
```

### Integration with Obscura-LLMS Backend

This backend integrates with the existing Obscura-LLMS infrastructure:

- **Production URL**: `https://obscura-api.daemonprotocol.com`
- **Deposit Endpoint**: `POST /api/v1/deposit` - Balance tracking via Arcium cSPL
- **Withdraw Endpoint**: `POST /api/v1/withdraw` - Settlement via relayer network
- **Privacy Status**: `GET /api/v1/privacy/status` - Arcium & Light Protocol status
- **Relayer Stats**: `GET /api/v1/relayer/stats` - Monitor relayer operations

## Privacy Infrastructure

This system uses production-grade privacy infrastructure:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Blockchain** | Solana Devnet, Sepolia Testnet | Verifiable on-chain transactions |
| **Off-Chain Balance** | Arcium SDK v0.6.3 | MPC-based encrypted balance tracking |
| **ZK Compression** | Light Protocol | 1000x cheaper Solana storage |
| **Signatures** | WOTS+ (mochimo-wots-v2) | Post-quantum one-time signatures |
| **Relayer Network** | Obscura-LLMS | Private transaction submission |
| **Database** | Supabase PostgreSQL | Persistent storage with RLS |

### Privacy Model

**Visible (Fair Trading)**:
- Asset pairs, directions, amounts, prices
- Quote counts and expiration times
- Transaction timestamps

**Hidden (Privacy)**:
- User identities (stealth addresses)
- Transaction linkability (WOTS+ one-time signatures)
- Settlement details (ZK proofs)
- On-chain activity (relayer network)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- Solana Devnet RPC access
- Sepolia Testnet RPC URL (Infura, Alchemy, or similar)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/fikriaf/obscura-dark-otc-be.git
cd obscura-dark-otc-be
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Set up database (see [Database Setup](#database-setup))

5. Start development server:
```bash
npm run dev
```

### Production Deployment

#### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/fikriaf/obscura-dark-otc-be)

For detailed deployment instructions, see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md).

Quick steps:
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Railway auto-detects Dockerfile and deploys
4. Access your API at `https://your-app.railway.app`

#### Docker Deployment

Build and run with Docker:
```bash
# Build image
docker build -t obscura-dark-otc-be .

# Run container
docker run -p 3000:3000 --env-file .env obscura-dark-otc-be
```

## Configuration

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Ethereum Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
SEPOLIA_CHAIN_ID=11155111

# Obscura-LLMS Backend
OBSCURA_LLMS_BASE_URL=https://obscura-api.daemonprotocol.com

# Arcium Configuration (v0.6.3)
ARCIUM_CLUSTER_OFFSET=456
ARCIUM_PROGRAM_ID=arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg

# Light Protocol Configuration
LIGHT_PROTOCOL_ENABLED=true
LIGHT_PROTOCOL_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key

# Whitelist Configuration
WHITELIST_MODE=permissionless

# Admin Configuration
ADMIN_PUBLIC_KEY=your-admin-public-key
```

### Whitelist Modes

- **permissionless** (default): Anyone can be a market maker
- **permissioned**: Only whitelisted addresses can submit quotes

## Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Quote Requests Table
CREATE TABLE quote_requests (
  id TEXT PRIMARY KEY,
  asset_pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  amount_commitment TEXT NOT NULL,
  stealth_address TEXT NOT NULL,
  taker_public_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'filled', 'cancelled')),
  nullifier TEXT
);

CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_expires_at ON quote_requests(expires_at);
CREATE INDEX idx_quote_requests_taker_public_key ON quote_requests(taker_public_key);

-- Quotes Table
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  price_commitment TEXT NOT NULL,
  market_maker_public_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'accepted')),
  FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotes_quote_request_id ON quotes(quote_request_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_expires_at ON quotes(expires_at);
CREATE INDEX idx_quotes_market_maker_public_key ON quotes(market_maker_public_key);
CREATE INDEX idx_quotes_request_status_expires ON quotes(quote_request_id, status, expires_at);

-- Messages Table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  sender_public_key TEXT NOT NULL,
  recipient_stealth_address TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_quote_request_id ON messages(quote_request_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Whitelist Table
CREATE TABLE whitelist (
  address TEXT PRIMARY KEY,
  added_at BIGINT NOT NULL,
  added_by TEXT NOT NULL
);

CREATE INDEX idx_whitelist_added_at ON whitelist(added_at);

-- Whitelist Audit Log Table
CREATE TABLE whitelist_audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('add', 'remove')),
  address TEXT NOT NULL,
  admin_address TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  reason TEXT
);

CREATE INDEX idx_whitelist_audit_log_timestamp ON whitelist_audit_log(timestamp);
CREATE INDEX idx_whitelist_audit_log_address ON whitelist_audit_log(address);

-- Used Signatures Table (WOTS+ Signature Reuse Prevention)
CREATE TABLE used_signatures (
  signature_hash TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  public_key TEXT NOT NULL,
  used_at BIGINT NOT NULL
);

CREATE INDEX idx_used_signatures_used_at ON used_signatures(used_at);
CREATE INDEX idx_used_signatures_public_key ON used_signatures(public_key);
```

## API Documentation

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and version |
| `/health` | GET | Health check status |
| `/api/v1/privacy/status` | GET | Privacy infrastructure status |
| `/api/v1/solana/status` | GET | Solana Devnet connection status |
| `/api/v1/evm/status` | GET | Sepolia Testnet connection status |

### RFQ Operations

#### Quote Requests

**Create Quote Request**
```
POST /api/v1/rfq/quote-request
```
Request Body:
```json
{
  "assetPair": "SOL/USDC",
  "direction": "buy",
  "amount": "1000000000",
  "timeout": 1737648000000,
  "signature": "0x...",
  "publicKey": "0x...",
  "message": "create_quote_request:SOL/USDC:buy:1000000000:1737648000000",
  "commitment": "optional-commitment",
  "chainId": "solana-devnet"
}
```

**Get All Quote Requests**
```
GET /api/v1/rfq/quote-requests?status=active
```

**Get Quote Request by ID**
```
GET /api/v1/rfq/quote-request/:id
```

**Cancel Quote Request**
```
POST /api/v1/rfq/quote-request/:id/cancel
```
Request Body:
```json
{
  "signature": "0x...",
  "publicKey": "0x..."
}
```

#### Quotes

**Submit Quote (Market Makers)**
```
POST /api/v1/rfq/quote
```
Request Body:
```json
{
  "quoteRequestId": "uuid",
  "price": "50000000",
  "expirationTime": 1737648000000,
  "signature": "0x...",
  "publicKey": "0x...",
  "commitment": "optional-commitment",
  "chainId": "solana-devnet"
}
```

**Get Quotes for Quote Request**
```
GET /api/v1/rfq/quote-request/:id/quotes
```

**Accept Quote**
```
POST /api/v1/rfq/quote/:id/accept
```
Request Body:
```json
{
  "signature": "0x...",
  "publicKey": "0x...",
  "commitment": "required-commitment",
  "chainId": "solana-devnet"
}
```

### Private Messaging

**Send Message**
```
POST /api/v1/rfq/message
```
Request Body:
```json
{
  "quoteRequestId": "uuid",
  "recipientStealthAddress": "0x...",
  "encryptedContent": "encrypted-message",
  "signature": "0x...",
  "publicKey": "0x..."
}
```

**Get Messages**
```
GET /api/v1/rfq/quote-request/:id/messages?publicKey=0x...
```

### Admin Operations

**Add to Whitelist**
```
POST /api/v1/admin/whitelist/add
```
Request Body:
```json
{
  "address": "market-maker-address",
  "signature": "0x...",
  "publicKey": "admin-public-key"
}
```

**Remove from Whitelist**
```
POST /api/v1/admin/whitelist/remove
```

**Get Whitelist**
```
GET /api/v1/admin/whitelist
```

For complete API documentation, see [obscura-dark-otc-rfq-llms.txt](obscura-dark-otc-rfq-llms.txt).

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Test WOTS+ signature verification
node test_backend_wots.mjs

# Test cancel with different keypair (WOTS+ ownership)
node test_cancel_with_different_keypair.mjs

# Test quote count feature
node test_quote_count.mjs

# Test full RFQ flow
node test_full_rfq_flow.mjs
```

## Development

### Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Project Structure

```
obscura-dark-otc-be/
├── src/
│   ├── clients/          # External API clients
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── supabase/
│   └── migrations/       # Database migrations
├── test/                 # Test files
├── docs/                 # Documentation
└── package.json
```

## Technology Stack

### Backend Framework
- **Express.js** 4.18+ - Web application framework
- **TypeScript** 5.3+ - Type-safe JavaScript

### Blockchain
- **Solana Web3.js** 1.95.8 - Solana blockchain interaction
- **Ethers.js** 6.13.0+ - Ethereum blockchain interaction

### Privacy & Cryptography
- **Arcium SDK** 0.6.3 - MPC-based encrypted computation
- **Light Protocol** 0.22.1-alpha.1 - ZK compression for Solana
- **WOTS+** (mochimo-wots-v2 1.1.1) - Post-quantum signatures
- **Elliptic** - Pedersen commitments

### Database & Storage
- **Supabase** - PostgreSQL with Row Level Security
- **PostgreSQL** 15+ - Relational database

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node** - TypeScript execution

## Security

### Cryptographic Primitives

- **WOTS+ Signatures**: Post-quantum secure one-time signatures (2208 bytes)
- **Stealth Addresses**: Unlinkable one-time addresses for privacy
- **Pedersen Commitments**: Cryptographic hiding of amounts and prices
- **Nullifiers**: Prevent double-spending and replay attacks
- **SHA-256**: Message hashing for signature verification

### Security Features

- **Signature Reuse Prevention**: Database tracking of used WOTS+ signatures
- **Ownership Verification**: Resource ID knowledge + valid signature
- **Encrypted Messaging**: End-to-end encryption via stealth addresses
- **Relayer Network**: Hide user addresses from blockchain
- **Off-Chain Balance**: Encrypted balance tracking via Arcium MPC

### WOTS+ One-Time Signatures

This system uses WOTS+ (Winternitz One-Time Signature Plus) for post-quantum security. Each action requires a NEW keypair:

- Create request: Keypair A (used once)
- Cancel request: Keypair B (different from A)
- Accept quote: Keypair C (different from A and B)

Ownership is proven by:
1. Knowledge of resource ID (only creator knows)
2. Valid WOTS+ signature (cryptographically secure)

For implementation details, see [WOTS_OWNERSHIP_GUIDE.md](WOTS_OWNERSHIP_GUIDE.md).

## Verification

All transactions are verifiable on blockchain explorers:

- **Solana Devnet**: https://explorer.solana.com/?cluster=devnet
- **Ethereum Sepolia**: https://sepolia.etherscan.io

## Documentation

- [API Documentation](obscura-dark-otc-rfq-llms.txt) - Complete API reference
- [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md) - Deploy to Railway
- [WOTS+ Ownership Guide](WOTS_OWNERSHIP_GUIDE.md) - WOTS+ implementation details
- [Frontend Integration Guide](FRONTEND_WOTS_INTEGRATION.md) - Frontend integration
- [Quote Count Implementation](QUOTE_COUNT_IMPLEMENTATION.md) - Quote count feature
- [Whitelist Mode Guide](WHITELIST_MODE_GUIDE.md) - Whitelist configuration

## Performance

| Endpoint | Response Time | Target |
|----------|--------------|--------|
| GET /quote-requests (10) | ~50ms | < 200ms |
| GET /quote-requests (100) | ~150ms | < 200ms |
| GET /quote-request/:id | ~20ms | < 100ms |
| GET /quotes | ~30ms | < 150ms |

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Disclaimer

This is a testnet/devnet implementation for development and testing purposes. Do not use with real funds on mainnet without proper security audits.

## Support

For issues and questions:
- GitHub Issues: https://github.com/fikriaf/obscura-dark-otc-be/issues
- Documentation: See docs/ directory

## Acknowledgments

- Obscura-LLMS team for privacy infrastructure
- Arcium for MPC technology
- Light Protocol for ZK compression
- Mochimo for WOTS+ implementation

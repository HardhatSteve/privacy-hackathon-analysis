# Design Document: Obscura Dark OTC RFQ MVP

## Overview

The Obscura Dark OTC RFQ MVP is a privacy-preserving Request for Quote system that enables bilateral trading between market makers and takers. The system wraps existing Obscura privacy infrastructure to provide confidential quote requests, private quote submissions, and unlinkable quote selections.

The MVP implements the core RFQ workflow:
1. **Taker creates private quote request** - Using stealth addresses and Pedersen commitments
2. **Market makers submit confidential quotes** - Through relayer network for privacy
3. **Taker selects quote privately** - With nullifier-based double-spend protection

The system leverages Obscura's privacy primitives:
- **Off-chain balance tracking** (Arcium cSPL with Rescue cipher encryption)
- **Relayer network** (private transaction submission)
- **Stealth addresses** (unlinkable payments)
- **Pedersen commitments** (hidden amounts)
- **WOTS+ signatures** (post-quantum security)
- **Nullifiers** (double-spend protection)
- **Light Protocol ZK Compression** (Solana only, ~1000x cheaper storage)

## ⚠️ CRITICAL IMPLEMENTATION REQUIREMENT

**HARUS BEKERJA REAL SECARA DEVNET - TIDAK BOLEH ADA SIMULASI/FAKE CODE**

Semua implementasi HARUS:
- ✅ Deploy ke **Solana Devnet** dan **Sepolia Testnet** yang real
- ✅ Menggunakan **Arcium SDK v0.6.3** yang real (bukan mock/simulasi)
- ✅ Menggunakan **Light Protocol ZK Compression** yang real
- ✅ Menggunakan **WOTS+ signatures** yang real (bukan placeholder)
- ✅ Menggunakan **Rescue cipher encryption** yang real dari Arcium
- ✅ Menggunakan **relayer network** yang real (bukan fake transaction)
- ✅ Semua transaksi harus bisa di-verify di **Solana Explorer** dan **Sepolia Etherscan**
- ✅ Semua cryptographic operations harus menggunakan library yang real (bukan stub)

**DILARANG:**
- ❌ Mock/stub untuk Arcium MPC
- ❌ Fake transaction hash
- ❌ Simulasi encryption/decryption
- ❌ Placeholder untuk signature verification
- ❌ Fake balance tracking
- ❌ Mock relayer service

**VERIFICATION:**
Setiap operasi harus menghasilkan transaction hash yang bisa di-verify di blockchain explorer.

**EXISTING INFRASTRUCTURE:**
Backend ini akan **fetch/reuse** endpoint dari obscura-llms BE yang sudah ada:
- **Base URL:** `https://obscura-api.daemonprotocol.com`
- **Deposit:** `POST /api/v1/deposit` - Balance tracking via Arcium cSPL
- **Withdraw:** `POST /api/v1/withdraw` - Settlement via relayer (direct transfer)
- **Privacy Status:** `GET /api/v1/privacy/status` - Arcium & Light Protocol status
- **Relayer Stats:** `GET /api/v1/relayer/stats` - Monitor relayer operations

**Technology Stack:**
- **Backend:** Express + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Blockchain:**
  - Solana Web3.js v1.95.8 (security fix, Dec 2024)
  - Ethers.js v6.13.0+ (latest stable)
- **Privacy:**
  - Arcium SDK v0.6.3 (`@arcium-hq/client@0.6.3`)
  - Light Protocol (`@lightprotocol/stateless.js@0.22.1-alpha.1`)
- **Cryptography:**
  - WOTS+: `mochimo-wots-v2@1.1.1` (post-quantum signatures)
  - Pedersen Commitments: Custom implementation or `elliptic` library

### Out of Scope for MVP
- Dark pool order matching
- Advanced chat features (only basic P2P messaging)
- Cross-chain atomic settlement
- MEV protection
- Oracle integration
- Liquidity aggregation
- Full compliance/audit features

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              obscura-dark-otc-rfq-be (NEW)                  │
│                  (Express TypeScript)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   RFQ Core   │  │   Privacy    │  │  Obscura-    │    │
│  │   Service    │  │   Service    │  │  LLMS Client │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                 │                  │             │
│         └─────────────────┴──────────────────┘             │
│                          │                                  │
│         ┌────────────────┴────────────────┐               │
│         │                                  │               │
│  ┌──────▼──────┐                  ┌───────▼──────┐       │
│  │  Supabase   │                  │   Signature  │       │
│  │  Database   │                  │   Verifier   │       │
│  └─────────────┘                  └──────────────┘       │
│         │                                  │               │
└─────────┼──────────────────────────────────┼───────────────┘
          │                                  │
          │ HTTP Fetch                       │
          ▼                                  │
┌─────────────────────────────────────────────────────────────┐
│         Obscura-LLMS BE (EXISTING)                          │
│         https://obscura-api.daemonprotocol.com              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/v1/deposit      - Balance tracking               │
│  POST /api/v1/withdraw     - Settlement via relayer         │
│  GET  /api/v1/privacy/status - Arcium & Light status        │
│  GET  /api/v1/relayer/stats  - Relayer monitoring           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Arcium     │  │   Relayer    │  │    Light     │    │
│  │   cSPL       │  │   Network    │  │   Protocol   │    │
│  │ (Off-chain)  │  │  (Privacy)   │  │(ZK Compress) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**RFQ Core Service**
- Quote request creation and management
- Quote submission and storage
- Quote selection and matching
- Timeout and cancellation logic
- Request/quote lifecycle management

**Privacy Service**
- Stealth address generation
- Pedersen commitment creation
- Commitment verification
- Privacy-preserving data structures

**Obscura-LLMS Client**
- HTTP client for obscura-llms BE endpoints
- Deposit operations (balance tracking)
- Withdrawal operations (settlement via relayer)
- Privacy status monitoring
- Relayer stats tracking

**Supabase Database**
- Quote requests storage
- Quotes storage
- Messages storage
- Whitelist management
- Used signatures tracking
- PostgreSQL with real-time subscriptions

**Signature Verifier**
- WOTS+ signature verification
- Signature reuse detection
- Public key validation
- Post-quantum security enforcement

### Data Flow

**Quote Request Creation Flow:**
```
1. Taker → API: Create quote request
2. API → Privacy Service: Generate stealth address
3. API → Privacy Service: Create Pedersen commitment for amount
4. API → Obscura-LLMS Client: Check balance via /api/v1/relayer/stats
5. API → Signature Verifier: Verify WOTS+ signature
6. API → Supabase: Store quote request
7. API → Taker: Return quote_request_id and stealth_address
```

**Quote Submission Flow:**
```
1. Market Maker → API: Submit quote
2. API → Supabase: Verify market maker in whitelist
3. API → Supabase: Verify quote request exists and not expired
4. API → Privacy Service: Create Pedersen commitment for price
5. API → Obscura-LLMS Client: Check balance via /api/v1/relayer/stats
6. API → Signature Verifier: Verify WOTS+ signature
7. API → Supabase: Store quote
8. API → Market Maker: Return quote_id
```

**Quote Selection Flow:**
```
1. Taker → API: Select quote
2. API → Supabase: Verify taker owns quote request
3. API → Supabase: Verify quote not expired
4. API → Privacy Service: Generate nullifier
5. API → Signature Verifier: Verify WOTS+ signature
6. API → Obscura-LLMS Client: Execute settlement via POST /api/v1/withdraw
7. Obscura-LLMS: Update balances atomically (Arcium cSPL)
8. Obscura-LLMS: Submit via relayer (direct transfer, NO vault PDA)
9. Obscura-LLMS: ZK Compress (Solana only, Light Protocol)
10. API → Supabase: Mark quote request as filled
11. API → Taker: Return confirmation with nullifier, txHash, zkCompressed
```

## Components and Interfaces

### API Endpoints

**POST /api/v1/rfq/quote-request**
Create a new quote request.

Request:
```typescript
{
  assetPair: string;        // e.g., "SOL/USDC"
  direction: "buy" | "sell";
  amount: string;           // Amount as string
  timeout: number;          // Expiration timestamp (ms)
  signature: string;        // WOTS+ signature
  publicKey: string;        // Taker's public key
}
```

Response:
```typescript
{
  success: true,
  quoteRequestId: string;
  stealthAddress: string;
  commitment: string;       // Pedersen commitment
  expiresAt: number;
}
```

**POST /api/v1/rfq/quote**
Submit a quote for a quote request.

Request:
```typescript
{
  quoteRequestId: string;
  price: string;            // Price as string
  expirationTime: number;   // Quote expiration (ms)
  signature: string;        // WOTS+ signature
  publicKey: string;        // Market maker's public key
}
```

Response:
```typescript
{
  success: true,
  quoteId: string;
  priceCommitment: string;  // Pedersen commitment
  expiresAt: number;
}
```

**GET /api/v1/rfq/quote-request/:id/quotes**
Get all quotes for a quote request.

Response:
```typescript
{
  success: true,
  quotes: Array<{
    quoteId: string;
    priceCommitment: string;
    expiresAt: number;
    status: "active" | "expired" | "accepted";
  }>;
}
```

**POST /api/v1/rfq/quote/:id/accept**
Accept a quote.

Request:
```typescript
{
  quoteRequestId: string;
  signature: string;        // WOTS+ signature
  publicKey: string;        // Taker's public key
}
```

Response:
```typescript
{
  success: true,
  nullifier: string;
  txHash: string;
  zkCompressed: boolean;    // Solana only
  compressionSignature?: string;
}
```

**POST /api/v1/rfq/quote-request/:id/cancel**
Cancel a quote request.

Request:
```typescript
{
  signature: string;        // WOTS+ signature
  publicKey: string;        // Taker's public key
}
```

Response:
```typescript
{
  success: true,
  quoteRequestId: string;
  status: "cancelled";
}
```

**POST /api/v1/rfq/message**
Send a private message.

Request:
```typescript
{
  quoteRequestId: string;
  recipientStealthAddress: string;
  encryptedContent: string;
  signature: string;        // WOTS+ signature
  publicKey: string;        // Sender's public key
}
```

Response:
```typescript
{
  success: true,
  messageId: string;
  timestamp: number;
}
```

**GET /api/v1/rfq/quote-request/:id/messages**
Get messages for a quote request.

Response:
```typescript
{
  success: true,
  messages: Array<{
    messageId: string;
    encryptedContent: string;
    timestamp: number;
  }>;
}
```

**POST /api/v1/admin/whitelist/add**
Add market maker to whitelist.

Request:
```typescript
{
  address: string;
  signature: string;        // Admin signature
}
```

Response:
```typescript
{
  success: true,
  address: string;
  addedAt: number;
}
```

**POST /api/v1/admin/whitelist/remove**
Remove market maker from whitelist.

Request:
```typescript
{
  address: string;
  signature: string;        // Admin signature
}
```

Response:
```typescript
{
  success: true,
  address: string;
  removedAt: number;
}
```

**GET /api/v1/admin/whitelist**
Get all whitelisted market makers.

Response:
```typescript
{
  success: true,
  addresses: string[];
}
```

### Core Interfaces

**QuoteRequest**
```typescript
interface QuoteRequest {
  id: string;
  assetPair: string;
  direction: "buy" | "sell";
  amountCommitment: string;     // Pedersen commitment
  stealthAddress: string;
  takerPublicKey: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "expired" | "filled" | "cancelled";
  nullifier?: string;           // Set when filled
}
```

**Quote**
```typescript
interface Quote {
  id: string;
  quoteRequestId: string;
  priceCommitment: string;      // Pedersen commitment
  marketMakerPublicKey: string;
  createdAt: number;
  expiresAt: number;
  status: "active" | "expired" | "accepted";
}
```

**ConfidentialBalance**
```typescript
interface ConfidentialBalance {
  account: string;              // Confidential account address
  encryptedBalance: string;     // Arcium Rescue cipher
  commitment: string;           // Balance commitment
  sipCommitment: string;        // SIP commitment (for lookup)
  deposits: Array<{
    amount: bigint;
    txHash: string;
    timestamp: number;
  }>;
  withdrawals: Array<{
    amount: bigint;
    txHash: string;
    timestamp: number;
  }>;
}
```

**Message**
```typescript
interface Message {
  id: string;
  quoteRequestId: string;
  senderPublicKey: string;
  recipientStealthAddress: string;
  encryptedContent: string;
  timestamp: number;
}
```

**WhitelistEntry**
```typescript
interface WhitelistEntry {
  address: string;
  addedAt: number;
  addedBy: string;              // Admin address
}
```

### Service Interfaces

**ObscuraLLMSClient**
```typescript
interface ObscuraLLMSClient {
  // Base URL
  baseUrl: string; // https://obscura-api.daemonprotocol.com
  
  // Deposit (balance tracking)
  deposit(params: {
    network: "solana-devnet" | "sepolia";
    token: "native" | "usdc" | "usdt";
    amount: string;
  }): Promise<{
    success: boolean;
    depositNote: {
      commitment: string;
      nullifier: string;
      nullifierHash: string;
      secret: string;
      amount: string;
      token: string;
      chainId: string;
      timestamp: number;
    };
    txHash: string;
    vaultAddress: string;
  }>;
  
  // Withdraw (settlement via relayer)
  withdraw(params: {
    commitment: string;
    nullifierHash: string;
    recipient: string;
    amount: string;
    chainId: "solana-devnet" | "sepolia";
  }): Promise<{
    success: boolean;
    requestId: string;
    txHash: string;
    status: "pending" | "processing" | "completed" | "failed";
    zkCompressed: boolean;
    compressionSignature?: string;
  }>;
  
  // Get privacy status
  getPrivacyStatus(): Promise<{
    status: "operational";
    arcium: {
      configured: boolean;
      clusterOffset: string;
      version: string;
      programId: string;
    };
    lightProtocol: {
      configured: boolean;
      zkCompression: boolean;
    };
  }>;
  
  // Get relayer stats
  getRelayerStats(): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalVolume: string;
    pendingRequests: number;
    usedNullifiers: number;
  }>;
  
  // Get withdrawal request status
  getWithdrawalRequest(requestId: string): Promise<{
    requestId: string;
    status: "pending" | "processing" | "completed" | "failed";
    commitment: string;
    recipient: string;
    amount: string;
    chainId: string;
    txHash?: string;
    completedAt?: number;
  }>;
}
```

**SupabaseClient**
```typescript
interface SupabaseClient {
  // Quote Requests
  createQuoteRequest(data: QuoteRequest): Promise<QuoteRequest>;
  getQuoteRequest(id: string): Promise<QuoteRequest | null>;
  updateQuoteRequestStatus(id: string, status: string): Promise<void>;
  
  // Quotes
  createQuote(data: Quote): Promise<Quote>;
  getQuotesByRequestId(requestId: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | null>;
  updateQuoteStatus(id: string, status: string): Promise<void>;
  
  // Messages
  createMessage(data: Message): Promise<Message>;
  getMessagesByRequestId(requestId: string): Promise<Message[]>;
  
  // Whitelist
  addToWhitelist(address: string, addedBy: string): Promise<WhitelistEntry>;
  removeFromWhitelist(address: string): Promise<void>;
  isWhitelisted(address: string): Promise<boolean>;
  getWhitelist(): Promise<WhitelistEntry[]>;
  
  // Used Signatures
  isSignatureUsed(signatureHash: string): Promise<boolean>;
  markSignatureUsed(signatureHash: string): Promise<void>;
}
```

**PrivacyService**
```typescript
interface PrivacyService {
  // Generate stealth address
  generateStealthAddress(): {
    address: string;
    privateKey: string;
  };
  
  // Create Pedersen commitment
  createCommitment(value: bigint, blinding: bigint): string;
  
  // Verify commitment
  verifyCommitment(
    commitment: string,
    value: bigint,
    blinding: bigint
  ): boolean;
  
  // Generate nullifier
  generateNullifier(): string;
  
  // Hash nullifier
  hashNullifier(nullifier: string): string;
  
  // Encrypt message
  encryptMessage(
    content: string,
    recipientStealthAddress: string
  ): string;
  
  // Decrypt message
  decryptMessage(
    encryptedContent: string,
    privateKey: string
  ): string;
}
```

**RelayerService**
```typescript
interface RelayerService {
  // Submit transaction through relayer
  submitTransaction(
    operation: "quote_request" | "quote" | "accept" | "cancel" | "message",
    data: any,
    signature: string
  ): Promise<{
    success: boolean;
    txHash: string;
    zkCompressed?: boolean;
    compressionSignature?: string;
  }>;
  
  // Calculate relayer fee
  calculateFee(amount: bigint): bigint;
}
```

**RelayerService**
```typescript
interface RelayerService {
  // Submit transaction through relayer
  submitTransaction(
    operation: "quote_request" | "quote" | "accept" | "cancel" | "message",
    data: any,
    signature: string
  ): Promise<{
    success: boolean;
    txHash: string;
    zkCompressed?: boolean;
    compressionSignature?: string;
  }>;
  
  // Calculate relayer fee
  calculateFee(amount: bigint): bigint;
}
```

**SignatureVerifier**
```typescript
interface SignatureVerifier {
  // Verify WOTS+ signature
  verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): boolean;
  
  // Check if signature was already used
  isSignatureUsed(signatureHash: string): boolean;
  
  // Mark signature as used
  markSignatureUsed(signatureHash: string): void;
}
```

## Data Models

### Database Schema (Supabase PostgreSQL)

**quote_requests table**
```sql
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
  nullifier TEXT,
  CONSTRAINT idx_status_quote_requests CHECK (status IN ('active', 'expired', 'filled', 'cancelled'))
);

CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_expires_at ON quote_requests(expires_at);
CREATE INDEX idx_quote_requests_taker_public_key ON quote_requests(taker_public_key);
```

**quotes table**
```sql
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
```

**messages table**
```sql
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
```

**whitelist table**
```sql
CREATE TABLE whitelist (
  address TEXT PRIMARY KEY,
  added_at BIGINT NOT NULL,
  added_by TEXT NOT NULL
);

CREATE INDEX idx_whitelist_added_at ON whitelist(added_at);
```

**used_signatures table**
```sql
CREATE TABLE used_signatures (
  signature_hash TEXT PRIMARY KEY,
  used_at BIGINT NOT NULL
);

CREATE INDEX idx_used_signatures_used_at ON used_signatures(used_at);
```

**Supabase Configuration:**
- Enable Row Level Security (RLS) for all tables
- Set up real-time subscriptions for quote updates
- Configure connection pooling for high concurrency
- Enable point-in-time recovery (PITR) for data safety

### Data Validation Rules

**Quote Request Validation**
- `assetPair`: Must match format "TOKEN1/TOKEN2" (e.g., "SOL/USDC")
- `direction`: Must be "buy" or "sell"
- `amount`: Must be positive, minimum 0.0003 (in base units)
- `timeout`: Must be future timestamp, maximum 24 hours from creation
- `signature`: Must be valid WOTS+ signature, not previously used
- `publicKey`: Must be valid public key format

**Quote Validation**
- `quoteRequestId`: Must reference existing, non-expired quote request
- `price`: Must be positive
- `expirationTime`: Must be future timestamp, cannot exceed quote request expiration
- `signature`: Must be valid WOTS+ signature, not previously used
- `publicKey`: Must be whitelisted market maker

**Quote Acceptance Validation**
- Quote must exist and not be expired
- Quote request must not be filled or cancelled
- Taker must own the quote request (signature verification)
- Both taker and market maker must have sufficient off-chain balance

**Message Validation**
- `quoteRequestId`: Must reference existing quote request
- `recipientStealthAddress`: Must be valid stealth address
- `encryptedContent`: Must be non-empty
- Sender must be either taker or market maker associated with quote request

### Privacy-Preserving Data Structures

**Pedersen Commitment**
```
commitment = g^value * h^blinding (mod p)

Where:
- g, h: Generator points on elliptic curve
- value: The hidden value (amount or price)
- blinding: Random blinding factor
- p: Prime modulus
```

**Nullifier**
```
nullifier = random 32 bytes
nullifierHash = SHA256(nullifier)

Properties:
- Nullifier is secret (only taker knows)
- NullifierHash is public (prevents double-acceptance)
- Cannot derive nullifier from nullifierHash
```

**Stealth Address**
```
stealthAddress = H(ephemeralPublicKey || recipientPublicKey) * G + recipientPublicKey

Where:
- H: Hash function
- G: Generator point
- ephemeralPublicKey: One-time public key
- recipientPublicKey: Recipient's public key

Properties:
- One-time address per quote request
- Unlinkable to recipient's main address
- Only recipient can derive private key
```


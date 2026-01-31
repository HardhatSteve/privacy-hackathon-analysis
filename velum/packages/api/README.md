# @velumdotcash/api

[![npm](https://img.shields.io/npm/v/@velumdotcash/api)](https://www.npmjs.com/package/@velumdotcash/api)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@velumdotcash/api)](https://bundlephobia.com/package/@velumdotcash/api)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Lightweight TypeScript REST client for the [Velum](https://velum.cash) private payments API. Zero runtime dependencies, tree-shakeable ESM.

## 📦 Installation

```bash
npm install @velumdotcash/api
```

## 🚀 Quick Start

```typescript
import { VelumClient } from "@velumdotcash/api";

const client = new VelumClient({
  apiKey: "pk_live_your_api_key",
});

// Create a private payment link
const paylink = await client.paylinks.create({
  recipientUtxoPubkey: "21888242871839...",
  recipientEncryptionKey: "base64encodedkey...",
  token: "USDC",
  amountLamports: "1000000", // 1 USDC
});

console.log(paylink.url); // https://velum.cash/pay/clx1234...
```

## 📡 API

### Paylinks

```typescript
// Create a payment link
const paylink = await client.paylinks.create({
  recipientUtxoPubkey: string,     // BN254 public key (required)
  recipientEncryptionKey: string,  // X25519 public key (required)
  token?: "ANY" | "SOL" | "USDC" | "USDT",
  amountLamports?: string,         // null = sender decides
  memo?: string,                   // max 140 chars
  expiresAt?: string,              // ISO 8601
});

// Retrieve a payment link
const paylink = await client.paylinks.get(id);
```

### Transactions

```typescript
// Log a transaction
await client.transactions.log({
  type: "deposit" | "withdraw",
  token: "SOL" | "USDC" | "USDT",
  amountLamports: string,
  signature: string,               // Solana tx signature
  status?: "pending" | "confirmed" | "failed",
  utxoPubkey?: string,
  paylinkId?: string,
});

// List transactions
const { transactions, total } = await client.transactions.list({
  type?: "deposit" | "withdraw",
  token?: string,
  utxoPubkey?: string,
  limit?: number,                  // default 20
  offset?: number,
});

// Update status
await client.transactions.updateStatus(signature, "confirmed");
```

## ⚙️ Configuration

```typescript
const client = new VelumClient({
  apiKey: "pk_live_...",              // Required
  baseUrl: "https://velum.cash/api",  // Default
  fetch: customFetch,                 // Optional — for testing or SSR
});
```

## ⚠️ Error Handling

```typescript
import { VelumClient, VelumApiError } from "@velumdotcash/api";

try {
  await client.paylinks.get("nonexistent");
} catch (err) {
  if (err instanceof VelumApiError) {
    err.code;    // "NOT_FOUND"
    err.message; // "Paylink not found"
    err.status;  // 404
    err.details; // optional
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Resource not found |
| `EXPIRED` | 410 | Payment link has expired |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## 🔗 Related

- [`@velumdotcash/sdk`](https://www.npmjs.com/package/@velumdotcash/sdk) — Client-side ZK operations (deposit, withdraw, proofs)
- [Developer Guide](https://velum.cash/docs/developer-guide) — Full integration documentation
- [API Reference](https://velum.cash/docs/api) — Endpoint documentation

## 📄 License

[MIT](./LICENSE)

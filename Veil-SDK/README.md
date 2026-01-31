# Veil: The Privacy Developer Kit for Solana

> **Make privacy a primitive, not a pivot.**

Veil is a developer-first abstraction layer for Solana privacy. It standardizes fragmented protocols into a single, inspectable SDK, allowing you to execute private transactions without managing complex Zero-Knowledge infrastructure.

## Why Veil?

Building privacy-preserving applications on Solana is currently manual and fragmented. Developers are often forced to choose a specific protocol early, leading to vendor lock-in and complex integration debt. 

Veil abstracts the "how" (the cryptography) from the "what" (the transaction intent). It provides:
- **Protocol Agnosticism**: Swap privacy backends (Adapters) without changing your application code.
- **Transprent Inspection**: See exactly what data is public vs. private *before* broadcating.
- **Standard Tooling**: A familiar, TypeScript-first experience for ZK-based operations.

## Quick Start

### Installation

```bash
npm install @veil-labs/veil
```

### Usage

Veil is designed to feel like standard Solana development.

```typescript
import { createVeil, PrivacyLevel } from '@veil-labs/veil';

// 1. Initialize with your wallet
const veil = createVeil({ wallet });

const input = {
  to: '8x2...Ref',
  amount: 1000000000n, // 1 SOL
  privacyLevel: PrivacyLevel.Private
};

// 2. Inspect: See what data is public vs. private
const report = await veil.inspect(input);
console.log(`Privacy Score: ${report.privacyScore}/100`);

// 3. Send: Execute via the active privacy adapter
const result = await veil.send(input);
console.log(`Transaction signature: ${result.txId}`);
```

## Project Structure

- `packages/veil`: High-level entry point. Use this for most applications.
- `packages/core-sdk`: Interfaces, registry, and client logic.
- `packages/adapters`: Concrete privacy protocol implementations.
- `packages/cli`: Developer CLI for testing and inspection.

## Principles

1. **Honesty First**: If an adapter cannot provide full privacy, `inspect()` will tell you.
2. **Modular by Default**: We don't care which ZK protocol you use, as long as it has an adapter.
3. **No Hidden Magic**: We prefer explicit configuration over silent assumptions.

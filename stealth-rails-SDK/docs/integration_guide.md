# Stealth Rails: 5-Minute Integration Guide

Add privacy to your Solana app in minutes using the Stealth Rails SDK.

## Installation

```bash
npm install stealth-rails-sdk @solana/web3.js
```

## Setup

Initialize the SDK with your Solana connection and wallet.

```typescript
import { Connection } from "@solana/web3.js";
import { StealthRails } from "stealth-rails-sdk";
import { useWallet } from "@solana/wallet-adapter-react";

// In your component or hook
const { wallet } = useWallet();
const connection = new Connection("https://api.devnet.solana.com");
const rails = new StealthRails(connection, wallet);
```

## Core Features

### 1. Shield Assets (Public -> Private)
Convert standard SOL or SPL tokens into private, ZK-compressed tokens.

```typescript
// Shield 1.5 SOL
// The SDK handles all ZK proof generation client-side
const signature = await rails.shield(
    WRAPPED_SOL_MINT, // or any SPL Mint
    1.5
);
console.log("Shielded tx:", signature);
```

### 2. Private Transfer (Private -> Private)
Send tokens without revealing the amount or history. The recipient sees a mysterious increase in their private balance.

```typescript
const recipient = new PublicKey("...dest...");

// Transfer 50 sSOL (Shielded SOL)
const txId = await rails.privateTransfer(
    WRAPPED_SOL_MINT,
    50,
    recipient
);
```

### 3. Reveal / Unshield (Private -> Public)
Move funds back to public state when needed (e.g. for CEX deposit).

```typescript
// Reveal 10 SOL back to main wallet
await rails.unshield(WRAPPED_SOL_MINT, 10);
```

## Compliance & Auditing

You can reveal your history to an auditor without exposing it to the public.

```typescript
// Export view key (coming soon)
const viewKey = rails.exportViewKey();
```

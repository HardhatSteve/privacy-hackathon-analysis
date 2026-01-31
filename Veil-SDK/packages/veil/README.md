# @veil-labs/veil

The entry point for the Veil Privacy SDK.

## Purpose

Veil normalizes the experience of sending private transactions on Solana.

It bundles:
- **@veil-labs/core-sdk**: The orchestration logic.
- **@veil-labs/adapters**: Default privacy implementations.

## Usage

This is the only package you need to install.

```bash
npm install @veil-labs/veil
```

### Initialization

We assume you already have a wallet adapter (e.g., from `@solana/wallet-adapter-react`).

```typescript
import { createVeil, PrivacyLevel } from '@veil-labs/veil';

const veil = createVeil({
  wallet: myWallet,
  network: 'devnet'
});

const result = await veil.send({
  to: 'DestinationAddress...',
  amount: 1000000000n, // 1 SOL
  privacyLevel: PrivacyLevel.Public // Start with public, then upgrade
});

console.log(result.txId);
```

## Privacy Levels

- `Public`: Standard Solana transfer. Fully visible.
- `Confidential`: Hides sender (where supported).
- `Private`: Hides sender, recipient, and amount (where supported).

## Advanced

If you need to access the underlying `VeilClient` (e.g., to register custom adapters), use `veil.raw`.

```typescript
veil.raw.registerAdapter(myCustomAdapter);
```
# @veil-labs/core-sdk

Foundational interfaces and logic for the Veil Privacy SDK.

This package defines how adapters, clients, and registries interact. It does not contain specific privacy implementations.

## Usage

**You probably don't need this directly.**

Most users should start with `@veil-labs/veil`, which bundles this core logic with default adapters.

Install this package only if you are:
- Building a custom Privacy Adapter.
- Creating a bespoke client implementation.
- Integrating Veil into a wallet or infrastructure provider.

```bash
npm install @veil-labs/core-sdk
```

## Architecture

This SDK is designed to be protocol-agnostic. It standardizes privacy operations (`send`, `simulate`, `inspect`) regardless of the underlying mechanism (Zero-Knowledge Proofs, Ring Signatures, Mixers).

### Key Concepts

- **VeilClient**: The orchestration layer. Manages configuration and adapter lifecycle.
- **PrivacyAdapter**: The contract that specific implementations must satisfy.
- **AdapterRegistry**: Handles dynamic switching between privacy providers.

## Example (Manual Setup)

```typescript
import { createVeilClient, VeilConfig } from '@veil-labs/core-sdk';

// We assume you have a wallet adapter from somewhere else
const config: VeilConfig = {
  network: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: myAdapterWallet
};

// Returns a bare client. You must register an adapter manually.
const client = createVeilClient(config);
```
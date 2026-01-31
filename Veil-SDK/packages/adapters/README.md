# @veil-labs/adapters

Concrete privacy implementations for the Veil SDK.

## Purpose

This package connects `@veil-labs/core-sdk` to actual Solana programs and privacy protocols.

It currently includes:
- **NoopPrivacyAdapter**: A zero-privacy, pass-through adapter.

## NoopPrivacyAdapter

This adapter is **intentionally public**. It performs a standard, visible Solana transfer.

### Use Cases
- **Development**: Test your UI flows without needing ZK proofs or complex setups.
- **Fallback**: Allow users to "opt-out" of privacy and send standard transactions if the privacy protocol is congested or failing.
- **Onboarding**: Let users start with standard wallets before transitioning to private accounts.

## Usage

**You probably don't need to install this directly.**

The main `@veil-labs/veil` package bundles these adapters.

If you are building a custom client:

```bash
npm install @veil-labs/adapters
```

```typescript
import { NoopPrivacyAdapter } from '@veil-labs/adapters';

const adapter = new NoopPrivacyAdapter();
// This will return 0 privacy score
const report = await adapter.inspect(txInput, context);
```
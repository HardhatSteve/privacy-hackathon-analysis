---
title: Quick Start
description: Get started with SIP Protocol SDK in 5 minutes
---

# Quick Start

Get up and running with the SIP Protocol SDK in minutes.

## Installation

### Requirements

- Node.js 18+
- TypeScript 5.0+ (recommended)

### Package Installation

```bash
# npm
npm install @sip-protocol/sdk

# pnpm (recommended)
pnpm add @sip-protocol/sdk

# yarn
yarn add @sip-protocol/sdk
```

### TypeScript Configuration

SIP SDK includes full type definitions. No additional `@types` packages needed.

```json
// tsconfig.json (recommended settings)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Network Requirements

:::caution[NEAR Intents is Mainnet Only]
The NEAR Intents (1Click API) operates on **mainnet only**. There is no testnet deployment.

**For development/testing:**
- Use `MockSolver` for unit tests
- Use small mainnet amounts ($5-10) for integration testing
- Individual chains (Solana, Ethereum, NEAR) have testnets for wallet testing
:::

## Your First Shielded Intent

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

// 1. Initialize the SDK
// Note: NEAR Intents is mainnet-only (no testnet)
const sip = new SIP({ network: 'mainnet' })

// 2. Create a shielded intent using the builder pattern
const intent = await sip
  .intent()
  .input('solana', 'SOL', 1_000_000_000n)  // 1 SOL (in lamports)
  .output('ethereum', 'ETH')                // Receive ETH
  .privacy(PrivacyLevel.SHIELDED)           // Enable privacy
  .build()

// 3. Get quotes from solvers
const quotes = await sip.getQuotes(intent.intent)

// 4. Execute with best quote
if (quotes.length > 0) {
  const result = await sip.execute(intent, quotes[0])
  console.log('Transaction:', result.txHash)
}
```

### What Just Happened?

1. **Input hidden**: Your 1 SOL is represented as a Pedersen commitment
2. **Sender hidden**: Your wallet address is not exposed
3. **Recipient protected**: A stealth address is generated for receiving ETH
4. **Cross-chain**: The intent bridges from Solana to Ethereum via NEAR Intents

## Privacy Levels

### TRANSPARENT

Standard cross-chain swap with no privacy features.

```typescript
const intent = await sip
  .intent()
  .input('near', 'NEAR', 100n)
  .output('ethereum', 'ETH')
  .privacy(PrivacyLevel.TRANSPARENT)
  .build()
```

**Use when**: Speed is priority, privacy not needed.

### SHIELDED

Full privacy - hidden sender, amount, and unlinkable recipient.

```typescript
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', 1_000_000_000_000_000_000n)  // 1 ETH
  .output('zcash', 'ZEC')
  .privacy(PrivacyLevel.SHIELDED)
  .build()
```

**Use when**: Maximum privacy required, high-value transactions.

### COMPLIANT

Privacy with selective disclosure via viewing keys.

```typescript
const viewingKey = sip.generateViewingKey('/m/44/501/0/audit')

const intent = await sip
  .intent()
  .input('solana', 'SOL', 5_000_000_000n)
  .output('near', 'NEAR')
  .privacy(PrivacyLevel.COMPLIANT)
  .viewingKey(viewingKey)
  .build()
```

**Use when**: Institutional requirements, regulatory compliance.

## Working with Core Primitives

### Stealth Addresses

```typescript
import {
  generateStealthMetaAddress,
  generateStealthAddress,
  deriveStealthPrivateKey
} from '@sip-protocol/sdk'

// Recipient: Generate meta-address (share publicly)
const metaAddress = generateStealthMetaAddress('ethereum')

// Sender: Generate one-time stealth address
const { stealthAddress, ephemeralPublicKey } = generateStealthAddress(metaAddress)

// Recipient: Derive private key to spend funds
const privateKey = deriveStealthPrivateKey(
  stealthAddress,
  ephemeralPublicKey,
  metaAddress.spendingKey,
  metaAddress.viewingKey
)
```

### Pedersen Commitments

```typescript
import { commit, verifyOpening, addCommitments } from '@sip-protocol/sdk'

// Create a commitment
const amount = 1000n
const { commitment, blinding } = commit(amount)

// Verify commitment
const isValid = verifyOpening(commitment, amount, blinding) // true

// Commitments are homomorphic
const c1 = commit(100n)
const c2 = commit(200n)
const sum = addCommitments(c1.commitment, c2.commitment)
// sum commits to 300n
```

### Viewing Keys

```typescript
import {
  generateViewingKey,
  deriveViewingKey,
  encryptForViewing,
  decryptWithViewing
} from '@sip-protocol/sdk'

// Generate master viewing key
const masterKey = generateViewingKey('/m/44/501/0')

// Derive child keys
const auditKey = deriveViewingKey(masterKey, '/audit/2024')

// Encrypt data for viewing key holder
const encrypted = encryptForViewing(txData, auditKey)

// Decrypt with key
const decrypted = decryptWithViewing(encrypted, auditKey)
```

## Error Handling

```typescript
import {
  SIPError,
  ValidationError,
  ErrorCode,
  isSIPError,
  hasErrorCode
} from '@sip-protocol/sdk'

try {
  const intent = await sip.intent()...build()
} catch (error) {
  if (isSIPError(error)) {
    if (hasErrorCode(error, ErrorCode.INVALID_CHAIN)) {
      console.error('Invalid chain specified')
    } else if (hasErrorCode(error, ErrorCode.INVALID_AMOUNT)) {
      console.error('Invalid amount')
    }
  }
  throw error
}
```

## Next Steps

- [Architecture](/architecture/) - Understand the system design
- [Privacy Levels](/concepts/privacy-levels/) - Detailed privacy options
- [Solver Integration](/guides/solver-integration/) - Build a solver
- [API Migration](/guides/api-migration/) - Migrate from deprecated APIs

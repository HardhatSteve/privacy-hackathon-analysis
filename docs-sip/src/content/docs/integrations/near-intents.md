---
title: NEAR Intents
description: Integration with NEAR Intents settlement layer
---

# NEAR Intents Integration

SIP integrates with NEAR Intents for cross-chain settlement via the 1Click API.

:::caution[Mainnet Only]
NEAR Intents (1Click API) operates on **mainnet only**. There is no testnet deployment.
For testing, use `MockSolver` or small mainnet amounts ($5-10).
:::

## Architecture

```
User Intent → SIP (privacy) → NEAR Intents → Multi-chain Settlement

┌─────────────────────────────────────────────────────────────┐
│  SIP SDK                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  NEARIntentsAdapter                                      ││
│  │  ├── OneClickClient (1Click API)                        ││
│  │  └── Solver Bus WebSocket                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  NEAR Intents Infrastructure                                 │
│  ├── Solver Network                                         │
│  ├── Chain Signatures                                       │
│  └── Settlement Contracts                                   │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌────────┐      ┌────────┐      ┌────────┐
      │Ethereum│      │ Solana │      │  NEAR  │
      └────────┘      └────────┘      └────────┘
```

## OneClickClient

The 1Click API provides simplified cross-chain swaps:

```typescript
import { OneClickClient } from '@sip-protocol/sdk'

const client = new OneClickClient({
  baseUrl: 'https://1click.chaindefuser.com',
  apiKey: 'optional-api-key'
})

// Get quote
const quote = await client.getQuote({
  srcChainId: 'ethereum',
  srcToken: 'ETH',
  dstChainId: 'solana',
  dstToken: 'SOL',
  amount: '1000000000000000000', // 1 ETH in wei
  slippage: 0.5
})

// Execute swap
const result = await client.executeSwap({
  quote,
  senderAddress: '0x...',
  recipientAddress: '...'
})
```

## NEARIntentsAdapter

Full adapter for NEAR Intents integration:

```typescript
import { NEARIntentsAdapter, createNEARIntentsAdapter } from '@sip-protocol/sdk'

const adapter = createNEARIntentsAdapter({
  network: 'mainnet',  // NEAR Intents is mainnet-only
  endpoint: 'https://1click.chaindefuser.com'
})

// Prepare swap
const preparedSwap = await adapter.prepareSwap({
  inputChain: 'ethereum',
  inputToken: 'ETH',
  inputAmount: 1_000_000_000_000_000_000n,
  outputChain: 'solana',
  outputToken: 'SOL',
  sender: '0x...',
  recipient: '...',
  slippage: 0.5
})

// Execute
const result = await adapter.executeSwap(preparedSwap)
console.log('Tx hash:', result.txHash)
```

## Configuration

```typescript
interface NEARIntentsAdapterConfig {
  network: 'mainnet' | 'testnet'
  endpoint?: string           // 1Click API URL
  apiKey?: string             // Optional API key
  timeout?: number            // Request timeout (ms)
}
```

### Network Endpoints

| Network | Endpoint | Status |
|---------|----------|--------|
| Mainnet | `https://1click.chaindefuser.com` | Active |

:::note
There is no testnet endpoint. NEAR Intents operates on mainnet only.
:::

## Supported Chains

| Chain | Chain ID | Native Token |
|-------|----------|--------------|
| NEAR | `near` | NEAR |
| Ethereum | `ethereum` | ETH |
| Solana | `solana` | SOL |
| Polygon | `polygon` | MATIC |
| Arbitrum | `arbitrum` | ETH |
| Optimism | `optimism` | ETH |
| Base | `base` | ETH |

## Privacy Integration

SIP adds privacy layer before NEAR Intents settlement:

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })

// Create shielded intent
const intent = await sip
  .intent()
  .input('ethereum', 'ETH', amount)
  .output('solana', 'SOL')
  .privacy(PrivacyLevel.SHIELDED)  // Add privacy
  .build()

// SIP wraps NEAR Intents with:
// - Pedersen commitments for amounts
// - Stealth addresses for recipient
// - ZK proofs for verification
```

## Solver Bus

For real-time quote streaming:

```typescript
const ws = new WebSocket('wss://solver-relay-v2.chaindefuser.com/ws')

// Subscribe to quotes
ws.send(JSON.stringify({
  method: 'subscribe',
  params: ['quote']
}))

// Handle quote events
ws.on('message', (data) => {
  const event = JSON.parse(data)
  if (event.event === 'quote') {
    console.log('New quote:', event.data)
  }
})

// Request quote
ws.send(JSON.stringify({
  method: 'request_quote',
  params: {
    src_chain: 'ethereum',
    dst_chain: 'solana',
    amount: '1000000000000000000'
  }
}))
```

## Error Handling

```typescript
import { NetworkError, hasErrorCode, ErrorCode } from '@sip-protocol/sdk'

try {
  const quote = await client.getQuote(params)
} catch (error) {
  if (hasErrorCode(error, ErrorCode.NETWORK_ERROR)) {
    console.error('Network error:', error.message)
    // Retry with backoff
  } else if (error.status === 429) {
    console.error('Rate limited')
    // Wait and retry
  }
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Quote | 100/min |
| Execute | 10/min |
| Status | 200/min |

## Chain Signatures

NEAR Chain Signatures enable cross-chain execution:

```
1. User creates intent on SIP
2. SIP submits to NEAR Intents
3. Solver accepts and prepares fulfillment
4. Chain Signatures generates destination chain signature
5. Solver executes on destination chain
6. Settlement completes
```

## Example: Full Flow

```typescript
import { SIP, PrivacyLevel, createEthereumAdapter } from '@sip-protocol/sdk'

async function privateSwap() {
  // Initialize (mainnet-only for NEAR Intents)
  const sip = new SIP({ network: 'mainnet' })

  // Connect wallet
  const adapter = createEthereumAdapter(window.ethereum)
  await adapter.connect()
  sip.connect(adapter)

  // Create shielded intent
  const intent = await sip
    .intent()
    .input('ethereum', 'ETH', 1_000_000_000_000_000_000n)
    .output('solana', 'SOL')
    .privacy(PrivacyLevel.SHIELDED)
    .slippage(0.5)
    .expiry(30) // 30 minutes
    .build()

  // Get quotes (via NEAR Intents)
  const quotes = await sip.getQuotes(intent.intent)

  // Execute best quote
  const result = await sip.execute(intent, quotes[0])

  console.log('Swap complete:', result.txHash)
}
```

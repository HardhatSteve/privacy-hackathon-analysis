<img width="650" height="75" alt="image" src="https://github.com/user-attachments/assets/9227fb36-e231-402c-bd37-3df142bef329" />

<img width="1536" height="1024" alt="1" src="https://github.com/user-attachments/assets/13e03e53-ba36-44cc-a9e0-11b2af73267d" />




**The PNP Exchange CLI & SDK for Solana prediction markets.**

[![npm version](https://img.shields.io/npm/v/pnpfucius.svg)](https://www.npmjs.com/package/pnpfucius)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> *"The wise trader predicts with patience... and privacy"*

## Features

- **Full PNP Exchange Integration** - Create, trade, and settle prediction markets on Solana
- **PNP Oracle Settlement** - Built-in LLM oracle for market resolution criteria
- **AMM & P2P Markets** - Support for both V2 (AMM) and V3 (P2P) market types
- **Custom Odds** - Create markets with custom starting odds
- **Market Discovery** - Browse all markets on PNP Exchange
- **Trading Tools** - Buy/sell YES/NO tokens with USDC
- **Redemption** - Redeem winning positions and claim refunds
- **Interactive CLI** - Purple-themed terminal interface with slash commands
- **Helius RPC Integration** - Reliable Solana access via Helius
- **No External AI Required** - Uses PNP's built-in LLM oracle

## Installation

```bash
# Install from npm
npm install pnpfucius

# Or clone and install locally
git clone https://github.com/pnp-protocol/pnpfucius.git
cd pnpfucius
npm install
```

## Quick Start

```bash
# Run the interactive CLI
npm run pnpfucius
```

## Configuration

Create a `.env` file:

```bash
# Required for trading/creating markets
WALLET_KEY=your_base58_private_key

# Helius API key (recommended)
HELIUS_API_KEY=your_helius_api_key

# Network (devnet or mainnet)
NETWORK=devnet

# Optional defaults
DEFAULT_LIQUIDITY=1000000
DEFAULT_DURATION_DAYS=30
```

Get a free Helius API key at [helius.dev](https://helius.dev)

## CLI Commands

| Command | Description |
|---------|-------------|
| `/discover` | Browse ALL PNP markets |
| `/create [question]` | Create AMM market |
| `/p2p [question]` | Create P2P market |
| `/odds <percent> <question>` | Market with custom odds |
| `/info <address>` | Get market details |
| `/buy <address> <yes\|no> <usdc>` | Buy YES/NO tokens |
| `/sell <address> <yes\|no> <amount>` | Sell tokens |
| `/prices <address>` | Get market prices |
| `/balance <address>` | Check your balances |
| `/oracle <address>` | Get LLM settlement criteria |
| `/settle <address> <yes\|no>` | Settle a market |
| `/redeem <address>` | Redeem winning position |
| `/refund <address>` | Claim refund |
| `/config` | Show configuration |
| `/tools` | List all available tools |
| `/help` | Show help |
| `/exit` | Exit PNPFUCIUS |

## SDK Usage

```javascript
import { createAgent, executeTool } from 'pnpfucius';

// Create an agent
const agent = await createAgent({ verbose: true });

// Create a market
const result = await agent.createMarket({
    question: 'Will BTC reach $150k by March 2026?',
    durationDays: 90,
    liquidity: 1000000n
});
console.log('Market created:', result.market);

// Discover all markets
const markets = await agent.discoverMarkets();
console.log('Found markets:', markets.total);

// Get settlement criteria from PNP Oracle
const criteria = await agent.fetchSettlementCriteria(marketAddress);
console.log('Settlement criteria:', criteria);

// Buy tokens
const trade = await agent.buyTokens({
    marketAddress: '7xKXw9...',
    side: 'yes',
    amountUsdc: 50
});

// Use tools directly
await executeTool('discover_all_markets', {});
await executeTool('get_settlement_criteria', { market_address: '...' });
await executeTool('buy_tokens', { market_address: '...', side: 'yes', amount_usdc: 10 });
```

## Available Tools

### Market Creation
- `create_market` - Create AMM market
- `create_p2p_market_simple` - Create simple P2P market
- `create_amm_market_with_odds` - AMM with custom odds
- `create_p2p_market_with_odds` - P2P with custom odds
- `create_market_with_oracle` - Market with custom oracle

### Market Discovery
- `discover_all_markets` - Find all PNP markets
- `list_markets` - List your markets
- `get_market_info` - Market details
- `get_v2_market_info` - V2 (AMM) details
- `get_p2p_market_info` - P2P details
- `get_market_metadata` - Market metadata

### Trading
- `buy_tokens` - Buy YES/NO tokens
- `sell_tokens` - Sell tokens
- `buy_v3_tokens` - Buy V3 tokens
- `get_market_prices` - Current prices
- `get_balances` - Your balances

### Settlement (PNP Oracle)
- `get_settlement_criteria` - LLM-generated criteria
- `get_settlement_data` - Resolution result
- `wait_for_settlement` - Wait for criteria
- `settle_market` - Settle with outcome

### Redemption
- `redeem_position` - Redeem winnings
- `redeem_v3_position` - Redeem V3
- `redeem_p2p_position` - Redeem P2P
- `claim_refund` - Claim refund
- `claim_p2p_refund` - Claim P2P refund

## How It Works

1. **Market Creation**: Create prediction markets with YES/NO outcomes on Solana via PNP Exchange protocol

2. **PNP Oracle**: Markets use PNP's built-in LLM oracle for settlement criteria and resolution

3. **Trading**: Buy/sell outcome tokens using USDC through bonding curves (AMM) or direct P2P

4. **Settlement**: Oracle evaluates market conditions and provides resolution

5. **Redemption**: Winners redeem tokens for USDC

## Testing

```bash
npm test
```

## Links

- [npm Package](https://www.npmjs.com/package/pnpfucius)
- [PNP Exchange](https://pnp.exchange)
- [PNP Documentation](https://docs.pnp.exchange)
- [Helius](https://helius.dev)

## License

MIT

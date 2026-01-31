# Known Entities

The scanner includes a database of 78+ known Solana addresses for detecting privacy-relevant interactions.

## Database Summary

| Type | Count | Privacy Risk |
|------|-------|--------------|
| Exchanges | 9 | HIGH - KYC linkage |
| Bridges | 8 | MEDIUM - Cross-chain correlation |
| Protocols | 29 | LOW - Behavioral fingerprinting |
| MEV | 10 | LOW - Bot detection |
| Tokens | 8 | Informational |
| Programs | 14 | Informational |

## Exchanges (HIGH risk)

Direct CEX interactions link on-chain addresses to real identities via KYC.

- Binance (2 wallets)
- Coinbase (2 wallets)
- Bybit (2 wallets)
- OKX (2 wallets)
- FTX (defunct)

## Bridges (MEDIUM risk)

Bridge usage enables cross-chain correlation.

- Wormhole (Token, NFT, Core)
- deBridge (Source, Destination, Router)
- Allbridge Classic
- Mayan Finance

## DeFi Protocols

Usage patterns can create behavioral fingerprints.

- **DEX**: Jupiter v4/v6, Raydium (AMM, Stable, CLMM, CPMM), Orca (Whirlpools, Swap), Meteora (DLMM, AMM), Phoenix
- **Lending**: Kamino, MarginFi, Solend
- **Staking**: Marinade, Jito, Blaze, Sanctum
- **NFT**: Magic Eden v2/v3, Tensor (Swap, AMM, cNFT)
- **Launchpads**: Pump.fun, PumpSwap

## MEV Infrastructure

Indicates automated trading or MEV extraction.

- Jito Tip Payment + 8 tip accounts
- BloXroute Memo

## Core Programs

Standard Solana infrastructure (informational only).

- System, Token, Token 2022, ATA
- Stake, Vote, Memo v1/v2
- Metaplex (Metadata, Auction House, Bubblegum)
- Compute Budget, Address Lookup Table

## Why Track These

| Entity Type | Privacy Impact |
|-------------|----------------|
| **CEX** | Links wallet to verified identity |
| **Bridges** | Enables cross-chain tracking |
| **Protocols** | Creates usage fingerprint |
| **MEV** | Indicates bot/automated trading |

## Contributing

Add addresses via PR to `known-addresses.json` at repository root. See [Contributing Addresses](../contributing/addresses).

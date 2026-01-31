# Privacy Statement

## Core Principles

RentReclaim is built on three privacy guarantees:

1. **No Keys Ever** - Your private keys never leave your device
2. **No Telemetry** - Zero analytics, tracking, or data collection
3. **Local-First** - All wallet scanning and transaction building happens in your browser

## How It Works

- Wallet connection uses standard Solana Wallet Adapter (read-only public key only)
- Token account scanning via public RPC (same as any block explorer)
- Transactions are built locally in your browser
- You sign transactions in YOUR wallet popup
- We never see, store, or transmit your private keys

## Origin Story

This tool was born from pain. The creator lost funds to scammers posing as "recovery helpers" who asked for private keys. RentReclaim ensures no one ever needs to share keys to reclaim their SOL.

## What We DON'T Do

- ❌ Request seed phrases or private keys
- ❌ Store wallet addresses on any server
- ❌ Track user behavior or analytics
- ❌ Sell or share any data
- ❌ Use cookies or fingerprinting

## What We DO

- ✅ Build transactions 100% client-side
- ✅ Let you review every transaction before signing
- ✅ Show exactly which accounts will be closed
- ✅ Return YOUR SOL directly to YOUR wallet

## Security Model
```
[Your Wallet] <--read public key--> [RentReclaim UI in Browser]
                                           |
                                    [Build TX locally]
                                           |
                                    [You sign in wallet popup]
                                           |
                                    [TX sent to Solana RPC]
```

At no point do private keys touch our code.

# AuroraZK

**Private Trading on Solana**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://aurorazkhost.vercel.app)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-purple)](https://explorer.solana.com/?cluster=devnet)

---

## What is AuroraZK?

AuroraZK is a **dark pool limit order DEX** on Solana where every layer of your trading activity is private—from deposit to execution to withdrawal.

**Order Privacy (Noir ZK):**
- Orders are submitted as cryptographic commitments using Noir zero-knowledge circuits
- Price, size, and intent remain hidden until execution
- Range proofs validate orders without revealing parameters

**Fund Privacy (Light Protocol):**
- Deposits are compressed into shielded accounts—amounts hidden on-chain
- Withdrawals can go to any wallet with no traceable link to your deposit
- Optional custodial relay mode ensures your wallet never signs shielded transactions

---

## Why It Matters

Public order books leak information. Market makers front-run your trades. Wallet trackers follow your every move. Even "private" DEXs expose your wallet address the moment you interact with them.

AuroraZK breaks the chain:
- **Orders** → Noir ZK commitments (hidden until matched)
- **Funds** → Light Protocol compression (amounts invisible)
- **Withdrawals** → Unlinkable to deposit address

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         AuroraZK                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   User                                                         │
│    │                                                           │
│    ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│   │  Frontend   │────▶│   Matcher   │────▶│   Solana    │     │
│   │  (Next.js)  │◀────│  (Node.js)  │◀────│  Program    │     │
│   └─────────────┘     └─────────────┘     └─────────────┘     │
│          │                   │                   │             │
│          ▼                   ▼                   ▼             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│   │    Noir     │     │   Helius    │     │    Light    │     │
│   │  ZK Proofs  │     │     RPC     │     │  Protocol   │     │
│   └─────────────┘     └─────────────┘     └─────────────┘     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. User deposits → Light Protocol compresses funds (amount hidden)
2. User places order → Noir proof validates range without revealing price/size
3. Matcher finds counterparty → Executes on-chain settlement
4. User withdraws → Funds sent to any address (no link to deposit)

---

## Technology Stack

### Noir (ZK Circuits)

Noir generates zero-knowledge proofs that validate orders without revealing details.

```noir
// Prove price is valid without showing it
fn main(price: Field, min: pub Field, max: pub Field) -> pub Field {
    assert(price as u64 >= min as u64);
    assert(price as u64 <= max as u64);
    pedersen_hash([price])
}
```

**Role:** Order commitments, range proofs, privacy guarantees.

### Light Protocol (ZK Compression)

Light Protocol compresses account data into Merkle trees, hiding balances on-chain.

**Role:** Shielded deposits, compressed accounts, unlinkable withdrawals.

### Helius (RPC Infrastructure)

Helius provides the RPC endpoints that support Light Protocol's compression operations.

**Role:** Reliable devnet RPC, compression API support.

---

## Quick Start

### Use the Live Demo

1. Go to [aurorazkhost.vercel.app](https://aurorazkhost.vercel.app)
2. Connect wallet (Phantom, Solflare)
3. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com)
4. Trade privately

### Run Locally

```bash
# Clone
git clone https://github.com/PotluckProtocol/AuroraZK.git
cd AuroraZK

# Install
npm install

# Configure
cp matcher/.env.example matcher/.env
cp app/.env.example app/.env.local
# Add your Helius API key to app/.env.local

# Start matcher
cd matcher && npm start

# Start frontend (new terminal)
cd app && npm run dev
```

---

## Project Structure

```
AuroraZK/
├── circuits/           # Noir ZK circuits
│   ├── commitment_helper/
│   └── range_proof/
├── app/                # Next.js frontend
├── matcher/            # Order matching service
└── programs/           # Solana Anchor program
```

---

## Roadmap

### Completed
- [x] Dark pool with commit-reveal order flow
- [x] Noir ZK circuits for range proofs
- [x] Light Protocol shielded deposits/withdrawals
- [x] Custodial relayer for true unlinkability
- [x] Real-time matching with on-chain settlement

### In Progress
- [ ] On-chain Noir proof verification via Sunspot
- [ ] Multi-matcher decentralization

### Future Vision

**Broader Liquidity Access**
- Market orders that tap into external DEX liquidity (Jupiter, Raydium)
- Aggregated execution across multiple venues while maintaining privacy

**Advanced Order Types**
- Stop-loss and take-profit with hidden trigger prices
- Time-weighted average price (TWAP) execution
- Iceberg orders with hidden reserve quantities

**Decentralized Matcher Network**
- Multiple independent matchers for redundancy
- Rotating matcher selection for enhanced anonymity
- MPC-based matching where no single party sees order details

**Cross-Chain Privacy**
- Bridge integration for privacy coins (Monero, Zcash)
- Atomic swaps between shielded Solana accounts and privacy chains
- Unified dark pool spanning multiple ecosystems

---

## Hackathon Tracks

| Track | Integration |
|-------|-------------|
| **Noir / Aztec** | Range proofs, commitment circuits |
| **Light Protocol** | ZK compression, shielded accounts |
| **Helius** | RPC infrastructure for compression |

---

## License

MIT

---

<p align="center">
  <strong>Trade privately. Trade freely.</strong>
</p>

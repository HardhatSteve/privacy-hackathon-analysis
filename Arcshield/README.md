# 🛡️ ArcShield Finance

**Private DeFi on Solana** - A comprehensive DeFi DApp featuring private transactions, swaps, lending, staking, and payments using Arcium's MPC technology.

## Overview

ArcShield Finance is a hackathon project demonstrating private DeFi operations on Solana. It leverages Arcium's Multiparty Computation (MPC) Execution Environments (MXEs) to enable confidential transactions where amounts, recipients, and other sensitive data remain encrypted throughout the computation lifecycle.

## Features

- 🔒 **Private Token Transfers** - Send tokens with encrypted amounts and recipients
- 🔄 **Private Token Swaps** - Swap tokens privately with encrypted amounts and slippage protection
- 💰 **Private Lending** - Lend or borrow tokens with encrypted amounts and interest rates
- 🎯 **Private Staking** - Stake tokens privately with encrypted amounts and rewards
- 💳 **Private Payments** - Send payments with encrypted amounts, recipients, and memos

## Architecture

```
┌─────────────────┐
│  React Frontend │
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Arcium Client   │
│ (@arcium-hq/    │
│  client)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Solana Program  │
│  (Anchor)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Arcium MXE      │
│ (Encrypted      │
│  Instructions)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MPC Cluster     │
│ (Computation)   │
└─────────────────┘
```

## Project Structure

```
arcium/
├── programs/
│   └── arcshield/          # Solana program (Anchor)
│       └── src/
│           └── lib.rs
├── encrypted-ixs/          # Arcium encrypted instructions
│   ├── private_transfer.rs
│   ├── private_swap.rs
│   ├── private_lending.rs
│   ├── private_staking.rs
│   └── private_payment.rs
├── tests/                  # Integration tests
│   └── arcshield.ts
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
├── Arcium.toml            # Arcium configuration
└── Anchor.toml            # Anchor configuration
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Rust and Cargo
- Solana CLI
- Arcium CLI (`arcium`)
- Anchor framework

## Installation

### 1. Install Dependencies

```bash
# Install Rust dependencies
cd programs/arcshield
cargo build

# Install frontend dependencies
cd ../../frontend
npm install
```

### 2. Install Arcium CLI

Follow the installation instructions from [Arcium Documentation](https://docs.arcium.com/developers/installation).

### 3. Configure Solana

```bash
solana config set --url devnet
```

## Development

### Build the Program

```bash
# Build the Solana program
anchor build

# Build encrypted instructions
arcium build
```

### Run Tests

```bash
# Run integration tests
anchor test

# Or run Arcium tests
arcium test
```

### Start Frontend

```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`.

## Deployment

### Deploy to Devnet

1. **Deploy the Solana Program:**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

2. **Initialize Computation Definitions:**
   ```bash
   # Run the init_computation_defs instruction
   anchor run init-computation-defs
   ```

3. **Update Frontend Configuration:**
   - Update the program ID in `frontend/src/components/*.tsx`
   - Update the RPC endpoint if needed

4. **Build and Deploy Frontend:**
   ```bash
   cd frontend
   npm run build
   # Deploy to your hosting service (Vercel, Netlify, etc.)
   ```

## Usage

1. **Connect Wallet:**
   - Click "Select Wallet" and choose Phantom or Solflare
   - Ensure you're on Solana Devnet

2. **Wait for Arcium Initialization:**
   - The app will automatically initialize the Arcium client
   - Wait for the "✓ Arcium Ready" status

3. **Use Private Features:**
   - Navigate to any feature card (Transfer, Swap, Lending, etc.)
   - Fill in the required fields
   - Click the action button
   - Wait for the computation to complete

4. **View Transaction History:**
   - Check the Transaction Tracker at the bottom
   - Click "View →" to see transactions on Solscan

## How It Works

### Encryption Flow

1. **Client Side:**
   - User inputs data (amount, recipient, etc.)
   - Frontend encrypts data using Arcium client and Rescue cipher
   - Encrypted data is sent to Solana program

2. **On-Chain:**
   - Solana program queues the encrypted computation
   - Transaction is submitted to the blockchain

3. **MPC Execution:**
   - Arcium MPC cluster receives the encrypted computation
   - Computation executes on encrypted data
   - Results are encrypted and sent back

4. **Callback:**
   - Solana program receives encrypted results
   - Callback handler processes the results
   - Client decrypts and displays results

## Security Considerations

- All sensitive data (amounts, recipients, etc.) is encrypted using Arcium's MPC
- Encryption keys are managed securely using x25519 key exchange
- Data remains encrypted throughout the computation lifecycle
- Only the client and MXE can decrypt the shared secret data

## Limitations

- This is a demo/hackathon project - not production-ready
- Some features are simplified for demonstration purposes
- Real token transfers require proper token account setup
- Callback handling needs proper implementation for production use

## Future Improvements

- Implement proper token account management
- Add support for multiple token types
- Implement real AMM formulas for swaps
- Add time-based interest calculations for lending
- Implement proper staking reward calculations
- Add transaction history persistence
- Improve error handling and user feedback
- Add support for Confidential SPL (C-SPL) tokens

## Resources

- [Arcium Documentation](https://docs.arcium.com)
- [Arcium TypeScript SDK](https://ts.arcium.com)
- [Solana Documentation](https://docs.solana.com)
- [Anchor Framework](https://www.anchor-lang.com)

## License

MIT

## Hackathon Submission

This project is submitted for the Arcium Hackathon bounty program.

**Project Name:** ArcShield Finance  
**Team:** [Your Team Name]  
**Demo:** [Link to deployed demo]  
**Video:** [Link to demo video]

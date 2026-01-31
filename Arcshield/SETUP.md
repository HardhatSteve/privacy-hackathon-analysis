# Setup Guide

## Quick Start

### 1. Prerequisites Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Arcium CLI (follow instructions from Arcium docs)
# https://docs.arcium.com/developers/installation
```

### 2. Project Setup

```bash
# Clone or navigate to the project
cd Arcium

# Install Rust dependencies
cd programs/arcshield
cargo build
cd ../..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configuration

#### Update Program ID

After deploying your program, update the program ID in:
- `programs/arcshield/src/lib.rs` (declare_id!)
- `Anchor.toml`
- `frontend/src/utils/constants.ts`
- All component files that use PROGRAM_ID

#### Configure Solana

```bash
# Set to devnet
solana config set --url devnet

# Create a new keypair if needed
solana-keygen new

# Get your public key
solana address

# Airdrop SOL for testing
solana airdrop 2
```

### 4. Build

```bash
# Build Solana program
anchor build

# Build encrypted instructions (if Arcium CLI is installed)
arcium build
```

### 5. Test

```bash
# Run Anchor tests
anchor test

# Or run Arcium tests
arcium test
```

### 6. Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the program ID from deployment output
# Update it in all configuration files
```

### 7. Run Frontend

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## Troubleshooting

### Common Issues

1. **Arcium Client Not Initializing**
   - Ensure you have the correct MXE program ID
   - Check that the Arcium cluster is accessible
   - Verify wallet is connected

2. **Build Errors**
   - Run `anchor clean` and rebuild
   - Ensure all dependencies are installed
   - Check Rust version: `rustc --version` (should be 1.70+)

3. **Transaction Failures**
   - Ensure you have enough SOL for fees
   - Check that you're on the correct network (devnet)
   - Verify program is deployed and program ID is correct

4. **Frontend Errors**
   - Clear browser cache
   - Delete `node_modules` and reinstall
   - Check browser console for detailed errors

## Next Steps

1. Deploy your program to devnet
2. Initialize computation definitions
3. Test each feature
4. Customize UI/UX
5. Add additional features
6. Prepare for hackathon submission

## Resources

- [Arcium Docs](https://docs.arcium.com)
- [Solana Docs](https://docs.solana.com)
- [Anchor Docs](https://www.anchor-lang.com)

#  Manual Installation Guide

This guide provides step-by-step instructions for non-Dockerized installation of SolVoid.

##  System Requirements
- OS: Linux (Ubuntu 20.04+ recommended) or macOS.
- CPU: 4+ cores recommended for ZK proof generation.
- RAM: 8GB+ (16GB recommended for building circuits).

---

##  Step-by-Step Setup

### 1. Rust & Solana
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.0
avm use 0.30.0
```

### 2. Node.js & Tooling
```bash
# Install Node.js (v18+)
nvm install 18
nvm use 18

# Install Circom & SnarkJS
npm install -g circom snarkjs
```

### 3. SolVoid Repository
```bash
git clone https://github.com/brainless3178/SolVoid.git
cd SolVoid
npm install
```

### 4. Compiling ZK Artifacts
This step is computationally intensive and requires about 10-15 minutes on a standard laptop.
```bash
# Ensure you have the PTAU file
# For testing (Power of Tau 12):
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O pot12_final.ptau

# Run the build script
./scripts/build-zk.sh
```

---

##  Verification
Run a local test to ensure everything is linked correctly:
```bash
anchor test
```
If you see `1 passing`, your manual installation is successful!


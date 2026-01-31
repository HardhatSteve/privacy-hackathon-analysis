#  Getting Started with SolVoid

This guide will help you set up your development environment and perform your first private transaction on Solana using SolVoid.

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v18.0.0 or higher ([Download](https://nodejs.org/))
- **Solana Tool Suite:** v1.18.0 or higher ([Install](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor Framework:** v0.30.0 ([Install](https://www.anchor-lang.com/docs/installation))
- **Rust:** v1.75.0 or higher ([Install](https://www.rust-lang.org/tools/install))
- **Git:** For cloning the repository.

---

##  Installation

### 1. Clone the Repository
```bash
git clone https://github.com/brainless3178/SolVoid.git
cd SolVoid
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install SDK dependencies
cd sdk && npm install && cd ..

# Install Dashboard dependencies
cd dashboard && npm install && cd ..
```

### 3. Build the ZK Circuits
SolVoid requires compiled ZK circuits and proving keys. This process can take several minutes depending on your hardware.
```bash
./scripts/build-zk.sh
```
*Note: This script requires `circom` and `snarkjs` to be installed globally or via npm.*

---

##  Environment Setup

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PATH=~/.config/solana/id.json
RELAYER_URL=http://localhost:3001
```

---

##  Network Configuration

SolVoid supports Localnet, Devnet, and Mainnet.

### Local Development
To run a local validator with the SolVoid program:
```bash
anchor localnet
```

### Devnet Testing
Ensure your CLI is set to Devnet and you have some SOL:
```bash
solana config set --url devnet
solana airdrop 2
```

---

##  First Transaction Walkthrough

Follow these steps to complete a full shield-and-withdraw cycle.

### Step 0: Analyze your privacy
Before shielding, check your current privacy score to see how much metadata you're leaking.
```bash
./bin/solvoid ghost <YOUR_WALLET_PUBKEY>
```
This will display your **Privacy Ghost Score** and a list of identified privacy leaks.

### Step 1: Shield Assets (Deposit)
This generates a private commitment and locks your SOL in the SolVoid vault.
```bash
./bin/solvoid shield 0.5
```
**Output:**
```
 Shielded 0.5 SOL
Commitment: 0x4f...a2
Nullifier: 0x12...9b (SAVE THIS! You need it to withdraw)
Secret: 0x8a...cc (SAVE THIS! You need it to withdraw)
```

### Step 2: Wait for Confirmations
Wait for the transaction to be finalized. You can check the status on the SolVoid Dashboard.

### Step 3: Withdraw (Anonymously)
Withdraw your funds to a fresh recipient address.
```bash
./bin/solvoid withdraw 0.5 <RECIPIENT_PUBKEY> --nullifier <YOUR_NULLIFIER> --secret <YOUR_SECRET>
```

---

##  Troubleshooting & Common Issues

- **"Account not found":** Ensure you have initialized the program state using `anchor run init`.
- **"Invalid Proof":** Usually caused by a mismatch between the commitment stored on-chain and the one generated during withdrawal. Double-check your secret and nullifier.
- **"Insufficient Funds":** Ensure the vault has enough balance and you have enough SOL to pay for transaction fees (unless using a relayer).

For more detailed issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

# RentReclaim Privacy Suite

🏆 **Solana Privacy Hackathon Submission** - Entering ALL 3 Tracks!

## Live Demo
- **Main App**: https://www.rentreclaim.xyz
- **Private Send**: https://www.rentreclaim.xyz/send
- **Decrypt Tool**: https://www.rentreclaim.xyz/decrypt
- **Stealth Launch**: https://www.rentreclaim.xyz/launch

## Tracks & Features

### 🔒 Track 1: Private Payments ($15K)
**Private Send** - Privacy-enhanced transfers for SOL and SPL tokens

**Privacy Features:**
- 🔀 **Split Transfers** - Payment divided into randomized smaller amounts
- ⏱️ **Time Jitter** - Randomized intervals break timing patterns  
- 🎭 **Decoy Reads** - Random RPC queries mask your activity
- 🔐 **Encrypted Memos** - AES-GCM encrypted notes (optional)
- 🪙 **SPL Token Support** - USDC, USDT, BONK, JUP, or any mint

**How it works:**
1. Connect wallet (Phantom/Solflare)
2. Select SOL or SPL token
3. Enter destination and amount
4. Set splits (1-25) and time window
5. Enable privacy mode
6. Send privately

---

### 🪄 Track 2: Private Launchpads ($15K)
**Stealth Token Creator** - Launch tokens without revealing your wallet

**Privacy Features:**
- 🔑 **Derived Burner Wallet** - Token created by ephemeral wallet, not your main
- 🎲 **Random or Deterministic** - Choose recoverable (signature-derived) or one-time
- ⏱️ **Time Jitter** - Random delays between transactions
- 🎭 **Decoy Reads** - RPC noise masks real operations
- 🔐 **Encrypted Receipt** - Optional encrypted launch metadata
- 🧯 **Authority Options** - Burn, transfer, or keep mint authority

**How it works:**
1. Connect wallet
2. Configure token (name, symbol, supply, decimals)
3. Choose stealth wallet type (Random/Deterministic)
4. Select authority handling (Burn/Transfer/Keep)
5. Enable privacy mode
6. Launch! Your main wallet never appears as creator

**Supports:**
- Token Program (classic SPL)
- Token-2022 Program

---

### 🧹 Track 3: Open Track ($15K)
**RentReclaim** - Recover SOL from empty token accounts with privacy mode

**Features:**
- 🔍 Free wallet scan
- ⚡ One-click batch recovery
- 🔒 Non-custodial (no seed phrase needed)
- 💰 20% fee only on successful recovery
- 🛡️ **Privacy Mode** - Decoy reads + jitter during recovery

---

## Privacy Techniques Used

| Technique | Description | Used In |
|-----------|-------------|---------|
| **Time Jitter** | Random delays (0.5-5s) between transactions | All features |
| **Decoy Reads** | Random `getAccountInfo` calls to known addresses | All features |
| **Split Transfers** | Divide payments into randomized chunks | Private Send |
| **Derived Wallets** | Signature-derived or random burner wallets | Stealth Launch |
| **AES-GCM Encryption** | WebCrypto encrypted memos/receipts | Send, Launch |

## Tech Stack
- **Helius RPC** - Fast, reliable Solana infrastructure
- React + Vite
- Solana Web3.js
- SPL Token Library
- Wallet Adapter (Phantom, Solflare)
- WebCrypto API (AES-GCM encryption)
- Vercel hosting

## Local Development
```bash
# Clone
git clone https://github.com/ayubeay/rentreclaim-privacy.git
cd rentreclaim-privacy

# Install
npm install

# Configure (optional - defaults to public RPC)
echo "VITE_RPC_URL=your_rpc_url" > .env

# Run
npm run dev

# Build
npm run build
```

## Deployed Contracts
All transactions use standard Solana programs:
- **Token Program**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Token-2022**: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
- **Associated Token**: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`

## Privacy Disclaimer
⚠️ **Obfuscation layer, not full anonymity** - Amounts and addresses remain visible on-chain. This adds privacy through timing obfuscation, transaction splitting, and wallet indirection. This is NOT a mixer or tumbler.

## Demo Video
[Link to 3-minute demo video] <!-- Add your video link -->

## Screenshots
See `/screenshots` folder for UI captures of each feature.

## License
MIT

---

Built with ❤️ for the Solana Privacy Hackathon 2026

## 🔍 Security Verification

### How to verify we don't exfiltrate data

We believe privacy tools should be verifiable. Here's how to confirm RentReclaim doesn't leak your data:

**1. Network Tab Inspection**
```
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Network tab
3. Use any feature (scan, send, launch)
4. Observe: Only Solana RPC calls — no external APIs receive your wallet data
```

**2. What you'll see:**
- `POST` to your configured RPC (Helius/mainnet/devnet)
- No calls to external analytics, tracking, or data collection endpoints
- All encryption happens client-side via WebCrypto API

**3. Source Code Audit**
- All code is open source: [GitHub](https://github.com/ayubeay/rentreclaim-privacy)
- No backend server — 100% client-side application
- No wallet private keys ever leave your browser
- Transactions signed locally via Phantom/Solflare

**4. What we DON'T do:**
- ❌ Store wallet addresses
- ❌ Log transactions
- ❌ Use analytics/tracking pixels
- ❌ Send data to any server (except Solana RPC)
- ❌ Access or request seed phrases


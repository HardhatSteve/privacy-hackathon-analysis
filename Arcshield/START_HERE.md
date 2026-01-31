# 🚀 Quick Start Guide - ArcShield Finance

**Welcome! This guide will help you get your private DeFi app running step by step.**

## 📋 What You Need

Before starting, make sure you have:
1. ✅ **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. ✅ **A Solana Wallet** - Phantom or Solflare browser extension
3. ⚠️ **Rust** (optional - only needed to build the Solana program)

## 🎯 Option 1: Run Frontend Only (Easiest - Start Here!)

You can run the frontend right now without installing Rust. The app will work, but some features need the backend program deployed.

### Step 1: Start the Development Server

1. Open **PowerShell** or **Command Prompt**
2. Navigate to the project folder:
   ```powershell
   cd C:\Users\emper\Arcium\frontend
   ```
3. Start the server:
   ```powershell
   npm start
   ```

4. Wait for the browser to open automatically (or go to `http://localhost:3000`)

### Step 2: Connect Your Wallet

1. Click **"Select Wallet"** button
2. Choose **Phantom** or **Solflare**
3. Make sure you're on **Devnet** (not Mainnet)
4. Approve the connection

### Step 3: Use the App!

You'll see 5 feature cards:
- 🔒 **Private Transfer** - Send tokens privately
- 🔄 **Private Swap** - Swap tokens with hidden amounts
- 💰 **Private Lending** - Lend/borrow privately
- 🎯 **Private Staking** - Stake tokens privately
- 💳 **Private Payment** - Send private payments

**Note:** Some features need the Solana program deployed. The UI will work, but transactions may not complete until the backend is set up.

---

## 🔧 Option 2: Full Setup (For Complete Functionality)

To run everything including the Solana program, you'll need to install Rust and Anchor.

### Step 1: Install Rust

1. Download Rust installer: https://rustup.rs/
2. Run the installer (rustup-init.exe)
3. Follow the prompts (press Enter for defaults)
4. **Restart your terminal/PowerShell** after installation

### Step 2: Install Solana CLI

1. Open PowerShell as Administrator
2. Run this command:
   ```powershell
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```
3. Or download from: https://docs.solana.com/cli/install-solana-cli-tools

### Step 3: Install Anchor Framework

1. Open PowerShell
2. Run:
   ```powershell
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

### Step 4: Configure Solana

1. Set to devnet:
   ```powershell
   solana config set --url devnet
   ```

2. Create a wallet (if you don't have one):
   ```powershell
   solana-keygen new
   ```

3. Get free SOL for testing:
   ```powershell
   solana airdrop 2
   ```

### Step 5: Build and Deploy

1. Navigate to project root:
   ```powershell
   cd C:\Users\emper\Arcium
   ```

2. Build the program:
   ```powershell
   anchor build
   ```

3. Deploy to devnet:
   ```powershell
   anchor deploy --provider.cluster devnet
   ```

4. **Important:** Copy the Program ID from the deploy output and update it in:
   - `programs/arcshield/src/lib.rs` (line 4)
   - `frontend/src/utils/constants.ts` (PROGRAM_ID)
   - `Anchor.toml` (programs.devnet.arcshield)

### Step 6: Start Frontend

1. Navigate to frontend:
   ```powershell
   cd frontend
   ```

2. Start the server:
   ```powershell
   npm start
   ```

---

## 🆘 Troubleshooting

### "npm start" doesn't work
- Make sure you're in the `frontend` folder
- Try: `npm install` first

### Wallet won't connect
- Make sure Phantom/Solflare is installed
- Check you're on Devnet in wallet settings
- Refresh the page

### "Rust not found" error
- You need Rust for building the Solana program
- Follow Option 2 Step 1 above
- Or just use Option 1 (frontend only)

### Port 3000 already in use
- Close other applications using port 3000
- Or set a different port: `set PORT=3001 && npm start`

### Build errors
- Make sure all dependencies are installed: `npm install`
- Try deleting `node_modules` and reinstalling

---

## 📞 Need Help?

- Check the `README.md` for detailed documentation
- Check `SETUP.md` for advanced setup instructions
- Visit Arcium docs: https://docs.arcium.com

---

## ✅ Quick Checklist

- [ ] Node.js installed
- [ ] Frontend dependencies installed (`npm install` in frontend folder)
- [ ] Wallet extension installed (Phantom/Solflare)
- [ ] Dev server running (`npm start`)
- [ ] Wallet connected
- [ ] (Optional) Rust installed for full setup
- [ ] (Optional) Solana program deployed

**You're ready to go! 🎉**

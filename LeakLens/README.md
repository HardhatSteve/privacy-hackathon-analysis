# LeakLens - See What Your Wallet Leaks

A blockchain surveillance exposure tool for Solana. Built by [MatthewSullivn](https://github.com/MatthewSullivn), [RITTUVIK](https://github.com/RITTUVIK), and [GeorgeBacky](https://github.com/GeorgeBacky) for the **Solana Privacy Hackathon**. Submitting to the [encrypt.trade](https://encrypt.trade) bounty **Track 1: Educate users about mass financial surveillance** ($500).

<div align="center">
  <a href="https://www.youtube.com/watch?v=PLACEHOLDER">
    <p>LeakLens - Watch Demo</p>
  </a>
  <a href="https://www.youtube.com/watch?v=PLACEHOLDER">
    <img src="https://img.youtube.com/vi/PLACEHOLDER/hqdefault.jpg" alt="LeakLens Demo" style="max-width:300px;">
  </a>
</div>

## Project Description

LeakLens helps users understand **how surveilled their crypto wallet already is** using real on-chain behavior. It makes mass surveillance visible and intuitive: why wallets are not anonymous by default, how on-chain activity is tracked, clustered, and labeled, and how a single public transaction can permanently reduce privacy. The tool explains why selective privacy tools like [encrypt.trade](https://encrypt.trade) exist and how they reduce exposure without breaking usability.

LeakLens is a **"how exposed am I?"** tool. It shows surveillance level, wallet linkages (e.g. funding sources, cashout targets, ego network), memecoin trading behavior, net worth, income sources, and execution patterns (e.g. reaction speed) that can reveal improper use of privacy protocols (e.g. without proper time delays). Classification is the first step in the surveillance pipeline; once a wallet is classified, it can be tracked, labeled, and profiled.

## Technical Overview

- **Solana + Helius**: Transaction data via Helius RPC and Enhanced Transactions API. On Vercel we use Enhanced for the main 100-tx list to avoid rate limits; execution profiles use a 50-tx RPC subset.
- **Python backend**: FastAPI (`backend_api.py`) plus analysis logic in `leaklens_solana.py`. Handles wallet fetch, reaction-speed analysis, opsec failures, ego network, mempool forensics, swap detection, and PnL.
- **Next.js frontend**: React app in `frontend/` with wallet analysis UI, exposure breakdown, and linked-wallet graph. Proxies analyze requests to the Python backend or to Vercel serverless.
- **Deployment**: Local runs FastAPI + Next.js dev; Vercel runs Next.js with Python serverless for `/api/analyze-wallet`.

## Features

1. **Wallet analysis**: Enter any Solana address to run a full surveillance-exposure analysis.
2. **Surveillance score**: Risk level and exposure score from timing, counterparties, execution style, and swap patterns.
3. **Temporal fingerprint**: Inferred timezone and sleep window from transaction timing.
4. **Bot detection**: Reaction-speed analysis between token receives and subsequent actions.
5. **OpSec failures**: Funding sources, withdrawal targets, and memo usage that weaken anonymity.
6. **Ego network**: Linked wallets and connection reasons from transfer patterns.
7. **Mempool forensics**: Execution profiles (RETAIL, PRO_TRADER, MEV-style) from compute units and priority fees.
8. **Financial context**: Trading PnL and income sources from detected swaps and transfers.

## How to Get Started

1. Clone the repository:
   ```bash
   git clone https://github.com/MatthewSullivn/LeakLens.git
   cd LeakLens
   ```

2. Set up the Python backend:
   ```bash
   pip install -r requirements.txt
   export HELIUS_API_KEY="your_helius_api_key"
   ```

3. Start the backend server:
   ```bash
   python run_server.py
   ```
   API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

4. Set up and run the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   App runs at `http://localhost:3000`.

5. Optional: use `START_DEV.bat` (Windows) to run both backend and frontend.

6. Enter a Solana wallet address on the landing page to run an analysis.

## Acknowledgments

- **Solana Privacy Hackathon** for the event.
- **[encrypt.trade](https://encrypt.trade)** (sponsor) for Track 1 bounty and privacy-education focus.
- **Helius** for Solana RPC and Enhanced Transactions API.
- **Jupiter** for price and portfolio data.

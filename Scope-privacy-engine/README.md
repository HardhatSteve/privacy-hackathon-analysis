# SCOPE - Solana Privacy Intelligence Engine

**SCOPE** (Solana Comprehensive On-chain Privacy Engine) is an institutional-grade dashboard designed to visualize wallet footprints, detect CEX linkages, and assess privacy risks on the Solana blockchain.

🔗 **Live Demo:** [[https://scope-privacy-engine.vercel.app/](https://scope-privacy-engine.vercel.app/)]

## 🏆 Hackathon Tracks & Integrations
This project was built for the Solana Privacy Hackathon 2026.
- **Helius:** Used for deep transaction history indexing and data parsing.
- **QuickNode:** High-performance RPC infrastructure for real-time state verification.
- **Range Protocol (Architecture):** Compliance engine logic for flagging high-risk wallets.
- **Education:** Interactive "Hunter Mode" to teach users about on-chain surveillance.

## ✨ Features
- **Privacy Scoring:** Real-time risk assessment (0-100 score).
- **Identity Graph:** Visualizes connections between wallets and Centralized Exchanges (Binance, Coinbase).
- **Asset Detection:** Scans for identity-revealing assets (NFTs, specific tokens).
- **Compliance Check:** simulates AML/Sanctions screening.

## 🛠️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/xxpopielxx/Scope-privacy-engine.git
   cd Scope-privacy-engine
   ```
2. **Clone the repository:**
   ```bash
   npm install
   ```
3. **Configure Environment: Create a .env file in the root directory:**
   ```
   HELIUS_API_KEY=your_api_key_here
   QUICKNODE_RPC_URL=https://api.mainnet.solana.com
   ```
4. **Run the app:**
   ```bash
   npm run dev
   ```
## 🏗 Tech Stack
Framework: Next.js 14

Language: TypeScript

Styling: TailwindCSS

Blockchain: Solana 

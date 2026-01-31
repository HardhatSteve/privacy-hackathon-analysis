# 🔍 Solana Exposure Scanner

> **Privacy Auditing Tool for Solana Wallets** — Reveal how much the blockchain knows about you. Analyze on-chain privacy exposure, identify KYC linkages, visualize wallet clustering, and learn how surveillance companies deanonymize crypto users.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solanagod2003-gif/solana-exposure-scanner)

![Solana](https://img.shields.io/badge/Solana-Mainnet%20%7C%20Devnet-14F195?style=for-the-badge&logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🎬 Demo

> Scan any Solana wallet to see its privacy exposure score, KYC links, and how easily it can be deanonymized.

---

## ✨ Features

### 🎯 Core Analysis
- **Real-Time Wallet Scanning** — Instant privacy analysis for any Solana address
- **AI-Powered Exposure Score** — 0-100 risk assessment using pattern recognition
- **KYC Link Detection** — Identifies transfers to/from Binance, Coinbase, Kraken, FTX, and more
- **Clustering Analysis** — Interactive force-graph showing wallet relationship networks
- **Financial Exposure** — Net worth calculation and trading activity visibility

### 🎓 Educational Features
- **Deanonymization Simulator** — Interactive walkthrough showing how surveillance companies trace wallets step-by-step
- **Before/After Privacy Demo** — Visual comparison of exposed vs. encrypted transaction data
- **Educational Modal** — Deep-dive into surveillance techniques with real-world consequences

### 📊 Visualizations
- **Timeline View** — Transaction history with surveillance level indicators
- **Clustering Graph** — Force-directed graph of wallet interactions
- **Exposure Gauge** — Animated score display with risk breakdown
- **Score Breakdown** — Detailed metrics across 5 privacy dimensions

### 🚀 Shareable Social Card
- **Downloadable Image** — Generate a beautiful privacy score card for social media
- **QR Code Integration** — Scan to instantly check any wallet
- **One-Click Share** — Perfect for Twitter/X, Discord, and more

### 🔄 Network Support
- **Mainnet** — Real wallet analysis with actual on-chain data
- **Devnet** — Testing environment for development and demos

---

## 🏗️ Architecture

```
solana-exposure-scanner/
├── api/                      # Vercel serverless function
│   └── index.ts              # API handler (scan, health, network)
├── server/                   # Backend logic
│   ├── config/               # Environment configuration
│   ├── constants/            # Known CEX addresses, protocols
│   ├── routes/               # Express API routes
│   └── services/
│       ├── helius.ts         # Helius blockchain data
│       ├── birdeye.ts        # Birdeye PnL analytics
│       └── analyzer.ts       # AI exposure analysis engine
├── components/               # React components
│   ├── Dashboard.tsx         # Main results display
│   ├── Landing.tsx           # Home page with search
│   ├── ClusteringGraph.tsx   # Force-directed wallet graph
│   ├── TimelineView.tsx      # Transaction timeline
│   ├── ShareableCard.tsx     # Social media image generator
│   ├── DeanonymizationSimulator.tsx  # Interactive demo
│   ├── BeforeAfterDemo.tsx   # Privacy comparison
│   ├── EducationModal.tsx    # Surveillance education
│   ├── ExposureGauge.tsx     # Animated score gauge
│   ├── ScoreBreakdown.tsx    # Detailed metrics
│   ├── RiskSection.tsx       # Risk explanations
│   ├── PrivacySolution.tsx   # Encifher CTA
│   └── Header.tsx            # Navigation & network toggle
├── hooks/                    # Custom React hooks
│   └── useWalletScan.ts      # Data fetching logic
├── lib/                      # Utilities
└── types/                    # TypeScript definitions
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Helius API Key](https://helius.dev) (free tier available)
- [Birdeye API Key](https://birdeye.so) (optional, for PnL data)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/solanagod2003-gif/solana-exposure-scanner.git
cd solana-exposure-scanner

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys:
# HELIUS_API_KEY=your_key_here
# BIRDEYE_API_KEY=your_key_here (optional)

# 4. Start development servers
npm run dev:all    # Both frontend (3000) + backend (3001)

# Or separately:
npm run dev        # Frontend only
npm run dev:server # Backend only
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solanagod2003-gif/solana-exposure-scanner)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Set environment variables in Vercel dashboard:
# - HELIUS_API_KEY
# - BIRDEYE_API_KEY (optional)

# Deploy to production
vercel --prod
```

---

## 📊 How Exposure is Calculated

The scanner analyzes wallets across **5 dimensions**:

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| **KYC Links** | 30% | Transfers to/from centralized exchanges with identity requirements |
| **Clustering** | 25% | Wallet interaction patterns that reveal ownership relationships |
| **Activity** | 20% | Transaction frequency, timing patterns, behavioral fingerprints |
| **Financial** | 15% | Net worth, portfolio size, trading volume visibility |
| **Identity** | 10% | SNS domains, NFT metadata, on-chain identity markers |

---

## 🔧 Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for blazing-fast builds
- TailwindCSS via CDN
- Framer Motion & GSAP animations
- React Router for navigation
- TanStack Query for data fetching
- Recharts & React Force Graph for visualizations
- html-to-image for social card generation

**Backend:**
- Express.js serverless functions
- Helius API for blockchain data
- Birdeye API for PnL analytics (optional)
- TypeScript for type safety

**Deployment:**
- Vercel for hosting
- Serverless functions
- Edge network CDN

---

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Scan Wallet
```
GET /api/scan/:address
```

### Network Toggle
```
GET /api/network
POST /api/network { "network": "mainnet" | "devnet" }
```

---

## 🔐 Privacy & Security

- **No Data Storage** — All analysis is real-time, nothing persisted
- **Open Source** — Full transparency, audit the code yourself
- **API Keys Protected** — Environment variables never exposed to client
- **Client-Side Rendering** — Sensitive operations in browser

---

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

```bash
# Fork, then:
git checkout -b feature/YourFeature
git commit -m 'Add YourFeature'
git push origin feature/YourFeature
# Open PR
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## ⚠️ Disclaimer

This tool is for **educational purposes only**. Exposure scores are probabilistic estimates based on public on-chain data. True privacy in Web3 requires proactive measures beyond wallet management.

---

## 🙏 Acknowledgments

- [Helius](https://helius.dev) — Solana blockchain infrastructure
- [Birdeye](https://birdeye.so) — DeFi analytics
- [Encifher](https://app.encifher.io) — Privacy solutions
- [Solana](https://solana.com) — High-performance blockchain

---

**Built with ❤️ for the Solana ecosystem**

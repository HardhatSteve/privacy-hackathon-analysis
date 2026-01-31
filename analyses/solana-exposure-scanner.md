# Solana Exposure Scanner - Analysis

## 1. Project Overview

Solana Exposure Scanner is a privacy auditing tool that analyzes Solana wallets to reveal how much on-chain data exposes users to surveillance. It calculates an "Exposure Score" based on KYC links (CEX connections), clustering patterns, transaction activity, financial exposure, and identity markers (SNS domains, NFTs). The tool serves as both a privacy awareness/education platform and a funnel to privacy solutions like Encifher.

## 2. Track Targeting

**Track:** Privacy Tooling

This is a diagnostic/analysis tool rather than a privacy-preserving payment system. It's positioned to demonstrate the privacy problem on Solana to drive adoption of privacy solutions.

## 3. Tech Stack

- **ZK System:** None (analysis tool, not privacy implementation)
- **Languages:** TypeScript
- **Frameworks:**
  - React 19
  - Vite 6.2
  - Express.js (serverless backend)
- **Key Dependencies:**
  - @tanstack/react-query 5.64.2
  - framer-motion ^12.25.0
  - gsap ^3.14.2
  - recharts 2.15.0
  - react-force-graph-2d ^1.29.0
  - html-to-image ^1.11.13

## 4. Crypto Primitives

**None** - This is an analysis/surveillance detection tool, not a cryptographic system.

The tool analyzes blockchain data to identify privacy leaks:
- CEX address detection (Binance, Coinbase, Kraken, FTX)
- SNS domain correlation via Bonfida API
- NFT metadata analysis for identifying information
- Wallet clustering via interaction patterns

## 5. Solana Integration

**API Integrations:**
- **Helius API:** Transaction history, asset data, DAS queries
- **Birdeye API:** Wallet PnL analytics (optional)
- **Bonfida SNS Proxy:** Domain name resolution

**Backend Architecture:**
```
server/
├── config/env.ts
├── constants/addresses.ts   # Known CEX and protocol addresses
├── routes/scan.ts           # Scan endpoint
└── services/
    ├── helius.ts           # Helius blockchain data
    ├── birdeye.ts          # PnL analytics
    └── analyzer.ts         # Exposure scoring engine
```

**Analysis Dimensions (Weighted):**
| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| KYC Links | 30% | CEX transfers (identity linkage) |
| Clustering | 25% | Wallet relationships |
| Activity | 20% | Transaction fingerprints |
| Financial | 15% | Net worth visibility |
| Identity | 10% | SNS domains, NFT metadata |

## 6. Sponsor Bounty Targeting

- **Helius:** Primary data source via API integration
- **Birdeye:** Optional PnL analytics integration
- **Encifher:** Privacy solution CTA (PrivacySolution component)

The project is essentially a Helius API showcase with educational overlay.

## 7. Alpha/Novel Findings

**Innovative Features:**

1. **Deanonymization Simulator:** Interactive walkthrough showing how surveillance companies trace wallets step-by-step

2. **Clustering Graph:** Force-directed graph visualization of wallet interaction networks using react-force-graph-2d

3. **Shareable Social Cards:** Generate downloadable privacy score images for social media (html-to-image)

4. **SNS Domain Detection:** Fetches .sol domains via Bonfida proxy API for identity correlation

5. **Before/After Demo:** Visual comparison showing exposed vs. encrypted transaction data

**Technical Insights:**
```typescript
// Score calculation with sophisticated weighting
const exposureScore = Math.round(
    scoreBreakdown.kycLinks * 0.30 +      // CEX connections most important
    scoreBreakdown.clustering * 0.25 +     // Wallet relationships
    scoreBreakdown.activity * 0.20 +       // Transaction patterns
    scoreBreakdown.financial * 0.15 +      // Portfolio exposure
    scoreBreakdown.identity * 0.10         // Identity metadata
);
```

## 8. Strengths

1. **Educational Value:** Teaches users about blockchain surveillance
2. **Real Data Analysis:** Uses actual on-chain data via Helius
3. **Visual Appeal:** Force graphs, gauges, animations (GSAP/Framer)
4. **Social Sharing:** Shareable privacy score cards for virality
5. **Clean Architecture:** Separate frontend/backend, serverless-ready
6. **Vercel Deployment:** One-click deploy button
7. **Network Toggle:** Mainnet/Devnet support
8. **Comprehensive Analysis:** 5-dimension privacy scoring

## 9. Weaknesses

1. **No Privacy Solution:** Analyzes problem but doesn't solve it
2. **External Dependencies:** Relies on Helius/Birdeye APIs
3. **CEX Address List:** Hardcoded, may become outdated
4. **No User Privacy:** Scanned addresses are sent to backend
5. **Rate Limiting:** Depends on API quotas
6. **Estimation Quality:** PnL and net worth are rough estimates
7. **No Historical Tracking:** Point-in-time analysis only

## 10. Threat Level

**MODERATE**

This is a complementary tool, not a direct competitor to privacy payment systems. However:

- Strong educational/awareness value
- Could drive users to competitors' privacy solutions
- Well-executed Helius integration could win API bounty
- Social sharing feature could generate significant visibility

The main threat is as a "problem statement" that drives attention to the privacy category, potentially benefiting whoever is referenced as the solution.

## 11. Implementation Completeness

**85% Complete**

- [x] Exposure score calculation - 100%
- [x] CEX detection - 100%
- [x] SNS domain lookup - 100%
- [x] Clustering analysis - 100%
- [x] Activity fingerprinting - 100%
- [x] Financial exposure - 100%
- [x] Identity analysis (NFTs) - 100%
- [x] Force-directed graph - 100%
- [x] Timeline view - 100%
- [x] Shareable cards - 100%
- [x] Deanonymization simulator - 100%
- [x] Before/After demo - 100%
- [x] Vercel deployment - 100%
- [ ] Historical tracking - 0%
- [ ] Batch scanning - 0%
- [ ] API documentation - 0%
- [ ] Rate limiting handling - partial

**What's Working:**
- Complete privacy analysis engine
- All visualizations functional
- Social sharing
- Mainnet/Devnet toggle
- Vercel-ready deployment

# LeakLens - Analysis

## 1. Project Overview
LeakLens is a blockchain surveillance exposure tool for Solana that helps users understand how surveilled their crypto wallet already is. It analyzes on-chain behavior to reveal how wallets are tracked, clustered, and labeled by surveillance entities. The tool demonstrates why wallets are not anonymous by default and educates users about the need for privacy tools like encrypt.trade.

## 2. Track Targeting
**Track: Privacy Tooling (Track 1: Educate users about mass financial surveillance)**

Specifically targeting the encrypt.trade bounty for educating users about surveillance. This is an educational/awareness tool rather than a privacy solution itself - it shows users what data is already leaked about their wallet.

## 3. Tech Stack
- **ZK System:** None (surveillance analysis tool, not privacy implementation)
- **Languages:** Python (backend), TypeScript/React (frontend)
- **Frameworks:**
  - FastAPI for Python backend
  - Next.js 15 + React 19 for frontend
  - Tailwind CSS 4 for styling
- **Key Dependencies:**
  - Helius RPC and Enhanced Transactions API for on-chain data
  - Jupiter for price/portfolio data
  - pandas, matplotlib for analysis
  - Radix UI components

## 4. Crypto Primitives
None directly implemented. This is an analytics/surveillance detection tool that consumes public on-chain data.

Key analysis techniques:
- Temporal fingerprinting (timezone/sleep window detection)
- Reaction speed analysis for bot detection
- Wallet clustering and ego network mapping
- MEV/execution profiling

## 5. Solana Integration
**No on-chain program** - this is purely an off-chain analytics tool.

Uses Helius RPC for:
- Transaction history fetching
- Enhanced transaction parsing
- Wallet balance queries

Integration pattern: Read-only data consumption via Helius API.

## 6. Sponsor Bounty Targeting
- **Primary:** encrypt.trade Track 1: Educate users about mass financial surveillance ($500)
- **Secondary:** Helius (uses Helius RPC extensively)

## 7. Alpha/Novel Findings
**Innovative aspects:**
1. **Comprehensive surveillance scoring** - Quantifies exposure level with detailed breakdown
2. **Temporal fingerprinting** - Infers user timezone and sleep patterns from tx timing
3. **Reaction speed analysis** - Bot detection via timing analysis between receives and actions
4. **OpSec failure detection** - Identifies funding sources, withdrawal targets, memo usage
5. **Execution profile classification** - Distinguishes RETAIL/PRO_TRADER/MEV based on compute units and priority fees

## 8. Strengths
1. **Strong educational value** - Clearly demonstrates privacy risks to users
2. **Complete implementation** - Full backend + frontend working together
3. **Real Helius integration** - Uses actual on-chain data, not mocks
4. **Well-documented codebase** - Good code organization with clear purpose
5. **Practical utility** - Solves a real problem of privacy awareness
6. **Deployable** - Vercel-ready with serverless Python functions

## 9. Weaknesses
1. **No privacy implementation** - Only shows problems, doesn't solve them
2. **Rate limit concerns** - Heavy Helius API usage could hit limits
3. **Narrow bounty target** - Only targeting $500 encrypt.trade Track 1
4. **No wallet integration** - Just paste addresses, no wallet connection
5. **Limited by public data** - Can only analyze what's publicly visible

## 10. Threat Level
**LOW**

This project is not a competitive threat to privacy protocol implementations. It's a niche educational tool targeting a specific small bounty. While well-executed, it doesn't compete in the main tracks.

## 11. Implementation Completeness
**90% Complete**

What's working:
- Full wallet analysis pipeline
- Surveillance scoring system
- Temporal fingerprinting
- Bot detection
- Ego network mapping
- Frontend UI with visualizations

What's missing:
- Demo video link is placeholder
- Some edge case handling
- Production deployment configuration

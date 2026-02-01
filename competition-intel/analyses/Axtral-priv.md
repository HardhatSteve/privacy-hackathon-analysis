# Axtral-priv (Zaeon) - Analysis

## 1. Project Overview
Zaeon is described as "The Liquidity Protocol for Intellectual Property Powered by AI & VERY Network." It's an academic workspace with AI assistants that aims to tokenize research and intellectual property as Real World Assets (RWAs). The project includes an AI agent backend and a Next.js frontend with multi-language support.

**Not a Solana Privacy project** - This is an academic productivity/RWA platform targeting VERY Network (an EVM chain), not Solana.

## 2. Track Targeting
**None applicable** - This project:
- Targets VERY Network, not Solana
- Focuses on IP tokenization, not privacy
- Is about academic productivity, not confidential transactions

## 3. Tech Stack
- **ZK System**: None
- **Languages**: TypeScript, Python
- **Frameworks**:
  - Next.js 14
  - React 18
  - Prisma ORM
  - Express.js (backend)
  - Three.js/React Three Fiber (3D)
- **Key Dependencies**:
  - `@google/generative-ai` - Gemini AI
  - `@google-cloud/vertexai` - Google Cloud AI
  - `ethers`, `viem` - EVM chains (not Solana!)
  - `@aptos-labs/ts-sdk` - Aptos
  - `@wepin/wagmi-connector` - Wallet connector
  - MongoDB/Mongoose - Database
  - `next-auth` - Authentication

## 4. Crypto Primitives
- **No privacy primitives**
- Standard EVM wallet integration via wagmi
- No ZK proofs
- No MPC
- No encryption beyond basic auth

## 5. Solana Integration
**None** - Despite being in a Solana privacy hackathon analysis folder, this project:
- Has no `@solana/web3.js` dependency
- Targets VERY Network (EVM-compatible)
- Uses ethers/viem for blockchain
- Has Aptos SDK, but no Solana SDK

## 6. Sponsor Bounty Targeting
**None** - Wrong hackathon entirely. This is a VERY Network project.

## 7. Alpha/Novel Findings
- **Wrong Chain**: Submitted to Solana hackathon but built for VERY Network
- **AI Agent Backend**: Simple Gemini-powered agent (server.ts is just a single endpoint)
- **RWA Focus**: Interesting concept but not privacy-related
- **Multi-Language**: Documentation in EN/PT/FR/CN/KR

Backend analysis reveals it's just a wrapper around Gemini:
```typescript
const result = await model.generateContent(message);
return res.json({ ok: true, reply: result.response.text() });
```

## 8. Strengths
As a general project (not for this hackathon):
- Interesting RWA/IP tokenization concept
- Multi-language support
- Nice 3D UI with Three.js
- Good documentation

## 9. Weaknesses
For this hackathon:
- **Wrong blockchain** - VERY Network, not Solana
- **No privacy features** - Pure RWA/productivity app
- **No ZK or encryption** - No privacy primitives
- **Minimal AI implementation** - Just a Gemini wrapper
- **Token mention but no implementation** - Talks about "Science Bonds" but no smart contract code visible

## 10. Threat Level
**NONE** - Completely irrelevant to Solana Privacy Hackathon.

This appears to be either:
1. Submitted to the wrong hackathon
2. A multi-hackathon submission strategy
3. A mistake in the analysis folder

## 11. Implementation Completeness
**0% complete for Solana Privacy requirements**

As a VERY Network RWA platform:
- ~50% frontend (Next.js app structure)
- ~10% backend (single AI endpoint)
- 0% smart contracts visible
- 0% tokenization logic implemented

What's actually built:
- Next.js shell with routing
- i18n setup for 5 languages
- Basic AI agent endpoint
- Prisma database schema
- UI components with Tailwind

What's missing:
- Actual token/RWA smart contracts
- IP registration logic
- Royalty distribution
- Any actual Web3 functionality beyond wallet connection

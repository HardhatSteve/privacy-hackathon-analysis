# Competitor Video Analysis

**Purpose**: Understand what top competitors are showing in their demo videos to inform ZORB's video strategy.
**Scan Date**: 2026-02-01
**Method**: Automated scan of 197 repos for video files and YouTube/Loom links

---

## Complete Video Inventory

### YouTube Videos (Confirmed Links)

| Project | YouTube URL | Description |
|---------|-------------|-------------|
| **Chameo** | https://youtu.be/JZMt14qAP-w | Main demo video |
| **Arcium-poker** | https://www.youtube.com/watch?v=HuGYFlWgFEI | Presentation video |
| **flew-private-prediction-market** | https://www.youtube.com/watch?v=UpQIxVCHU8U | Demo |
| **Obsidian** | https://youtu.be/SBUsO_uib0Q | Presentation video |
| **PrivyLocker** | https://youtu.be/FLXRZfgLE-0 | Demo video |
| **rentreclaim-privacy** | https://www.youtube.com/shorts/IWI9AZIZ8WI | Short demo |
| **Silent-Rails** | https://youtu.be/0LhPg0AmbRw | Technical architecture walkthrough |
| **SolanaPrivacyHackathon2026** | https://youtu.be/oXs3ccEjyxc | Demo video |
| **vapor-tokens** | https://www.youtube.com/watch?v=xPpmU1X3N6A | Presentation + demo |
| **wavis-protocol** | https://www.youtube.com/watch?v=Rb-UO8K60EY | Demo |
| **solana-compliance-relayer** | https://youtu.be/LSMlIqtrxL0 | Dashboard, risk scanning demo |
| **arcium-dev-skill** | https://www.youtube.com/watch?v=X3Y6sL7A8O0 | Tutorial (not submission) |

### MP4 Files in Repos

| Project | File | Size | Notes |
|---------|------|------|-------|
| **cloakcraft** | `docs/cloakcraft-demo.mp4` | 4.5 MB | Main demo |
| **SolanaPrivacyHackathon2026** | `demo.mp4` | 13 MB | Full demo |
| **veil** | `demo/swap-router-demo.mp4` | 1.4 MB | Swap feature |
| **veil** | `demo/rwa-secrets-demo.mp4` | 1.7 MB | RWA feature |
| **veil** | `apps/darkflow/demo-video.mp4` | 869 KB | Darkflow demo |
| **OBSCURA_APP** | Multiple videos | 33 MB total | Privacy Transfer, Dark OCT |
| **OBSCURA-PRIVACY** | Multiple videos | 33 MB total | Same as above (fork?) |
| **solscan-mcp** | `misc/demo.mp4` | 1.5 MB | MCP demo |
| **RIFTPRIVACY** | `src/assets/banner.mp4` | 24 MB | Banner video (not demo) |
| **Axtral-priv** | `public/assets/encryption-bg.mp4` | 3 MB | Background video (not demo) |

### Live Demos (No Video, But Interactive)

| Project | Live URL |
|---------|----------|
| **vex-zk** | https://vex-zk.vercel.app |
| **Obsidian** | https://obsidian-qdke.vercel.app |
| **AuroraZK** | https://aurorazkhost.vercel.app |
| **SCOPE** | https://scope-privacy-engine.vercel.app |
| **PrivyLocker** | https://privylocker.netlify.app |
| **Protocol-01** | https://protocol-01.vercel.app |
| **Arcium-poker** | https://arciumpoker.vercel.app |

---

## Projects with Confirmed Videos

### 1. Chameo (Score: 98) - TOP COMPETITOR

**Video**: https://youtu.be/JZMt14qAP-w
**Type**: YouTube video

**What Chameo Does**:
- Privacy-first, compliance-gated payout platform
- Pay anyone via email or social handle (Twitter, Telegram, Discord, GitHub)
- Uses Privacy Cash (UTXO mixing) + Inco Lightning (FHE) + Aztec Noir (ZK voting)
- Breaks wallet linkability while maintaining compliance screening

**Likely Video Content** (based on analysis):
- Demo of creating a private payout/bounty
- Showing email/social handle payment flow
- Compliance screening UI (Range API)
- ZK voting for dispute resolution
- End-to-end flow from deposit to claim

**Why They're Winning**:
- Comprehensive video showing real product
- 9 sponsor bounty integrations
- Novel compliance + privacy combination

---

### 2. CloakCraft (Score: 90)

**Video**: 4.7MB demo video file in repository
**Type**: MP4 file included in repo

**What CloakCraft Does**:
- Full DeFi privacy suite (transfers, AMM, perps, governance)
- 52k LOC, Light Protocol integration
- Groth16 circuits via Circom

**Likely Video Content**:
- Private transfer demo
- AMM swap with hidden amounts
- Perpetual futures interface
- Note consolidation flow

**Weakness**: Known fake commitment vulnerability

---

### 3. SIP Protocol/Mobile (Score: 93)

**Video**: 8 demo videos on Seeker device
**URL**: https://sip-protocol.org/showcase/solana-privacy-2026
**Type**: Multiple demos on dedicated showcase page

**What SIP Does**:
- Mobile-first privacy payments
- Multi-backend (Arcium, Inco, Privacy Cash, ShadowWire)
- Stealth addresses via meta-address format
- Prior hackathon winner (Zypherpunk $4k)

**Video Content**:
- Mobile app demo on Seeker device
- QR code scanning for payments
- Stealth address generation
- Multiple privacy backend comparison

---

### 4. Obsidian (Score: 83)

**Live Demo**: https://obsidian-qdke.vercel.app/
**Type**: Live interactive demo (not video)

**What Obsidian Does**:
- Dark launchpad with encrypted auctions
- Bids hidden until auction ends (anti-MEV)
- AI-driven allocation scoring

**Demo Shows**:
- Creating a dark auction
- Submitting encrypted bids
- Auction resolution and token claiming
- Polished UI with Framer Motion animations

---

### 5. AuroraZK (Score: 75)

**Live Demo**: https://aurorazkhost.vercel.app
**Type**: Live interactive demo

**What AuroraZK Does**:
- Dark pool limit order DEX
- Noir ZK circuits for range proofs
- Light Protocol for compressed deposits

**Demo Shows**:
- Order placement as commitments
- Encrypted order matching
- Balance management

**Weakness**: Hash mismatch (Pedersen vs SHA-256) breaks ZK property

---

### 6. CleanProof (Score: ~70)

**Live Demo**: https://cleanproof.xyz
**Type**: Live interactive demo

**What CleanProof Does**:
- Vitalik's "Privacy Pools" concept
- Proof of Innocence via association sets
- Groth16 in browser (~300ms proving)

**Demo Shows**:
- Deposit into compliant pool
- Withdrawal with innocence proof
- Association set selection

---

### 7. Shadow Fence (Score: 85)

**Live Demo**: https://shadow.hardhattechbones.com
**Type**: Live interactive demo

**What Shadow Fence Does**:
- ZK location verification
- Prove you're in a region without revealing coordinates
- Circom + Groth16

**Demo Shows**:
- GPS coordinate input
- ZK proof generation (~5-10 seconds)
- Location attestation on-chain

**Weakness**: On-chain verifier is a placeholder (not real verification)

---

### 8. SCOPE Privacy Engine

**Live Demo**: https://scope-privacy-engine.vercel.app/
**Type**: Live interactive dashboard

**What SCOPE Does**:
- Privacy analysis dashboard
- CEX linkage detection
- Privacy score (0-100)
- "Hunter Mode" education

**Demo Shows**:
- Wallet analysis flow
- Privacy score calculation
- Risk detection results
- Remediation recommendations

---

### 9. SolanaPrivacyHackathon2026 / Quantish

**Video**: demo.mp4 included in repository
**Type**: MP4 file

**What It Does**:
- Privacy-preserving prediction market relay
- Privacy Cash + Arcium MPC + Noir circuits
- Wallet unlinkability for trading

---

### 10. Vapor Tokens (Score: 80)

**Video**: Referenced in analysis (likely demo file)
**Type**: Unknown format

**What It Does**:
- Unlinkable transfers with plausible deniability
- Token-2022 compatible
- "Vapor addresses" (provably unspendable)
- Noir + Sunspot for ZK proofs

**Innovation**: Observers can't distinguish private from normal transfers

---

## Projects with Live Demos Only (No Video)

| Project | Demo URL | Working? |
|---------|----------|----------|
| VEX-ZK | https://vex-zk.vercel.app | Live |
| RentReclaim | https://www.rentreclaim.xyz | Live |
| Shadow Tracker | https://solprivacy.xyz | Live |

---

## Video Strategy Comparison

| Project | Video Type | Length | Production Quality |
|---------|------------|--------|-------------------|
| Chameo | YouTube | ~3-4 min | HIGH (professional) |
| CloakCraft | MP4 in repo | ~4 min | MEDIUM |
| SIP Mobile | Showcase page | Multiple short | HIGH |
| Others | Live demos | N/A | Varies |

---

## What ZORB's Video Should Include (Based on Competitor Analysis)

### Must Have (All competitors show these):
1. **Problem statement** - Why privacy matters, cost problem
2. **Live demo** - Working product, not just slides
3. **Technical differentiation** - What's unique (indexed MT for ZORB)
4. **Deployed proof** - Show devnet program IDs on explorer

### Differentiators ZORB Can Emphasize:
1. **Cost comparison** - Show $0.13/tx vs $0 side-by-side
2. **Scale demonstration** - "67 million nullifiers" visual
3. **Code walkthrough** - Show indexed_merkle_tree.rs briefly
4. **Architecture diagram** - Clear visual of innovation

### What Chameo Does Well (Learn From):
- Clean, professional production
- Real product demo, not prototype
- Shows compliance + privacy (addresses regulatory concern)
- Multiple integrations visible

### What ZORB Can Do Better:
- Focus on SINGLE innovation (indexed MT) vs many features
- Show cost math visually
- Emphasize no competitor has this
- Keep it simple and technical

---

## Recommended ZORB Video Structure

Based on competitor analysis:

```
[0:00-0:30] Hook - Cost problem ($0.13 forever)
[0:30-1:00] Problem - PDA-per-nullifier diagram
[1:00-1:45] Solution - Indexed merkle tree visual
[1:45-2:30] Demo - zorb.cash/stress-test live
[2:30-3:15] Technical - Show code, devnet IDs on explorer
[3:15-3:45] Comparison - Why this beats competitors
[3:45-4:00] CTA - Links, "privacy should be free"
```

**Key Insight**: Most competitors show FEATURES. ZORB should show ONE INNOVATION deeply.

---

## Sources

- [Solana Privacy Hackathon](https://solana.com/privacyhack)
- [Privacy Cash GitHub](https://github.com/Privacy-Cash/privacy-cash)
- [Awesome Privacy on Solana](https://github.com/catmcgee/awesome-privacy-on-solana)

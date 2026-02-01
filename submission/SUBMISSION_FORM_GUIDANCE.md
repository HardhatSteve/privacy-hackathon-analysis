# Solana Privacy Hackathon Submission Form - Field-by-Field Guidance

**Form URL**: https://solanafoundation.typeform.com/privacyhacksub
**Deadline**: February 1, 2026 (END OF DAY)
**Dataset**: 97 competitor analyses + 20 ETHGlobal finalist videos

---

## Data Sources

This guidance is derived from:
1. **97 Solana Privacy Hackathon 2026 competitor analyses** (`competition-intel/analyses/`)
2. **20 ETHGlobal finalist videos** (Bangkok/Singapore 2024)
3. **Solana/Colosseum hackathon submission patterns**
4. **PROJECT_CATALOG.md** with detailed competitor breakdowns

---

## Field 1: Project Name

**Type**: Short text (required)
**Question**: "What's the name of your project?"

### Best Practices from Dataset

| Pattern | Examples | Frequency |
|---------|----------|-----------|
| Single word, memorable | Velum, Veil, Shadow, ZORB | 45% |
| Descriptive compound | SolVoid, SafeSol, StealthPay | 30% |
| Acronym/abbreviation | SIP, ECHO, IAP | 15% |
| Clever wordplay | CloakCraft, HushFold, DarkTip | 10% |

**Winners tend to have**:
- Short (1-2 syllables preferred)
- Privacy-evocative (shadow, cloak, veil, stealth)
- Easy to spell and search

**Avoid**:
- Generic names (Solana-Privacy-Hack, PrivacyProtocol)
- Numbers/version suffixes (Protocol-01 is an exception due to quality)
- Hard to pronounce names

### ZORB Assessment
"ZORB" is strong: 4 letters, memorable, unique, privacy-suggestive (zero/orb). No changes needed.

---

## Field 2: One-Line Description

**Type**: Short text (required)
**Question**: "Please provide a one-line description of your project"

### Best Practices from Dataset

**Winning patterns** (from top-rated competitors):

| Project | One-liner | Why It Works |
|---------|-----------|--------------|
| Protocol-01 | "Complete privacy infrastructure for Solana with shielded pools, stealth addresses, and relayer network" | Comprehensive, lists 3 features |
| cloakcraft | "Private DeFi on Solana: transfers, swaps, perps, and governance with ZK proofs" | Lists use cases, mentions ZK |
| velum | "Private payment links for Solana - share URLs to receive funds anonymously" | Simple, explains UX |
| SIP | "Privacy-preserving payments using Noir ZK proofs on Solana" | Tech + use case |

**Formula**: `[Unique value prop] + [key technology] + [target chain]`

**Character count**: Aim for 60-100 characters (fits well in listings)

**Avoid**:
- Starting with "A" or "An" (weak opening)
- Vague claims ("Revolutionary privacy solution")
- No technical specificity

### Current ZORB One-Liner
```
Free private transfers on Solana using an indexed merkle tree that eliminates per-transaction rent costs
```

**Assessment**: Strong! Hits the formula:
- Unique value: "Free private transfers" + "eliminates rent costs"
- Key tech: "indexed merkle tree"
- Target: "Solana"

Length: 103 chars - slightly over target but acceptable.

---

## Field 3: GitHub Repository

**Type**: URL (required)
**Question**: "Drop a link to your project's GitHub repository"
**Note**: Must be public until Feb 7

### Best Practices from Dataset

**Repository structure patterns** (from top competitors):

```
Top 10 projects by code quality:
1. Protocol-01: Monorepo with /circuits, /programs, /extension, /mobile, /sdk
2. cloakcraft: /circuits, /programs, /tests, /client
3. velum: /circuits, /programs, /app, /relayer
4. SIP: /sip-protocol, /sip-app, /docs-sip
5. Shadow: /contracts, /circuits, /sdk
```

**README essentials** (what judges look for):
- [ ] Clear project description
- [ ] Installation/setup instructions
- [ ] Architecture diagram
- [ ] Demo video link (embedded)
- [ ] Deployed program addresses
- [ ] Team info

**Code quality signals**:
- Passing CI/tests
- TypeScript strict mode
- Commented circuits
- No hardcoded secrets

### ZORB Repository
```
https://github.com/zorb-labs/solana-privacy-hackathon-2026
```

**Checklist**:
- [ ] README has architecture diagram
- [ ] Program IDs listed
- [ ] Build instructions work
- [ ] No private keys committed

---

## Field 4: Presentation Video

**Type**: URL (required)
**Question**: "Share a link to a presentation video"
**Constraint**: 4 minutes max, publicly accessible

### Best Practices from Dataset

**ETHGlobal finalist video analysis** (20 videos):

| Metric | Average | Best Practice |
|--------|---------|---------------|
| Length | 2:30-3:30 | Under 4 min, aim for 3 min |
| Hook | 0:10 | Start demo within 10 seconds |
| Tech depth | Medium | Balance demo + architecture |
| Platform | 85% Mux/YouTube | Use YouTube or Loom |

**Winning video structure** (from Bangkok/Singapore 2024 finalists):

```
0:00-0:10  Hook (bold claim or live demo start)
0:10-1:30  Demo walkthrough (show it working)
1:30-2:30  Technical explanation (architecture, innovation)
2:30-3:00  Differentiators (why you win)
3:00-3:30  Roadmap + CTA
```

**Recommended videos to study**:
- DAOGenie (Bangkok 2024): https://stream.mux.com/QztDu1aTrBkAqT01suT7r7Zb6JMHYKtvelK2g3lYZ2ds/high.mp4
- fheProxies (Singapore 2024): https://youtu.be/LSvUDMd_Be8
- Clarity (Singapore 2024): https://stream.mux.com/jLK8TPR5xqgnTkC6eHDY8c8cSJv02KnYtbPV01pO1XJHI/high.mp4

**Avoid**:
- Starting with "Hi, I'm..." (boring)
- Slideshows without demo
- Over 4 minutes
- No audio/narration
- Login-required platforms

### ZORB Video Script
See `PRESENTATION_VIDEO_SCRIPT.md` for the approved script.

---

## Field 5: Live Demo Link (Optional)

**Type**: URL (optional)
**Question**: "Share a link to a live demo"

### Best Practices from Dataset

**Competitor demo deployment patterns**:

| Hosting | Projects | Example |
|---------|----------|---------|
| Vercel | 35% | velum.cash, sip-protocol.com |
| Custom domain | 25% | zorb.cash |
| GitHub Pages | 20% | Simple frontends |
| Devnet only | 20% | No public frontend |

**What judges check**:
1. Does it load? (no crashes)
2. Can I connect a wallet?
3. Does a transaction work on devnet?
4. Is the UX understandable?

**Top demo experiences** (from competitor analysis):
- velum.cash: Simple payment link flow
- zorb.cash/stress-test: Load testing demo
- Protocol-01: Chrome extension + mobile app

### ZORB Demo
```
https://zorb.cash/stress-test
```

**Verify before submission**:
- [ ] Page loads without errors
- [ ] Wallet connect works
- [ ] Devnet transaction succeeds
- [ ] Mobile-responsive

---

## Field 6: Track Selection

**Type**: Dropdown (required)
**Options**: Private payments | Privacy tooling | Open track

### Best Practices from Dataset

**Competitor distribution** (from 97 analyses):

| Track | Projects | Prize Pool |
|-------|----------|------------|
| Private payments | 42 (43%) | $15,000 |
| Privacy tooling | 31 (32%) | $10,000 |
| Open track | 24 (25%) | $10,000 |

**Track fit criteria**:

| Track | Best Fit | Examples |
|-------|----------|----------|
| **Private payments** | Shielded transfers, UTXO protocols, payment links | ZORB, velum, Protocol-01 |
| **Privacy tooling** | SDKs, scanners, RPC privacy, analysis tools | LeakLens, exposure scanners, Veil SDK |
| **Open track** | Infrastructure, Light Protocol, cross-chain | Light-based projects |

### ZORB Track Selection
**Private payments** - Correct choice. ZORB's core is shielded transfers.

---

## Field 7: Light Protocol Usage

**Type**: Yes/No (required)
**Question**: "Did you build using Light Protocol?"
**Note**: $3,000 of Open Track for Light Protocol projects

### Best Practices from Dataset

**Light Protocol integration patterns** (from competitor analysis):

| Project | Uses Light | How |
|---------|------------|-----|
| cloakcraft | Yes | Compressed accounts for state |
| vapor-tokens | Yes | Compressed token storage |
| Most others | No | Own Merkle tree implementation |

**ZORB uses its own indexed merkle tree**, not Light Protocol.

### ZORB Answer
**No** - Correct. ZORB implements a custom indexed merkle tree (Aztec-style), not Light Protocol compressed accounts.

---

## Field 8: Sponsor Bounties

**Type**: Multi-select (optional)
**Options**: 14 sponsors
**Warning**: False claims = disqualification

### Best Practices from Dataset

**Sponsor technology mapping** (from SPONSOR_BOUNTY_ANALYSIS.md):

| Sponsor | What They Want | ZORB Fit |
|---------|----------------|----------|
| Privacy Cash | Private token transfer integrations | No |
| Arcium | MPC-based privacy | No (ZORB uses ZK) |
| Aztec/Noir | Noir circuits | No (ZORB uses Circom) |
| Inco | FHE encryption | No |
| Helius | RPC infrastructure usage | Maybe (if using Helius RPC) |
| Quicknode | Their RPC endpoints | Maybe |

**Competitor bounty claims** (from analyses):
- Most strong competitors claim 0-2 bounties
- Over-claiming correlates with weaker projects
- Top projects (Protocol-01, cloakcraft) claim relevant ones only

### ZORB Sponsor Bounties
**None** - Correct. ZORB uses:
- Circom (not Noir)
- Own infrastructure (not Helius/Quicknode specifically)
- ZK proofs (not MPC/FHE)

Don't claim bounties unless genuinely integrated.

---

## Field 9: Technical Description

**Type**: Long text (required)
**Question**: "Describe your project in technical detail"
**Warning**: AI-generated content = disqualification risk

### Best Practices from Dataset

**Winning technical descriptions** (structure from top competitors):

```
1. THE PROBLEM (2-3 sentences)
   - What's broken today
   - Quantified impact

2. OUR SOLUTION (3-4 sentences)
   - Core innovation
   - How it works at high level

3. TECHNICAL IMPLEMENTATION (detailed)
   - Circuits: language, constraint count, hash functions
   - Programs: Anchor/Pinocchio, verification method
   - Novel techniques: specific innovations

4. WHAT WE BUILT (during hackathon)
   - Explicit list of deliverables
   - Program addresses

5. DIFFERENTIATORS (why we win)
   - Specific claims with evidence
   - Comparison to alternatives

6. TEAM (1-2 sentences)
```

**Word count**: 400-800 words (not too short, not overwhelming)

**Technical credibility signals**:
- Specific constraint counts
- Named algorithms (Poseidon, Groth16, BabyJubJub)
- Deployed program IDs
- Performance numbers

**Avoid**:
- Vague claims ("revolutionary", "cutting-edge")
- No specific numbers
- Marketing speak
- AI-generated patterns (repetitive structure, generic phrases)

### ZORB Technical Description
Current FINAL_SUBMISSION.md has a strong technical description. Key strengths:
- Quantified problem ($0.13/tx rent cost)
- Specific solution (indexed merkle tree, 67M nullifiers in 1KB)
- Circuit names and constraint counts
- Deployed program IDs
- Unique claim (yield while shielded)

---

## Field 10: Project Roadmap

**Type**: Long text (required)
**Question**: "What's next on the roadmap for [project]?"

### Best Practices from Dataset

**Winning roadmap structure** (from top competitors):

```
IMMEDIATE (this month)
- Specific deliverable 1
- Specific deliverable 2

Q1 2026
- Feature set 1
- Integration 1

Q2 2026
- Larger vision item
- Expansion item

LONG-TERM VISION (1 paragraph)
```

**Credibility signals**:
- Realistic timelines
- Specific features (not vague "improvements")
- Shows technical depth continues
- Mentions mainnet deployment

**Top competitor roadmaps** (patterns):
- Protocol-01: Mainnet → Mobile → Fiat onramps → DEX integration
- cloakcraft: Light integration → More DeFi primitives → Cross-chain
- velum: SDK release → Merchant tools → Enterprise features

### ZORB Roadmap
Current roadmap is well-structured:
- Immediate: Mainnet, SDK, docs
- Q1: Remote prover, mobile, hardware wallet
- Q2: L2 rollup, DEX, cross-chain
- Vision: Privacy as default

---

## Field 11: Telegram Handle

**Type**: Short text (required)
**Question**: "What's your Telegram handle?"

### Best Practices

- Single handle for team (not multiple)
- Active account (judges will DM winners)
- Professional username

---

## Summary Checklist

| Field | ZORB Status | Notes |
|-------|-------------|-------|
| 1. Project Name | ZORB | Strong |
| 2. One-liner | Done | 103 chars, good |
| 3. GitHub | https://github.com/zorb-labs/solana-privacy-hackathon-2026 | Verify public |
| 4. Video | **TODO** | Need to record |
| 5. Live Demo | https://zorb.cash/stress-test | Verify works |
| 6. Track | Private payments | Correct |
| 7. Light Protocol | No | Correct |
| 8. Sponsor Bounties | None | Correct |
| 9. Technical Desc | Done | Strong |
| 10. Roadmap | Done | Well-structured |
| 11. Telegram | **TODO** | Add handle |

---

## Competitor Comparison (Top 5)

| Metric | Protocol-01 | cloakcraft | velum | SIP | ZORB |
|--------|-------------|------------|-------|-----|------|
| Code lines | 50K+ | 52K | 30K | 20K | 40K+ |
| Circuits | 6 | 8 | 4 | 3 | 7 |
| Programs | 6 | 5 | 3 | 2 | 3 |
| Live demo | Yes | Yes | Yes | Yes | Yes |
| Video | Unknown | Yes | Unknown | Unknown | TODO |
| Unique feature | Hybrid privacy | Private perps | Payment links | Noir proofs | Rent-free + Yield |

ZORB's differentiators:
1. **Zero rent costs** (unique in field)
2. **Yield while shielded** (only working implementation)
3. **Indexed merkle tree** (Aztec-proven approach)

---

*Generated from 97 competitor analyses + 20 ETHGlobal finalist videos*

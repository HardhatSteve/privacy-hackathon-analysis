# Solana Privacy Hackathon - Judge's Reference Guide v2

**Generated:** 2026-02-01T16:00:00Z
**Updated:** Web App Priority + Track-Specific Criteria + Extended Coverage
**Total Submissions Analyzed:** 106
**In Eligibility Matrix:** 62 projects
**Genuinely Competitive:** ~25 projects

---

## Official Hackathon Tracks

### Track 01: Private Payments — $15,000
**Description:** "Build innovative solutions for confidential or private transfers on Solana"

**Top Contenders:**
| Project | Fit | Rationale |
|---------|-----|-----------|
| **chameo** | ✅ CRITICAL | Privacy Cash + Inco FHE + Noir ZK - triple-layer privacy stack (Score: 98) |
| **Protocol-01** | ✅ STRONG | Groth16 shielded pool + stealth addresses + relayer |
| **yieldcash** | ✅ STRONG | Yield-bearing privacy pools with Noir circuits |
| **CloakCraft** | ⚠️ MEDIUM | Full privacy DeFi but has critical vulnerability |
| **Vapor Tokens** | ✅ STRONG | Plausible deniability transfers |
| **CleanProof** | ✅ STRONG | Privacy Pools implementation |
| **SolVoid** | ⚠️ MEDIUM | Tornado-style mixer |
| **shielded-pool-pinocchio** | ✅ STRONG | Clean reference implementation |

---

### Track 02: Privacy Tooling — $15,000
**Description:** "Develop tools and infrastructure that make it easier for developers to build with privacy on Solana"

**Top Contenders:**
| Project | Fit | Rationale |
|---------|-----|-----------|
| **solana-privacy-scanner** | ✅ STRONG | 13 privacy heuristics, CLI, npm packages |
| **SIP Protocol** | ✅ STRONG | Privacy SDK with 6,700+ tests |
| **ECHO** | ✅ STRONG | Privacy visualization + analysis |
| **deploy-shield** | ✅ STRONG | Privacy-preserving program deployment |
| **Veil SDK** | ⚠️ MEDIUM | SDK but incomplete |

---

### Track 03: Open Track (Light Protocol) — $18,000
**Description:** "Build whatever you want with privacy on Solana"
**Judged by:** Solana Foundation & Light Protocol

**Top Contenders:**
| Project | Fit | Rationale |
|---------|-----|-----------|
| **CloakCraft** | ✅ STRONG | Light Protocol integrated, ZK compression |
| **AuroraZK** | ✅ STRONG | Light Protocol for dark pool |
| **Shadow DEX** | ⚠️ MEDIUM | Claims Light but minimal integration |
| **vex-zk** | ⚠️ MEDIUM | Novel ZK approach |

---

## Sponsor Bounty Alignment

### Privacy Cash — $15,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| Best Overall App | $6,000 | **chameo** (full SDK integration for bounties/payouts), Protocol-01 |
| Best Integration to Existing App | $6,000 | hydentity (SNS wrapper), chameo |
| Honorable Mentions | $3,000 | Vapor Tokens, CleanProof |

**Conflict:** Privacy Cash is a competing shielded pool - using their SDK routes funds through THEIR pool.

---

### Radr/ShadowWire — $15,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| Grand Prize | $10,000 | None (Bulletproofs approach conflicts) |
| Best USD1 Integration | $2,500 | None identified |
| Best Existing App Integration | $2,500 | None identified |

**Conflict:** ShadowWire uses Bulletproofs - different cryptographic approach from most submissions.

---

### Arcium — $10,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| Best Overall App | $5,000 | **Epoch** (best MPC integration) |
| Best Existing App Integration | $3,000 | Obsidian, hydentity |
| Most Encrypted Potential | 2×$1,000 | Mukon-messenger, anon0mesh |

**Strong Candidates:** Epoch, Obsidian, hydentity, Incognito Protocol, OBSCURA_APP, yieldcash

---

### Aztec/Noir — $10,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| Best Overall | $5,000 | **vex-zk** (ring signatures) |
| Best Non-Financial Use | $2,500 | nahualli (personality assessments) |
| Most Creative | $2,500 | Vapor Tokens |

**Strong Candidates:** vex-zk, Shadow DEX, AuroraZK, nahualli, shielded-pool-pinocchio, yieldcash, chameo

---

### Inco Lightning — $6,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| DeFi | $2,000 | confpay |
| Consumer/Gaming/Prediction | $2,000 | **PrivyLocker** (FHE documents), **chameo** (encrypted voting) |
| Payments | $2,000 | **chameo** (FHE analytics + voting), confpay |

**Strong Candidates:** chameo (extensive FHE for voting + analytics), PrivyLocker, confpay

---

### Helius — $5,000
**Criteria:** "Best privacy project that leverages Helius' RPCs and developer tooling"

| Project | Helius Integration |
|---------|-------------------|
| **ECHO** | ✅ Uses Helius API |
| **Scope-privacy-engine** | ✅ Uses Helius Enhanced API for transaction parsing |
| **solana-privacy-scanner** | ⚠️ QuickNode focused |
| Protocol-01 | ⚠️ Generic RPC |

---

### QuickNode — $3,000
**Criteria:** "Most impactful open-source privacy tooling/repo"

| Project | QuickNode Integration |
|---------|----------------------|
| **solana-privacy-scanner** | ✅ Explicit QuickNode integration |
| ECHO | ✅ Uses QuickNode |

---

### MagicBlock (TEE) — $5,000
| Prize | Amount | Best Candidates |
|-------|--------|-----------------|
| Best Private App | $2,500 | None (requires TEE rearchitecture) |
| Second Place | $1,500 | None identified |
| Third Place | $1,000 | None identified |

**Gap:** No submissions properly integrate MagicBlock's ephemeral rollups.

---

### Range Protocol — $1,500+
**Criteria:** Compliant, private applications meeting regulatory requirements

| Project | Compliance Focus |
|---------|-----------------|
| **chameo** | ✅ Direct Range API integration - risk + OFAC + blacklist checking |
| **ECHO** | ✅ Privacy analysis for compliance |
| **SIP Protocol** | ✅ Viewing keys for compliance |
| CleanProof | ✅ "Proof of Innocence" |

---

## Comprehensive Track Analysis

### Track 01: Private Payments ($15,000)
**Description:** "Build innovative solutions for confidential or private transfers on Solana"

| Project | Score | Privacy Mechanism | Transfer Functionality | Assessment |
|---------|-------|-------------------|----------------------|------------|
| **Protocol-01** | 9/10 | Groth16 ZK + Stealth Addresses | Shield/Transfer/Unshield UTXO | ✅ STRONG - Complete ecosystem |
| **SafeSol** | 9/10 | Groth16 + Light Protocol | Private Spend instruction | ✅ STRONG - Most efficient (25k CU) |
| **SolVoid** | 8/10 | Groth16 + Onion Routing | Multi-hop relayer | ✅ STRONG - Institutional privacy |
| **CloakCraft** | 8/10 | Groth16 + Stealth | DeFi suite | ✅ STRONG - But has vuln |
| **hydentity** | 8/10 | Arcium MPC + Privacy Cash | Vault withdrawals | ✅ STRONG - SNS privacy wrapper |
| **Incognito Protocol** | 8/10 | Token-2022 + Merkle Trees | Escrow + marketplace | ✅ STRONG - Dual system |
| **Privacy-Pay** | 8/10 | Light Protocol compression | Shielded SOL | ✅ STRONG - ZK compression |
| **Vapor Tokens** | 7/10 | Noir ZK + Token-2022 | Vaporize/Condense | ⚠️ GOOD - Novel approach |
| **shielded-pool-pinocchio** | 7/10 | Noir + Groth16 | Deposit/Withdraw | ⚠️ GOOD - Reference impl |
| **DarkTip** | 7/10 | Noir + Stealth | Anonymous tipping | ⚠️ GOOD - But broken crypto |
| **StealthPay** | 7/10 | Privacy Cash SDK | USDC shielding | ⚠️ GOOD - SDK dependent |
| **CleanProof** | 6/10 | Groth16 Privacy Pools | Proof of Innocence | ⚠️ PARTIAL - Frontend only |
| **Obsidian** | 5/10 | Arcium (simulated) | Encrypted bids | ⚠️ PARTIAL - Launchpad, not payments |
| **confpay** | 4/10 | Inco FHE | Payroll encryption | ❌ WEAK - Not transfers |

---

### Track 02: Privacy Tooling ($15,000)
**Description:** "Develop tools and infrastructure that make it easier for developers to build with privacy on Solana"

| Project | Score | Tool Type | Integration | Assessment |
|---------|-------|-----------|-------------|------------|
| **solana-privacy-scanner** | 9/10 | CLI + Library + Analyzer | npm packages, Claude plugin | ✅ EXCELLENT - Production ready |
| **SIP Protocol** | 8/10 | SDK + Multi-chain Framework | @sip-protocol/sdk, 6,700 tests | ✅ EXCELLENT - Complete SDK |
| **ECHO** | 8/10 | Analysis + Visualization | REST API, 4 sponsor integrations | ✅ VERY GOOD - Educational |
| **Veil** | 8/10 | DeFi Privacy Stack | @veil/crypto, swap router | ✅ VERY GOOD - Full stack |
| **Styx Stack** | 8/10 | Multi-domain SDK | 8 npm packages | ✅ VERY GOOD - Comprehensive |
| **PrivyLocker** | 8/10 | FHE Infrastructure | Inco SDK integration | ✅ VERY GOOD - Novel tech |
| **deploy-shield** | 7/10 | CLI Deployment | Privacy Cash integration | ⚠️ GOOD - Specialized |
| **Veil-SDK** | 7/10 | Abstraction Layer | Modular adapters | ⚠️ GOOD - Early stage |
| **SolanaPrivacyKit** | 7/10 | SDK + CLI + Demo | Monorepo structure | ⚠️ GOOD - Developer friendly |
| **solana-privacy-rpc** | 7/10 | RPC Privacy Layer | K-anonymity batching | ⚠️ GOOD - Infrastructure |
| **Attesta-Kit** | 6/10 | Account Abstraction | WebAuthn SDK | ⚠️ FAIR - Adjacent to privacy |

---

### Track 03: Open Track ($18,000)
**Description:** "Build whatever you want with privacy on Solana" - Judged by Solana Foundation & Light Protocol

**Light Protocol Bonus:** Projects using ZK Compression get priority

| Project | Score | Uses Light? | Novel Approach | Assessment |
|---------|-------|-------------|----------------|------------|
| **CloakCraft** | 9/10 | ✅ YES | Complete DeFi suite + governance | ✅ WINNER - Only full Light integration |
| **yieldcash** | 9/10 | ⚠️ Partial | Yield-bearing privacy pools | ✅ STRONG - DeFi innovation |
| **paraloom-core** | 9/10 | ⚠️ Partial | zkSNARK + private compute | ✅ STRONG - Distributed computing |
| **AuroraZK** | 8/10 | ✅ YES | Dark pool DEX, dual-layer | ✅ STRONG - Unique commit-reveal |
| **privacy-vault** | 8/10 | ✅ YES | Privacy Pools research impl | ✅ STRONG - Vitalik's research |
| **Dark-Null-Protocol** | 8/10 | ❌ NO | Optimistic ZK, lazy verification | ⚠️ GOOD - Novel verification |
| **Keyed** | 8/10 | ❌ NO | Social + AI + privacy tipping | ⚠️ GOOD - But wrong category |
| **Shadow DEX** | 6/10 | ❌ NO | ZK eligibility gates | ⚠️ MODERATE - Uses Sunspot |
| **vex-zk** | 5/10 | ❌ NO | Ring signatures | ⚠️ MODERATE - Address-level only |
| **Obsidian** | 4/10 | ❌ NO | Dark launchpad | ⚠️ WEAK - Uses Arcium |
| **Mukon-messenger** | 4/10 | ❌ NO | Encrypted messaging | ⚠️ WEAK - Uses Arcium |
| **nahualli** | 3/10 | ❌ NO | Psychometric assessments | ❌ OFF-TOPIC - App layer |
| **anon0mesh** | 3/10 | ❌ NO | BLE mesh networking | ❌ OFF-TOPIC - Infrastructure |
| **Arcium-poker** | 2/10 | ❌ NO | MPC poker | ❌ WRONG PROTOCOL - Arcium only |

---

## Track Winners Summary

### Track 01: Private Payments - Top 5
1. **Protocol-01** (9/10) - Most complete, deployed ecosystem
2. **SafeSol** (9/10) - Most efficient ZK verification
3. **SolVoid** (8/10) - Best institutional features
4. **CloakCraft** (8/10) - Best DeFi composability (but vuln)
5. **hydentity** (8/10) - Unique SNS privacy wrapper

### Track 02: Privacy Tooling - Top 5
1. **solana-privacy-scanner** (9/10) - Production npm packages
2. **SIP Protocol** (8/10) - Complete cross-chain SDK
3. **ECHO** (8/10) - Best visualization/education
4. **Veil** (8/10) - Full DeFi privacy stack
5. **Styx Stack** (8/10) - Multi-domain toolkit

### Track 03: Open Track - Top 5 (Light Protocol Priority)
1. **CloakCraft** (9/10) - ✅ Uses Light, complete DeFi
2. **AuroraZK** (8/10) - ✅ Uses Light, dark pool
3. **privacy-vault** (8/10) - ✅ Uses Light, research impl
4. **yieldcash** (9/10) - Yield-bearing pools (novel)
5. **paraloom-core** (9/10) - Private compute (novel)

---

## Complete Track Eligibility Matrix

| Project | T1 | T2 | T3 | Best Track | Best Sponsor |
|---------|:--:|:--:|:--:|------------|--------------|
| **Protocol-01** | 9 | 6 | 7 | Track 01 | Privacy Cash |
| **solana-privacy-scanner** | 2 | 9 | 5 | Track 02 | QuickNode |
| **vex-zk** | 5 | 5 | 5 | Track 03 | Aztec/Noir |
| **SIP Protocol** | 7 | 8 | 6 | Track 02 | Range |
| **CloakCraft** | 8 | 6 | 9 | Track 03 | Light Protocol |
| **AuroraZK** | 6 | 5 | 8 | Track 03 | Light Protocol |
| **Epoch** | 5 | 4 | 7 | Track 03 | Arcium |
| **Obsidian** | 5 | 4 | 4 | Track 03 | Arcium |
| **CleanProof** | 6 | 5 | 6 | Track 01 | Range |
| **Shadow DEX** | 6 | 5 | 6 | Track 03 | Aztec/Noir |
| **Vapor Tokens** | 7 | 5 | 6 | Track 01 | Aztec/Noir |
| **ECHO** | 2 | 8 | 5 | Track 02 | Helius |
| **PrivyLocker** | 5 | 8 | 7 | Track 02 | Inco |
| **hydentity** | 8 | 5 | 6 | Track 01 | Arcium |
| **nahualli** | 3 | 5 | 3 | Track 02 | Aztec/Noir |
| **confpay** | 4 | 5 | 4 | Track 02 | Inco |
| **deploy-shield** | 3 | 7 | 4 | Track 02 | - |
| **shielded-pool-pinocchio** | 7 | 6 | 5 | Track 01 | Aztec/Noir |
| **SafeSol** | 9 | 6 | 7 | Track 01 | Light Protocol |
| **SolVoid** | 8 | 5 | 6 | Track 01 | - |
| **DarkTip** | 7 | 4 | 4 | Track 01 | - |
| **StealthPay** | 7 | 4 | 5 | Track 01 | Privacy Cash |
| **veilvote** | 7 | 5 | 6 | Track 01 | - |
| **triton-privacy-solana** | 8 | 8 | 7 | Track 01/02 | Range |
| **Keyed** | 3 | 8 | 8 | Track 02 | - |
| **paraloom-core** | 9 | 8 | 9 | Track 01/03 | - |
| **Dark-Null-Protocol** | 9 | 7 | 8 | Track 01 | - |
| **privacy-vault** | 8 | 7 | 8 | Track 01/03 | Light Protocol |
| **yieldcash** | 9 | 9 | 9 | ALL TRACKS | Arcium |
| **Incognito Protocol** | 8 | 5 | 6 | Track 01 | Arcium |
| **Privacy-Pay** | 8 | 5 | 7 | Track 01 | Light Protocol |
| **Mukon-messenger** | 4 | 4 | 4 | Track 03 | Arcium |
| **anon0mesh** | 3 | 4 | 3 | Track 03 | Arcium |
| **Arcium-poker** | 2 | 3 | 2 | None | Arcium |
| **chameo** | 9 | 8 | 8 | Track 01 | Privacy Cash, Inco, Range |
| **OBSCURA_APP** | 7 | 6 | 7 | Track 01 | Arcium |
| **Scope-privacy-engine** | 2 | 8 | 5 | Track 02 | Helius, QuickNode |
| **shadow** | 6 | 8 | 8 | Track 02/03 | Aztec/Noir |
| **anonset** | 1 | 6 | 3 | Track 02 | - |
| **yieldcash-solana-privacy** | 9 | 7 | 9 | Track 01/03 | Aztec/Noir, Arcium |
| **veil** | 7 | 8 | 8 | Track 02/03 | Light Protocol |
| **styx-stack-Solana-** | 3 | 5 | 3 | Track 02 | - |
| **Attesta-Kit** | 2 | 6 | 4 | Track 02 | - |
| **sip-mobile** | 6 | 5 | 5 | Track 01 | - |
| **Silent-Rails** | 5 | 7 | 5 | Track 02 | - |
| **stealth-rails-SDK** | 5 | 7 | 5 | Track 02 | - |
| **donatrade** | 6 | 4 | 5 | Track 01 | - |
| **encryptedMessagingChat** | 3 | 4 | 4 | Track 03 | Arcium |
| **hushfold** | 5 | 5 | 5 | Track 01 | - |
| **opencoins** | 4 | 4 | 4 | Track 01 | - |
| **pigeon** | 4 | 3 | 3 | Track 03 | - |
| **Privatepay** | 5 | 4 | 4 | Track 01 | - |
| **shieldedremit** | 5 | 4 | 5 | Track 01 | - |
| **wavis-protocol** | 4 | 4 | 4 | Track 03 | - |
| **zelana** | 4 | 4 | 4 | Track 03 | - |
| **zmix** | 6 | 4 | 5 | Track 01 | - |
| **zkprof** | 2 | 5 | 3 | Track 02 | - |
| **SolsticeProtocol** | 6 | 5 | 6 | Track 01 | - |
| **solana-privacy-rpc** | 3 | 7 | 5 | Track 02 | - |
| **SolanaPrivacyKit** | 5 | 7 | 5 | Track 02 | - |

**Score Legend:** 9-10 = Excellent | 7-8 = Strong | 5-6 = Moderate | 3-4 = Weak | 1-2 = Poor fit

---

## Submission Requirements Checklist

All submissions must meet these criteria:
- [ ] **Open Source** - All code publicly available
- [ ] **Solana Integration** - Uses privacy-preserving technologies on Solana
- [ ] **Deployment** - Program deployed to devnet or mainnet
- [ ] **Demo Video** - Maximum 3 minutes
- [ ] **Documentation** - Complete docs included

### Projects Missing Requirements

| Project | Missing | Impact |
|---------|---------|--------|
| Dark-Null-Protocol | Closed source circuits | ❌ Disqualified |
| veilvote | Placeholder program ID | ❌ Not deployed |
| triton-privacy-solana | Mock implementation | ⚠️ Low score |
| DarkTip | Broken crypto | ⚠️ Low score |

---

## Scoring Legend

| Metric | Description |
|--------|-------------|
| **Innovation** | Novelty of approach (1-10) |
| **Execution** | Code completeness and quality (1-10) |
| **Working Status** | **Completely Working** / **Almost Working** / **Unsound** |
| **Delivery** | **Web App** / **Mobile** / **CLI/SDK** / **None** |
| **Live Demo** | Publicly accessible URL for judges to test |
| **Credibility** | Team signals, prior work, code quality (LOW/MED/HIGH) |

### Delivery Channel Preference (NEW)
Projects are evaluated with preference for **web-first** delivery:
- **Web App with Live Demo (Best)**: +10 points - Judges can test immediately
- **Web App (Local Only)**: +5 points - Requires npm run dev
- **Mobile App**: -5 points - Harder to verify, "vibe code" risk
- **CLI/SDK Only**: Neutral - Developer tools, no end-user interface

### Working Status Definitions
- **Completely Working**: All core features functional, proper cryptography, deployable
- **Almost Working**: Most features work, minor gaps or incomplete integration
- **Unsound**: Broken crypto, mock verifiers, stubs, or fundamentally non-functional privacy

---

## TIER 1: Top Contenders (Likely Prize Winners)

### 1. solana-privacy-scanner
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🟢 **Web App + CLI** |
| **Live Demo** | ✅ https://sps.guide |
| **Innovation** | 9/10 - Privacy ANALYSIS tool with 13 heuristic detectors |
| **Execution** | 10/10 - Published npm packages (v0.7.0), CLI, web UI |
| **Updated Score** | **100/100** (+10 web, +5 demo) |

**Why #1:** Live web demo + CLI + open-source public good. Judges can test immediately at sps.guide. 13 working privacy heuristics, QuickNode sponsor alignment.

---

### 2. Protocol-01
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🟢 **Web + Mobile + Extension** |
| **Live Demo** | ✅ https://protocol-01.vercel.app + APK |
| **Innovation** | 9/10 - Complete privacy ecosystem (shielded pool + stealth + relayer) |
| **Execution** | 9/10 - 6 programs, 2,175+ tests, browser extension |
| **Updated Score** | **90/100** (+10 web, +5 demo, -5 mobile-primary) |

**Why #2:** Most complete privacy submission. Web app + extension deployed. Groth16 circuits working. Minor deduction for mobile-first design philosophy.

---

### 3. vex-zk
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ✅ https://vex-zk.vercel.app |
| **Innovation** | 8/10 - Noir ZK ring signatures for identity privacy |
| **Execution** | 9/10 - Polished UI, real circuits, Vercel deployed |
| **Updated Score** | **95/100** (+10 web, +5 demo) |

**Why #3:** Best live web demo. Noir circuits actually compile and work. Beautiful UI judges can test immediately. Ring signatures working on-chain.

---

### 4. SIP Protocol Ecosystem
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web + Mobile + SDK** |
| **Live Demo** | ✅ https://app.sip-protocol.org |
| **Innovation** | 8/10 - Intent-based privacy, viewing keys for compliance |
| **Execution** | 8/10 - 6,700+ tests, mainnet deployed, prior winner |
| **Updated Score** | **85/100** (+10 web, +5 demo, -10 incomplete on-chain verification) |

**Why #4:** Prior hackathon winner (Zypherpunk $4k). Mainnet deployed. On-chain ZK verification marked TODO - validates proof format only.

---

### 5. CloakCraft
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** (Critical vulnerability) |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ⚠️ No public URL (Vercel ready) |
| **Innovation** | 9/10 - Full DeFi privacy suite (AMM, perps, governance) |
| **Execution** | 9/10 - 52k LOC, Light Protocol integration |
| **Updated Score** | **75/100** (+5 web, -15 fake commitment bug, -5 low tests) |

**Why Downgraded:** Critical fake commitment attack allows minting currency from thin air. Team acknowledges but shipped anyway. Only 1 test file found.

---

## TIER 2: Strong Submissions (Competitive)

### 6. AuroraZK
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ✅ https://aurorazkhost.vercel.app |
| **Innovation** | 8/10 - Dark pool DEX with Noir ZK + Light Protocol |
| **Execution** | 7/10 - Working demo, hash mismatch issue |
| **Updated Score** | **80/100** (+10 web, +5 demo, -15 Pedersen/SHA mismatch) |

**Issue:** Noir uses Pedersen hash, on-chain uses SHA-256. Breaks ZK property.

---

### 7. Obsidian
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ✅ https://obsidian-qdke.vercel.app |
| **Innovation** | 7/10 - Dark auctions for token launches |
| **Execution** | 8/10 - Polished UI, simulation mode |
| **Updated Score** | **78/100** (+10 web, +5 demo, -7 simulated Arcium) |

**Note:** "Arcium integration" is NaCl box simulation, not real MPC. Simulation mode helps judges test.

---

### 8. Epoch
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ⚠️ No public URL (Next.js ready) |
| **Innovation** | 7/10 - Private prediction markets |
| **Execution** | 8/10 - Arcium MPC integration, devnet deployed |
| **Updated Score** | **82/100** (+5 web, +10 real MPC) |

**Strength:** One of the best Arcium MPC integrations. Encrypted betting prevents front-running.

---

### 9. CleanProof
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ✅ https://cleanproof.xyz |
| **Innovation** | 9/10 - Vitalik's Privacy Pools concept |
| **Execution** | 7/10 - Browser Groth16 works, backend separate |
| **Updated Score** | **77/100** (+10 web, +5 demo, -8 missing backend) |

---

### 10. Shadow DEX
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ No public URL |
| **Innovation** | 8/10 - ZK-gated eligibility proofs |
| **Execution** | 8/10 - 4 Noir circuits, devnet deployed |
| **Updated Score** | **75/100** (+5 web, -5 no demo) |

**Note:** Most sophisticated ZK circuits (4 proof types) but no live deployment for judges.

---

### 11. hydentity
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ No public URL |
| **Innovation** | 8/10 - SNS domain privacy wrapper (first-mover) |
| **Execution** | 7/10 - Deepest Arcium integration, Vercel ready |
| **Updated Score** | **73/100** (+5 web, -7 Arcium placeholder) |

---

### 12. Vapor Tokens
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🔴 **CLI Only** |
| **Live Demo** | ❌ None |
| **Innovation** | 9/10 - Plausible deniability via vapor addresses |
| **Execution** | 8/10 - Ed25519 in Noir, Token-2022 hooks |
| **Updated Score** | **70/100** (-10 CLI only, +10 excellent ZK) |

**Technical Excellence:** Best ZK implementation in hackathon. Loses points only for lack of web UI.

---

### 13. ECHO
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ⚠️ Local only |
| **Innovation** | 8/10 - Privacy visualization + analysis |
| **Execution** | 8/10 - Multi-sponsor API integration |
| **Updated Score** | **72/100** (+5 web, -8 not a privacy protocol) |

**Note:** Analysis tool only - provides diagnostics, not privacy. Track 02 contender.

---

### 14. shielded-pool-pinocchio-solana
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ✅ **Completely Working** |
| **Delivery** | 🔴 **Backend + Test Client** |
| **Live Demo** | ❌ None |
| **Innovation** | 7/10 - Clean Tornado Cash reference implementation |
| **Execution** | 8/10 - Noir + Pinocchio, proper nullifiers |
| **Updated Score** | **68/100** (-10 no UI, +8 clean implementation) |

---

## TIER 3: Moderate Quality

### 15. SafeSol
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ❌ **Unsound** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ No public URL |
| **Updated Score** | **55/100** |

**Critical Issue:** Mock on-chain ZK verifier - only checks non-zero bytes, no pairing verification.

---

### 16. confpay
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ No public URL |
| **Updated Score** | **65/100** |

**Issue:** Plaintext PIN storage, authorization checks removed.

---

### 17. PrivyLocker
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ✅ https://privylocker.netlify.app |
| **Updated Score** | **70/100** (+10 web, +5 demo) |

**Strength:** First Inco FHE integration on Solana. Live demo available.

---

### 18. nahualli
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ No public URL |
| **Updated Score** | **62/100** |

---

### 19. Incognito Protocol
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🟢 **Web App** |
| **Live Demo** | ❌ Requires Arcium localnet |
| **Updated Score** | **65/100** |

---

### 20. deploy-shield
| Aspect | Assessment |
|--------|------------|
| **Working Status** | ⚠️ **Almost Working** |
| **Delivery** | 🔴 **CLI Only** |
| **Live Demo** | ❌ None |
| **Updated Score** | **55/100** |

---

## TIER 4: Limited/Incomplete

### Mobile-Only (Downgraded)

| Project | Delivery | Issue | Score |
|---------|----------|-------|-------|
| **Mukon-messenger** | 🔴 Mobile | React Native only, no web | 55/100 |
| **sip-mobile** | 🔴 Mobile | Good tech but requires device | 60/100 |
| **anon0mesh** | 🔴 Mobile | BLE mesh - innovative but untestable | 50/100 |

### Broken Crypto

| Project | Delivery | Issue | Score |
|---------|----------|-------|-------|
| **DarkTip** | 🟢 Web | XOR stealth addresses, mock ZK | 45/100 |
| **triton-privacy-solana** | 🔴 CLI | All privacy mocked, plaintext trades | 30/100 |
| **styx-stack-Solana** | 🔴 SDK | Broken ECDH, 5% complete | 25/100 |
| **veilvote** | 🟢 Web | Frontend stubs, placeholder program ID | 40/100 |

### Wrong Category

| Project | Issue | Score |
|---------|-------|-------|
| **Keyed** | Social platform, privacy is stub | 40/100 |
| **Attesta-Kit** | Account abstraction, not privacy | 45/100 |

---

## Quick Reference: Live Demo URLs

| Project | URL | Status |
|---------|-----|--------|
| **solana-privacy-scanner** | https://sps.guide | ✅ Production |
| **vex-zk** | https://vex-zk.vercel.app | ✅ Live |
| **Protocol-01** | https://protocol-01.vercel.app | ✅ Live |
| **SIP Protocol** | https://app.sip-protocol.org | ✅ Production |
| **AuroraZK** | https://aurorazkhost.vercel.app | ✅ Live |
| **CleanProof** | https://cleanproof.xyz | ✅ Live |
| **Obsidian** | https://obsidian-qdke.vercel.app | ✅ Live |
| **PrivyLocker** | https://privylocker.netlify.app | ✅ Live |
| **SCOPE** | https://scope-privacy-engine.vercel.app | ✅ Live |

---

## Updated Rankings by Category

### Best Web Apps (Judges Can Test Now)
1. **solana-privacy-scanner** - sps.guide (100/100)
2. **vex-zk** - vex-zk.vercel.app (95/100)
3. **Protocol-01** - protocol-01.vercel.app (90/100)
4. **SIP Protocol** - app.sip-protocol.org (85/100)
5. **AuroraZK** - aurorazkhost.vercel.app (80/100)

### Best ZK Implementation (Technical Depth)
1. **Vapor Tokens** - Ed25519 in Noir, plausible deniability
2. **Protocol-01** - Full Groth16 + stealth + relayer
3. **Shadow DEX** - 4 working Noir circuits
4. **shielded-pool-pinocchio** - Clean Tornado reference

### Best MPC/FHE Integration
1. **Epoch** - Real Arcium MPC for prediction markets
2. **PrivyLocker** - First Inco FHE on Solana
3. **hydentity** - Deep Arcium integration (placeholder code)

### Mobile Apps (Lower Priority)
1. **sip-mobile** - Production-ready, EAS builds
2. **Mukon-messenger** - Good but React Native only
3. **anon0mesh** - Innovative BLE but untestable

---

## Red Flag Summary

| Critical Issue | Projects Affected |
|----------------|-------------------|
| **Mock verifier** | SafeSol, triton-privacy-solana |
| **Broken crypto** | DarkTip (XOR), styx-stack (ECDH), Pigeon |
| **Fake commitment bug** | CloakCraft |
| **On-chain ZK incomplete** | SIP Protocol |
| **Simulation mode** | Obsidian (not real Arcium) |
| **Mobile only** | Mukon, anon0mesh, sip-mobile |
| **Wrong category** | Keyed, Attesta-Kit |

---

## Recommended Judging Flow

### Step 1: Test Live Demos (5 min each)
1. https://sps.guide - Privacy scanner
2. https://vex-zk.vercel.app - ZK identity
3. https://app.sip-protocol.org - Privacy SDK
4. https://aurorazkhost.vercel.app - Dark pool
5. https://cleanproof.xyz - Privacy pools

### Step 2: Verify ZK Claims
- Ask: "Show me the proof verification code"
- Check: Actual Noir/Circom circuits vs mocks
- Validate: On-chain verifier calls pairing precompiles

### Step 3: Deprioritize
- Mobile-only apps (can't test easily)
- Projects with no demo URL
- Mock verifiers or placeholder crypto

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-01 16:00 | **v2: Complete re-analysis** with web app priority, updated all tier scores, added live demo URLs, delivery channel assessment for all 81 projects |
| 2026-02-01 15:30 | Added Delivery Channel scoring (Web > Mobile), app type distribution |
| 2026-02-01 14:30 | Enhanced with working status, video links |
| 2026-02-01 12:00 | Initial generation |

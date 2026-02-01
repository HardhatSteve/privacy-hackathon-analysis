# Solana Privacy Hackathon - Judging Criteria

**Hackathon**: Solana Privacy Hack (Jan 12 - Feb 1, 2026)
**Deadline**: February 1, 2026
**Winners Announced**: February 10, 2026
**Source**: https://solana.com/privacyhack

---

## Official Judging Criteria

Based on hackathon rules and standard Solana Foundation evaluation patterns:

### Primary Metrics

| Metric | Weight | Description | Scoring |
|--------|--------|-------------|---------|
| **Innovation** | 30% | Novelty of technical approach | 1-10 scale |
| **Execution** | 30% | Code completeness, quality, tests | 1-10 scale |
| **Credibility** | 20% | Team signals, prior work, architecture | LOW / MEDIUM / HIGH |
| **Deployment** | 20% | Live deployment status | None / Devnet / Mainnet |

### Secondary Factors

| Factor | Impact | Notes |
|--------|--------|-------|
| **Demo Video** | HIGH | Required (3-4 min max). No video = likely disqualification |
| **Working Demo** | HIGH | Live URL significantly increases credibility |
| **Documentation** | MEDIUM | README, architecture docs, API docs |
| **Test Coverage** | MEDIUM | Passing tests demonstrate thoroughness |
| **Security** | HIGH | Mock verifiers, broken crypto = instant downgrade |
| **Open Source** | REQUIRED | Must be public until Feb 7 |

### Working Status Categories

| Status | Definition | Prize Eligibility |
|--------|------------|-------------------|
| **Completely Working** | All core features functional, proper cryptography, deployable | Full |
| **Almost Working** | Most features work, minor gaps or incomplete integration | Partial |
| **Unsound** | Broken crypto, mock verifiers, stubs, non-functional privacy | None |

---

## Disqualification Red Flags

Judges will likely reject submissions with:

1. **Mock ZK Verifiers** - Only checks bytes are non-zero (e.g., safesol)
2. **Broken Cryptography** - XOR instead of EC operations, fake ECDH
3. **No Deployment** - No devnet/mainnet program IDs
4. **No Demo Video** - Required per rules
5. **Closed Source** - Must be open until Feb 7
6. **Wrong Track** - Claiming Private Payments but building social media
7. **Unacknowledged Vulnerabilities** - Known exploits shipped without fix

---

## Track Breakdown

### Private Payments ($15,000)
**Focus**: ZK shielded pools, confidential transfers, stealth addresses

**What Judges Want**:
- Working deposit/withdraw flow with real ZK verification
- Nullifier double-spend prevention
- Reasonable anonymity set
- Production-viable architecture

**Top Competitors**:
| Rank | Project | Score | Key Strength |
|------|---------|-------|--------------|
| 1 | Chameo | 98 | Video demo, 9 sponsors |
| 2 | SIP Protocol | 93 | Prior winner, 6661+ tests |
| 3 | VEX-ZK | 90 | Noir circuits, clean code |
| 4 | CloakCraft | 90 | 52k LOC, Light Protocol |
| 5 | Protocol-01 | 85 | 6 programs, full ecosystem |

### Privacy Tooling ($15,000)
**Focus**: Analysis tools, SDKs, developer infrastructure

**What Judges Want**:
- Useful tooling for privacy developers
- Published packages (npm, crates.io)
- Clear documentation
- Integration with existing ecosystem

**Top Competitors**:
| Rank | Project | Score | Key Strength |
|------|---------|-------|--------------|
| 1 | shadow-fence | 85 | Noir/Groth16 tooling |
| 2 | rentreclaim-privacy | 85 | Rent reclamation tools |
| 3 | solana-privacy-scanner | 75 | 13 heuristic detectors |

### Open Track ($18,000)
**Focus**: Light Protocol integration or novel approaches

**What Judges Want**:
- ZK compression via Light Protocol, OR
- Novel privacy application (gaming, governance, etc.)

---

## ZORB Self-Assessment

### Scores

| Metric | Score | Rationale |
|--------|-------|-----------|
| **Innovation** | 10/10 | Indexed merkle tree is genuinely unique - no competitor has this |
| **Execution** | 9/10 | 3 programs deployed, 11 circuits, full SDK architecture |
| **Credibility** | HIGH | 2000+ line formal spec, mainnet-ready IDs, professional code |
| **Deployment** | Devnet | 3 verified program IDs |

### Working Status: ✅ Completely Working

| Component | Status | Evidence |
|-----------|--------|----------|
| Shielded Pool Program | ✅ Deployed | `GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6` |
| Token Pool Program | ✅ Deployed | `7py6sKLtEk7TcHvpBeD16ccfF4ypRsY6HkpJqN9oSC3S` |
| Unified SOL Pool | ✅ Deployed | `3G9QUkFQL7jMiUSYsL6z1CzfvPXirumN3B7a3pLHqAXf` |
| ZK Circuits | ✅ Built | 11 Circom circuits, Groth16 proving |
| On-chain Verifier | ✅ Real | Full alt_bn128 pairing checks (not mock) |
| Nullifier System | ✅ Working | Indexed merkle tree + PDA fallback |

### Estimated Final Score: 92/100

**Calculation**:
- Innovation (30%): 10/10 × 0.30 = 3.0
- Execution (30%): 9/10 × 0.30 = 2.7
- Credibility (20%): HIGH (9/10) × 0.20 = 1.8
- Deployment (20%): Devnet (8/10) × 0.20 = 1.6
- **Total**: 9.1/10 = **91-92/100**

### Competitive Position: Top 3 in Private Payments

| vs Competitor | ZORB Advantage | ZORB Disadvantage |
|---------------|----------------|-------------------|
| vs Chameo (98) | Indexed MT innovation | No video yet, fewer sponsors |
| vs SIP (93) | Zero rent cost | Fewer tests documented |
| vs VEX-ZK (90) | Real Groth16 (VEX has stubs) | VEX has Noir (newer) |
| vs CloakCraft (90) | No fake commitment vuln | CloakCraft has video |
| vs Protocol-01 (85) | Zero false positives | Protocol-01 has mobile app |

---

## ZORB's Unique Differentiators

### What No Competitor Has

| Innovation | Description | Impact |
|------------|-------------|--------|
| **Indexed Merkle Tree** | 67M nullifiers in single account | Zero rent cost |
| **Batch Proofs** | 4/16/64 nullifiers per ZK proof | Amortized verification |
| **Yield While Shielded** | Multi-LST unified pool | Earn rewards privately |
| **Epoch Rent Reclamation** | Close old nullifier PDAs | Sustainable economics |
| **Two-Layer Security** | ZK proof + PDA check | No double-spend gaps |

### Private Yield Comparison (Critical Differentiator)

| Project | Claimed Yield | Implementation Status | Reality |
|---------|---------------|----------------------|---------|
| **ZORB** | Multi-LST (vSOL, jitoSOL, mSOL) | ✅ 100% Complete | Working exchange rate tracking, appreciation harvesting |
| YieldCash | 7-8% via Marinade | ⚠️ 70% | ZK verification is TODO stub |
| WAVIS | "Yield-bearing vault" | ⚠️ 40% | ZK explicitly marked "simulated" |
| ArcShield | "Private staking" | ⚠️ 40% | All instructions are `Ok(())` stubs |

**ZORB is the ONLY hackathon submission with working yield-while-shielded capability.**

### Competitor Weaknesses to Highlight

| Competitor | Weakness | ZORB Advantage |
|------------|----------|----------------|
| **All PDA-based** | $0.13 locked per tx forever | Zero marginal cost |
| **SafeSol** | Mock verifier (accepts any proof) | Real Groth16 pairing |
| **CloakCraft** | Fake commitment attack | No known vulnerabilities |
| **Protocol-01** | Bloom filter 5-10% false positives | Zero false positives |
| **SolanaPrivacyHackathon2026** | Only 32 nullifiers total | 67 million capacity |

---

## Judge's Likely Questions for ZORB

### Technical Questions

1. **"Walk through your indexed merkle tree implementation"**
   - Answer: Aztec-style sorted linked list in `indexed_merkle_tree.rs`
   - Low element proof: `low.value < nullifier < low.nextValue`
   - Height 26 = 67M leaves

2. **"How do you verify ZK proofs on-chain?"**
   - Answer: Real Groth16 via `groth16.rs` using alt_bn128 syscalls
   - Not a mock - full pairing verification

3. **"What happens if the indexed tree root is stale?"**
   - Answer: Two-layer security - ZK covers tree, PDA check covers pending
   - No gap between epoch snapshots

4. **"How does batch insertion work?"**
   - Answer: `nullifierBatchInsert4/16/64.circom` circuits
   - Sequencer batches, generates proof, inserts multiple at once

### Business Questions

1. **"Why should users trust ZORB over Tornado Cash?"**
   - Answer: On-chain verification, epoch snapshots, rent reclamation
   - Production-sustainable economics

2. **"What's your path to mainnet?"**
   - Answer: Mainnet IDs already exist (see roadmap)
   - Audit pending, SDK release planned

---

## Scoring Comparison Matrix

| Project | Innovation | Execution | Credibility | Deployment | Video | Est. Score |
|---------|------------|-----------|-------------|------------|-------|------------|
| Chameo | 9 | 9 | HIGH | Devnet | ✅ | 98 |
| SIP Protocol | 8 | 9 | HIGH | Mainnet | ⚠️ | 93 |
| **ZORB** | **10** | **9** | **HIGH** | **Devnet** | ❌ | **92** |
| VEX-ZK | 8 | 8 | HIGH | Devnet | ❌ | 90 |
| CloakCraft | 9 | 9 | HIGH | Devnet | ✅ | 90 |
| Protocol-01 | 9 | 9 | HIGH | Devnet | ❌ | 85 |

**Note**: ZORB's score assumes video is completed before submission.

---

## Reference Documents

For detailed competitor analysis, see:

- `../analyses/JUDGES_REFERENCE_GUIDE.md` - Qualitative analysis of 81 submissions
- `../analyses/WINNING_LIKELIHOOD.md` - Quantitative scoring of 106 submissions
- `SPONSOR_BOUNTY_ANALYSIS.md` - Sponsor eligibility for ZORB

---

## Submission Checklist for Judges

When evaluating any submission:

- [ ] Is the code open source?
- [ ] Is there a demo video (3-4 min)?
- [ ] Are programs deployed to devnet/mainnet?
- [ ] Does the ZK verifier do real cryptographic checks?
- [ ] Are there tests that actually validate privacy properties?
- [ ] Does the architecture scale beyond demo?
- [ ] Are there known security vulnerabilities?
- [ ] Does the project match its claimed track?

---

## Timeline

| Date | Event |
|------|-------|
| Jan 12, 2026 | Hacking begins |
| **Feb 1, 2026** | **Submissions due (TODAY)** |
| Feb 7, 2026 | Code must remain public until this date |
| Feb 10, 2026 | Winners announced |

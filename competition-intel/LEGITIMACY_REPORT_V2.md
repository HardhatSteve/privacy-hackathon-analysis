# Solana Privacy Hackathon 2026 - Legitimacy Report v2

**Generated:** 2026-02-01
**Total Repos Analyzed:** 156
**Excluded Repos:** 46

## Scoring Methodology v2

Enhanced scoring based on cleanproof.xyz as a reference for legitimate projects.

### Key Improvements
- Detects modern ESLint flat config (`eslint.config.js`)
- Measures codebase size (source file count)
- Detects modern UI libraries (Radix, shadcn, Chakra)
- Detects browser ZK proof generation (snarkjs, circomlibjs)
- Detects compiled ZK artifacts (WASM, zkey files)
- Detects Light Protocol / ZK compression
- Professional README badges and live demo links
- E2E/integration tests
- Improved empty function detection (excludes React patterns)

### Scoring Categories (113 max before red flags)

| Category | Max | What's Measured |
|----------|-----|-----------------|
| Code Quality | 30 | Linting, TypeScript strict, codebase size, modern UI libs, CI/CD |
| Git History | 20 | Commit patterns, message quality (limited by shallow clones) |
| Technical Depth | 27 | ZK circuits, Anchor programs, crypto primitives, snarkjs |
| Documentation | 19 | README quality, badges, architecture, live demo links |
| Completeness | 17 | Tests, E2E, deployed IDs, demo video |
| Red Flags | -30 | TODOs, secrets, fake crypto, mock code |

### Classification Thresholds (Normalized 0-100)
- **POLISHED** (70+): Production-quality, clearly legitimate
- **SOLID** (55-69): Good effort, professional approach
- **BASIC** (40-54): Functional with meaningful implementation
- **ROUGH** (25-39): Minimal effort or incomplete
- **VIBE_CODED** (0-24): Likely AI-generated or template-based

## Summary

| Classification | Count | Percentage |
|---------------|-------|------------|
| POLISHED (70+) | 0 | 0% |
| SOLID (55-69) | 0 | 0% |
| BASIC (40-54) | 21 | 13.5% |
| ROUGH (25-39) | 98 | 62.8% |
| VIBE_CODED (0-24) | 37 | 23.7% |

## Reference Project: CleanProof

[cleanproof.xyz](https://cleanproof.xyz) serves as our benchmark for a legitimate hackathon project.

### CleanProof Characteristics
- **Live deployed product** at cleanproof.xyz
- **Multi-repo ecosystem**: cleanproof-frontend (43) + privacy-vault (43)
- **Real ZK implementation**: Groth16 proofs via snarkjs in browser
- **Professional README**: Badges, architecture docs, live demo link
- **Modern stack**: React 18, TypeScript, Vite, shadcn/ui, Framer Motion
- **76 source files** - substantial codebase
- **E2E tests** included

### Why CleanProof Scores BASIC (43) Not Higher
1. **Shallow clone**: Git history limited to 11/20 baseline
2. **Split repos**: Frontend + backend scored separately
3. **No demo video link**: Live site exists but no video in README
4. **No CI/CD**: Missing GitHub Actions

**Combined score estimate**: If repos were merged, ~55-60 (SOLID threshold)

## Top 21 Projects (BASIC Tier)

| Rank | Normalized | Repo | Tech Depth | Code Quality | Notes |
|------|------------|------|------------|--------------|-------|
| 1 | 53 | shadow | 22 | 10 | Noir circuits, Anchor programs |
| 2 | 52 | SolVoid | 19 | 15 | Circom circuits, good structure |
| 3 | 51 | AURORAZK_SUBMISSION | 22 | 7 | Noir circuits |
| 4 | 49 | Protocol-01 | 19 | 8 | Anchor + Circom |
| 5 | 48 | safesol | 19 | 8 | Circom circuits |
| 6 | 46 | noir-solana-private-transfers | 22 | 6 | Pure Noir implementation |
| 6 | 46 | shadow-fence | 15 | 9 | Noir + Circom |
| 6 | 46 | shadow-markets | 22 | 6 | Noir circuits |
| 6 | 46 | SolanaPrivacyHackathon2026 | 22 | 9 | Noir circuits |
| 6 | 46 | yieldcash-solana-privacy | 22 | 7 | Noir circuits |
| 11 | 45 | sip-website | 6 | 13 | Frontend with good docs |
| 11 | 45 | SolsticeProtocol | 16 | 11 | Circom circuits |
| 13 | 44 | private-dao-voting | 22 | 4 | Noir DAO voting |
| 14 | 43 | cleanproof-frontend | 10 | 11 | Reference project frontend |
| 14 | 43 | privacy-vault | 20 | 3 | CleanProof backend |
| 16 | 42 | chameo | 15 | 6 | Noir circuits |
| 16 | 42 | nahualli | 22 | 4 | Noir circuits |
| 16 | 42 | paraloom-core | 9 | 12 | Good code structure |
| 19 | 41 | sip-protocol | 21 | 4 | Noir circuits |
| 20 | 40 | cloakcraft | 10 | 7 | Noir + Circom |

## Technical Analysis

### ZK Technology Distribution

| Technology | Count | Example Projects |
|------------|-------|------------------|
| **Noir circuits** | 23 | shadow, AURORAZK_SUBMISSION, nahualli |
| **Circom/Groth16** | 16 | SolVoid, safesol, SolsticeProtocol |
| **snarkjs (browser)** | 8 | cleanproof-frontend, privacy-vault |
| **Light Protocol** | 3 | light-protocol-arcium-experiment |
| **No ZK** | 106 | Most repos |

### High Technical Depth Projects (20+ points)

These projects have substantial ZK implementations:

| Repo | Tech Depth | Components |
|------|------------|------------|
| shadow | 22 | Noir circuits + Anchor + Poseidon |
| AURORAZK_SUBMISSION | 22 | Noir circuits + Anchor + Poseidon |
| noir-solana-private-transfers | 22 | Noir circuits + Anchor + Poseidon |
| shadow-markets | 22 | Noir circuits + Anchor + Poseidon |
| SolanaPrivacyHackathon2026 | 22 | Noir circuits + Anchor + Poseidon |
| yieldcash-solana-privacy | 22 | Noir circuits + Anchor + Poseidon |
| nahualli | 22 | Noir circuits + Anchor + Poseidon |
| private-dao-voting | 22 | Noir circuits + Anchor + Poseidon |
| sip-protocol | 21 | Noir circuits + Anchor |
| privacy-vault | 20 | snarkjs + Circom + Poseidon |

## VIBE_CODED Projects (37 total)

Projects scoring below 25 show signs of:
- Template code with minimal customization
- No meaningful privacy implementation
- AI-generated boilerplate
- Empty or stub implementations

### Bottom 10
| Score | Repo | Primary Issues |
|-------|------|----------------|
| 8 | hushfold | Minimal implementation |
| 15 | Solana-Privacy-Hackathon-2026 | Template only |
| 15 | SHadoW-BID-PAYments | Minimal code |
| 15 | Shielded-Phosyn | Incomplete |
| 17 | Solana-Privacy-Hack- | Empty |
| 18 | anon0mesh | Basic structure only |
| 18 | anonset | Template |
| 18 | solana-pinocchio-amm-workshop | Tutorial, not privacy |
| 18 | solana-privacy-hack-backend | Incomplete |
| 18 | unified-trust-protocol-sdk | No implementation |

## Recommendations for Judges

### Focus Areas
1. **BASIC tier (21 projects)** - These have meaningful implementations
2. **High tech depth (22+)** - Real ZK circuit work
3. **Multi-repo projects** - Check for linked repos (cleanproof-frontend + privacy-vault)

### Manual Verification Checklist
- [ ] Does demo video exist? (scoring may miss video links)
- [ ] Is the live site working?
- [ ] Do ZK proofs actually verify?
- [ ] Are circuits non-trivial (check constraint count)?
- [ ] Is the codebase original or heavily templated?

### Red Flags to Check
- Multiple repos with identical structure (template spam)
- All commits in final 24 hours
- README mentions features not in code
- "Mock" or "simulated" in crypto code paths

## Data Files

- Full v2 scores: `legitimacy-scores-v2.json`
- CSV export: Generate with `jq -r '.[] | [.repo, .normalized_score, .classification] | @csv' legitimacy-scores-v2.json`
- Scoring script: `scripts/legitimacy-check.sh`

## Limitations

1. **Shallow clones**: All repos cloned with `--depth 1`, limiting git history analysis
2. **Multi-repo projects**: Frontend/backend splits are scored separately
3. **Demo videos**: May miss video links in non-standard formats
4. **Live deployments**: Not verified programmatically

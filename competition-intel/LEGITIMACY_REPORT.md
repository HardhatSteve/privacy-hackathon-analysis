# Solana Privacy Hackathon 2026 - Legitimacy Report

**Generated:** 2026-02-01
**Total Repos Analyzed:** 151
**Excluded Repos:** 46

## Summary

| Classification | Count | Percentage |
|---------------|-------|------------|
| POLISHED (80-100) | 0 | 0% |
| SOLID (60-79) | 0 | 0% |
| BASIC (40-59) | 14 | 9.3% |
| ROUGH (20-39) | 126 | 83.4% |
| VIBE_CODED (0-19) | 11 | 7.3% |

## Key Findings

### Scoring Limitations
- **Shallow clones**: All repos were cloned with `--depth 1`, limiting git history analysis
- **Git history baseline**: 8 points + 3 for commit message quality = 11 points typical
- **No repo scored above 44**: Ceiling limited by shallow clone constraints

### Top Tier: BASIC (40-59 points)

These 14 projects show the most complete implementations:

| Repo | Score | Tech Depth | Flags | Notes |
|------|-------|------------|-------|-------|
| shadow-markets | 44 | 15 | 0 | ZK circuits + solid structure |
| shadow | 44 | 15 | -2 | ZK circuits, minor TODOs |
| yieldcash-solana-privacy | 44 | 15 | 0 | ZK circuits |
| AURORAZK_SUBMISSION | 43 | 15 | -2 | ZK circuits, minor TODOs |
| shadow-fence | 43 | 11 | 0 | Anchor program |
| SolanaPrivacyHackathon2026 | 43 | 15 | -7 | ZK circuits, some flags |
| vapor-tokens | 43 | 15 | 0 | ZK circuits |
| noir-solana-private-transfers | 42 | 15 | 0 | Noir circuits |
| private-dao-voting | 42 | 15 | 0 | Noir circuits |
| SolsticeProtocol | 42 | 13 | 0 | Anchor program + crypto |
| safesol | 41 | 13 | -3 | Anchor program |
| SolVoid | 41 | 13 | -5 | Anchor program, some flags |
| nahualli | 40 | 15 | -2 | Noir circuits |
| Protocol-01 | 40 | 13 | -13 | Anchor program, many flags |

### VIBE_CODED Tier (0-19 points)

These 11 projects show significant quality concerns:

| Repo | Score | Primary Issues |
|------|-------|----------------|
| hushfold | 9 | Minimal implementation |
| anon0mesh | 12 | Very basic structure |
| solana-privacy-hack | 16 | Incomplete |
| Solana-Privacy-Hackathon-2026 | 17 | Incomplete |
| styx-stack-Solana- | 17 | Basic template |
| SHadoW-BID-PAYments | 18 | Minimal code |
| Shielded-Phosyn | 18 | Incomplete |
| zelana | 18 | Basic structure |
| ExposureCheck | 19 | Minimal implementation |
| sapp | 19 | Basic template |

## Score Distribution by Category

### Technical Depth Analysis

| Score Range | Count | Description |
|-------------|-------|-------------|
| 15-20 | 23 | Has ZK circuits + crypto primitives |
| 10-14 | 18 | Has Anchor/Pinocchio programs |
| 5-9 | 15 | Basic Solana deps |
| 0-4 | 95 | No significant privacy tech |

**Insight:** Only ~15% of repos have meaningful ZK/privacy implementations.

### Red Flags Distribution

| Flags | Count | Description |
|-------|-------|-------------|
| 0 | 89 | Clean |
| -1 to -5 | 45 | Minor issues (TODOs, some stubs) |
| -6 to -10 | 13 | Moderate concerns |
| -11+ | 4 | Significant quality concerns |

## ZK Technology Distribution

### Noir Circuits (23 repos)
Top projects using Noir:
- shadow (44), shadow-markets (44), yieldcash-solana-privacy (44)
- vapor-tokens (43), SolanaPrivacyHackathon2026 (43), AURORAZK_SUBMISSION (43)
- private-dao-voting (42), noir-solana-private-transfers (42)
- nahualli (40), solanaNoirWXMR (38)

### Circom/Groth16 Circuits (16 repos)
Top projects using Circom:
- shadow-fence (43), SolsticeProtocol (42)
- SolVoid (41), safesol (41)
- Protocol-01 (40), privacy-vault (37)
- mootvote (34), psol-v2 (33)

### Both Noir and Circom
- shadow-fence (43), cloakcraft (30)

### Anchor Programs (20+ repos)
Most ZK projects also have Anchor programs for on-chain verification.

## Recommendations

### For Judges

1. **Focus on BASIC tier first** - These 14 repos have demonstrated effort
2. **Check demo videos manually** - Only ~10% have linked demo videos
3. **Verify ZK implementations** - High tech_depth score doesn't guarantee working circuits
4. **Deep dive into red flags** - Repos with -5+ flags need careful review

### For Further Analysis

The following repos warrant deeper technical review:

1. **shadow** - Highest scored, has ZK circuits
2. **shadow-markets** - Clean implementation, no red flags
3. **noir-solana-private-transfers** - Noir circuits, clean
4. **private-dao-voting** - Noir circuits, clean
5. **vapor-tokens** - ZK circuits, clean

### Projects with Potential

These ROUGH tier repos scored 35+ and may have hidden quality:

- paraloom-core (39)
- PrivyLocker (39)
- solanaNoirWXMR (38)
- Arcshield (37)
- privacy-vault (37)
- Silent-Rails (37)

## Methodology

### Scoring Breakdown (100 points max)

| Category | Max Points | What's Measured |
|----------|------------|-----------------|
| Code Quality | 25 | Linting, TypeScript strict, error handling, file organization, CI/CD |
| Git History | 20 | Commit count, dev spread, message quality (limited by shallow clones) |
| Technical Depth | 20 | ZK circuits, Anchor programs, crypto primitives |
| Documentation | 15 | README quality, architecture docs, setup instructions |
| Completeness | 15 | Tests, deployed IDs, demo video |
| Red Flags | -30 max | TODOs, hardcoded secrets, fake crypto, mock code |

### Classification Thresholds

- **POLISHED** (80-100): Production-quality, clearly legitimate
- **SOLID** (60-79): Good effort, some rough edges
- **BASIC** (40-59): Functional but minimal polish
- **ROUGH** (20-39): Questionable effort/understanding
- **VIBE_CODED** (0-19): Likely AI-generated or copy-pasted

## Data Files

- Full scores: `legitimacy-scores.json`
- Scoring script: `scripts/legitimacy-check.sh`
- Batch runner: `scripts/batch-legitimacy-score.sh`
- Exclusions: `/tmp/exclusions.json`

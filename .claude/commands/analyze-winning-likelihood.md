# Analyze Winning Likelihood

Analyze each hackathon project's likelihood of winning based on Solana Privacy Hackathon criteria.

## Hackathon Overview

**Solana Privacy Hack** (Jan 12 - Feb 1, 2026)
- URL: https://solana.com/privacyhack

### Main Tracks

| Track | Prize | Focus |
|-------|-------|-------|
| **Private Payments** | $15,000 | Confidential/private transfer solutions |
| **Privacy Tooling** | $15,000 | Developer tools and infrastructure |
| **Open Track** | $18,000 | Creative privacy projects on Solana (Light Protocol) |

### Sponsor Bounties

| Sponsor | Prize | Requirements |
|---------|-------|--------------|
| **Privacy Cash** | $15,000 | Use Privacy Cash SDK for privacy-enabled apps |
| **Radr Labs** | $15,000 | Private transfers using ShadowWire + Bulletproofs |
| **Anoncoin** | $10,000 | Confidential token infrastructure |
| **Aztec/Noir** | $10,000 | ZK applications using Noir language |
| **Arcium** | $10,000 | Fully confidential DeFi with MPC |
| **Inco** | $6,000 | FHE (Fully Homomorphic Encryption) integration |
| **Helius** | $5,000 | Privacy projects using Helius RPC |
| **MagicBlock** | $5,000 | Real-time private apps with PER |
| **QuickNode** | $3,000 | Open-source privacy tooling |
| **Starpay** | $3,500 | Privacy-focused payments |
| **Range** | $1,500+ | Compliance + privacy integration |

### Submission Requirements

All submissions MUST have:
1. Open source code
2. Solana integration with privacy-preserving tech
3. Deployed to devnet or mainnet
4. Demo video (max 3 minutes)
5. Documentation on how to run/use

## Instructions

For each project in `repo-index.json`, analyze winning likelihood by:

### 1. Load Project Data

Read from:
- `repo-index.json` - sync state and basic heuristics
- `analyses/{repo_name}/LATEST.md` or `analyses/{repo_name}/{commit}.md` - technical due diligence

If no analysis file exists, note as "NEEDS_ANALYSIS".

### 2. Score Track Fit (0-25 points)

Determine best-fit track based on project features:

**Private Payments Track** indicators:
- Token transfers, shielded pools, payment links
- Stealth addresses, UTXO model
- Privacy Cash, velum, safesol type projects

**Privacy Tooling Track** indicators:
- SDKs, CLIs, libraries, scanners
- Developer infrastructure
- Privacy analysis tools, RPC layers

**Open Track** indicators:
- Novel applications (gaming, messaging, identity)
- Creative privacy use cases
- Light Protocol integration

Score:
- 25: Perfect fit, clearly targets one track
- 15: Good fit, could win in category
- 5: Weak fit, unclear positioning
- 0: Doesn't fit any track

### 3. Score Sponsor Bounty Eligibility (0-30 points)

Check for sponsor SDK/tool integration:

| Integration | Points | Detection |
|-------------|--------|-----------|
| Privacy Cash SDK | +10 | `@privacycash/*`, `privacy-cash` imports |
| Radr ShadowWire | +10 | `@radr/*`, `shadowwire` imports |
| Noir circuits | +10 | `Nargo.toml`, `.noir` files, `noir-lang` deps |
| Arcium MPC | +10 | `@arcium/*`, `arcium` imports, MXE references |
| Inco FHE | +10 | `@inco/*`, `inco-solana-sdk` |
| Helius RPC | +5 | `helius-rpc.com` URLs, `@helius-labs/*` |
| MagicBlock PER | +5 | `@magicblock/*`, ephemeral rollups |
| QuickNode | +5 | `quicknode` URLs |
| Light Protocol | +5 | `@lightprotocol/*`, compressed accounts |

Max 30 points (cap at 3 strong integrations).

### 4. Score Submission Completeness (0-25 points)

Check required elements:

| Element | Points | Detection |
|---------|--------|-----------|
| Demo video | +10 | YouTube/Loom link in README, `.mp4` files |
| Documentation | +5 | Detailed README, `/docs` folder |
| Devnet deployment | +5 | Program ID in README/code, `devnet` references |
| Mainnet deployment | +5 | Mainnet program ID (bonus) |
| Open source | +0 | Assumed (GitHub public repo) |

### 5. Score Technical Quality (0-20 points)

From technical due diligence doc:

| Quality Signal | Points |
|----------------|--------|
| Real ZK implementation (not mocked) | +5 |
| Passing tests | +5 |
| No critical security flags | +5 |
| Production-ready code | +5 |

Deductions:
| Red Flag | Points |
|----------|--------|
| Placeholder crypto (XOR, hardcoded) | -10 |
| No tests | -5 |
| Critical vulnerabilities | -10 |
| Incomplete/broken build | -5 |

### 6. Calculate Winning Likelihood

**Total Score** = Track Fit + Sponsor Bounty + Completeness + Technical Quality

| Score | Likelihood | Interpretation |
|-------|------------|----------------|
| 80-100 | VERY HIGH | Strong contender for prizes |
| 60-79 | HIGH | Could win track or bounty |
| 40-59 | MEDIUM | Competitive but gaps exist |
| 20-39 | LOW | Unlikely to place |
| 0-19 | VERY LOW | Missing critical elements |

### 7. Output Analysis

Write to `analyses/WINNING_LIKELIHOOD.md`:

```markdown
# Winning Likelihood Analysis

**Analysis Date**: {timestamp}
**Projects Analyzed**: {count}

## Top Contenders by Track

### Private Payments Track ($15k)
| Rank | Project | Score | Key Strengths |
|------|---------|-------|---------------|
| 1 | ... | ... | ... |

### Privacy Tooling Track ($15k)
| Rank | Project | Score | Key Strengths |
|------|---------|-------|---------------|
| 1 | ... | ... | ... |

### Open Track ($18k)
| Rank | Project | Score | Key Strengths |
|------|---------|-------|---------------|
| 1 | ... | ... | ... |

## Top Contenders by Sponsor Bounty

### Privacy Cash ($15k)
| Rank | Project | Score | Integration Quality |
|------|---------|-------|---------------------|
| 1 | ... | ... | ... |

### Arcium ($10k)
...

## Projects Needing Analysis
- {repo}: No technical due diligence doc found

## Full Ranking

| Rank | Project | Total | Track | Sponsor | Complete | Technical |
|------|---------|-------|-------|---------|----------|-----------|
| 1 | ... | ... | ... | ... | ... | ... |
```

Also update `repo-index.json` with:
```json
{
  "winning_analysis": {
    "total_score": 75,
    "likelihood": "HIGH",
    "best_track": "Private Payments",
    "sponsor_bounties": ["Privacy Cash", "Helius"],
    "submission_complete": true,
    "gaps": ["No demo video"]
  }
}
```

## Execution

Run analysis in parallel using Task agents for each project:
- Read technical due diligence
- Score each dimension
- Aggregate results

Output:
1. `analyses/WINNING_LIKELIHOOD.md` - Full analysis report
2. Updated `repo-index.json` - Per-project winning scores
3. Summary stats to console

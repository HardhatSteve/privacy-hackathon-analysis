# Generate Judge's Reference Guide

Analyze all hackathon submissions and generate a comprehensive judge's reference guide.

## Instructions

1. **Read the repo index** at `repo-index.json` to get the full list of submissions

2. **Read all analysis files** in `analyses/*.md` to gather detailed assessments

3. **For each project, extract:**
   - Project name and repository
   - Innovation summary (1-2 sentences)
   - Innovation score (1-10)
   - Execution score (1-10)
   - Team credibility (LOW/MEDIUM/HIGH) based on:
     - Code quality and organization
     - Test coverage
     - Documentation quality
     - Prior work mentioned
     - Solo vs team indicators
   - Deployment status (None/Devnet/Mainnet with program IDs)
   - Key innovation (what makes it unique)
   - Red flags (security issues, mocks, broken crypto, wrong category)
   - ZK system used (Groth16/Circom, Noir, Arcium MPC, Inco FHE, None)

4. **Categorize into tiers:**
   - **Tier 1**: Top contenders (Innovation 8+, Execution 8+, deployed, real crypto)
   - **Tier 2**: Strong submissions (Innovation 7+, Execution 7+, mostly complete)
   - **Tier 3**: Moderate quality (working but with significant issues)
   - **Tier 4**: Limited/incomplete (stubs, mocks, partial implementations)
   - **Tier 5**: Not competitive (wrong category, empty, pre-hackathon)

5. **Generate summary tables:**
   - Innovation highlights by category
   - Technology distribution (ZK systems used)
   - Sponsor bounty alignment
   - Red flag summary
   - Recommended judging questions

6. **Write the guide** to `analyses/JUDGES_REFERENCE_GUIDE.md` with:
   - Generation timestamp
   - Total submissions analyzed
   - Detailed assessment for each project
   - Quick reference tables
   - Summary statistics

## Output Format

The guide should follow this structure:

```markdown
# Solana Privacy Hackathon - Judge's Reference Guide

**Generated:** [timestamp]
**Total Submissions Analyzed:** [count]

## Scoring Legend
- Innovation: Novelty of approach (1-10)
- Execution: Code completeness and quality (1-10)
- Credibility: Team signals (LOW/MED/HIGH)
- Deployment: None / Devnet / Mainnet

## TIER 1: Top Contenders
[Detailed assessments with tables]

## TIER 2: Strong Submissions
[Detailed assessments]

## TIER 3: Moderate Quality
[Detailed assessments]

## TIER 4: Limited/Incomplete
[Detailed assessments]

## TIER 5: Not Competitive
[Brief list with reasons]

## Quick Reference Tables
[Innovation highlights, tech distribution, bounty alignment]

## Red Flag Summary
[Critical issues by project]

## Recommended Judging Questions
[Questions to expose weaknesses]

## Summary Statistics
[Counts by tier, technology, etc.]
```

## Key Evaluation Criteria

### Innovation Scoring
- 9-10: Novel approach not seen before, advances state of art
- 7-8: Creative application of known techniques, unique angle
- 5-6: Standard implementation of known patterns
- 3-4: Basic/incomplete implementation
- 1-2: Minimal or no innovation

### Execution Scoring
- 9-10: Production-ready, comprehensive tests, deployed
- 7-8: Feature-complete, some tests, working demo
- 5-6: Core features work, missing polish
- 3-4: Partial implementation, significant gaps
- 1-2: Stubs/mocks only, broken

### Red Flags to Check
- Mock/placeholder verifiers that accept any proof
- Broken cryptographic primitives (wrong ECDH, weak hashes)
- Claims vs reality mismatch in README
- Security vulnerabilities (plaintext secrets, missing auth)
- Wrong hackathon category (not privacy-focused)
- Closed source with no audit
- Pre-hackathon code with minimal changes

### Team Credibility Signals
- HIGH: Prior hackathon wins, extensive tests (100+), professional docs, deployed to mainnet
- MEDIUM: Clean code, some tests, good docs, devnet deployment
- LOW: Minimal tests, broken crypto, claims don't match code

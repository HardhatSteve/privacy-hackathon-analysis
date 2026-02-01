# Analyze Project Repo

Deep technical analysis of a single hackathon project repository.

## Usage

```
/analyze-repo <repo-name>
```

Example: `/analyze-repo shadow` or `/analyze-repo Protocol-01`

## Instructions

You are tasked with performing deep technical due diligence on a single hackathon project.

### 1. Validate Repo Exists

Check that the repo exists in `repos/<repo-name>/`:

```bash
ls -la repos/$REPO_NAME/
```

If not found, list available repos:
```bash
ls repos/ | head -20
```

### 2. Check if Re-analysis Needed

**IMPORTANT: Skip analysis if repo hasn't changed since last analysis.**

```bash
# Get current HEAD commit
CURRENT_COMMIT=$(cd repos/$REPO_NAME && git rev-parse HEAD 2>/dev/null || echo "unknown")

# Get last analyzed commit from repo-index.json
LAST_ANALYZED_COMMIT=$(jq -r ".repos[\"$REPO_NAME\"].analyzed_at_commit // \"none\"" repo-index.json)
LAST_ANALYZED_TIME=$(jq -r ".repos[\"$REPO_NAME\"].last_analyzed // \"never\"" repo-index.json)
```

**Decision Logic:**
- If `CURRENT_COMMIT == LAST_ANALYZED_COMMIT`: **SKIP** - Report "No changes since last analysis at {timestamp}"
- If commits differ or no previous analysis: **PROCEED** with full analysis

To force re-analysis even if unchanged, user can specify: `/analyze-repo <name> --force`

**If skipping, report:**
```
Repository: <repo-name>
Status: No changes detected
Last analyzed: <timestamp>
Commit: <hash>
Analysis file: analyses/<repo-name>.md

Use --force to re-analyze anyway.
```

### 3. Get Current State (if proceeding)

```bash
# Get git info
cd repos/$REPO_NAME
git log -1 --format="%H %ai %s" 2>/dev/null || echo "No git metadata"
git remote -v 2>/dev/null || echo "No remote"
```

### 4. Perform Deep Technical Analysis

Analyze the following aspects in detail:

#### 4.1 Architecture Analysis
- Entry points (main files, CLI, web app, program entrypoints)
- Directory structure and module organization
- Core abstractions and patterns used
- Build system (Anchor, Cargo, npm, etc.)

#### 4.2 Solana Integration
- Anchor programs (`programs/*/src/lib.rs`)
- Instructions and accounts
- PDAs and seeds
- CPI calls to other programs
- Deployed program IDs (check Anchor.toml, lib.rs)

#### 4.3 Privacy Implementation
Identify which privacy system is used:
- **Groth16/Circom** - Look for `.circom` files, `snarkjs`, `ark-groth16`
- **Noir** - Look for `Nargo.toml`, `.nr` files, `@noir-lang/*`
- **Arcium MPC** - Look for `arcium-*` crates, `@arcium-hq/*`
- **Inco FHE** - Look for `fhe`, `tfhe`, `inco-*`
- **Light Protocol** - Look for `@lightprotocol/*`, ZK compression
- **None** - No privacy primitives found

Analyze:
- Circuit files and constraints
- Cryptographic primitives (Poseidon, Pedersen, ECDH, etc.)
- Privacy guarantees claimed vs actually implemented
- **Critical**: Identify placeholder/mock crypto (XOR, hardcoded values, TODO comments)

#### 4.4 Dependencies
- Key Cargo.toml dependencies (solana-*, anchor-*, ark-*, circom-*)
- Key package.json dependencies (@solana/*, snarkjs, noir-*, etc.)
- External services (Helius, QuickNode, Privacy Cash, etc.)

#### 4.5 Completeness Assessment
- Working features vs stubs
- Test coverage (check for tests/, `npm test`, `anchor test`)
- Build status (does it compile?)
- Deployment status (devnet/mainnet program IDs)

#### 4.6 Security Red Flags
- Hardcoded keys or secrets
- Unsafe crypto patterns
- Centralization risks
- Missing verification logic
- Mock/placeholder security

#### 4.7 Demo Video & Submission Requirements

**CRITICAL: Demo video is REQUIRED for hackathon submission.**

Search for demo video links in:
```bash
# Check README and docs for video links
grep -riE "(youtube|youtu\.be|loom|vimeo|drive\.google|demo.*video|video.*demo)" repos/$REPO_NAME/README* repos/$REPO_NAME/*.md 2>/dev/null

# Check for video files
find repos/$REPO_NAME -name "*.mp4" -o -name "*.mov" -o -name "*.webm" 2>/dev/null
```

Look for:
- YouTube links (`youtube.com/watch`, `youtu.be/`)
- Loom recordings (`loom.com/share`)
- Vimeo (`vimeo.com/`)
- Google Drive videos (`drive.google.com`)
- Direct video files (`.mp4`, `.mov`, `.webm`)
- References to "demo", "video", "walkthrough"

**Other Submission Requirements:**
- [ ] Open source code (check LICENSE file)
- [ ] Solana integration with privacy tech
- [ ] Deployed to devnet/mainnet (check for program IDs)
- [ ] Demo video (max 3 minutes)
- [ ] Documentation on how to run/use

#### 4.8 Professionalism & Team Competency

**Evaluate codebase quality and team signals to gauge likelihood of successful execution.**

##### Code Quality Indicators
```bash
# Check for linting/formatting config
ls repos/$REPO_NAME/{.eslintrc*,.prettierrc*,rustfmt.toml,clippy.toml,.editorconfig} 2>/dev/null

# Check for CI/CD
ls repos/$REPO_NAME/.github/workflows/*.yml 2>/dev/null

# Check for TypeScript usage
ls repos/$REPO_NAME/tsconfig.json 2>/dev/null

# Count test files
find repos/$REPO_NAME -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.rs" 2>/dev/null | wc -l
```

**Score these factors (1-5 each):**

| Factor | What to Look For | Score |
|--------|------------------|-------|
| **Code Organization** | Clear directory structure, separation of concerns, modular design | 1-5 |
| **Documentation** | README quality, inline comments, API docs, architecture docs | 1-5 |
| **Type Safety** | TypeScript strict mode, Rust proper typing, no `any` abuse | 1-5 |
| **Error Handling** | Proper error types, no silent failures, user-friendly messages | 1-5 |
| **Testing** | Unit tests, integration tests, test coverage | 1-5 |
| **Code Style** | Consistent formatting, linting setup, clean code | 1-5 |

##### Git History Quality
```bash
# Recent commit messages (check for professionalism)
cd repos/$REPO_NAME && git log --oneline -20

# Number of contributors
git shortlog -sn --all | wc -l

# Commit frequency and patterns
git log --format="%ai" | head -50
```

**Evaluate:**
- **Commit Messages**: Professional (conventional commits, descriptive) vs sloppy ("fix", "update", "asdf")
- **Commit Frequency**: Steady progress vs last-minute rush
- **Contributors**: Solo vs team, experience signals

##### Presentation Quality
- **README**: Professional formatting, clear value prop, screenshots, badges
- **Demo Video**: Production quality vs screen recording with umms
- **Branding**: Consistent naming, logos, design system
- **Screenshots/Diagrams**: Architecture diagrams, UI previews

##### Team Competency Signals
```bash
# Check for linked profiles/previous work
grep -riE "(github\.com|twitter\.com|linkedin|portfolio)" repos/$REPO_NAME/README* 2>/dev/null

# Check package.json for author info
jq '.author, .contributors' repos/$REPO_NAME/package.json 2>/dev/null
```

**Red Flags (lower competency):**
- Copy-pasted boilerplate with minimal changes
- Inconsistent code style across files
- No error handling
- Hardcoded values everywhere
- No tests at all
- README is just project name
- Git history shows AI-generated commit messages
- All commits in final 24 hours

**Green Flags (higher competency):**
- Clean architecture patterns (DDD, Clean Architecture)
- Comprehensive test suite
- CI/CD pipeline with checks
- Professional documentation with examples
- Meaningful git history over hackathon period
- Security considerations documented
- Performance optimizations
- Accessibility considerations (for frontends)

##### Competency Score (derive overall 1-10)

```
Competency Score = (
  Code Organization +
  Documentation +
  Type Safety +
  Error Handling +
  Testing +
  Code Style +
  Git Quality (1-5) +
  Presentation (1-5)
) / 8 * 2  → Scale to 1-10
```

#### 4.9 Sponsor Bounty Eligibility

Check integration with hackathon sponsors:

| Sponsor | Detection | Prize |
|---------|-----------|-------|
| Privacy Cash | `privacy-cash`, `@privacycash/*` | $15,000 |
| Radr/ShadowWire | `shadowwire`, `bulletproofs`, `radr` | $15,000 |
| Anoncoin | `anoncoin`, confidential tokens | $10,000 |
| Aztec/Noir | `Nargo.toml`, `.nr`, `@noir-lang/*` | $10,000 |
| Arcium | `arcium-*`, `@arcium-hq/*`, MPC | $10,000 |
| Inco | `fhe`, `tfhe`, `inco` | $6,000 |
| Helius | `helius`, Helius RPC URLs | $5,000 |
| MagicBlock | `magicblock`, PER, ephemeral | $5,000 |
| QuickNode | `quicknode` RPC | $3,000 |
| Light Protocol | `@lightprotocol/*`, ZK compression | $18,000 (Open Track) |

### 5. Write Analysis File

Write comprehensive analysis to `analyses/<repo-name>.md`:

```markdown
# Technical Analysis: <repo-name>

**Repository:** <github-url>
**Commit:** <head-commit>
**Analysis Date:** <timestamp>
**Demo Video:** <video-url or "Not found">

## Executive Summary

<2-3 paragraph summary of what this project does, its privacy approach, and overall assessment>

## Architecture

<Directory structure, entry points, core abstractions>

## Solana Integration

<Programs, instructions, PDAs, CPIs, deployed IDs>

## Privacy Implementation

**ZK System:** <Groth16/Noir/Arcium MPC/Inco FHE/None>

<Detailed analysis of privacy tech, what's real vs mock>

## Dependencies

<Key dependencies and external services>

## Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| ... | ✅/⚠️/❌ | ... |

## Submission Requirements

| Requirement | Status | Details |
|-------------|--------|---------|
| Open Source | ✅/❌ | <license type or "No LICENSE file"> |
| Solana Integration | ✅/❌ | <program IDs or "None found"> |
| Deployed | ✅/❌ | <devnet/mainnet or "Not deployed"> |
| Demo Video | ✅/❌ | <video URL or "Not found"> |
| Documentation | ✅/❌ | <README quality> |

## Professionalism & Team Competency

### Code Quality Scores

| Factor | Score (1-5) | Notes |
|--------|-------------|-------|
| Code Organization | | |
| Documentation | | |
| Type Safety | | |
| Error Handling | | |
| Testing | | |
| Code Style | | |
| Git History | | |
| Presentation | | |

### Team Signals
- **Contributors:** <count>
- **Commit Quality:** <Professional/Mixed/Poor>
- **Development Pattern:** <Steady/Last-minute rush>
- **Previous Experience:** <Evidence or "Unknown">

### Competency Assessment
**Overall Competency Score: X/10**

<Brief assessment of team's ability to execute and maintain the project>

### Red/Green Flags
- 🟢 <positive signals>
- 🔴 <concerns>

## Security Assessment

<Red flags, risks, vulnerabilities>

## Sponsor Bounty Eligibility

| Sponsor | Eligible | Evidence |
|---------|----------|----------|
| ... | ✅/❌ | ... |

## Verdict

| Metric | Score | Notes |
|--------|-------|-------|
| **Hackathon Fit** | HIGH/MEDIUM/LOW | |
| **Technical Quality** | X/10 | |
| **Privacy Innovation** | X/10 | |
| **Team Competency** | X/10 | |
| **Production Readiness** | X/10 | |
| **Submission Ready** | ✅/❌ | All 5 requirements met? |

### Final Assessment
<2-3 sentences on overall quality and winning potential>

### Recommendations
<What would make this project stronger>
```

### 6. Update repo-index.json

Update the repo entry with:
- `analysis_file`: path to analysis
- `last_analyzed`: ISO timestamp
- `analyzed_at_commit`: the HEAD commit hash at time of analysis (for cache check)
- `technical_summary`: updated ZK system, program count
- `demo_video`: URL if found, or `null`
- `submission_ready`: boolean (has all 5 requirements)

Example entry:
```json
{
  "analysis_file": "analyses/shadow.md",
  "last_analyzed": "2026-02-01T08:30:00Z",
  "analyzed_at_commit": "c0c9ca3ba3db04d0f2c100e7b8f3cdf0c9d44788",
  "demo_video": "https://youtube.com/watch?v=xxx",
  "submission_ready": true,
  "technical_summary": {
    "zk_system": "Noir",
    "solana_programs": 1,
    "competency_score": 7,
    "code_quality": {
      "organization": 4,
      "documentation": 3,
      "type_safety": 4,
      "error_handling": 3,
      "testing": 2,
      "code_style": 4
    }
  },
  "team": {
    "contributors": 2,
    "commit_quality": "Professional",
    "dev_pattern": "Steady"
  }
}
```

### 7. Report Summary

After analysis, provide a brief summary to the user:
- Key findings
- Privacy tech used
- **Demo video** (URL or "Not found" - highlight if missing!)
- Sponsor bounty matches
- Submission readiness (all requirements met?)
- Overall assessment
- Link to full analysis file

**IMPORTANT:** If demo video is missing, explicitly warn that the project cannot be submitted without it.

## Output Format

The analysis should be thorough but readable. Use:
- Clear section headers
- Code blocks for file paths and commands
- Tables for structured data
- ✅/⚠️/❌ indicators for quick scanning
- Specific line numbers when referencing code

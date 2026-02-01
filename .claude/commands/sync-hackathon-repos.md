# Sync Hackathon Repos

Refetch, sync, and analyze all Solana Privacy Hackathon 2026 submissions from GitHub.

## Instructions

You are tasked with syncing hackathon repository submissions and performing technical due diligence. Follow these steps:

### 1. Load Current Index

Read the repo index from `repo-index.json` in the root directory. If it doesn't exist, create an empty index:

```json
{
  "last_full_sync": null,
  "hackathon_window": {
    "start": "2026-01-12",
    "end": "2026-02-01"
  },
  "repos": {}
}
```

### 2. Fetch Repos from GitHub API

Use the GitHub API to search for hackathon submissions:

```bash
# Primary search - "solana privacy" updated in hackathon window
curl -s "https://api.github.com/search/repositories?q=solana+privacy+pushed:2026-01-12..2026-02-01&sort=updated&order=desc&per_page=100" | jq '.items[] | {full_name, html_url, pushed_at, created_at, description}'

# Secondary search - "privacy hackathon solana"
curl -s "https://api.github.com/search/repositories?q=privacy+hackathon+solana&sort=updated&order=desc&per_page=100" | jq '.items[] | {full_name, html_url, pushed_at, created_at, description}'
```

### 3. For Each Repo - Clone or Update

For new repos:
```bash
git clone --depth 1 <repo_url> repos/<repo_name>
```

For existing repos:
```bash
cd repos/<repo_name> && git fetch origin && git reset --hard origin/HEAD
```

Record the HEAD commit hash for each repo.

### 4. Technical Due Diligence (PARALLEL)

**Run in parallel across all repos using Task agents.**

For each repo, spawn a Task agent to perform deep technical analysis:

```
Task: "Analyze {repo_name} at commit {head_commit}"
Agent: feature-dev:code-explorer
```

Each agent should trace through the entire codebase and produce:

#### 4.1 Architecture Analysis
- Entry points (main files, CLI, web app, program entrypoints)
- Directory structure and module organization
- Core abstractions and patterns used

#### 4.2 Solana Integration
- Anchor programs (`programs/*/src/lib.rs`)
- Instructions and accounts
- PDAs and seeds
- CPI calls to other programs

#### 4.3 Privacy Implementation
- ZK system used (Groth16, Noir, Arcium MPC, Inco FHE, none)
- Circuit files and constraints
- Cryptographic primitives (Poseidon, Pedersen, ECDH, etc.)
- Privacy guarantees claimed vs implemented
- **Critical**: Identify placeholder/mock crypto (XOR, hardcoded values, TODO comments)

#### 4.4 Dependencies
- Key Cargo.toml dependencies (solana-*, anchor-*, ark-*, circom-*)
- Key package.json dependencies (@solana/*, snarkjs, noir-*, etc.)
- External services (Helius, QuickNode, Privacy Cash, etc.)

#### 4.5 Completeness Assessment
- Working features vs stubs
- Test coverage
- Build status (does it compile?)
- Deployment status (devnet/mainnet program IDs)

#### 4.6 Security Red Flags
- Hardcoded keys or secrets
- Unsafe crypto patterns
- Centralization risks
- Missing verification logic

### 5. Write Versioned Analysis Doc

For each repo, write the analysis to a versioned file:

```
analyses/{repo_name}/{head_commit_short}.md
```

Example: `analyses/shadow/abc1234.md`

The doc should include:
- Commit hash and analysis timestamp
- All findings from Step 4
- Hackathon likelihood assessment
- Sponsor bounty eligibility (Arcium, Privacy Cash, Noir, Inco, Helius)

Also maintain a `analyses/{repo_name}/LATEST.md` symlink or copy pointing to the most recent analysis.

### 6. Score Hackathon Likelihood

Score each repo (0-100) using **weighted heuristics with time bias**:

| Heuristic | Points | Weight | Rationale |
|-----------|--------|--------|-----------|
| **Last-minute activity** | +30 | CRITICAL | Commits in final 48hrs (Jan 30 - Feb 1) strongly indicate hackathon |
| **Hackathon window activity** | +20 | HIGH | Any commits between Jan 12 - Feb 1, 2026 |
| **Created during hackathon** | +15 | HIGH | Repo created after Jan 12, 2026 |
| **README mentions hackathon** | +10 | MEDIUM | Contains "hackathon", "privacy hack", "solana privacy" |
| **Has Solana dependencies** | +10 | MEDIUM | Cargo.toml/package.json references Solana |
| **Has ZK circuits** | +5 | LOW | Contains .circom, .noir, Nargo.toml, or circuits/ |
| **Has Anchor program** | +5 | LOW | Contains programs/*/src/lib.rs |
| **Privacy keywords in code** | +5 | LOW | Code contains shielded, nullifier, commitment, stealth |

**Time Bias Logic:**
```
if last_commit within 48hrs of deadline (Jan 30-Feb 1):
    score += 30  # Last-minute rush is strongest signal
elif last_commit within hackathon window:
    score += 20
else:
    score += 0   # Activity outside window is suspicious
```

Classification:
- **HIGH** (70-100): Very likely hackathon submission
- **MEDIUM** (40-69): Possibly hackathon submission
- **LOW** (0-39): Unlikely to be hackathon submission

### 7. Update repo-index.json

Write the updated index with all repos and their states:

```json
{
  "last_full_sync": "2026-02-01T12:00:00Z",
  "hackathon_window": {
    "start": "2026-01-12",
    "end": "2026-02-01"
  },
  "repos": {
    "repo-name": {
      "remote_url": "https://github.com/org/repo",
      "head_commit": "abc123def456...",
      "head_commit_short": "abc123d",
      "last_commit_date": "2026-02-01T03:45:00Z",
      "last_synced": "2026-02-01T12:00:00Z",
      "analysis_file": "analyses/repo-name/abc123d.md",
      "hackathon_likelihood": 85,
      "likelihood_classification": "HIGH",
      "likelihood_reasons": [
        "Last-minute activity (+30)",
        "Created during hackathon (+15)",
        "Has Solana dependencies (+10)"
      ],
      "technical_summary": {
        "zk_system": "Noir",
        "solana_programs": 2,
        "completeness": "75%",
        "security_flags": ["missing nullifier check"],
        "sponsor_bounties": ["Noir/Aztec", "Helius"]
      }
    }
  }
}
```

### 8. Update README.md

Add/update the "Repo Sync Index" section in README.md showing:
- Last sync timestamp
- Total repos tracked
- Breakdown by likelihood classification
- Link to full `repo-index.json`
- Link to `analyses/` directory

## Execution Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FETCH FROM GITHUB API                                       │
│     ├─ Search: "solana privacy" pushed:2026-01-12..02-01        │
│     └─ Search: "privacy hackathon solana"                       │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CLONE OR UPDATE (sequential)                                │
│     ├─ New repo? → git clone --depth 1                          │
│     └─ Existing? → git fetch && git reset --hard                │
│     Record HEAD commit for each                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. TECHNICAL DUE DILIGENCE (PARALLEL)                          │
│     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│     │ Repo A  │ │ Repo B  │ │ Repo C  │ │ Repo D  │  ...        │
│     │ Agent   │ │ Agent   │ │ Agent   │ │ Agent   │             │
│     └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘             │
│          │           │           │           │                  │
│          ▼           ▼           ▼           ▼                  │
│     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│     │abc123.md│ │def456.md│ │ghi789.md│ │jkl012.md│             │
│     └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SCORE LIKELIHOOD (time-biased)                              │
│     ├─ Last-minute commits (48hrs before deadline)  +30         │
│     ├─ Hackathon window activity                    +20         │
│     ├─ Created during hackathon                     +15         │
│     ├─ README mentions hackathon                    +10         │
│     ├─ Technical signals from due diligence         +5-15       │
│     └─ Classify: HIGH (70+) / MEDIUM (40-69) / LOW (<40)        │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. UPDATE INDEX & README                                       │
│     ├─ repo-index.json (commits, scores, analysis links)        │
│     └─ README.md (summary stats)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Output

After completion, report:
1. Number of repos synced (new vs updated)
2. Number of repos analyzed (new analyses vs unchanged)
3. Any repos that failed to sync or analyze
4. Likelihood distribution (HIGH/MEDIUM/LOW counts)
5. Repos with changed HEAD commits since last sync
6. Top 10 repos by likelihood score
7. Sponsor bounty candidates by category

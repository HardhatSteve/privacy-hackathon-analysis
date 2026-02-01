# Solana Privacy Hackathon 2026 - Workspace

**Hackathon**: https://solana.com/privacyhack (Jan 12 - Feb 1, 2026)

This repository contains our hackathon submission materials and competitive intelligence on other submissions.

---

## Directory Structure

```
.
├── zorb-submission/          # Our Zorb Protocol submission
│   ├── docs/                 # Submission documentation
│   │   ├── FINAL_SUBMISSION.md
│   │   ├── VIDEO_SCRIPT.md
│   │   ├── SPONSOR_INTEGRATION_GUIDE.md
│   │   └── ...
│   ├── public-repo/          # Public-facing code (zorb-public)
│   │   ├── circuits/         # Noir ZK circuits
│   │   ├── programs/         # Solana programs
│   │   └── README.md
│   ├── video/                # Video submission assets
│   └── ZORB_TECHNICAL_CAPABILITIES.md
│
├── competition-intel/        # Hackathon competitor analysis
│   ├── repos/                # 200+ cloned competitor repos
│   ├── analyses/             # Per-project technical analyses
│   ├── WINNER_PREDICTIONS.md
│   ├── TECHNICAL_DUE_DILIGENCE_FRESH.md
│   ├── repo-index.json       # Sync tracking
│   └── legitimacy-scores.json
│
├── scripts/                  # Automation scripts
│   ├── sync-repos.sh
│   ├── build-repo-index.sh
│   └── ...
│
└── .claude/                  # Claude Code configuration
    └── commands/
```

---

## Quick Links

### Our Submission
- [Final Submission](zorb-submission/docs/FINAL_SUBMISSION.md)
- [Technical Capabilities](zorb-submission/ZORB_TECHNICAL_CAPABILITIES.md)
- [Video Script](zorb-submission/docs/VIDEO_SCRIPT.md)
- [Public Repository](zorb-submission/public-repo/)

### Competition Intel
- [Winner Predictions](competition-intel/WINNER_PREDICTIONS.md)
- [Technical Due Diligence](competition-intel/TECHNICAL_DUE_DILIGENCE_FRESH.md)
- [Competitor Profiles](competition-intel/COMPETITOR_PROFILES.md)
- [Legitimacy Scores](competition-intel/legitimacy-scores.json)

---

## Hackathon Stats

| Metric | Count |
|--------|-------|
| **Total Repos Tracked** | 200+ |
| **Detailed Analyses** | 97 |
| **Hackathon Submissions** | ~78 (HIGH/MEDIUM confidence) |
| **Lines of Code Reviewed** | ~500k+ |

### By ZK System

| ZK System | Count | Notable Projects |
|-----------|-------|------------------|
| **Groth16** | 16 | cloakcraft, Protocol-01, velum, SolVoid |
| **Noir** | 14 | chameo, shadow, sip-protocol, vapor-tokens |
| **Arcium MPC** | 12 | epoch, hydentity, Arcshield, OBSCURA-PRIVACY |
| **Inco FHE** | 5 | chameo, donatrade, PrivyLocker |
| **None/Other** | 50 | Analysis tools, SDKs, messaging apps |

---

## Commands

```bash
# Sync all competitor repositories
.claude/commands/sync-hackathon-repos.md

# Analyze a specific repo
.claude/commands/analyze-repo.md

# Score winning likelihood
.claude/commands/analyze-winning-likelihood.md
```

# Competition Intelligence

This directory contains analysis of hackathon competitors and the broader privacy ecosystem.

---

## Directory Structure

```
competition-intel/
├── repos/                    # Cloned competitor repositories (200+)
├── analyses/                 # Per-project technical analyses
│   ├── chameo.md
│   ├── Protocol-01.md
│   ├── sip-protocol.md
│   └── ... (97 analyses)
├── WINNER_PREDICTIONS.md     # Predicted winners by track
├── TECHNICAL_DUE_DILIGENCE_FRESH.md  # Deep code reviews
├── COMPETITOR_PROFILES.md    # Top competitor summaries
├── COMPETITIVE_ANALYSIS_DETAILED.md  # Market landscape
├── LEGITIMACY_FRAMEWORK.md   # Scoring methodology
├── legitimacy-scores.json    # Machine-readable scores
├── legitimacy-scores.csv     # Spreadsheet-friendly
└── repo-index.json           # Sync tracking with commit hashes
```

---

## Key Reports

| Report | Purpose |
|--------|---------|
| [WINNER_PREDICTIONS.md](WINNER_PREDICTIONS.md) | Predicted winners per track |
| [TECHNICAL_DUE_DILIGENCE_FRESH.md](TECHNICAL_DUE_DILIGENCE_FRESH.md) | Deep code analysis (500k+ LOC reviewed) |
| [COMPETITOR_PROFILES.md](COMPETITOR_PROFILES.md) | Top 10 competitor profiles |
| [legitimacy-scores.json](legitimacy-scores.json) | Automated legitimacy scoring |

---

## Hackathon Tracks

### Private Payments Track
- cloakcraft, Protocol-01, velum, chameo, SolVoid
- Dark-Null-Protocol, DarkTip, privacy-vault, safesol
- sip-protocol, vapor-tokens, yieldcash

### Privacy Tooling Track
- sip-mobile, solana-privacy-scanner, shadow-tracker
- solana-privacy-rpc, privacylens, ExposureCheck
- Mukon-messenger, pigeon, circuits

### Open Track
- SolanaPrivacyHackathon2026, PNPFUCIUS, sapp
- zelana, Obsidian, nahualli

---

## Competitor ZK Systems

| System | Count | Strengths | Weaknesses |
|--------|-------|-----------|------------|
| **Groth16** | 16 | Constant proof size, mature | Trusted setup |
| **Noir** | 14 | Modern DSL, good DX | Less battle-tested |
| **Arcium MPC** | 12 | Multi-party privacy | Devnet only |
| **Inco FHE** | 5 | Compute on encrypted | Slow |

---

## Common Vulnerabilities Found

1. **Mock ZK Verification** — Accept any proof structure
2. **Placeholder Crypto** — XOR as "Poseidon2"
3. **Centralized Relayers** — Single trust point
4. **No Trusted Setup Ceremony** — Groth16 security gap
5. **Client-Trusted Merkle Roots** — Not verified on-chain

---

## Syncing

```bash
# Sync all repositories
/sync-hackathon-repos

# Rebuild index
scripts/build-repo-index.sh
```

Last sync: See `repo-index.json` for timestamps

# Hackathon Submission Guidance Dataset Summary

**Purpose**: Provide data-driven guidance for filling out https://solanafoundation.typeform.com/privacyhacksub

---

## Dataset Overview

| Category | Count | Location |
|----------|-------|----------|
| Solana Privacy Hackathon competitor analyses | 111 | `competition-intel/analyses/` |
| Total analysis lines | 21,752 | — |
| ETHGlobal finalist videos | 20 | `submission/ETHGLOBAL_FINALIST_VIDEOS.md` |
| Competitor video URLs | 17 | `submission/ethglobal-finalist-videos.json` |

---

## Guidance Documents

| File | Purpose | Size |
|------|---------|------|
| `SUBMISSION_FORM_GUIDANCE.md` | Field-by-field best practices for all 11 form fields | 13KB |
| `ETHGLOBAL_FINALIST_VIDEOS.md` | Video URLs and format analysis | 5KB |
| `ethglobal-finalist-videos.json` | Programmatic video dataset | 5KB |
| `COMPETITOR_TECHNICAL_DESCRIPTIONS.md` | Example technical descriptions from top competitors | 7KB |

---

## Form Field Coverage

| Field | Guidance Available | Data Sources |
|-------|-------------------|--------------|
| 1. Project Name | Patterns, examples, dos/don'ts | 111 competitor names |
| 2. One-liner | Formula, character count, examples | 50+ competitor one-liners |
| 3. GitHub Repository | Structure patterns, README checklist | 50+ repo structures analyzed |
| 4. Presentation Video | Duration, structure, example URLs | 20 ETHGlobal finalist videos |
| 5. Live Demo Link | Hosting patterns, testing checklist | 40+ competitor demos |
| 6. Track Selection | Distribution stats, fit criteria | 111 projects categorized |
| 7. Light Protocol | Usage patterns | 15+ Light Protocol users |
| 8. Sponsor Bounties | Technology mapping, claim patterns | 14 sponsors analyzed |
| 9. Technical Description | Structure, word count, examples | 10 detailed examples |
| 10. Roadmap | Timeline structure, examples | 10+ competitor roadmaps |
| 11. Telegram Handle | Basic guidance | — |

---

## Key Files in zorb-submission/

```
zorb-submission/
├── FINAL_SUBMISSION.md          # Ground truth - all form answers
├── SOLANA_PRIVACY_HACK_SUBMISSION_FORM.md  # Form field reference
├── PRESENTATION_VIDEO_SCRIPT.md  # Video script
├── research/
│   ├── SPONSOR_BOUNTY_ANALYSIS.md
│   ├── SPONSOR_INTEGRATION_GUIDE.md
│   └── JUDGING_CRITERIA.md
└── docs/
    └── ZORB_TECHNICAL_CAPABILITIES.md
```

---

## Data Sufficiency Assessment

| Requirement | Status |
|-------------|--------|
| Form field specifications | Complete (11/11 fields documented) |
| Competitor examples | Complete (111 analyses) |
| Video format guidance | Complete (20 finalist videos) |
| Technical description templates | Complete (5 detailed examples) |
| Sponsor bounty mapping | Complete (14 sponsors analyzed) |
| Track distribution data | Complete (111 projects categorized) |

**Conclusion**: Dataset is sufficient to provide comprehensive guidance for all form fields.

---

## Quick Reference: ZORB Form Answers

From `FINAL_SUBMISSION.md`:

| Field | Value |
|-------|-------|
| Project Name | ZORB |
| One-liner | Free private transfers on Solana using an indexed merkle tree that eliminates per-transaction rent costs |
| GitHub | https://github.com/zorb-labs/solana-privacy-hackathon-2026 |
| Video | **TODO** |
| Live Demo | https://zorb.cash/stress-test |
| Track | Private payments |
| Light Protocol | No |
| Sponsor Bounties | None |
| Technical Desc | Complete (see FINAL_SUBMISSION.md) |
| Roadmap | Complete |
| Telegram | **TODO** |

---

*Dataset compiled January 31 - February 1, 2026*

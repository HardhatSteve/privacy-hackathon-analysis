# Submission Directory

Hackathon submission materials for ZORB — Solana Privacy Hackathon 2026.

## Working Principle

**Spec-first development**: The submission deliverables below are the ground truth. All related assets (video animations, screen recordings, graphics) should be derived from these specs. When in doubt, refer back to the deliverables — work from the spec outwards.

---

## Submission Deliverables (Ground Truth)

These files define what the final submission looks like. Treat as authoritative:

| File | Purpose |
|------|---------|
| `FINAL_SUBMISSION.md` | **Formal specification** for the Solana Privacy Hackathon submission. Contains all form answers, project claims, and technical descriptions. This is the canonical source of truth. |
| `PRESENTATION_VIDEO_SCRIPT.md` | 3-minute demo video script with narration and timing. **Must be consistent with FINAL_SUBMISSION.md** — all claims, numbers, and messaging should match. |

| `SOLANA_PRIVACY_HACK_SUBMISSION_FORM.md` | Typeform field reference (IDs, types, requirements) of the Solana Privacy Hackathon Submission Form |
| `docs/ZORB_TECHNICAL_CAPABILITIES.md` | Deep technical overview of ZORB architecture |
| `README.md` | Submission overview and quick links |

> **Consistency Rule**: `FINAL_SUBMISSION.md` is the spec. When updating claims, features, or messaging, update `FINAL_SUBMISSION.md` first, then propagate changes to `PRESENTATION_VIDEO_SCRIPT.md` and other assets.

---

## Product: Unified SOL

**Unified SOL** is ZORB's flagship privacy product that unifies SOL-equivalent liquid staking tokens (LSTs) into a single private asset while preserving yield.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      DEPOSIT                                │
│  SOL, stSOL, mSOL, jitoSOL, bSOL  ──►  Unified SOL Pool    │
│                                                             │
│  LST tokens converted to "virtual SOL" via exchange rate    │
│  virtual_sol = tokens × exchange_rate / 1e9                 │
│                                                             │
│  In-circuit: All treated as fungible virtual SOL            │
│  On-chain: Underlying LSTs continue earning staking yield   │
└─────────────────────────────────────────────────────────────┘
```

### Private Yield Mechanism

Users earn yield **while shielded** through a global reward accumulator:

```
┌─────────────────────────────────────────────────────────────┐
│                  HARVEST-FINALIZE CYCLE                     │
│                                                             │
│  1. HARVEST (per LST, each epoch ~18 min):                  │
│     appreciation = new_exchange_rate - old_exchange_rate    │
│     pendingAppreciation += vault_balance × appreciation     │
│                                                             │
│  2. FINALIZE (once per epoch):                              │
│     total_rewards = fees + appreciation                     │
│     rewardAccumulator += rewards / total_pool_size          │
│                                                             │
│  3. USER CLAIMS (in ZK circuit):                            │
│     user_reward = amount × (current - entry_accumulator)    │
│     Proven in zero-knowledge — amount never revealed        │
└─────────────────────────────────────────────────────────────┘
```

**Key insight**: The `rewardAccumulator` is a global per-unit value. When users withdraw, the ZK circuit computes their share based on when they deposited (entry accumulator) vs now — without revealing their balance.

### Formal Specification

**Authoritative reference**: [`../../app/docs/protocol/unified-sol-specification/v2.0.md`](../../app/docs/protocol/unified-sol-specification/v2.0.md)

This document contains:
- Complete state structures (`UnifiedSolPoolConfig`, `LstConfig`)
- Exchange rate mechanics and invariants
- Harvest-Finalize lifecycle with timing constraints
- Deposit/Withdrawal flows with CPI integration
- User reward calculation formula
- Security proofs (timing attack safety, conservation properties)
- Worked examples with concrete numbers

### Key Properties

| Property | Description |
|----------|-------------|
| **Fungibility** | All SOL variants appear identical in-circuit — transfers reveal nothing about underlying asset |
| **Yield-bearing** | Underlying LSTs (jitoSOL, mSOL, etc.) continue accruing staking rewards while shielded |
| **Unified Anonymity Set** | Larger privacy pool by combining all SOL-equivalent deposits |
| **Seamless Withdrawal** | Withdraw as any supported SOL variant (subject to pool liquidity) |

### Supported Assets

- Native SOL
- jitoSOL (Jito)
- mSOL (Marinade)
- stSOL (Lido)
- bSOL (SolBlaze)
- vSOL (validator-specific LSTs)

### Privacy Benefit

Without Unified SOL, a shielded pool for each LST would fragment the anonymity set. By treating all SOL-equivalents as fungible in-circuit, ZORB creates a single large anonymity set while users retain yield exposure.

---

## Research

Strategy, competitive positioning, and sponsor bounty analysis (in `research/`):

| File | Purpose |
|------|---------|
| `research/JUDGING_CRITERIA.md` | Hackathon judging rubric and how ZORB scores against it |
| `research/ZORB_HACKATHON_SUBMISSION_PLAN.md` | Full submission strategy and timeline |
| `research/ZORB_10HR_SUBMISSION_TRACKER.md` | Compressed 10-hour sprint plan |
| `research/SPONSOR_BOUNTY_ANALYSIS.md` | Analysis of sponsor bounties and ZORB eligibility |
| `research/SPONSOR_INTEGRATION_GUIDE.md` | Technical guide for integrating sponsor technologies |
| `research/SPONSOR_INTEGRATIONS.md` | Summary of which sponsors ZORB integrates |
| `research/LIGHT_PROTOCOL_INTEGRATION.md` | Detailed Light Protocol integration analysis |

## Presentation Video

**Ground truth**: `PRESENTATION_VIDEO_SCRIPT.md` defines the video structure, timing, narration, and visuals.

Assets derived from the script:
1. **Motion Canvas animations** (`presentation-video/`) — Visual scenes for Hook, Problem, Solution, CTA
2. **Screen recordings** — Live demo at zorb.cash/stress-test, code walkthrough, Solana Explorer
3. **Final edit** — All assets stitched together per script timing using FFmpeg

When creating or modifying video assets, always check `PRESENTATION_VIDEO_SCRIPT.md` first to ensure alignment with the spec.

## Submission Checklist

```
[ ] GitHub repo public: github.com/zorb-labs/solana-privacy-hackathon-2026
[ ] Demo video uploaded to YouTube (unlisted OK)
[ ] Form submitted: solanafoundation.typeform.com/privacyhacksub
[ ] Telegram handle added to form
[ ] Keep repo public until Feb 7 judging ends
```

## Source Code

The zorb.cash implementation lives in these repositories:

| Repository | GitHub | Local Path |
|------------|--------|------------|
| **App** (TypeScript monorepo) | https://github.com/49-labs/app | `../../app` |
| **Zore** (Solana programs) | https://github.com/49-labs/zorb | `../../zore` |
| **Submission** (public) | https://github.com/zorb-labs/solana-privacy-hackathon-2026 | — |

## Quick Links

- **Submission Form**: https://solanafoundation.typeform.com/privacyhacksub
- **Hackathon Page**: https://solana.com/privacyhack
- **ZORB Demo**: https://zorb.cash/stress-test
- **ZORB GitHub (Submission)**: https://github.com/zorb-labs/solana-privacy-hackathon-2026
- **ZORB GitHub (App)**: https://github.com/49-labs/app
- **ZORB GitHub (Programs)**: https://github.com/49-labs/zorb

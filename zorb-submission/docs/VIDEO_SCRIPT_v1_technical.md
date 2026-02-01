# ZORB Demo Video Script (3 minutes) — V1 TECHNICAL VERSION

> **Note**: This is the original technical version of the script, preserved for reference.
> The current script (VIDEO_SCRIPT.md) uses simplified consumer messaging.

**Recording Tools**: OBS, Loom, or QuickTime
**Upload To**: YouTube (unlisted is OK)
**Max Length**: 3 minutes

---

## VISUAL PREPARATION

### Assets Needed

**Animations** (from `../video-animations/`):
1. Hook animation — "exploring programmable privacy" framing
2. Problem animation — PDAs spawning, rent accumulating, ZEXE reference
3. Solution animation — concurrent nullifier tree with epoch cursors
4. Tech highlights animation — batch proofs, yield, innovations
5. CTA animation — team, vision, links (TO CREATE)

**Screen Recordings**:
1. zorb.cash wallet interface — for shield/send/unshield demo
2. zorb.cash/stress-test page — Break ZORB stress test with:
   - Private Transaction TPS counter
   - Solana TPS percentage indicator
   - Savings counter ($ saved vs rent-exempt nullifiers)
3. Solana Explorer tabs with devnet program IDs open
4. Code editor with shielded-pool/src/indexed_merkle_tree.rs open

### Screen Setup
- 1920x1080 resolution
- Clean desktop
- Browser with zorb.cash open
- Terminal ready for commands

---

## MOTION CANVAS ANIMATIONS

**Location**: `../video-animations/`
**Run**: `cd video-animations && npm run dev` → http://localhost:9000

### Scene Mapping

| Script Section | Scene File | Status | Notes |
|----------------|------------|--------|-------|
| [0:00-0:20] Hook | `scenes/hook.tsx` | ⚠️ UPDATE | Update for "exploring programmable privacy" framing |
| [0:20-0:45] Problem | `scenes/problem.tsx` | ⚠️ UPDATE | Add ZEXE reference, 2-year rent-exempt messaging |
| [0:45-1:20] Solution | `scenes/solution.tsx` | ⚠️ UPDATE | Add epoch cursors diagram, paper references |
| [1:20-1:35] Core Demo | — | SCREEN REC | No animation needed; record zorb.cash |
| [1:35-2:00] Break ZORB | — | SCREEN REC | No animation needed; record stress test |
| [2:00-2:30] Technical | — | SCREEN REC | Code editor + Solana Explorer |
| [2:30-2:50] Innovations | `scenes/techHighlights.tsx` | ✅ READY | May need minor updates |
| [2:50-3:00] CTA | — | ❌ CREATE | Need `scenes/cta.tsx` |
| — | `scenes/costComparison.tsx` | ✅ EXTRA | Available as B-roll if needed |

### Animation Updates Needed

1. **hook.tsx** — Change from "price problem" to "exploring programmable privacy"
2. **problem.tsx** — Add ZEXE paper reference, "2-year rent-exempt" language
3. **solution.tsx** — Add epoch cursors (earliest provable / current), paper URLs
4. **cta.tsx** — Create new scene with team/vision messaging

### Rendering Animations

```bash
cd video-animations
npm run dev
# Open http://localhost:9000
# Click Render → Export as MP4 or image sequence
# Output: video-animations/output/
```

---

## KEY POINTS TO COMMUNICATE

These are the critical messages that MUST come through in the video. Check each one is addressed:

### Framing & Problem Space
- [ ] **Exploring programmable privacy on Solana** — Not just a hackathon project; research-driven
- [ ] **Native private payments first** — Different from Token 2022 confidential transfers; this is unlinkable transfers
- [ ] **Unexplored problem space** — Private execution requires commitments and nullifiers (ZEXE paper)
- [ ] **Current approach is broken** — Nullifiers as PDAs cost 2-years rent to be rent-exempt (~$0.13/tx locked forever)

### Our Solution: Concurrent Nullifier Tree
- [ ] **Amortizable rent tending to zero** — Not locked forever; nullifier PDAs can be closed
- [ ] **Indexed Merkle Tree** — Used by Aztec in production (67M nullifiers in one account)
- [ ] **Global epoch cursors** — Earliest provable epoch + current epoch enable safe PDA closure
- [ ] **Two-layer security** — Immediate PDA coverage + background ZK batch insertion

### Technical References (Show in Video)
- [ ] **ZEXE paper** — Foundation for commitments + nullifiers model
- [ ] **Indexed Merkle Tree paper** — https://eprint.iacr.org/2021/1263.pdf
- [ ] **Aztec production implementation** — https://docs.aztec.network/.../indexed_merkle_tree

### Technical Differentiators
- [ ] **Nullifiers are unlinkable to commitments** — No on-chain correlation between deposits and spends
- [ ] **Batch proofs** — 4/16/64 nullifiers verified per ZK proof
- [ ] **Yield while shielded** — Multi-LST pool (vSOL, jitoSOL, mSOL) earning 7-8% APY

### Proof Points
- [ ] **Live demo on devnet** — zorb.cash running real transactions
- [ ] **Working stress test** — Break ZORB demonstrates throughput at scale
- [ ] **Savings counter** — Visual proof of rent savings accumulating

### Team & Vision
- [ ] **ZK team with Polygon experience** — Not our first ZK rodeo
- [ ] **Open sourcing as we go** — Contributing to the ecosystem, not just building
- [ ] **Kernel L2 rollup coming Q2 2026** — Private smart contracts on Solana

### Competitive Jabs (Optional)
- [ ] Other projects have "TODOs and stubs" for yield — ZORB actually works
- [ ] Mock verifiers = fake privacy — ZORB uses real Groth16

---

## SCRIPT

### [0:00-0:45] BREAK ZORB - "Live Demo First" ⭐

**VISUAL**: Screen recording — zorb.cash/stress-test (LEAD WITH THE PRODUCT)

**NARRATION**:
> "This is ZORB. Let's break it."
>
> [Click Start Stress Test — transactions start flowing]
>
> "Private transactions. Real ZK proofs. Watch the counter."
>
> [Point to TPS counter climbing]
>
> "Every one of these would cost $0.13 in rent on other protocols.
> On ZORB? Zero. Let me show you why."

---

### [0:45-1:10] THE PROBLEM - "The Nullifier Rent Problem"

**VISUAL**: Animation — PDAs spawning, rent accumulating

**NARRATION**:
> "Private execution requires nullifiers to prevent double-spending.
>
> On Solana, every protocol stores nullifiers as individual PDAs.
> Each PDA costs $0.13 in rent — locked forever.
>
> 10,000 transactions? $1,300 gone. This doesn't scale."

---

### [1:10-1:50] THE SOLUTION - "Indexed Merkle Tree"

**VISUAL**: Animation — architecture diagram with tree structure

**DIAGRAM ELEMENTS TO SHOW**:
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONCURRENT NULLIFIER TREE SCHEME                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GLOBAL CURSORS:                                                    │
│  ┌──────────────────────┐    ┌──────────────────────┐              │
│  │ Earliest Provable    │    │ Current Nullifier    │              │
│  │ Nullifier Epoch: 42  │    │ Epoch: 47            │              │
│  └──────────────────────┘    └──────────────────────┘              │
│                                                                     │
│  LAYER 1: IMMEDIATE                 LAYER 2: BACKGROUND            │
│  ─────────────────                  ──────────────────              │
│                                                                     │
│  User Spends ──► PDA Created        Sequencer batches               │
│                 (epoch 47)          nullifiers                      │
│                    │                     │                          │
│                    │                     ▼                          │
│                    │               ZK Batch Proof                   │
│                    │                     │                          │
│                    │                     ▼                          │
│                    │            Indexed Merkle Tree                 │
│                    │         (67M capacity, ~1KB account)           │
│                    │                     │                          │
│                    ▼                     ▼                          │
│         When epoch 47 < earliest ──► PDA Closable ──► RENT BACK    │
│              provable epoch                                         │
└─────────────────────────────────────────────────────────────────────┘
```

**REFERENCES TO SHOW** (briefly flash on screen):
- Indexed Merkle Tree paper: eprint.iacr.org/2021/1263.pdf
- Aztec implementation: docs.aztec.network/.../indexed_merkle_tree

**NARRATION**:
> "We present our concurrent nullifier tree scheme.
>
> Layer one: when you spend, a PDA is created for immediate double-spend protection.
>
> Layer two: nullifiers batch into an indexed merkle tree — the same structure
> Aztec uses in production. 67 million nullifiers in a single account.
>
> The key innovation: global epoch cursors. When a nullifier's epoch falls behind
> the earliest provable epoch, its PDA can be safely closed.
>
> Rent becomes amortizable, tending to zero. Other protocols lock rent forever.
> ZORB gives it back."

---

### [1:20-1:35] CORE FUNCTIONALITY - "Shield, Send, Unshield"

**VISUAL**: Screen recording — zorb.cash wallet interface

**NARRATION**:
> "Here's the core flow.
>
> [SHIELD] Deposit SOL into the shielded pool — now invisible on-chain.
>
> [SEND] Private transfer — no link between sender and receiver.
>
> [UNSHIELD] Withdraw when needed. Shield. Send. Unshield."

---

### [1:35-2:00] BREAK ZORB - "Live Demo on Devnet"

**VISUAL**: Screen recording — zorb.cash/stress-test

**UI ELEMENTS TO SHOW**:
- Private Transaction TPS counter
- Percentage of Solana TPS (e.g., "0.5% of network capacity")
- Savings counter: "$ saved vs rent-exempt nullifiers"

**NARRATION**:
> "This is Zorb.cash — live on devnet. Let's stress test it.
>
> [Click Start]
>
> Watch the TPS — real private transactions with our concurrent nullifier scheme.
>
> [Point to savings counter]
>
> See this? That's rent that would be locked forever on other protocols.
> $0.13 per transaction, accumulating live.
>
> With ZORB's amortizable rent? Tending to zero. Privacy that scales."

---

### [2:00-2:30] TECHNICAL DEPTH - "What We Built"

**VISUAL**: Screen recording — code editor + Solana Explorer

**NARRATION**:
> "[Show Rust code]
>
> Three Solana programs. Six Circom circuits, 35,000+ constraints.
>
> [Show Solana Explorer]
>
> Deployed to devnet — real Groth16 verification, not mock verifiers.
>
> Program ID: GkMmgCdkA5YRXi3BEUSgtGLC3m4iiT926GUVkfqauMU6"

---

### [2:30-2:50] INNOVATIONS - "What Makes ZORB Different"

**VISUAL**: Animation or screen recording — comparison table

**NARRATION**:
> "What no other Solana privacy protocol has:
>
> Zero rent costs — indexed merkle tree vs PDAs.
>
> Batch proofs — 4, 16, or 64 nullifiers per ZK proof.
>
> Yield while shielded — vSOL, jitoSOL, mSOL earning 7-8% APY.
> Other projects claim this; check their code — TODOs and stubs. Ours works.
>
> Privacy that scales. Privacy that earns."

---

### [2:50-3:00] CALL TO ACTION

**VISUAL**: Animation or screen recording — GitHub README with links

**NARRATION**:
> "We're a ZK team with experience from Polygon. This is just the start —
> programmable privacy on Solana is coming Q2.
>
> GitHub: github.com/zorb-protocol/zorb
>
> Privacy should be free. ZORB makes it possible."

---

## RECORDING TIPS

1. **Pacing**: Speak clearly but keep it tight. 3 minutes goes fast.
2. **Pauses**: Brief pauses for visuals, but don't linger.
3. **Audio**: Use a decent microphone. Background noise kills credibility.
4. **Retakes**: Record sections individually, combine with FFmpeg.
5. **Length**: Aim for 2:50. Leave buffer for editing.

## POST-PROCESSING

```bash
# Combine sections
ffmpeg -f concat -i clips.txt -c copy combined.mp4

# Compress for upload
ffmpeg -i combined.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k final.mp4

# Verify length
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 final.mp4
```

## UPLOAD CHECKLIST

- [ ] Video is under 3 minutes
- [ ] 1080p resolution
- [ ] Audio is clear
- [ ] All links visible on screen
- [ ] Upload to YouTube (unlisted OK)
- [ ] Test playback without login
- [ ] Copy URL to FINAL_SUBMISSION.md

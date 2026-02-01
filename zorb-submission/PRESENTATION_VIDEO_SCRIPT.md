# ZORB Demo Video Script (3 minutes)

**Recording Tools**: OBS, Loom, or QuickTime
**Upload To**: Vimeo (allows video replacement with stable link)
**Max Length**: 3 minutes

---

## CORE MESSAGING

ZORB has three key value propositions:

1. **Private Store of Value** — Your SOL, invisible on-chain
2. **Free Shielded Transfers** — No nullifier rent costs eating into your balance
3. **Yield-Bearing Shielded SOL** — Earn 7-8% APY while staying private

---

## VISUAL PREPARATION

### Assets Needed

**Animations** (from `../video-animations/`):
1. Hook animation — "Private store of value" positioning
2. Problem animation — Other protocols charge per transaction
3. Solution animation — Free transfers + yield explanation
4. CTA animation — Team, vision, links

**Screen Recordings**:
1. zorb.cash wallet interface — Shield, Send, Unshield flow
2. zorb.cash/stress-test — Demonstrate free transfers at scale
3. Yield dashboard — Show APY accumulating

### Screen Setup
- 1920x1080 resolution
- Clean desktop
- Browser with zorb.cash open

---

## MOTION CANVAS ANIMATIONS

**Location**: `../video-animations/`
**Run**: `cd video-animations && npm run dev` → http://localhost:9000

### Scene Mapping

| Script Section | Scene File | Status | Notes |
|----------------|------------|--------|-------|
| [0:00-0:30] Hook | `scenes/hook.tsx` | ⚠️ UPDATE | "Private store of value" framing |
| [0:30-1:00] Problem | `scenes/problem.tsx` | ⚠️ UPDATE | Other protocols charge $0.13/tx |
| [1:00-1:30] Free Transfers | `scenes/solution.tsx` | ⚠️ UPDATE | Simplify — focus on "free" |
| [1:30-2:00] Live Demo | — | SCREEN REC | zorb.cash stress test |
| [2:00-2:30] Yield | `scenes/techHighlights.tsx` | ⚠️ UPDATE | Focus on yield-bearing SOL |
| [2:30-3:00] CTA | `scenes/cta.tsx` | ✅ READY | Team + vision |

---

## KEY MESSAGES CHECKLIST

### Private Store of Value
- [ ] "Your SOL, invisible on-chain"
- [ ] "No one can see your balance or transactions"
- [ ] "Shield once, stay private"

### Free Shielded Transfers
- [ ] "Other protocols charge $0.13 per private transaction"
- [ ] "ZORB transfers are free — no nullifier rent"
- [ ] "Send privately without fees eating your balance"

### Yield-Bearing Shielded SOL
- [ ] "Your shielded SOL earns 7-8% APY"
- [ ] "Privacy + yield — no tradeoff"
- [ ] "Backed by liquid staking (vSOL, jitoSOL, mSOL)"

---

## SCRIPT

### [0:00-0:30] HOOK - "Private Store of Value" ⭐

**VISUAL**: Animation — ZORB logo reveal, shielded vault concept

**NARRATION**:
> "What if your SOL could be invisible?
>
> ZORB is a private store of value on Solana.
>
> Shield your SOL. Send it privately. Earn yield while it's hidden.
>
> No one sees your balance. No one tracks your transactions.
>
> Let me show you how it works."

---

### [0:30-1:00] THE PROBLEM - "Privacy Shouldn't Cost You"

**VISUAL**: Animation — Cost comparison, other protocols charging per tx

**NARRATION**:
> "Every other privacy protocol on Solana charges you per transaction.
>
> They store nullifiers as PDAs — that's $0.13 locked forever, every time you send.
>
> 100 transactions? $13 gone. 1,000? $130 you'll never get back.
>
> Privacy shouldn't drain your wallet. ZORB fixes this."

---

### [1:00-1:30] FREE TRANSFERS - "Send Without Fees"

**VISUAL**: Animation — Zero cost transfers, simple flow diagram

**NARRATION**:
> "ZORB transfers are free.
>
> We use an indexed merkle tree instead of per-transaction PDAs.
> One structure holds millions of nullifiers — no rent per send.
>
> Shield your SOL once. Send as many times as you want.
> Your balance stays yours."

---

### [1:30-2:00] LIVE DEMO - "See It Work"

**VISUAL**: Screen recording — zorb.cash/stress-test

**NARRATION**:
> "This is zorb.cash running live.
>
> [Click Start Stress Test]
>
> Watch — private transactions flowing. Real ZK proofs. Zero transfer fees.
>
> [Point to counter]
>
> See this savings counter? That's money other protocols would take from you.
> On ZORB, you keep it all."

---

### [2:00-2:30] YIELD - "Earn While You Hide"

**VISUAL**: Animation — Yield accumulating, LST logos (vSOL, jitoSOL, mSOL)

**NARRATION**:
> "Here's what makes ZORB different: your shielded SOL earns yield.
>
> We pool liquid staking tokens — vSOL, jitoSOL, mSOL.
> Your private balance grows at 7-8% APY.
>
> Other projects promise this. Check their code — it's TODOs and stubs.
> ZORB actually works.
>
> Privacy that pays you."

---

### [2:30-3:00] CALL TO ACTION

**VISUAL**: Animation — ZORB logo, links, tagline

**NARRATION**:
> "ZORB: Private store of value on Solana.
>
> Free transfers. Yield-bearing privacy. Real ZK proofs.
>
> Try it now at zorb.cash
>
> GitHub: github.com/zorb-labs/solana-privacy-hackathon-2026
>
> Privacy should be free. ZORB makes it possible."

---

## RECORDING TIPS

1. **Pacing**: Conversational but confident. Don't rush.
2. **Emphasis**: Hit the three pillars — private, free, yield-bearing
3. **Audio**: Good microphone. Background noise kills credibility.
4. **Length**: Aim for 2:50. Leave buffer for editing.

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
- [ ] Upload to Vimeo (stable link for updates)
- [ ] Test playback without login
- [ ] Copy URL to FINAL_SUBMISSION.md

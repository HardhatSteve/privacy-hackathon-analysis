# ZORB Demo Video Script (3 minutes)

**Recording Tools**: OBS, Loom, or QuickTime
**Upload To**: Vimeo (allows video replacement with stable link)
**Max Length**: 3 minutes

---

<video_outline>

The video must hit all messages below (in order):

0. **Introduction — ZORB**
   1. ZORB is exploring programmable privacy on Solana
   2. We started with private payments — fully unlinkable transactions using commitments and nullifiers (the ZEXE model)[^1]
   3. Architecturally similar to Zcash shielded payments[^2]
   4. This problem space is largely unexplored on Solana

1. **Free Shielded Transfers**
   - **TODO:** Two birds, one stone — bring STARKs and Circle-FRI onto Solana through Groth16 (recursive verification)
   1. ZEXE model[^1] requires nullifiers to prevent double-spending
   2. On Solana, nullifiers stored as PDAs = $0.13 rent locked per tx
   3. "Other protocols charge $0.13 per private transaction" — e.g., PrivacyCash has $X locked in nullifier PDAs (show on-chain data)
   4. ZORB solution: indexed merkle tree (67M nullifiers in ~1KB)
   5. "ZORB transfers are free — no nullifier rent"
   6. "Send privately without fees eating your balance"
   7. Stress test demo: show throughput as % of Solana TPS + total $ saved (rent that would have been locked)

2. **Yield-Bearing Shielded SOL**
   1. Introduce **Unified SOL** — the product name (show icon)
   2. Groups SOL-equivalents (SOL, vSOL, jitoSOL, mSOL) into a single fungible unit for shielded payments
   3. Yield-bearing: underlying LSTs continue earning staking rewards while shielded — "Your shielded SOL earns 7-8% APY"
   4. "Privacy + yield — no tradeoff"
   5. Technical: ZK circuit computes yield share using global reward accumulator (amount never revealed)
   6. Technical: `unified-sol-pool` Solana program handles LST vaults, exchange rates, harvest-finalize cycle
   7. "Unified pool = larger anonymity set" (separate pools per LST would fragment privacy)

3. **zorb.cash — The Product**
   1. zorb.cash is an early product that combines both: free transfers + yield-bearing privacy
   2. Wallet: deterministic signature wallet; can also do native ed25519 Solana keypair spend authorizations via STARK + in-browser WASM proving
   3. **Demo: Basic flows**
      1. Shielded addresses — generate/display
      2. Shield — deposit SOL/LST into shielded pool
      3. Send — private transfer to another shielded address
      4. Unshield — withdraw back to public Solana address
   4. **"Break ZORB" stress test**
      1. Demo environment: devnet / localnet (specify which)
      2. Infrastructure: [X instances of Y] — mention prover setup
      3. Throughput verified: [X tx/sec] achieved (test before recording)
   3. "Shield your SOL. Send for free. Earn while hidden."
   4. **Note (do not claim, just frame correctly):**
      - Decentralized protocol — no operators, no custody, permissionless
      - Compliance path exists: proof of innocence / association sets

</video_outline>

<references>

[^1]: **ZEXE** — "ZEXE: Enabling Decentralized Private Computation" (Bowe, Chiesa, Green, Miers, Mishra, Wu). IEEE S&P 2020. The commitment + nullifier model for private computation. Paper: https://eprint.iacr.org/2018/962

[^2]: **Zerocash** — "Zerocash: Decentralized Anonymous Payments from Bitcoin" (Ben-Sasson et al.). IEEE S&P 2014. Origin of the commitment/nullifier paradigm used in Zcash and ZEXE. Paper: https://eprint.iacr.org/2014/349

</references>

---

<visual_preparation>

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

</visual_preparation>

<motion_canvas_animations>

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

</motion_canvas_animations>

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

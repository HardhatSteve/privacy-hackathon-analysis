# ZORB Demo Video Script (3 minutes)

**Recording Tools**: OBS, Loom, or QuickTime
**Upload To**: Vimeo (allows video replacement with stable link)
**Max Length**: 3 minutes

---

<video_outline>

The video must hit all messages below (in order):

0. **Introduction — ZORB**
   1. ZORB is exploring programmable privacy on Solana similar to Aztec and Miden
   2. We're starting with private payments — fully unlinkable transactions using commitments and nullifiers (the ZEXE model)[^1]
   3. Architecturally similar to Zcash shielded payments[^2]

1. **Free Shielded Transfers**
   1. ZEXE model[^1] requires nullifiers to prevent double-spending
   2. On Solana, nullifiers stored as PDAs = $0.13 rent locked per tx
   3. "Other protocols charge $0.13 per private transaction" — e.g., PrivacyCash has $X locked in nullifier PDAs (data: `../privacy-cash-analysis/`)
   4. ZORB solution: indexed merkle tree (67M nullifiers in ~1KB)
   5. "ZORB transfers are free — no nullifier rent"
   6. "Send privately without fees eating your balance"
   7. Stress test demo: show throughput as % of Solana TPS + total $ saved (rent that would have been locked)

2. **Yield-Bearing Shielded SOL** (**)
   1. Introduce **Unified SOL** — the product name (show icon)
   2. Groups SOL-equivalents (SOL, vSOL, jitoSOL, mSOL) into a single fungible unit for shielded payments
   3. Yield-bearing: underlying LSTs continue earning staking rewards while shielded — "Your shielded SOL earns 7-8% APY"
   4. "Privacy + yield — no tradeoff"
   5. Technical: ZK circuit computes yield share using global reward accumulator (amount never revealed)
   6. Technical: `unified-sol-pool` Solana program handles LST vaults, exchange rates, harvest-finalize cycle
   7. "Unified pool = larger anonymity set" (separate pools per LST would fragment privacy)
   8. The value of a privacy network is its useful state — here, that's the anonymity set you get to use

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
   5. "Shield your SOL. Send for free. Earn while hidden."
   6. **Note (do not claim, just frame correctly):**
      - Decentralized protocol — no operators, no custody, permissionless
      - Compliance path exists: proof of innocence / association sets

4. **Future — Two Birds, One Stone**
   - **TODO:** Bring STARKs and Circle-FRI onto Solana through Groth16 (recursive verification)

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

> **TODO: Match tone/presentation format to ETH hackathon finalists**
> Review winning ETHGlobal/Devcon demo videos for pacing, energy, and production style before finalizing.

---

### [0:00-0:25] Introduction — ZORB

**VISUAL**: ZORB logo animation, Solana logo

**NARRATION**:
> "ZORB is exploring programmable privacy on Solana similar to Aztec and Miden.
>
> We're starting with private payments — fully unlinkable transactions using commitments and nullifiers. If you know Zcash, this is architecturally similar. The ZEXE model.
>
> This problem space is largely unexplored on Solana. Let me show you what we've built."

---

### [0:25-1:10] Free Shielded Transfers

**Privacy Hackathon Angles** (points judges value):
- Novel approach to a known problem (nullifier storage cost)
- Real cryptographic implementation (Groth16 on-chain verification)
- Comparison to existing protocols with on-chain evidence
- Scalability claim with concrete numbers (67M nullifiers)
- Working demo, not just theory

**VISUAL**: Animation showing PDA costs, then indexed merkle tree solution

**NARRATION**:
> "Private transactions need nullifiers — they prevent double-spending. On Solana, every protocol stores these as PDAs. Each one locks thirteen cents in rent. Forever.
>
> [Show on-chain data]
>
> Look at PrivacyCash — they've locked $X in nullifier PDAs. That money is gone.
>
> ZORB takes a different approach. We use an indexed merkle tree — the same structure Aztec uses in production. Sixty-seven million nullifiers in about one kilobyte.
>
> The result? ZORB transfers are free. No nullifier rent eating your balance.
>
> [Show stress test counter]
>
> Watch this — every transaction you see would have cost thirteen cents elsewhere. That counter shows real money saved."

---

### [1:10-1:50] Yield-Bearing Shielded SOL

**VISUAL**: Unified SOL icon, LST logos (jitoSOL, mSOL, vSOL), anonymity set diagram

**NARRATION**:
> "Now here's what makes ZORB different: Unified SOL.
>
> We group SOL-equivalents — native SOL, jitoSOL, mSOL, vSOL — into a single fungible unit for shielded payments.
>
> Why does this matter? Privacy networks derive value from their anonymity set. Separate pools for each token would fragment that. Five small pools are easier to trace than one large pool.
>
> Unified SOL combines them all. Larger anonymity set, stronger privacy.
>
> And here's the bonus: your shielded SOL earns yield. The underlying LSTs keep earning staking rewards — seven to eight percent APY — while fully private.
>
> Privacy plus yield. No tradeoff."

---

### [1:50-2:45] zorb.cash — The Product

**VISUAL**: Screen recording of zorb.cash wallet interface

**NARRATION**:
> "zorb.cash is our early product that brings this together.
>
> [Demo: Generate shielded address]
>
> Create a shielded address.
>
> [Demo: Shield]
>
> Shield your SOL — deposit into the private pool.
>
> [Demo: Send]
>
> Send to another shielded address. No one sees the amount. No one sees the recipient.
>
> [Demo: Unshield]
>
> Unshield when you need to — withdraw back to any Solana address.
>
> [Show Break ZORB stress test]
>
> And here's our stress test running on devnet. Real ZK proofs. Real throughput. That's X transactions per second — Y percent of Solana's capacity, dedicated to private payments.
>
> Every one of those would have cost rent elsewhere. Here, it's free."

---

### [2:45-3:00] Close

**VISUAL**: ZORB logo, links, tagline

**NARRATION**:
> "ZORB. Shield your SOL. Send for free. Earn while hidden.
>
> Try it at zorb.cash. Code is open source on GitHub.
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

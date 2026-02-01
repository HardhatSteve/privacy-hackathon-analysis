# ZORB Demo Video Script — ETH Hackathon Winner Format

**Based on**: Analysis of 6+ ETHGlobal/ZK Hack winning patterns
**Target Length**: 2:30-2:45 (ETH winners are tighter)
**Key Insight**: Demo first, explain second. Show working product in first 15 seconds.

---

## ETH Winner Patterns Applied

| Pattern | How ZORB Applies It |
|---------|---------------------|
| Working demo in first 30s | Live zorb.cash demo at 0:10 |
| Sponsor SDK callouts | Light Protocol, Groth16, Helius explicit mentions |
| Regulatory awareness | "Not another mixer" framing |
| Novel ZK circuits | Custom Circom (35K constraints), not templates |
| Tight pacing | 2:30 total, no filler |
| Single deep innovation | Indexed Merkle Tree focus, not feature list |

---

## SCRIPT (2:30)

### [0:00-0:15] COLD OPEN — Working Demo First

**VISUAL**: Screen recording — zorb.cash wallet, already loaded

**NARRATION**:
> "This is ZORB — private payments on Solana, live on devnet right now.
>
> [Click Shield] Watch. SOL goes in...
>
> [Click Send] ...transfers privately...
>
> [Click Unshield] ...and comes out. No link between sender and receiver."

**WHY**: ETH winners show working product immediately. Judges scroll fast — hook them with proof it works.

---

### [0:15-0:35] THE PROBLEM — Academic Framing

**VISUAL**: Animation — ZEXE paper reference, PDA diagram

**NARRATION**:
> "Private execution needs nullifiers — this comes from ZEXE, the foundational paper.
>
> On Solana, every project stores nullifiers as PDAs. Each one costs $0.13 in rent, locked forever.
>
> A million transactions? $130,000 gone. This is why privacy protocols fail to scale."

**WHY**: Academic reference (ZEXE) signals depth. ETH judges respect cryptographic foundations.

---

### [0:35-1:05] THE SOLUTION — One Innovation, Deep

**VISUAL**: Animation — Indexed Merkle Tree + epoch cursors

**NARRATION**:
> "We built a concurrent nullifier tree scheme.
>
> Instead of permanent PDAs, nullifiers go into an indexed merkle tree — the same structure Aztec uses in production. 67 million nullifiers in one account.
>
> [Show epoch cursor diagram]
>
> The key: global epoch cursors. When a batch is proven, earlier PDAs become closable. Rent returns to users.
>
> [Flash paper URLs]
>
> Not our invention — we're applying proven cryptography. Indexed Merkle Trees: eprint.iacr.org/2021/1263."

**WHY**: ZK Hack Istanbul winners won with "deep cryptography" focus. One innovation explained well beats many features.

---

### [1:05-1:30] STRESS TEST — Proof at Scale

**VISUAL**: Screen recording — zorb.cash/stress-test

**NARRATION**:
> "Let's stress test it.
>
> [Click Start — TPS counter runs]
>
> Real transactions. Real Groth16 proofs — not mock verifiers.
>
> [Point to savings counter]
>
> See this counter? That's rent that would be locked forever on other protocols. With ZORB, it returns to zero.
>
> [Show counter accumulating]
>
> $50... $100... $200 saved. Privacy that actually scales."

**WHY**: ETHGlobal Paris winners all had live demos with metrics. Numbers prove it works.

---

### [1:30-1:55] TECHNICAL PROOF — Code + Explorer

**VISUAL**: Split screen — VS Code + Solana Explorer

**NARRATION**:
> "[Show indexed_merkle_tree.rs]
>
> Three Solana programs. Six custom Circom circuits — 35,000 constraints, not copy-pasted templates.
>
> [Switch to Explorer]
>
> Deployed on devnet. Program ID on screen.
>
> [Show Groth16 verification tx]
>
> Real ZK verification. Check it yourself."

**WHY**: ZK Hack winners showed novel circuit work. "Custom circuits > standard implementations" — direct from research.

---

### [1:55-2:15] SPONSOR INTEGRATIONS — Bounty Stacking

**VISUAL**: Animation — sponsor logos with checkmarks

**NARRATION**:
> "Built with the ecosystem:
>
> **Light Protocol** — compressed accounts for efficiency.
>
> **Groth16 via solana-verifier** — production ZK on Solana.
>
> **Helius RPC** — reliable infrastructure.
>
> **Multi-LST yield** — vSOL, jitoSOL, mSOL earning 7-8% APY while shielded.
>
> Other projects have TODOs for yield. Ours works."

**WHY**: ETHGlobal research shows top winners integrate 3-5 sponsors. Explicit callouts = bounty stacking.

---

### [2:15-2:30] CTA — Team + Vision

**VISUAL**: Animation — GitHub, team, roadmap

**NARRATION**:
> "We're a ZK team from Polygon. This isn't our first protocol.
>
> ZORB is open source: github.com/zorb-labs/solana-privacy-hackathon-2026
>
> Privacy shouldn't cost $0.13 per transaction. With ZORB, it's free.
>
> Programmable privacy on Solana — starting now."

**WHY**: ETH winners with team track record win more. Brief credential mention adds legitimacy.

---

## STRUCTURE COMPARISON

### Original (3:00)
```
[0:00-0:20] Hook (animation)
[0:20-0:45] Problem (animation)
[0:45-1:20] Solution (animation)
[1:20-1:35] Core demo
[1:35-2:00] Stress test
[2:00-2:30] Technical
[2:30-2:50] Innovations
[2:50-3:00] CTA
```

### ETH Format (2:30)
```
[0:00-0:15] COLD OPEN — demo first (screen)
[0:15-0:35] Problem (animation, shorter)
[0:35-1:05] Solution (animation, deeper)
[1:05-1:30] Stress test (screen)
[1:30-1:55] Technical proof (screen)
[1:55-2:15] Sponsor callouts (animation)
[2:15-2:30] CTA (animation)
```

**Key Differences**:
1. Demo moves from 1:20 to 0:10 (11x earlier)
2. 30 seconds shorter overall
3. Explicit sponsor section added
4. Single innovation focus vs. feature list
5. Academic references (ZEXE, papers) for credibility

---

## SCENE FILE UPDATES NEEDED

| Scene | Change |
|-------|--------|
| `hook.tsx` | Replace with sponsor integration logos |
| `problem.tsx` | Keep but shorten (15s not 25s) |
| `solution.tsx` | Keep, add paper URL flash |
| `techHighlights.tsx` | Repurpose as sponsor callout scene |
| `cta.tsx` | Add team credentials |

---

## RECORDING ORDER (Optimized)

1. **zorb.cash wallet demo** — cold open footage
2. **zorb.cash/stress-test** — stress test footage
3. **Code + Explorer** — technical proof footage
4. **Animations** — render from Motion Canvas
5. **Voiceover** — record narration separately
6. **Stitch** — FFmpeg concat

---

## COMPLIANCE NOTE (Post-Tornado Cash Pattern)

ETH winners since 2022 address regulatory concerns. ZORB's framing:

> "This isn't a mixer. It's programmable privacy infrastructure.
> Nullifier trees are transparent — anyone can verify the tree state.
> We're building compliant privacy, not obfuscation."

Add if judges seem compliance-focused. Skip if time-constrained.

---

## CHECKLIST

- [ ] Demo visible in first 15 seconds
- [ ] ZEXE paper mentioned by name
- [ ] Indexed Merkle Tree paper URL shown
- [ ] At least 3 sponsors explicitly named
- [ ] "35,000 constraints" or similar circuit metric
- [ ] Savings counter visible during stress test
- [ ] Program ID visible on Explorer
- [ ] GitHub URL on screen
- [ ] Total runtime under 2:45

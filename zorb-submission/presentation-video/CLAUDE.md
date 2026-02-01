# CLAUDE.md — Zorb Presentation Video

## Project Overview

Remotion-based 3-minute presentation video for Zorb Protocol hackathon submission.

**Video Structure (5400 frames @ 30fps):**
| Section | Duration | Frames | Composition |
|---------|----------|--------|-------------|
| Introduction | 0:00-0:25 | 0-750 | `Introduction` |
| Free Shielded Transfers | 0:25-1:10 | 750-2100 | `FreeShieldedTransfers` |
| Yield-Bearing SOL | 1:10-1:50 | 2100-3300 | `YieldBearingSOL` |
| zorb.cash Product | 1:50-2:45 | 3300-4950 | `ZorbCashProduct` |
| Close | 2:45-3:00 | 4950-5400 | `Close` |

**Full video composition:** `ZorbDemo`

---

## Fast Iteration Workflow

### Render Preview Frames (DO THIS INSTEAD OF FULL VIDEO)

```bash
# Preview a specific section
npx remotion still Introduction --frame=0 preview/intro-0.png
npx remotion still Introduction --frame=375 preview/intro-mid.png
npx remotion still Introduction --frame=749 preview/intro-end.png

# Or use the iteration script for multiple frames
bun scripts/remotion-claude-loop.ts Introduction --frames=0,200,400,600,749

# Preview full video at key moments
bun scripts/remotion-claude-loop.ts ZorbDemo --frames=0,750,2100,3300,4950,5399
```

### The Iteration Loop

1. **Edit composition code** in `src/compositions/`
2. **Render 3-5 preview frames:**
   ```bash
   bun scripts/remotion-claude-loop.ts <Composition> --frames=0,200,400
   ```
3. **Read the PNGs** in `preview/` directory
4. **Analyze and suggest fixes**
5. **Repeat** until it looks right

### Key Frame Numbers by Section

| Section | Start | 25% | 50% | 75% | End |
|---------|-------|-----|-----|-----|-----|
| Introduction | 0 | 187 | 375 | 562 | 749 |
| FreeShieldedTransfers | 0 | 337 | 675 | 1012 | 1349 |
| YieldBearingSOL | 0 | 300 | 600 | 900 | 1199 |
| ZorbCashProduct | 0 | 412 | 825 | 1237 | 1649 |
| Close | 0 | 112 | 225 | 337 | 449 |
| **ZorbDemo (full)** | 0 | 1350 | 2700 | 4050 | 5399 |

---

## Commands

```bash
# Development server (interactive preview)
npm start

# Render single frame
npx remotion still <Composition> --frame=<N> output.png

# Render full video (only when frames look good)
npx remotion render ZorbDemo --concurrency=8

# List all compositions
npx remotion compositions
```

---

## File Structure

```
src/
├── Root.tsx              # Composition definitions
├── styles.ts             # Shared styles
├── compositions/
│   ├── Introduction.tsx
│   ├── FreeShieldedTransfers.tsx
│   ├── YieldBearingSOL.tsx
│   ├── ZorbCashProduct.tsx
│   ├── Close.tsx
│   └── ZorbDemo.tsx      # Full video (stitches sections)
└── index.ts

scripts/
├── remotion-claude-loop.ts   # Fast frame iteration
└── remotion-iterate.sh       # Shell alternative

preview/                  # Generated preview frames (gitignored)
out/                      # Rendered videos
```

---

## Example Claude Session

```
Human: The intro animation feels too slow

Claude: Let me render preview frames to see the current state.

[Runs: bun scripts/remotion-claude-loop.ts Introduction --frames=0,100,200,300,400,500,600,700]

[Reads preview/*.png]

I can see the issue - the title fade-in takes 200 frames (6.6s) which is too slow.
Looking at Introduction.tsx, the animation uses:
  interpolate(frame, [0, 200], [0, 1])

Let me speed it up to 90 frames (3s):
[Edits Introduction.tsx]

Re-rendering to verify...
[Runs script again, reads new frames]

Much better! The timing now feels punchy. Ready to check the next section?
```

---

## Tips

- **Always preview frames before full render** — saves 10x time
- **Use section compositions** for editing individual parts
- **Use ZorbDemo** only for final full-video checks
- **Frame math:** frame ÷ 30 = seconds
- **Lower scale for speed:** `--scale=0.5` renders at 960x540

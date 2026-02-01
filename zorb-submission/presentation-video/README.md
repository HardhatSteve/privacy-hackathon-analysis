# ZORB Presentation Video

Remotion video for the ZORB Solana Privacy Hackathon submission.

## Current Status

**Video rendered and ready for voiceover:**
- Output: `out/zorb-demo.mp4`
- Duration: 3:00 (180 seconds)
- Resolution: 1920x1080 (1080p)
- Size: ~13 MB

### Next Steps
1. Record voiceover following `../PRESENTATION_VIDEO_SCRIPT.md`
2. Sync audio with video using ffmpeg
3. Upload to YouTube (unlisted)
4. Add link to `../FINAL_SUBMISSION.md`

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Remotion Studio
pnpm run dev
# Open http://localhost:3000
```

## Video Structure

Per `../PRESENTATION_VIDEO_SCRIPT.md`, the video is 3 minutes (5400 frames @ 30fps):

| Section | Duration | Frames | Composition |
|---------|----------|--------|-------------|
| [0:00-0:25] Introduction | 25s | 0-750 | `Introduction` |
| [0:25-1:10] Free Shielded Transfers | 45s | 750-2100 | `FreeShieldedTransfers` |
| [1:10-1:50] Yield-Bearing SOL | 40s | 2100-3300 | `YieldBearingSOL` |
| [1:50-2:45] zorb.cash Product | 55s | 3300-4950 | `ZorbCashProduct` |
| [2:45-3:00] Close | 15s | 4950-5400 | `Close` |

## Compositions

- **ZorbDemo** — Full 3-minute video combining all sections
- **Introduction** — ZORB logo, programmable privacy framing
- **FreeShieldedTransfers** — PDA problem, indexed merkle tree solution
- **YieldBearingSOL** — Anonymity set problem → Unified SOL solution → 7-8% APY bonus
- **ZorbCashProduct** — Demo flows, stress test visualization
- **Close** — CTA, links, tagline

## Rendering

```bash
# Render full video
pnpm run render

# Render specific composition
pnpm dlx remotion render Introduction out/introduction.mp4
```

## Project Structure

```
presentation-video/
├── src/
│   ├── index.ts          # Remotion entry point
│   ├── Root.tsx          # Composition definitions
│   ├── styles.ts         # Shared colors/styling
│   └── compositions/     # Video sections
│       ├── Introduction.tsx
│       ├── FreeShieldedTransfers.tsx
│       ├── YieldBearingSOL.tsx
│       ├── ZorbCashProduct.tsx
│       ├── Close.tsx
│       └── ZorbDemo.tsx  # Full video
├── resources/            # Assets (migrated from Motion Canvas)
└── out/                  # Rendered output
```

## Migrated from Motion Canvas

This project replaces the previous Motion Canvas setup. The old project is backed up at `presentation-video-motion-canvas-backup/`.

## Resources

- [Remotion Documentation](https://www.remotion.dev/docs)
- [PRESENTATION_VIDEO_SCRIPT.md](../PRESENTATION_VIDEO_SCRIPT.md) — Video outline and narration

# ZORB Demo Video Animations

Motion Canvas animations for the ZORB Solana Privacy Hackathon submission video.

## Quick Start

```bash
# Install dependencies
npm install

# Start Motion Canvas editor
npm run dev
# Open http://localhost:9000
```

## Video Structure

Per `../PRESENTATION_VIDEO_SCRIPT.md`, the final video is ~3 minutes:

| Section | Duration | Source | File |
|---------|----------|--------|------|
| Break ZORB Demo | 0:00-0:45 | Screen Recording | `screen-recordings/break-zorb.mp4` |
| The Problem | 0:45-1:10 | Animation | `problem.tsx` → `animations/problem.mp4` |
| The Solution | 1:10-1:50 | Animation | `solution.tsx` → `animations/solution.mp4` |
| Technical Depth | 1:50-2:20 | Screen Recording | `screen-recordings/code-walkthrough.mp4` |
| Innovations | 2:20-2:45 | Animation | `techHighlights.tsx` → `animations/techHighlights.mp4` |
| CTA | 2:45-3:00 | Animation | `cta.tsx` → `animations/cta.mp4` |

## Rendering Animations

1. Start the Motion Canvas editor:
   ```bash
   npm run dev
   ```

2. Open http://localhost:9000 in your browser

3. For each scene you need to render:
   - Select the scene from the dropdown
   - Click the **Export** button (top right)
   - Choose **Video** format
   - Click **Render**
   - Save to `output/animations/` with the scene name (e.g., `problem.mp4`)

### Scenes to Render

| Scene | Output File | Duration |
|-------|-------------|----------|
| `problem` | `output/animations/problem.mp4` | ~25s |
| `solution` | `output/animations/solution.mp4` | ~40s |
| `techHighlights` | `output/animations/techHighlights.mp4` | ~25s |
| `cta` | `output/animations/cta.mp4` | ~15s |

## Screen Recordings (Manual)

You need to record these manually using OBS, QuickTime, or similar:

### 1. Break ZORB Demo (45 seconds)
- URL: https://zorb.cash/stress-test
- Record: Start stress test, show TPS climbing, point to savings counter
- Save to: `output/screen-recordings/break-zorb.mp4`

### 2. Code Walkthrough (30 seconds)
- Show: Code editor with `indexed_merkle_tree.rs`
- Show: Solana Explorer with devnet program IDs
- Save to: `output/screen-recordings/code-walkthrough.mp4`

## Narration Audio

Options for narration:
1. **Record manually** - Use a good microphone
2. **Text-to-speech** - ElevenLabs, Murf.ai, or similar

Save narration to: `output/narration/full-narration.mp3`

The narration script is in `../PRESENTATION_VIDEO_SCRIPT.md`.

## Final Assembly

Once all pieces are ready:

```bash
npm run assemble
```

This runs `scripts/assemble-video.sh` which:
1. Concatenates all video segments in order
2. Adds narration audio (if present)
3. Outputs to `output/final/zorb-demo.mp4`

### Required Files Before Assembly

```
output/
├── animations/
│   ├── problem.mp4      ← Render from Motion Canvas
│   ├── solution.mp4     ← Render from Motion Canvas
│   ├── techHighlights.mp4 ← Render from Motion Canvas
│   └── cta.mp4          ← Render from Motion Canvas
├── screen-recordings/
│   ├── break-zorb.mp4   ← Record manually (45s)
│   └── code-walkthrough.mp4 ← Record manually (30s)
└── narration/
    └── full-narration.mp3 ← Optional, add audio
```

## Development

### Scene Files

All scenes are in `src/scenes/`:
- `hook.tsx` - Opening hook (not used in current structure)
- `problem.tsx` - The nullifier rent problem
- `solution.tsx` - Concurrent nullifier tree solution
- `costComparison.tsx` - Cost comparison (B-roll)
- `techHighlights.tsx` - Innovation highlights
- `cta.tsx` - Call to action / closing

### Styling Constants

Common colors used across scenes:
```typescript
const ZORB_CYAN = '#00D1FF';
const RENT_RED = '#FF4444';
const PDA_ORANGE = '#FF8844';
const BG_DARK = '#0a0a0f';
const TEXT_WHITE = '#FFFFFF';
const TEXT_GRAY = '#888888';
const SOLANA_PURPLE = '#9945FF';
```

## Troubleshooting

### FFmpeg not found
```bash
brew install ffmpeg
```

### Motion Canvas editor not loading
Make sure you're running `npm run dev` from this directory, not the root.

### Export not showing MP4 option
The `@motion-canvas/ffmpeg` plugin must be installed. Run `npm install`.

# Zorb Protocol - Hackathon Submission

This directory contains submission materials for the Solana Privacy Hackathon 2026.

**Deadline:** February 1, 2026
**Form:** https://solanafoundation.typeform.com/privacyhacksub

---

## Quick Links

**Form Fields:**
1. Project Name: `ZORB`
2. Track: `Private payments`
3. Demo: `https://zorb.cash/stress-test`

**Code to Open Source:**
- Circuits: `../../../app/packages/circuits/`
- Programs: `../../../zore/programs/`
- STARK: `../../../solana-auth-stark/`

---

## Video Generation Tools

### Terminal Recording

#### VHS (Recommended for CLI demos)
Scripted terminal recordings using a simple DSL.

```bash
# Install
brew install vhs

# Create tape file
cat > demo.tape << 'EOF'
Output demo.gif
Set FontSize 16
Set Width 1200
Set Height 600

Type "zorb deposit --amount 1.5 --token SOL"
Enter
Sleep 2s
Type "zorb status"
Enter
Sleep 3s
EOF

# Record
vhs demo.tape
```

**Pros**: Reproducible, scriptable, git-friendly
**Output**: GIF, MP4, WebM

Docs: https://github.com/charmbracelet/vhs

#### asciinema + FFmpeg
Record real terminal sessions, convert to video.

```bash
# Install
brew install asciinema ffmpeg

# Record terminal session
asciinema rec demo.cast

# Convert to MP4 using agg
brew install agg
agg demo.cast demo.gif
ffmpeg -i demo.gif -movflags faststart -pix_fmt yuv420p demo.mp4
```

**Pros**: Real typing, authentic feel
**Output**: .cast → GIF → MP4

---

### Programmatic Video

#### Remotion (React-based)
Build videos with React components. Great for polished explainers.

```bash
npx create-video@latest
```

```tsx
import { Composition } from 'remotion';

export const RemotionRoot = () => {
  return (
    <Composition
      id="ZorbDemo"
      component={ZorbDemo}
      durationInFrames={30 * 180} // 3 minutes at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

```bash
npx remotion render src/index.ts ZorbDemo out/demo.mp4
```

**Pros**: Full control, animations, React ecosystem
**Output**: MP4, WebM, GIF

Docs: https://www.remotion.dev/

#### Motion Canvas
TypeScript-based animation engine for technical explanations.

```bash
npm create @motion-canvas@latest
```

```tsx
import {makeScene2D} from '@motion-canvas/2d';
import {Circle} from '@motion-canvas/2d/lib/components';

export default makeScene2D(function* (view) {
  const circle = <Circle size={200} fill="#00D1FF" />;
  view.add(circle);
  yield* circle.scale(1.5, 1);
});
```

**Pros**: Code-driven, version controlled, great for diagrams
**Output**: MP4, image sequences

Docs: https://motioncanvas.io/

---

### FFmpeg Commands

```bash
# Concatenate clips
ffmpeg -f concat -i clips.txt -c copy output.mp4

# Add background music (ducked)
ffmpeg -i video.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.2[music];[0:a][music]amix=inputs=2" \
  -c:v copy output.mp4

# Add text overlay
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Zorb Privacy':fontsize=48:fontcolor=white:x=50:y=50" \
  output.mp4

# Resize for submission (1080p)
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:a copy output.mp4

# Compress for upload
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k output.mp4
```

---

## Demo Script Template

```markdown
## 0:00-0:20 - Hook
"What if you could send SOL without anyone seeing?"

## 0:20-1:00 - Problem
Show public transaction on Solscan

## 1:00-2:20 - Demo
- Deposit flow
- Shielded balance
- Private transfer
- Verify on explorer

## 2:20-2:50 - Tech
Flash ZK circuits, mention Groth16

## 2:50-3:00 - CTA
"Try it: zorb.cash"
```

---

## Recommended Workflow

1. **Script First** → Write DEMO_SCRIPT.md with timing
2. **Record Components** → VHS for CLI, screen capture for UI
3. **Assemble** → Remotion or FFmpeg concat
4. **Final Checks**:
   - [ ] Under 3 minutes
   - [ ] 1080p resolution
   - [ ] Shows working product
   - [ ] Includes devnet/mainnet proof

---

## Tool Reference

| Tool | Best For | Output |
|------|----------|--------|
| **VHS** | CLI demos, reproducible | GIF, MP4 |
| **asciinema** | Real terminal sessions | .cast → MP4 |
| **Remotion** | Polished explainers | MP4 |
| **Motion Canvas** | Technical animations | MP4 |
| **FFmpeg** | Combining, encoding | Any |
| **OBS** | Screen + webcam | MP4 |

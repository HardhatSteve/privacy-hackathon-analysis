# ZORB Hackathon Submission

**Hackathon:** Solana Privacy Hack 2026
**Deadline:** February 1, 2026
**Form:** https://solanafoundation.typeform.com/privacyhacksub

---

## Contents

| File | Description |
|------|-------------|
| `ZORB_SUBMISSION_TRACKER.md` | Form field tracker with drafts for all 11 submission fields |
| `ZORB_HACKATHON_SUBMISSION_PLAN.md` | Full strategy, competitive analysis, and implementation plan |

## Artifacts To Add

- [ ] `video/` - Presentation video (3 min max)
- [ ] `screenshots/` - Demo screenshots for README
- [ ] `FINAL_SUBMISSION.md` - Copy-paste ready answers for form

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

### 1. VHS (Terminal Recording)
**Best for:** CLI demos, terminal commands

```bash
brew install vhs

# Create demo.tape
cat > demo.tape << 'EOF'
Output demo.gif
Set FontSize 16
Set Width 1200
Set Height 600

Type "zorb deposit 1.5 SOL"
Enter
Sleep 2s
EOF

vhs demo.tape
```

Docs: https://github.com/charmbracelet/vhs

### 2. Remotion (React Video)
**Best for:** Animated explainers, polished intros/outros

```bash
npx create-video@latest
npx remotion render src/index.tsx MyVideo out/video.mp4
```

Docs: https://www.remotion.dev/

### 3. Motion Canvas (Animated Diagrams)
**Best for:** Technical diagrams, architecture flows

```bash
npm init @motion-canvas@latest
```

Docs: https://motioncanvas.io/

### 4. FFmpeg + asciinema (Terminal → Video)
**Best for:** Converting terminal recordings

```bash
# Record
asciinema rec demo.cast

# Convert to GIF
brew install agg
agg demo.cast demo.gif

# To MP4
ffmpeg -i demo.gif -movflags faststart -pix_fmt yuv420p demo.mp4

# Add narration
ffmpeg -i demo.mp4 -i narration.mp3 -c:v copy -c:a aac final.mp4
```

### Quick FFmpeg Commands

```bash
# Compress
ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4

# Trim
ffmpeg -i input.mp4 -ss 00:00:05 -to 00:02:55 -c copy trimmed.mp4

# Combine
ffmpeg -f concat -i clips.txt -c copy combined.mp4

# Add subtitles
ffmpeg -i input.mp4 -vf subtitles=subs.srt output.mp4
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
# Create project
npx create-video@latest
```

```tsx
// Example composition
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
# Render
npx remotion render src/index.ts ZorbDemo out/demo.mp4
```

**Pros**: Full control, animations, React ecosystem
**Output**: MP4, WebM, GIF

#### Motion Canvas
TypeScript-based animation engine for technical explanations.

```bash
# Create project
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

### Recommended Workflow

1. **Script First** → Write DEMO_SCRIPT.md with timing
2. **Record Components** → VHS for CLI, screen capture for UI
3. **Assemble** → Remotion or FFmpeg concat
4. **Final Checks**:
   - [ ] Under 3 minutes
   - [ ] 1080p resolution
   - [ ] Shows working product
   - [ ] Includes devnet/mainnet proof

---

### Tool Reference

| Tool | Best For | Output |
|------|----------|--------|
| **VHS** | CLI demos, reproducible | GIF, MP4 |
| **asciinema** | Real terminal sessions | .cast → MP4 |
| **Remotion** | Polished explainers | MP4 |
| **Motion Canvas** | Technical animations | MP4 |
| **FFmpeg** | Combining, encoding | Any |
| **OBS** | Screen + webcam | MP4 |

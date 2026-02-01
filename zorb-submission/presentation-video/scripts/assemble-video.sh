#!/bin/bash
# ZORB Hackathon Demo Video Assembly Script
# Combines all video segments into final demo video

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../output"
FINAL_DIR="$OUTPUT_DIR/final"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   ZORB Demo Video Assembly${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# Check for required tools
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

# Check for required files
MISSING_FILES=0

check_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}Missing: $1${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo -e "${GREEN}Found: $1${NC}"
    fi
}

echo -e "\n${YELLOW}Checking required files...${NC}\n"

# Animation files (from Motion Canvas)
check_file "$OUTPUT_DIR/animations/problem.mp4"
check_file "$OUTPUT_DIR/animations/solution.mp4"
check_file "$OUTPUT_DIR/animations/techHighlights.mp4"
check_file "$OUTPUT_DIR/animations/cta.mp4"

# Screen recordings (user provides)
check_file "$OUTPUT_DIR/screen-recordings/break-zorb.mp4"
check_file "$OUTPUT_DIR/screen-recordings/code-walkthrough.mp4"

# Narration (optional - can be added later)
NARRATION_DIR="$OUTPUT_DIR/narration"
HAS_NARRATION=false
if [ -f "$NARRATION_DIR/full-narration.mp3" ]; then
    HAS_NARRATION=true
    echo -e "${GREEN}Found: narration audio${NC}"
fi

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "\n${RED}Missing $MISSING_FILES required files.${NC}"
    echo -e "${YELLOW}Please ensure all files are present before assembly.${NC}"
    echo ""
    echo "To generate animations:"
    echo "  1. npm run dev"
    echo "  2. Open http://localhost:9000"
    echo "  3. Select each scene, click Export > Render Video"
    echo "  4. Save to output/animations/"
    echo ""
    echo "Screen recordings needed:"
    echo "  - break-zorb.mp4 (45s) - Record zorb.cash/stress-test"
    echo "  - code-walkthrough.mp4 (30s) - Code editor + Solana Explorer"
    exit 1
fi

echo -e "\n${GREEN}All required files present!${NC}\n"

# Create concat file
CONCAT_FILE="$FINAL_DIR/concat.txt"
mkdir -p "$FINAL_DIR"

echo -e "${YELLOW}Creating concat file...${NC}"

cat > "$CONCAT_FILE" << EOF
# ZORB Demo Video Structure (per VIDEO_SCRIPT.md)
# Total: ~3 minutes

# [0:00-0:45] Break ZORB Demo - Live stress test
file '../screen-recordings/break-zorb.mp4'

# [0:45-1:10] The Problem - Animation
file '../animations/problem.mp4'

# [1:10-1:50] The Solution - Animation
file '../animations/solution.mp4'

# [1:50-2:20] Technical Depth - Screen recording
file '../screen-recordings/code-walkthrough.mp4'

# [2:20-2:45] Innovations - Animation
file '../animations/techHighlights.mp4'

# [2:45-3:00] CTA - Animation
file '../animations/cta.mp4'
EOF

echo -e "${GREEN}Concat file created: $CONCAT_FILE${NC}"

# Assembly
echo -e "\n${YELLOW}Assembling video segments...${NC}"

# First pass: concat all video segments
ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
    -c:v libx264 -crf 23 -preset medium \
    -pix_fmt yuv420p \
    -r 30 \
    "$FINAL_DIR/zorb-demo-no-audio.mp4"

echo -e "${GREEN}Video assembled: zorb-demo-no-audio.mp4${NC}"

# Add narration if available
if [ "$HAS_NARRATION" = true ]; then
    echo -e "\n${YELLOW}Adding narration audio...${NC}"

    ffmpeg -y -i "$FINAL_DIR/zorb-demo-no-audio.mp4" \
        -i "$NARRATION_DIR/full-narration.mp3" \
        -c:v copy -c:a aac -b:a 192k \
        -map 0:v:0 -map 1:a:0 \
        -shortest \
        "$FINAL_DIR/zorb-demo.mp4"

    echo -e "${GREEN}Final video with audio: zorb-demo.mp4${NC}"
else
    # Just copy without audio
    cp "$FINAL_DIR/zorb-demo-no-audio.mp4" "$FINAL_DIR/zorb-demo.mp4"
    echo -e "${YELLOW}No narration found. Video assembled without audio.${NC}"
    echo -e "${YELLOW}Add narration to: $NARRATION_DIR/full-narration.mp3${NC}"
fi

# Get video info
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Video assembly complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_DIR/zorb-demo.mp4" 2>/dev/null)
if [ -n "$DURATION" ]; then
    MINUTES=$(echo "$DURATION / 60" | bc)
    SECONDS=$(echo "$DURATION % 60" | bc)
    printf "\nDuration: %d:%02d\n" $MINUTES ${SECONDS%.*}
fi

echo -e "Output: ${GREEN}$FINAL_DIR/zorb-demo.mp4${NC}"
echo ""

# Check if under 3 minutes
if (( $(echo "$DURATION > 180" | bc -l) )); then
    echo -e "${RED}WARNING: Video exceeds 3-minute limit!${NC}"
    echo -e "Please trim segments to fit within the limit."
else
    echo -e "${GREEN}Video is under 3 minutes - ready for submission!${NC}"
fi

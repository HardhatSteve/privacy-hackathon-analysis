#!/bin/bash
# Fast Remotion iteration script for Claude multimodal feedback
#
# Usage:
#   ./remotion-iterate.sh <composition> [frames]
#
# Examples:
#   ./remotion-iterate.sh MyVideo           # Key frames: 0, 25%, 50%, 75%, 100%
#   ./remotion-iterate.sh MyVideo "0 30 60" # Specific frames
#
# Output: Creates preview/ folder with PNGs for Claude to review

set -e

COMPOSITION="${1:-Main}"
FRAMES="${2:-auto}"
OUTPUT_DIR="preview"
SCALE="${SCALE:-0.5}"  # Half resolution for speed

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Remotion Fast Iterator${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo "Composition: $COMPOSITION"
echo "Scale: $SCALE"

# Create output directory
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*.png

# Get total frames if auto
if [ "$FRAMES" = "auto" ]; then
    # Try to get duration from remotion
    TOTAL=$(npx remotion compositions 2>/dev/null | grep "$COMPOSITION" | awk '{print $3}' || echo "120")
    TOTAL=${TOTAL:-120}

    # Key frames: start, 25%, 50%, 75%, end
    FRAMES="0 $((TOTAL/4)) $((TOTAL/2)) $((TOTAL*3/4)) $((TOTAL-1))"
    echo "Total frames: $TOTAL"
fi

echo "Rendering frames: $FRAMES"
echo ""

# Render each frame in parallel
PIDS=()
for frame in $FRAMES; do
    echo -e "${GREEN}→${NC} Rendering frame $frame..."
    npx remotion still "$COMPOSITION" \
        --frame="$frame" \
        --scale="$SCALE" \
        --output="$OUTPUT_DIR/frame-$(printf '%04d' $frame).png" \
        --log=error &
    PIDS+=($!)
done

# Wait for all renders
for pid in "${PIDS[@]}"; do
    wait "$pid"
done

echo ""
echo -e "${GREEN}✓ Done!${NC} Preview frames saved to $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR"/*.png 2>/dev/null || echo "No frames rendered"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo "Now show Claude the frames:"
echo "  Read $OUTPUT_DIR/frame-*.png"

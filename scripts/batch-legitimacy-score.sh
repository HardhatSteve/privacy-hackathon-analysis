#!/bin/bash
# batch-legitimacy-score.sh - Score all repos for legitimacy
# Usage: ./batch-legitimacy-score.sh [output-file]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")/repos"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${1:-legitimacy-scores.json}"
EXCLUSIONS_FILE="/tmp/exclusions.json"

echo "=============================================="
echo "BATCH LEGITIMACY SCORING"
echo "=============================================="
echo ""
echo "Scoring all repos in: $REPO_DIR"
echo "Output file: $OUTPUT_FILE"
echo ""

# Check for exclusions file
if [ -f "$EXCLUSIONS_FILE" ]; then
    echo "Using exclusions from: $EXCLUSIONS_FILE"
    EXCLUDED_COUNT=$(jq 'keys | length' "$EXCLUSIONS_FILE")
    echo "Excluding $EXCLUDED_COUNT repos"
    echo ""
fi

# Initialize JSON output
echo "[" > "$OUTPUT_FILE"
FIRST=true

# Count repos (excluding excluded ones)
TOTAL_REPOS=0
SKIPPED=0
for repo_path in "$REPO_DIR"/*/; do
    repo_name=$(basename "$repo_path")
    if [ -f "$EXCLUSIONS_FILE" ]; then
        is_excluded=$(jq -r --arg name "$repo_name" '.[$name] // empty' "$EXCLUSIONS_FILE")
        if [ -n "$is_excluded" ]; then
            SKIPPED=$((SKIPPED + 1))
            continue
        fi
    fi
    TOTAL_REPOS=$((TOTAL_REPOS + 1))
done
echo "Total repos to score: $TOTAL_REPOS (skipping $SKIPPED excluded)"
echo ""

CURRENT=0

# Score each repo
for repo_path in "$REPO_DIR"/*/; do
    repo_name=$(basename "$repo_path")

    # Check if excluded
    if [ -f "$EXCLUSIONS_FILE" ]; then
        is_excluded=$(jq -r --arg name "$repo_name" '.[$name] // empty' "$EXCLUSIONS_FILE")
        if [ -n "$is_excluded" ]; then
            continue
        fi
    fi

    CURRENT=$((CURRENT + 1))

    echo "[$CURRENT/$TOTAL_REPOS] Scoring: $repo_name"

    # Get JSON output from legitimacy check
    JSON_OUTPUT=$("$SCRIPT_DIR/legitimacy-check.sh" "$repo_path" 2>/dev/null | grep -A 20 "^JSON:" | tail -n +2)

    if [ -n "$JSON_OUTPUT" ]; then
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "," >> "$OUTPUT_FILE"
        fi
        echo "$JSON_OUTPUT" >> "$OUTPUT_FILE"
    fi
done

echo "]" >> "$OUTPUT_FILE"

echo ""
echo "=============================================="
echo "SCORING COMPLETE"
echo "=============================================="

# Generate summary
echo ""
echo "=== SUMMARY ==="

POLISHED=$(grep -c '"classification": "POLISHED"' "$OUTPUT_FILE" || echo 0)
SOLID=$(grep -c '"classification": "SOLID"' "$OUTPUT_FILE" || echo 0)
BASIC=$(grep -c '"classification": "BASIC"' "$OUTPUT_FILE" || echo 0)
ROUGH=$(grep -c '"classification": "ROUGH"' "$OUTPUT_FILE" || echo 0)
VIBE_CODED=$(grep -c '"classification": "VIBE_CODED"' "$OUTPUT_FILE" || echo 0)

echo "POLISHED (80-100):  $POLISHED"
echo "SOLID (60-79):      $SOLID"
echo "BASIC (40-59):      $BASIC"
echo "ROUGH (20-39):      $ROUGH"
echo "VIBE CODED (0-19):  $VIBE_CODED"
echo ""
echo "Total scored: $TOTAL_REPOS"

# Top 10 by score
echo ""
echo "=== TOP 10 BY SCORE ==="
jq -r 'sort_by(-.total_score) | .[0:10] | .[] | "\(.total_score)\t\(.classification)\t\(.repo)"' "$OUTPUT_FILE" 2>/dev/null || echo "Install jq for detailed analysis"

# Bottom 10 by score
echo ""
echo "=== BOTTOM 10 BY SCORE ==="
jq -r 'sort_by(.total_score) | .[0:10] | .[] | "\(.total_score)\t\(.classification)\t\(.repo)"' "$OUTPUT_FILE" 2>/dev/null || echo "Install jq for detailed analysis"

echo ""
echo "Full results saved to: $OUTPUT_FILE"

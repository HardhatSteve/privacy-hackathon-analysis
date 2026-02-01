#!/bin/bash
# ZORB Manim Animation Render Script
# Usage: ./render.sh [scene_name] or ./render.sh all

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

mkdir -p "$OUTPUT_DIR"

# Available scenes
SCENES=(
    # Nullifier Tree
    "nullifier_tree:IndexedMerkleTreeScene"
    "nullifier_tree:NonMembershipProofScene"
    "nullifier_tree:TwoLayerSecurityScene"
    # Reward Accumulator
    "reward_accumulator:RewardAccumulatorScene"
    "reward_accumulator:HarvestFinalizeScene"
    "reward_accumulator:AccumulatorGrowthScene"
    # Multi-LST
    "multi_lst:DomainBoundaryScene"
    "multi_lst:CrossLSTPrivacyScene"
    "multi_lst:ExchangeRateScene"
    # Free Transfers
    "free_transfers:CostComparisonScene"
    "free_transfers:PDAExplainerScene"
    "free_transfers:SavingsCalculatorScene"
    # Shielding Flow
    "shielding_flow:ShieldingFlowScene"
    "shielding_flow:CommitmentCreationScene"
    "shielding_flow:ZKProofScene"
    "shielding_flow:TransferAnimationScene"
)

render_scene() {
    local spec="$1"
    local module="${spec%%:*}"
    local scene="${spec##*:}"

    echo "Rendering $module.$scene..."
    cd "$SCRIPT_DIR"
    manim -qh "zorb_animations/scenes/${module}.py" "$scene" -o "$OUTPUT_DIR/${module}_${scene}.mp4"
    echo "✓ Saved to $OUTPUT_DIR/${module}_${scene}.mp4"
}

if [ "$1" == "all" ]; then
    echo "Rendering all ZORB animations..."
    for scene in "${SCENES[@]}"; do
        render_scene "$scene"
    done
    echo ""
    echo "All animations rendered to $OUTPUT_DIR/"
elif [ -n "$1" ]; then
    # Find matching scene
    found=false
    for scene in "${SCENES[@]}"; do
        if [[ "$scene" == *"$1"* ]]; then
            render_scene "$scene"
            found=true
        fi
    done
    if [ "$found" == "false" ]; then
        echo "Scene not found: $1"
        echo "Available scenes:"
        printf '%s\n' "${SCENES[@]}"
        exit 1
    fi
else
    echo "ZORB Manim Animation Renderer"
    echo ""
    echo "Usage:"
    echo "  ./render.sh all                  # Render all scenes"
    echo "  ./render.sh IndexedMerkleTree    # Render matching scene(s)"
    echo ""
    echo "Available scenes:"
    for scene in "${SCENES[@]}"; do
        echo "  ${scene##*:}"
    done
fi

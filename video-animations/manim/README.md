# ZORB Manim Animations

Technical data structure animations for the ZORB hackathon demo video.

## Installation

```bash
pip install manim
```

## Scenes

### Nullifier Tree (`nullifier_tree.py`)
- **IndexedMerkleTreeScene** - Introduces indexed merkle tree structure with sorted linked list
- **NonMembershipProofScene** - Demonstrates low element + gap proof for non-membership
- **TwoLayerSecurityScene** - Shows ZK proof + PDA check two-layer security

### Reward Accumulator (`reward_accumulator.py`)
- **RewardAccumulatorScene** - Explains yield computation without revealing principal
- **HarvestFinalizeScene** - Epoch-based rate freeze cycle (INV-8 atomicity)
- **AccumulatorGrowthScene** - Animated accumulator growth over time

### Multi-LST Fungibility (`multi_lst.py`)
- **DomainBoundaryScene** - LST → Virtual SOL conversion (φ conversion)
- **CrossLSTPrivacyScene** - Shows how different LSTs become indistinguishable
- **ExchangeRateScene** - Exchange rate oracle mechanism

### Free Transfers (`free_transfers.py`)
- **CostComparisonScene** - Side-by-side cost comparison (682× cheaper)
- **PDAExplainerScene** - Why PDA rent is a problem for competitors
- **SavingsCalculatorScene** - Savings table for different transfer counts

### Shielding Flow (`shielding_flow.py`)
- **ShieldingFlowScene** - Complete shield → send → unshield flow
- **CommitmentCreationScene** - How commitments are created with Poseidon hash
- **ZKProofScene** - Private inputs vs public outputs visualization
- **TransferAnimationScene** - Animated transfer between Alice and Bob

## Rendering

### Render a single scene
```bash
manim -qh zorb_animations/scenes/nullifier_tree.py IndexedMerkleTreeScene
```

### Render all scenes
```bash
./render.sh all
```

### Render matching scenes
```bash
./render.sh CostComparison
```

## Quality Settings

- `-ql` - Low quality (480p, 15fps) - fast preview
- `-qm` - Medium quality (720p, 30fps)
- `-qh` - High quality (1080p, 60fps) - for final render
- `-qk` - 4K quality (2160p, 60fps)

## Output

Rendered videos are saved to `output/` directory.

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| ZORB_CYAN | #00D1FF | Primary accent, pool borders |
| ZORB_DARK | #0a0a0f | Background |
| RENT_RED | #FF4444 | Costs, nullifiers |
| SUCCESS_GREEN | #44FF88 | Savings, completions |
| SOLANA_PURPLE | #9945FF | Solana-related elements |

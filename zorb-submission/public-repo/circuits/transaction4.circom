pragma circom 2.0.0;

/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
WARNING: THIS CIRCUIT IS COMPLETELY UNAUDITED. DO NOT USE IN PRODUCTION.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/

include "./transaction.circom";

// =============================================================================
// TRANSACTION4 CIRCUIT - Multi-Asset Shielded Pool (4 inputs, 4 outputs)
// =============================================================================
//
// One-hot routing version with explicit selector witnesses.
//
// Template Parameters (in order):
//   1. levels = 26
//      Merkle tree depth. Supports 2^26 = ~67 million leaves.
//
//   2. nInputNotes = 4
//      Number of input notes that can be spent in a single transaction.
//
//   3. nOutputNotes = 4
//      Number of output notes created in a single transaction.
//
//   4. zeroLeaf = 11850551329423159860688778991827824730037759162201783566284850822760196767874
//      The zero leaf value for the Merkle tree.
//      Computed as: Poseidon(z, z) where z = keccak256("tornado") % FIELD_SIZE
//
//   5. nRewardLines = 8
//      Number of (assetId, rewardAccumulator) pairs in the reward registry.
//      Each pair maps an assetId to its current global reward accumulator.
//
//   6. nPublicLines = 2
//      Max number of assets with visible public amounts (deposits/withdrawals).
//      These appear in publicAssetId and publicAmount arrays.
//
//   7. nRosterSlots = 4
//      Number of private roster slots for asset routing.
//      Notes and public lines select roster slots via one-hot selectors.
//
// =============================================================================

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Public Inputs:
//   commitmentRoot    - Merkle tree root of commitment tree
//   transactParamsHash - Hash of tx params (recipient, relayer, fees, deadline)
//   publicAssetId[2]  - Asset IDs for public deposit/withdrawal (0 = disabled)
//   publicAmount[2]   - Deposit (+) or withdrawal (-) amounts
//   nullifiers[4]     - Nullifiers for spent notes (prevents double-spend)
//   commitments[4]    - Commitments for new output notes
//   rewardAcc[8]      - Current reward accumulator per registry line
//   rewardAssetId[8]  - Asset ID per reward registry line
// =============================================================================
component main {
    public [
        commitmentRoot,     // Merkle tree root of commitment tree
        transactParamsHash, // Hash of tx params (recipient, relayer, fees, deadline)
        publicAssetId,      // Asset IDs for public deposit/withdrawal (0 = disabled)
        publicAmount,       // Deposit (+) or withdrawal (-) amounts
        nullifiers,         // Nullifiers for spent notes (prevents double-spend)
        commitments,        // Commitments for new output notes
        rewardAcc,          // Current reward accumulator per registry line
        rewardAssetId       // Asset ID per reward registry line
    ]
} = Transaction(
    26,     // levels - Merkle tree depth
    4,      // nInputNotes - Number of input notes
    4,      // nOutputNotes - Number of output notes
    11850551329423159860688778991827824730037759162201783566284850822760196767874, // zeroLeaf
    8,      // nRewardLines - Reward registry size
    2,      // nPublicLines - Public delta lines
    4       // nRosterSlots - Private routing slots
);

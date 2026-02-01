pragma circom 2.0.0;

/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
WARNING: THIS CIRCUIT IS COMPLETELY UNAUDITED. DO NOT USE IN PRODUCTION.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/

include "./transaction.circom";

// =============================================================================
// TRANSACTION16 CIRCUIT - Multi-Asset Shielded Pool (16 inputs, 2 outputs)
// =============================================================================
//
// Batch consolidation circuit: allows processing up to 16 input notes while
// creating up to 2 new outputs. Useful for consolidating many small notes.
//
// One-hot routing version with explicit selector witnesses.
//
// Template Parameters (in order):
//   1. levels = 26
//      Merkle tree depth. Supports 2^26 = ~67 million leaves.
//
//   2. nInputNotes = 16
//      Number of input notes that can be spent in a single transaction.
//
//   3. nOutputNotes = 2
//      Number of output notes created in a single transaction.
//
//   4. zeroLeaf = 11850551329423159860688778991827824730037759162201783566284850822760196767874
//      The zero leaf value for the Merkle tree.
//      Computed as: Poseidon(z, z) where z = keccak256("tornado") % FIELD_SIZE
//
//   5. nRewardLines = 2
//      Number of (assetId, rewardAccumulator) pairs in the reward registry.
//      Reduced from 8 to 2 to manage circuit size with 16 input notes.
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
//   nullifiers[16]    - Nullifiers for spent notes (prevents double-spend)
//   commitments[2]    - Commitments for new output notes
//   rewardAcc[2]      - Current reward accumulator per registry line
//   rewardAssetId[2]  - Asset ID per reward registry line
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
    16,     // nInputNotes - Number of input notes
    2,      // nOutputNotes - Number of output notes
    11850551329423159860688778991827824730037759162201783566284850822760196767874, // zeroLeaf
    2,      // nRewardLines - Reward registry size (reduced for 16 inputs)
    2,      // nPublicLines - Public delta lines
    4       // nRosterSlots - Private routing slots
);

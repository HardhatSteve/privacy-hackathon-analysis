pragma circom 2.0.0;

/*
================================================================================
SHIELDED CLAIM CIRCUIT
Private Mining - Claim Phase
================================================================================

Proves that the claimer's block selection includes the winning block,
without revealing which other blocks were selected. Creates a reward note
in the shielded pool.

IMPORTANT: Uses the SHARED shielded pool commitment tree. Deployment
commitments are stored alongside regular note commitments in the same tree.
The round snapshots the tree root at sample time for claim validation.

Public Inputs:
  - commitmentTreeRoot: Shared shielded pool tree root (snapshotted at round end)
  - deploymentNullifier: Prevents double-claiming
  - roundId: The round being claimed
  - winningBlock: The winning block index (0-24)
  - rewardNoteCommitment: Output commitment for the reward note
  - transactParamsHash: Binding to reward transfer parameters

Private Inputs:
  - blockSelectionMask: The 25-bit bitmask from deployment
  - deploymentAmount: Original deployment amount
  - blinding: Original blinding factor
  - ask, nsk: Wallet keys
  - merkle proof for deployment in SHARED commitment tree
  - reward note parameters

Constraints:
  1. Recompute deployment commitment
  2. Verify commitment exists in SHARED commitment tree
  3. Compute nullifier (prevents double-claim)
  4. CRITICAL: Verify winningBlock bit is SET in blockSelectionMask
  5. Create valid reward note commitment

Estimated constraints: ~8,000
================================================================================
*/

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

// Import existing components
include "./lib/keys/derive-keys.circom";
include "./lib/merkle/merkle-proof.circom";
include "./lib/notes/note-commitment.circom";
include "./lib/assets/index-select.circom";

// =============================================================================
// MINING DOMAIN SEPARATOR
// =============================================================================
// MINING_DOMAIN = Poseidon(0x7a6f72625f6d696e696e67) where hex is "zorb_mining" as ASCII.
// This ensures deployment commitments cannot collide with note commitments.
//
// "zorb_mining" ASCII = 0x7a6f72625f6d696e696e67 = 148015242689912330917604967 decimal
// MINING_DOMAIN = Poseidon(148015242689912330917604967)
//
// Computed value: 18006724475865480147125109306625154174578455558726974631272911097328683052156
function MINING_DOMAIN() {
    return 18006724475865480147125109306625154174578455558726974631272911097328683052156;
}

template ShieldedClaim(levels) {
    // =========================================================================
    // PUBLIC INPUTS
    // =========================================================================
    signal input commitmentTreeRoot;        // SHARED shielded pool tree root (snapshotted)
    signal input deploymentNullifier;       // Prevents double-claiming
    signal input roundId;                   // Round being claimed
    signal input winningBlock;              // The winning block index (0-24)
    signal input rewardNoteCommitment;      // Output commitment for reward note
    signal input transactParamsHash;        // Binding to reward transfer params

    // =========================================================================
    // PRIVATE INPUTS - Original Deployment
    // =========================================================================
    signal input blockSelectionMask;        // 25-bit bitmask from deployment
    signal input deploymentAmount;          // Original deployment amount
    signal input blinding;                  // Original blinding factor
    signal input ask;                       // Spend authorizing secret key
    signal input nsk;                       // Nullifier secret key

    // Merkle proof for deployment commitment
    signal input deploymentLeafIndex;
    signal input deploymentPathElements[levels];

    // =========================================================================
    // PRIVATE INPUTS - Reward Note
    // =========================================================================
    signal input rewardNoteVersion;
    signal input rewardAssetId;
    signal input rewardAmount;
    signal input recipientPk;
    signal input rewardBlinding;
    signal input rewardAccumulator;

    // =========================================================================
    // SECTION 1: KEY DERIVATION
    // =========================================================================
    component keys = DeriveKeys();
    keys.ask <== ask;
    keys.nsk <== nsk;
    signal pk <== keys.pk;
    signal nk <== keys.nk;

    // =========================================================================
    // SECTION 2: RECOMPUTE DEPLOYMENT COMMITMENT
    // =========================================================================
    // Same formula as ShieldedMiningDeploy - uses MINING_DOMAIN for domain separation
    // deploymentCommitment = Poseidon(MINING_DOMAIN, roundId, amount, blockMask, pk, blinding)
    component commitmentHash = Poseidon(6);
    commitmentHash.inputs[0] <== MINING_DOMAIN();
    commitmentHash.inputs[1] <== roundId;
    commitmentHash.inputs[2] <== deploymentAmount;
    commitmentHash.inputs[3] <== blockSelectionMask;
    commitmentHash.inputs[4] <== pk;
    commitmentHash.inputs[5] <== blinding;
    signal recomputedCommitment <== commitmentHash.out;

    // =========================================================================
    // SECTION 3: VERIFY DEPLOYMENT IN SHARED COMMITMENT TREE
    // =========================================================================
    // The deployment commitment is stored in the SAME tree as shielded notes
    component merkleProof = MerkleProof(levels);
    merkleProof.leaf <== recomputedCommitment;
    merkleProof.pathIndices <== deploymentLeafIndex;
    for (var i = 0; i < levels; i++) {
        merkleProof.pathElements[i] <== deploymentPathElements[i];
    }
    // Verify root matches the snapshotted tree root
    merkleProof.root === commitmentTreeRoot;

    // =========================================================================
    // SECTION 4: COMPUTE NULLIFIER (prevent double-claim)
    // =========================================================================
    // nullifier = Poseidon(nk, commitment, leafIndex)
    component nullifierHash = Poseidon(3);
    nullifierHash.inputs[0] <== nk;
    nullifierHash.inputs[1] <== recomputedCommitment;
    nullifierHash.inputs[2] <== deploymentLeafIndex;
    // Verify nullifier matches public input
    deploymentNullifier === nullifierHash.out;

    // =========================================================================
    // SECTION 5: VERIFY WINNING BLOCK IS IN SELECTION
    // =========================================================================
    // This is the CRITICAL constraint that proves the user selected the winning block

    // Decompose mask into bits
    component maskBits = Num2Bits(25);
    maskBits.in <== blockSelectionMask;

    // Select the bit at winningBlock position using IndexSelect
    component blockSelector = IndexSelect(25);
    for (var i = 0; i < 25; i++) {
        blockSelector.arr[i] <== maskBits.out[i];
    }
    blockSelector.index <== winningBlock;

    // THE WINNING BLOCK MUST BE SELECTED (bit must be 1)
    blockSelector.out === 1;

    // Also verify winningBlock is in valid range (0-24)
    component winningBlockRange = LessThan(8);
    winningBlockRange.in[0] <== winningBlock;
    winningBlockRange.in[1] <== 25;
    winningBlockRange.out === 1;

    // =========================================================================
    // SECTION 6: CREATE REWARD NOTE COMMITMENT
    // =========================================================================
    // Uses existing NoteCommitment template
    component rewardNote = NoteCommitment();
    rewardNote.version <== rewardNoteVersion;
    rewardNote.assetId <== rewardAssetId;
    rewardNote.amount <== rewardAmount;
    rewardNote.pk <== recipientPk;
    rewardNote.blinding <== rewardBlinding;
    rewardNote.rewardAccumulator <== rewardAccumulator;

    // Verify output commitment matches public input
    rewardNoteCommitment === rewardNote.commitment;

    // =========================================================================
    // SECTION 7: BIND PUBLIC INPUTS (anti-malleability)
    // =========================================================================
    signal transactParamsSquare <== transactParamsHash * transactParamsHash;
    signal roundIdSquare <== roundId * roundId;
    signal winningBlockSquare <== winningBlock * winningBlock;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Template Parameters:
//   levels = 26 (matches shielded pool commitment tree, ~67M leaves)
//
// Public Inputs:
//   commitmentTreeRoot    - Shared shielded pool tree root (snapshotted at round end)
//   deploymentNullifier   - Prevents double-claiming the same deployment
//   roundId               - Mining round being claimed
//   winningBlock          - The winning block index (0-24)
//   rewardNoteCommitment  - Output commitment for the reward note
//   transactParamsHash    - Binding to reward transfer parameters
// =============================================================================
component main {
    public [
        commitmentTreeRoot,    // Shared shielded pool tree root (snapshotted)
        deploymentNullifier,   // Prevents double-claiming
        roundId,               // Mining round being claimed
        winningBlock,          // Winning block index (0-24)
        rewardNoteCommitment,  // Output commitment for reward note
        transactParamsHash     // Binding to reward transfer params
    ]
} = ShieldedClaim(26);

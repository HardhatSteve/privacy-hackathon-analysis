pragma circom 2.0.0;

/*
================================================================================
SHIELDED MINING DEPLOY CIRCUIT
Private Mining - Spend Notes and Create Deployment
================================================================================

Enables users to spend shielded notes and create a private mining deployment.
The block selection is hidden, but the deployment amount is public for fair
reward calculation.

This circuit:
1. Spends 2 input unified SOL notes (with nullifiers and merkle proofs)
2. Creates 1 deployment commitment (with MINING_DOMAIN)
3. Creates 1 change note (standard shielded note)

Public Inputs:
  - root: Commitment tree merkle root
  - deploymentAmount: SOL amount being deployed (visible for fair rewards)
  - roundId: Current mining round
  - inputNullifier[2]: Nullifiers for spent notes (prevent double-spend)
  - deploymentCommitment: Opaque commitment to block selection
  - changeOutputCommitment: Standard note commitment for change
  - relayerFee: Fee paid to relayer
  - relayer: Relayer address (as field element)
  - transactParamsHash: Hash binding external params (anti-malleability)

Private Inputs:
  - Input notes (2): amount, blinding, keys, merkle proofs
  - Block selection: blockSelectionMask (25-bit), deploymentBlinding
  - Change note: amount, pk, blinding, accumulator
  - Global accumulator for reward calculation

Constraints:
  1. Verify input notes exist in tree (2x merkle proofs)
  2. Compute nullifiers for spent notes
  3. Validate block selection mask (25 bits, at least 1 selected)
  4. Compute deployment commitment with MINING_DOMAIN
  5. Compute change note commitment
  6. Value conservation: sum(inputs) = deployment + change + relayerFee

Estimated constraints: ~18,000-22,000
================================================================================
*/

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

// Keys
include "./lib/keys/derive-keys.circom";

// Notes
include "./lib/notes/note-commitment.circom";
include "./lib/notes/compute-nullifier.circom";
include "./lib/notes/enforce-nullifier-uniqueness.circom";

// Rewards
include "./lib/rewards/compute-reward.circom";

// Merkle
include "./lib/merkle/merkle-proof.circom";

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

// =============================================================================
// UNIFIED SOL ASSET ID
// =============================================================================
// Asset ID for unified SOL in the shielded pool
function UNIFIED_SOL_ASSET_ID() {
    return 1;
}

// =============================================================================
// SHIELDED MINING DEPLOY CIRCUIT
// =============================================================================
template ShieldedMiningDeploy(levels, nIns) {

    // =========================================================================
    // PUBLIC INPUTS
    // =========================================================================
    signal input root;                          // Commitment tree merkle root
    signal input deploymentAmount;              // SOL being deployed (visible)
    signal input roundId;                       // Mining round ID
    signal input inputNullifier[nIns];          // Nullifiers for spent notes
    signal input deploymentCommitment;          // Deployment commitment (opaque)
    signal input changeOutputCommitment;        // Change note commitment
    signal input relayerFee;                    // Fee paid to relayer
    signal input relayer;                       // Relayer address as field
    signal input transactParamsHash;            // Binding to external params

    // =========================================================================
    // PRIVATE INPUTS - Input Notes
    // =========================================================================
    signal input inNoteVersion[nIns];
    signal input inAssetId[nIns];               // Must be UNIFIED_SOL_ASSET_ID
    signal input inAmount[nIns];
    signal input inAsk[nIns];                   // Spend authorizing secret key
    signal input inNsk[nIns];                   // Nullifier secret key
    signal input inBlinding[nIns];
    signal input inRewardAccumulator[nIns];
    signal input inRewardRemainder[nIns];
    signal input inPathIndices[nIns];
    signal input inPathElements[nIns][levels];

    // =========================================================================
    // PRIVATE INPUTS - Global Reward Accumulator
    // =========================================================================
    signal input globalRewardAccumulator;       // Current global accumulator for unified SOL

    // =========================================================================
    // PRIVATE INPUTS - Deployment
    // =========================================================================
    signal input blockSelectionMask;            // 25-bit bitmask (blocks 0-24)
    signal input deploymentBlinding;            // Blinding for deployment commitment

    // =========================================================================
    // PRIVATE INPUTS - Change Note
    // =========================================================================
    signal input changeNoteVersion;
    signal input changeAmount;
    signal input changePk;                      // Recipient's public key
    signal input changeBlinding;
    signal input changeRewardAccumulator;

    // =========================================================================
    // SECTION 1: INPUT NOTE VERIFICATION
    // =========================================================================
    component inKeys[nIns];
    component inCommitment[nIns];
    component inNullifier[nIns];
    component inTree[nIns];
    component inCheckRoot[nIns];
    component inAmountCheck[nIns];
    component inAssetIdCheck[nIns];
    component rewardCalc[nIns];
    signal inValue[nIns];

    for (var tx = 0; tx < nIns; tx++) {
        // Derive keys from ask/nsk
        inKeys[tx] = DeriveKeys();
        inKeys[tx].ask <== inAsk[tx];
        inKeys[tx].nsk <== inNsk[tx];

        // Compute note commitment
        inCommitment[tx] = NoteCommitment();
        inCommitment[tx].version <== inNoteVersion[tx];
        inCommitment[tx].assetId <== inAssetId[tx];
        inCommitment[tx].amount <== inAmount[tx];
        inCommitment[tx].pk <== inKeys[tx].pk;
        inCommitment[tx].blinding <== inBlinding[tx];
        inCommitment[tx].rewardAccumulator <== inRewardAccumulator[tx];

        // Compute nullifier
        inNullifier[tx] = ComputeNullifier();
        inNullifier[tx].nk <== inKeys[tx].nk;
        inNullifier[tx].commitment <== inCommitment[tx].commitment;
        inNullifier[tx].pathIndices <== inPathIndices[tx];
        // Verify nullifier matches public input
        inNullifier[tx].nullifier === inputNullifier[tx];

        // Verify merkle proof
        inTree[tx] = MerkleProof(levels);
        inTree[tx].leaf <== inCommitment[tx].commitment;
        inTree[tx].pathIndices <== inPathIndices[tx];
        for (var i = 0; i < levels; i++) {
            inTree[tx].pathElements[i] <== inPathElements[tx][i];
        }

        // Verify root matches (only if amount > 0)
        inCheckRoot[tx] = ForceEqualIfEnabled();
        inCheckRoot[tx].in[0] <== root;
        inCheckRoot[tx].in[1] <== inTree[tx].root;
        inCheckRoot[tx].enabled <== inAmount[tx];

        // Range check on amount (248 bits)
        inAmountCheck[tx] = Num2Bits(248);
        inAmountCheck[tx].in <== inAmount[tx];

        // Verify asset ID is UNIFIED_SOL_ASSET_ID (only if amount > 0)
        inAssetIdCheck[tx] = ForceEqualIfEnabled();
        inAssetIdCheck[tx].in[0] <== inAssetId[tx];
        inAssetIdCheck[tx].in[1] <== UNIFIED_SOL_ASSET_ID();
        inAssetIdCheck[tx].enabled <== inAmount[tx];

        // Compute reward (yield accrual)
        rewardCalc[tx] = ComputeReward();
        rewardCalc[tx].amount <== inAmount[tx];
        rewardCalc[tx].globalAccumulator <== globalRewardAccumulator;
        rewardCalc[tx].noteAccumulator <== inRewardAccumulator[tx];
        rewardCalc[tx].remainder <== inRewardRemainder[tx];
        inValue[tx] <== rewardCalc[tx].totalValue;
    }

    // =========================================================================
    // SECTION 2: NULLIFIER UNIQUENESS
    // =========================================================================
    component nullifierUnique = EnforceNullifierUniqueness(nIns);
    nullifierUnique.nullifiers <== inputNullifier;

    // =========================================================================
    // SECTION 3: BLOCK SELECTION MASK VALIDATION
    // =========================================================================
    // Ensure mask fits in 25 bits (blocks 0-24)
    component maskBits = Num2Bits(25);
    maskBits.in <== blockSelectionMask;

    // Count selected blocks
    var bitSum = 0;
    for (var i = 0; i < 25; i++) {
        bitSum += maskBits.out[i];
    }
    signal blockCount <== bitSum;

    // Ensure at least one block is selected
    component atLeastOne = GreaterThan(8);
    atLeastOne.in[0] <== blockCount;
    atLeastOne.in[1] <== 0;
    atLeastOne.out === 1;

    // =========================================================================
    // SECTION 4: DEPLOYMENT COMMITMENT
    // =========================================================================
    // Use first input's pk as the deployment owner
    signal deployerPk <== inKeys[0].pk;

    // deploymentCommitment = Poseidon(MINING_DOMAIN, roundId, amount, blockMask, pk, blinding)
    component deployCommitmentHash = Poseidon(6);
    deployCommitmentHash.inputs[0] <== MINING_DOMAIN();
    deployCommitmentHash.inputs[1] <== roundId;
    deployCommitmentHash.inputs[2] <== deploymentAmount;
    deployCommitmentHash.inputs[3] <== blockSelectionMask;
    deployCommitmentHash.inputs[4] <== deployerPk;
    deployCommitmentHash.inputs[5] <== deploymentBlinding;

    // Verify deployment commitment matches public input
    deploymentCommitment === deployCommitmentHash.out;

    // =========================================================================
    // SECTION 5: CHANGE NOTE COMMITMENT
    // =========================================================================
    component changeNote = NoteCommitment();
    changeNote.version <== changeNoteVersion;
    changeNote.assetId <== UNIFIED_SOL_ASSET_ID();
    changeNote.amount <== changeAmount;
    changeNote.pk <== changePk;
    changeNote.blinding <== changeBlinding;
    changeNote.rewardAccumulator <== changeRewardAccumulator;

    // Verify change commitment matches public input
    changeOutputCommitment === changeNote.commitment;

    // Range check on change amount
    component changeAmountCheck = Num2Bits(248);
    changeAmountCheck.in <== changeAmount;

    // =========================================================================
    // SECTION 6: VALUE CONSERVATION
    // =========================================================================
    // sum(input values) = deploymentAmount + changeAmount + relayerFee
    signal totalInputValue <== inValue[0] + inValue[1];
    signal totalOutputValue <== deploymentAmount + changeAmount + relayerFee;
    totalInputValue === totalOutputValue;

    // Range check on deployment amount and relayer fee
    component deploymentAmountCheck = Num2Bits(248);
    deploymentAmountCheck.in <== deploymentAmount;

    component relayerFeeCheck = Num2Bits(248);
    relayerFeeCheck.in <== relayerFee;

    // =========================================================================
    // SECTION 7: PUBLIC INPUT BINDING (anti-malleability)
    // =========================================================================
    signal transactParamsSquare <== transactParamsHash * transactParamsHash;
    signal relayerSquare <== relayer * relayer;
    signal roundIdSquare <== roundId * roundId;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Template Parameters:
//   levels = 26 (matches shielded pool commitment tree, ~67M leaves)
//   nIns = 2 (number of input notes to spend)
//
// Public Inputs:
//   root                   - Commitment tree merkle root
//   deploymentAmount       - SOL being deployed (visible for fair rewards)
//   roundId                - Mining round ID
//   inputNullifier[2]      - Nullifiers for spent notes (prevents double-spend)
//   deploymentCommitment   - Deployment commitment (opaque hash)
//   changeOutputCommitment - Change note commitment
//   relayerFee             - Fee paid to relayer
//   relayer                - Relayer address as field element
//   transactParamsHash     - Binding to external params (anti-malleability)
// =============================================================================
component main {
    public [
        root,                   // Commitment tree merkle root
        deploymentAmount,       // SOL being deployed (visible for fair rewards)
        roundId,                // Mining round ID
        inputNullifier,         // Nullifiers for spent notes (prevents double-spend)
        deploymentCommitment,   // Deployment commitment (opaque hash)
        changeOutputCommitment, // Change note commitment
        relayerFee,             // Fee paid to relayer
        relayer,                // Relayer address as field element
        transactParamsHash      // Binding to external params (anti-malleability)
    ]
} = ShieldedMiningDeploy(26, 2);

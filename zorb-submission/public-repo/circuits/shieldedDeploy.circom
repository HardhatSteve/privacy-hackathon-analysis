pragma circom 2.0.0;

/*
================================================================================
SHIELDED DEPLOY CIRCUIT
Private Mining - Commit Phase
================================================================================

Proves that a deployment commitment is correctly formed without revealing
the block selection. Users can deploy SOL to hidden block positions.

Public Inputs:
  - deploymentCommitment: Hash binding all private deployment data
  - amount: SOL being deployed (visible for fair reward calculation)
  - roundId: Current mining round

Private Inputs:
  - blockSelectionMask: 25-bit bitmask (bits 0-24 for blocks 1-25)
  - blinding: Random value for hiding commitment
  - ask: Spend authorizing secret key
  - nsk: Nullifier secret key

Constraints:
  1. Derive pk from wallet keys (proves ownership)
  2. Validate mask is at most 25 bits
  3. Ensure at least one block is selected
  4. Verify commitment = Poseidon(roundId, amount, mask, pk, blinding)

Estimated constraints: ~765
================================================================================
*/

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

// Import existing key derivation
include "./lib/keys/derive-keys.circom";

template ShieldedDeploy() {
    // =========================================================================
    // PUBLIC INPUTS
    // =========================================================================
    signal input deploymentCommitment;  // Commitment to deployment (opaque hash)
    signal input amount;                 // SOL amount being deployed (visible)
    signal input roundId;                // Current round ID

    // =========================================================================
    // PRIVATE INPUTS
    // =========================================================================
    signal input blockSelectionMask;     // 25-bit bitmask (blocks 0-24)
    signal input blinding;               // Random blinding factor
    signal input ask;                    // Spend authorizing secret key
    signal input nsk;                    // Nullifier secret key

    // =========================================================================
    // SECTION 1: KEY DERIVATION
    // =========================================================================
    // Derive pk from wallet keys to bind commitment to owner
    component keys = DeriveKeys();
    keys.ask <== ask;
    keys.nsk <== nsk;
    signal pk <== keys.pk;

    // =========================================================================
    // SECTION 2: VALIDATE BLOCK SELECTION MASK
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
    // SECTION 3: COMPUTE DEPLOYMENT COMMITMENT
    // =========================================================================
    // commitment = Poseidon(roundId, amount, blockSelectionMask, pk, blinding)
    component commitmentHash = Poseidon(5);
    commitmentHash.inputs[0] <== roundId;
    commitmentHash.inputs[1] <== amount;
    commitmentHash.inputs[2] <== blockSelectionMask;
    commitmentHash.inputs[3] <== pk;
    commitmentHash.inputs[4] <== blinding;

    // Verify the public commitment matches
    deploymentCommitment === commitmentHash.out;

    // =========================================================================
    // SECTION 4: BIND PUBLIC INPUTS (anti-malleability)
    // =========================================================================
    signal amountSquare <== amount * amount;
    signal roundIdSquare <== roundId * roundId;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
// Public Inputs:
//   deploymentCommitment - Hash binding all private deployment data
//   amount               - SOL being deployed (visible for fair reward calculation)
//   roundId              - Current mining round ID
// =============================================================================
component main {
    public [
        deploymentCommitment,  // Hash binding all private deployment data
        amount,                // SOL being deployed (visible for fair rewards)
        roundId                // Current mining round ID
    ]
} = ShieldedDeploy();

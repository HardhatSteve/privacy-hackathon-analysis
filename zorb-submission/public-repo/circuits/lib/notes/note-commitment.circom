pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

// Zorb protocol domain separator for note commitments.
// ZORB_DOMAIN = Poseidon(0x7a6f7262) where 0x7a6f7262 is "zorb" as ASCII bigint.
// This ensures commitments are protocol-specific and cannot collide with other protocols.
//
// Computed value: 13585635423589395198278902149970508553677724666160675593377523211102802660896
function ZORB_DOMAIN() {
    return 13585635423589395198278902149970508553677724666160675593377523211102802660896;
}

// Compute note commitment from note fields (position-independent nullifier model)
// commitment = Poseidon(ZORB_DOMAIN, version, assetId, amount, pk, blinding, rewardAccumulator, rho)
//
// The 8-field structure enables:
// - ZORB_DOMAIN: Protocol-specific domain separator (prevents cross-protocol collisions)
// - version: Circuit isolation field (see below)
// - assetId: Multi-asset support
// - amount: Value of the note
// - pk: Owner's public key (binds to owner)
// - blinding: Randomness for hiding (rcm)
// - rewardAccumulator: Snapshot for yield calculation
// - rho: Uniqueness parameter for position-independent nullifiers (Orchard model)
//
// POSITION-INDEPENDENT NULLIFIERS (RHO FIELD)
// -------------------------------------------
// The `rho` field enables position-independent nullifier derivation:
//
//   nullifier = Poseidon(nk, rho, commitment)
//
// For output notes created by transactions:
//   - rho is derived from the nullifier of the spent note (1:1 pairing)
//   - This creates a chain: spent note's nullifier → new note's rho
//
// Benefits:
//   - Nullifiers don't depend on merkle tree position (pathIndices)
//   - Notes can be inserted at any tree position without changing nullifier
//   - Simplifies wallet recovery (no position tracking required)
//
// CIRCUIT ISOLATION VIA VERSION FIELD
// ------------------------------------
// The `version` field provides isolation between circuits:
//
//   - Transaction circuit enforces: version === 0
//   - Future circuits MUST use: version !== 0
//
// This ensures notes created by one circuit cannot be consumed by another:
//   - Different version → different commitment → different nullifier
//   - No cross-circuit attacks possible
//
// When Zorb evolves to programmable privacy with multiple circuits, the version
// field will be replaced by a proper circuitId in a new commitment scheme.
// Until then, version=0 enforcement provides equivalent security.
template NoteCommitment() {
    signal input version;
    signal input assetId;
    signal input amount;
    signal input pk;
    signal input blinding;
    signal input rewardAccumulator;
    signal input rho;              // Uniqueness parameter (from spent note's nullifier)
    signal output commitment;

    component hasher = Poseidon(8);
    hasher.inputs[0] <== ZORB_DOMAIN();
    hasher.inputs[1] <== version;
    hasher.inputs[2] <== assetId;
    hasher.inputs[3] <== amount;
    hasher.inputs[4] <== pk;
    hasher.inputs[5] <== blinding;
    hasher.inputs[6] <== rewardAccumulator;
    hasher.inputs[7] <== rho;
    commitment <== hasher.out;
}

use anchor_lang::prelude::*;
use groth16_solana::groth16::Groth16Verifier;
use crate::PrivacyError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerificationKeyData {
    pub nr_pubinputs: u32,
    pub vk_alpha_g1: [u8; 32],
    pub vk_beta_g2: [u8; 64],
    pub vk_gamma_g2: [u8; 64],
    pub vk_delta_g2: [u8; 64],
    pub vk_ic: Vec<[u8; 32]>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProofData {
    pub proof_a_g1: [u8; 32],
    pub proof_b_g2: [u8; 64],
    pub proof_c_g1: [u8; 32],
}

#[account]
pub struct VerifierState {
    pub withdraw_vk: VerificationKeyData,
    pub is_initialized: bool,
}

pub fn verify_withdraw_proof(
    verifier_state: &Account<VerifierState>,
    proof_data: &ProofData,
    root: &[u8; 32],
    nullifier_hash: &[u8; 32],
    recipient: &Pubkey,
    relayer: &Pubkey,
    fee: u64,
    amount: u64,
) -> Result<bool> {
    // 1. Prepare public inputs for the circuit
    // Circuit expects: [root, nullifierHash, recipient_low, recipient_high, relayer_low, relayer_high, fee, amount]
    
    let (recipient_low, recipient_high) = split_pubkey_bytes(recipient);
    let (relayer_low, relayer_high) = split_pubkey_bytes(relayer);
    
    let fee_bytes = pad_u64(&fee.to_le_bytes());
    let amount_bytes = pad_u64(&amount.to_le_bytes());

    let public_inputs = vec![
        root,
        nullifier_hash,
        &recipient_low,
        &recipient_high,
        &relayer_low,
        &relayer_high,
        &fee_bytes,
        &amount_bytes,
    ];

    // 2. Perform ZK-SNARK Verification
    let vk = &verifier_state.withdraw_vk;
    
    let mut verifier = Groth16Verifier::new(
        &proof_data.proof_a_g1,
        &proof_data.proof_b_g2,
        &proof_data.proof_c_g1,
        &public_inputs,
        &vk.vk_alpha_g1,
        &vk.vk_beta_g2,
        &vk.vk_gamma_g2,
        &vk.vk_delta_g2,
        &vk.vk_ic,
    ).map_err(|_| PrivacyError::InvalidProof)?;

    let verified = verifier.verify().map_err(|_| PrivacyError::InvalidProof)?;
    
    if !verified {
        return Err(PrivacyError::InvalidProof.into());
    }

    Ok(true)
}

fn split_pubkey_bytes(pubkey: &Pubkey) -> ([u8; 32], [u8; 32]) {
    let bytes = pubkey.to_bytes();
    let mut low = [0u8; 32];
    let mut high = [0u8; 32];
    
    // Split the 32 byte key into two 16 byte chunks inside 32 byte arrays
    // This matches how the Circom circuit expects the signals to avoid overflows
    low[..16].copy_from_slice(&bytes[16..]);
    high[..16].copy_from_slice(&bytes[..16]);
    
    (low, high)
}

fn pad_u64(bytes: &[u8; 8]) -> [u8; 32] {
    let mut padded = [0u8; 32];
    padded[..8].copy_from_slice(bytes);
    padded
}

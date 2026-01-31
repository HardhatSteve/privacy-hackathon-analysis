use anchor_lang::prelude::*;
use groth16_solana::groth16::Groth16Verifier;
use crate::PrivacyError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerificationKeyData {
    pub alpha: [u8; 32],
    pub beta: [u8; 64],
    pub gamma: [u8; 64],
    pub delta: [u8; 64],
    pub ic: Vec<[u8; 32]>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProofData {
    pub a: [u8; 32],
    pub b: [u8; 64],
    pub c: [u8; 32],
}

#[account]
pub struct VerifierState {
    pub withdraw_vk: VerificationKeyData,
    pub is_initialized: bool,
}

pub fn verify_withdraw_proof(
    verifier_state: &Account<VerifierState>,
    proof: &ProofData,
    root: &[u8; 32],
    nullifier_hash: &[u8; 32],
    recipient: &Pubkey,
    relayer: &Pubkey,
    fee: u64,
    amount: u64,
) -> Result<bool> {
    // break up pks for the circuit. 
    let (recipient_low, recipient_high) = split_pubkey_bytes(recipient);
    let (relayer_low, relayer_high) = split_pubkey_bytes(relayer);
    
    let fee_bytes = fee.to_le_bytes();
    let amount_bytes = amount.to_le_bytes();
    let root_bytes = *root;
    let nullifier_hash_bytes = *nullifier_hash;

    // hash all signals to bind them to the proof. 
    // Poseidon(recipient, relayer, fee, root, amount, nullifier)
    let statement_hash = crate::poseidon::PoseidonHasherWrapper::hash_multiple_bytes(&[
        recipient_low,
        recipient_high,
        relayer_low,
        relayer_high,
        pad_u64(&fee_bytes),
        root_bytes,
        pad_u64(&amount_bytes),
        nullifier_hash_bytes,
    ])?;

    // order here must match the circom main component!
    let public_inputs = vec![
        statement_hash,     // 0: output statementHash
        root_bytes,        // 1: root
        nullifier_hash_bytes, // 2: nullifierHash
        recipient_low,      // 3: recipient_low
        recipient_high,     // 4: recipient_high
        relayer_low,        // 5: relayer_low
        relayer_high,       // 6: relayer_high
        pad_u64(&fee_bytes),   // 7: fee
        pad_u64(&amount_bytes),// 8: amount
    ];

    // hit the groth16 verifier. uses solana syscalls for speed.
    let vk = &verifier_state.withdraw_vk;
    
    // Convert proof data to expected format
    let proof_a = &proof.a;
    let proof_b = &proof.b;
    let proof_c = &proof.c;
    
    // Create verifying key from our data
    let verifying_key = groth16_solana::groth16::VerifyingKey {
        alpha_g1: vk.alpha,
        beta_g2: vk.beta,
        gamma_g2: vk.gamma,
        delta_g2: vk.delta,
        ic: vk.ic.clone(),
    };
    
    let mut verifier = Groth16Verifier::new(
        proof_a,
        proof_b,
        proof_c,
        &public_inputs,
        &verifying_key,
    ).map_err(|_| PrivacyError::InvalidProof)?;
    
    let is_valid = verifier.verify().map_err(|_| PrivacyError::InvalidProof)?;
    
    if !is_valid {
        return Err(PrivacyError::InvalidProof.into());
    }

    Ok(true)
}

fn split_pubkey_bytes(pubkey: &Pubkey) -> ([u8; 32], [u8; 32]) {
    let bytes = pubkey.to_bytes(); // 32 bytes (Big-Endian usually or raw addr)
    let mut low = [0u8; 32];
    let mut high = [0u8; 32];
    
    // split the 32 byte key into two 16 byte chunks inside 32 byte arrays.
    // circuit needs it this way to avoid overflow.
    low[..16].copy_from_slice(&bytes[16..]);
    high[..16].copy_from_slice(&bytes[..16]);
    
    (low, high)
}

fn pad_u64(bytes: &[u8; 8]) -> [u8; 32] {
    let mut padded = [0u8; 32];
    padded[..8].copy_from_slice(bytes);
    padded
}

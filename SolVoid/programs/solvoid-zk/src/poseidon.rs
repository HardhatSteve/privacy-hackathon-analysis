use anchor_lang::prelude::*;
use light_poseidon::{Poseidon, PoseidonHasher};
use ark_bn254::Fr;
use ark_ff::{BigInteger, PrimeField};

pub struct PoseidonHasherWrapper;

impl PoseidonHasherWrapper {
    // Optimized hash for two inputs to reduce stack usage
    pub fn hash_two_bytes(a: &[u8; 32], b: &[u8; 32]) -> Result<[u8; 32]> {
        // Convert inputs to field elements directly without vector
        let fr_a = Fr::from_le_bytes_mod_order(a);
        let fr_b = Fr::from_le_bytes_mod_order(b);
        
        // Create hasher for width 3 (2 inputs + capacity)
        let mut hasher = light_poseidon::Poseidon::<ark_bn254::Fr>::new_circom(3)
            .map_err(|_| ErrorCode::AccountNotInitialized)?;
        let result_fr = hasher.hash(&[fr_a, fr_b]).map_err(|_| ErrorCode::InstructionDidNotDeserialize)?;
        
        let bytes = result_fr.into_bigint().to_bytes_le();
        let mut out = [0u8; 32];
        out[..bytes.len()].copy_from_slice(&bytes);
        Ok(out)
    }
    
    // multiple inputs -> one hash. matches circom. (kept for compatibility)
    pub fn hash_multiple_bytes(inputs: &[[u8; 32]]) -> Result<[u8; 32]> {
        let t = inputs.len() + 1;
        
        // Convert inputs to field elements
        let mut fr_inputs = Vec::new();
        for input in inputs {
            let mut bytes = [0u8; 32];
            bytes.copy_from_slice(input);
            let fr = Fr::from_le_bytes_mod_order(&bytes);
            fr_inputs.push(fr);
        }
        
        // Create hasher with default parameters for width t
        let mut hasher = light_poseidon::Poseidon::<ark_bn254::Fr>::new_circom(t as usize)
            .map_err(|_| ErrorCode::AccountNotInitialized)?;
        let result_fr = hasher.hash(&fr_inputs).map_err(|_| ErrorCode::InstructionDidNotDeserialize)?;
        
        let bytes = result_fr.into_bigint().to_bytes_le();
        let mut out = [0u8; 32];
        out[..bytes.len()].copy_from_slice(&bytes);
        Ok(out)
    }
}

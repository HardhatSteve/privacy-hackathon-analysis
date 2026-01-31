//! Compute correct ZEROS and EMPTY_ROOT using Poseidon2
//! Run with: cargo run --bin compute_zeros

use acir::{AcirField, FieldElement};
use bn254_blackbox_solver::poseidon_hash;

fn hash_2(a: FieldElement, b: FieldElement) -> FieldElement {
    poseidon_hash(&[a, b], false).unwrap()
}

fn field_to_bytes(f: &FieldElement) -> [u8; 32] {
    let vec = f.to_be_bytes();
    let mut arr = [0u8; 32];
    let len = vec.len().min(32);
    arr[32 - len..].copy_from_slice(&vec[vec.len() - len..]);
    arr
}

fn main() {
    println!("pub const ZEROS: [[u8; 32]; 16] = [");

    let mut current = FieldElement::zero();

    for i in 0..16 {
        let bytes = field_to_bytes(&current);

        print!("    // ZEROS[{}]", i);
        if i == 0 {
            println!(" = zero leaf");
        } else {
            println!(" = hash_2(ZEROS[{}], ZEROS[{}])", i - 1, i - 1);
        }

        print!("    [");
        for (j, b) in bytes.iter().enumerate() {
            if j > 0 && j % 8 == 0 {
                print!("\n     ");
            }
            print!("0x{:02x}, ", b);
        }
        println!("],");

        // Compute next level: hash_2(current, current)
        current = hash_2(current, current);
    }
    println!("];");

    // EMPTY_ROOT = the current value after all 16 levels
    // (which is hash_2(ZEROS[15], ZEROS[15]) computed in the last iteration)
    let root_bytes = field_to_bytes(&current);
    println!();
    println!("pub const EMPTY_ROOT: [u8; 32] = [");
    print!("    ");
    for (j, b) in root_bytes.iter().enumerate() {
        if j > 0 && j % 8 == 0 {
            print!("\n    ");
        }
        print!("0x{:02x}, ", b);
    }
    println!("\n];");
}

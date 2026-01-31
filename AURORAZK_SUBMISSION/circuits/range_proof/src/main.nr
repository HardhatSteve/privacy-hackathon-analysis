// AuroraZK Range Proof Circuit
// 
// Purpose: Prove that an order's price and size are within valid ranges
// WITHOUT revealing the actual price or size values.
//
// The circuit computes the Pedersen commitment internally and returns it
// as a public output. This ensures the commitment is always correct.
//
// Public outputs (visible on-chain):
// - commitment: Pedersen hash of (price, size, nonce)
//
// Public inputs:
// - min_price, max_price: Valid price range
// - min_size, max_size: Valid size range
//
// Private inputs (known only to prover):
// - price: Actual order price
// - size: Actual order size
// - nonce: Random value for hiding

use std::hash::pedersen_hash;

fn main(
    // Private inputs (hidden)
    price: Field,
    size: Field,
    nonce: Field,
    
    // Public inputs (range bounds)
    min_price: pub Field,
    max_price: pub Field,
    min_size: pub Field,
    max_size: pub Field
) -> pub Field {
    // 1. Compute commitment from private values
    // This is returned as a public output - the frontend doesn't need to compute it
    let commitment = pedersen_hash([price, size, nonce]);
    
    // 2. Convert to integers for range checks
    let price_u64 = price as u64;
    let size_u64 = size as u64;
    let min_price_u64 = min_price as u64;
    let max_price_u64 = max_price as u64;
    let min_size_u64 = min_size as u64;
    let max_size_u64 = max_size as u64;
    
    // 3. Range check: min_price <= price <= max_price
    assert(price_u64 >= min_price_u64, "Price below minimum");
    assert(price_u64 <= max_price_u64, "Price above maximum");
    
    // 4. Range check: min_size <= size <= max_size
    assert(size_u64 >= min_size_u64, "Size below minimum");
    assert(size_u64 <= max_size_u64, "Size above maximum");
    
    // 5. Additional sanity checks
    assert(price_u64 > 0, "Price must be positive");
    assert(size_u64 > 0, "Size must be positive");
    
    // Return the commitment as public output
    // This proves the prover knows price, size, nonce that hash to this commitment
    // AND that price and size are within the valid ranges
    commitment
}

// Test cases
#[test]
fn test_valid_order() {
    // Price: $95.00 = 95_000_000 (6 decimals for USDC)
    // Size: 5 SOL = 5_000_000_000 (9 decimals for SOL)
    let price: Field = 95_000_000;
    let size: Field = 5_000_000_000;
    let nonce: Field = 123456789;
    
    // Valid ranges
    let min_price: Field = 1_000_000;      // $1.00
    let max_price: Field = 1_000_000_000;  // $1000.00
    let min_size: Field = 100_000_000;     // 0.1 SOL
    let max_size: Field = 100_000_000_000; // 100 SOL
    
    // The circuit returns the commitment - we don't need to pass it
    let commitment = main(price, size, nonce, min_price, max_price, min_size, max_size);
    
    // Verify commitment is non-zero (computed correctly)
    assert(commitment != 0);
}

#[test(should_fail)]
fn test_price_too_low() {
    let price: Field = 500_000; // $0.50 - below minimum
    let size: Field = 5_000_000_000;
    let nonce: Field = 123456789;
    
    let min_price: Field = 1_000_000;
    let max_price: Field = 1_000_000_000;
    let min_size: Field = 100_000_000;
    let max_size: Field = 100_000_000_000;
    
    let _ = main(price, size, nonce, min_price, max_price, min_size, max_size);
}

#[test(should_fail)]
fn test_size_too_small() {
    let price: Field = 95_000_000;
    let size: Field = 10_000_000; // 0.01 SOL - below minimum
    let nonce: Field = 123456789;
    
    let min_price: Field = 1_000_000;
    let max_price: Field = 1_000_000_000;
    let min_size: Field = 100_000_000;
    let max_size: Field = 100_000_000_000;
    
    let _ = main(price, size, nonce, min_price, max_price, min_size, max_size);
}

use std::hash::pedersen_hash;

fn main(price: Field, size: Field, nonce: Field) -> pub Field {
    pedersen_hash([price, size, nonce])
}

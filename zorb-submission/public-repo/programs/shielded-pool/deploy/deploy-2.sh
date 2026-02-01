cargo build-sbf --features test-mode

PROGRAM_KEYPAIR="./shielded-pool-keypair.json"
PROGRAM_SO="/Users/andrewtian/p/_49ers/zore/target/deploy/shielded_pool.so"

solana program deploy \
    --program-id "$PROGRAM_KEYPAIR" \
    "$PROGRAM_SO"
# API Reference

## Solana Program Instructions

### Initialize Pool

Creates a new privacy pool with fixed denomination.

```rust
pub fn initialize(
    ctx: Context<Initialize>,
    denomination: u64,
    developer_wallet: Pubkey,
) -> Result<()>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `denomination` | u64 | Pool amount in lamports |
| `developer_wallet` | Pubkey | Fee recipient |

---

### Deposit

Deposit funds with a commitment.

```rust
pub fn deposit(
    ctx: Context<Deposit>,
    commitment: [u8; 32],
) -> Result<()>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `commitment` | [u8; 32] | Poseidon(secret, nullifier) |

**Accounts:**
- `pool` - Pool state account
- `depositor` - Signer
- `depositor_token` - Token account
- `token_vault` - Pool vault PDA

---

### Withdraw

Withdraw funds with ZK proof.

```rust
pub fn withdraw(
    ctx: Context<Withdraw>,
    proof: [u8; 128],
    merkle_root: [u8; 32],
    nullifier_hash: [u8; 32],
) -> Result<()>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `proof` | [u8; 128] | Groth16 proof |
| `merkle_root` | [u8; 32] | Current merkle root |
| `nullifier_hash` | [u8; 32] | Poseidon(nullifier) |

---

### Withdraw Encrypted (Phase 2)

Withdraw with encrypted recipient.

```rust
pub fn withdraw_encrypted(
    ctx: Context<WithdrawEncrypted>,
    proof: [u8; 128],
    merkle_root: [u8; 32],
    nullifier_hash: [u8; 32],
    encrypted_payload: [u8; 128],
    relayer_fee: u64,
) -> Result<()>
```

---

### Withdraw Timed (Phase 2)

Withdraw within a time window.

```rust
pub fn withdraw_timed(
    ctx: Context<WithdrawTimed>,
    proof: [u8; 128],
    merkle_root: [u8; 32],
    nullifier_hash: [u8; 32],
    window_start: i64,
    window_end: i64,
) -> Result<()>
```

---

## Relayer API

### POST /relay

Submit encrypted withdrawal.

**Request:**
```json
{
  "pool": "pubkey",
  "proof": "base64",
  "merkle_root": "hex64",
  "nullifier_hash": "hex64",
  "encrypted_recipient": "base64",
  "max_fee": 1000000
}
```

**Response:**
```json
{
  "tx_signature": "base58",
  "status": "submitted"
}
```

### GET /info

Get relayer info.

**Response:**
```json
{
  "fee_bps": 50,
  "processed": 1234,
  "version": "0.1.0"
}
```

### GET /health

Health check.

---

## Events

### DepositEvent
```rust
pub struct DepositEvent {
    pub pool: Pubkey,
    pub leaf_index: u64,
    pub commitment: [u8; 32],
    pub timestamp: i64,
}
```

### WithdrawEvent
```rust
pub struct WithdrawEvent {
    pub pool: Pubkey,
    pub nullifier_hash: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidProof | ZK proof verification failed |
| 6001 | NullifierAlreadySpent | Double-spend attempt |
| 6002 | InvalidMerkleRoot | Root mismatch |
| 6003 | InvalidCommitment | Zero or invalid commitment |
| 6004 | InvalidDepositAmount | Wrong denomination |
| 6005 | InsufficientBalance | Vault underfunded |
| 6006 | PoolFull | Merkle tree at capacity |

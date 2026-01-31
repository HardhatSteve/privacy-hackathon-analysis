# Relayer Network Protocol

## Overview

Relayers submit withdrawal transactions on behalf of users, breaking the on-chain link between depositor and recipient.

## Architecture

```
User (off-chain)
    │
    ├─── 1. Generate ZK proof
    ├─── 2. Encrypt recipient with relayer pubkey
    └─── 3. Submit to Relayer (HTTP/HTTPS)
              │
              ├─── 4. Decrypt recipient
              ├─── 5. Submit tx to Solana
              └─── 6. Collect fee from withdrawal
```

## Relayer Registry

Relayers register on-chain with:
- Public key (for encrypted payloads)
- Fee rate (basis points)
- Reputation score
- Stake (slashable)

## Selection Algorithm

1. Filter by max acceptable fee
2. Sort by reputation * uptime
3. Random selection from top 5 (prevents predictability)

## Fee Structure

| Component | Rate |
|-----------|------|
| Protocol Fee | 0.3% (to developer) |
| Relayer Fee | 0.1-1% (to relayer) |
| **Total Max** | **1.3%** |

## API Specification

### POST /relay

```json
{
  "pool": "pubkey",
  "proof": "base64",
  "merkle_root": "hex",
  "nullifier_hash": "hex",
  "encrypted_recipient": "base64",
  "relayer_fee": 1000000
}
```

### Response

```json
{
  "tx_signature": "base58",
  "status": "submitted"
}
```

## Security

- Encrypted payloads prevent relayer from linking requests
- Stake slashing for censorship
- No custody of funds
- Stateless operation

# Zorb Protocol - Hackathon Submission

**Project**: Zorb Protocol
**Hackathon**: Solana Privacy Hackathon 2026

---

## What is Zorb?

Zorb Protocol provides **HTTPS-level privacy for Solana** through production-grade zero-knowledge circuits:

- **Private SOL & SPL Token Transfers** — Send/receive without exposing amounts or addresses
- **Shielded Pool Architecture** — UTXO-based privacy with indexed Merkle trees
- **Batch Processing** — 4/16/64 transaction batches for cost efficiency
- **Cross-Pool Operations** — Private swaps between token pools

---

## Directory Structure

```
zorb-submission/
├── docs/                     # Submission documentation
│   ├── FINAL_SUBMISSION.md   # Official hackathon submission
│   ├── VIDEO_SCRIPT.md       # Video presentation script
│   ├── JUDGING_CRITERIA.md   # How we align with judging
│   ├── SPONSOR_INTEGRATION_GUIDE.md
│   └── ...
├── public-repo/              # Public-facing code repository
│   ├── circuits/             # Noir ZK circuits
│   ├── programs/             # Solana programs (Anchor)
│   └── README.md
├── video/                    # Video submission assets
│   ├── src/                  # Animation source
│   └── output/               # Rendered frames
├── ZORB_TECHNICAL_CAPABILITIES.md
└── solana-privacy-hack-submission.md
```

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [FINAL_SUBMISSION.md](docs/FINAL_SUBMISSION.md) | Official hackathon submission |
| [VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md) | Video narration script |
| [JUDGING_CRITERIA.md](docs/JUDGING_CRITERIA.md) | Judging alignment analysis |
| [SPONSOR_INTEGRATION_GUIDE.md](docs/SPONSOR_INTEGRATION_GUIDE.md) | Sponsor bounty integrations |
| [ZORB_TECHNICAL_CAPABILITIES.md](ZORB_TECHNICAL_CAPABILITIES.md) | Deep technical overview |

---

## Technical Highlights

### ZK Architecture
- **Noir Circuits** — Modern ZK DSL with formal verification potential
- **Groth16 Proofs** — Constant-size proofs (~200 bytes)
- **Indexed Merkle Tree** — O(1) nullifier lookups vs O(n) PDA pattern

### Security Features
- **On-chain Merkle Computation** — No client-trusted roots
- **Nullifier Double-Spend Prevention** — Cryptographic guarantees
- **Selective Disclosure** — Compliance-ready proofs

### Performance
- **400ms Finality** — Native Solana speed
- **Batch Efficiency** — 4-64x cost reduction per transfer
- **Compressed Accounts** — Minimal on-chain footprint

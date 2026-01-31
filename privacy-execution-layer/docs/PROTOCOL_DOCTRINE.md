# PROTOCOL DOCTRINE v3.0

## Vision

Privacy should be the default state of transactions, not an option.

## Core Principles

This protocol creates a space where:
- **Withdraw ≠ Payment** — withdrawal is not a targeted payment
- **User ≠ Wallet** — user is not identifiable by their wallet
- **Time ≠ Signal** — transaction timing provides no analysis signal
- **Amount ≠ Flow** — amount does not reveal transaction flow

## Anti-Goals

We explicitly do NOT aim to:
- ❌ Create a token for speculation
- ❌ Build a centralized service with "support"
- ❌ Marketing hype and quick "launch"
- ❌ Complexity for the sake of features
- ❌ Control over user funds

## Fundamental Invariants

### Invariant #1: Absolute Unlinkability
```
For any deposit D and withdrawal W:
P[link(D, W) | ProtocolState] ≤ P[link(D, W) | Random]
```
The protocol provides no information that allows linking deposits to withdrawals better than random guessing.

### Invariant #2: Single-Spend Guarantee
```
∀ nullifier N: count_spends(N) ≤ 1
```
Each nullifier can only be used once. Cryptographic guarantee, not trusted party.

### Invariant #3: Zero Trusted Parties
```
AdminPower = Ø
CustodyPower = Ø
UpgradePower = Timelocked(30d)
EmergencyShutdown = Never
```
No admin keys can steal or freeze funds.

### Invariant #4: Protocol > Implementation
```
GitHub ≠ Service
UI ≠ Required
Team ≠ Operator
```
The protocol exists as a mathematical construct, not a specific service.

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Blockchain | Solana | High TPS, low fees |
| ZK Framework | Groth16/Circom | Best documentation, Solana compatibility |
| Hash Function | Poseidon | Optimized for ZK circuits |
| Merkle Tree | Depth 20 | ~1M leaves capacity |
| Encryption | ECIES | For Phase 2 encrypted payloads |

## Success Metrics

The protocol is successful when:
1. No deposits have been linked to withdrawals
2. Zero funds lost to bugs or exploits
3. Protocol continues operating without the team
4. Independent relayers and UIs exist

---

**Document Version**: v1.0  
**Last Updated**: 2026-01-21  
**Status**: Approved for Phase 0

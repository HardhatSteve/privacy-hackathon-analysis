# Technical Due Diligence: OBSCURA_APP

**Repository:** https://github.com/protocoldaemon-sec/OBSCURA_APP
**Commit:** 40691c8047050c9e338d8876142aa9796a8cb409
**Category:** Privacy DeFi Ecosystem

---

## Executive Summary

OBSCURA is an ambitious privacy-first DeFi ecosystem combining multiple privacy technologies: WOTS+ post-quantum signatures, Arcium MPC, Light Protocol ZK compression, and stealth addresses. The project demonstrates **substantial technical sophistication** with real cryptographic implementations and deployed testnet contracts.

**Rating: 7/10** - Advanced implementation with working demos, but architectural complexity and centralization risks warrant caution.

---

## Architecture

**Backend Services (5 total):**
1. **darkPool** - MPC order matching (Arcium)
2. **darkOTC** - RFQ trading
3. **vault** - Privacy transfers
4. **darkSwap&Bridge** - Cross-chain swaps
5. **Compliance** - Address screening

**Deployed Programs (Devnet):**
- Vault: `GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE`
- Settlement: `F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE`

---

## Privacy Implementation

**What's Actually Implemented:**
- ✅ **WOTS+ Signatures** (mochimo-wots-v2 1.1.1): Post-quantum
- ✅ **Stealth Addresses** (EIP-5564): Real ECDH key derivation
- ✅ **Pedersen Commitments** (secp256k1): Cryptographic hiding
- ✅ **Arcium MPC** (v0.6.3): Encrypted order matching

**What's NOT Implemented:**
- ❌ **ZK Proofs**: Whitepaper claims Groth16 circuits - no circuit files found
- ❌ **Trustless Verification**: Relies on relayer/backend trust

**Privacy Architecture:**
```
DEPOSIT: User → Vault PDA (visible)
BALANCE: Encrypted off-chain (Arcium, requires backend trust)
WITHDRAW: Relayer → Recipient (direct transfer, breaks vault link!)
```

**Verified Privacy Test:** Withdrawal TX doesn't reference vault PDA - graph tracing fails ✅

---

## Security Red Flags

**Critical:**
1. Centralized relayer - Single point of failure
2. Off-chain balance trust - Backend can lie
3. Beta dependencies - Arcium 0.6.3 (testnet only)

**Cryptographic Weaknesses:**
- Pedersen H derivation uses hash instead of NUMS point
- ECIES uses raw SHA-256 instead of HKDF

---

## Completeness

- ✅ darkPool: MPC order matching works
- ✅ darkOTC: Full RFQ with 18 test files
- ✅ vault: Real privacy test verified
- ❌ ZK circuits: Missing
- ❌ Mainnet: Not deployed

---

## Verdict

**Strengths:**
- Real crypto implementations (no mocks)
- Advanced tech stack (Arcium + Light + WOTS+)
- Comprehensive docs and testing

**Weaknesses:**
- Overstated privacy claims
- Centralization risks
- Beta dependencies

Solid reference for Arcium MPC integration. Clarify privacy model before production use.

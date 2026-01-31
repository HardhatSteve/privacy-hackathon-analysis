# CORE INVARIANTS

## The Four Untouchable Rules

These invariants MUST NEVER be violated. Any code change that could break these requires full security review.

---

## Invariant #1: Absolute Unlinkability

### Formal Definition
```
∀ deposit D, withdrawal W:
  P[link(D, W) | ProtocolState] ≤ P[link(D, W) | Random]
```

### What This Means
- On-chain data reveals nothing about deposit-withdrawal relationships
- Same probability of correct guess as random selection
- Anonymity set = all deposits in pool

### Violation Detection
- [ ] Transaction metadata contains recipient address
- [ ] Timing correlation possible within pool
- [ ] Amount patterns reveal flow

---

## Invariant #2: Single-Spend Guarantee

### Formal Definition
```
∀ nullifier N: count_spends(N) ≤ 1
```

### What This Means
- Each commitment can only be withdrawn once
- Double-spend is cryptographically impossible
- Enforced via global nullifier registry

### Implementation
```rust
// In withdraw instruction:
require!(!nullifier_set.contains(&nullifier_hash), NullifierAlreadySpent);
nullifier_set.insert(nullifier_hash);
```

### Violation Detection
- [ ] Nullifier check missing in code path
- [ ] Race condition in concurrent withdrawals
- [ ] Nullifier storage corruption

---

## Invariant #3: Zero Trusted Parties

### Formal Definition
```
AdminPower = Ø
CustodyPower = Ø  
UpgradePower = Timelocked(30d)
EmergencyShutdown = Never
```

### What This Means
- No admin key can steal funds
- No party can freeze funds
- No emergency pause (by design)
- Upgrades require 30-day public notice

### Verification
```rust
// No upgrade_authority in program
// No freeze_authority on accounts
// No admin signer requirements
```

### Violation Detection
- [ ] Admin-only instruction exists
- [ ] Program is upgradeable without timelock
- [ ] Any key can pause protocol

---

## Invariant #4: Protocol > Implementation

### Formal Definition
```
GitHub ≠ Service
UI ≠ Required
Team ≠ Operator
```

### What This Means
- Protocol works without original team
- No required frontend (CLI is sufficient)
- Multiple implementations possible
- Forkable and self-sustaining

### Verification
- [ ] CLI can perform all operations
- [ ] No server-side requirements
- [ ] Open source with clear license

---

## Change Control

Any PR that touches these invariants:
1. Requires 2+ security-focused reviews
2. Must update threat model
3. Requires explicit invariant check
4. Needs extended testing period

---

**Document Version**: v1.0  
**Status**: Locked - requires formal review to modify

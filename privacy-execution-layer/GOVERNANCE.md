# Governance

## Decision Making Process

### 1. Discussion Phase (7 days)
- Open Issue with `[DISCUSSION]` prefix
- Minimum 3 participants required
- Technical arguments only

### 2. Proposal Phase (7 days)
- Create `[PROPOSAL]` issue if consensus reached
- Formal description of change
- Vote via GitHub Reactions:
  - 👍 = For
  - 👎 = Against
  - 🤔 = Abstain

### 3. Approval Criteria
- **Standard changes**: 75% approval, 5+ participants
- **Core invariant changes**: 85% approval, 10+ participants
- **Governance changes**: 85% approval, 10+ participants, 14 days discussion

### 4. Implementation
- Create Pull Request
- Minimum 2 code reviews
- All tests pass
- Merge to main

## Roles

| Role | Permissions |
|------|-------------|
| **Contributor** | Open issues, vote, submit PRs |
| **Reviewer** | Review and approve PRs |
| **Maintainer** | Merge PRs, manage releases |

## Core Invariants

These rules CANNOT be changed:
1. **Absolute Unlinkability** - No deposit-withdrawal linking
2. **Single-Spend Guarantee** - Cryptographic nullifier enforcement
3. **Zero Trusted Parties** - No admin keys
4. **Protocol > Implementation** - Works without team

## Release Process

1. Feature freeze
2. Security review
3. Testing on devnet
4. Changelog update
5. Tag and release
6. Documentation update

## Emergency Procedures

For critical security issues:
1. Immediate patch without full voting
2. Post-incident review
3. Governance vote on changes

## Transparency

All decisions are:
- Documented in Issues/PRs
- Publicly visible
- Traceable to participants

---

*Code is law. Governance serves the code.*

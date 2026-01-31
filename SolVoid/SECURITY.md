#  Security Policy

## Security Disclosure

Privacy is a human right, but software security is a continuous process. If you discover a vulnerability in SolVoid, we ask that you disclose it to us responsibly so we can protect our users.

### Reporting a Vulnerability
- **Email:** [security@solvoid.io] (Placeholder)
- **Encryption:** Please use our PGP key (Link placeholder) to encrypt sensitive reports.
- **Process:** We will acknowledge your report within 48 hours and provide a timeline for a fix. We ask that you do not disclose the vulnerability publicly until we have released a patch.

---

##  Security Best Practices for Users
1. **Never share your Secret or Nullifier.** These are the only keys to your anonymous funds. If lost or stolen, your funds are gone.
2. **Use a Fresh Wallet for Withdrawals.** To maintain privacy, ensure your destination address has no previous on-chain links to your identity.
3. **Verify the Domain.** Always ensure you are using the official `solvoid.io` dashboard or a verified local build of the SDK/CLI.
4. **Network Fees.** If not using a relayer, be aware that funding a fresh wallet with SOL for gas can compromise your privacy via timing or source-analysis.

---

##  Known Security Considerations (Brutal Honesty)
1. **Un-audited Code:** As of the current version, this protocol has **NOT** undergone a professional security audit.
2. **Trusted Setup:** The current ceremony files are for testing. A production-grade Multi-Party Computation (MPC) trusted setup is required before Mainnet launch.
3. **Draft Circuits:** Some constraints in the `withdraw.circom` are undergoing refinement to prevent potential edge-case under-constraints.
4. **Relayer Trust:** While relayers cannot steal funds (thanks to ZK binding), they could theoretically log user IP addresses or refuse to broadcast transactions (DoS).

---

##  Supported Versions
| Version | Supported |
|---------|-----------|
| 0.2.x   |  Beta    |
| 0.1.x   |  Legacy  |

---

##  Bug Bounty
We are currently operating a "Friendly Hacker" program. Critical vulnerabilities reported responsibly may be eligible for rewards in future protocol development funds.

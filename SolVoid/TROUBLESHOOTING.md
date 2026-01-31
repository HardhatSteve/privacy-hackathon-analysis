#  Troubleshooting SolVoid

This document helps resolve common issues encountered while setting up or using the SolVoid protocol.

---

##  Common Setup Issues

### "circom" or "snarkjs" command not found
- **Solution:** Install them globally: `npm install -g circom snarkjs`.

### Rust/Anchor Build Failures
- **Issue:** `error[E0658]: use of unstable library feature`
- **Solution:** Ensure you are on the latest stable Rust: `rustup update stable`.
- **Issue:** `Anchor version mismatch`
- **Solution:** Check your version with `anchor --version`. This project currently uses `0.30.0`.

---

##  Transaction & Wallet Issues

### Withdrawal Fails with "Invalid Proof"
1.  **Check Secret/Nullifier:** Ensure you are using the exact hex strings provided during the deposit. Both are case-sensitive.
2.  **Verify Amount:** You must withdraw the *exact* amount that was shielded. Partial withdrawals are not currently supported in this alpha version.
3.  **Root Drift:** If the Merkle Tree was updated by another user while you were generating the proof, your proof is now invalid. Retry the withdrawal.

### "Insufficient Vault Balance"
- **Reason:** Someone might have withdrawn funds before you (if using a testing pool) or there's a protocol fee mismatch.
- **Check:** Use `solvoid status` to see the vault balance.

---

##  Network & RPC Issues

### "429 Too Many Requests"
- **Reason:** Public RPC endpoints often rate-limit high-volume requests (like fetching a full Merkle Tree).
- **Solution:** Use a private RPC provider like Helius, Alchemy, or QuickNode.

---

##  FAQ

**Q: Can I withdraw less than I deposited?**
A: No. Currently, SolVoid is a "full-shield" protocol. You must withdraw the total shielded amount.

**Q: What happens if I lose my secret?**
A: **The funds are lost forever.** SolVoid is non-custodial and has no "password reset" or recovery mechanism.

**Q: Is SolVoid audited?**
A: No. This is a hackathon project. Use at your own risk.

---

##  Where to Get Help
- **Discord:** [Join our developer channel]
- **Twitter/X:** [@SolVoid]
- **GitHub Issues:** [Report a bug](https://github.com/brainless3178/SolVoid/issues)


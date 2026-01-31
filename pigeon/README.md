# Pigeon 🐦

### The Unstoppable Messenger.

> "Privacy is not a feature. It is a human right."

---

### The Problem
The internet has lost its way. Your private conversations are mined for data, sold to advertisers, or scanned by governments under the guise of "safety." Centralized servers are chokepoints—single points of failure that can be censored, subpoenaed, or shut down at a moment's whim.

### The Solution
**Pigeon** is the answer. We are building the first **unstoppable, wallet-to-wallet messenger** on Solana.

We don't have servers. We don't have a database of your messages. We don't even have your phone number. 

Pigeon is a pure protocol connecting two cryptographic keypairs. It uses the Solana blockchain as a global, censorship-resistant communication layer.

### Why Pigeon?
*   **Sovereign Identity:** Your wallet is your ID. No email, no phone number, no SIM swaps. You own your social graph.
*   **Truly Private:** End-to-End Encrypted (E2EE) using X25519 key exchange signed by your wallet. Mathematics guarantees your privacy, not a privacy policy.
*   **Unstoppable:** The backend is the Solana mainnet. As long as the chain produces blocks (which it has without going down for quite a while), Pigeon facilitates messages.
*   **Lightning Fast:** Powered by Solana's high-performance runtime. Messages settle in milliseconds.

### Architecture
*   **Program:** Rust (Anchor Framework)
*   **Client:** Next.js + React
*   **Encryption:** X25519 (ECDH) + ChaCha20-Poly1305 (AEAD)
*   **Storage:** On-chain account compression with rolling buffers.

### The Roadmap

We are just getting started. The future of communication is decentralized.

- [x] Secure 1:1 Direct Messages
- [x] On-chain User Registry (Public Key Discovery)
- [x] Rolling Message History (No storage limits)
- [x] Signature-based Identity Verification
- [ ] **Mobile App (Solana Seeker):** Native experience for freedom on the go.
- [ ] **Double Ratchet Mechanism:** Signal-protocol style forward secrecy where keys rotate with every message.
- [ ] **Zero-Knowledge Proofs (ZKPs):** Verify identity without revealing your social graph.
- [ ] **Off-chain Signaling:** Metadata protection to obscure who is talking to whom.
- [ ] **Private State (MagicBlock PER):** Private logic using Ephemeral Rollups.
- [ ] **Confidential Payments:** Send SOL/USDC privately alongside your messages using Token Extensions.
- [ ] **Disappearing Messages:** Ephemeral messaging where history is cryptographically erased.
---

### Getting Started

Join the revolution. Run the code.

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/pigeon.git

# 2. Install Client Dependencies
cd client
pnpm install

# 3. Run local server
pnpm dev
```

**Requirements:**
* Solana Wallet (Phantom recommened, Solflare works too)
* Devnet SOL (Airdrop via CLI or faucet)
* Helius Devnet URL in .env in /client folder
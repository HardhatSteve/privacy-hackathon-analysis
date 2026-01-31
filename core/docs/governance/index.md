# Governance: The Human & Machine Mainline

Governance in ORRO is split between immutable **Machine Truth** (on-chain consensus) and transparent **Human Voice** (The Gossip Box).

## 1. The Gossip Box Mainline

The Gossip Box is the primary channel for protocol-wide communication. It is governed by the **Signal Architecture** to prevent spam and ensure clarity during crisis.

* **Read Access:** All users.

* **Write Access (Beta):** Restricted to Level 1 Admins and users with a **Trust Score ≥ 500** to ensure high-integrity information.

* **Status Header:** A permanent UI element (Green/Yellow/Red) that provides the latest verified system state.

## 2. Incident Response (Safety Manual)

In the event of network instability or a "Solana Halt," the protocol enters a **Safety Lock** mode.

* **Read-Only Integrity:** Trust Scores and MTC levels remain visible via cached states, but updates are paused to prevent manipulation.

* **Manual Override:** Admins may manually override the ML-driven compute budget to force high-priority transaction landing across the network during critical infrastructure failures.

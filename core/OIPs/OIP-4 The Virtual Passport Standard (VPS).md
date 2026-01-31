# OIP-4: The Virtual Passport Standard (VPS)

**Status:** Draft

**Author:** ORRO Core

**Version:** 1.1.0

**Date:** January 2026

**"Identity is the baseline; space is the destination."**

## 1. Executive Overview

The **Virtual Passport** is the foundational identity layer for the ORRO ecosystem. It is designed to be **Local-First** for immediate creative flow, **On-Chain** for immutable certainty, and **Spatial-Ready** for the upcoming transition to the metaverse.

Unlike traditional "accounts," the Virtual Passport is a portable, cryptographic container that follows the creator from the 2D "Gossip Box" today to the 3D "Virtual Creative Home" of the future.

## 2. Deep Dive: Specification & Data Alignment

Based on your **New Prefix Map** and **Flags Structure**, we can drill down into how the Virtual Passport actually holds its weight on-chain.

#### 2.1 The 1-Byte Semantic Header

Every key within a Virtual Passport uses your **0x01–0x0B** prefix system. This allows the "Virtual" environment to understand the _role_ of a key without needing to call the backend.

* **Prefix `0x07` (DeviceBound):** In a metaverse context, this key would be tied to a specific VR/AR headset (e.g., Vision Pro or Quest 4).

* **Prefix `0x09` (HardwareToken):** Your physical anchor in the real world that grants "Certainty" to your Virtual identity.

#### 2.2 Virtual State Anchors (The 256-Byte PDA)

To keep the Virtual Passport "Solana-friendly", we utilize a fixed-size Program Derived Address. This is the "State Anchor" that survives even if the ORRO backend were to disappear.

**Byte-Alignment Breakdown:**

* **User Hash (32 bytes):** The "True Name" of the Virtual identity, masked for privacy.

* **Activity Flags (16 bytes):** Utilizing your `app_resilience_flag` and `app_peace_flag` to set the "vibe" or status of the user in the virtual space.

* **Timestamp Cycle (8 bytes):** Tracking the "Daily" or "Weekly" cycles defined in your research to manage decay or renewal of session permissions.

## 3. The "Virtual Transition" Strategy

How does this 2026 "Secure Interface" translate to a metaverse later?

1. **The Seed of Truth:** Your current **Fragment Ledger** (stored on Arweave) is already 3D-ready. By anchoring those fragments to a **Virtual Passport**, you ensure that when you move to a metaverse, your assets "spawn" with you, verified by the `sys_checksum` flag.

2. **Passkeys as Portals:** Because you've decoupled wallets from identity, "entering" a virtual room doesn't require a transaction sign-off. You simply "look" at the portal (FaceID/Passkey), and the **Virtual Passport** verifies your IdentityPrimary (`0x01`) key.

3. **Local-First Presence:** Your virtual environment can be rendered locally on your device for "Equilibrium," while the Solana PDA acts as the "Global Witness" that prevents two people from claiming the same virtual space.

## 4. Security: The "Break-Glass" Virtual Recovery

In your **New Passport System**, you mentioned "reattaching off-chain data" if the backend dies.

* **The Virtual Scenario:** If a user loses their headset, they use their **IdentityRecovery (`0x03`)** key on a standard browser.

* **The Result:** The Solana PDA updates to point to a new hardware ID. The Virtual Passport is "re-materialized" on the new device, pulling the encrypted art fragments and "Gossip" history back into view immediately.

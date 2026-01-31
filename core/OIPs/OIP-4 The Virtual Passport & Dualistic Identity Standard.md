# OIP-4: The Virtual Passport & Dualistic Identity Standard

**Status:** Draft

**Author:** ORRO Core

**Version:** 1.0.0

**Date:** January 2026

## 1. Abstract

OIP-4 proposes a **dualistic identity architecture** that decouples "Identity" from "Financial Capability." By utilizing WebAuthn (Passkeys) for primary authentication and Solana Program Derived Addresses (PDAs) for on-chain state anchors, ORRO provides a "local-first" environment where creators retain control over their digital art practice without the mandatory friction of a crypto-wallet.

## 2. Motivation: "Certainty as a Product"

Current digital platforms trap creators in a "perpetual hangover" of imitation. To reclaim control, artists need:

1. **Certainty of Ownership:** Cryptographic proof that is not tied to a volatile wallet.

2. **Equilibrium:** A workspace that functions offline (local-first) but syncs securely.

3. **Resilience:** The ability to recover an identity without a "seed phrase" via a tiered recovery system.

## 3. Specification: The Virtual Prefix Map

To ensure the system is "Solana-friendly" and cheap to parse, all application-level keys are prefixed with a **1-byte Key Role Descriptor**.

| **Prefix** | **Role**             | **Trust Level** | **Lifecycle**                        |
| ---------- | -------------------- | --------------- | ------------------------------------ |
| `0x01`     | **IdentityPrimary**  | High            | Persistent (Hardware/Secure Enclave) |
| `0x02`     | **IdentityBackup**   | High            | Persistent (Secondary Device)        |
| `0x03`     | **IdentityRecovery** | Maximum         | Break-glass (Social/Paper/Hardware)  |
| `0x04`     | **SessionShort**     | Low             | Transient (Auto-expires 1-4 hours)   |
| `0x05`     | **SessionLong**      | Medium          | Persistent (Valid until logout)      |
| `0x06`     | **WalletBound**      | Variable        | Bound to specific Solana Address     |

### 3.1 Account State Anchors (Solana)

Each Passport is represented on-chain by a **256-byte Identity Account PDA**.

* **Rent-Exempt Cost:** ~0.002 SOL.

* **Data Structure:**
  
  * `user_id`: [32 bytes] (Opaque unique identifier)
  
  * `key_flags`: [16 bytes] (System/App flags from _New Flags Structure.md_)
  
  * `recovery_threshold`: [1 byte]
  
  * `active_keys`: [List of Prefixed Pubkeys]

## 4. Drilling Down: Key Lifecycle & Recovery

### 4.1 The "Local-First" Key Rotation Flow

One of the most innovative aspects of OIP-4 is how it handles device loss without compromising the **Fragment Ledger**.

1. **Initiation:** User loses Primary Device (Key `0x01`).

2. **Challenge:** User authenticates via Secondary Device (Key `0x02`) or Recovery Key (`0x03`).

3. **Instruction:** The Backend orchestrates a Solana transaction to the Identity PDA.

4. **Rotation:** The `0x01` prefix is revoked on-chain; the new device's key is promoted to `0x01`.

5. **Re-sync:** The local-first database on the new device pulls the **State Anchor** from Solana and re-fetches encrypted fragments from Arweave/iCloud.

### 4.2 Application Flags (Behavioral Metadata)

The system uses the **New Flags Structure** to determine "Certainty."

* `app_benefit_of_doubt_flag`: Assigned to new accounts or those undergoing recovery.

* `app_resilience_flag`: Triggered after a successful key rotation.

* `sys_checksum`: Used by the ML stack to verify that the local-first state matches the on-chain anchor.

## 5. Rationale: Why 256 Bytes?

Designing for 2026 requires balancing cost and speed.

* **Solana Limit:** A single transaction payload is ~1.2 KB. By keeping the Passport state at **256 bytes**, we can batch up to 4 identity updates in a single transaction, keeping the "Service Fees" low for the creator.

* **Privacy:** The use of `0x01-0x0B` prefixes ensures that the role of a key is visible to the protocol, but the _actual identity_ of the user remains masked behind the Opaque UserID.

## 6. Security Considerations

* **Wallet Isolation:** Wallet compromise (Key `0x06`) does **not** allow the attacker to change the Identity Account (`0x01`).

* **Passkey Superiority:** Using WebAuthn prevents 99% of phishing attacks, as the "Creative Home" is anchored to physical hardware.

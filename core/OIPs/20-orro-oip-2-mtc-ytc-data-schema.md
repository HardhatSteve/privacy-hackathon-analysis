# ORRO OIP-2: MTC/YTC Data Schema

* **Status:** Draft

* **Type:** Standards Track

* **Created:** 2025-12-31

* **License:** MIT

* **Logic:** Hardened Minimalist

## 1. Abstract

This OIP defines the on-chain data structure for the ORRO Trust Protocol. It ensures that regardless of the application used, a user’s **My Trust Code (MTC)**—their self-sovereign identity—and the **Your Trust Code (YTC)**—the external validation of that identity—remain interoperable and consistent.

## 2. Data Structures

Trust data is stored in a **Program Derived Address (PDA)** on Solana, seeded by the user's wallet address and the string `"trust_vault"`.

### 2.1 The MTC Object (Self-Sovereign)

The MTC represents the user's current standing and identity settings.

| **Field**       | **Type**   | **Size** | **Description**                         |
| --------------- | ---------- | -------- | --------------------------------------- |
| `version`       | `u8`       | 1 byte   | Protocol version (current: 1).          |
| `level`         | `u8`       | 1 byte   | User Level (1=Creator to 5=Guest).      |
| `trust_score`   | `u32`      | 4 bytes  | Aggregated points (0 to 4,294,967,295). |
| `identity_hash` | `[u8; 32]` | 32 bytes | SHA-256 hash of verified KYA data.      |
| `is_lba_ready`  | `bool`     | 1 byte   | Consent to Legally Binding Agreements.  |

### 2.2 The YTC Object (Relational)

The YTC is a "Proof-of-Event" (PoE) record created when one user interacts with another.

| **Field**     | **Type** | **Size** | **Description**                                 |
| ------------- | -------- | -------- | ----------------------------------------------- |
| `from_pubkey` | `Pubkey` | 32 bytes | The endorser's address.                         |
| `to_pubkey`   | `Pubkey` | 32 bytes | The recipient's address.                        |
| `timestamp`   | `i64`    | 8 bytes  | Unix timestamp of the event.                    |
| `points_sent` | `u32`    | 4 bytes  | Amount transferred (OIP-1 `amount`).            |
| `action_code` | `u8`     | 1 byte   | Type of interaction (Endorse, Review, Dispute). |

## 3. The "Inspirational" Buffer

Following the **Zero-Option Rule**, no arbitrary fields are permitted in the core state. However, to support future growth without breaking the schema, each account is allocated a fixed **64-byte "Inspirational Buffer"**.

* Applications MAY use this space for custom metadata (e.g., a link to a specific project asset).

* Applications MUST NOT rely on this buffer for core protocol functions.

## 4. Processing Logic (Formal Constraints)

1. **Immutability of History:** Once a YTC event is written to the ledger, it MUST NOT be edited. Trust is cumulative and transparent.

2. **Level Graduation:** The protocol programmatically updates the `level` field in the MTC object only when the `trust_score` crosses the thresholds defined in the **ORRO User Levels** standard.

3. **Human-Legibility:** While stored as bytes for efficiency, any "Official ORRO Viewer" MUST decode the `identity_hash` and `action_code` into human-readable strings (e.g., "Verified Creator" or "Project Endorsement").

## 5. Security Considerations

* **PDA Security:** Only the ORRO Protocol Program has the authority to write to MTC accounts.

* **Replay Protection:** Every YTC transaction must include a unique timestamp and the signer's nonce to prevent duplicate point injections.

* **Australian Privacy Alignment:** The `identity_hash` ensures that Personal Private Information (PPI) is never stored directly on-chain, complying with the _Privacy Act 1988 (Cth)_ while maintaining cryptographic proof of identity.

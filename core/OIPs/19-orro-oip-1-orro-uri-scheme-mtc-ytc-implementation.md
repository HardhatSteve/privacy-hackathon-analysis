# OIP-1: ORRO URI Scheme (MTC/YTC Implementation)

* **Status:** Draft

* **Type:** Standards Track

* **Created:** 2025-12-31

* **License:** MIT

* **References:** RFC 3986, BIP-21

## 1. Abstract

This OIP defines a Uniform Resource Identifier (URI) scheme `orro:` for the decentralized sharing of My Trust Code (MTC) and Your Trust Code (YTC) actions on the Solana blockchain. It allows for seamless, human-readable trust endorsements across wallets and dApps while enforcing the **Zero-Option Rule** for protocol integrity.

## 2. Motivation

To fulfill the ORRO Design Integrity goals, this scheme:

* Enables "single-click" trust transfers over the Internet.

* Standardizes reputation metadata (labels/messages) for cross-app compatibility.

* Ensures human-legibility so users can verify trust actions before signing.

## 3. Specification

The ORRO URI follows the generic syntax defined in **RFC 3986**.

### 3.1 ABNF Grammar

ABNF
    orro_uri      = "orro:" solana_address [ "?" orro_params ]
    solana_address = 32*44(base58)
    orro_params   = orro_param [ "&" orro_params ]
    orro_param    = amount_param / label_param / message_param / inspire_param
    amount_param  = "amount=" 1*DIGIT
    label_param   = "label=" *qchar
    message_param = "message=" *qchar
    inspire_param = "inspire-" key "=" *qchar

### 3.2 Parameters

| **Parameter** | **Requirement** | **Description**                                         |
| ------------- | --------------- | ------------------------------------------------------- |
| `address`     | **Required**    | A valid 44-character base58 Solana Public Key.          |
| `amount`      | Optional        | Number of Trust Points. Must be a non-negative integer. |
| `label`       | Optional        | A URL-encoded short string (e.g., "MTC Endorsement").   |
| `message`     | Optional        | A URL-encoded description of the trust action.          |
| `inspire-*`   | Optional        | Reserved for "Inspirational Items." See Section 4.      |

## 4. The "Zero-Option" Processing Rules

To maintain the integrity of the protocol, applications implementing OIP-1 MUST follow these rules:

1. **Address Validation:** Applications MUST validate that the path is a valid Solana public key.

2. **Mandatory User Consent:** Applications MUST NOT execute a transaction automatically. They MUST display a confirmation dialog showing the decoded `address`, `amount`, and `message`.

3. **No Unknown Parameter Failure:** Applications MUST ignore any parameters they do not recognize. This prevents "Protocol Bloat" where a new app breaks older apps by adding custom data.

4. **Inspirational Metadata:** The prefix `inspire-` is the only allowed extension point. Parameters with this prefix can be displayed in the UI but MUST NOT change the functional outcome of the trust transfer.

## 5. Rationale

* **Why No Decimal Amounts?** To simplify parsing and prevent rounding errors in "Trust Points," OIP-1 uses integers only.

* **Why Base58?** To align perfectly with Solana's native address format, reducing the need for address conversion layers.

* **The Zero-Option Rule:** By mandating that unknown parameters be ignored, we ensure that OIP-1 remains compatible even as "inspirational" features are added by the community.

## 6. Security Considerations

* **Man-in-the-Middle:** Malicious links can swap the `address`. Apps SHOULD provide a visual indicator (like an identicon or a verified name) if the address belongs to a known entity.

* **URI Length:** Developers should be aware that some browsers limit URIs to ~2000 characters. Keep `message` parameters concise.

* **Verification:** Users MUST verify the recipient on their hardware or software wallet screen before final approval.

## 7. Reference Examples

Basic MTC Endorsement:

orro:xQqPRjCPXMuY1P7QDiYrh7QpIPnOuHOnER8k97ZFWXoY

Endorsement with Points and Note:

orro:xQqPRjCPXMuY1P7QDiYrh7QpIPnOuHOnER8k97ZFWXoY?amount=50&label=Alpha+Contributor&message=Excellent+work+on+the+v3.1+update

# Requirements Document: Obscura Dark OTC RFQ MVP

## Introduction

This document specifies the requirements for the Obscura Dark OTC (Over-The-Counter) Request for Quote (RFQ) system MVP. The Obscura RFQ system enables private, bilateral trading between market makers and takers using the Obscura privacy infrastructure. The MVP focuses on the core RFQ workflow: private quote request creation, market maker quote submission, and confidential quote selection.

The Obscura RFQ system wraps existing Obscura privacy primitives including off-chain balance tracking (Arcium cSPL), stealth addresses, Pedersen commitments, WOTS+ signatures, relayer networks, and nullifier-based claims. This MVP excludes dark pool order matching, advanced chat features, and cross-chain atomic settlement.

## ⚠️ CRITICAL IMPLEMENTATION REQUIREMENT

**HARUS BEKERJA REAL SECARA DEVNET - TIDAK BOLEH ADA SIMULASI/FAKE CODE**

Semua implementasi HARUS:
- ✅ Deploy ke **Solana Devnet** dan **Sepolia Testnet** yang real
- ✅ Menggunakan **Arcium SDK v0.6.3** yang real (bukan mock/simulasi)
- ✅ Menggunakan **Light Protocol ZK Compression** yang real
- ✅ Menggunakan **WOTS+ signatures** yang real (bukan placeholder)
- ✅ Menggunakan **Rescue cipher encryption** yang real dari Arcium
- ✅ Menggunakan **relayer network** yang real (bukan fake transaction)
- ✅ Semua transaksi harus bisa di-verify di **Solana Explorer** dan **Sepolia Etherscan**
- ✅ Semua cryptographic operations harus menggunakan library yang real (bukan stub)

**DILARANG:**
- ❌ Mock/stub untuk Arcium MPC
- ❌ Fake transaction hash
- ❌ Simulasi encryption/decryption
- ❌ Placeholder untuk signature verification
- ❌ Fake balance tracking
- ❌ Mock relayer service

**VERIFICATION:**
Setiap operasi harus menghasilkan transaction hash yang bisa di-verify di blockchain explorer.

## Glossary

- **Obscura_RFQ_System**: The Dark OTC Request for Quote backend service built on Obscura privacy infrastructure
- **Quote_Request**: A private request from a taker to buy or sell a specific amount of an asset
- **Quote**: A price offer submitted by a market maker in response to a Quote_Request
- **Taker**: A user who creates a Quote_Request seeking liquidity
- **Market_Maker**: An authorized user who provides liquidity by submitting Quotes
- **Relayer**: A privacy-preserving intermediary that submits transactions on behalf of users
- **Stealth_Address**: A one-time address generated for unlinkable payments
- **Pedersen_Commitment**: A cryptographic commitment that hides the committed amount
- **Nullifier**: A unique identifier that prevents double-spending of claims
- **Off_Chain_Balance**: Encrypted balance tracked using Arcium cSPL with Rescue cipher
- **WOTS_Plus_Signature**: A post-quantum signature scheme (Winternitz One-Time Signature Plus)
- **Quote_Request_ID**: A unique identifier for a Quote_Request
- **Quote_ID**: A unique identifier for a Quote
- **Whitelist**: A list of authorized Market_Maker addresses
- **Timeout**: The expiration time after which a Quote_Request becomes invalid

## Requirements

### Requirement 1: Private Quote Request Creation

**User Story:** As a taker, I want to create a private quote request for buying or selling assets, so that I can obtain competitive pricing without revealing my identity or trading intentions to the public.

#### Acceptance Criteria

1. WHEN a taker submits a Quote_Request with asset pair, direction (buy/sell), amount, and timeout, THE Obscura_RFQ_System SHALL create a Quote_Request with a unique Quote_Request_ID
2. WHEN creating a Quote_Request, THE Obscura_RFQ_System SHALL generate a Stealth_Address for the taker to receive responses
3. WHEN storing the Quote_Request amount, THE Obscura_RFQ_System SHALL create a Pedersen_Commitment to hide the actual amount
4. WHEN a Quote_Request is created, THE Obscura_RFQ_System SHALL use the Relayer to submit the request so the taker's address is not publicly visible
5. WHEN a Quote_Request is created, THE Obscura_RFQ_System SHALL verify the taker has sufficient Off_Chain_Balance for the requested amount
6. WHEN a Quote_Request is successfully created, THE Obscura_RFQ_System SHALL return the Quote_Request_ID and Stealth_Address to the taker
7. WHEN a Quote_Request creation fails validation, THE Obscura_RFQ_System SHALL return a descriptive error message

### Requirement 2: Market Maker Quote Submission

**User Story:** As a market maker, I want to submit private quotes in response to quote requests, so that I can provide liquidity while maintaining confidentiality of my pricing strategy.

#### Acceptance Criteria

1. WHEN a Market_Maker submits a Quote with Quote_Request_ID, price, and expiration time, THE Obscura_RFQ_System SHALL create a Quote with a unique Quote_ID
2. WHEN submitting a Quote, THE Obscura_RFQ_System SHALL verify the Market_Maker is on the Whitelist
3. WHEN submitting a Quote, THE Obscura_RFQ_System SHALL verify the referenced Quote_Request exists and has not timed out
4. WHEN storing the Quote price, THE Obscura_RFQ_System SHALL create a Pedersen_Commitment to hide the actual price
5. WHEN a Quote is submitted, THE Obscura_RFQ_System SHALL use the Relayer to submit the quote so the Market_Maker's address is not publicly visible
6. WHEN a Quote is submitted, THE Obscura_RFQ_System SHALL verify the Market_Maker has sufficient Off_Chain_Balance to fulfill the quote
7. WHEN a Quote is successfully submitted, THE Obscura_RFQ_System SHALL return the Quote_ID to the Market_Maker
8. WHEN a Quote submission fails validation, THE Obscura_RFQ_System SHALL return a descriptive error message

### Requirement 3: Confidential Quote Selection

**User Story:** As a taker, I want to privately select and accept a quote from the submitted offers, so that I can execute a trade at my chosen price without revealing my selection to other market participants.

#### Acceptance Criteria

1. WHEN a taker requests quotes for their Quote_Request_ID, THE Obscura_RFQ_System SHALL return all valid non-expired Quotes with their commitments
2. WHEN a taker selects a Quote by Quote_ID, THE Obscura_RFQ_System SHALL verify the taker owns the Quote_Request
3. WHEN a taker selects a Quote, THE Obscura_RFQ_System SHALL verify the Quote has not expired
4. WHEN a taker selects a Quote, THE Obscura_RFQ_System SHALL generate a Nullifier to prevent double-acceptance of the same Quote_Request
5. WHEN a Quote is accepted, THE Obscura_RFQ_System SHALL use the Relayer to execute the acceptance so the taker's selection is not publicly visible
6. WHEN a Quote is accepted, THE Obscura_RFQ_System SHALL update both taker and Market_Maker Off_Chain_Balance atomically
7. WHEN a Quote is accepted, THE Obscura_RFQ_System SHALL mark the Quote_Request as filled and reject any subsequent selection attempts
8. WHEN a Quote selection succeeds, THE Obscura_RFQ_System SHALL return a confirmation with the Nullifier
9. WHEN a Quote selection fails validation, THE Obscura_RFQ_System SHALL return a descriptive error message

### Requirement 10: Quote Request Timeout and Cancellation

**User Story:** As a taker, I want my quote requests to automatically expire after a specified time and to be able to cancel them manually, so that I maintain control over my trading intentions and avoid stale quotes.

#### Acceptance Criteria

1. WHEN a Quote_Request is created with a Timeout value, THE Obscura_RFQ_System SHALL store the expiration timestamp
2. WHEN the current time exceeds a Quote_Request Timeout, THE Obscura_RFQ_System SHALL mark the Quote_Request as expired
3. WHEN a Market_Maker attempts to submit a Quote for an expired Quote_Request, THE Obscura_RFQ_System SHALL reject the submission
4. WHEN a taker attempts to select a Quote for an expired Quote_Request, THE Obscura_RFQ_System SHALL reject the selection
5. WHEN a taker requests to cancel their Quote_Request by Quote_Request_ID, THE Obscura_RFQ_System SHALL verify the taker owns the Quote_Request
6. WHEN a taker cancels a Quote_Request, THE Obscura_RFQ_System SHALL mark it as cancelled and reject any subsequent Quote submissions or selections
7. WHEN a taker cancels a Quote_Request, THE Obscura_RFQ_System SHALL use the Relayer to submit the cancellation so the taker's action is not publicly visible
8. WHEN a cancellation succeeds, THE Obscura_RFQ_System SHALL return a confirmation to the taker

### Requirement 26: Private Chat Between Maker and Taker

**User Story:** As a taker or market maker, I want to exchange private messages with my counterparty during the RFQ process, so that I can negotiate terms or clarify details without exposing our communication to others.

#### Acceptance Criteria

1. WHEN a taker or Market_Maker sends a message with Quote_Request_ID, recipient Stealth_Address, and message content, THE Obscura_RFQ_System SHALL create a message record
2. WHEN sending a message, THE Obscura_RFQ_System SHALL verify the sender is either the taker who created the Quote_Request or a Market_Maker who submitted a Quote for it
3. WHEN sending a message, THE Obscura_RFQ_System SHALL encrypt the message content using the recipient's Stealth_Address
4. WHEN sending a message, THE Obscura_RFQ_System SHALL use the Relayer to submit the message so the sender's address is not publicly visible
5. WHEN a user requests messages for a Quote_Request_ID, THE Obscura_RFQ_System SHALL return only messages where the user is either sender or recipient
6. WHEN a user retrieves messages, THE Obscura_RFQ_System SHALL decrypt messages using the user's private key
7. WHEN message operations fail validation, THE Obscura_RFQ_System SHALL return a descriptive error message

### Requirement 33: Market Maker Authorization

**User Story:** As a system administrator, I want to control which addresses can act as market makers, so that I can ensure only trusted and qualified participants provide liquidity in the system.

#### Acceptance Criteria

1. WHEN an administrator adds an address to the Whitelist, THE Obscura_RFQ_System SHALL store the address as an authorized Market_Maker
2. WHEN an administrator removes an address from the Whitelist, THE Obscura_RFQ_System SHALL revoke Market_Maker authorization for that address
3. WHEN a user attempts to submit a Quote, THE Obscura_RFQ_System SHALL verify their address exists in the Whitelist
4. WHEN a non-whitelisted address attempts to submit a Quote, THE Obscura_RFQ_System SHALL reject the submission with an authorization error
5. WHEN an administrator requests the current Whitelist, THE Obscura_RFQ_System SHALL return all authorized Market_Maker addresses
6. WHEN Whitelist operations are performed, THE Obscura_RFQ_System SHALL log the changes for audit purposes

### Requirement 34: Off-Chain Balance Integration

**User Story:** As a user, I want my off-chain encrypted balances to be checked and updated during RFQ operations, so that I can trade privately without revealing my holdings on-chain.

#### Acceptance Criteria

1. WHEN a taker creates a Quote_Request, THE Obscura_RFQ_System SHALL query the taker's Off_Chain_Balance using Arcium cSPL
2. WHEN a taker's Off_Chain_Balance is insufficient for the Quote_Request amount, THE Obscura_RFQ_System SHALL reject the Quote_Request creation
3. WHEN a Market_Maker submits a Quote, THE Obscura_RFQ_System SHALL query the Market_Maker's Off_Chain_Balance
4. WHEN a Market_Maker's Off_Chain_Balance is insufficient to fulfill the Quote, THE Obscura_RFQ_System SHALL reject the Quote submission
5. WHEN a Quote is accepted, THE Obscura_RFQ_System SHALL update both taker and Market_Maker Off_Chain_Balance atomically using Arcium cSPL operations
6. WHEN Off_Chain_Balance updates fail, THE Obscura_RFQ_System SHALL rollback the Quote acceptance and return an error
7. WHEN querying Off_Chain_Balance, THE Obscura_RFQ_System SHALL decrypt the balance using Rescue cipher

### Requirement 35: Cryptographic Signature Verification

**User Story:** As a system operator, I want all RFQ operations to be signed with post-quantum secure signatures, so that the system remains secure against future quantum computing threats.

#### Acceptance Criteria

1. WHEN a user submits any RFQ operation (Quote_Request, Quote, selection, cancellation, message), THE Obscura_RFQ_System SHALL require a WOTS_Plus_Signature
2. WHEN verifying a WOTS_Plus_Signature, THE Obscura_RFQ_System SHALL validate it against the claimed sender's public key
3. WHEN a WOTS_Plus_Signature verification fails, THE Obscura_RFQ_System SHALL reject the operation with a signature error
4. WHEN a WOTS_Plus_Signature is reused for multiple operations, THE Obscura_RFQ_System SHALL reject subsequent operations to prevent signature reuse attacks
5. THE Obscura_RFQ_System SHALL maintain a record of used WOTS_Plus_Signature hashes to detect reuse attempts

### Requirement 36: Relayer Network Integration

**User Story:** As a user, I want all my RFQ operations to be submitted through relayers, so that my address and activity patterns remain private from blockchain observers.

#### Acceptance Criteria

1. WHEN any RFQ operation is submitted, THE Obscura_RFQ_System SHALL route it through the Relayer network
2. WHEN the Relayer submits an operation on behalf of a user, THE Obscura_RFQ_System SHALL verify the operation signature matches the claimed user
3. WHEN the Relayer network is unavailable, THE Obscura_RFQ_System SHALL return a service unavailable error
4. THE Obscura_RFQ_System SHALL ensure the user's address does not appear in any public transaction logs
5. WHEN the Relayer completes an operation, THE Obscura_RFQ_System SHALL return the result to the original user through the Relayer

### Requirement 37: API Error Handling and Validation

**User Story:** As a developer integrating with the RFQ system, I want clear and consistent error messages for all validation failures, so that I can quickly diagnose and fix issues.

#### Acceptance Criteria

1. WHEN any API request has missing required fields, THE Obscura_RFQ_System SHALL return a 400 error with field names
2. WHEN any API request has invalid field types or formats, THE Obscura_RFQ_System SHALL return a 400 error with validation details
3. WHEN any API request references a non-existent Quote_Request_ID or Quote_ID, THE Obscura_RFQ_System SHALL return a 404 error
4. WHEN any API request fails authorization checks, THE Obscura_RFQ_System SHALL return a 403 error
5. WHEN any internal system error occurs, THE Obscura_RFQ_System SHALL return a 500 error without exposing internal details
6. WHEN any cryptographic operation fails, THE Obscura_RFQ_System SHALL return a descriptive error indicating the failure type
7. THE Obscura_RFQ_System SHALL return all errors in a consistent JSON format with error code, message, and optional details

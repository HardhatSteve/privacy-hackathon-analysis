# Implementation Plan: Obscura Dark OTC RFQ MVP

## Overview

This implementation plan converts the Obscura Dark OTC RFQ MVP design into actionable coding tasks. The system wraps existing Obscura privacy infrastructure (Arcium cSPL, Light Protocol ZK Compression, WOTS+ signatures, Relayer network) to enable private bilateral trading between market makers and takers.

**Critical Implementation Requirement:** All implementations MUST use REAL infrastructure deployed to Solana Devnet and Sepolia Testnet. NO mocks, stubs, or simulations allowed. Every cryptographic operation must use real libraries, and all transactions must be verifiable on blockchain explorers.

**Backend Name:** obscura-dark-otc-rfq-be

**Technology Stack:**
- Express TypeScript backend
- Supabase (PostgreSQL database)
- Solana Web3.js v1.95.8 (security fix)
- Ethers.js v6.13.0+ (latest stable)
- Arcium SDK v0.6.3 (`@arcium-hq/client@0.6.3`)
- Light Protocol (`@lightprotocol/stateless.js@0.22.1-alpha.1`)
- WOTS+: `mochimo-wots-v2@1.1.1` (post-quantum signatures)
- Obscura-LLMS BE integration (https://obscura-api.daemonprotocol.com)

## Tasks

- [x] 1. Project setup and infrastructure configuration
  - Initialize Express TypeScript project with proper structure
  - Configure TypeScript with strict mode and proper types
  - Set up environment variables for Solana Devnet, Sepolia Testnet, and Supabase
  - Install dependencies: @solana/web3.js@1.95.8, ethers@^6.13.0, @arcium-hq/client@0.6.3, @lightprotocol/stateless.js@0.22.1-alpha.1, @lightprotocol/compressed-token, mochimo-wots-v2@1.1.1, @supabase/supabase-js, express
  - Configure Supabase client with connection pooling
  - Create HTTP client for Obscura-LLMS BE (https://obscura-api.daemonprotocol.com)
  - Set up configuration files for both chains (Solana Devnet, Sepolia Testnet)
  - _Requirements: All requirements (infrastructure foundation)_

- [x] 2. Implement core data models and database schema
  - [x] 2.1 Create TypeScript interfaces for all data models
    - Define QuoteRequest, Quote, Message, WhitelistEntry interfaces
    - Define API request/response types for all endpoints
    - Create validation schemas using Zod or similar
    - _Requirements: 1.1, 2.1, 3.1, 26.1, 33.1_
  
  - [x] 2.2 Set up Supabase database schema
    - Create quote_requests table with proper indexes
    - Create quotes table with foreign key to quote_requests
    - Create messages table with quote_request_id index
    - Create whitelist table for market maker authorization
    - Create used_signatures table for WOTS+ signature tracking
    - Enable Row Level Security (RLS) for all tables
    - Configure real-time subscriptions for quote updates
    - _Requirements: 1.1, 2.1, 3.1, 26.1, 33.1, 35.5_
  
  - [ ]* 2.3 Write property test for data model validation
    - **Property 1: Round-trip serialization**
    - **Validates: Requirements 1.1, 2.1, 3.1**
    - For any valid data model instance, serializing then deserializing should produce an equivalent object

- [x] 3. Implement Privacy Service with real cryptographic operations
  - [x] 3.1 Implement stealth address generation
    - Use real ECDH key derivation (no placeholders)
    - Generate one-time addresses with proper entropy
    - Return both address and private key for recipient
    - _Requirements: 1.2_
  
  - [x] 3.2 Implement Pedersen commitment creation and verification
    - Use real elliptic curve operations (secp256k1 or ed25519)
    - Create commitments: commitment = g^value * h^blinding (mod p)
    - Implement commitment verification with blinding factor
    - _Requirements: 1.3, 2.4_
  
  - [x] 3.3 Implement nullifier generation and hashing
    - Generate cryptographically secure random 32-byte nullifiers
    - Hash nullifiers using SHA256 for public nullifierHash
    - Ensure nullifiers are unpredictable and unique
    - _Requirements: 3.4_
  
  - [x] 3.4 Implement message encryption/decryption
    - Encrypt messages using recipient's stealth address public key
    - Use ECIES or similar authenticated encryption
    - Decrypt messages using recipient's private key
    - _Requirements: 26.3, 26.6_
  
  - [ ]* 3.5 Write property tests for privacy operations
    - **Property 2: Stealth address unlinkability**
    - **Validates: Requirements 1.2**
    - For any two stealth addresses generated for the same recipient, they should be unlinkable (different addresses)
  
  - [ ]* 3.6 Write property test for commitment verification
    - **Property 3: Commitment verification correctness**
    - **Validates: Requirements 1.3, 2.4**
    - For any value and blinding factor, creating a commitment then verifying it with the same parameters should return true
  
  - [ ]* 3.7 Write property test for message encryption round-trip
    - **Property 4: Message encryption round-trip**
    - **Validates: Requirements 26.3, 26.6**
    - For any message content and stealth address, encrypting then decrypting should produce the original message

- [x] 4. Implement WOTS+ Signature Verifier with real post-quantum crypto
  - [x] 4.1 Integrate WOTS+ signature library
    - Use mochimo-wots-v2@1.1.1 (TypeScript, post-quantum secure)
    - NO placeholder or stub implementations
    - Verify signatures against public keys
    - _Requirements: 35.1, 35.2_
  
  - [x] 4.2 Implement signature reuse detection
    - Hash signatures and store in Supabase used_signatures table
    - Check if signature hash exists before accepting operation
    - Reject operations with reused signatures
    - _Requirements: 35.4, 35.5_
  
  - [x] 4.3 Implement signature verification for all RFQ operations
    - Verify signatures on quote requests, quotes, selections, cancellations, messages
    - Return descriptive errors for invalid signatures
    - _Requirements: 35.1, 35.2, 35.3_
  
  - [ ]* 4.4 Write property test for signature verification
    - **Property 5: Valid signatures always verify**
    - **Validates: Requirements 35.1, 35.2**
    - For any message and valid WOTS+ signature pair, verification should return true
  
  - [ ]* 4.5 Write unit test for signature reuse detection
    - Test that using the same signature twice is rejected
    - Test that different signatures for same key are accepted
    - _Requirements: 35.4, 35.5_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Obscura-LLMS Client for privacy infrastructure integration
  - [x] 6.1 Create HTTP client for Obscura-LLMS BE
    - Base URL: https://obscura-api.daemonprotocol.com
    - Implement deposit endpoint wrapper (POST /api/v1/deposit)
    - Implement withdraw endpoint wrapper (POST /api/v1/withdraw)
    - Implement privacy status endpoint (GET /api/v1/privacy/status)
    - Implement relayer stats endpoint (GET /api/v1/relayer/stats)
    - Implement withdrawal request status endpoint (GET /api/v1/relayer/request/:requestId)
    - _Requirements: 34.1, 36.1_
  
  - [x] 6.2 Implement balance verification via Obscura-LLMS
    - Query relayer stats to check user balance availability
    - Verify sufficient funds before quote request/submission
    - Return verification result without exposing actual balance
    - _Requirements: 34.1, 34.2, 34.3, 34.4_
  
  - [x] 6.3 Implement settlement execution via Obscura-LLMS
    - Call withdraw endpoint for quote acceptance settlement
    - Pass commitment, nullifierHash, recipient, amount, chainId
    - Handle response with txHash, zkCompressed, compressionSignature
    - Obscura-LLMS handles: atomic balance updates (Arcium cSPL), relayer submission (direct transfer), ZK compression (Solana only)
    - _Requirements: 34.5, 34.6, 36.1, 36.4_
  
  - [x] 6.4 Implement error handling for Obscura-LLMS integration
    - Handle network errors and timeouts
    - Handle insufficient balance errors
    - Handle relayer unavailability (503 errors)
    - Retry logic for transient failures
    - _Requirements: 36.3_
  
  - [ ]* 6.5 Write unit tests for Obscura-LLMS client
    - Test successful deposit operation
    - Test successful withdrawal operation
    - Test balance verification
    - Test error handling (network, insufficient balance, relayer unavailable)
    - _Requirements: 34.1, 34.2, 34.4, 36.1, 36.3_

- [x] 7. Implement relayer fee calculation (local utility)
  - [x] 7.1 Implement tiered fee calculation
    - Tiered fee structure: 0.10% (0-10), 0.08% (10-100), 0.06% (100-1000), 0.05% (1000+)
    - Minimum fees: 0.0001 SOL, 0.00001 ETH
    - Calculate fees based on withdrawal amounts
    - _Requirements: 36.1_
  
  - [ ]* 7.2 Write property test for fee calculation
    - **Property 6: Fee calculation correctness**
    - **Validates: Requirements 36.1**
    - For any withdrawal amount, calculated fee should match the tiered structure and never exceed the amount
  
  - [ ]* 7.3 Write unit tests for fee edge cases
    - Test minimum fee enforcement
    - Test tier boundaries
    - Test zero amount handling
    - _Requirements: 36.1_

- [x] 8. Implement RFQ Core Service - Quote Request operations
  - [x] 8.1 Implement quote request creation endpoint (POST /api/v1/rfq/quote-request)
    - Validate request fields (assetPair, direction, amount, timeout, signature, publicKey)
    - Generate stealth address via Privacy Service
    - Create Pedersen commitment for amount
    - Verify taker has sufficient balance via Obscura-LLMS Client (relayer stats)
    - Verify WOTS+ signature via Signature Verifier
    - Store quote request in Supabase with status "active"
    - Return quote_request_id, stealth_address, commitment, expiresAt
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 8.2 Implement quote request timeout logic
    - Check expiration timestamp on all operations
    - Mark expired quote requests as "expired" in Supabase
    - Reject operations on expired quote requests
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 8.3 Implement quote request cancellation endpoint (POST /api/v1/rfq/quote-request/:id/cancel)
    - Verify taker owns the quote request (signature verification)
    - Mark quote request as "cancelled" in Supabase
    - Reject subsequent quote submissions or selections
    - Return confirmation to taker
    - _Requirements: 10.5, 10.6, 10.7, 10.8_
  
  - [ ]* 8.4 Write property test for quote request validation
    - **Property 7: Valid quote requests are accepted**
    - **Validates: Requirements 1.1, 1.7**
    - For any valid quote request with sufficient balance and valid signature, creation should succeed
  
  - [ ]* 8.5 Write property test for timeout enforcement
    - **Property 8: Expired quote requests are rejected**
    - **Validates: Requirements 10.2, 10.3, 10.4**
    - For any quote request with expiration timestamp in the past, all operations should be rejected
  
  - [ ]* 8.6 Write unit tests for quote request edge cases
    - Test invalid asset pair format
    - Test negative or zero amount
    - Test timeout in the past
    - Test insufficient balance
    - Test invalid signature
    - _Requirements: 1.7, 37.1, 37.2_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement RFQ Core Service - Quote submission operations
  - [x] 10.1 Implement market maker whitelist management
    - Create whitelist add endpoint (POST /api/v1/admin/whitelist/add)
    - Create whitelist remove endpoint (POST /api/v1/admin/whitelist/remove)
    - Create whitelist query endpoint (GET /api/v1/admin/whitelist)
    - Verify admin signature on whitelist operations
    - Store in Supabase whitelist table
    - Log all whitelist changes for audit
    - _Requirements: 33.1, 33.2, 33.5, 33.6_
  
  - [x] 10.2 Implement quote submission endpoint (POST /api/v1/rfq/quote)
    - Validate request fields (quoteRequestId, price, expirationTime, signature, publicKey)
    - Verify market maker is whitelisted (check Supabase)
    - Verify quote request exists and not expired (check Supabase)
    - Create Pedersen commitment for price
    - Verify market maker has sufficient balance via Obscura-LLMS Client
    - Verify WOTS+ signature
    - Store quote in Supabase with status "active"
    - Return quote_id, price_commitment, expiresAt
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 10.3 Implement quote expiration logic
    - Check quote expiration timestamp
    - Mark expired quotes as "expired" in Supabase
    - Reject acceptance of expired quotes
    - _Requirements: 2.3, 3.3_
  
  - [ ]* 10.4 Write property test for whitelist enforcement
    - **Property 9: Non-whitelisted addresses cannot submit quotes**
    - **Validates: Requirements 33.3, 33.4**
    - For any address not in the whitelist, quote submission should be rejected with authorization error
  
  - [ ]* 10.5 Write property test for quote validation
    - **Property 10: Valid quotes are accepted**
    - **Validates: Requirements 2.1, 2.8**
    - For any valid quote from whitelisted market maker with sufficient balance and valid signature, submission should succeed
  
  - [ ]* 10.6 Write unit tests for quote submission edge cases
    - Test non-existent quote request
    - Test expired quote request
    - Test non-whitelisted market maker
    - Test insufficient balance
    - Test invalid signature
    - Test quote expiration exceeding quote request expiration
    - _Requirements: 2.3, 2.8, 33.4, 37.3, 37.4_

- [ ] 11. Implement RFQ Core Service - Quote selection operations
  - [x] 11.1 Implement get quotes endpoint (GET /api/v1/rfq/quote-request/:id/quotes)
    - Query all quotes for the quote request from Supabase
    - Filter out expired quotes
    - Return quote_id, price_commitment, expiresAt, status for each quote
    - _Requirements: 3.1_
  
  - [x] 11.2 Implement quote acceptance endpoint (POST /api/v1/rfq/quote/:id/accept)
    - Verify taker owns the quote request (signature verification)
    - Verify quote exists and not expired (check Supabase)
    - Verify quote request not already filled or cancelled (check Supabase)
    - Generate nullifier via Privacy Service
    - Execute settlement via Obscura-LLMS Client (POST /api/v1/withdraw)
    - Obscura-LLMS handles: atomic balance updates (Arcium cSPL), relayer submission (direct transfer), ZK compression (Solana only, Light Protocol)
    - Mark quote request as "filled" in Supabase
    - Mark quote as "accepted" in Supabase
    - Return confirmation with nullifier, txHash, zkCompressed, compressionSignature
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 11.3 Handle Obscura-LLMS settlement response
    - Parse txHash from Obscura-LLMS response
    - Parse zkCompressed flag (true for Solana, false for Sepolia)
    - Parse compressionSignature (Solana only)
    - Verify transaction on blockchain explorer (Solana Explorer or Sepolia Etherscan)
    - _Requirements: 3.8_
  
  - [ ]* 11.4 Write property test for quote acceptance atomicity
    - **Property 11: Quote acceptance is atomic**
    - **Validates: Requirements 3.6, 3.7**
    - For any quote acceptance, either both database updates succeed (quote request filled, quote accepted) or neither happens (no partial state)
  
  - [ ]* 11.5 Write property test for double-acceptance prevention
    - **Property 12: Quote requests can only be filled once**
    - **Validates: Requirements 3.7**
    - For any filled quote request, subsequent acceptance attempts should be rejected
  
  - [ ]* 11.6 Write unit tests for quote selection edge cases
    - Test non-owner attempting to accept quote
    - Test accepting expired quote
    - Test accepting quote for filled quote request
    - Test accepting quote for cancelled quote request
    - Test Obscura-LLMS settlement failure handling
    - _Requirements: 3.2, 3.3, 3.7, 3.9, 37.3_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement private messaging system
  - [x] 13.1 Implement send message endpoint (POST /api/v1/rfq/message)
    - Validate request fields (quoteRequestId, recipientStealthAddress, encryptedContent, signature, publicKey)
    - Verify sender is either taker or market maker associated with quote request (check Supabase)
    - Encrypt message content using recipient's stealth address via Privacy Service
    - Verify WOTS+ signature
    - Store message in Supabase
    - Return message_id and timestamp
    - _Requirements: 26.1, 26.2, 26.3, 26.4_
  
  - [x] 13.2 Implement get messages endpoint (GET /api/v1/rfq/quote-request/:id/messages)
    - Query messages for quote request from Supabase
    - Filter messages where user is sender or recipient
    - Decrypt messages using user's private key via Privacy Service
    - Return message_id, encrypted_content, timestamp for each message
    - _Requirements: 26.5, 26.6_
  
  - [ ]* 13.3 Write property test for message authorization
    - **Property 13: Only authorized parties can send messages**
    - **Validates: Requirements 26.2**
    - For any message, sender must be either the taker or a market maker who submitted a quote for the quote request
  
  - [ ]* 13.4 Write unit tests for messaging edge cases
    - Test unauthorized sender
    - Test invalid quote request
    - Test empty message content
    - Test invalid stealth address
    - _Requirements: 26.7, 37.1, 37.2_

- [ ] 14. Implement comprehensive error handling and validation
  - [x] 14.1 Create error response middleware
    - Standardize error response format: { success: false, error: string, details?: any }
    - Map error types to HTTP status codes
    - Handle validation errors (400)
    - Handle not found errors (404)
    - Handle authorization errors (403)
    - Handle internal errors (500)
    - _Requirements: 37.1, 37.2, 37.3, 37.4, 37.5, 37.7_
  
  - [x] 14.2 Implement request validation middleware
    - Validate required fields presence
    - Validate field types and formats
    - Validate asset pair format (TOKEN1/TOKEN2)
    - Validate addresses (Solana and Ethereum formats)
    - Validate amounts (positive, minimum 0.0003)
    - Validate timestamps (future timestamps for expiration)
    - _Requirements: 37.1, 37.2_
  
  - [x] 14.3 Implement cryptographic operation error handling
    - Catch and handle signature verification failures
    - Catch and handle encryption/decryption failures
    - Catch and handle commitment creation failures
    - Return descriptive errors without exposing internal details
    - _Requirements: 37.6_
  
  - [ ] 14.4 Write property test for error response consistency
    - **Property 14: All errors return consistent format**
    - **Validates: Requirements 37.7**
    - For any error condition, response should contain success: false, error message, and optional details in consistent JSON format
  
  - [ ]* 14.5 Write unit tests for validation edge cases
    - Test missing required fields
    - Test invalid field types
    - Test invalid formats (asset pair, addresses, amounts)
    - Test boundary conditions (minimum amounts, maximum timeouts)
    - _Requirements: 37.1, 37.2_

- [x] 15. Implement API endpoints and routing
  - [x] 15.1 Set up Express router with all RFQ endpoints
    - POST /api/v1/rfq/quote-request (create quote request)
    - POST /api/v1/rfq/quote (submit quote)
    - GET /api/v1/rfq/quote-request/:id/quotes (get quotes)
    - POST /api/v1/rfq/quote/:id/accept (accept quote)
    - POST /api/v1/rfq/quote-request/:id/cancel (cancel quote request)
    - POST /api/v1/rfq/message (send message)
    - GET /api/v1/rfq/quote-request/:id/messages (get messages)
    - POST /api/v1/admin/whitelist/add (add market maker)
    - POST /api/v1/admin/whitelist/remove (remove market maker)
    - GET /api/v1/admin/whitelist (get whitelist)
    - _Requirements: All requirements (API interface)_
  
  - [x] 15.2 Implement health check and status endpoints
    - GET / (API information)
    - GET /health (health check)
    - GET /api/v1/privacy/status (privacy layer status)
    - GET /api/v1/solana/status (Solana status)
    - GET /api/v1/evm/status (EVM status)
    - _Requirements: All requirements (monitoring)_
  
  - [x] 15.3 Add request logging middleware
    - Log all incoming requests (method, path, timestamp)
    - Log request IDs for tracing
    - Do NOT log sensitive data (signatures, nullifiers, private keys)
    - _Requirements: 33.6_
  
  - [ ]* 15.4 Write integration tests for API endpoints
    - Test complete quote request creation flow
    - Test complete quote submission flow
    - Test complete quote acceptance flow
    - Test complete messaging flow
    - Test whitelist management flow
    - _Requirements: All requirements (end-to-end validation)_

- [x] 16. Final integration and deployment preparation
  - [x] 16.1 Wire all components together
    - Connect API endpoints to RFQ Core Service
    - Connect RFQ Core Service to Privacy Service, Obscura-LLMS Client, Signature Verifier
    - Ensure all services use real implementations (no mocks)
    - Verify all transactions are submitted to real networks (Solana Devnet, Sepolia Testnet)
    - Verify Obscura-LLMS integration works end-to-end
    - _Requirements: All requirements (system integration)_
  
  - [x] 16.2 Create deployment configuration
    - Set up environment variables for production (Supabase URL, keys, Obscura-LLMS base URL)
    - Configure Supabase connection pooling and RLS policies
    - Set up CORS for frontend integration
    - Configure rate limiting and security headers
    - _Requirements: All requirements (deployment)_
  
  - [x] 16.3 Create README with setup instructions
    - Document environment variables (Supabase, Obscura-LLMS, blockchain RPCs)
    - Document API endpoints
    - Document deployment steps
    - Document testing procedures
    - Include links to blockchain explorers for verification (Solana Explorer, Sepolia Etherscan)
    - Include Obscura-LLMS BE endpoint documentation
    - _Requirements: All requirements (documentation)_
  
  - [ ]* 16.4 Write end-to-end integration tests
    - Test complete RFQ workflow: create request → submit quote → accept quote
    - Test timeout and cancellation flows
    - Test messaging between taker and market maker
    - Test whitelist enforcement
    - Verify all transactions on blockchain explorers
    - Verify Obscura-LLMS integration (deposit, withdraw, balance check)
    - _Requirements: All requirements (system validation)_

- [ ] 17. Final checkpoint - Ensure all tests pass and system is deployable
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all transactions are visible on Solana Explorer and Sepolia Etherscan
  - Confirm NO mocks or stubs remain in codebase
  - Validate all cryptographic operations use real libraries

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- All implementations MUST use real infrastructure (Solana Devnet, Sepolia Testnet)
- NO mocks, stubs, or simulations allowed per critical implementation requirement
- Every transaction must be verifiable on blockchain explorers
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property with tag format: **Feature: dark-otc-rfq-mvp, Property {number}: {property_text}**

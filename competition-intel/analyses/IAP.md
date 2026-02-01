# IAP (Interest-Aware Privacy) - Analysis

## 1. Project Overview
IAP (Interest-Aware Privacy) is a privacy vault system that stores encrypted user interest profiles on Solana using Arcium's MXE (Multi-party Execution) network for confidential computing. The system collects wallet activity data (NFT holdings, SOL balance, trading volume, token holdings, DeFi interactions) via Helius, encrypts it using Arcium's shared encryption, and stores it on-chain in encrypted form. This enables privacy-preserving user profiling for targeted experiences without exposing raw data.

## 2. Track Targeting
**Track: Privacy Tooling** (or Open Track)

IAP creates privacy infrastructure for interest-based profiling - a novel application of confidential computing for personalization without surveillance.

## 3. Tech Stack
- **ZK System**: Arcium MXE (MPC-based confidential computing, not ZK)
- **Languages**: Rust (Anchor), TypeScript
- **Frameworks**:
  - Turborepo monorepo
  - Next.js for web apps
  - Anchor for Solana program
- **Key Dependencies**:
  - `arcium-anchor` - Arcium Anchor integration
  - `arcis` - Arcium cryptographic types
  - `@arcium-hq/client` - Arcium client SDK
  - `@coral-xyz/anchor`

## 4. Crypto Primitives
- **Arcium MXE Encryption**:
  - `SharedEncryptedStruct<N>` - Client-side encrypted data
  - `MXEEncryptedStruct<N>` - Vault-side encrypted data
  - `Enc<Shared, T>` / `Enc<Mxe, T>` - Type-safe encrypted values
- **X25519 Key Exchange**: Client-MXE handshake
- **Rescue Cipher**: Arcium's symmetric encryption scheme
- **Interest Profile Tuple**: 6-field encrypted structure:
  - Tier (u8): BRONZE/SILVER/GOLD/PLATINUM
  - NFT Count (u32)
  - SOL Balance in lamports (u64)
  - Trading Volume in cents (u64)
  - Token Holdings count (u32)
  - DeFi Interactions count (u32)

## 5. Solana Integration
**Program Architecture**:
- Program ID: `9tNsfwyCDBFZRmjuYty4AHpWXziRa26nGjtJAd6qmiR1`
- Uses Anchor with Arcium extensions

**PDAs**:
- `UserProfile`: `["user_profile", user_pubkey]` - Stores encrypted interest profile

**Account Structure**:
```rust
pub struct UserProfile {
    pub interest_profile: MXEWrapper<6>, // 6 encrypted fields
}
// Space: 8 (discriminator) + 16 (nonce) + 32*6 (ciphertexts) = 216 bytes
```

**Instructions**:
- `store_interest_profile(encrypted_profile: SharedEncryptedStruct<6>)` - Store full profile
- `store_tier(encrypted_tier: SharedEncryptedStruct<1>)` - Legacy, deprecated

**Encryption Flow**:
1. Client generates X25519 keypair
2. Client fetches MXE public key
3. Shared secret via ECDH
4. Initialize RescueCipher with shared secret
5. Encrypt 6 BigInt fields with random nonce
6. Submit `SharedEncryptedStruct` to program
7. Program re-encrypts for MXE storage

## 6. Sponsor Bounty Targeting
**Primary: Arcium** - Deep integration with Arcium SDK and MXE network
- Uses `arcium-anchor` for on-chain integration
- Uses `@arcium-hq/client` for client-side encryption
- Follows Arcium v0.5 patterns (Uint8Array, BigInt)

## 7. Alpha/Novel Findings
1. **Interest Graph concept**: Privacy-preserving user profiling
2. **Tiered system**: BRONZE/SILVER/GOLD/PLATINUM based on activity
3. **6-field composite encryption**: Single encrypted blob for full profile
4. **Re-encryption pattern**: Client encryption -> MXE encryption transition
5. **MXEWrapper workaround**: Custom Clone implementation for Anchor compatibility
6. **Helius profiler script**: Collects wallet data for profile generation

## 8. Strengths
1. **Real Arcium integration**: Genuine MXE encryption, not simulated
2. **Novel use case**: Privacy-preserving profiling is underexplored
3. **Complete encryption flow**: Client-to-chain encryption pipeline
4. **Proper type safety**: Generic `SharedEncryptedStruct<N>` for different field counts
5. **Turborepo structure**: Well-organized monorepo
6. **Field conversion logic**: Handles SOL->lamports, USD->cents conversions

## 9. Weaknesses
1. **Arcium-only dependency**: Entire system depends on Arcium availability
2. **No decryption flow**: Can store but no visible retrieval/usage
3. **Missing authorization**: Who can read the encrypted profiles?
4. **Limited documentation**: README is default Turborepo template
5. **No tests visible**: Missing test coverage
6. **Profiler script unclear**: How is wallet data collected?
7. **Single-user per program**: No multi-tenant design visible
8. **Space calculation issues**: Comment mentions 216 bytes but earlier had 8+32+32+16

## 10. Threat Level
**MODERATE**

Justification: IAP demonstrates genuine Arcium integration with a novel application (privacy-preserving profiling). The encryption flow is properly implemented, and the 6-field composite structure is well-designed. However, the project lacks documentation, tests, and a clear end-to-end demo. The "Interest Graph" concept is interesting but not fully realized. Competitive for Arcium bounty specifically.

## 11. Implementation Completeness
**50% Complete**

**Implemented**:
- Anchor program with Arcium MXE encryption
- Client-side encryption SDK with X25519 + RescueCipher
- Interest profile data structure (6 fields)
- SharedEncryptedStruct serialization
- MXEWrapper for Anchor compatibility
- Tier-to-number conversion utilities
- Basic Turborepo setup

**Missing**:
- Decryption/retrieval flow
- Access control for profile reading
- Helius profiler integration (referenced but not visible)
- Frontend UI for profile viewing
- Multi-user support
- Profile comparison/matching (use case unclear)
- Integration tests
- Documentation beyond boilerplate
- Demo application

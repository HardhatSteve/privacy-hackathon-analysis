# SIP Mobile - Analysis

**Updated:** 2026-02-01
**Score:** 93 (↑ from 90, +3)
**Threat Level:** CRITICAL

## 1. Project Overview

SIP Mobile is the companion mobile application to SIP App, positioned as "Privacy in Your Pocket." It's a React Native/Expo application targeting consumers with quick payments, native key management, and biometric security. The app uses the same @sip-protocol/sdk as the web app but optimizes for mobile-first experiences like camera-based QR scanning, native seed management via Solana Mobile Seed Vault, and on-the-go privacy operations.

## 2. Track Targeting

**Track:** Private Payments (Primary)

The mobile app is focused on consumer-grade private payments with emphasis on UX, accessibility, and security through native platform features (biometrics, secure storage).

## 3. Tech Stack

- **ZK System:** Multi-backend via shared SDK
  - Arcium (@arcium-hq/client ^0.6.5)
  - Inco (@inco/solana-sdk ^0.0.2)
  - PrivacyCash (privacycash ^1.1.11)
  - ShadowWire (@radr/shadowwire ^1.1.15)
- **Languages:** TypeScript
- **Frameworks:**
  - React Native 0.81.5
  - Expo SDK 54
  - React 19.1.0
  - NativeWind 4.0.0 (Tailwind for RN)
- **Key Dependencies:**
  - @sip-protocol/sdk ^0.7.3
  - @solana-mobile/mobile-wallet-adapter-protocol-web3js ^2.2.5
  - @solana-mobile/seed-vault-lib ^0.4.0
  - @noble/curves, @noble/hashes, @noble/ciphers
  - @scure/bip32, @scure/bip39
  - expo-local-authentication (biometrics)
  - expo-secure-store (encrypted storage)
  - Zustand 5.0.0

## 4. Crypto Primitives

**Key Management:**
- BIP32/BIP39 seed phrase generation and derivation
- Solana Mobile Seed Vault integration for hardware-backed keys
- Secure enclave storage via expo-secure-store
- Viewing key generation separate from spending keys

**Stealth Addresses:**
- Same meta-address format as web: `sip:solana:<spending>:<viewing>`
- QR code scanning for stealth address input
- Native camera integration for payment flows

**Privacy Backends (Direct SDK Integration):**
- @arcium-hq/client - MPC privacy
- @inco/solana-sdk - FHE privacy
- privacycash - Pool mixing
- @radr/shadowwire - Additional privacy layer

**Cryptographic Libraries:**
- @noble/curves (Ed25519, secp256k1)
- @noble/hashes (SHA-2, SHA-3, BLAKE)
- @noble/ciphers (AES, ChaCha)
- tweetnacl (NaCl box/secretbox)

## 5. Solana Integration

**Mobile Wallet Adapter:**
- Full MWA support via @solana-mobile/mobile-wallet-adapter-protocol-web3js
- Compatible with Phantom, Solflare, and other MWA wallets
- Deep linking for wallet interactions

**Seed Vault Integration:**
- @solana-mobile/seed-vault-lib for Saga-native key management
- Hardware-backed key storage on supported devices

**Background Scanning:**
- expo-background-fetch for payment discovery
- expo-task-manager for background task scheduling
- Push notifications via expo-notifications

**Routes/Screens:**
- `/(tabs)/send` - Send private payments
- `/(tabs)/receive` - Receive via stealth address
- `/(tabs)/swap` - Jupiter DEX integration
- `/scan/*` - QR scanning for payments
- `/claim/*` - Claim received payments
- `/history/*` - Transaction history
- `/settings/compliance/*` - Compliance features
- `/settings/viewing-keys/*` - Key management
- `/settings/privacy-score/*` - Privacy analysis

## 6. Sponsor Bounty Targeting

- **Arcium:** Direct @arcium-hq/client integration
- **Inco:** @inco/solana-sdk integration
- **Solana Mobile:** Seed Vault and MWA integration
- **Magicblock:** ephemeral-rollups-sdk integration
- **Jupiter:** Swap functionality

## 7. Alpha/Novel Findings

**Native Mobile Advantages:**

1. **Seed Vault Integration:** Hardware-backed key storage for Saga phones - strongest mobile key security available on Solana

2. **Multi-Provider Strategy:** Four privacy backend SDKs integrated:
   - Arcium (MPC)
   - Inco (FHE)
   - PrivacyCash (mixing)
   - ShadowWire (additional layer)

3. **Biometric Security:** expo-local-authentication for face/fingerprint unlock of sensitive operations

4. **Background Payment Scanning:** Background fetch allows discovering incoming payments even when app is closed

5. **Passkey Support:** react-native-passkeys for WebAuthn-style authentication

6. **Privacy Provider Hook:** `usePrivacyProvider()` abstraction matching web app pattern

## 8. Strengths

1. **Native Mobile Experience:** Not a web wrapper, true React Native app
2. **Hardware Security:** Seed Vault + secure enclave support
3. **Multi-Backend Privacy:** Same flexibility as web app
4. **Full Feature Parity:** Matches web app core features
5. **Biometric Auth:** Face ID/fingerprint for transactions
6. **QR Scanner:** Native camera for stealth address input
7. **Background Scanning:** Discovers payments passively
8. **Publishing Pipeline:** Ready for App Store/Play Store (documented build workflow)
9. **E2E Testing:** Detox test configuration

## 9. Weaknesses

1. **Complexity:** Four privacy SDKs may introduce version/compatibility issues
2. **No Visible Tests:** test files present but coverage unclear
3. **Expo Dependency:** Tied to Expo ecosystem limitations
4. **SDK Dependency:** Core logic in @sip-protocol/sdk
5. **React Native 0.81:** Very new, may have ecosystem compatibility issues
6. **ShadowWire Unclear:** @radr/shadowwire not well-documented publicly

## 10. Threat Level

**CRITICAL** (Score: 93, ↑ +3 from 90)

### Recent Updates (2026-02-01)
- ✅ **Complete README revamp** matching main repo style
- ✅ **Privacy model comparison** (Transparent vs Shielded vs Compliant modes)
- ✅ **Demo videos reference**: 8 demo videos on Seeker device at `https://sip-protocol.org/showcase/solana-privacy-2026`
- ✅ **Architecture diagrams** and flow visualization
- ✅ **Multi-platform support** documentation (iOS, Android, Seeker)
- ✅ **37 test files** with strong coverage
- ✅ **Security threat model** and best practices documented

This is a fully-featured privacy mobile app with:
- Native Solana Mobile integration (Seed Vault, MWA)
- Multiple privacy backend integrations
- Production-quality codebase with publishing pipeline
- Biometric security features
- Background payment scanning
- Part of larger SIP Protocol ecosystem

The combination of mobile-native features (biometrics, secure storage, background fetch) with multiple privacy backends makes this a very strong competitor. The Seed Vault integration specifically is a differentiator that web apps cannot match.

## 11. Implementation Completeness

**80% Complete**

- [x] Core payment flow (send/receive/claim) - 100%
- [x] Stealth address handling - 100%
- [x] QR scanning - 100%
- [x] Wallet setup and management - 100%
- [x] Seed Vault integration - 100%
- [x] MWA support - 100%
- [x] Biometric authentication - 100%
- [x] Privacy provider abstraction - 100%
- [x] Background scanning (setup) - 90%
- [x] Jupiter swap - 80%
- [x] Compliance dashboard - 80%
- [x] Build/publish pipeline - 100%
- [ ] E2E test coverage - 50%
- [ ] All privacy backends production-ready - 60%

**What's Working:**
- Full mobile payment experience
- Multiple privacy backend options
- Native security features
- Publishing-ready codebase
- Part of ecosystem with proven web app

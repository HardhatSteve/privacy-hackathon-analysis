# anon0mesh - Hackathon Analysis

**Repository:** anon0mesh
**Analysis Date:** 2026-01-31
**Analyst:** Competitive Analysis Agent

---

## 1. Project Overview

anon0mesh is a P2P mesh networking application for mobile devices that enables offline messaging and Solana transaction relay over Bluetooth Low Energy (BLE). The project combines multiple privacy-enhancing technologies:

- **BLE Mesh Networking**: Dual-mode BLE (Central + Peripheral) for local peer-to-peer communication
- **Nostr Integration**: Internet fallback for messaging when mesh is unavailable
- **Arcium MPC**: Confidential computing for privacy-preserving payment statistics
- **Durable Nonce Accounts**: Offline transaction creation with never-expiring transactions
- **Disposable Wallets**: One-time use addresses for enhanced privacy

**Core Value Proposition**: Enable payments and messaging in constrained environments (no internet, remote areas, festivals, protests) while maintaining transaction privacy through encrypted statistics.

---

## 2. Track Targeting

### Primary Track: **Privacy Infrastructure**

The project directly targets privacy infrastructure through:
- BLE mesh for metadata-resistant communication
- Multi-hop transaction routing that obscures sender-receiver relationships
- Arcium MPC for confidential payment aggregation
- Disposable wallet addresses to break transaction graph analysis

### Secondary Track: **Consumer Applications**

- Mobile-first React Native application
- Real-world use case: offline payments in connectivity-constrained environments
- Chat messaging with encryption (NIP-04/NIP-44)

### Potential Fit: **Technical Achievement**

- Novel BLE mesh + blockchain integration
- Complex multi-hop transaction co-signing protocol
- Clean architecture implementation (DDD patterns)

---

## 3. Tech Stack

### Frontend/Mobile
| Technology | Purpose |
|------------|---------|
| React Native 0.81.5 | Mobile app framework |
| Expo ~54.0.32 | Development platform |
| Expo Router ~6.0.21 | Navigation |
| NativeWind 4.2.1 | Tailwind styling |
| TypeScript ~5.9.2 | Type safety |

### BLE/Networking
| Technology | Purpose |
|------------|---------|
| react-native-ble-plx 3.5.0 | BLE Central mode |
| react-native-multi-ble-peripheral 0.1.8 | BLE Peripheral mode |
| react-native-ble-manager 12.4.1 | Additional BLE support |
| kard-network-ble-mesh 1.1.5 | Mesh networking library |

### Cryptography
| Technology | Purpose |
|------------|---------|
| react-native-libsodium 1.5.0 | Native crypto primitives |
| react-native-quick-crypto 1.0.6 | Fast crypto operations |
| tweetnacl 1.0.3 | Ed25519/X25519 |
| nostr-tools 2.17.2 | Nostr protocol + NIP-04/44 |
| @rust-nostr/nostr-sdk 0.44.0 | Rust Nostr bindings |

### Solana
| Technology | Purpose |
|------------|---------|
| @solana/web3.js 1.98.4 | Solana SDK |
| @solana-mobile/mobile-wallet-adapter-protocol 2.2.5 | MWA support |
| @bonfida/spl-name-service 3.0.16 | SNS resolution |

### On-Chain (Escrow)
| Technology | Purpose |
|------------|---------|
| Anchor | Solana program framework |
| arcium-anchor | Arcium MPC integration |
| arcis | Encrypted instruction definitions |

---

## 4. Cryptographic Primitives

### Encryption Schemes
1. **NIP-04 (AES-256-CBC)**: Encrypted direct messages for 1-to-1 communication
2. **NIP-44 (XChaCha20-Poly1305)**: Modern encryption for group chat (via Arcium)
3. **X25519 ECDH**: Key agreement for shared secrets
4. **Ed25519**: Signature scheme for Nostr events and Solana transactions

### Privacy Mechanisms

#### BLE Mesh Privacy
- **Multi-hop routing**: Transaction requests hop through peers, obscuring origin
- **TTL-based propagation**: Packets expire after N hops, preventing infinite loops
- **Routing path tracking**: Loop prevention via visited peer tracking
- **No central server**: Fully peer-to-peer, no metadata collection point

#### Arcium MPC (Confidential Computing)
```rust
// Encrypted payment statistics - amounts hidden on-chain
pub struct EscrowStats {
    total_payments: u64,    // Encrypted
    total_volume: u64,      // Encrypted
    total_fees_collected: u64, // Encrypted
}

#[instruction]
pub fn process_payment(
    payment_ctxt: Enc<Shared, ConfidentialPayment>,
    escrow_stats_ctxt: Enc<Mxe, EscrowStats>,
) -> Enc<Mxe, EscrowStats>
```

The Arcium integration enables:
- **Confidential payment aggregation**: Total volume hidden
- **Threshold reveals**: Check if volume exceeds threshold without revealing actual amount
- **Encrypted referral stats**: Referral rewards tracked privately

#### Durable Nonce Accounts
- Transactions never expire (bypasses ~2 minute blockhash window)
- Can be created fully offline
- Enables mesh relay without timing constraints

---

## 5. Solana Integration

### On-Chain Programs

#### Escrow Program (`BtZEFfbu3dSJtP5hyQsnnfrL19X2UfLwjts2N7KbJteo`)

**Instructions:**
| Instruction | Description |
|-------------|-------------|
| `initialize_escrow` | Create escrow with encrypted stats via Arcium MPC |
| `send_payment` | SOL payment with 2% fee split |
| `send_payment_usdc` | USDC payment |
| `send_payment_zenzec` | ZenZEC token payment |
| `send_payment_encrypted` | Payment with Arcium-encrypted stats update |
| `check_volume_threshold` | MPC threshold comparison |
| `reveal_payment_count` | Selective reveal of payment count |
| `pause_escrow` / `resume_escrow` | Admin controls |

**Fee Structure:**
- 1.4% to treasury
- 0.6% to referrer
- Total: 2% per transaction

**Account State:**
```rust
pub struct EscrowAccount {
    pub owner: Pubkey,
    pub total_fund_regulated: u64,
    pub encrypted_stats: [[u8; 32]; 3], // MPC-encrypted statistics
    pub nonce: u128,                     // MPC nonce
    pub treasury: Pubkey,
    pub active: bool,
    pub bump: u8,
}
```

### Mobile Wallet Adapter (MWA)
- Full MWA 2.2.5 integration for Phantom/Solflare
- Automatic detection of Solana Mobile devices (Seeker)
- Biometric authentication fallback for local wallets

### Transaction Flow

#### Online Mode (Direct)
```
User → Sign → Submit to Solana → Confirmation
```

#### Offline Mode (Multi-hop BLE Mesh)
```
User A (offline)
    │ 1. Create partial-signed tx with durable nonce
    │ 2. Broadcast via BLE
    ↓
Peer 1 (offline, not beacon)
    │ Check: isBeacon=false, hasInternet=false
    │ Action: FORWARD, add hop
    ↓
Peer 2 (offline, not beacon)
    │ Check: isBeacon=false, hasInternet=false
    │ Action: FORWARD, add hop
    ↓
Beacon (online)
    │ Check: isBeacon=true, hasInternet=true
    │ Action: CO-SIGN + SUBMIT
    ↓
Solana Blockchain
    │
    ↓
Receipt sent back through routing path
```

---

## 6. Sponsor Bounties

### Arcium (Primary Sponsor Target)
**Strength: STRONG**

The project demonstrates deep Arcium integration:
- Uses `arcium-anchor` and `arcis` frameworks
- Implements 6 encrypted instructions:
  - `init_escrow_stats`
  - `init_referral_stats`
  - `process_payment`
  - `update_referral_stats`
  - `check_volume_threshold`
  - `reveal_payment_count`
- MPC cluster configuration (2 nodes in localnet)
- Proper callback handling with signature verification

### Solana Mobile
**Strength: MODERATE**

- Full MWA integration
- Solana Seeker device detection
- Biometric wallet support
- Could compete for mobile-focused bounties

### Nostr Ecosystem
**Strength: MODERATE**

- NIP-04 and NIP-44 encryption
- 190+ relay support
- Geo-distributed relay selection
- Custom mesh message kinds (30000, 30001)

---

## 7. Alpha/Novel Findings

### Unique Innovations

#### 1. BLE Mesh + Blockchain Fusion
First project to combine:
- BLE mesh networking for offline propagation
- Durable nonces for never-expiring offline transactions
- Multi-hop co-signing with beacon discovery
- Relayer fee incentive system

#### 2. Relayer Fee Economics
```typescript
interface RelayerFeeSystem {
  feePerHop: 0.0001 SOL,  // ~$0.01 at $100/SOL
  maxHops: 10,
  maxFees: 0.001 SOL,     // ~$0.10 maximum

  // Incentivizes mesh participation:
  // - Sender pays only for actual hops
  // - Relayers earn passive income
  // - Network grows organically
}
```

#### 3. Beacon Discovery Protocol
Novel approach to finding internet-connected nodes:
- Broadcast transactions with TTL
- Each peer adds hop to routing path
- First beacon encountered co-signs and submits
- Receipt travels back through recorded path

#### 4. Disposable Wallet + Nonce Integration
Combines two privacy techniques:
- Disposable addresses break transaction graph
- Durable nonces enable offline creation
- Automatic sweep functionality

### Architecture Quality
- **Clean Architecture**: Domain/Application/Infrastructure layers
- **DDD patterns**: Entities, Value Objects, Services
- **React hooks abstraction**: `useSolanaTransaction`, `useNostrChat`
- **Comprehensive documentation**: 40+ markdown files

---

## 8. Strengths and Weaknesses

### Strengths

| Category | Details |
|----------|---------|
| **Novel Use Case** | Offline payments via BLE mesh is genuinely innovative |
| **Arcium Integration** | Deep MPC usage, not just surface-level |
| **Code Quality** | Clean architecture, TypeScript, DDD patterns |
| **Documentation** | Extensive - 40+ markdown files covering every feature |
| **Security Audit** | Self-conducted wallet security review (7.4/10) |
| **Mobile-First** | Real React Native app, not just web |
| **Economic Model** | Relayer fees create sustainable mesh incentives |

### Weaknesses

| Category | Details |
|----------|---------|
| **Complexity** | Many moving parts - BLE, Nostr, Arcium, Solana |
| **Testing Coverage** | No test files visible in escrow program |
| **Devnet Only** | Escrow uses devnet mints, not production-ready |
| **BLE Reliability** | Real-world BLE mesh is notoriously unreliable |
| **No ZK** | Uses MPC (Arcium) rather than ZK proofs |
| **Gas Costs** | Arcium MPC has additional on-chain costs |
| **Unfinished Features** | Many "TODO" and "planned" features in docs |

### Technical Debt Indicators
- Multiple "FIX" markdown files (BLE_AUTO_CONNECT_FIX, etc.)
- Backup UI files (`ui_OLD_BACKUP`)
- Various "COMPLETE" documentation suggesting rapid iteration
- hardcoded devnet mint addresses

---

## 9. Threat Level Assessment


| Factor | Assessment |
|--------|------------|
| **Privacy Approach** | Different - MPC vs ZK proofs |
| **Use Case** | Complementary - offline focus vs shielded pool |
| **Technical Depth** | High but different domain |
| **Judge Appeal** | Strong narrative (offline payments) |
| **Completion** | Mobile app functional, escrow needs work |

1. **Offline-first**: BLE mesh vs internet-required
2. **MPC vs ZK**: Arcium confidential compute vs STARK proofs
3. **Mobile app**: React Native vs web focus
4. **Payment escrow**: Fee model vs shielded pool

### Potential to Win
- **Arcium Bounty**: HIGH probability given deep integration
- **Overall Privacy Track**: MODERATE - novel but incomplete
- **Mobile/Consumer**: MODERATE - real app but BLE is finicky

---

## 10. Implementation Completeness

### Feature Matrix

| Feature | Status | Evidence |
|---------|--------|----------|
| BLE Mesh Networking | 80% | Extensive code, multiple fix docs |
| Nostr Integration | 90% | Full adapter, subscription, encryption |
| Arcium Escrow | 70% | Compiles, but devnet only |
| Durable Nonces | 90% | Complete implementation |
| Disposable Wallets | 85% | Full CRUD, needs token balance |
| Multi-hop Co-signing | 75% | Logic complete, needs more testing |
| Mobile App UI | 80% | Functional screens, some rough edges |
| Wallet Security | 75% | SecureStore + biometrics, needs improvements |

### Missing Components
1. **Production deployment scripts**
2. **Integration tests for escrow**
3. **Mainnet configuration**
4. **Token balance fetching for disposable wallets**
5. **NIP-17 gift-wrap encryption (planned)**
6. **Batch relayer payments**

### Code Metrics (Estimated)
- **TypeScript LOC**: ~15,000+
- **Rust LOC**: ~1,400 (escrow program)
- **Documentation**: ~200KB of markdown
- **Packages**: 80+ dependencies

---

## Summary

anon0mesh is an ambitious project that tackles a genuine problem (offline payments in connectivity-constrained environments) with a creative solution (BLE mesh + durable nonces + Arcium MPC). The project demonstrates:

1. **Strong Arcium integration** - likely competitive for their bounty
2. **Novel mesh networking approach** - unique in the hackathon
3. **Clean code architecture** - professional quality
4. **Extensive documentation** - thorough but indicates rapid development

**Weaknesses** include complexity that may lead to reliability issues, lack of testing evidence, and devnet-only status for the escrow program.


# Anoma.cash Analysis

**Repository:** anoma.cash
**Live URL:** https://anoma.cash/
**Analysis Date:** 2026-01-31

---

## 1. Project Overview

Anoma.cash is a **custodial privacy-focused wallet layer** for Solana that attempts to reduce on-chain linkability between deposits and withdrawals through:

- **Address rotation** for deposit addresses
- **Pooled liquidity execution** (all user funds consolidated into a single platform wallet)
- **Device-local balance tracking** (credits stored locally, not on-chain)
- **Relay-style transaction submission** (platform signs and broadcasts all withdrawals)

### Core Concept
Users deposit SOL/SPL tokens to rotating addresses. Funds are automatically swept ("forwarded") to a central platform wallet. The platform maintains a server-side JSON file (`users.json`) tracking each user's balance credits. Withdrawals are executed from the platform pool, breaking the direct on-chain link between deposit and withdrawal addresses.

**Important Clarification:** Despite the README claiming "device-local state (no cloud database)", the actual implementation uses **server-side JSON file storage** (`users.json`, `storage.json`, `transactions.json`) managed by API endpoints. This is NOT true client-side-only storage.

---

## 2. Track Targeting

**Primary Track:** Privacy Infrastructure / Privacy Wallet

**Submission Positioning:**
- Privacy-enhanced cash system on Solana
- Claims to provide transaction unlinkability
- Positions itself as a "CashApp-like" experience with privacy features

**Likely Secondary Bounties:**
- Jupiter integration (uses Jupiter for token swaps)
- Starpay gift card integration (visible in API)

---

## 3. Tech Stack

### Frontend
- Vanilla JavaScript (ES modules)
- Tailwind CSS (CDN)
- QRCode.js for address QR codes
- UUID library for user identification

### Backend
- Node.js with ES modules
- Vercel-style serverless API functions (`/api/*.js`)
- File-based JSON storage (NOT a real database)
- Firebase imports visible in obfuscated code (possibly legacy)

### Solana Integration
- `@solana/web3.js` v1.98.2
- `@solana/spl-token` v0.4.8
- Standard Ed25519 keypair generation via `tweetnacl`
- BIP39 mnemonic generation via `bip39`

### External APIs
- Jupiter Aggregator (token swaps)
- GeckoTerminal (ACASH price)
- CoinGecko (SOL price)
- Starpay.cards (gift card ordering)
- SolanaTracker (token metadata)

---

## 4. Crypto Primitives

### What They Use

| Primitive | Implementation | Purpose |
|-----------|----------------|---------|
| Ed25519 keypairs | `tweetnacl.sign.keyPair()` | Deposit address generation |
| BIP39 mnemonics | `bip39.generateMnemonic(128)` | Wallet recovery seeds |
| HD Key Derivation | Custom SHA256-based (NOT standard) | Solana wallet derivation |
| Solana Ed25519 | Native Solana signing | Transaction execution |

### What They DON'T Use

- **No ZK proofs** - Zero cryptographic privacy guarantees
- **No commitments** - No cryptographic binding of balances
- **No nullifiers** - No double-spend prevention via crypto
- **No encryption** - Private keys stored as plaintext in JSON
- **No ring signatures** - No sender anonymity
- **No stealth addresses** - Just basic keypair rotation

### Critical Key Derivation Issue

The wallet derivation in `wallet.js` is **non-standard**:

```javascript
function deriveSolWallet(seed) {
  const path = "m/44'/501'/0'/0'";
  const hash = createHash("sha256")
    .update(seed)
    .update(path)
    .digest();
  const keypair = nacl.sign.keyPair.fromSeed(hash.slice(0, 32));
  return keypair;
}
```

This custom derivation:
1. Hashes the seed concatenated with the path string
2. Uses SHA256 output directly as keypair seed
3. Does NOT use proper SLIP-0010 or ed25519-hd-key derivation

This means wallets are **not compatible** with standard Solana wallets and could lead to fund loss if users try to restore elsewhere.

---

## 5. Solana Integration

### On-Chain Components
- **No smart contracts** - Pure off-chain custody model
- Uses standard Solana SystemProgram for SOL transfers
- Uses standard SPL Token program for token transfers

### Deposit Flow
1. User gets rotating deposit address (fresh keypair per request)
2. User sends SOL to deposit address
3. Cron job polls deposit addresses for balances
4. `forwardSOL()` sweeps funds to main platform wallet
5. Server updates `users.json` with new balance credit

### Withdrawal Flow
1. User requests withdrawal via API
2. Server checks local balance in `users.json`
3. Server deducts balance and saves to JSON file
4. Platform wallet (`mainWallet`) signs and broadcasts transfer
5. Funds sent directly from platform pool to destination

### Token Model
- **ACASH token** - Custom SPL token used for platform fees
- 30% burn rate on deposited ACASH
- $2 USD platform fee per SOL deposit
- $0.50 reward in USD per deposit

---

## 6. Sponsor Bounties

### Likely Targeted

| Sponsor | Integration | Evidence |
|---------|-------------|----------|
| Jupiter | Token swaps | `jup.ag` API calls for swap execution |
| Starpay | Gift cards | Full API integration in `starpay.js` |

### Possible Additional
- General privacy track submission
- User experience / consumer app track

---

## 7. Alpha/Novel Findings

### Obfuscated Code Alert

The file `js/settings.js` contains **heavily obfuscated JavaScript**:

```javascript
const _0x18e4d0=_0x446c;(function(_0xbd99c4,_0x47adfe){...
```

This obfuscated code:
- Imports from Firebase (`firebase.js`, `firebase-firestore.js`)
- Accesses user data via `auth.currentUser`
- Handles wallet deletion and seed phrase operations

**This contradicts the "no cloud database" claim** and suggests Firebase was/is used for user authentication and potentially data storage.

### Security Vulnerabilities

1. **Private Key Storage in Plaintext JSON**
   ```javascript
   users[uid] = {
     solDepositPrivate: bs58.encode(sol.secretKey),
     splDepositPrivate: JSON.stringify(Array.from(spl.secretKey)),
     // ... stored in users.json
   };
   ```

2. **No Access Control on APIs**
   - User data accessible by anyone who knows the UID
   - No authentication beyond client-generated UUID

3. **Race Condition in Withdrawals**
   ```javascript
   // Balance deducted BEFORE transaction confirmed
   user.solBalance = newBalance;
   writeJSON(USERS_PATH, users);
   const sig = await sendSOL(destination, totalSendSOL);
   // If sendSOL fails, balance is already deducted
   ```

4. **Full Custody Risk**
   - Platform holds all private keys
   - Single point of failure
   - No multi-sig or threshold signatures

### Naming Confusion

The project name "Anoma" is **extremely similar** to the established Anoma Protocol (anoma.net), which is a legitimate privacy and coordination infrastructure project. This could cause:
- User confusion
- Trademark issues
- Misplaced trust based on name recognition

---

## 8. Strengths and Weaknesses

### Strengths

1. **Simple User Experience** - Works like CashApp, no crypto complexity exposed
2. **Functional Demo** - Live deployment at anoma.cash
3. **Jupiter Integration** - Enables token swaps within the platform
4. **Address Rotation** - Basic privacy improvement over single-address reuse
5. **Clear Documentation** - README explains the model well

### Weaknesses

1. **No Cryptographic Privacy**
   - Privacy relies entirely on operational security
   - Platform operator has full visibility of all transactions
   - Blockchain analysis can still link flows through the central pool

2. **Fully Custodial**
   - Users must trust platform with all funds
   - No on-chain proof of reserves
   - No cryptographic guarantees of solvency

3. **Critical Security Issues**
   - Private keys stored in plaintext files
   - No authentication system
   - Race conditions in balance updates

4. **Misrepresentation**
   - Claims "no cloud database" but uses Firebase
   - Claims "device-local state" but stores on server
   - Name implies association with legitimate Anoma Protocol

5. **Non-Standard Key Derivation**
   - Custom (incorrect) BIP44 implementation
   - Wallets not recoverable in standard Solana wallets

6. **Regulatory Risk**
   - Custodial model likely requires money transmitter license
   - Mixing-like functionality could trigger AML concerns

---

## 9. Threat Level Assessment

**Threat Level: LOW**

### Competitive Analysis

| Factor | Assessment |
|--------|------------|
| Technical Sophistication | Very Low - No ZK, no cryptographic privacy |
| Implementation Quality | Poor - Security vulnerabilities, race conditions |
| Privacy Guarantees | None cryptographic - Trust-based only |
| Novel Innovation | None - Standard custodial mixer pattern |
| User Trust Required | Extremely High - Full custody, plaintext keys |

### Why Low Threat

1. **Not a real privacy solution** - Provides zero cryptographic guarantees
2. **Security issues** would deter serious users
3. **Custodial model** is inferior to non-custodial alternatives
4. **No on-chain components** to analyze or learn from
5. **Misleading claims** could hurt credibility if scrutinized


- Cryptographic privacy guarantees
- Non-custodial operation
- On-chain verification
- Mathematically proven unlinkability

Anoma.cash provides:
- Trust-based privacy (operator sees everything)
- Custodial operation (operator controls funds)
- Off-chain balances (no verification possible)
- Operational unlinkability only (easily bypassed)

---

## 10. Implementation Completeness

### Implemented Features

| Feature | Status | Quality |
|---------|--------|---------|
| Wallet creation | Complete | Poor (non-standard derivation) |
| Deposit addresses | Complete | OK (basic rotation) |
| Fund sweeping | Complete | OK |
| Balance tracking | Complete | Poor (file-based, race conditions) |
| Withdrawals | Complete | Poor (no confirmation check) |
| Jupiter swaps | Complete | Good |
| ACASH tokenomics | Complete | OK |
| Starpay integration | Partial | API only, unclear frontend |

### Missing/Incomplete

| Feature | Status |
|---------|--------|
| Authentication system | Missing |
| Multi-device sync | Not possible (despite claims) |
| Cryptographic privacy | Not implemented |
| On-chain proofs | Not implemented |
| Mobile app | Not implemented |
| Rate limiting | Missing |
| Error handling | Minimal |

### Code Quality Assessment

- **Security:** 2/10 - Critical vulnerabilities
- **Maintainability:** 4/10 - Simple but poorly structured
- **Documentation:** 6/10 - README is clear, code comments minimal
- **Testing:** 0/10 - No tests visible
- **Error Handling:** 3/10 - Basic try/catch, no rollback on failure

---

## Summary

Anoma.cash is a **custodial mixing service** disguised as a privacy wallet. It provides no cryptographic privacy guarantees and requires complete trust in the platform operator. The implementation contains significant security vulnerabilities including plaintext private key storage, race conditions, and lack of authentication.

The project's main value proposition (privacy through address rotation and pooled execution) is a well-known pattern that provides minimal privacy against motivated adversaries. Any blockchain analyst could trace funds through the central pool with access to the platform's records.


The naming similarity to the legitimate Anoma Protocol is concerning and could be intentional to leverage that project's reputation.

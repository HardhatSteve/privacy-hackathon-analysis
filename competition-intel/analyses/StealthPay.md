# StealthPay - Solana Privacy Hackathon Analysis

## 1. Project Overview

**Name:** StealthPay
**Tagline:** "Privacy by default. Proof by choice."
**Repository:** solana-privacy-hackathon-analysis/StealthPay

StealthPay is a private USDC payment application built for the Solana Privacy Hackathon. It implements an invoice-based payment flow where:

1. Recipients create payment requests with amounts, notes, and expiry times
2. Senders pay privately through a shielded pool mechanism
3. Recipients can optionally generate "disclosure receipts" for compliance purposes

The core value proposition is **selective disclosure**: payments are private by default, but recipients can choose to reveal transaction details when needed for compliance, auditing, or proof of payment.

### Core Features
- Invoice creation with QR code generation
- Private USDC transfers via Privacy Cash SDK
- Helius RPC integration for transaction confirmation
- Range API integration for sanctions/compliance screening
- Downloadable JSON disclosure receipts with SHA-256 hashes
- Two-step payment flow: deposit (client-side) + withdraw (relayer)

---

## 2. Track Targeting

| Track | Alignment | Evidence |
|-------|-----------|----------|
| **Private Payments Track** | Primary | Core feature is private USDC payments with hidden amounts |
| **Privacy Cash Sponsor Prize** | Strong | Direct SDK integration: `@privacy-cash/privacy-cash-sdk` |
| **Range Compliant Privacy Prize** | Strong | Sanctions screening API integration at `/api/range/sanctions` |
| **Helius Sponsor Prize** | Moderate | Uses Helius RPC for transaction confirmation polling |

The project is explicitly designed to target all four prize categories, as documented in their README's "Prize Alignment" section.

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.x | App Router, server components, API routes |
| React | 18.2.x | UI framework |
| Tailwind CSS | 3.4.x | Styling (dark theme) |
| TypeScript | 5.3.x | Type safety |
| qrcode.react | 3.1.x | QR code generation for payment links |
| uuid | 9.x | Invoice ID generation |

### Solana Integration
| Package | Purpose |
|---------|---------|
| @solana/web3.js 1.95.x | Core Solana SDK |
| @solana/wallet-adapter-* | Wallet connection (Phantom) |
| @privacy-cash/privacy-cash-sdk | Private SPL token transfers |

### Backend/Relayer
| Technology | Purpose |
|------------|---------|
| Express.js | Relayer server |
| Node.js | Runtime (requires 22+, SDK recommends 24+) |

---

## 4. Crypto Primitives

### Privacy Cash SDK
The project delegates all cryptographic privacy to the Privacy Cash SDK. Based on the integration code:

```typescript
// Deposit flow
const pc = new PrivacyCash({ RPC_url, owner, enableDebug: false })
const depositResult = await pc.depositSPL({ mintAddress: usdcMint, base_units })

// Withdraw flow
const wd = await pc.withdrawSPL({ mintAddress: usdcMint, base_units, recipientAddress })
```

The Privacy Cash protocol provides:
- **Shielded pools** for SPL tokens
- **Deposit/withdraw model** that breaks sender-recipient linkability
- **Encrypted UTXOs** stored on-chain
- **Zero-knowledge proofs** (details abstracted by SDK)

### Disclosure Receipt Hashing
```typescript
const enc = new TextEncoder()
const data = enc.encode(JSON.stringify(disclosure))
const digest = await crypto.subtle.digest('SHA-256', data)
```
- Uses Web Crypto API for SHA-256 hashing
- Creates deterministic hash of disclosure JSON for verification

### No Custom Cryptography
The project does **not** implement any custom cryptographic primitives. All privacy guarantees are inherited from the Privacy Cash SDK. This is both a strength (avoids crypto implementation bugs) and a weakness (entirely dependent on Privacy Cash's security).

---

## 5. Solana Integration

### Wallet Integration
```typescript
// providers.tsx
const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
return (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
```
- Standard Solana wallet adapter pattern
- Currently only Phantom configured (could easily add more)
- Uses Devnet by default

### Payment Architecture
Two-step flow designed for security:

1. **Deposit (Client-side):** User's wallet signs deposit into shielded pool
2. **Withdraw (Relayer-side):** Relayer wallet performs withdrawal to recipient

```
Sender Wallet --> depositSPL() --> [Shielded Pool] --> withdrawSPL() --> Recipient Wallet
                 (user signs)       (privacy zone)      (relayer signs)
```

### Relayer Server
```javascript
// Safety limits
const MAX_BASE_UNITS_PER_TX = BigInt('2000000') // $2 USDC default
const RATE_LIMIT_MAX_PER_WINDOW = 10 // per minute

// USDC mint whitelist
const expectedUsdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```
Includes basic security controls:
- Per-transaction amount limits
- Rate limiting (in-memory, not production-ready)
- USDC mint address whitelist
- Bearer token authentication

### Transaction Confirmation
```typescript
export async function heliusGetTransaction(signature: string) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getTransaction",
      params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
    }),
  });
  return json.result;
}
```
- Uses Helius RPC for confirmations
- Polls every 2 seconds until confirmed

---

## 6. Sponsor Bounties

### Privacy Cash Integration
**Status: Integrated but not fully functional**

- SDK is included as a GitHub dependency
- Code paths for `depositSPL` and `withdrawSPL` are implemented
- Falls back to mock signatures when SDK unavailable
- SPL token support noted as "In Development" in README

**Evidence of Issues:**
```
api_test_result.txt:
Status: 500
Response: { "error": "Cannot mix BigInt and other types, use explicit conversions" }
```

### Helius Integration
**Status: Implemented**

- Helius RPC URL configured via environment
- `getTransaction` used for confirmation polling
- Standard JSON-RPC integration

### Range Integration
**Status: Implemented**

```typescript
const r = await fetch(`https://api.range.org/v1/risk/sanctions/${address}`, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});

const blocked = Boolean(data.is_token_blacklisted || data.is_ofac_sanctioned);
```

- Sanctions/OFAC screening endpoint
- Token blacklist checking
- Optional per-invoice compliance toggle

---

## 7. Alpha/Novel Findings

### 1. Selective Disclosure Design
The "Privacy by default, Disclosure by choice" model is well-designed for enterprise adoption:
- Payments are private until explicitly disclosed
- Disclosure creates verifiable JSON receipts
- Hash-based integrity verification
- Compatible with existing compliance workflows

### 2. Two-Phase Payment Architecture
The deposit/withdraw separation is a good security pattern:
- User never exposes private keys to relayer
- Relayer handles gas but can't steal deposits
- Works around Privacy Cash's server-side SDK requirements

### 3. Demo Mode Strategy
Graceful fallback to mock signatures enables:
- Functional demo without working SDK
- Testing of full UI/UX flow
- Submission completeness despite SDK issues

### 4. Invoice-Based Model
Using invoices with unique IDs and QR codes is practical:
- Better UX than raw addresses
- Natural fit for business payments
- Supports payment notes and expiry

### 5. Weaknesses Revealed

**Privacy Cash SDK Not Production-Ready:**
The SDK is designed primarily for SOL, with SPL support "In Development." This means the core privacy feature doesn't actually work for USDC.

**localStorage for Demo Storage:**
Invoice data stored in browser localStorage:
```typescript
localStorage.setItem(`invoice_${id}`, JSON.stringify(invoiceData))
```
Not suitable for production; invoices are device-specific.

---

## 8. Strengths and Weaknesses

### Strengths

1. **Clean Architecture:** Well-structured Next.js app with clear separation of concerns
2. **Multi-Bounty Alignment:** Explicitly targets 4 sponsor prizes
3. **Graceful Degradation:** Falls back to mocks when SDK unavailable
4. **Security Controls:** Rate limiting, amount limits, mint whitelisting in relayer
5. **Good UX Design:** Invoice flow, QR codes, disclosure receipts
6. **Production-Aware:** Two-phase deposit/withdraw model, relayer separation

### Weaknesses

1. **Core Feature Non-Functional:** Privacy Cash SPL support not ready
2. **No On-Chain State:** Invoices only in localStorage
3. **Incomplete Compliance Integration:** Range screening toggle exists but not enforced
4. **Single Wallet Support:** Only Phantom configured
5. **Relayer Centralization:** Single relayer is SPOF and trust assumption
6. **No Proof Verification:** Disclosure receipts aren't cryptographically verifiable
7. **Missing Mobile Support:** No PWA despite roadmap mention

---

## 9. Threat Level

### Competitive Threat Assessment: **MEDIUM-LOW**

| Factor | Score | Notes |
|--------|-------|-------|
| **Technical Innovation** | 3/10 | No novel crypto; wraps Privacy Cash SDK |
| **Implementation Completeness** | 5/10 | Good frontend, broken SDK integration |
| **UX/Design** | 7/10 | Clean dark theme, intuitive invoice flow |
| **Sponsor Alignment** | 8/10 | Hits all 4 bounties explicitly |
| **Production Readiness** | 3/10 | Demo-only, localStorage, mock fallbacks |
| **Team Evidence** | 4/10 | Single developer Windows path suggests solo effort |

### Overall: **MEDIUM-LOW THREAT**

The project is well-positioned for bounty consideration due to explicit sponsor integrations, but the core privacy functionality depends entirely on Privacy Cash SDK which doesn't support SPL tokens yet. The demo works through mock signatures, not actual private transfers.

**Risk Factors:**
- If judges test actual payments, they will fail
- If Privacy Cash SDK matures before judging, threat level increases
- Strong presentation/demo video could compensate

---

## 10. Implementation Completeness

### Feature Completion Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice Creation | COMPLETE | UUID, QR, localStorage |
| Payment Link Sharing | COMPLETE | QR code + copyable URL |
| Wallet Connection | COMPLETE | Phantom via adapter |
| Private Deposit | PARTIAL | Code exists, SDK returns mocks |
| Private Withdraw | PARTIAL | Relayer code exists, untested |
| Transaction Confirmation | COMPLETE | Helius polling works |
| Disclosure Receipt | COMPLETE | JSON download with SHA-256 |
| Range Screening | PARTIAL | API endpoint exists, not enforced |
| Compliance Toggle | COMPLETE | UI toggle works |
| On-chain Registry | NOT STARTED | Marked as "future" |
| Mobile PWA | NOT STARTED | Marked as "future" |

### Code Quality Assessment

**Positive:**
- TypeScript throughout
- Proper error handling with fallbacks
- Good code organization
- Security-conscious relayer design

**Negative:**
- BigInt mixing errors in production
- No unit tests
- No integration tests
- Hardcoded values (e.g., relayer wallet address)

### Lines of Code (Estimated)
- Frontend: ~700 LOC
- API Routes: ~100 LOC
- Libraries: ~200 LOC
- Relayer: ~250 LOC
- **Total:** ~1,250 LOC

---

## Summary

StealthPay is a **well-designed hackathon submission** that demonstrates a practical selective-disclosure payment flow for USDC on Solana. The architecture is sound, the UX is polished, and the multi-bounty strategy is clear.

However, the core differentiator - private SPL token transfers - **does not actually work** because the Privacy Cash SDK doesn't support SPL tokens in production yet. The project gracefully falls back to mock signatures, making the demo functional but the privacy features non-operational.

- Not a direct competitor (different approach - SDK wrapper vs. native shielded pool)
- Validates market demand for private USDC payments with compliance options
- Demonstrates sponsor prize multi-targeting strategy

**Recommendation:** Monitor Privacy Cash SDK development. If SPL support launches, StealthPay could become more competitive. Currently, it's primarily a well-executed demo with non-functional privacy.

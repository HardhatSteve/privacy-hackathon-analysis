# ConfPay - Hackathon Submission Analysis

## 1. Project Overview

**Name:** ConfPay

**Tagline:** Confidential Payroll on Solana

**Core Concept:** ConfPay is a privacy-preserving payroll and vesting protocol built on Solana. It enables organizations to pay salaries, manage vesting schedules, and automate payroll fully on-chain without exposing sensitive financial data (salary amounts) to the public blockchain.

**Key Innovation:** A "Dual-Encryption Architecture" combining:
- **Inco Network (FHE):** Fully Homomorphic Encryption for on-chain compute privacy (future-proof, verifiable)
- **Client-Side AES:** Instant local decryption for fast UX

**Use Cases:**
- Enterprise payroll with confidential salaries
- DAO contributor compensation
- Private vesting schedules
- Confidential business logic on-chain

**Program ID:** `EpWKv3uvNXVioG5J7WhyDoPy1G6LJ9vTbTcbiKZo6Jjw` (Devnet)

---

## 2. Track Targeting

### Primary Track: Privacy Tooling ($15k)
**Fit: MODERATE-WEAK**

The project is more application-focused than tooling. It doesn't provide reusable privacy primitives or libraries that other developers could integrate. The encryption wrapper is application-specific.

### Secondary Track: Private Payments ($15k)
**Fit: MODERATE**

While ConfPay involves payments (payroll), it doesn't hide *who pays whom* - only *how much* is paid. The sender (employer) and receiver (employee) addresses are fully visible on-chain. This is quite different from classic private payment systems that break wallet linkability.

### Tertiary Track: Open Track ($18k)
**Fit: MODERATE**

Could position as "confidential computation" or "enterprise privacy" use case, but the scope is narrow (payroll only).

---

## 3. Tech Stack

### Blockchain Layer
- **Solana Devnet** - Settlement, execution, PDA storage
- **Anchor 0.30.1** - Program framework
- **Program written in Rust** with proper PDA derivation

### Privacy Layer
- **Inco Network SDK** (`@inco/solana-sdk ^0.0.2`) - FHE encryption for salary values
- **Inco Lightning** - TEE-backed encryption/decryption service
- **AES-GCM** (Client-Side) - Browser-based encryption using Web Crypto API

### Frontend
- **Next.js 14.2** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Phantom Wallet** - Wallet adapter

### Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @coral-xyz/anchor | 0.32.1 | Anchor client |
| @inco/solana-sdk | 0.0.2 | FHE encryption |
| @solana/web3.js | 1.98.4 | Solana client |
| @solana/wallet-adapter-* | 0.15.x | Wallet integration |

---

## 4. Crypto Primitives

### Encryption Scheme

**Dual-Encryption Format:**
```
[Magic Header: 0xCAFEBABE (4 bytes)]
[Block Count: 1 byte]
[Block 1: LEN (1 byte) + AES-encrypted salary]
[Block 2: LEN (1 byte) + AES-encrypted salary (optional)]
[Inco FHE Ciphertext (remainder)]
```

### AES-GCM Implementation
- **Key Derivation (Employer):** Sign deterministic message -> SHA-256 hash -> AES key
- **Key Derivation (Worker):** PIN -> SHA-256 hash -> AES key
- **IV:** 12 random bytes per encryption
- **Auth Tag:** Built-in to AES-GCM

```typescript
// Key derivation from signature
const hash = await crypto.subtle.digest("SHA-256", signature.buffer);
const key = await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
```

### Inco FHE Integration
- Uses `encryptValue()` from `@inco/solana-sdk/encryption`
- Uses `decrypt()` from `@inco/solana-sdk/attested-decrypt` (attestation-based decryption)
- Salary stored as `u64` (lamports)
- Decryption requires wallet signature for attestation

### Security Analysis

**Strengths:**
- AES-GCM is a strong authenticated encryption scheme
- Key derivation from wallet signature provides cryptographic binding to wallet ownership
- PIN provides additional access control layer

**Weaknesses:**
1. **PIN stored in plaintext on-chain:** The Employee struct stores `pin: String` directly in the account - this completely defeats the purpose of PIN-based access control
2. **No key rotation mechanism:** Once a key is derived, there's no way to rotate it
3. **Single-point-of-failure:** If employer wallet is compromised, all salary data can be decrypted
4. **Weak PIN entropy:** 4-digit PIN provides only ~13 bits of entropy

---

## 5. Solana Integration

### On-Chain Program Architecture

**Accounts:**
```rust
// Payroll (per employer)
pub struct Payroll {
    pub admin: Pubkey,           // 32 bytes
    pub employee_count: u64,      // 8 bytes
    pub company_name: String,     // max 50 chars
}

// Employee (per employee per payroll)
pub struct Employee {
    pub payroll: Pubkey,          // 32 bytes
    pub wallet: Pubkey,           // 32 bytes
    pub name: String,             // max 50 chars
    pub role: String,             // max 32 chars
    pub pin: String,              // max 10 chars - STORED PLAINTEXT!
    pub schedule: String,         // max 20 chars
    pub ciphertext: Vec<u8>,      // max 256 bytes
    pub input_type: u8,           // 1 byte
    pub next_payment_ts: i64,     // 8 bytes
    pub last_paid_ts: i64,        // 8 bytes
}
```

**PDA Seeds:**
- Payroll: `["payroll", admin_pubkey]`
- Employee: `["employee", payroll_pda, employee_wallet]`

**Instructions:**
1. `initialize_payroll(company_name)` - Create employer payroll account
2. `add_employee(name, role, ciphertext, input_type, pin, schedule, next_payment_ts)` - Add employee with encrypted salary
3. `update_employee(...)` - Update employee details
4. `pay_employee()` - Update payment timestamps (actual SOL transfer done via SystemProgram)
5. `remove_employee()` - Close employee account, refund rent

### Security Issues in Solana Program

1. **pay_employee has no authorization check:** The admin check is commented out, meaning ANYONE can call `pay_employee` to update timestamps:
```rust
pub fn pay_employee(ctx: Context<PayEmployee>) -> Result<()> {
    // REMOVED: Admin check to allow Automation Bot to call this
    // require!(ctx.accounts.admin.key() == payroll.admin, CustomError::Unauthorized);
    ...
}
```

2. **PIN stored on-chain:** Anyone can read the PIN from the Employee account data

3. **No access control for reading:** All account data is public - encrypted salary is the only protection

---

## 6. Sponsor Bounties

### Inco Network (Likely Target)
**Fit: STRONG**

ConfPay directly integrates `@inco/solana-sdk` for FHE encryption. The project showcases:
- `encryptValue()` for salary encryption
- `attestDecrypt()` for attested decryption
- Dual-encryption fallback pattern

However, the implementation has issues:
- Falls back to AES-only if Inco encryption fails
- Error handling silences Inco failures

### Helius (Minor Integration)
Uses Helius devnet RPC as primary endpoint:
```typescript
"https://devnet.helius-rpc.com/?api-key=b0cc0944-d97f-42ea-8336-fb7e52dad8e1"
```

### Other Bounties
No evidence of integration with:
- Light Protocol / ZK Compression
- Elusiv / Privacy pools
- Lit Protocol
- Other privacy-focused sponsors

---

## 7. Alpha / Novel Findings

### Novel Concepts

1. **Dual-Encryption Fallback Pattern:** The design of embedding both AES and FHE ciphertext in a single blob with magic header detection is somewhat novel for graceful degradation.

2. **Browser-Based Automation Bot:** The "Clockwork Bot" is actually a browser-tab-based scheduler that runs client-side, storing a keypair in localStorage. This is unusual (and risky).

### Red Flags / Security Concerns

1. **CRITICAL: PIN Stored Plaintext On-Chain**
```rust
pub struct Employee {
    ...
    #[max_len(10)]
    pub pin: String,  // Anyone can read this!
    ...
}
```
This completely defeats the worker authentication model.

2. **CRITICAL: pay_employee Authorization Removed**
The comment explicitly says it was removed "to allow Automation Bot to call this" - but this means anyone can manipulate payment timestamps.

3. **Bot Private Key in localStorage**
The automation bot stores its keypair in browser localStorage - easily extractable, not secure.

4. **API Key Exposed**
Helius API key is hardcoded in client-side code:
```typescript
"https://devnet.helius-rpc.com/?api-key=b0cc0944-d97f-42ea-8336-fb7e52dad8e1"
```

---

## 8. Strengths and Weaknesses

### Strengths

1. **Clear Use Case:** Payroll privacy is a genuine business need that could drive enterprise adoption
2. **Working Demo:** The project appears functional on Devnet with full UI
3. **Proper Anchor Usage:** PDAs are correctly derived, account structures are well-defined
4. **Inco Integration:** Actually uses Inco SDK (not just mentioned)
5. **Dual-Role UI:** Separate employer and worker portals with different views
6. **Retry Logic:** Client code has RPC rate-limit handling

### Weaknesses

1. **Fundamental Security Flaws:** PIN plaintext storage and removed auth checks are critical vulnerabilities
2. **Limited Privacy Model:** Only salary amounts are hidden - sender/receiver fully visible
3. **No ZK Proofs:** Despite claims, there are no zero-knowledge proofs in the system
4. **Browser-Based Bot:** Not production-viable for automated payments
5. **No Compliance Features:** Unlike competitors (Chameo), no wallet screening or compliance
6. **Test Coverage:** Very minimal tests (single basic test file)
7. **No Audit:** Unaudited code with security issues

---

## 9. Threat Level Assessment

### Competitive Threat: LOW-MEDIUM

**Why LOW:**
- Fundamental security flaws would be caught by judges
- Limited scope (salary amounts only, not payment unlinkability)
- No ZK proofs or sophisticated cryptography
- Browser-based automation is not production-viable

**Why MEDIUM:**
- Clean UI/UX could impress in demo
- Inco integration is real and functional
- Clear enterprise use case narrative
- "Confidential payroll" is an attractive pitch


|--------|---------|------|
| Privacy Model | Encrypted values only | Full unlinkability |
| ZK Proofs | None | Groth16 / STARKs |
| On-chain footprint | Large (full account data) | Minimal (commitments) |
| Compliance | None | Range screening |
| Security | Critical flaws | Audited patterns |

---

## 10. Implementation Completeness

### Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Payroll initialization | Complete | Works on devnet |
| Employee management | Complete | Add/update/remove |
| Salary encryption | Complete | Inco + AES dual-encryption |
| Salary decryption | Complete | Attested decrypt works |
| Manual payments | Complete | Standard SOL transfer |
| Automated payments | Partial | Browser-only, not reliable |
| Worker portal | Complete | Login with PIN |
| Payment history | Complete | On-chain scan |
| Vesting schedules | Not Implemented | Mentioned but not present |
| Multi-sig | Not Implemented | |
| SPL Token support | Not Implemented | SOL only |

### Code Quality

- **Frontend:** Production-quality React/Next.js code with proper error handling
- **Solana Program:** Basic but functional, uses Anchor best practices (except security issues)
- **Tests:** Minimal coverage, basic happy-path only
- **Documentation:** README is well-written but overclaims

### Deployment Status

- Deployed to Solana Devnet
- Program ID verified in Anchor.toml and IDL
- Frontend likely hosted (demo purposes)

---

## Summary

ConfPay is a well-presented but fundamentally flawed privacy payroll application. While it successfully integrates Inco Network FHE and has a polished UI, critical security issues (plaintext PIN storage, removed authorization) undermine its privacy claims. The project is more of a "confidential values" demo than a true privacy protocol.

**Recommendation:** Not a significant competitive threat due to security flaws that judges familiar with Solana development would likely identify. The project would need significant security remediation before being production-viable.

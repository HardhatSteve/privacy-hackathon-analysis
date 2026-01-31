# Donatrade - Analysis

## 1. Project Overview
Donatrade is a privacy-first private investment platform on Solana that enables investors to hold shares in private companies on-chain without exposing their balances publicly. Share positions are encrypted using INCO Lightning's FHE (Fully Homomorphic Encryption) and only visible to the investor and the company. The platform avoids SPL tokens entirely, instead using encrypted position accounts.

## 2. Track Targeting
**Track: Private Payments** (with elements of Privacy Tooling)

The project targets confidential asset management for private company investments, where share holdings must remain private. This aligns with the Private Payments track as it enables value transfer (share purchases/sales) with hidden amounts.

## 3. Tech Stack
- **ZK System**: INCO Lightning FHE (not ZK, but confidential computing via TEE)
- **Languages**: Rust (Anchor), TypeScript (Next.js 16)
- **Frameworks**:
  - Anchor 0.31.1 for Solana program
  - Next.js 16 for frontend
  - React 19
- **Key Dependencies**:
  - `@inco/solana-sdk` v0.0.2 - INCO Lightning integration
  - `@coral-xyz/anchor` v0.31.1
  - `@solana/wallet-adapter-*` for wallet connectivity

## 4. Crypto Primitives
- **Fully Homomorphic Encryption (FHE)** via INCO Lightning:
  - `Euint128` encrypted integers for share counts and USDC balances
  - `e_add`, `e_sub` for encrypted arithmetic operations
  - `as_euint128` for plaintext-to-ciphertext conversion
- **Attested Decryption**: Client-side decryption with wallet signature verification
- **PDA-based account derivation** for position and vault accounts

## 5. Solana Integration
**Program Architecture**:
- Program ID: `9MBsFdzmTYU93kDseX9mczoYPChfaoSMU3uS9tu5e4ax`
- Uses Anchor framework with CPI to INCO Lightning

**PDAs**:
- `InvestorVault`: `["vault", investor_pubkey]` - stores encrypted USDC balance
- `CompanyAccount`: `["company", company_id]` - company share registry
- `PositionAccount`: `["position", company_id, investor_pubkey]` - encrypted share holdings
- `GlobalProgramVault`: `["vault_authority"]` - program vault for USDC

**Instructions**:
- `initialize_global_vault` - Setup platform
- `create_company` - Register company with initial shares
- `deposit` / `withdraw` - USDC deposit/withdrawal with FHE balance updates
- `buy_shares` / `sell_shares` - Encrypted share trading
- `authorize_decryption` - Grant decryption permission

**CPI Patterns**:
- SPL Token transfers for USDC custody
- INCO Lightning CPI for FHE operations (`e_add`, `e_sub`, `as_euint128`, `allow`)

## 6. Sponsor Bounty Targeting
- **INCO Lightning** (primary): Deep integration with INCO's FHE primitives for encrypted state
- No other explicit sponsor integrations visible

## 7. Alpha/Novel Findings
- **Innovative use case**: Private equity share management on-chain - a novel application for FHE
- **No SPL tokens**: Deliberately avoids token accounts to prevent balance leakage
- **Dual-key decryption**: Investor + company can both view positions
- **Real INCO integration**: Actual CPI calls to INCO Lightning program, not mock

## 8. Strengths
1. **Clean architecture**: Well-separated concerns between company, investor, and position accounts
2. **Real FHE integration**: Genuine INCO Lightning CPI, not simulated encryption
3. **Complete flow**: Deposit, buy, sell, withdraw cycle fully implemented
4. **Good UX design**: Privacy-first language with "hidden by default" balance reveals
5. **Proper space calculations**: Correct account sizing for Anchor
6. **Production-ready Anchor patterns**: Uses `init_if_needed`, proper bump handling

## 9. Weaknesses
1. **INCO dependency risk**: Relies entirely on INCO Lightning being available/functional
2. **No range proofs**: Cannot prove balance >= amount without decryption (overdraft possible)
3. **Limited access control**: Company admin privileges not fully implemented
4. **No secondary market**: Share transfers between investors not supported
5. **Missing tests**: No test files visible in the codebase
6. **Single company support per deployment**: Would need modifications for multi-company

## 10. Threat Level
**MODERATE**

Justification: Solid FHE integration with novel use case, but narrow focus (private equity only). The INCO dependency is a double-edged sword - it's real privacy but relies on external infrastructure. Implementation is clean but lacks the breadth to threaten across multiple tracks.

## 11. Implementation Completeness
**65% Complete**

**Implemented**:
- Core Anchor program with all main instructions
- INCO Lightning CPI integration
- Frontend with wallet connection
- Deposit/buy/sell/withdraw flow
- Client-side decryption with wallet signing

**Missing**:
- Secondary share market (P2P transfers)
- Company admin dashboard
- Real on-chain deployment
- Integration tests
- Payment processing beyond mock USDC
- Multi-company support
- Governance/voting mechanisms

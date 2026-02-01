# solana-privacy-shield - Analysis

## 1. Project Overview
A wallet privacy analysis dashboard built with React/Vite that analyzes Solana wallets for privacy risks. Uses AI (via Supabase edge functions) to generate privacy reports and allows users to anchor report hashes on-chain for integrity verification. Also known as "Solana Privacy Copilot."

## 2. Track Targeting
**Privacy Tooling** - Privacy analysis and reporting tool.

## 3. Tech Stack
- **ZK System**: None
- **Languages and frameworks**:
  - React 18.3.1 with TypeScript
  - Vite 5.4
  - TailwindCSS
  - shadcn/ui components
  - Anchor (for report anchoring program)
- **Key dependencies**:
  - @solana/web3.js ^1.98.0
  - @solana/wallet-adapter-react
  - @supabase/supabase-js ^2.90.1
  - @tanstack/react-query
  - recharts (visualizations)
  - lovable-tagger (built with Lovable.dev)

## 4. Crypto Primitives
- **SHA-256**: Report hash for on-chain anchoring
- **No ZK proofs**: Traditional hash-based integrity

## 5. Solana Integration
**Anchor program for report anchoring:**

Program ID: `PRiVRpT1111111111111111111111111111111111111` (placeholder)

**Instructions:**
- `anchor_report` - Store report hash on-chain
- `verify_report` - Verify report exists

**PDA Seeds:** `["report", reporter, report_hash]`

**State:**
- `AnchoredReport`: reporter, analyzed_wallet, report_hash, created_at (112 bytes)

**Backend:**
- Supabase edge functions for wallet analysis
- AI-powered report generation

## 6. Sponsor Bounty Targeting
No clear sponsor bounty targeting. Uses Supabase for backend rather than QuickNode or Helius.

## 7. Alpha/Novel Findings
- **AI-powered analysis**: Uses LLM to generate human-readable privacy reports
- **On-chain integrity**: Hash anchoring provides verifiable audit trail
- **Built with Lovable.dev**: AI-assisted development tool
- **Six privacy metrics**:
  1. Fee Payer Reuse Ratio
  2. Signer Concentration
  3. Program Entropy (fingerprint)
  4. Counterparty Concentration
  5. Memo Detection
  6. Temporal Entropy

## 8. Strengths
- **Beautiful UI**: Modern design with animations, gauges, metrics cards
- **AI integration**: Novel use of LLM for report generation
- **On-chain anchoring**: Integrity verification is a nice touch
- **Comprehensive metrics**: Six dimensions of privacy analysis
- **Production polish**: Error boundaries, toast notifications, loading states

## 9. Weaknesses
- **Supabase dependency**: Backend is closed-source edge function
- **No heuristic code visible**: Analysis logic is in backend, not repo
- **AI reliability concerns**: LLM-generated reports may be inconsistent
- **Placeholder program ID**: Suggests not deployed
- **Rate limiting**: Backend has rate limits visible in code
- **Similar to solana-privacy-scanner**: Less comprehensive, less polished
- **Built with AI tool**: May lack deep technical understanding

## 10. Threat Level
**LOW-MODERATE**

Justification:
- Nice UI but lacks technical depth
- Backend is black box (Supabase functions)
- Competes directly with solana-privacy-scanner which is far more polished
- AI-generated reports are novel but may not be reliable
- No clear sponsor bounty alignment
- Placeholder program ID suggests incomplete

## 11. Implementation Completeness
**60% complete**

What's implemented:
- Full React frontend with beautiful UI
- Wallet analysis visualization
- Privacy score gauge
- Metrics cards with explanations
- On-chain report anchoring (Anchor program structure)
- Supabase integration

What's missing:
- Deployed Anchor program (placeholder ID)
- Transparent analysis logic (hidden in backend)
- Multiple heuristics (only 6 vs scanner's 13)
- CLI tool
- Static code analyzer
- npm package
- Documentation site

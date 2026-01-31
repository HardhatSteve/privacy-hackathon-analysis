# ORRO PROTOCOL

<p align="center">
  <img src="https://github.com/orroprotocol/core/blob/main/docs/images/orro-logo-header-white.png" alt="ORRO Protocol Logo" width="180">
</p>

<p align="center"><strong>The world's first decentralized reputation and trust engine for the creative economy.</strong></p>

<p align="center"><a href="[GitHub - orroprotocol/core](https://github.com/orroprotocol/core)"><img src="https://img.shields.io/badge/ORRO%20Protocol-v2.0-8B5CF6?style=for-the-badge&logoColor=white" alt="ORRO Protocol v2.0"></a><a href="https://github.com/orroprotocol/core/releases"><img src="https://img.shields.io/github/v/release/orroprotocol/core?style=for-the-badge&include_prereleases" alt="Version"></a><a href="[The MIT License &#8211; Open Source Initiative](https://opensource.org/licenses/MIT)"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a><a href="[https://solana.com](https://solana.com)"><img src="https://img.shields.io/badge/Built%20on-Solana-00d1b2?style=for-the-badge&logo=solana&logoColor=white" alt="Built on Solana"></a><a href="[https://www.rust-lang.org](https://www.rust-lang.org)"><img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust"></a><a href="[https://www.anchor-lang.com](https://www.anchor-lang.com)"><img src="https://img.shields.io/badge/Anchor-Framework-8B5CF6?style=for-the-badge&logoColor=white" alt="Anchor Framework"></a></p>
<p align="center"><a href="https://twitter.com/orroprotocol"><img src="https://img.shields.io/twitter/follow/orroprotocol?style=social" alt="Twitter"></a></p>

## Table of Contents

* [Introduction](https://www.google.com/search?q=%23-introduction)

* [Installation](https://www.google.com/search?q=%23-installation)

* [Usage](https://www.google.com/search?q=%23-usage)

* [Architecture](https://www.google.com/search?q=%23-architecture)

* [Roadmap](https://www.google.com/search?q=%23-roadmap)

* [Tokenomics](https://www.google.com/search?q=%23-tokenomics)

* [Community](https://www.google.com/search?q=%23-community)

* [Contributing](https://www.google.com/search?q=%23-contributing)

* [Security](https://www.google.com/search?q=%23-security)

* [Licence](https://www.google.com/search?q=%23-licence)

## Introduction

ORRO is a Solana-based protocol for verifiable creative reputation. Creators build a "Live Lead" through time-stamped fragments—proving merit without faking portfolios or buying likes. Key features:

* **MTC/YTC Endorsements**: Signed messages for private/public trust shares.

* **Fragments**: Customizable, compressed provenance trails (IPFS/Arweave storage).

* **Reputation Scores**: TrustScore (user), ResonanceScore (project), PopularityScore (asset).

* **Gossip Box**: Moderated community chat with AI assistance.

## Installation

- Prerequisitest: Rust 1.75+, Anchor CLI v0.29+, Solana CLI v1.18+

```bash
Bash
# Clone repo (Rust + Anchor for Solana programs)

git clone https://github.com/orroprotocol/core.git
cd core

# Install dependencies

cargo install --locked anchor-cli

# Build programs

anchor build

# Test locally

anchor test
```

## Usage

Example: Create a fragment in Rust (Anchor program):

```rust
Rust
use anchor_lang::prelude::*;

#[program]
pub mod orro {
    use super::*;

    pub fn create_fragment(ctx: Context<CreateFragment>, hash: [u8; 32]) -> Result<()> {
        let fragment = &mut ctx.accounts.fragment;
        fragment.creator = *ctx.accounts.signer.key;
        fragment.timestamp = Clock::get()?.unix_timestamp;
        fragment.hash = hash;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateFragment<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 8 + 32)]
    pub fragment: Account<'info, Fragment>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Fragment {
    pub creator: Pubkey,
    pub timestamp: i64,
    pub hash: [u8; 32],
}
```

For full API, see [https://github.com/orroprotocol/core/blob/main/docs/api-reference/index.md](https://github.com/orroprotocol/core/blob/main/docs/api-reference/index.md)

## Architecture

```mermaid
graph TD
    %% Layers
    subgraph Frontend [Frontend Layer]
        UI[ORRO.art Web App]
        Wallet[Solana Wallet Adapter]
    end

    subgraph Logic [Application Logic]
        SDK[Solana Web3.js]
        Irys[Irys SDK Gateway]
    end

    subgraph Blockchain [Solana On-Chain]
        Program[ORRO Rust Program]
        Ledger[(Grit Ledger Account)]
        Tokens[(Token State Vault)]
    end

    subgraph Storage [Permanent Storage]
        Arweave[(Arweave / Irys)]
        Metadata[JSON Proofs]
    end

    %% Connections
    UI --> Wallet
    Wallet --> SDK
    SDK --> Program
    Program --> Ledger
    Program --> Tokens
    
    UI --> Irys
    Irys --> Storage
    Storage --> Metadata
    Metadata -.->|Immutable Link| Ledger
```

## Roadmap

```mermaid
graph LR
    %% Phase 1
    subgraph P1 [Phase 1: Alpha Genesis]
        A[Core Architecture] --> B[ICO Token Launch]
        B --> C{Buy-Back Shield}
    end

    %% Phase 2
    subgraph P2 [Phase 2: Product Build]
        C --> D[Grit Ledger 1-999]
        D --> E[Wallet Beta]
    end

    %% Phase 3
    subgraph P3 [Phase 3: The Pivot]
        E --> F[Equity $ORROS Swap]
        F --> G[Utility Injection]
    end
```

Pre-beta: Security audit in progress. To join the beta test apply for an invite code in the Telegram community here: [@orroprotocol]([https://discord.gg](https://t.me/orroprotocol)).

## Tokenomics

To keep ORRO fair, stable, and truly creator-owned, we use a simple utility token called ORROT — never designed for speculation, but as a tool for reputation and system stability.

- **Fair Start for Everyone** Total supply: 1 billion tokens. To prevent whales accumulation, every account is capped at ~\$100 worth (10,000 ORROT). This means the platform can only ever be fully owned by up to 100,000 real users — not a handful of investors.

- **The ORROC Community Fund** No "developer slush fund." Instead, a small 5% fee from system activity flows into the ORRO Community Contingency (ORROC) fund. This grows quietly and is used only for emergencies (e.g., network congestion compensation) or community initiatives — fully transparent and governed by reputation-weighted votes.

- **Pay-As-You-Go (No Subscriptions)** Using ORRO is extremely affordable. Most users preload ~\$10 in ORROT to cover everyday actions (saving fragments, voting, etc.). For typical creators, this lasts months — costing less than \$1.49 per month to keep your Live Creation Lead active.

- **Safety & Compliance** To meet global age-verification laws (e.g., under-16 restrictions in Australia and the UK) and enhance credibility, users can earn a Verified Badge by securely confirming age (email + optional phone). This keeps the community safe and makes your reputation even more valuable to partners.

## Community

Join our community today!

X: [https://twitter.com/orroprotocol](https://twitter.com/orroprotocol)

Telegram: [https://t.me/orroprotocol](https://t.me/orroprotocol)

## Contributing

We welcome PRs! See CONTRIBUTING.md for guidelines.

1. Fork the repo.
2. Create branch: `git checkout -b feature/your-feature.`
3. Commit: `git commit -m "feat: add X".`
4. Push & PR.

Issues/PRs for [OIPs](https://github.com/orroprotocol/core/tree/main/OIPs) (ORRO Improvement Proposals) especially encouraged.

Current research 22/01/2026: [OIP-003: ZK+ Privacy for Agreements & Vaults](https://github.com/orroprotocol/core/blob/main/OIPs/oip-003-zk%2B-privacy-for-agreements-%26-vaults.md)

## Security

* **Audits**: Pre-beta security audit in progress (OtterSec/Kudelski).
* **Breaches**: Report to [orroprotocol@proton.me](mailto:orroprotocol@proton.me?referrer=grok.com) — bounties up to 1000 ORROT for critical finds.

## License

MIT License — see LICENSE for details.


<p align="center">Built with 💜 by @darkerdarkofficial and the ORRO Community.</p>



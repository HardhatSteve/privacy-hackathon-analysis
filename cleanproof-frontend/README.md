<p align="center">
  <img src="https://img.shields.io/badge/Solana-Privacy%20Hack%202026-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana Privacy Hack 2026"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

<h1 align="center">CleanProof Frontend</h1>

<p align="center">
  <strong>Privacy-preserving transactions UI for Solana</strong><br/>
  Zero-knowledge proofs with Proof of Innocence
</p>

<p align="center">
  <a href="https://cleanproof.xyz">Live App</a> •
  <a href="https://github.com/Pavelevich/privacy-vault">Backend</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <a href="https://cleanproof.xyz">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-cleanproof.xyz-00D4AA?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

---

## Overview

CleanProof is the frontend interface for [Privacy Vault](https://github.com/Pavelevich/privacy-vault) - the first Privacy Pools implementation on Solana. Users can make private transactions while proving their funds aren't associated with illicit activity.

---

## Features

- **Zero-Knowledge Proofs** - Groth16 proof generation in browser (~300ms)
- **Proof of Innocence** - Prove funds are clean without revealing transaction history
- **Mobile Support** - WalletConnect integration for mobile wallets
- **Solana Wallet Adapter** - Support for Phantom, Solflare, and more

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **TailwindCSS** | Styling |
| **shadcn/ui** | UI Components |
| **Framer Motion** | Animations |
| **snarkjs** | ZK Proof Generation |
| **@solana/wallet-adapter** | Wallet Connection |
| **@coral-xyz/anchor** | Solana Program Interaction |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Pavelevich/cleanproof-frontend.git
cd cleanproof-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |

---

## Project Structure

```
src/
├── components/       # React components
│   ├── bridge/       # Deposit, Withdraw, Prove tabs
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/              # Utilities & ZK proof logic
├── pages/            # Page components
├── providers/        # Context providers
└── idl/              # Anchor IDL types
```

---

## Related Repositories

| Repository | Description |
|------------|-------------|
| [privacy-vault](https://github.com/Pavelevich/privacy-vault) | Backend - Solana programs, relayer, circuits |

---

## License

MIT

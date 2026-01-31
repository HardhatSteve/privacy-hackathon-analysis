# SolVoid SDK

The official TypeScript SDK for the SolVoid Privacy Protocol. Institutional-grade Zero-Knowledge privacy lifecycle management (PLM) for the Solana ecosystem.

## 🚀 Features in v1.1.3

- **Full-Spectrum Privacy**: Shielding (ingress), Anonymization, and Relayed Withdrawal (egress).
- **Poseidon-3 Cryptography**: Sponge-construction hash optimized for ZK efficiency and Solana runtime.
- **Privacy Ghost Score**: Real-time diagnostic engine for quantifying on-chain anonymity.
- **Atomic Rescue**: Rapid migration of leaked assets for compromised wallets.
- **Enterprise Integrity**: Built-in data enforcement layer for strict validation and security.

## 📦 Installation

```bash
npm install solvoid
```

## 🛠 Usage

### Initializing the Client

```typescript
import { SolVoidClient } from 'solvoid';
import { Connection, Keypair } from '@solana/web3.js';

const config = {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    programId: 'Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i',
    relayerUrl: 'https://relayer.solvoid.io'
};

const wallet = Keypair.generate(); // Or your wallet adapter
const client = new SolVoidClient(config, wallet);
```

### Shielding (Private Deposit)

```typescript
const amountLamports = 1000000000; // 1 SOL
const { commitmentData } = await client.shield(amountLamports);
console.log('Shielding successful. Secret:', commitmentData.secret);
```

### Privacy Audit (Ghost Score)

```typescript
const address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const passport = await client.getPassport(address);
console.log('Privacy Ghost Score:', passport.overallScore);
```

## 🔒 Security

This SDK is built with **Data Integrity Layer** enforcement. Every Public Key and Signature is validated at the boundary before logical processing to ensure the highest level of security for institutional users.

## 📄 License

MIT © SolVoid Contributors

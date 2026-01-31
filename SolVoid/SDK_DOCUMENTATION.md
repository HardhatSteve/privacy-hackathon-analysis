#  SolVoid SDK Documentation

The SolVoid SDK allows you to easily integrate privacy features into any Solana application.

##  Installation

```bash
npm install @solvoid/sdk
```

---

##  Initialization

```typescript
import { SolVoidClient } from '@solvoid/sdk';

const client = new SolVoidClient({
    rpcUrl: 'https://api.devnet.solana.com',
    programId: 'Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i',
    relayerUrl: 'https://relayer.solvoid.io' // Optional
}, walletAdapter);
```

---

##  API Reference

### `shield(amountLamports: number)`
Generates a commitment and prepares a deposit transaction.
- **Parameters:**
    - `amountLamports`: Amount in lamports (1 SOL = 1e9).
- **Returns:**
    - `commitmentData`: Object containing `secret`, `nullifier`, and `commitmentHex`.
- **Example:**
```typescript
const { commitmentData } = await client.shield(1000000000);
```

### `prepareWithdrawal(...)`
Generates a Groth16 proof for private withdrawal.
- **Parameters:**
    - `secretHex`: The string secret.
    - `nullifierHex`: The string nullifier.
    - `amount`: BigInt amount.
    - `recipient`: PublicKey object.
    - `allCommitments`: Array of all commitment hashes in the pool.
- **Returns:**
    - `proof`: The Groth16 proof object formatted for the program.
    - `nullifierHash`: The public nullifier hash.
    - `root`: The Merkle root used for the proof.

### `protect(address: PublicKey)`
Scans a public address for privacy leaks.
- **Parameters:**
    - `address`: The Solana address to scan.
- **Returns:**
    - `ScanResult`: Array of detected privacy vulnerabilities.

---

##  Error Handling

The SDK uses a custom `EventBus` for real-time status updates and error reporting.

```typescript
import { EventBus } from '@solvoid/sdk';

EventBus.on('ERROR', (err) => {
    console.error(`SolVoid Error: ${err.message}`);
});
```

---

##  Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `rpcUrl` | string | Full URL of the Solana RPC provider. |
| `programId` | string | The deployed SolVoid program address. |
| `relayerUrl` | string? | (Optional) URL for the SolVoid relaying service. |
| `commitment` | string | (Optional) 'processed', 'confirmed', or 'finalized'. |

---

##  Security Best Practices

1. **Local Proving:** Always generate proofs locally. Never send your `secret` or `nullifier` to a server or relayer.
2. **Commitment Storage:** Securely store your secrets (e.g., in `localStorage` or a hardware-encrypted vault) until withdrawal is complete.
3. **Entropy:** The SDK uses `crypto.getRandomValues()` for secret generation. Ensure your environment supports this.

#  SolVoid Examples

This document provides various usage patterns and integration examples for the SolVoid protocol.

## 🟢 Basic Usage (Terminal)

### Shielding and Withdrawing
1. **Deposit 1 SOL:**
   ```bash
   solvoid shield 1.0
   # Saved: SECRET=0xabc..., NULLIFIER=0x123...
   ```
2. **Withdraw to New Wallet:**
   ```bash
   solvoid withdraw 1.0 <NEW_ADDRESS> --secret 0xabc... --nullifier 0x123...
   ```

---

##  Advanced Integration (SDK)

Integrating SolVoid into your own dApp using the TypeScript SDK.

### Initializing the Client
```typescript
import { SolVoidClient } from '@solvoid/sdk';
import { useWallet } from '@solana/wallet-adapter-react';

const wallet = useWallet();
const client = new SolVoidClient({
    rpcUrl: 'https://api.devnet.solana.com',
    programId: 'Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i'
}, wallet);
```

### Programmatic Shielding
```typescript
const amount = 1_000_000_000; // 1 SOL in Lamports
const { commitmentData, status } = await client.shield(amount);

console.log('Save these for withdrawal:', 
    commitmentData.secret, 
     commitmentData.nullifier
);
```

---

## 🟠 Relayer Integration

Using a relayer allows you to withdraw funds without needing any SOL in the destination wallet for transaction fees.

### Configuration
In your `solvoid` config or `.env`:
```json
{
  "relayerUrl": "https://relayer.solvoid.network",
  "fee": 5000000 
}
```

### Withdrawal via Relayer
```bash
solvoid withdraw 1.0 <RECIPIENT> --relayer --fee 0.005
```

---

##  Complex Workflows (The "Rescue" Pattern)

The "Rescue" pattern is used when a wallet's privacy has been compromised (e.g., linked to an ENS name) and you want to migrate assets to a private state.

1. **Scan for leaks:**
   ```bash
   solvoid rescue <LEAKY_WALLET>
   ```
   *Output: 5 privacy leaks detected in tokens X, Y, Z.*

2. **Batch Shielding:**
   The SDK identifies multiple assets and prepares a batch of shielding transactions.

3. **Incremental Withdrawal:**
   Withdraw funds over several days to different addresses to break timing analysis.

---

##  Integration with Anchor Tests
Example of how to test SolVoid in your own Anchor project.

```typescript
it("performs a private transaction", async () => {
    // 1. Initialize
    await client.init();

    // 2. Shield
    const shieldResult = await client.shield(1e9);
    
    // 3. Mock Merkle Tree state
    const allCommitments = [shieldResult.commitmentData.commitmentHex];
    
    // 4. Withdraw
    const withdrawResult = await client.prepareWithdrawal(
        shieldResult.commitmentData.secret,
        shieldResult.commitmentData.nullifier,
        BigInt(1e9),
        recipient.publicKey,
        allCommitments,
        "./circuits/withdraw.wasm",
        "./circuits/withdraw.zkey"
    );

    // 5. Submit
    const tx = await client.submitWithdrawal(withdrawResult);
    expect(tx).to.be.ok;
});
```

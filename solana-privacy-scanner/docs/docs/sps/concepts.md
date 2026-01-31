# Core Concepts

## Heuristics

Rule-based analysis that detects privacy risk patterns. These are not guarantees of deanonymization - they are risk indicators that highlight potential privacy leaks.

**Example:** If a wallet never pays its own transaction fees and always uses the same external fee payer, this creates a strong on-chain link between wallets that could be used for clustering.

## Risk Levels

- **HIGH**: 2+ HIGH signals, or 1 HIGH + 2 MEDIUM
- **MEDIUM**: 1 HIGH, or 2+ MEDIUM, or 1 MEDIUM + 2 LOW
- **LOW**: Few or no significant signals

## What Gets Detected

The scanner uses 13 Solana-native heuristics:

1. **Fee Payer Reuse** - Same wallet pays fees for multiple accounts (CRITICAL)
2. **Signer Overlap** - Repeated signer combinations across transactions (HIGH)
3. **Memo Exposure** - PII or identifying info in transaction memos (HIGH/MEDIUM/LOW)
4. **Known Entity Interaction** - CEX, bridge, or protocol interactions (VARIES)
5. **Identity Metadata Exposure** - .sol domain and NFT metadata linkage (HIGH/MEDIUM)
6. **ATA Linkage** - One wallet funding token accounts for multiple owners (HIGH/MEDIUM)
7. **Address Reuse** - Limited wallet diversity and lack of rotation (MEDIUM/LOW)
8. **Counterparty Reuse** - Repeated interactions with same addresses (VARIES)
9. **Instruction Fingerprinting** - Unique program call patterns (MEDIUM)
10. **Token Account Lifecycle** - Account creation/closure and rent refund patterns (MEDIUM)
11. **Priority Fee Fingerprinting** - Consistent priority fee amounts (MEDIUM/LOW)
12. **Staking Delegation** - Concentrated validator delegation patterns (MEDIUM/LOW)
13. **Timing Patterns** - Transaction bursts, regular intervals, timezone patterns (MEDIUM)

## Limitations

:::warning[What This Tool Cannot Do]
- **Cannot prove identity** - Only indicates risk
- **Cannot see off-chain data** - Only uses public blockchain data
- **Cannot decrypt** - No access to private keys or encrypted data
:::

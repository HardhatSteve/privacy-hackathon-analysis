---
name: scan-wallet
description: This skill should be used when the user asks to "scan wallet", "analyze wallet", "check wallet privacy", wants on-chain privacy analysis of a Solana wallet address, or needs to understand privacy risks from blockchain transaction history.
version: 1.0.0
---

# Scan Wallet - On-Chain Privacy Analysis

Analyze on-chain Solana wallet privacy using blockchain data.

## Description

This skill analyzes a wallet's on-chain transaction history to detect privacy risks and potential deanonymization vectors. It uses the Solana blockchain's public data to identify patterns like fee payer reuse, known entity interactions, timing patterns, and other behavioral fingerprints.

## Usage

```
/scan-wallet <address> [options]
```

### Arguments

- `address` - Solana wallet address to analyze

### Options

- `--max-signatures <number>` - Maximum transaction signatures to fetch (default: 100)
- `--rpc <url>` - Custom RPC endpoint URL
- `--json` - Output raw JSON results

## Examples

### Analyze a wallet
```
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
```

### Analyze recent transactions only
```
/scan-wallet ADDRESS --max-signatures 50
```

### Use custom RPC endpoint
```
/scan-wallet ADDRESS --rpc https://your-quicknode-endpoint.com
```

### Get JSON output
```
/scan-wallet ADDRESS --json
```

## What It Detects

### Fee Payer Reuse (HIGH)
Detects when external wallets consistently pay transaction fees for this wallet.

**Why it matters:** Creates strong on-chain links between wallets. If the fee payer is identified, all transactions they funded can be linked.

### Signer Overlap (HIGH)
Identifies repeated signer combinations across transactions.

**Why it matters:** Reveals wallet relationships and multi-sig setups that can be used to cluster transactions.

### Known Entity Interaction (VARIES)
Flags interactions with known exchanges, bridges, and protocols.

**Why it matters:**
- **Exchange deposits** (HIGH) - KYC'd identity linked to wallet
- **Bridge usage** (MEDIUM) - Cross-chain correlation possible
- **Protocol usage** (LOW) - Behavioral fingerprinting

### Counterparty Reuse (VARIES)
Tracks repeated interactions with the same addresses.

**Why it matters:** Repeated counterparties can reveal business relationships or personal connections.

### Timing Patterns (MEDIUM)
Detects transaction bursts, regular intervals, and timezone patterns.

**Why it matters:** Timing patterns can identify automated systems or link activity to specific time zones.

### Amount Reuse (LOW)
Flags repeated transaction amounts.

**Why it matters:** On Solana, less critical than Bitcoin/Ethereum due to account model, but still creates fingerprints.

### Token Account Lifecycle (MEDIUM)
Traces token account creation/closure patterns and rent refunds.

**Why it matters:** Rent refunds from closed accounts link wallets together.

### Instruction Fingerprinting (MEDIUM)
Detects unique program interaction patterns.

**Why it matters:** Unique combinations of program calls can fingerprint users.

### Memo Exposure (HIGH/MEDIUM/LOW)
Scans transaction memos for PII or identifying information.

**Why it matters:** Memos are permanently public and can contain identifying data.

### Address Reuse (MEDIUM/LOW)
Analyzes address diversity and long-term usage patterns.

**Why it matters:** Lack of address rotation makes tracking easier.

### Balance Traceability (MEDIUM)
Tracks fund flow patterns through the wallet.

**Why it matters:** Matching transfer pairs and sequential movements can link transactions.

## Output

The skill provides:

1. **Summary**: Overall risk level and statistics
2. **Risk Breakdown**: HIGH/MEDIUM/LOW signals with evidence
3. **Known Entities**: Detected exchanges, bridges, protocols
4. **Mitigations**: Actionable privacy improvements
5. **Transaction Stats**: Count of transactions analyzed

## Example Output

```markdown
# Privacy Scan Results

Target: **DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy**
Type: **wallet**
Overall Risk: **HIGH**

## Statistics
- Transactions analyzed: 87
- Total signals: 8
- 🔴 HIGH risk: 3
- 🟡 MEDIUM risk: 4
- 🔵 LOW risk: 1

## Known Entity Interactions
- Binance Hot Wallet (exchange)
- Jupiter Aggregator (protocol)

## Privacy Signals

### 🔴 HIGH - Fee Payer Never Self

This wallet never pays its own transaction fees. External fee payer detected.

Evidence:
- Transaction: 5wJqZ...
- Transaction: 2wNCN...
- ... and 85 more

💡 Pay your own transaction fees to avoid linking accounts

### 🔴 HIGH - Known Entity Interaction (Exchange)

Direct interaction with known exchange detected.

Evidence:
- Address: Binance Hot Wallet (exchange)

💡 Avoid direct exchange deposits from privacy-sensitive wallets

## Mitigations

- Pay your own transaction fees to avoid linking wallets
- Avoid direct CEX deposits/withdrawals from privacy-sensitive wallets
- Use intermediary addresses when interacting with exchanges
- Rotate addresses regularly
- Avoid predictable timing patterns
```

## Integration

This skill uses the `solana-privacy-scanner-core` library to:
1. Fetch on-chain transaction data via RPC
2. Normalize data into a scan context
3. Run 13 privacy heuristics
4. Generate a comprehensive privacy report

The analysis is:
- **Deterministic**: Same wallet always produces same results
- **Read-only**: Never modifies blockchain state
- **Privacy-preserving**: Uses public RPC, no tracking
- **Comprehensive**: 13 different heuristic checks

## RPC Configuration

By default, uses a QuickNode public RPC endpoint. For production use:

1. Get your own [QuickNode endpoint](https://www.quicknode.com/)
2. Use `--rpc` flag or set `SOLANA_RPC` environment variable

## Next Steps

After scanning:
- Use `/explain-risk <risk-id>` to understand specific signals
- Use `/scan-code` to analyze source code before deployment
- Review mitigations and implement privacy improvements

## Limitations

On-chain analysis can only see:
- ✅ Public transaction data
- ✅ On-chain patterns and relationships
- ✅ Known entity interactions

It cannot:
- ❌ See off-chain communications
- ❌ Decrypt encrypted data
- ❌ Prove identity (only indicates risk)
- ❌ Access private keys or wallets

For comprehensive privacy, combine with:
- Static code analysis (`/scan-code`)
- Off-chain privacy practices
- Proper operational security

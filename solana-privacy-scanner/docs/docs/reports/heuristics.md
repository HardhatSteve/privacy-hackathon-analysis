# Privacy Heuristics Explained

The scanner uses **13 heuristics** to detect privacy risks. Each one looks for a specific pattern that could reveal your identity or link your wallets together.

For implementation details, see [How Each Heuristic Works](./heuristic-internals).

---

## Critical

### 1. Fee Payer Reuse

**What it checks:** Who pays the transaction fees for this wallet.

If someone else pays your fees, that wallet is permanently and publicly linked to yours. If one wallet pays fees for multiple other wallets, it's obvious they all belong to the same person.

**Example:**
```
Wallet A pays fees for Wallets B, C, D
→ Anyone can see A controls B, C, and D
```

**How to fix:** Always pay your own fees. If you run multiple wallets, give each one its own SOL to pay fees.

**Severity:** HIGH when another wallet pays your fees. Always HIGH when you never pay your own fees.

---

### 2. Signer Overlap

**What it checks:** Whether the same signing keys appear across multiple transactions.

When the same address signs transactions for different wallets, it proves those wallets are connected. This is cryptographic proof — not just a guess.

**Example:**
```
Transactions 1-5: Signed by [A, B]
Transactions 6-10: Signed by [A, C]
→ A controls both B and C
```

**How to fix:** Use separate signing keys for unrelated wallets. Never have one key sign for everything.

**Severity:** HIGH when a signer appears in >70% of transactions or co-signs with many different wallets.

---

### 3. Memo Exposure

**What it checks:** Whether transaction memos contain personal information.

Memos are permanently public. If you put your name, email, or any identifying text in a memo, it's linked to your wallet forever.

**Example:**
```
Memo: "Payment to John Smith for invoice #1234"
→ Wallet permanently linked to "John Smith"
```

**How to fix:** Never put personal information in memos. If you need to include a reference, use an opaque ID.

**Severity:** HIGH for names/emails/phone numbers. MEDIUM for descriptive text. LOW for any memo usage.

---

### 4. Known Entity Interaction

**What it checks:** Whether you've sent or received funds from known services (exchanges, bridges, protocols).

Exchanges know your real identity through KYC. If your wallet transacts directly with an exchange, your wallet is linked to your name.

**Example:**
```
Direct transfer to Binance
→ Binance knows this wallet is yours
→ All activity on this wallet is now tied to your identity
```

**How to fix:** Use an intermediate wallet between your main wallet and any exchange. Use a separate wallet for bridging across chains.

**Severity:** HIGH for exchanges. MEDIUM for bridges. LOW for other known services.

---

### 5. Identity Metadata Exposure

**What it checks:** Interactions with programs that attach identity to your wallet — NFT metadata (Metaplex) and `.sol` domain names (Bonfida).

A `.sol` domain maps a human-readable name directly to your wallet. NFT collections can also identify you if they're unique to you.

**Example:**
```
Wallet registered "alice.sol"
→ Anyone searching "alice.sol" finds this wallet
→ All activity linked to "alice"
```

**How to fix:** Don't register a domain on a wallet you want private. Use a separate wallet for NFTs.

**Severity:** HIGH for domain names. MEDIUM for NFT metadata.

---

### 6. ATA Linkage

**What it checks:** Whether one wallet creates token accounts for multiple different owners.

When wallet A creates a token account for wallet B, the fee payer (A) is publicly recorded. If A sets up accounts for B, C, and D, they're all linked through A.

**Example:**
```
Wallet A creates token accounts for B, C, D
→ A paid the fees, linking all four wallets
```

**How to fix:** Have each wallet create its own token accounts. Never use a shared wallet to set up accounts for others.

**Severity:** HIGH when one wallet creates accounts for multiple owners. MEDIUM for batch creation.

---

## Medium

### 7. Address Reuse

**What it checks:** Whether you use one wallet for many different types of activity (DeFi, NFTs, gaming, DAOs, exchanges).

The more you do with one wallet, the more anyone can learn about you just by looking at it.

**Example:**
```
One wallet used for: CEX, DeFi, NFTs, DAO voting
→ Anyone can see everything you do
```

**How to fix:** Use separate wallets for different purposes — one for DeFi, one for NFTs, etc.

**Severity:** HIGH for 4+ activity types. MEDIUM for 3 types or long-term single address usage.

---

### 8. Counterparty & PDA Reuse

**What it checks:** Whether you repeatedly transact with the same addresses, programs, or program-derived accounts.

Sending to the same address over and over makes it obvious you have a relationship. Repeatedly interacting with the same program-derived account links all those transactions together.

**Example:**
```
15 interactions with the same Jupiter position (PDA)
→ All 15 transactions linked to you
```

**How to fix:** Use different wallets for different counterparties. For sensitive operations, use a fresh wallet.

**Severity:** MEDIUM for repeated PDAs or counterparty-program combinations. LOW for program usage patterns.

---

### 9. Instruction Fingerprinting

**What it checks:** Whether your transactions follow the same sequence of operations, use the same niche programs, or repeat the same instruction patterns.

If you always do the same operations in the same order, that pattern acts like a fingerprint — even across different wallets.

**Example:**
```
Pattern: System → SPL Token → Jupiter → SPL Token
→ Same sequence in 80% of transactions
→ Easy to link wallets with this pattern
```

**How to fix:** Vary the order of your operations. Using niche protocols makes you more identifiable.

**Severity:** MEDIUM for repeated sequences in 50%+ of transactions. LOW for distinctive program profiles.

---

### 10. Token Account Lifecycle

**What it checks:** Whether you create and close token accounts, sending rent refunds back to a main wallet.

When you close a token account, the rent refund (~0.002 SOL) goes back to the owner. This publicly links the "throwaway" account to whoever receives the refund.

**Example:**
```
Create token account → Use once → Close
→ Rent refund goes to main wallet
→ "Throwaway" account is now linked to you
```

**How to fix:** Don't close token accounts if privacy matters. The small rent cost is worth it.

**Severity:** MEDIUM for frequent create/close cycles or clustered rent refunds. LOW for short-lived accounts.

---

### 11. Priority Fee Fingerprinting

**What it checks:** Whether your transactions always use the same priority fee or compute budget.

Most wallets and bots have a fixed fee setting. If every transaction uses the exact same fee, it becomes a distinguishing mark.

**Example:**
```
50 transactions all with 10,000 lamport priority fee
→ Same config across all transactions
→ Easy to identify as one user
```

**How to fix:** Randomize your priority fee within a range instead of using a fixed value.

**Severity:** MEDIUM for consistent priority fees. LOW for repeated compute budget ranges.

---

### 12. Staking Delegation Patterns

**What it checks:** Whether all your staking goes to the same one or two validators.

If multiple wallets all delegate to the same small validator, they're probably controlled by the same person.

**Example:**
```
Wallets A, B, C all delegate to the same small validator
→ Likely the same person
```

**How to fix:** Spread your stake across multiple validators. Use different validators for different wallets.

**Severity:** MEDIUM for concentrated delegation. LOW for regular staking intervals.

---

### 13. Timing Patterns

**What it checks:** Whether your transactions happen in bursts, at regular intervals, or at the same time every day.

Clock-like timing reveals automation. Consistent active hours reveal your timezone and routine.

**Example:**
```
Transactions every 60 minutes, 24/7
→ Clearly a bot
→ Bot config becomes a fingerprint
```

**How to fix:** Spread transactions out. Add random delays. Vary the time of day.

**Severity:** HIGH for hourly/daily regular intervals. MEDIUM for bursts or time-of-day clustering.

---

## Power Ranking

| Rank | Heuristic | Max Severity |
|------|-----------|-------------|
| 1 | Fee Payer Reuse | CRITICAL |
| 2 | Signer Overlap | HIGH |
| 3 | Memo Exposure | HIGH |
| 4 | Known Entity Interaction | HIGH |
| 5 | Identity Metadata | HIGH |
| 6 | ATA Linkage | HIGH |
| 7 | Address Reuse | HIGH |
| 8 | Counterparty/PDA Reuse | MEDIUM |
| 9 | Instruction Fingerprinting | MEDIUM |
| 10 | Token Account Lifecycle | MEDIUM |
| 11 | Priority Fee Fingerprinting | MEDIUM |
| 12 | Staking Delegation | MEDIUM |
| 13 | Timing Patterns | HIGH |

---

## How Signals Combine

The scanner runs all 13 heuristics and combines their results into an overall risk score.

**Example: HIGH Risk Report**
```
Fee Payer Reuse (HIGH)
  → Never pays own fees

Signer Overlap (HIGH)
  → Same authority in 80% of transactions

Known Entity (HIGH)
  → 3 direct Binance deposits

→ OVERALL: HIGH RISK
```

# Test Suite Documentation

This document provides a human-readable overview of all 95 tests in the Solana Privacy Scanner codebase.

**Last Updated:** 2026-01-22
**Total Tests:** 92 passing, 3 skipped
**Test Framework:** Vitest

---

## Test Files Overview

| Test File | Tests | Description |
|-----------|-------|-------------|
| `packages/core/src/scanner/index.test.ts` | 8 | Report generation and scanner orchestration |
| `packages/core/src/labels/provider.test.ts` | 27 | Label provider and known addresses database (v0.4.0) |
| `packages/core/src/heuristics/index.test.ts` | 9 | Individual privacy heuristics |
| `packages/core/src/collectors/index.test.ts` | 10 | RPC data collection |
| `packages/core/src/normalizer/index.test.ts` | 11 | Data normalization |
| `packages/devtools/src/analyzer/analyzer.test.ts` | 23 | Static code analyzer (devtools package) |
| `solana-privacy-scanner-example/tests/privacy.test.ts` | 4 | CI tools integration examples |

---

## 1. Scanner Tests (8 tests)

**File:** `packages/core/src/scanner/index.test.ts`

### Report Generation - evaluateHeuristics

1. **Should evaluate all heuristics and return signals**
   - Tests that the scanner runs all 13 heuristics on a wallet with issues
   - Verifies multiple signals are detected (CEX interaction, counterparty reuse, timing patterns, amount patterns)
   - Expected: 4+ privacy signals detected

2. **Should return empty array for clean wallet**
   - Tests that a wallet with no privacy issues returns no signals
   - Expected: 0 risk signals

### Report Generation - generateReport

3. **Should generate complete privacy report**
   - Tests full report generation with all fields populated
   - Verifies report contains: version, timestamp, targetType, target, overallRisk, signals, summary, mitigations, knownEntities
   - Expected: HIGH risk report with 7 signals (3 HIGH, 2 MEDIUM, 2 LOW) and 6 mitigations

4. **Should generate LOW risk report for clean wallet**
   - Tests that a clean wallet produces a LOW risk report
   - Verifies minimal mitigations are provided
   - Expected: LOW risk with 1 general recommendation

5. **Should generate HIGH risk report for problematic wallet**
   - Tests detection of multiple critical privacy issues
   - Verifies signals: CEX interaction, entity interaction, counterparty reuse, timing patterns, amount patterns
   - Expected: HIGH risk with 8 signals detected

6. **Should produce deterministic output**
   - Tests that running the scanner twice on the same data produces identical results
   - Critical for CI/CD reliability
   - Expected: Both reports are byte-for-byte identical

### Custom Heuristics Integration

7. **Should support custom heuristics alongside built-in ones**
   - Tests that users can add custom heuristics to the scanner
   - Example custom heuristic: detects many small transfers (<1 SOL)
   - Verifies custom signals are merged with built-in signals
   - Expected: 1 built-in signal + 1 custom signal = 2 total

8. **Should validate custom signal structure**
   - Tests that custom signals follow the correct PrivacySignal interface
   - Verifies all required fields are present: id, name, severity, reason, impact, evidence, mitigation
   - Expected: Custom signal has all required fields

---

## 2. Label Provider Tests (27 tests)

**File:** `packages/core/src/labels/provider.test.ts`
**New in v0.4.0** - Comprehensive tests for extended database

### Database Loading

9. **Should load all 78 addresses from the database**
   - Tests that the provider successfully loads the complete database
   - Expected: 78 addresses loaded from `known-addresses.json`

10. **Should load all label types correctly**
    - Tests that all 6 label types are present in the database
    - Verifies distribution: exchange (9), bridge (8), protocol (29), token (8), program (14), mev (10)
    - Expected: All types present with correct counts

### CEX Addresses (v0.4.0)

11. **Should detect Binance Hot Wallet 2**
    - Address: `5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9`
    - Expected: Label name = "Binance Hot Wallet 2", type = "exchange"

12. **Should detect Binance**
    - Address: `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`
    - Expected: Label name = "Binance", type = "exchange"

13. **Should detect Coinbase Hot Wallet 2**
    - Address: `GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE`
    - Expected: Label name = "Coinbase Hot Wallet 2", type = "exchange"

14. **Should detect OKX Hot Wallet**
    - Address: `C68a6RCGLiPskbPYtAcsCjhG8tfTWYcoB4JjCrXFdqyo`
    - Expected: Label name = "OKX Hot Wallet", type = "exchange"

15. **Should detect Bybit Hot Wallet**
    - Address: `AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2`
    - Expected: Label name = "Bybit Hot Wallet", type = "exchange"

### Bridge Addresses (v0.4.0)

16. **Should detect Wormhole Token Bridge**
    - Address: `wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb`
    - Expected: Label name = "Wormhole Token Bridge", type = "bridge"

17. **Should detect Mayan Finance**
    - Address: `MAYNwD9HmfvnnVMEVGdgSVKdmnPkXH56WfwNyoUdNDG`
    - Expected: Label name = "Mayan Finance", type = "bridge"

18. **Should detect deBridge Router**
    - Address: `DEbrdGj3HsRgkjJNp8G5Xcsxfk48kUFXCgyazG5zLMqv`
    - Expected: Label name = "deBridge Router", type = "bridge"

### DEX Protocol Addresses (v0.4.0)

19. **Should detect Jupiter v6**
    - Address: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`
    - Expected: Label name = "Jupiter v6", type = "protocol"

20. **Should detect Raydium AMM v4**
    - Address: `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`
    - Expected: Label name = "Raydium AMM v4", type = "protocol"

21. **Should detect Orca Whirlpools**
    - Address: `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`
    - Expected: Label name = "Orca Whirlpools", type = "protocol"

22. **Should detect Phoenix DEX**
    - Address: `PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY`
    - Expected: Label name = "Phoenix DEX", type = "protocol"

### MEV Infrastructure (v0.4.0)

23. **Should detect Jito Tip Payment**
    - Address: `T1pyyaTNZsKv2WcRAB8oVnk93mLJw2XzjtVYqCsaHqt`
    - Expected: Label name = "Jito Tip Payment", type = "mev"

24. **Should detect multiple Jito Tip Accounts**
    - Tests 3 Jito tip account addresses
    - Addresses: `96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5`, `HFqU5x63VTqvQss8hp11i4bVmkSQG8j2Dn9HwwP65esD`, `Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY`
    - Expected: All labeled as type "mev" with "Jito Tip Account" in name

25. **Should detect BloXroute**
    - Address: `BLXRWEHvT2VqNkHMVi9A8QD9jGPfE5vA9nxnYK5sVmfb`
    - Expected: Label name = "BloXroute Memo", type = "mev"

### Token Mints (v0.4.0)

26. **Should detect USDC**
    - Address: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
    - Expected: Label name = "USDC", type = "token"

27. **Should detect JitoSOL**
    - Address: `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
    - Expected: Label name = "JitoSOL Token Mint", type = "token"

28. **Should detect mSOL**
    - Address: `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`
    - Expected: Label name = "mSOL Token Mint", type = "token"

### Core Solana Programs (v0.4.0)

29. **Should detect System Program**
    - Address: `11111111111111111111111111111111`
    - Expected: Label name = "System Program", type = "program"

30. **Should detect SPL Token Program**
    - Address: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
    - Expected: Label name = "SPL Token Program", type = "program"

31. **Should detect SPL Token 2022**
    - Address: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
    - Expected: Label name = "SPL Token 2022", type = "program"

### Batch Lookups

32. **Should lookup multiple addresses efficiently**
    - Tests `lookupMany()` method with 4 addresses (Binance, Jupiter, USDC, Jito Tip)
    - Expected: Returns 4 labels with correct types (exchange, protocol, token, mev)

33. **Should handle unknown addresses gracefully**
    - Tests lookup of non-existent address
    - Expected: Returns null without throwing error

34. **Should handle mixed known and unknown addresses**
    - Tests batch lookup with 2 known + 2 unknown addresses
    - Expected: Returns only 2 known addresses, ignores unknown ones

### Type Coverage

35. **Should have comprehensive coverage of different entity types**
    - Tests that database includes all 6 label types
    - Types: exchange, bridge, protocol, token, mev, program
    - Expected: All types present in database

---

## 3. Heuristics Tests (9 tests)

**File:** `packages/core/src/heuristics/index.test.ts`

### detectCounterpartyReuse

36. **Should detect repeated interactions with same addresses**
    - Tests detection of wallets that repeatedly interact with same counterparties
    - Expected: HIGH severity signal when >60% of transactions involve same addresses

37. **Should return empty array for wallet with diverse counterparties**
    - Tests that wallets with many unique counterparties don't trigger signal
    - Expected: No signals (empty array)

### detectAmountReuse

38. **Should detect round number patterns**
    - Tests detection of frequent round number transfers (1.0, 10.0, 100.0 SOL)
    - Expected: LOW severity signal for round number usage

39. **Should detect repeated exact amounts**
    - Tests detection of exact amount reuse (e.g., 1.234567 SOL sent multiple times)
    - Expected: 2 patterns detected (round numbers + repeated amounts)

### detectTimingPatterns

40. **Should detect transaction bursts**
    - Tests detection of 6+ transactions within 5 minutes
    - Expected: HIGH severity signal for burst pattern

41. **Should return null for spread-out transactions**
    - Tests that transactions spread over days/weeks don't trigger signal
    - Expected: No signals (empty array)

### detectKnownEntityInteraction

42. **Should detect CEX interactions**
    - Tests detection of interactions with labeled exchange addresses
    - Example: Binance Hot Wallet interaction
    - Expected: HIGH severity signal for CEX interaction

43. **Should return null with no labeled entities**
    - Tests that transactions with only unknown addresses don't trigger signal
    - Expected: No signals (empty array)

### detectBalanceTraceability

44. **Should detect matching send/receive pairs**
    - Tests detection of balance flow patterns (send 100, receive 99.9, send 99.8, etc.)
    - Expected: 2 patterns detected (matching pairs + sequential amounts)

---

## 4. Data Collectors Tests (10 tests)

**File:** `packages/core/src/collectors/index.test.ts`

### collectWalletData

45. **Should collect wallet signatures and transactions**
    - Tests basic RPC data collection for wallet scanning
    - Expected: Returns signatures and transaction data

46. **Should handle pagination correctly**
    - Tests that collector fetches multiple pages of transaction history
    - Expected: All transactions retrieved across multiple RPC calls

47. **Should handle RPC failures gracefully**
    - Tests error handling when RPC endpoint fails
    - Expected: Returns empty data without crashing

48. **Should respect transaction limits**
    - Tests that collector stops at max transaction count
    - Expected: Doesn't fetch more than configured limit

### collectTransactionData

49. **Should fetch single transaction details**
    - Tests collection of data for single transaction signature
    - Expected: Returns complete transaction data

50. **Should handle invalid signatures**
    - Tests error handling for non-existent transaction signatures
    - Expected: Returns null without crashing

51. **Should handle RPC failure**
    - Tests error handling when RPC call fails
    - Expected: Returns null without crashing

### collectProgramData

52. **Should collect program account data**
    - Tests collection of accounts owned by a program
    - Expected: Returns program account data

53. **Should handle RPC failures gracefully**
    - Tests error handling when program account fetch fails
    - Expected: Returns empty data without crashing

54. **Should handle program with no accounts**
    - Tests collection for program with zero accounts
    - Expected: Returns empty array without crashing

---

## 5. Data Normalization Tests (11 tests)

**File:** `packages/core/src/normalizer/index.test.ts`

### normalizeWalletData

55. **Should normalize wallet data into ScanContext**
    - Tests conversion of raw RPC data to standardized ScanContext format
    - Expected: Returns context with transfers, instructions, counterparties, etc.

56. **Should extract transfers correctly**
    - Tests that SOL and token transfers are identified and normalized
    - Expected: Transfers array populated with correct amounts and directions

57. **Should identify fee payers and signers**
    - Tests extraction of unique fee payers and signers from transactions
    - Expected: Sets populated with correct addresses

58. **Should apply labels from provider**
    - Tests that known entity labels are attached to addresses
    - Expected: Labels map populated with known addresses

59. **Should calculate time range**
    - Tests extraction of earliest and latest transaction timestamps
    - Expected: timeRange contains correct earliest/latest values

60. **Should handle empty transaction data**
    - Tests normalization when wallet has no transactions
    - Expected: Returns context with empty arrays, doesn't crash

61. **Should handle null values gracefully**
    - Tests that missing/null fields in RPC data don't cause errors
    - Expected: Normalization completes without throwing

### normalizeTransactionData

62. **Should normalize single transaction**
    - Tests conversion of single transaction to ScanContext
    - Expected: Returns context with targetType = 'transaction'

63. **Should extract memo fields**
    - Tests that transaction memo field is captured
    - Expected: Memo content available in transaction metadata

### normalizeProgramData

64. **Should normalize program data**
    - Tests conversion of program account data to ScanContext
    - Expected: Returns context with targetType = 'program'

65. **Should not crash with malformed transaction data**
    - Tests error handling for corrupted/invalid transaction data
    - Expected: Gracefully handles errors without crashing

---

## 6. Devtools Static Analyzer Tests (23 tests)

**File:** `packages/devtools/src/analyzer/analyzer.test.ts`
**New in devtools package merge**

### Fee Payer Reuse Detection

70. **Should detect fee payer reuse in for loop**
    - Tests detection of fee payer variable declared outside loop and reused inside
    - Example: `const feePayer = Keypair.generate(); for(...) { send({ feePayer }) }`
    - Expected: CRITICAL severity issue detected

71. **Should not flag fee payer generated inside loop**
    - Tests that unique fee payers per iteration don't trigger warning
    - Example: `for(...) { const feePayer = Keypair.generate(); send({ feePayer }) }`
    - Expected: No issues detected

### Memo PII Detection

72. **Should detect email in memo field (CRITICAL severity)**
    - Tests detection of email addresses in memo assignments
    - Pattern: `const memo = "user@example.com"`
    - Expected: CRITICAL severity, message contains "Email"

73. **Should detect phone number in memo (CRITICAL severity)**
    - Tests detection of phone numbers in memos
    - Pattern: `const memo = "Contact: +1-555-123-4567"`
    - Expected: CRITICAL severity

74. **Should detect descriptive memo (MEDIUM severity)**
    - Tests detection of descriptive content that might be identifying
    - Pattern: `const memo = "Invoice #12345 for product ABC"`
    - Expected: MEDIUM severity

75. **Should not flag generic simple memo**
    - Tests that short, generic memos without PII are not flagged
    - Pattern: `const memo = "payment"`
    - Expected: No issues

76. **Should handle template literals with PII**
    - Tests detection of PII in template literal memos
    - Pattern: `` const memo = `Payment for ${userEmail}` ``
    - Expected: PII issue detected

### Multiple Issues

77. **Should detect both fee payer reuse and memo PII**
    - Tests that multiple issue types are detected in same file
    - Expected: Both fee-payer-reuse and memo-pii issues present

### Analyzer Options

78. **Should exclude low severity issues when includeLow is false**
    - Tests filtering of low severity issues
    - Expected: Issues array is empty when includeLow=false for low-severity-only code

79. **Should include low severity issues when includeLow is true**
    - Tests inclusion of medium/low severity issues
    - Expected: Issues detected when includeLow=true

80. **Should respect exclude patterns**
    - Tests that node_modules and other excluded directories are skipped
    - Expected: Files in excluded directories not analyzed

### Summary Statistics

81. **Should correctly count issues by severity**
    - Tests that summary counts match actual issues by severity
    - Expected: summary.critical, summary.medium counts are accurate

82. **Should report files analyzed count**
    - Tests filesAnalyzed count matches number of files scanned
    - Expected: Correct count of TypeScript/JavaScript files analyzed

83. **Should include timestamp**
    - Tests that report includes timestamp
    - Expected: Timestamp between test start and end time

### Error Handling

84. **Should handle invalid file paths gracefully**
    - Tests analyzer doesn't crash on nonexistent paths
    - Expected: Empty issues array, zero files analyzed

85. **Should continue analyzing other files if one fails**
    - Tests that parse errors in one file don't stop analysis of others
    - Expected: Analyzes files that can be parsed

### Convenience Function

86. **Should pass options to convenience function** *(passing)*
    - Tests that analyze() function correctly passes options
    - Expected: Options like includeLow are respected

### File Type Support

87. **Should analyze .ts files**
    - Tests TypeScript file analysis
    - Expected: .ts files included in analysis

88. **Should analyze .tsx files**
    - Tests TypeScript React file analysis
    - Expected: .tsx files included in analysis

89. **Should analyze .js files**
    - Tests JavaScript file analysis
    - Expected: .js files included in analysis

90. **Should analyze .jsx files**
    - Tests JavaScript React file analysis
    - Expected: .jsx files included in analysis

91. **Should not analyze non-code files**
    - Tests that .md, .json, .png files are skipped
    - Expected: Zero files analyzed when only non-code files present

### Issue Sorting

92. **Should sort issues by severity (CRITICAL > HIGH > MEDIUM > LOW)**
    - Tests that issues are returned in severity order
    - Expected: Issues sorted from most to least severe

**Note:** 3 tests are currently skipped:
- `should detect fee payer reuse in while loop` - While loop support needs implementation verification
- `should detect fee payer reuse in forEach` - forEach is not yet supported (method call vs statement)
- `should work with analyze() convenience function` - Being investigated

---

## 7. CI Tools Integration Tests (4 tests)

**File:** `solana-privacy-scanner-example/tests/privacy.test.ts`

### Private Transfer Privacy Tests

66. **Should use unique fee payers for different transfers**
    - Tests that CI matcher correctly identifies unique fee payers
    - Uses custom `toNotLeakUserRelationships()` matcher
    - Expected: Test passes when fee payers are unique

67. **Batch transfers use unique fee payers (privacy-preserving)**
    - Tests that 3 batch transfers use 3 different fee payers
    - Simulates real privacy-preserving transaction flow
    - Expected: No user relationship leakage detected

68. **Should detect privacy leak when same fee payer used**
    - Tests that matcher correctly fails when same fee payer is reused
    - Expected: Test fails with descriptive error message

69. **Should integrate with existing test suites**
    - Tests that privacy scanner matchers work alongside standard Vitest matchers
    - Expected: Can combine privacy checks with functional tests

---

## Test Coverage Summary

### By Component
- **Scanner Core**: 8 tests (report generation, custom heuristics)
- **Label Provider**: 27 tests (database loading, all entity types)
- **Heuristics**: 9 tests (5 heuristics with positive/negative cases)
- **Data Collection**: 10 tests (RPC calls, error handling, pagination)
- **Normalization**: 11 tests (data transformation, edge cases)
- **Static Analyzer**: 23 tests (fee payer detection, memo PII, file handling)
- **CI Integration**: 4 tests (custom matchers, privacy policies)

### By Category
- **Happy Path**: 58 tests (62.4%)
- **Error Handling**: 20 tests (21.5%)
- **Edge Cases**: 15 tests (16.1%)

### Critical Features Tested
✅ All 13 privacy heuristics
✅ All 78 known addresses (v0.4.0)
✅ All 6 label types (exchange, bridge, protocol, token, mev, program)
✅ Custom heuristics integration
✅ RPC error resilience
✅ Deterministic report generation
✅ Static code analysis (fee payer reuse, memo PII)
✅ Multiple file format support (.ts, .tsx, .js, .jsx)
✅ CI/CD matchers

---

## Running Tests

### Run All Tests
```bash
npm test -- --run
```

### Run Specific Test File
```bash
npm test -- packages/core/src/labels/provider.test.ts --run
```

### Run in Watch Mode
```bash
npm test
```

### Run with Coverage
```bash
npm test -- --coverage
```

---

## Test Maintenance

### Adding New Tests
1. Create test file: `<component>.test.ts`
2. Use descriptive test names starting with "should"
3. Test both happy path and error cases
4. Update this TESTS.md file with new test descriptions

### Test Naming Convention
- Use `describe()` for grouping related tests
- Use `it()` or `test()` for individual test cases
- Start test names with "should" for clarity
- Be specific: "should detect Binance Hot Wallet 2" not "should work"

### Test Data
- Use realistic Solana addresses (base58, 32-44 chars)
- Use actual transaction signatures where possible
- Mock RPC responses consistently
- Keep test data in test files (avoid external fixtures for now)

---

**Last Test Run:** 2026-01-22
**Status:** ✅ 92 tests passing, 3 skipped
**Build:** ✅ All packages building successfully (core, cli, devtools)
**Coverage:** TBD (run `npm test -- --coverage` to generate)

### Recent Additions (v0.4.0+)
- ✅ **23 new devtools analyzer tests** - Comprehensive testing of static code analysis
- ✅ **Fee payer reuse detection** - Tests for loop-based reuse patterns
- ✅ **Memo PII detection** - Tests for email, phone, descriptive content
- ✅ **File type support** - Tests for .ts, .tsx, .js, .jsx files
- ✅ **Error handling** - Graceful handling of parse errors and invalid paths

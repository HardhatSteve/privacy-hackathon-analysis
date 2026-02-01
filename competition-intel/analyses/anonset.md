# Technical Analysis: Anonset

**Repository:** https://github.com/anonset/anonset
**Commit:** `aab076237b59675b117011698e4c9923362ac8a6`
**Type:** Privacy Analysis Tool (Python CLI)
**Status:** Complete Implementation

---

## Executive Summary

Anonset is a **privacy analysis tool**, not a privacy protocol. It is a single-file Python CLI utility (290 lines) that scans Solana blockchain transactions for a given address and calculates "anonymity sets" by grouping transactions with identical SOL balance changes. The tool provides no cryptographic privacy guarantees itself—it analyzes existing on-chain data to measure the anonymity set size of mixing/privacy pools.

**Critical Finding:** This is NOT a privacy-preserving system. It's a privacy measurement tool that demonstrates the anonymity set concept through blockchain forensics. Zero Solana program code, no smart contracts, no ZK circuits, no cryptographic primitives.

---

## Architecture

- **Single Entry Point:** `/main.py:254-289` - `main()` function with CLI argument parser
- **Single Class:** `AnonSet` (lines 9-252) - handles RPC queries, parsing, display
- **Total Source Code:** 1 Python file, 290 lines

## Solana Integration

- **None.** Zero Solana programs deployed.
- **RPC Only:** Uses `solana.rpc.api.Client` for `get_signatures_for_address()` and `get_transaction()`
- **Read-only:** Only queries historical transaction data

## Privacy Implementation

- **ZK System:** None
- **Privacy Guarantees:** Zero - All data is public on-chain
- **Purpose:** Measures anonymity set sizes of existing privacy pools (e.g., PrivacyCash)

## Dependencies

- `solana-py` - Solana Python RPC client
- `solders` - Rust-based Solana types
- **Missing:** No `requirements.txt` or dependency pinning

## Completeness: 85%

- ✅ Core functionality works
- ✅ CLI interface
- ❌ No dependency declarations
- ❌ No tests

## Security Red Flags

- **None critical** - Read-only tool, no private key handling
- RPC provider sees queries (privacy leak to provider)

## Verdict

Well-executed analysis tool, but **not a privacy protocol**. Measures existing privacy rather than providing it. Best categorized as "privacy tooling/forensics" rather than "privacy solution."

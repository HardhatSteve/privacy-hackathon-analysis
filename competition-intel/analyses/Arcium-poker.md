# Arcium Poker (Crypto Bluff) - Technical Analysis

**Repository:** https://github.com/dharmanan/Arcium-poker
**Commit:** c8b9f3f642c96141db05cd75dada048d0027aa64
**Program ID:** `3JPRmpPsWuCAb6KiudBaPG2o5t7duJ55gobsEgK1WDZa` (devnet)
**Privacy Tech:** Arcium MPC v0.6.3

---

## Executive Summary

Arcium Poker is a **privacy-first poker implementation on Solana using Arcium MPC**. The project demonstrates Multi-Party Computation integration with Anchor for confidential deck shuffling and card encryption. However, it's an MVP with placeholder circuits for critical features.

**Key Findings**:
- ✅ Functional shuffle + card encryption via X25519 + RescueCipher
- ⚠️ Hand evaluation circuit is **placeholder** (always returns 1)
- ⚠️ Entry fee proof circuit is **placeholder** (always returns 1)
- ⚠️ Includes devnet fallback mode that bypasses MPC entirely
- ❌ No automated tests, single-player encryption model

---

## Architecture

**Entry Points:**
1. `/programs/crypto-bluff/src/lib.rs` - Main Anchor program (15 instructions)
2. `/encrypted-ixs/src/lib.rs` - 3 MPC circuits (shuffle, evaluate, prove_entry_fee)
3. `/frontend/App.tsx` - React UI with wallet integration
4. `/scripts/bot-worker.ts` - Automated bot testing

**Core Flow:**
```
CreateGame → JoinGame → StartGame → QueueShuffle (MPC) → Callback → Betting → QueueEvaluate (MPC) → Callback
```

---

## Privacy Implementation: Arcium MPC

**Technology**: Arcium Cerberus backend (threshold MPC)
- Cluster offset: 456 (devnet)
- Recovery set: 4 nodes

**What Works:**
- ✅ `shuffle_and_deal_cards_v3` - Shuffles 52-card deck in MPC
- ✅ Returns 8 encrypted cards: 1 dealer (MXE), 2 hole + 5 community (X25519)
- ✅ Frontend decrypts with `RescueCipher` using ECDH shared secret

**What's Placeholder:**
- ❌ `prove_entry_fee` - Always returns 1
- ❌ `evaluate_hand_v2` - Always returns 1, no poker hand ranking
- ❌ Pot distributed equally (not by hand strength)

**Critical Gap**: Only encrypts to 1 client's key, not true multi-player privacy.

---

## Solana Integration

**PDAs:**
- Game: `[b"game", host, game_id_le_bytes]`
- PlayerState: `[b"player_state", game, player]`

**MPC CPIs:**
- Uses `queue_computation()` from `arcium-anchor`
- 7 Arcium-specific accounts required per MPC operation

**Game Logic:**
- Max 4 players, small blind 50, big blind 100
- State machine: WaitingForPlayers → Dealing → PreFlop → Flop → Turn → River → Showdown → Finished

---

## Dependencies

- `anchor-lang = "0.32.1"`
- `arcium-client = "0.6.3"`, `arcium-macros = "0.6.3"`, `arcium-anchor = "0.6.3"`
- `@arcium-hq/client = "0.6.3"` (TypeScript)

---

## Security Red Flags

**CRITICAL:**
1. Placeholder circuits - Core privacy features unimplemented
2. Devnet bypass instructions - Host can skip MPC with `devnet_bypass_shuffle_and_deal`
3. Single-player encryption model

**MEDIUM:**
4. Unchecked host privilege - `reset_hand` callable mid-game
5. MPC centralization - Depends on Arcium's devnet cluster

---

## Verdict

**Innovation: HIGH** - First poker using Arcium MPC
**Execution: MODERATE** - Solid MVP, but privacy promises exceed implementation
**Production Readiness: LOW** - Needs completed circuits, tests, multi-player encryption

Strong foundation if completed properly. Impressive demonstration of bleeding-edge MPC tech.

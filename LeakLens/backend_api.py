#!/usr/bin/env python3
"""
FastAPI backend for LeakLens - Surveillance Exposure Tool
Provides REST API endpoints for wallet analysis and privacy exposure detection

Built for encrypt.trade hackathon | Track 1: Educate users about mass financial surveillance
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Set, List, Any, Tuple
import sys
import pandas as pd
import os
import traceback
import asyncio
import json
import re
import requests
from datetime import datetime, timezone
import time
from dotenv import load_dotenv

# Load environment variables before any API key usage
load_dotenv()

# Helper function to safely get values from dicts
def safe_get(obj, key, default=None):
    """Safely get a value from an object, handling both dict and non-dict types."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default

# Import LeakLens analysis functions
from leaklens_solana import (
    analyze_wallet_execution_profiles,
    analyze_execution_profile,
    fetch_transaction,
    fetch_signatures,
    fetch_transactions_parallel,
    analyze_wallet as analyze_wallet_solana,
    detect_sleep_window as detect_sleep_window_solana,
    calculate_probabilities as calculate_probabilities_solana,
    analyze_reaction_speed as analyze_reaction_speed_solana,
    analyze_opsec_failures,
    analyze_opsec_failures_from_enhanced,
)

# Solana-only for encrypt.trade hackathon
EVM_SUPPORTED = False

app = FastAPI(title="LeakLens API", version="2.0.0", description="See what your wallet leaks - Surveillance exposure analysis")

# Common Solana mints (mainnet)
USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
WSOL_MINT = "So11111111111111111111111111111111111111112"

STABLE_MINTS = {USDC_MINT, USDT_MINT}
STABLE_SYMBOLS = {"USDC", "USDT", "USDH", "PYUSD", "USDS", "DAI"}
KNOWN_MEME_SYMBOLS = {"BONK", "WIF", "POPCAT", "MEW", "BOME", "MYRO", "SLERF", "WEN", "GIGA"}

# Known exchange and DEX addresses (Solana mainnet)
KNOWN_EXCHANGES = {
    # Centralized exchanges (KYC required)
    "4wjPQJ6PrkC4rHuvYbRqLQrXgct6K6GQ3k6e7vJ5J5J5",  # Binance (example - add real addresses)
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",  # Coinbase (example)
    # Add more known exchange addresses
}

KNOWN_DEX_PROGRAMS = {
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  # Raydium AMM
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",  # Orca
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",  # Jupiter
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  # Orca Whirlpool
    "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",  # Raydium CLMM
}

KNOWN_DEFI_PROTOCOLS = {
    "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",  # Solend
    "4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY",  # Marinade
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",  # Jupiter
}

# Memecoin heuristics (can be tuned via env)
MEME_TOKEN_MAX_AGE_DAYS = int(os.getenv("MEME_TOKEN_MAX_AGE_DAYS", "90"))
MIN_LIQUIDITY_USD = float(os.getenv("MIN_LIQUIDITY_USD", "10000"))
DEAD_TOKEN_DAYS = int(os.getenv("DEAD_TOKEN_DAYS", "30"))


def helius_get_transactions(wallet: str, limit: int = 200) -> Tuple[List[dict], dict]:
    """
    Fetch Enhanced Transactions from Helius (parsed).
    Docs: GET https://api.helius.xyz/v0/addresses/{address}/transactions?api-key=...
    """
    helius_key = os.getenv("HELIUS_API_KEY")
    if not helius_key:
        return [], {"error": "missing_helius_key"}
    try:
        url = f"https://api.helius.xyz/v0/addresses/{wallet}/transactions"
        params = {"api-key": helius_key, "limit": int(min(limit, 100))}
        resp = requests.get(url, params=params, timeout=20, headers={"Accept": "application/json"})
        if resp.status_code != 200:
            return [], {"error": f"helius_tx_status_{resp.status_code}", "body": resp.text[:200]}
        data = resp.json()
        if isinstance(data, list):
            return data, {"status": "ok", "count": len(data)}
        return [], {"error": "helius_tx_unexpected_shape"}
    except Exception as e:
        return [], {"error": f"helius_tx_exception_{str(e)[:120]}"}


def _build_df_and_lists_from_helius_enhanced(enhanced_txs: List[dict]) -> Tuple[pd.DataFrame, List[dict], Dict[str, dict], List[dict]]:
    """
    Build df, tx_details_list, tx_details_map, signatures from Helius Enhanced Transactions.
    Used on Vercel to avoid 100x getTransaction RPC rate limits; one Helius API call gives stable count.
    Enhanced tx have signature, timestamp, fee, slot, type; we use compute_units=0, instructions=0.
    """
    transactions = []
    tx_details_list = []
    signatures = []
    tx_details_map: Dict[str, dict] = {}  # empty; opsec/mempool/notable get minimal results

    for tx in enhanced_txs or []:
        if not isinstance(tx, dict):
            continue
        sig = tx.get("signature") or tx.get("transactionSignature") or ""
        ts = tx.get("timestamp") or tx.get("blockTime") or tx.get("block_time") or 0
        if not sig or not ts:
            continue
        fee = _safe_float(tx.get("fee"), 0.0)
        slot = int(tx.get("slot") or 0)
        utc_time = datetime.fromtimestamp(ts, tz=timezone.utc)
        transactions.append({
            "signature": sig,
            "timestamp": utc_time,
            "hour": utc_time.hour,
            "day_of_week": utc_time.weekday(),
            "day_name": utc_time.strftime("%A"),
            "compute_units": 0,
            "fee_lamports": fee,
            "fee_sol": fee / 1e9,
            "instructions": 0,
            "success": True,
            "slot": slot,
            "block_time": ts,
        })
        tx_details_list.append({"timestamp": ts, "details": tx})
        signatures.append({"signature": sig, "blockTime": ts})

    df = pd.DataFrame(transactions)
    return df, tx_details_list, tx_details_map, signatures


# ═══════════════════════════════════════════════════════════════════════════════
# Price fetching helpers (Jupiter primary, Helius fallback)
# ═══════════════════════════════════════════════════════════════════════════════


def jupiter_price_now(addresses: List[str]) -> Dict[str, float]:
    """
    Fetch current prices from Jupiter (more reliable for Solana tokens).
    Jupiter price API: https://price.jup.ag/v4/price?ids=...
    Uses smaller chunks, retries with exponential backoff, validates mints.
    """
    if not addresses:
        return {}
    # Filter invalid/truncated mints (Solana mainnet addresses are 32-44 chars)
    valid = [a for a in addresses if a and len(str(a).strip()) >= 32]
    if not valid:
        return {}
    out: Dict[str, float] = {}
    chunk = 20
    for i in range(0, len(valid), chunk):
        batch = valid[i : i + chunk]
        last_err = None
        for attempt in range(3):
            try:
                ids = ",".join(batch)
                resp = requests.get(
                    "https://price.jup.ag/v4/price",
                    params={"ids": ids},
                    headers={"Accept": "application/json", "User-Agent": "LeakLens/1.0"},
                    timeout=15,
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    for mint, rec in data.items():
                        if isinstance(rec, dict):
                            price = rec.get("price")
                            if price is not None:
                                out[mint] = _safe_float(price, 0.0)
                    last_err = None
                    break
                elif resp.status_code == 429:
                    last_err = "rate limited"
                    if attempt < 2:
                        time.sleep(1.0 * (attempt + 1))
                        continue
            except requests.exceptions.Timeout:
                last_err = "timeout"
                if attempt < 2:
                    time.sleep(0.5 * (2**attempt))
                    continue
            except Exception as e:
                last_err = str(e)[:80]
                if attempt < 2:
                    time.sleep(0.5 * (2**attempt))
                    continue
        if last_err:
            print(f"[Jupiter] Batch failed after 3 attempts ({last_err})")
    # Fallback: individual requests; use CoinGecko for SOL
    if not out and valid:
        for mint in valid[:20]:
            if mint == WSOL_MINT:
                sol = _coingecko_sol_price()
                if sol > 0:
                    out[WSOL_MINT] = sol
                continue
            try:
                resp = requests.get(
                    "https://price.jup.ag/v4/price",
                    params={"ids": mint},
                    headers={"Accept": "application/json", "User-Agent": "LeakLens/1.0"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    if mint in data and isinstance(data[mint], dict):
                        p = data[mint].get("price")
                        if p is not None:
                            out[mint] = _safe_float(p, 0.0)
            except Exception:
                pass
    return out


def helius_token_prices(wallet: str, mints: List[str]) -> Dict[str, float]:
    """
    Fetch token prices from Helius balances endpoint.
    Helius includes USD values in token balance data.
    """
    if not mints:
        return {}
    helius_key = os.getenv("HELIUS_API_KEY")
    if not helius_key:
        return {}
    
    out: Dict[str, float] = {}
    try:
        resp = requests.get(
            f"https://api.helius.xyz/v0/addresses/{wallet}/balances?api-key={helius_key}",
            timeout=12,
            headers={"Accept": "application/json"}
        )
        if resp.status_code == 200:
            data = resp.json()
            tokens = data.get("tokens", [])
            print(f"[Helius] Found {len(tokens)} tokens in balances response")
            
            # Check if there's a top-level nativeBalance with USD value
            native_balance = data.get("nativeBalance", {})
            if isinstance(native_balance, dict):
                sol_usd = _safe_float(native_balance.get("usdValue") or native_balance.get("value"), 0.0)
                if sol_usd > 0 and WSOL_MINT in mints:
                    sol_amount = _safe_float(native_balance.get("uiAmount") or native_balance.get("amount"), 0.0)
                    if sol_amount > 0:
                        out[WSOL_MINT] = sol_usd / sol_amount
                        print(f"[Helius] Got SOL price from nativeBalance: ${out[WSOL_MINT]:.2f}")
            
            # Check tokens - Helius balances API doesn't include USD values per token
            # But we can log the structure for debugging
            for token in tokens:
                if not isinstance(token, dict):
                    continue
                mint = token.get("mint", "")
                if mint in mints:
                    # Helius balances API doesn't provide USD values in token objects
                    # We'll need to use a different endpoint or price source
                    pass
            
            if not out:
                print(f"[Helius] Balances API doesn't include USD values per token. Sample token keys: {list(tokens[0].keys()) if tokens else 'no tokens'}")
                print(f"[Helius] Full response structure: {list(data.keys())}")
        else:
            print(f"[Helius] Balances API returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[Helius] Exception fetching token prices: {str(e)[:150]}")
    return out




def _coingecko_sol_price() -> float:
    """Fetch current SOL price from CoinGecko. Returns 0 on failure."""
    try:
        resp = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": "solana", "vs_currencies": "usd"},
            timeout=10,
        )
        if resp.status_code == 200:
            return _safe_float(
                (resp.json() or {}).get("solana", {}).get("usd", 0.0), 0.0
            )
    except Exception:
        pass
    return 0.0


def fetch_token_prices(addresses: List[str], wallet: str = None) -> Dict[str, float]:
    """
    Fetch current prices for a list of mints.
    SOL-only: use CoinGecko first to avoid Jupiter rate limits.
    Else: Jupiter, then Helius fallback if wallet provided.
    """
    if not addresses:
        return {}
    
    # SOL-only: use CoinGecko first (avoids Jupiter errors for common case)
    if addresses == [WSOL_MINT]:
        sol = _coingecko_sol_price()
        if sol > 0:
            return {WSOL_MINT: sol}
    
    # Try Jupiter (more reliable for other Solana tokens)
    prices = jupiter_price_now(addresses)
    
    # Check what we got
    missing = [m for m in addresses if m not in prices or prices.get(m, 0) <= 0]
    
    # If still missing and we have wallet context, try Helius balances
    if missing and wallet:
        print(f"[Price] Trying Helius balances for {len(missing)} missing tokens")
        helius_prices = helius_token_prices(wallet, missing)
        for mint, price in helius_prices.items():
            if mint not in prices or prices.get(mint, 0) <= 0:
                prices[mint] = price
    
    return prices




# Cache current SOL price to avoid repeated calls
_cached_sol_price = None
_cached_sol_price_time = 0


def coingecko_sol_price_at(unixtime: int) -> float:
    """Fetch SOL historical price from Coingecko."""
    try:
        # Coingecko historical price endpoint
        date_str = datetime.fromtimestamp(unixtime, tz=timezone.utc).strftime("%d-%m-%Y")
        resp = requests.get(
            "https://api.coingecko.com/api/v3/coins/solana/history",
            params={"date": date_str},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            # Coingecko returns market_data.current_price.usd for historical
            price = data.get("market_data", {}).get("current_price", {}).get("usd", 0.0)
            if price and price > 0:
                return float(price)
    except Exception as e:
        print(f"[Coingecko] Exception fetching SOL historical price: {str(e)[:100]}")
    return 0.0


def historical_price_at(mint: str, unixtime: int) -> float:
    """
    Historical price at or near timestamp (seconds); falls back to current price.
    For SOL, uses Coingecko. For other tokens, returns 0 (no historical data available).
    """
    global _cached_sol_price, _cached_sol_price_time
    if not mint:
        return 0.0
    # If timestamp is missing/invalid, use current price
    if not unixtime or unixtime <= 0:
        current = fetch_token_prices([mint])
        return current.get(mint, 0.0)
    
    # Only SOL has historical price data (via Coingecko)
    if mint == WSOL_MINT:
        # Try Coingecko for SOL historical price
        sol_price = coingecko_sol_price_at(unixtime)
        if sol_price > 0:
            return sol_price
        # Fallback to current price
        import time as time_module
        now = time_module.time()
        if _cached_sol_price is None or (now - _cached_sol_price_time) > 300:  # 5 min cache
            current = fetch_token_prices([WSOL_MINT])
            _cached_sol_price = current.get(WSOL_MINT, 0.0)
            # If still no price, try Coingecko
            if not _cached_sol_price:
                try:
                    resp = requests.get("https://api.coingecko.com/api/v3/simple/price",
                                       params={"ids": "solana", "vs_currencies": "usd"},
                                       timeout=10)
                    if resp.status_code == 200:
                        data = resp.json()
                        _cached_sol_price = _safe_float(data.get("solana", {}).get("usd", 0.0), 0.0)
                except Exception:
                    pass
            _cached_sol_price_time = now
        return _cached_sol_price if _cached_sol_price else 0.0
    
    # For other tokens, no historical data available - return 0
    return 0.0


def _raw_amount_to_ui(raw: dict) -> float:
    try:
        amt = _safe_float(raw.get("tokenAmount"), 0.0)
        dec = int(raw.get("decimals") or 0)
        return amt / (10 ** dec) if dec >= 0 else amt
    except Exception:
        return 0.0


def compute_token_trading_pnl_fifo(swaps: List[dict]) -> dict:
    """
    Compute realized PnL per token from detected swap deltas using FIFO cost basis,
    denominated in the base asset (SOL or USDC/USDT). Historical USD via Coingecko (SOL only).
    Key fix: FIFO lots are keyed by (mint, base) to avoid corruption when same token
    is traded in different bases (e.g., bought in USDC, sold in SOL).
    """
    # Inventory lots: (mint, base) -> list[(qty, cost_per_unit_in_base)]
    lots: Dict[Tuple[str, str], List[Tuple[float, float]]] = {}
    realized: Dict[Tuple[str, str], float] = {}  # (mint, base) -> pnl (base units)
    realized_usd: Dict[Tuple[str, str], float] = {}
    stats: Dict[Tuple[str, str], dict] = {}
    debug = {"swaps_parsed": 0, "swaps_skipped": 0, "historical_prices_available": False}

    for ev in swaps or []:
        token_in = ev.get("token_in")
        token_out = ev.get("token_out")
        amt_in = _safe_float(ev.get("amount_in"), 0.0)
        amt_out = _safe_float(ev.get("amount_out"), 0.0)
        ts = ev.get("timestamp")

        if not token_in or not token_out or amt_in <= 0 or amt_out <= 0:
            debug["swaps_skipped"] += 1
            continue

        # Determine base: prefer stable over SOL (only use SOL as fallback)
        base = None
        if token_in in STABLE_MINTS:
            # Prefer stable on input side
            base = "STABLE"
            traded_mint = token_out
            qty = amt_out
            cost_total = amt_in
            proceeds_total = 0.0
        elif token_out in STABLE_MINTS:
            # Prefer stable on output side
            base = "STABLE"
            traded_mint = token_in
            qty = amt_in
            cost_total = 0.0
            proceeds_total = amt_out
        elif token_in == WSOL_MINT:
            # SOL as base (fallback when no stable present)
            base = "SOL"
            traded_mint = token_out
            qty = amt_out
            cost_total = amt_in
            proceeds_total = 0.0
        elif token_out == WSOL_MINT:
            # SOL as base (fallback when no stable present)
            base = "SOL"
            traded_mint = token_in
            qty = amt_in
            cost_total = 0.0
            proceeds_total = amt_out
        else:
            debug["swaps_skipped"] += 1
            continue

        debug["swaps_parsed"] += 1
        key = (traded_mint, base)
        st = stats.setdefault(key, {"trades": 0, "spent": 0.0, "received": 0.0})
        st["trades"] += 1

        if cost_total > 0 and proceeds_total == 0:
            # BUY: add FIFO lot (keyed by mint+base)
            cost_per_unit = cost_total / qty
            lots.setdefault(key, []).append((qty, cost_per_unit))
            st["spent"] += cost_total
        elif proceeds_total > 0 and cost_total == 0:
            # SELL: consume FIFO lots to compute cost basis (from same mint+base key)
            remaining = qty
            cost_basis_total = 0.0
            inv = lots.get(key, [])
            while remaining > 0 and inv:
                lot_qty, lot_cpu = inv[0]
                take = min(remaining, lot_qty)
                cost_basis_total += take * lot_cpu
                lot_qty -= take
                remaining -= take
                if lot_qty <= 1e-12:
                    inv.pop(0)
                else:
                    inv[0] = (lot_qty, lot_cpu)
            lots[key] = inv
            if remaining > 1e-9:
                continue
            pnl = proceeds_total - cost_basis_total
            realized[key] = realized.get(key, 0.0) + pnl
            st["received"] += proceeds_total
            if base == "STABLE":
                usd_price = 1.0  # Stable tokens are already in USD
            else:
                usd_price = historical_price_at(WSOL_MINT, ts)
                if usd_price > 0:
                    debug["historical_prices_available"] = True
            realized_usd[key] = realized_usd.get(key, 0.0) + pnl * usd_price

    # Build output rows
    rows = []
    for (mint, base), pnl in realized.items():
        rows.append({
            "mint": mint,
            "base": base,
            "realized_pnl": pnl,
            "realized_pnl_usd": realized_usd.get((mint, base), 0.0),
            **stats.get((mint, base), {})
        })

    rows_sorted = sorted(rows, key=lambda r: r["realized_pnl"])
    rows_sorted_usd = sorted(rows, key=lambda r: r.get("realized_pnl_usd", 0))
    total_usd = round(sum(r.get("realized_pnl_usd", 0.0) for r in rows), 2)
    return {
        "window": {"transactions_used": len(swaps or [])},
        "totals": {
            "distinct_pairs": len(rows),
            "realized_pnl_sol": round(sum(r["realized_pnl"] for r in rows if r["base"] == "SOL"), 6),
            "realized_pnl_stable": round(sum(r["realized_pnl"] for r in rows if r["base"] == "STABLE"), 6),
            "realized_pnl_usd": total_usd,
            "usd_available": debug.get("historical_prices_available", False) or total_usd != 0.0,
        },
        "by_token": rows,
        "top_losses": rows_sorted_usd[:10],
        "top_wins": list(reversed(rows_sorted_usd[-10:])),
        "debug": debug,
        "note": "USD PnL uses historical prices when available, otherwise estimated using current prices. Approximate realized PnL (FIFO cost basis; does not account for partial fills or embedded DEX fees)."
    }


def compute_income_sources_from_enhanced(wallet: str, enhanced_txs: List[dict]) -> dict:
    """
    Income sources from parsed transfers (no guesswork about identity).
    Returns factual aggregates:
    - native SOL received (system/native transfers)
    - stable token received (USDC/USDT)
    - other token received (count + unique mints), excluding swaps
    """
    income = {
        "sol_received": {"count": 0, "total_sol": 0.0},
        "stable_received": {"count": 0, "total_stable": 0.0},
        "tokens_received": {"count": 0, "unique_mints": set()}
    }

    for tx in enhanced_txs or []:
        # Skip swaps; those are trading flow, not "income"
        # Check both tx type and events to catch all swap variations
        if tx.get("type") == "SWAP" or (tx.get("events") or {}).get("swap"):
            continue

        # Native transfers
        for nt in tx.get("nativeTransfers") or []:
            if not isinstance(nt, dict):
                continue
            if nt.get("toUserAccount") == wallet:
                amt = _safe_float(nt.get("amount"), 0.0) / 1e9
                if amt > 0:
                    income["sol_received"]["count"] += 1
                    income["sol_received"]["total_sol"] += amt

        # Token transfers
        for tt in tx.get("tokenTransfers") or []:
            if not isinstance(tt, dict):
                continue
            if tt.get("toUserAccount") != wallet:
                continue
            mint = tt.get("mint") or ""
            amt = _safe_float(tt.get("tokenAmount"), 0.0)
            sym = (tt.get("tokenSymbol") or "").upper()
            if mint in STABLE_MINTS or sym in STABLE_SYMBOLS:
                # treat stable tokens as "stable unit"
                if amt > 0:
                    income["stable_received"]["count"] += 1
                    income["stable_received"]["total_stable"] += amt
            else:
                if amt > 0 and mint:
                    income["tokens_received"]["count"] += 1
                    income["tokens_received"]["unique_mints"].add(mint)

    income["sol_received"]["total_sol"] = round(income["sol_received"]["total_sol"], 6)
    income["stable_received"]["total_stable"] = round(income["stable_received"]["total_stable"], 6)
    income["tokens_received"]["unique_mints"] = len(income["tokens_received"]["unique_mints"])
    return income

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serve static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/")
    def serve_frontend():
        """Serve the main frontend page"""
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "LeakLens API - See what your wallet leaks", "version": "2.0.0", "hackathon": "encrypt.trade", "docs": "/docs"}
else:
    @app.get("/")
    def root():
        """Root endpoint - returns API info"""
        return {"message": "LeakLens API - See what your wallet leaks", "version": "2.0.0", "hackathon": "encrypt.trade", "docs": "/docs"}


class MempoolForensicsRequest(BaseModel):
    wallet: str
    limit: Optional[int] = 100


class WalletAnalysisRequest(BaseModel):
    wallet: str
    limit: Optional[int] = 200
    chain: Optional[str] = "solana"  # Solana only for encrypt.trade hackathon


class TransactionAnalysisRequest(BaseModel):
    signature: str


class OpsecAnalysisRequest(BaseModel):
    wallet: str
    limit: Optional[int] = 120


@app.post("/mempool-forensics")
def mempool_forensics(request: MempoolForensicsRequest):
    """
    Analyze wallet's execution profiles across transactions.
    Returns execution profile classification (RETAIL, URGENT_USER, PRO_TRADER, MEV_STYLE).
    """
    try:
        result = analyze_wallet_execution_profiles(request.wallet, request.limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze-transaction")
def analyze_transaction(request: TransactionAnalysisRequest):
    """
    Analyze a single transaction for execution profile.
    """
    try:
        tx_details = fetch_transaction(request.signature)
        if not tx_details:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        result = analyze_execution_profile(tx_details)
        result["signature"] = request.signature
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/opsec-failures")
def opsec_failures(request: OpsecAnalysisRequest):
    """
    Identify operational security leaks for a wallet (Solana).

    Signals:
    - Reused funding sources
    - Reused withdrawal targets
    - Memo usage breadcrumbs
    """
    try:
        result = analyze_opsec_failures(request.wallet, limit=request.limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Opsec analysis failed: {str(e)}")


@app.get("/portfolio/{wallet}")
def get_jupiter_portfolio(wallet: str):
    """
    Proxy endpoint to fetch Jupiter portfolio data (bypasses CORS).
    """
    try:
        url = f"https://portfolio.jup.ag/v1/portfolio/{wallet}"
        headers = {
            "Accept": "application/json",
            "User-Agent": "LeakLens/1.0 (+https://encrypt.trade)"
        }
        response = requests.get(url, timeout=12, headers=headers)
        
        # If Jupiter API returns 404 or other errors, return empty portfolio instead of failing
        if response.status_code == 404:
            return {"tokens": [], "totalValue": 0}
        
        response.raise_for_status()
        try:
            return response.json()
        except ValueError:
            # Non-JSON body; return empty
            return {"tokens": [], "totalValue": 0}
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Portfolio fetch timeout")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Unable to connect to portfolio service")
    except requests.exceptions.HTTPError as e:
        # Return empty portfolio for client errors (4xx), fail for server errors (5xx)
        if e.response.status_code < 500:
            return {"tokens": [], "totalValue": 0}
        raise HTTPException(status_code=502, detail=f"Portfolio service error: {str(e)}")
    except Exception as e:
        # Log the error for debugging
        print(f"[ERROR] Portfolio fetch failed for {wallet}: {str(e)}")
        traceback.print_exc()
        # Return empty portfolio instead of failing completely
        return {"tokens": [], "totalValue": 0}


def _safe_float(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


def _extract_wallet_sol_delta(tx: dict, wallet: str) -> float:
    """Approximate SOL delta for the wallet from pre/post balances (excludes fee if fee payer)."""
    try:
        meta = tx.get("meta") or {}
        msg = (tx.get("transaction") or {}).get("message") or {}
        keys = msg.get("accountKeys") or []
        accounts = []
        for k in keys:
            if isinstance(k, dict):
                accounts.append(k.get("pubkey", ""))
            else:
                accounts.append(str(k))
        if wallet not in accounts:
            return 0.0
        idx = accounts.index(wallet)
        pre = (meta.get("preBalances") or [])
        post = (meta.get("postBalances") or [])
        if idx >= len(pre) or idx >= len(post):
            return 0.0
        lamport_delta = (post[idx] or 0) - (pre[idx] or 0)
        fee = meta.get("fee") or 0
        # Most of the time wallet is fee payer; add fee back so "economic" delta isn't skewed.
        return (lamport_delta + fee) / 1e9
    except Exception:
        return 0.0


def _extract_token_deltas(tx: dict, wallet: str) -> Dict[str, float]:
    """Return mint -> uiAmount delta for token accounts owned by wallet."""
    meta = tx.get("meta") or {}
    pre = meta.get("preTokenBalances") or []
    post = meta.get("postTokenBalances") or []

    def to_map(items: list) -> Dict[Tuple[str, int], float]:
        m = {}
        for it in items:
            if not isinstance(it, dict):
                continue
            if it.get("owner") != wallet:
                continue
            mint = it.get("mint")
            idx = it.get("accountIndex")
            ui = it.get("uiTokenAmount") or {}
            amt = ui.get("uiAmount")
            if amt is None:
                amt = _safe_float(ui.get("uiAmountString"), 0.0)
            if mint and idx is not None:
                m[(mint, int(idx))] = _safe_float(amt, 0.0)
        return m

    pre_m = to_map(pre)
    post_m = to_map(post)
    keys = set(pre_m.keys()) | set(post_m.keys())
    deltas: Dict[str, float] = {}
    for k in keys:
        mint, _ = k
        d = post_m.get(k, 0.0) - pre_m.get(k, 0.0)
        if abs(d) > 1e-12:
            deltas[mint] = deltas.get(mint, 0.0) + d
    return deltas


def detect_swaps_from_helius(enhanced_txs: List[dict]) -> List[dict]:
    """
    Extract swaps from Helius Enhanced Transactions (preferred method).
    Helius already parses swap events with correct token_in/out and amounts.
    Handles multiple Helius response formats.
    """
    swaps = []
    for tx in (enhanced_txs or []):
        if not isinstance(tx, dict):
            continue
        
        # Check for parsed swap events in various formats
        events = tx.get("events") or {}
        swap_events = events.get("swap") or []
        
        # Also check for type field indicating swap
        if not swap_events and tx.get("type") == "SWAP":
            swap_events = [tx]
        
        # Check for nativeTransfers that might indicate swaps
        native_transfers = tx.get("nativeTransfers") or []
        token_transfers = tx.get("tokenTransfers") or []
        
        # If we have both native and token transfers, might be a swap
        if not swap_events and (native_transfers or token_transfers):
            # Try to infer swap from transfer patterns
            # This is a fallback - prefer explicit swap events
            pass
        
        for ev in swap_events:
            if not isinstance(ev, dict):
                continue
            
            # Extract swap details from Helius format (multiple field name variations)
            token_in = (ev.get("tokenIn") or ev.get("token_in") or ev.get("source") or 
                       ev.get("inputMint") or ev.get("input_mint") or "")
            token_out = (ev.get("tokenOut") or ev.get("token_out") or ev.get("destination") or 
                        ev.get("outputMint") or ev.get("output_mint") or "")
            
            # Amount extraction with multiple fallbacks
            amt_in = _safe_float(
                ev.get("amountIn") or ev.get("amount_in") or 
                ev.get("inputAmount") or ev.get("input_amount") or 0.0, 0.0
            )
            amt_out = _safe_float(
                ev.get("amountOut") or ev.get("amount_out") or 
                ev.get("outputAmount") or ev.get("output_amount") or 0.0, 0.0
            )
            
            ts = (ev.get("timestamp") or tx.get("timestamp") or 
                  tx.get("blockTime") or tx.get("block_time") or 0)
            sig = (ev.get("signature") or tx.get("signature") or 
                   tx.get("transactionSignature") or "")
            
            if token_in and token_out and amt_in > 0 and amt_out > 0:
                swaps.append({
                    "signature": sig,
                    "token_in": token_in,
                    "amount_in": amt_in,
                    "token_out": token_out,
                    "amount_out": amt_out,
                    "timestamp": ts
                })
    return swaps


def detect_swaps_delta(wallet: str, tx_details_map: Dict[str, dict]) -> List[dict]:
    """
    Protocol-agnostic swap detection via balance deltas (fallback method).
    Rule: at least one negative delta and one positive delta (handles multi-hop, WSOL, fees).
    """
    swaps = []
    skipped_no_deltas = 0
    skipped_no_swap_pattern = 0
    for sig, tx in (tx_details_map or {}).items():
        if not tx or not tx.get("meta"):
            continue
        token_deltas = _extract_token_deltas(tx, wallet)
        sol_delta = _extract_wallet_sol_delta(tx, wallet)

        # Build combined deltas (SOL + tokens), filter dust
        all_deltas: Dict[str, float] = {}
        if abs(sol_delta) > 1e-9:
            all_deltas[WSOL_MINT] = sol_delta
        for mint, delta in token_deltas.items():
            if abs(delta) > 1e-9:
                # Aggregate deltas for same mint (multiple accounts)
                all_deltas[mint] = all_deltas.get(mint, 0.0) + delta

        # Filter out dust and separate negatives/positives
        nz = [(m, d) for m, d in all_deltas.items() if abs(d) > 1e-9]
        if not nz:
            skipped_no_deltas += 1
            continue
        
        negs = [(m, d) for m, d in nz if d < 0]
        poss = [(m, d) for m, d in nz if d > 0]
        
        # Swap requires at least one negative and one positive delta
        if not negs or not poss:
            skipped_no_swap_pattern += 1
            continue
        
        # Choose dominant legs: most negative (token_in) and most positive (token_out)
        token_in, delta_in = min(negs, key=lambda x: x[1])  # most negative
        token_out, delta_out = max(poss, key=lambda x: x[1])  # most positive
        
        # Skip pure SOL-to-SOL transactions (fees, rent, noise)
        if token_in == WSOL_MINT and token_out == WSOL_MINT:
            skipped_no_swap_pattern += 1
            continue
        
        ts = tx.get("blockTime") or tx.get("timestamp") or 0
        swaps.append({
            "signature": sig,
            "token_in": token_in,
            "amount_in": abs(delta_in),
            "token_out": token_out,
            "amount_out": delta_out,
            "timestamp": ts
        })
    
    # Debug info (can be removed later)
    if swaps:
        import logging
        logging.debug(f"detect_swaps_delta: found {len(swaps)} swaps, skipped_no_deltas={skipped_no_deltas}, skipped_no_swap_pattern={skipped_no_swap_pattern}")
    
    return swaps


def _token_amount_from_enhanced(tt: dict) -> float:
    """Parse token amount from Helius enhanced tokenTransfers (amount/decimals or uiAmount)."""
    raw = tt.get("tokenAmount")
    if raw is None:
        return _safe_float(tt.get("amount"), 0.0)
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, dict):
        ui = raw.get("uiAmount")
        if ui is not None:
            return _safe_float(ui, 0.0)
        amt = _safe_float(raw.get("amount"), 0.0)
        dec = int(raw.get("decimals") or 0)
        return amt / (10 ** dec) if dec else amt
    return 0.0


def detect_swaps_delta_from_enhanced(wallet: str, enhanced_txs: List[dict]) -> List[dict]:
    """
    Delta-based swap detection from Helius Enhanced (nativeTransfers + tokenTransfers).
    Use when Helius parsed swap events are empty and tx_details_map is unavailable (Vercel path).
    Same output shape as detect_swaps_delta for FIFO PnL.
    """
    swaps = []
    for tx in enhanced_txs or []:
        if not isinstance(tx, dict):
            continue
        sig = tx.get("signature") or tx.get("transactionSignature") or ""
        ts = tx.get("timestamp") or tx.get("blockTime") or 0
        all_deltas: Dict[str, float] = {}

        for nt in tx.get("nativeTransfers") or []:
            if not isinstance(nt, dict):
                continue
            fr = nt.get("fromUserAccount") or nt.get("from")
            to = nt.get("toUserAccount") or nt.get("to")
            amt_lamports = _safe_float(nt.get("amount"), 0.0)
            if amt_lamports <= 0 or not fr or not to:
                continue
            amt_sol = amt_lamports / 1e9
            if to == wallet and fr != wallet:
                all_deltas[WSOL_MINT] = all_deltas.get(WSOL_MINT, 0.0) + amt_sol
            elif fr == wallet and to != wallet:
                all_deltas[WSOL_MINT] = all_deltas.get(WSOL_MINT, 0.0) - amt_sol

        for tt in tx.get("tokenTransfers") or []:
            if not isinstance(tt, dict):
                continue
            fr = tt.get("fromUserAccount") or tt.get("from")
            to = tt.get("toUserAccount") or tt.get("to")
            mint = tt.get("mint") or ""
            if not mint:
                continue
            amt = _token_amount_from_enhanced(tt)
            if amt <= 0:
                continue
            if to == wallet and fr != wallet:
                all_deltas[mint] = all_deltas.get(mint, 0.0) + amt
            elif fr == wallet and to != wallet:
                all_deltas[mint] = all_deltas.get(mint, 0.0) - amt

        nz = [(m, d) for m, d in all_deltas.items() if abs(d) > 1e-12]
        if not nz:
            continue
        negs = [(m, d) for m, d in nz if d < 0]
        poss = [(m, d) for m, d in nz if d > 0]
        if not negs or not poss:
            continue
        token_in, delta_in = min(negs, key=lambda x: x[1])
        token_out, delta_out = max(poss, key=lambda x: x[1])
        if token_in == WSOL_MINT and token_out == WSOL_MINT:
            continue
        swaps.append({
            "signature": sig,
            "token_in": token_in,
            "amount_in": abs(delta_in),
            "token_out": token_out,
            "amount_out": delta_out,
            "timestamp": ts
        })
    return swaps


def _helius_balances(wallet: str) -> Tuple[dict, dict]:
    """Fetch Helius balances payload; returns (payload, debug)."""
    helius_key = os.getenv("HELIUS_API_KEY")
    if not helius_key:
        return {"nativeBalance": 0, "tokens": []}, {"error": "missing_helius_key"}
    try:
        resp = requests.get(
            f"https://api.helius.xyz/v0/addresses/{wallet}/balances?api-key={helius_key}",
            timeout=12,
            headers={"Accept": "application/json"}
        )
        if resp.status_code != 200:
            return {"nativeBalance": 0, "tokens": []}, {"error": f"helius_balances_status_{resp.status_code}"}
        return resp.json(), {"status": "ok"}
    except Exception as e:
        return {"nativeBalance": 0, "tokens": []}, {"error": f"helius_balances_exception_{str(e)[:80]}"}


def compute_networth_breakdown(wallet: str) -> dict:
    """
    Net worth - SOL balance only.
    Returns SOL balance and USD value using Coingecko price.
    """
    bal_payload, bal_dbg = _helius_balances(wallet)
    sol_balance = (bal_payload.get("nativeBalance") or 0) / 1e9
    
    # Get SOL price from Coingecko
    sol_price = 0.0
    try:
        resp = requests.get("https://api.coingecko.com/api/v3/simple/price", 
                           params={"ids": "solana", "vs_currencies": "usd"}, 
                           timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            sol_price = _safe_float(data.get("solana", {}).get("usd", 0.0), 0.0)
            if sol_price > 0:
                print(f"[NetWorth] SOL price: ${sol_price:.2f}")
    except Exception as e:
        print(f"[NetWorth] Coingecko price fetch failed: {str(e)[:100]}")
    
    total_usd = sol_balance * sol_price if sol_price else 0.0
    
    # Get token list for mint_to_symbol (needed for PnL classification)
    tokens = bal_payload.get("tokens") or []
    mint_to_symbol = {}
    for t in tokens:
        mint = t.get("mint") or ""
        sym = (t.get("symbol") or "").upper()
        if mint:
            mint_to_symbol[mint] = sym

    return {
        "sol_balance": sol_balance,
        "total_usd": round(total_usd, 2),
        "sol_price": sol_price,
        "mint_to_symbol": mint_to_symbol,  # for downstream pnl classification
        "debug": bal_dbg
    }


def compute_memecoin_pnl(wallet: str, tx_details_map: Dict[str, dict], mint_to_symbol: Dict[str, str]) -> dict:
    """
    Realized PnL approximation from on-chain deltas, denominated in base assets (USDC/USDT/SOL).
    No reliance on external price feeds.
    """
    per_mint: Dict[str, dict] = {}
    totals = {"trades": 0, "realized_pnl_sol": 0.0, "realized_pnl_usd_stable": 0.0}

    for sig, tx in (tx_details_map or {}).items():
        if not tx or not tx.get("meta"):
            continue

        token_deltas = _extract_token_deltas(tx, wallet)
        sol_delta = _extract_wallet_sol_delta(tx, wallet)

        usdc_delta = token_deltas.get(USDC_MINT, 0.0)
        usdt_delta = token_deltas.get(USDT_MINT, 0.0)

        # Identify one "primary" non-stable token in this tx by largest abs delta.
        non_stable = [(m, d) for (m, d) in token_deltas.items() if m not in STABLE_MINTS and m != WSOL_MINT]
        if not non_stable:
            continue
        mint, tok_delta = sorted(non_stable, key=lambda x: abs(x[1]), reverse=True)[0]

        # Determine base asset movement: prefer USDC/USDT, else SOL.
        base = None
        base_delta = 0.0
        if abs(usdc_delta) > 1e-9:
            base = "USDC"
            base_delta = usdc_delta
        elif abs(usdt_delta) > 1e-9:
            base = "USDT"
            base_delta = usdt_delta
        elif abs(sol_delta) > 1e-9:
            base = "SOL"
            base_delta = sol_delta
        else:
            continue

        sym = mint_to_symbol.get(mint, "")
        is_meme = (sym in KNOWN_MEME_SYMBOLS) or (sym and sym not in STABLE_SYMBOLS and sym not in {"SOL", "WSOL"})

        # Buy: token_delta positive, base_delta negative
        # Sell: token_delta negative, base_delta positive
        if tok_delta > 0 and base_delta < 0:
            side = "buy"
            spent = abs(base_delta)
            recv = 0.0
        elif tok_delta < 0 and base_delta > 0:
            side = "sell"
            spent = 0.0
            recv = abs(base_delta)
        else:
            # Not a clean swap signature; skip
            continue

        row = per_mint.setdefault(mint, {
            "mint": mint,
            "symbol": sym,
            "is_memecoin": is_meme,
            "base": base,
            "spent": 0.0,
            "received": 0.0,
            "trades": 0
        })
        row["trades"] += 1
        row["spent"] += spent
        row["received"] += recv
        totals["trades"] += 1

    results = []
    for mint, row in per_mint.items():
        pnl = row["received"] - row["spent"]
        out = {**row, "realized_pnl": pnl}
        results.append(out)
        if row["base"] == "SOL":
            totals["realized_pnl_sol"] += pnl
        else:
            totals["realized_pnl_usd_stable"] += pnl

    meme_results = [r for r in results if r.get("is_memecoin")]
    top_losses = sorted(meme_results, key=lambda r: r["realized_pnl"])[:10]
    top_wins = sorted(meme_results, key=lambda r: r["realized_pnl"], reverse=True)[:10]

    return {
        "totals": {
            "trades": totals["trades"],
            "realized_pnl_sol": round(totals["realized_pnl_sol"], 6),
            "realized_pnl_usd_stable": round(totals["realized_pnl_usd_stable"], 2)
        },
        "top_memecoin_losses": top_losses,
        "top_memecoin_wins": top_wins
    }


def compute_income_sources(wallet: str, tx_details_map: Dict[str, dict]) -> dict:
    """
    Coarse income source inference from deltas.
    Categories:
    - stable_inflows
    - sol_inflows
    - token_airdrops (token-only inflows)
    """
    income = {
        "sol_inflows": {"count": 0, "total_sol": 0.0},
        "stable_inflows": {"count": 0, "total_usd_stable": 0.0},
        "token_airdrops": {"count": 0, "unique_mints": set()}
    }

    for sig, tx in (tx_details_map or {}).items():
        if not tx or not tx.get("meta"):
            continue
        token_deltas = _extract_token_deltas(tx, wallet)
        sol_delta = _extract_wallet_sol_delta(tx, wallet)

        usdc_in = token_deltas.get(USDC_MINT, 0.0)
        usdt_in = token_deltas.get(USDT_MINT, 0.0)

        # Airdrop-like: positive token delta on non-stable, no stable outflow, no SOL outflow
        non_stable_in = [m for (m, d) in token_deltas.items() if d > 0 and m not in STABLE_MINTS and m != WSOL_MINT]
        has_outflow = (sol_delta < -1e-6) or (usdc_in < -1e-6) or (usdt_in < -1e-6)

        if non_stable_in and not has_outflow:
            income["token_airdrops"]["count"] += 1
            for m in non_stable_in:
                income["token_airdrops"]["unique_mints"].add(m)
            continue

        # Stable inflow (USDC/USDT)
        stable_delta = 0.0
        if usdc_in > 1e-6:
            stable_delta += usdc_in
        if usdt_in > 1e-6:
            stable_delta += usdt_in
        if stable_delta > 1e-6 and sol_delta > -1e-6:
            income["stable_inflows"]["count"] += 1
            income["stable_inflows"]["total_usd_stable"] += stable_delta

        # SOL inflow
        if sol_delta > 1e-6 and stable_delta <= 1e-6:
            income["sol_inflows"]["count"] += 1
            income["sol_inflows"]["total_sol"] += sol_delta

    income["token_airdrops"]["unique_mints"] = len(income["token_airdrops"]["unique_mints"])
    income["stable_inflows"]["total_usd_stable"] = round(income["stable_inflows"]["total_usd_stable"], 2)
    income["sol_inflows"]["total_sol"] = round(income["sol_inflows"]["total_sol"], 6)
    return income


def compute_surveillance_exposure_score(
    swap_count: int,
    memecoin_ratio: float,
    hourly_counts: List[int],
    opsec_data: dict,
    mempool_data: dict,
    income_sources: dict,
    portfolio_summary: dict
) -> dict:
    """
    Compute composite surveillance exposure score.
    Answers: "How easily can this wallet be profiled?"
    
    Uses heuristics only (no ML required).
    Score range: 0-100 (higher = more exposed)
    """
    import math
    
    # 1. Swap count (normalize to 0-1, cap at 20 swaps = max for high sensitivity)
    # More swaps = more behavioral data = higher exposure
    # With 15 swaps: 15/20 = 0.75 signal, contributing 11.25 points
    swap_signal = min(swap_count / 20.0, 1.0) if swap_count > 0 else 0.0
    
    # 2. Memecoin ratio (already 0-100 percentage, normalize to 0-1)
    memecoin_signal = memecoin_ratio / 100.0 if memecoin_ratio else 0.0
    
    # 3. Active hours entropy (lower entropy = more predictable = higher exposure)
    # Entropy measures randomness: high entropy = random, low entropy = predictable
    total_hourly = sum(hourly_counts) if hourly_counts else 1
    if total_hourly > 0:
        probs = [max(count / total_hourly, 1e-10) for count in hourly_counts]
        entropy = -sum(p * math.log2(p) for p in probs if p > 0)
        max_entropy = math.log2(24)  # Maximum entropy for 24 hours
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        # Lower entropy = higher exposure, so use (1 - entropy)
        entropy_signal = 1.0 - normalized_entropy
    else:
        entropy_signal = 0.0
    
    # 4. Repeated counterparties (count unique repeated sources/targets)
    repeated_count = 0
    if opsec_data and isinstance(opsec_data, dict):
        funding = opsec_data.get("funding_sources", [])
        withdrawals = opsec_data.get("withdrawal_targets", [])
        # Count sources/targets that appear 2+ times
        if isinstance(funding, list):
            repeated_count += sum(1 for f in funding if isinstance(f, dict) and f.get("count", 0) >= 2)
        if isinstance(withdrawals, list):
            repeated_count += sum(1 for w in withdrawals if isinstance(w, dict) and w.get("count", 0) >= 2)
    # Normalize: 0-2 repeated = 0-1 signal (very sensitive, cap at 2)
    # Even 1 repeated counterparty = 0.5 signal = 7.5 points
    counterparty_signal = min(repeated_count / 2.0, 1.0)
    
    # 5. MEV execution detected (boolean)
    mev_detected = 0
    if mempool_data and isinstance(mempool_data, dict):
        profiles = mempool_data.get("profiles", {})
        if isinstance(profiles, dict):
            mev_count = profiles.get("MEV_STYLE", 0)
            mev_detected = 1.0 if mev_count > 0 else 0.0
    
    # 6. Stablecoin income detected (boolean)
    stable_income_detected = 0.0
    if income_sources and isinstance(income_sources, dict):
        stable_rec = income_sources.get("stable_received", {})
        if isinstance(stable_rec, dict):
            stable_income_detected = 1.0 if (stable_rec.get("count", 0) > 0 or stable_rec.get("total_stable", 0) > 0) else 0.0
    
    # 7. Portfolio concentration (already 0-100, normalize to 0-1)
    concentration = 0
    if portfolio_summary and isinstance(portfolio_summary, dict):
        concentration = portfolio_summary.get("topConcentration", 0)
    concentration_signal = concentration / 100.0 if concentration else 0.0
    
    # Compute composite score using weighted formula
    # Adjusted weights for better sensitivity and realistic scoring
    score = (
        swap_signal * 20 +              # Increased - swaps are major behavioral signal
        memecoin_signal * 20 +          # High memecoin activity = degen pattern
        entropy_signal * 20 +          # Predictable hours = fingerprintable
        counterparty_signal * 15 +      # Increased - repeated counterparties are strong signal
        mev_detected * 15 +            # MEV = sophisticated/professional pattern
        stable_income_detected * 10 +   # Stable income = identifiable source
        concentration_signal * 15       # Increased - concentration = trackable
    )
    
    # Add base score for any activity (even minimal activity creates exposure)
    if swap_count > 0 or (hourly_counts and sum(hourly_counts) > 0):
        score += 10  # Increased base exposure for being active
    
    # Clamp to 0-100
    score = max(0, min(100, score))
    
    # Determine risk level (lowered thresholds for more realistic categorization)
    if score >= 50:
        risk_level = "HIGH"
    elif score >= 25:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    # Generate top leak vectors (most impactful signals)
    leak_vectors = []
    
    if entropy_signal > 0.6:
        # Low entropy = predictable hours
        active_hours = [i for i, count in enumerate(hourly_counts) if count > 0]
        if len(active_hours) <= 8:  # Active in <= 8 hours = predictable
            leak_vectors.append("Consistent UTC trading hours")
    
    if memecoin_signal > 0.3:
        leak_vectors.append("High memecoin swap density")
    
    if mev_detected > 0:
        leak_vectors.append("MEV execution fingerprint detected")
    
    if counterparty_signal > 0.4:
        leak_vectors.append("Repeated counterparty patterns")
    
    if swap_signal > 0.5:
        leak_vectors.append("Behavioral execution fingerprint")
    
    if concentration_signal > 0.7:
        leak_vectors.append("High portfolio concentration")
    
    if stable_income_detected > 0:
        leak_vectors.append("Stablecoin income patterns")
    
    # If no specific vectors, add generic ones based on score
    if not leak_vectors:
        if score > 50:
            leak_vectors.append("Multiple behavioral signals detected")
        else:
            leak_vectors.append("Limited exposure signals")
    
    return {
        "surveillance_score": round(score, 1),
        "risk_level": risk_level,
        "top_leak_vectors": leak_vectors[:5],  # Top 5 most relevant
        "signals": {
            "swap_count": swap_count,
            "swap_signal": round(swap_signal, 3),
            "memecoin_ratio": round(memecoin_ratio, 1),
            "memecoin_signal": round(memecoin_signal, 3),
            "active_hours_entropy": round(entropy_signal, 3),
            "repeated_counterparties": repeated_count,
            "counterparty_signal": round(counterparty_signal, 3),
            "mev_execution_detected": mev_detected > 0,
            "stablecoin_income_detected": stable_income_detected > 0,
            "portfolio_concentration": round(concentration, 1),
            "concentration_signal": round(concentration_signal, 3)
        }
    }


def classify_node_type(addr: str, enhanced_txs: List[dict] = None) -> dict:
    """
    Classify a node type based on address patterns and transaction history.
    Returns: {type, label, color, icon, risk_level}
    """
    # Check if known exchange
    if addr in KNOWN_EXCHANGES:
        return {
            "type": "exchange",
            "label": "Exchange/KYC",
            "color": "#ff6b6b",
            "icon": "🏦",
            "risk_level": "high",
            "description": "Centralized exchange (KYC required)"
        }
    
    # Check if DEX program
    if addr in KNOWN_DEX_PROGRAMS:
        return {
            "type": "dex",
            "label": "DEX",
            "color": "#4dabf7",
            "icon": "🔄",
            "risk_level": "medium",
            "description": "Decentralized exchange"
        }
    
    # Check if DeFi protocol
    if addr in KNOWN_DEFI_PROTOCOLS:
        return {
            "type": "defi",
            "label": "DeFi Protocol",
            "color": "#51cf66",
            "icon": "🏛️",
            "risk_level": "low",
            "description": "DeFi protocol"
        }
    
    # Check transaction patterns for memecoin activity
    if enhanced_txs:
        meme_indicators = 0
        for tx in enhanced_txs[:50]:  # Check recent transactions
            token_transfers = tx.get("tokenTransfers") or []
            for transfer in token_transfers:
                if not isinstance(transfer, dict):
                    continue
                mint = transfer.get("mint") or ""
                if any(symbol in str(mint).upper() for symbol in KNOWN_MEME_SYMBOLS):
                    meme_indicators += 1
                    break
        
        if meme_indicators >= 3:
            return {
                "type": "memecoin",
                "label": "Memecoin",
                "color": "#ffd43b",
                "icon": "🪙",
                "risk_level": "medium",
                "description": "Memecoin activity detected"
            }
    
    # Default: unknown
    return {
        "type": "unknown",
        "label": "Unknown",
        "color": "#868e96",
        "icon": "❓",
        "risk_level": "low",
        "description": "Unknown entity"
    }


def calculate_edge_confidence(data: dict) -> float:
    """
    Calculate edge confidence score (0-1) based on:
    - Transaction count
    - Timing correlation
    - Directionality (bidirectional = higher confidence)
    """
    confidence = 0.0
    
    # Base confidence from interaction count
    tx_count = data["count"]
    if tx_count >= 10:
        confidence += 0.4
    elif tx_count >= 5:
        confidence += 0.3
    elif tx_count >= 3:
        confidence += 0.2
    else:
        confidence += 0.1
    
    # Timing correlation (transactions close together = higher confidence)
    if len(data["timestamps"]) >= 2:
        timestamps_sorted = sorted(data["timestamps"])
        time_diffs = [timestamps_sorted[i+1] - timestamps_sorted[i] 
                     for i in range(len(timestamps_sorted)-1)]
        avg_diff = sum(time_diffs) / len(time_diffs) if time_diffs else float('inf')
        if avg_diff < 3600:  # Within 1 hour
            confidence += 0.3
        elif avg_diff < 86400:  # Within 1 day
            confidence += 0.2
        else:
            confidence += 0.1
    
    # Directionality (bidirectional = higher confidence)
    has_inflow = data["inflows"] > 0.01
    has_outflow = data["outflows"] > 0.01
    if has_inflow and has_outflow:
        confidence += 0.3  # Bidirectional flow
    elif has_inflow or has_outflow:
        confidence += 0.1  # Unidirectional
    
    return min(confidence, 1.0)


def check_sns_domain(wallet: str) -> dict:
    """
    Check if wallet has an associated SNS (Solana Name Service) domain.
    Attempts reverse lookup via Bonfida SNS API or similar services.
    """
    try:
        # Try Bonfida SNS reverse lookup
        # Bonfida provides SNS reverse resolution API
        try:
            resp = requests.get(
                f"https://sns-api.bonfida.com/v1/reverse/{wallet}",
                timeout=5,
                headers={"Accept": "application/json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                domain = data.get("domain") or data.get("name")
                if domain:
                    return {
                        "has_domain": True,
                        "domain": domain,
                        "service": "bonfida_sns"
                    }
        except Exception:
            pass
        
        # Try alternative SNS resolution methods
        # Note: SNS resolution on Solana is less standardized than ENS on Ethereum
        # Multiple services exist (Bonfida, FIDA, etc.)
        
        return {
            "has_domain": False,
            "domain": None,
            "note": "No SNS domain found (checked Bonfida SNS)"
        }
    except Exception as e:
        return {
            "has_domain": False,
            "domain": None,
            "error": str(e)[:100]
        }


def get_notable_transactions(wallet: str, tx_details_map: Dict[str, dict], signatures: List[dict] = None) -> dict:
    """
    Identify notable transactions (large transfers) that are often shared publicly.
    Returns top transactions sorted by amount.
    """
    notable_txs = []
    
    if signatures:
        for sig_info in signatures[:50]:
            if not isinstance(sig_info, dict):
                continue
            sig = sig_info.get("signature") or sig_info.get("transactionSignature") or ""
            block_time = sig_info.get("blockTime") or sig_info.get("block_time")
            if not sig or not block_time:
                continue
            
            # Check if this is a notable transaction (large amounts)
            tx_details = tx_details_map.get(sig)
            if not tx_details or not isinstance(tx_details, dict):
                continue
            meta = tx_details.get("meta") or {}
            pre_balances = meta.get("preBalances") or []
            post_balances = meta.get("postBalances") or []
            if pre_balances and post_balances:
                msg = (tx_details.get("transaction") or {}).get("message") or {}
                keys = msg.get("accountKeys") or []
                wallet_idx = None
                for i, k in enumerate(keys):
                    if isinstance(k, dict):
                        addr = k.get("pubkey", "")
                    else:
                        addr = str(k)
                    if addr == wallet:
                        wallet_idx = i
                        break
                if wallet_idx is not None and wallet_idx < len(pre_balances) and wallet_idx < len(post_balances):
                    delta = (post_balances[wallet_idx] - pre_balances[wallet_idx]) / 1e9
                    if abs(delta) > 1.0:
                        notable_txs.append({
                            "signature": sig,
                            "amount": abs(delta),
                            "timestamp": block_time,
                            "type": "large_transfer" if delta > 0 else "large_withdrawal",
                            "delta": delta
                        })
        
        if notable_txs:
            # Sort by amount, take top 10
            notable_txs.sort(key=lambda x: x["amount"], reverse=True)
            top_notable = notable_txs[:10]
            
            return {
                "count": len(top_notable),
                "transactions": [
                    {
                        "signature": tx["signature"],
                        "amount": f"{tx['amount']:.4f} SOL",
                        "amount_raw": tx["amount"],
                        "type": tx["type"],
                        "timestamp": tx["timestamp"],
                        "delta": tx["delta"]
                    }
                    for tx in top_notable
                ]
            }
    
    return {
        "count": 0,
        "transactions": []
    }


def get_notable_transactions_from_enhanced(wallet: str, enhanced_txs: List[dict]) -> dict:
    """Notable (large SOL) tx from Helius Enhanced nativeTransfers. Same return shape as get_notable_transactions."""
    notable_txs = []
    for tx in enhanced_txs or []:
        if not isinstance(tx, dict):
            continue
        sig = tx.get("signature") or tx.get("transactionSignature") or ""
        ts = tx.get("timestamp") or tx.get("blockTime") or 0
        if not sig or not ts:
            continue
        sol_in = 0.0
        sol_out = 0.0
        for nt in tx.get("nativeTransfers") or []:
            if not isinstance(nt, dict):
                continue
            fr = nt.get("fromUserAccount") or nt.get("from")
            to = nt.get("toUserAccount") or nt.get("to")
            amt = _safe_float(nt.get("amount"), 0.0) / 1e9
            if to == wallet and fr != wallet:
                sol_in += amt
            elif fr == wallet and to != wallet:
                sol_out += amt
        delta = sol_in - sol_out
        if abs(delta) > 1.0:
            notable_txs.append({
                "signature": sig,
                "amount": abs(delta),
                "timestamp": ts,
                "type": "large_transfer" if delta > 0 else "large_withdrawal",
                "delta": delta
            })
    if notable_txs:
        notable_txs.sort(key=lambda x: x["amount"], reverse=True)
        top = notable_txs[:10]
        return {
            "count": len(top),
            "transactions": [
                {"signature": t["signature"], "amount": f"{t['amount']:.4f} SOL", "amount_raw": t["amount"], "type": t["type"], "timestamp": t["timestamp"], "delta": t["delta"]}
                for t in top
            ]
        }
    return {"count": 0, "transactions": []}


def analyze_ego_network(wallet: str, tx_details_map: Dict[str, dict], limit: int = 100) -> dict:
    """
    Analyze ego-network of linked wallets using heuristic inference.
    Returns top 5-15 linked wallets with connection reasons.
    """
    # Try to get Helius enhanced transactions for better parsed data
    enhanced_txs, _ = helius_get_transactions(wallet, limit=min(limit, 100))
    
    # Extract all counterparties from transactions
    counterparties: Dict[str, dict] = {}  # address -> {count, reasons, timestamps, fees}
    
    # First, try using Helius enhanced transactions (better parsed)
    for tx in enhanced_txs:
        if not isinstance(tx, dict):
            continue
        
        # Get timestamp
        block_time = tx.get("timestamp")
        if not block_time:
            continue
        
        # Extract counterparties from native transfers
        native_transfers = tx.get("nativeTransfers") or []
        for transfer in native_transfers:
            if not isinstance(transfer, dict):
                continue
            from_addr = transfer.get("fromUserAccount") or transfer.get("from")
            to_addr = transfer.get("toUserAccount") or transfer.get("to")
            amount = _safe_float(transfer.get("amount") or 0, 0.0) / 1e9
            
            if not from_addr or not to_addr:
                continue
            
            # Determine direction relative to target wallet
            if from_addr == wallet and to_addr != wallet:
                # Wallet sent to counterparty
                addr = to_addr
                if addr not in counterparties:
                    counterparties[addr] = {
                        "count": 0,
                        "reasons": [],
                        "timestamps": [],
                        "fees": [],
                        "inflows": 0.0,
                        "outflows": 0.0
                    }
                cp = counterparties[addr]
                cp["count"] += 1
                cp["timestamps"].append(block_time)
                cp["outflows"] += amount
                if "cashout_target" not in cp["reasons"]:
                    cp["reasons"].append("cashout_target")
            
            elif to_addr == wallet and from_addr != wallet:
                # Wallet received from counterparty
                addr = from_addr
                if addr not in counterparties:
                    counterparties[addr] = {
                        "count": 0,
                        "reasons": [],
                        "timestamps": [],
                        "fees": [],
                        "inflows": 0.0,
                        "outflows": 0.0
                    }
                cp = counterparties[addr]
                cp["count"] += 1
                cp["timestamps"].append(block_time)
                cp["inflows"] += amount
                if "funding_source" not in cp["reasons"]:
                    cp["reasons"].append("funding_source")
        
        # Also check token transfers
        token_transfers = tx.get("tokenTransfers") or []
        for transfer in token_transfers:
            if not isinstance(transfer, dict):
                continue
            from_addr = transfer.get("fromUserAccount") or transfer.get("from")
            to_addr = transfer.get("toUserAccount") or transfer.get("to")

            if not from_addr or not to_addr:
                continue
            
            if from_addr == wallet and to_addr != wallet:
                addr = to_addr
                if addr not in counterparties:
                    counterparties[addr] = {
                        "count": 0,
                        "reasons": [],
                        "timestamps": [],
                        "fees": [],
                        "inflows": 0.0,
                        "outflows": 0.0
                    }
                cp = counterparties[addr]
                cp["count"] += 1
                cp["timestamps"].append(block_time)
                if "token_transfer" not in cp["reasons"]:
                    cp["reasons"].append("token_transfer")
            
            elif to_addr == wallet and from_addr != wallet:
                addr = from_addr
                if addr not in counterparties:
                    counterparties[addr] = {
                        "count": 0,
                        "reasons": [],
                        "timestamps": [],
                        "fees": [],
                        "inflows": 0.0,
                        "outflows": 0.0
                    }
                cp = counterparties[addr]
                cp["count"] += 1
                cp["timestamps"].append(block_time)
                if "token_transfer" not in cp["reasons"]:
                    cp["reasons"].append("token_transfer")
    
    # Fallback: use raw transaction data if Helius enhanced transactions aren't available
    if not enhanced_txs and tx_details_map:
        for sig, tx in (tx_details_map or {}).items():
            if not tx:
                continue
            
            meta = tx.get("meta") or {}
            msg = (tx.get("transaction") or {}).get("message") or {}
            keys = msg.get("accountKeys") or []
            
            # Extract all account addresses
            accounts = []
            for k in keys:
                if isinstance(k, dict):
                    addr = k.get("pubkey", "")
                else:
                    addr = str(k)
                if addr and addr != wallet and len(addr) >= 32:  # Valid Solana address
                    accounts.append(addr)
            
            # Get transaction timestamp
            block_time = meta.get("blockTime")
            if not block_time:
                continue
            
            # Get fee
            fee = meta.get("fee") or 0
            
            # Analyze pre/post balances to determine direction
            pre_balances = meta.get("preBalances") or []
            post_balances = meta.get("postBalances") or []
            
            wallet_idx = None
            for i, k in enumerate(keys):
                if isinstance(k, dict):
                    addr = k.get("pubkey", "")
                else:
                    addr = str(k)
                if addr == wallet:
                    wallet_idx = i
                    break
            
            if wallet_idx is None or wallet_idx >= len(pre_balances) or wallet_idx >= len(post_balances):
                continue
            
            wallet_delta = (post_balances[wallet_idx] - pre_balances[wallet_idx]) / 1e9
            
            # Track counterparties
            for addr in set(accounts):  # Deduplicate
                if addr not in counterparties:
                    counterparties[addr] = {
                        "count": 0,
                        "reasons": [],
                        "timestamps": [],
                        "fees": [],
                        "inflows": 0.0,
                        "outflows": 0.0
                    }
                
                cp = counterparties[addr]
                cp["count"] += 1
                cp["timestamps"].append(block_time)
                cp["fees"].append(fee)
                
                # Determine relationship type
                if wallet_delta > 0.001:  # Received SOL
                    cp["inflows"] += wallet_delta
                    if "funding_source" not in cp["reasons"]:
                        cp["reasons"].append("funding_source")
                elif wallet_delta < -0.001:  # Sent SOL
                    cp["outflows"] += abs(wallet_delta)
                    if "cashout_target" not in cp["reasons"]:
                        cp["reasons"].append("cashout_target")
    
    # Score and rank counterparties
    scored: List[Tuple[str, float, dict]] = []
    
    for addr, data in counterparties.items():
        # Lower threshold: need at least 1 interaction (any interaction is a potential link)
        if data["count"] < 1:
            continue
        
        score = 0.0
        reasons = []
        
        # Base score for any interaction
        score += data["count"] * 2
        
        # Funding overlap (lowered threshold)
        if data["inflows"] > 0.01:  # At least 0.01 SOL received (lowered from 0.1)
            score += data["inflows"] * 20  # Increased weight
            if "funding" not in reasons:
                reasons.append("funding")
        
        # Cash-out overlap (lowered threshold)
        if data["outflows"] > 0.01:  # At least 0.01 SOL sent (lowered from 0.1)
            score += data["outflows"] * 20  # Increased weight
            if "cashout" not in reasons:
                reasons.append("cashout")
        
        # Interaction frequency (lowered threshold)
        if data["count"] >= 2:  # Lowered from 3
            score += data["count"] * 10  # Increased weight
            if "repeated" not in reasons:
                reasons.append("repeated")
        
        # Timing correlation (transactions close together)
        if len(data["timestamps"]) >= 2:
            timestamps_sorted = sorted(data["timestamps"])
            time_diffs = [timestamps_sorted[i+1] - timestamps_sorted[i] 
                         for i in range(len(timestamps_sorted)-1)]
            avg_diff = sum(time_diffs) / len(time_diffs) if time_diffs else float('inf')
            if avg_diff < 3600:  # Within 1 hour
                score += 30  # Increased weight
                if "timing" not in reasons:
                    reasons.append("timing")
        
        # Fee similarity (similar fee patterns) - only if we have fee data
        if len(data["fees"]) >= 2:
            fees_set = set(data["fees"])
            if len(fees_set) <= 2:  # Very similar fees
                score += 15  # Increased weight
                if "fee_pattern" not in reasons:
                    reasons.append("fee_pattern")
        
        # Always include if there's any interaction
        if score > 0 or data["count"] > 0:
            # Combine reasons from both sources
            all_reasons = list(set(data["reasons"] + reasons))
            scored.append((addr, score, {
                "reasons": all_reasons[:3],  # Limit to top 3 reasons
                "interactions": data["count"],
                "inflows": round(data["inflows"], 4),
                "outflows": round(data["outflows"], 4)
            }))
    
    # Sort by score and take top 15
    scored.sort(key=lambda x: x[1], reverse=True)
    
    # If no scored links but we have counterparties, include top ones by interaction count
    if len(scored) == 0 and len(counterparties) > 0:
        # Fallback: rank by interaction count
        fallback_scored = []
        for addr, data in counterparties.items():
            fallback_scored.append((addr, data["count"], {
                "reasons": data["reasons"][:2] if data["reasons"] else ["interaction"],
                "interactions": data["count"],
                "inflows": round(data["inflows"], 4),
                "outflows": round(data["outflows"], 4)
            }))
        fallback_scored.sort(key=lambda x: x[1], reverse=True)
        scored = fallback_scored[:15]
    
    top_linked = scored[:15]
    
    print(f"[EgoNetwork] Found {len(counterparties)} unique counterparties, {len(scored)} scored, {len(top_linked)} top links")
    
    # Build network structure with enhanced metadata
    target_node_class = classify_node_type(wallet, enhanced_txs)
    nodes = [{
        "id": wallet,
        "label": wallet[:8] + "...",
        "type": "target",
        "node_type": target_node_class["type"],
        "node_label": target_node_class["label"],
        "color": target_node_class["color"],
        "icon": target_node_class["icon"],
        "risk_level": target_node_class["risk_level"]
    }]
    
    edges = []
    exchanges_found = []
    repeated_counterparties = []
    strongest_links = []
    
    for addr, score, info in top_linked:
        # Classify node type
        node_class = classify_node_type(addr, enhanced_txs)
        
        # Calculate edge confidence
        cp_data = counterparties.get(addr, {})
        confidence = calculate_edge_confidence(cp_data)
        
        # Calculate edge weight (based on interaction count and SOL volume)
        total_sol = cp_data.get("inflows", 0) + cp_data.get("outflows", 0)
        edge_weight = min((info["interactions"] * 0.1 + total_sol * 0.5), 1.0)
        
        nodes.append({
            "id": addr,
            "label": addr[:8] + "...",
            "type": "linked",
            "score": round(score, 1),
            "node_type": node_class["type"],
            "node_label": node_class["label"],
            "color": node_class["color"],
            "icon": node_class["icon"],
            "risk_level": node_class["risk_level"],
            "description": node_class["description"]
        })
        
        # Create edge with enhanced metadata
        reason_str = ", ".join(info["reasons"][:2]) if info["reasons"] else "linked"
        edge_data = {
            "source": wallet,
            "target": addr,
            "reason": reason_str,
            "strength": min(score / 50.0, 1.0),  # Normalize to 0-1
            "confidence": round(confidence, 2),
            "weight": round(edge_weight, 2),
            "interactions": info["interactions"],
            "total_sol": round(total_sol, 4),
            "inflows": info["inflows"],
            "outflows": info["outflows"],
            "has_funding": "funding" in reason_str or "funding_source" in info.get("reasons", []),
            "has_cashout": "cashout" in reason_str or "cashout_target" in info.get("reasons", []),
            "has_timing": "timing" in reason_str or "timing" in info.get("reasons", []),
            "has_repeated": "repeated" in reason_str or "repeated" in info.get("reasons", [])
        }
        edges.append(edge_data)
        
        # Track for summary
        if node_class["type"] == "exchange":
            exchanges_found.append({
                "address": addr,
                "label": node_class["label"],
                "interactions": info["interactions"],
                "total_sol": round(total_sol, 4)
            })
        
        if info["interactions"] >= 3:
            repeated_counterparties.append({
                "address": addr,
                "label": node_class["label"],
                "interactions": info["interactions"],
                "confidence": round(confidence, 2)
            })
        
        strongest_links.append({
            "address": addr,
            "label": node_class["label"],
            "score": round(score, 1),
            "confidence": round(confidence, 2),
            "reasons": reason_str
        })
    
    # Sort strongest links
    strongest_links.sort(key=lambda x: x["score"], reverse=True)
    
    # Calculate risk highlights
    risk_highlights = []
    if exchanges_found:
        risk_highlights.append(f"{len(exchanges_found)} exchange(s) detected (KYC risk)")
    if len(repeated_counterparties) >= 5:
        risk_highlights.append(f"{len(repeated_counterparties)} repeated counterparties (linkability risk)")
    high_confidence_links = [e for e in edges if e["confidence"] >= 0.7]
    if high_confidence_links:
        risk_highlights.append(f"{len(high_confidence_links)} high-confidence links (≥70%)")
    
    return {
        "nodes": nodes,
        "edges": edges,
        "total_links": len(top_linked),
        "summary": {
            "strongest_links": strongest_links[:5],
            "exchanges": exchanges_found,
            "repeated_counterparties": repeated_counterparties[:10],
            "risk_highlights": risk_highlights
        },
        "note": "Heuristic inference - similar methods used by surveillance firms to link wallets",
        "debug": {
            "counterparties_found": len(counterparties),
            "scored_count": len(scored)
        }
    }


@app.post("/analyze-wallet")
def analyze_wallet_comprehensive(request: WalletAnalysisRequest):
    """
    Comprehensive Solana wallet analysis for surveillance exposure detection.
    Built for encrypt.trade hackathon.
    On Vercel, use Helius Enhanced Transactions for main tx list (1 API call) to avoid RPC
    rate limits; local uses RPC (fetch_signatures + getTransaction) for full meta/compute data.
    """
    try:
        # Ensure request.wallet is a string
        if not isinstance(request.wallet, str):
            raise HTTPException(status_code=400, detail="Wallet must be a string")
        if not isinstance(request.limit, (int, type(None))):
            request.limit = 100
        # Solana only
        use_helius_primary = os.getenv("VERCEL") == "1"
        limit = request.limit or 100
        enhanced_all: List[dict] = []
        all_dbg: dict = {}

        if use_helius_primary:
            enhanced_all, all_dbg = helius_get_transactions(request.wallet, limit=min(limit, 100))
            if enhanced_all and isinstance(enhanced_all, list):
                df, tx_details_list, tx_details_map, signatures = _build_df_and_lists_from_helius_enhanced(enhanced_all)
            else:
                df, tx_details_list, tx_details_map, signatures = analyze_wallet_solana(request.wallet, limit=limit)
        else:
            df, tx_details_list, tx_details_map, signatures = analyze_wallet_solana(request.wallet, limit=limit)
        
        # Validate return types
        if not isinstance(tx_details_list, list):
            tx_details_list = []
        if not isinstance(tx_details_map, dict):
            tx_details_map = {}
        if not isinstance(signatures, list):
            signatures = []

        compute_unit_field = "compute_units"

        if df.empty:
            raise HTTPException(status_code=404, detail="No transactions found for this wallet")
        
        # Calculate hourly and daily counts
        hourly_counts = [0] * 24
        daily_counts = [0] * 7
        for _, row in df.iterrows():
            hourly_counts[row["hour"]] += 1
            daily_counts[row["day_of_week"]] += 1
        
        # Detect sleep window
        sleep = detect_sleep_window_solana(hourly_counts)
        
        # Analyze reaction speed for bot detection
        reaction = analyze_reaction_speed_solana(request.wallet, tx_details_list)
        
        # Calculate probabilities
        probs = calculate_probabilities_solana(df, hourly_counts, daily_counts, sleep)
        
        # Analyze execution profiles (reduced limit for speed).
        # On Vercel: tx_details_map is empty (enhanced-only). Fetch RPC for a subset with
        # low concurrency so we get real compute units / priority fee / Jito. Use 50 tx:
        # 2× sample of 25 → more representative profile; half of 100 → lower rate-limit risk.
        mempool_limit = min(50, len(signatures))
        mempool_tx_map = tx_details_map
        if use_helius_primary and enhanced_all and not tx_details_map:
            subset_n = min(50, len(signatures))
            sig_strings = []
            for s in signatures[:subset_n]:
                if isinstance(s, dict):
                    x = s.get("signature") or s.get("transactionSignature")
                    if x:
                        sig_strings.append(x)
                elif isinstance(s, str):
                    sig_strings.append(s)
            rpc_map = fetch_transactions_parallel(sig_strings, max_workers=2) if sig_strings else {}
            mempool_tx_map = {k: v for k, v in (rpc_map or {}).items() if v is not None}
            mempool_limit = subset_n
        mempool_data = analyze_wallet_execution_profiles(
            request.wallet,
            limit=mempool_limit,
            signatures=signatures[:mempool_limit],
            tx_details_map=mempool_tx_map
        )
        
        # Opsec: use enhanced-based when Helius-primary (Vercel) for full data; else RPC
        if use_helius_primary and enhanced_all:
            opsec_data = analyze_opsec_failures_from_enhanced(request.wallet, enhanced_all)
        else:
            opsec_data = analyze_opsec_failures(
                request.wallet,
                limit=min(80, request.limit),
                signatures=signatures,
                tx_details_map=tx_details_map
            )
        
        # Prepare transaction complexity data
        complexity_data = []
        for _, row in df.iterrows():
            complexity_value = row.get(compute_unit_field, 0)
            
            # Solana compute units classification
            if complexity_value > 300000:
                tx_type = "Complex"
            elif complexity_value > 150000:
                tx_type = "Jito Bundle"
            else:
                tx_type = "Standard"
            
            complexity_data.append({
                "hour": int(row["hour"]),
                compute_unit_field: int(complexity_value),
                "type": tx_type
            })
        
        # Calculate risk assessment
        total_tx = len(df)
        fail_rate = (~df["success"]).sum() / total_tx if total_tx > 0 else 0
        
        # Solana high complexity threshold
        high_complexity_ratio = (df[compute_unit_field] > 200000).sum() / total_tx if total_tx > 0 else 0
        
        low_risk_count = ((fail_rate < 0.05) and (high_complexity_ratio < 0.1))
        medium_risk_count = ((fail_rate >= 0.05 and fail_rate < 0.2) or (high_complexity_ratio >= 0.1 and high_complexity_ratio < 0.3))
        high_risk_count = ((fail_rate >= 0.2) or (high_complexity_ratio >= 0.3))
        
        # Determine risk level
        if high_risk_count:
            risk_level = "High Risk"
            risk_score = min(100, int(fail_rate * 100 + high_complexity_ratio * 100))
        elif medium_risk_count:
            risk_level = "Medium Risk"
            risk_score = min(60, int(fail_rate * 100 + high_complexity_ratio * 50))
        else:
            risk_level = "Low Risk"
            risk_score = min(30, int(fail_rate * 50))
        
        # Generate key insights
        insights = []
        if probs.bot > 60:
            insights.append(f"{probs.bot:.0f}% bot probability - highly automated behavior detected")
        else:
            insights.append(f"Human trader detected with {100-probs.bot:.0f}% confidence")
        
        if probs.eu_trader > probs.us_trader and probs.eu_trader > probs.asia_trader:
            insights.append("Primary activity in Europe/Africa timezone")
        elif probs.asia_trader > probs.us_trader and probs.asia_trader > probs.eu_trader:
            insights.append("Primary activity in Asia/Pacific timezone")
        elif probs.us_trader > probs.eu_trader and probs.us_trader > probs.asia_trader:
            insights.append("Primary activity in Americas timezone")
        
        insights.append(f"{risk_level} profile with sophisticated patterns")
        
        if probs.professional > probs.retail_hobbyist:
            insights.append("Weekday activity suggests professional operations")
        else:
            insights.append("Weekend activity suggests retail/hobbyist trader")
        
        # Add reaction speed insight
        if reaction.total_reaction_pairs > 0:
            if reaction.bot_confidence > 70:
                insights.append(f"⚡ {reaction.bot_confidence:.0f}% bot confidence - {reaction.instant_reactions} instant reactions detected (<5s)")
            elif reaction.bot_confidence > 40:
                insights.append(f"⚡ Moderate automation detected - avg reaction time {reaction.avg_reaction_time:.1f}s")
            else:
                insights.append(f"⚡ Human-like reaction patterns - avg response time {reaction.avg_reaction_time:.1f}s")
        
        # Note: Surveillance exposure score will be added to insights after computation
        # (moved after surveillance_score is computed)
        
        # Determine confidence level
        confidence = "High" if total_tx > 100 else "Medium" if total_tx > 50 else "Low"
        
        # Find most recent transaction timestamp
        most_recent_timestamp = None
        if tx_details_list and isinstance(tx_details_list, list) and len(tx_details_list) > 0:
            # tx_details_list should be sorted with most recent first
            # Format: [{"timestamp": unix_timestamp, "details": {...}}, ...]
            first_tx = tx_details_list[0]
            if isinstance(first_tx, dict):
                # Get the timestamp field (already a Unix timestamp int)
                most_recent_timestamp = first_tx.get('timestamp')
                
                # Convert to ISO format if it's a unix timestamp
                if most_recent_timestamp and isinstance(most_recent_timestamp, (int, float)):
                    from datetime import datetime
                    most_recent_timestamp = datetime.utcfromtimestamp(most_recent_timestamp).isoformat() + 'Z'
        
        # Portfolio (best-effort; attach summary and debug info)
        portfolio_data = {"tokens": [], "totalValue": 0}
        portfolio_summary = {}
        portfolio_debug = {"source": "none"}
        try:
            portfolio_resp = get_jupiter_portfolio(request.wallet)
            portfolio_data = portfolio_resp if isinstance(portfolio_resp, dict) else {"tokens": [], "totalValue": 0}
            tokens = portfolio_data.get("tokens", []) if isinstance(portfolio_data, dict) else []
            portfolio_summary = summarize_portfolio(tokens, portfolio_data.get("totalValue", 0))
            if portfolio_summary:
                portfolio_debug = {"source": "jupiter", "status": "ok"}
            else:
                helius_summary, helius_status = helius_portfolio_summary(request.wallet)
                if helius_summary:
                    portfolio_summary = helius_summary
                    portfolio_debug = {"source": "helius", **(helius_status or {})}
                else:
                    portfolio_debug = {"source": "helius_failed", **(helius_status or {})}
            if not portfolio_summary:
                portfolio_summary = {}
                if portfolio_debug.get("source") == "none":
                    portfolio_debug = {"source": "none", "status": "empty"}
        except Exception as e:
            portfolio_data = {"tokens": [], "totalValue": 0}
            portfolio_summary = {}
            portfolio_debug = {"source": "exception", "error": str(e)[:120]}

        # Net worth + composition (non-USD-first; uses Helius balances)
        networth = compute_networth_breakdown(request.wallet)

        # Exact(ish) trading PnL and income sources from Helius Enhanced Transactions (parsed)
        # Reuse enhanced_all when we already fetched it (Vercel Helius-primary path)
        if not enhanced_all:
            helius_limit = min(max(request.limit, 100), 100)  # cap at 100 per Helius docs
            enhanced_all, all_dbg = helius_get_transactions(request.wallet, limit=helius_limit)

        # Detect swaps: prefer Helius parsed events, fallback to delta-based detection
        swap_events = detect_swaps_from_helius(enhanced_all)
        if not swap_events:
            # Fallback: enhanced delta when Vercel (no RPC tx_details_map), else RPC delta
            if use_helius_primary and enhanced_all:
                swap_events = detect_swaps_delta_from_enhanced(request.wallet, enhanced_all)
                all_dbg["swap_method"] = "enhanced_delta"
            else:
                swap_events = detect_swaps_delta(request.wallet, tx_details_map)
                all_dbg["swap_method"] = "delta_based"
        else:
            all_dbg["swap_method"] = "helius_parsed"
        
        trading_pnl = compute_token_trading_pnl_fifo(swap_events)
        trading_pnl["debug"]["helius_swaps"] = all_dbg
        trading_pnl["debug"]["swaps_count"] = len(swap_events)

        income_sources = compute_income_sources_from_enhanced(request.wallet, enhanced_all)
        income_sources["debug"] = all_dbg
        income_sources["debug"]["tx_count"] = len(enhanced_all)

        # Compute surveillance exposure score
        swap_count = len(swap_events)
        # Get memecoin ratio from portfolio or networth
        memecoin_ratio = 0
        if isinstance(portfolio_summary, dict):
            memecoin_ratio = portfolio_summary.get("memePct", 0)
        if memecoin_ratio == 0 and isinstance(networth, dict):
            # Fallback to token count ratio if portfolio data unavailable
            total_tokens = networth.get("token_count", 0)
            meme_tokens = networth.get("meme_token_count", 0)
            if total_tokens > 0:
                memecoin_ratio = (meme_tokens / total_tokens) * 100
        
        surveillance_score = compute_surveillance_exposure_score(
            swap_count=swap_count,
            memecoin_ratio=memecoin_ratio,
            hourly_counts=hourly_counts,
            opsec_data=opsec_data if isinstance(opsec_data, dict) else {},
            mempool_data=mempool_data if isinstance(mempool_data, dict) else {},
            income_sources=income_sources if isinstance(income_sources, dict) else {},
            portfolio_summary=portfolio_summary if isinstance(portfolio_summary, dict) else {}
        )
        
        # Ensure surveillance_score is a dict
        if not isinstance(surveillance_score, dict):
            surveillance_score = {"surveillance_score": 0, "risk_level": "UNKNOWN", "top_leak_vectors": []}
        
        # Add surveillance exposure insight
        score_value = surveillance_score.get("surveillance_score", 0) if isinstance(surveillance_score, dict) else 0
        if score_value >= 70:
            insights.append(f"🔍 Surveillance Exposure: {score_value:.0f}/100 (HIGH) - Wallet leaks enough behavioral data to be uniquely fingerprinted")
        elif score_value >= 40:
            insights.append(f"🔍 Surveillance Exposure: {score_value:.0f}/100 (MEDIUM) - Moderate behavioral fingerprinting risk")
        else:
            insights.append(f"🔍 Surveillance Exposure: {score_value:.0f}/100 (LOW) - Limited exposure signals detected")

        # Ego-network analysis (linked wallets)
        ego_network = analyze_ego_network(request.wallet, tx_details_map, limit=min(100, request.limit))

        # Notable transactions: use enhanced-based when Helius-primary (Vercel) for full data
        if use_helius_primary and enhanced_all:
            notable_transactions = get_notable_transactions_from_enhanced(request.wallet, enhanced_all)
        else:
            notable_transactions = get_notable_transactions(request.wallet, tx_details_map, signatures)

        return {
            "wallet": request.wallet,
            "chain": "solana",
            "total_transactions": total_tx,
            "confidence": confidence,
            "most_recent_transaction": most_recent_timestamp,
            "activity_pattern": {
                "hourly": hourly_counts,
                "daily": daily_counts
            },
            "geographic_origin": {
                "europe": round(probs.eu_trader, 2),
                "americas": round(probs.us_trader, 2),
                "asia_pacific": round(probs.asia_trader, 2),
                "other": round(100 - probs.eu_trader - probs.us_trader - probs.asia_trader, 2)
            },
            "trader_classification": {
                "retail": round(probs.retail_hobbyist, 2),
                "institutional": round(probs.professional, 2),
                "professional": round(probs.professional * 0.5, 2)
            },
            "profile_classification": {
                "bot": round(probs.bot, 2),
                "institutional": round(probs.professional, 2),
                "whale": round(probs.whale, 2),
                "airdrop_farmer": round(probs.degen * 0.5, 2),
                "professional": round(probs.professional * 0.5, 2)
            },
            "transaction_complexity": complexity_data[:200],  # Limit for performance
            "risk_assessment": {
                "level": risk_level,
                "score": risk_score,
                "low_risk": 30 if low_risk_count else 0,
                "medium_risk": 55 if medium_risk_count else 0,
                "high_risk": 2 if high_risk_count else 0
            },
            "surveillance_exposure": surveillance_score,
            "key_insights": insights,
            "mempool_forensics": mempool_data,
            "opsec_failures": opsec_data,
            "portfolio": portfolio_data,
            "portfolio_summary": portfolio_summary,
            "portfolio_debug": portfolio_debug,
            "net_worth": {
                "sol_balance": networth.get("sol_balance", 0) if isinstance(networth, dict) else 0,
                "token_count": networth.get("token_count", 0) if isinstance(networth, dict) else 0,
                "stable_token_count": networth.get("stable_token_count", 0) if isinstance(networth, dict) else 0,
                "meme_token_count": networth.get("meme_token_count", 0) if isinstance(networth, dict) else 0,
                "top_tokens": networth.get("top_tokens", []) if isinstance(networth, dict) else [],
                "total_usd": networth.get("total_usd", 0.0) if isinstance(networth, dict) else 0.0,
                "sol_price": networth.get("sol_price", 0.0) if isinstance(networth, dict) else 0.0,
                "debug": networth.get("debug", {}) if isinstance(networth, dict) else {}
            },
            "token_trading_pnl": trading_pnl,
            "income_sources": income_sources,
            "ego_network": ego_network,
            "notable_transactions": notable_transactions,
            "sleep_window": {
                "start_hour": sleep.start_hour,
                "end_hour": sleep.end_hour,
                "confidence": round(sleep.confidence, 2)
            },
            "reaction_speed": {
                "bot_confidence": round(reaction.bot_confidence, 2),
                "avg_reaction_time": round(reaction.avg_reaction_time, 2),
                "median_reaction_time": round(reaction.median_reaction_time, 2),
                "fastest_reaction": round(reaction.fastest_reaction, 2),
                "instant_reactions": reaction.instant_reactions,
                "fast_reactions": reaction.fast_reactions,
                "human_reactions": reaction.human_reactions,
                "total_pairs": reaction.total_reaction_pairs
            }
        }
    except HTTPException:
        raise
    except AttributeError as e:
        # Catch 'str' object has no attribute 'get' and similar
        print("\n" + "="*60)
        print("ATTRIBUTE ERROR IN /analyze-wallet:")
        print("="*60)
        traceback.print_exc()
        print("="*60 + "\n")
        # Try to provide more context
        error_msg = str(e)
        if "'str' object has no attribute 'get'" in error_msg:
            error_msg = f"Data type mismatch: Expected dict but got string. {error_msg}"
        raise HTTPException(status_code=500, detail=f"Analysis failed: {error_msg}")
    except Exception as e:
        # Print full traceback for debugging
        print("\n" + "="*60)
        print("ERROR IN /analyze-wallet:")
        print("="*60)
        traceback.print_exc()
        print("="*60 + "\n")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}


def summarize_portfolio(tokens: list, total_value: float = 0) -> dict:
    """Lightweight server-side portfolio summary to avoid extra client work."""
    filtered = [t for t in (tokens or []) if isinstance(t, dict) and (t.get("usdValue") or 0) > 0]
    total_tokens = sum(t.get("usdValue", 0) for t in filtered)
    total = total_tokens if total_tokens > 0 else (total_value or 0)
    if total <= 0:
        return {}
    
    stable_symbols = {"USDC", "USDT", "USDH", "PYUSD", "USDS", "DAI"}
    meme_symbols = {"BONK", "WIF", "POPCAT", "MEW", "BOME", "MYRO", "SLERF", "WEN", "GIGA"}
    
    stable = sum(t.get("usdValue", 0) for t in filtered if str(t.get("symbol", "")).upper() in stable_symbols)
    meme = sum(t.get("usdValue", 0) for t in filtered if str(t.get("symbol", "")).upper() in meme_symbols)
    
    top_tokens = sorted(filtered, key=lambda t: t.get("usdValue", 0), reverse=True)[:3]
    top_concentration = (sum(t.get("usdValue", 0) for t in top_tokens) / total) * 100 if total and top_tokens else 0
    
    return {
        "total": total,
        "stablePct": (stable / total) * 100 if total else 0,
        "memePct": (meme / total) * 100 if total else 0,
        "topConcentration": top_concentration,
        "topTokens": [{"symbol": t.get("symbol", ""), "usdValue": t.get("usdValue", 0)} for t in top_tokens]
    }


def helius_portfolio_summary(wallet: str) -> tuple:
    """
    Fallback portfolio summary using Helius token accounts + Jupiter prices.
    Only returns a summary (no token list) to keep it lightweight.
    """
    helius_key = os.getenv("HELIUS_API_KEY")
    if not helius_key:
        return {}, {"error": "missing_helius_key"}
    
    # Fetch token accounts via Helius balances endpoint (includes uiAmount)
    try:
        acc_resp = requests.get(
            f"https://api.helius.xyz/v0/addresses/{wallet}/balances?api-key={helius_key}",
            timeout=12,
            headers={"Accept": "application/json"}
        )
        if acc_resp.status_code != 200:
            return {}, {"error": f"helius_balances_status_{acc_resp.status_code}"}
        acc_json = acc_resp.json()
        tokens = acc_json.get("tokens", [])
        sol_balance = acc_json.get("nativeBalance", 0) / 1e9 if acc_json.get("nativeBalance") else 0
        if not tokens and sol_balance == 0:
            return {}, {"error": "helius_balances_empty"}
    except Exception as e:
        return {}, {"error": f"helius_balances_exception_{str(e)[:60]}"}
    
    # Compute USD values
    enriched = []
    # Collect symbols (and include SOL for pricing)
    symbols = set()
    for t in tokens:
        if not isinstance(t, dict):
            continue
        sym = t.get("symbol")
        if sym:
            symbols.add(sym)
    symbols.add("SOL")
    prices = {}
    price_status = "skipped"
    if symbols:
        try:
            sym_q = ",".join(list(symbols)[:50])  # cap to avoid huge query
            price_resp = requests.get(f"https://price.jup.ag/v4/price?ids={sym_q}", timeout=8)
            if price_resp.status_code == 200:
                price_json = price_resp.json()
                prices = price_json.get("data", {})
                price_status = "jup_ok"
            else:
                price_status = f"price_status_{price_resp.status_code}"
        except Exception:
            price_status = "jup_failed"
            prices = {}
    
    # Fallback: if no prices from Jupiter, try Coingecko for SOL only (others 0)
    if not prices:
        try:
            cg_resp = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", timeout=6)
            if cg_resp.status_code == 200:
                cg_json = cg_resp.json()
                sol_price_val = cg_json.get("solana", {}).get("usd", 0)
                if sol_price_val:
                    prices = {"SOL": {"price": sol_price_val}}
                    price_status = "coingecko_sol"
        except Exception:
            if not prices:
                price_status = "price_all_failed"
    for t in tokens:
        if not isinstance(t, dict):
            continue
        symbol = t.get("symbol", "")
        ui_amt = t.get("uiAmount", 0) or 0
        price_entry = prices.get(symbol) or {}
        price = price_entry.get("price", 0)
        usd_value = ui_amt * price if price else 0
        enriched.append({
            "symbol": symbol,
            "usdValue": usd_value
        })
    
    # Add SOL
    sol_price = (prices.get("SOL") or {}).get("price", 0)
    if sol_balance and sol_price:
        enriched.append({
            "symbol": "SOL",
            "usdValue": sol_balance * sol_price
        })
    
    summary = summarize_portfolio(enriched)
    return summary, {"status": "ok", "price_status": price_status}

@app.get("/error-test")
def error_test():
    """Test endpoint to verify error handling"""
    try:
        # This will always work
        return {"message": "Error handling test passed", "requests_available": True}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


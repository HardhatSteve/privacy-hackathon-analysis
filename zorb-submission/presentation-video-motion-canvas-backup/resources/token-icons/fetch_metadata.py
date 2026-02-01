#!/usr/bin/env python3
import json
import base64
import struct
import requests
from base58 import b58decode, b58encode
import hashlib

METAPLEX_PROGRAM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"

def find_metadata_pda(mint: str) -> str:
    """Derive Metaplex metadata PDA for a mint"""
    from hashlib import sha256
    
    program_id = b58decode(METAPLEX_PROGRAM)
    mint_bytes = b58decode(mint)
    
    # Seeds: ["metadata", program_id, mint]
    seeds = [b"metadata", program_id, mint_bytes]
    
    # Find PDA
    for bump in range(255, -1, -1):
        try:
            seed_bytes = b"".join(seeds) + bytes([bump]) + program_id
            h = sha256(seed_bytes).digest()
            # Check if it's off curve (valid PDA)
            # For simplicity, we'll just try the account
            pda_bytes = sha256(b"".join(seeds) + bytes([bump]) + program_id).digest()
        except:
            continue
    
    # Use known formula for Metaplex metadata PDA
    # Actually let's just use the Metaplex SDK approach via API
    return None

def fetch_metadata_via_das(mint: str):
    """Fetch metadata using DAS API"""
    # Try Helius DAS API (public endpoint)
    try:
        resp = requests.post(
            "https://mainnet.helius-rpc.com/?api-key=15319bf4-5b40-4958-ac8d-6313aa55eb92",
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getAsset",
                "params": {"id": mint}
            },
            timeout=10
        )
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

mints = {
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": "JitoSOL",
    "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ": "dSOL",
    "vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7": "vSOL",
    "Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn": "dzSOL"
}

for mint, name in mints.items():
    print(f"\n{'='*60}")
    print(f"{name} ({mint})")
    print('='*60)
    result = fetch_metadata_via_das(mint)
    print(json.dumps(result, indent=2))

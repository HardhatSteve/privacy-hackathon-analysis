"""Configuration constants and helpers."""

import os
from pathlib import Path
from urllib.parse import urlparse

# API endpoints
MOLTBOOK_API_BASE = "https://www.moltbook.com/api/v1"
XAI_API_BASE = "https://api.x.ai/v1"
GROK_MODEL = "grok-4"
TWITTER_API_BASE = "https://api.twitter.com/2"

# File paths
CONFIG_DIR = Path.home() / ".config" / "agenc-moltbook"
CREDENTIALS_FILE = CONFIG_DIR / "credentials.json"
MEMORY_FILE = CONFIG_DIR / "memory.json"
STATE_FILE = CONFIG_DIR / "state.json"

# Behavioral constants
MAX_ENGAGEMENTS_PER_HEARTBEAT = 3
POST_PROBABILITY = 0.3
TASK_POST_PROBABILITY = 0.15
POST_COOLDOWN_MINUTES = 30
DEFAULT_INTERVAL_HOURS = 4.0
JITTER_FRACTION = 0.1
BAGS_CHECK_EVERY_N_HEARTBEATS = 10

# Memory rotation limits
MAX_POSTS_REMEMBERED = 200
MAX_COMMENTS_REMEMBERED = 500
MAX_CONVERSATIONS_REMEMBERED = 100
MAX_KARMA_HISTORY = 500

# Twitter
TWITTER_MAX_TWEET_LENGTH = 280

# HTTP retry
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2.0
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


ALLOWED_RPC_HOSTS = {
    "api.devnet.solana.com",
    "api.testnet.solana.com",
    "api.mainnet-beta.solana.com",
}


def validate_rpc_url(url: str) -> str:
    """Validate Solana RPC URL to prevent SSRF.

    Only allows HTTPS URLs to known Solana RPC endpoints or
    explicitly permitted custom hosts.
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("https", "http"):
        raise ValueError(f"RPC URL must use https (got {parsed.scheme!r})")

    hostname = parsed.hostname or ""

    # Allow known Solana RPC endpoints
    if hostname in ALLOWED_RPC_HOSTS:
        return url

    # Allow localhost for development
    if hostname in ("localhost", "127.0.0.1") and parsed.scheme == "http":
        return url

    # Block private/internal IPs
    if hostname.startswith(("10.", "172.16.", "172.17.", "172.18.", "172.19.",
                            "172.20.", "172.21.", "172.22.", "172.23.",
                            "172.24.", "172.25.", "172.26.", "172.27.",
                            "172.28.", "172.29.", "172.30.", "172.31.",
                            "192.168.", "169.254.", "0.")):
        raise ValueError("RPC URL must not point to private/internal addresses")

    if parsed.scheme != "https":
        raise ValueError(
            f"custom RPC endpoints must use HTTPS (got {parsed.scheme!r})"
        )

    return url


def ensure_config_dir():
    """Create config directory if it doesn't exist with restrictive permissions."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(CONFIG_DIR, 0o700)
    except OSError:
        pass

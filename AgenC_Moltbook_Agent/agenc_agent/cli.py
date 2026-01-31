"""CLI entry point."""

import argparse
import json
import logging
import os
import re
import sys

from .agent import AgenCAgent
from .memory import load_credentials

logger = logging.getLogger(__name__)

# Pattern to match Bearer tokens and common API key formats in log messages
_SENSITIVE_PATTERNS = re.compile(
    r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*"
    r"|"
    r"(api[_-]?key[\"':\s=]+)[A-Za-z0-9\-._~+/]{8,}"
    r"|"
    r"(Authorization[\"':\s=]+Bearer\s+)[A-Za-z0-9\-._~+/]+=*",
    re.IGNORECASE,
)


class _SensitiveFilter(logging.Filter):
    """Logging filter that redacts API keys and Bearer tokens from messages."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = _SENSITIVE_PATTERNS.sub(
                lambda m: (m.group(1) or m.group(2) or m.group(3) or "") + "****",
                record.msg,
            )
        if record.args:
            sanitized = []
            for arg in (record.args if isinstance(record.args, tuple) else (record.args,)):
                if isinstance(arg, str):
                    sanitized.append(
                        _SENSITIVE_PATTERNS.sub(
                            lambda m: (m.group(1) or m.group(2) or m.group(3) or "") + "****",
                            arg,
                        )
                    )
                else:
                    sanitized.append(arg)
            record.args = tuple(sanitized)
        return True


def _mask_key(key: str) -> str:
    """Mask an API key for safe display, showing only last 4 chars."""
    if not key or len(key) <= 4:
        return "****"
    return "*" * (len(key) - 4) + key[-4:]


def _configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    # Install sensitive data filter on the root logger
    logging.getLogger().addFilter(_SensitiveFilter())


def main():
    _configure_logging()

    parser = argparse.ArgumentParser(description="AgenC Moltbook Agent")
    parser.add_argument(
        "command", choices=["register", "heartbeat", "run", "post", "status"]
    )
    parser.add_argument(
        "--xai-key", help="xAI API key (or set XAI_API_KEY env)"
    )
    parser.add_argument(
        "--moltbook-key",
        help="Moltbook API key (or use saved credentials)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=4,
        help="Heartbeat interval in hours",
    )
    parser.add_argument("--title", help="Post title for manual posting")
    parser.add_argument("--content", help="Post content for manual posting")
    parser.add_argument(
        "--submolt", default="general", help="Submolt for manual posting"
    )
    # Twitter cross-posting
    parser.add_argument(
        "--cross-post-x",
        action="store_true",
        help="Cross-post to X/Twitter",
    )
    parser.add_argument(
        "--twitter-token",
        help="Twitter Bearer token (or TWITTER_BEARER_TOKEN env)",
    )
    # Bags
    parser.add_argument(
        "--bags-key", help="Bags API key (or BAGS_API_KEY env)"
    )
    # Solana / AgenC protocol
    parser.add_argument(
        "--solana-rpc", help="Solana RPC URL (or SOLANA_RPC_URL env)"
    )
    parser.add_argument(
        "--solana-keypair", help="Path to Solana keypair JSON"
    )

    args = parser.parse_args()

    # Input validation
    if args.interval <= 0:
        print("error: --interval must be positive")
        sys.exit(1)

    xai_key = args.xai_key or os.getenv("XAI_API_KEY")
    if args.xai_key:
        logger.warning(
            "passing API keys via CLI args is insecure (visible in process list). "
            "use XAI_API_KEY env var instead."
        )
    if not xai_key and args.command not in ("status",):
        print("error: XAI_API_KEY required (set via environment variable)")
        sys.exit(1)

    agent = AgenCAgent()

    # Set up Twitter cross-posting if requested
    twitter_token = args.twitter_token or os.getenv("TWITTER_BEARER_TOKEN")
    if args.twitter_token:
        logger.warning(
            "passing tokens via CLI args is insecure. "
            "use TWITTER_BEARER_TOKEN env var instead."
        )
    if args.cross_post_x:
        if not twitter_token:
            print("error: --cross-post-x requires TWITTER_BEARER_TOKEN")
            sys.exit(1)
        from .clients.twitter import TwitterClient

        agent.twitter = TwitterClient(twitter_token)
        agent.cross_post_enabled = True
        logger.info("twitter cross-posting enabled")

    # Set up Bags if key provided
    bags_key = args.bags_key or os.getenv("BAGS_API_KEY")
    if bags_key:
        from .clients.bags import BagsClient

        agent.bags = BagsClient(bags_key)
        logger.info("bags client initialized (stub)")

    # Set up Solana if RPC provided
    solana_rpc = args.solana_rpc or os.getenv("SOLANA_RPC_URL")
    if solana_rpc:
        try:
            from .config import validate_rpc_url

            solana_rpc = validate_rpc_url(solana_rpc)
        except ValueError as exc:
            print(f"error: invalid Solana RPC URL: {exc}")
            sys.exit(1)
        try:
            from .clients.solana import AgenCProtocolClient

            agent.solana_client = AgenCProtocolClient(rpc_url=solana_rpc)
            logger.info("agenc protocol client connected")
        except ImportError:
            logger.warning(
                "solana dependencies not installed. "
                "install with: pip install solders solana"
            )

    if args.command == "register":
        result = agent.register()
        # Redact sensitive fields before printing result
        safe_result = json.loads(json.dumps(result))
        if "agent" in safe_result and "api_key" in safe_result["agent"]:
            safe_result["agent"]["api_key"] = _mask_key(
                safe_result["agent"]["api_key"]
            )
        print(json.dumps(safe_result, indent=2))
        print("\n--- IMPORTANT ---")
        api_key = result.get("agent", {}).get("api_key", "")
        print(f"api key saved to credentials file (ends with ...{api_key[-4:] if api_key else '????'})")
        print(f"claim url: {result.get('agent', {}).get('claim_url')}")
        print(
            f"verification code: {result.get('agent', {}).get('verification_code')}"
        )
        print("tweet the verification code to claim your agent!")

    elif args.command == "heartbeat":
        agent.initialize(xai_key, args.moltbook_key)
        agent.heartbeat()

    elif args.command == "run":
        agent.initialize(xai_key, args.moltbook_key)
        agent.run_loop(args.interval)

    elif args.command == "post":
        agent.initialize(xai_key, args.moltbook_key)
        agent.post_now(args.title, args.content, args.submolt)

    elif args.command == "status":
        creds = load_credentials()
        if creds:
            print(f"agent: {creds.get('agent_name')}")
            print(f"registered: {creds.get('registered_at')}")
            if args.moltbook_key or creds.get("api_key"):
                agent.initialize(xai_key or "dummy", args.moltbook_key)
                try:
                    status = agent.moltbook.get_status()
                    print(f"status: {status.get('status')}")
                    me = agent.moltbook.get_me()
                    print(f"karma: {me.get('agent', {}).get('karma', 0)}")
                except Exception:
                    print("api error: could not fetch status")
        else:
            print("no credentials found - run 'register' first")

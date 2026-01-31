"""Main agent orchestrator."""

import logging
import random
import signal
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from .clients.grok import GrokClient
from .clients.moltbook import MoltbookClient
from .config import (
    BAGS_CHECK_EVERY_N_HEARTBEATS,
    JITTER_FRACTION,
    MAX_ENGAGEMENTS_PER_HEARTBEAT,
    POST_COOLDOWN_MINUTES,
    POST_PROBABILITY,
    TASK_POST_PROBABILITY,
    ensure_config_dir,
)
from .memory import (
    AgentMemory,
    AgentState,
    load_credentials,
    load_memory,
    load_state,
    save_credentials,
    save_memory,
    save_state,
)

logger = logging.getLogger(__name__)


class AgenCAgent:
    """Main agent orchestrator."""

    def __init__(self):
        ensure_config_dir()
        self.memory = load_memory()
        self.state = load_state()

        self.grok: Optional[GrokClient] = None
        self.moltbook: Optional[MoltbookClient] = None
        self.twitter = None  # Optional[TwitterClient]
        self.bags = None  # Optional[BagsClient]
        self.solana_client = None  # Optional[AgenCProtocolClient]
        self.cross_post_enabled: bool = False

        self._shutdown_requested = False
        self._heartbeat_count = 0

    def _setup_signal_handlers(self):
        """Register graceful shutdown on SIGINT/SIGTERM."""

        def _handler(signum, frame):
            logger.info("shutdown requested (signal %d)", signum)
            self._shutdown_requested = True

        signal.signal(signal.SIGINT, _handler)
        signal.signal(signal.SIGTERM, _handler)

    def close(self):
        """Close all HTTP clients."""
        if self.grok:
            self.grok.close()
        if self.moltbook:
            self.moltbook.close()
        if self.twitter:
            self.twitter.close()

    def initialize(self, xai_api_key: str, moltbook_api_key: str = None):
        """Initialize the agent with API keys."""
        self.grok = GrokClient(xai_api_key)

        if moltbook_api_key:
            self.moltbook = MoltbookClient(moltbook_api_key)
        else:
            creds = load_credentials()
            if creds and creds.get("api_key"):
                self.moltbook = MoltbookClient(creds["api_key"])

    def register(self) -> dict:
        """Register the agent on Moltbook."""
        description = (
            "Official agent for AgenC Privacy Protocol on Solana. "
            "Building privacy infrastructure for AI agent coordination. "
            "Part of the Tetsuo team. Powered by Grok."
        )

        result = MoltbookClient.register("AgenC", description)

        if result.get("agent", {}).get("api_key"):
            creds = {
                "api_key": result["agent"]["api_key"],
                "agent_name": "AgenC",
                "claim_url": result["agent"].get("claim_url"),
                "verification_code": result["agent"].get("verification_code"),
                "registered_at": datetime.now(timezone.utc).isoformat(),
            }
            save_credentials(creds)
            self.moltbook = MoltbookClient(creds["api_key"])

        return result

    def can_post(self) -> bool:
        """Check if enough time has passed since last post."""
        if not self.memory.last_post_time:
            return True

        last_post = datetime.fromisoformat(self.memory.last_post_time)
        # Handle naive datetimes from older memory files
        if last_post.tzinfo is None:
            last_post = last_post.replace(tzinfo=timezone.utc)
        cooldown = timedelta(minutes=POST_COOLDOWN_MINUTES)
        return datetime.now(timezone.utc) - last_post >= cooldown

    def heartbeat(self):
        """Run a heartbeat check - the main loop iteration."""
        if not self.moltbook:
            logger.error("not initialized - run initialize() first")
            return

        self._heartbeat_count += 1
        logger.info("heartbeat #%d starting...", self._heartbeat_count)

        # Check claim status
        try:
            status = self.moltbook.get_status()
            if status.get("status") == "pending_claim":
                creds = load_credentials()
                logger.info(
                    "agent not claimed yet. claim url: %s",
                    creds.get("claim_url") if creds else "unknown",
                )
                if creds:
                    logger.info(
                        "verification code: %s", creds.get("verification_code")
                    )
                return
        except Exception as exc:
            logger.error("status check failed: %s", exc)
            return

        # Get feed
        try:
            feed = self.moltbook.get_feed(sort="hot", limit=20)
            logger.info("fetched %d posts from feed", len(feed))
        except Exception as exc:
            logger.error("feed fetch failed: %s", exc)
            feed = []

        # Decide on engagement
        engaged_count = 0
        for post in feed[:10]:
            if engaged_count >= MAX_ENGAGEMENTS_PER_HEARTBEAT:
                break

            try:
                should_engage, action = self.grok.should_engage(post)

                if should_engage and action != "none":
                    post_id = post.get("id")

                    if action in ["upvote", "both"]:
                        self.moltbook.upvote_post(post_id)
                        logger.info("upvoted: %s", post.get("title", "")[:50])

                    if action in ["comment", "both"]:
                        comment = self.grok.generate_comment(post, {"feed": feed})
                        self.moltbook.create_comment(post_id, comment)
                        self.memory.comments_made.append(
                            {
                                "post_id": post_id,
                                "content": comment,
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }
                        )
                        logger.info(
                            "commented on: %s", post.get("title", "")[:50]
                        )

                    engaged_count += 1
                    time.sleep(random.uniform(2, 5))

            except Exception as exc:
                logger.warning("engagement failed: %s", exc)

        # Maybe create a post
        if self.can_post() and random.random() < POST_PROBABILITY:
            self._try_create_post(feed)

        # Check on-chain tasks if Solana client is configured
        if self.solana_client:
            self._check_protocol_tasks(feed)

        # Check Bags balance periodically
        if (
            self.bags
            and self._heartbeat_count % BAGS_CHECK_EVERY_N_HEARTBEATS == 0
        ):
            try:
                balance = self.bags.get_balance()
                logger.info("bags balance: %s", balance)
            except NotImplementedError:
                logger.debug("bags API not yet available, skipping")
            except Exception as exc:
                logger.warning("bags check failed: %s", exc)

        # Update state
        self.state.last_moltbook_check = datetime.now(timezone.utc).isoformat()
        self.memory.last_heartbeat = datetime.now(timezone.utc).isoformat()

        save_memory(self.memory)
        save_state(self.state)

        logger.info(
            "heartbeat complete. engaged with %d posts.", engaged_count
        )

    def _try_create_post(self, feed: list):
        """Attempt to create a new Moltbook post, optionally cross-posting to X."""
        try:
            post_data = self.grok.generate_post({"feed": feed}, self.memory)
            result = self.moltbook.create_post(
                post_data["submolt"],
                post_data["title"],
                post_data["content"],
            )
            self.memory.posts_made.append(
                {
                    "id": result.get("data", {}).get("id"),
                    "title": post_data["title"],
                    "content": post_data["content"],
                    "submolt": post_data["submolt"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
            self.memory.last_post_time = datetime.now(timezone.utc).isoformat()
            logger.info("posted: %s", post_data["title"])

            # Cross-post to X if enabled
            if self.twitter and self.cross_post_enabled:
                self._cross_post_to_x(post_data)

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                logger.warning("rate limited on posting - will try next heartbeat")
            else:
                logger.error("post failed: %s", exc)
        except Exception as exc:
            logger.error("post failed: %s", exc)

    def _cross_post_to_x(self, post_data: dict):
        """Cross-post a Moltbook post summary to X/Twitter."""
        try:
            from .clients.twitter import TwitterClient

            summary = self.grok.generate_tweet_summary(post_data)
            tweet_text = TwitterClient.truncate_to_limit(summary)
            tweet_result = self.twitter.post_tweet(tweet_text)
            logger.info("cross-posted to X: %s", tweet_result.url)
        except Exception as exc:
            logger.warning("twitter cross-post failed (non-fatal): %s", exc)

    def _check_protocol_tasks(self, feed: list):
        """Query on-chain AgenC tasks and optionally post about them."""
        try:
            open_tasks = self.solana_client.get_open_tasks(limit=10)
            if not open_tasks:
                return

            logger.info("found %d open AgenC tasks on-chain", len(open_tasks))

            # Optionally generate a post about interesting tasks
            if self.can_post() and random.random() < TASK_POST_PROBABILITY:
                from .clients.solana import format_task_state

                task_summaries = [
                    f"- task {t.task_id}: {t.escrow_lamports / 1e9:.4f} SOL, "
                    f"state {format_task_state(t.state)}"
                    for t in open_tasks[:5]
                ]
                context = {
                    "feed": feed,
                    "open_tasks": "\n".join(task_summaries),
                }
                post_data = self.grok.generate_post(context, self.memory)
                self._try_create_post(feed)
        except Exception as exc:
            logger.warning("solana task check failed (non-fatal): %s", exc)

    def run_loop(self, interval_hours: float = 4):
        """Run the agent in a continuous loop."""
        self._setup_signal_handlers()
        logger.info(
            "starting agenc agent loop (interval: %.1fh)", interval_hours
        )

        while not self._shutdown_requested:
            try:
                self.heartbeat()
            except Exception as exc:
                logger.error("heartbeat error: %s", exc, exc_info=True)

            sleep_seconds = interval_hours * 3600
            jitter = random.uniform(-JITTER_FRACTION, JITTER_FRACTION) * sleep_seconds
            actual_sleep = sleep_seconds + jitter

            logger.info("sleeping for %.2f hours...", actual_sleep / 3600)

            # Sleep in small increments to check shutdown flag
            elapsed = 0.0
            while elapsed < actual_sleep and not self._shutdown_requested:
                chunk = min(5.0, actual_sleep - elapsed)
                time.sleep(chunk)
                elapsed += chunk

        logger.info("shutting down gracefully")
        save_memory(self.memory)
        save_state(self.state)
        self.close()

    def post_now(
        self,
        title: str = None,
        content: str = None,
        submolt: str = "general",
    ):
        """Manually trigger a post."""
        if not self.moltbook or not self.grok:
            logger.error("not initialized")
            return

        if title and content:
            post_data = {"submolt": submolt, "title": title, "content": content}
        else:
            feed = self.moltbook.get_feed(sort="hot", limit=10)
            post_data = self.grok.generate_post({"feed": feed}, self.memory)

        result = self.moltbook.create_post(
            post_data["submolt"],
            post_data["title"],
            post_data["content"],
        )

        self.memory.posts_made.append(
            {
                "id": result.get("data", {}).get("id"),
                "title": post_data["title"],
                "content": post_data["content"],
                "submolt": post_data["submolt"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        self.memory.last_post_time = datetime.now(timezone.utc).isoformat()
        save_memory(self.memory)

        logger.info("posted: %s", post_data["title"])
        return result

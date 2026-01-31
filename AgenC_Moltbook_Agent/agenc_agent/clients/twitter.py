"""Twitter/X API v2 client for cross-posting."""

import logging
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from ..config import TWITTER_API_BASE, TWITTER_MAX_TWEET_LENGTH
from ..http_utils import request_with_retry

logger = logging.getLogger(__name__)


@dataclass
class TweetResult:
    """Result from posting a tweet."""

    tweet_id: str
    url: str


class TwitterClient:
    """Twitter API v2 client using Bearer token authentication.

    Modeled after the Rust TwitterExecutor at
    AgenC-operator/crates/operator-core/src/executor/twitter.rs
    """

    TWEET_URL = f"{TWITTER_API_BASE}/tweets"

    def __init__(self, bearer_token: str):
        self.bearer_token = bearer_token
        self.client = httpx.Client(timeout=30.0)

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    @staticmethod
    def truncate_to_limit(
        text: str, limit: int = TWITTER_MAX_TWEET_LENGTH
    ) -> str:
        """Truncate text to Twitter's character limit with ellipsis if needed."""
        if len(text) <= limit:
            return text
        return text[: limit - 1] + "\u2026"

    def post_tweet(
        self,
        text: str,
        reply_to: Optional[str] = None,
    ) -> TweetResult:
        """Post a single tweet."""
        if len(text) > TWITTER_MAX_TWEET_LENGTH:
            raise ValueError(
                f"tweet exceeds {TWITTER_MAX_TWEET_LENGTH} characters "
                f"({len(text)}). use truncate_to_limit() first."
            )

        body: dict = {"text": text}
        if reply_to:
            body["reply"] = {"in_reply_to_tweet_id": reply_to}

        response = request_with_retry(
            self.client,
            "POST",
            self.TWEET_URL,
            headers={
                "Authorization": f"Bearer {self.bearer_token}",
                "Content-Type": "application/json",
            },
            json=body,
        )
        response.raise_for_status()
        data = response.json()
        tweet_id = data["data"]["id"]
        url = f"https://twitter.com/i/status/{tweet_id}"
        logger.info("tweet posted: %s", url)
        return TweetResult(tweet_id=tweet_id, url=url)

    def post_thread(self, tweets: list[str]) -> list[TweetResult]:
        """Post a thread of tweets, chaining via reply_to."""
        if not tweets:
            raise ValueError("thread must have at least one tweet")
        for i, t in enumerate(tweets):
            if len(t) > TWITTER_MAX_TWEET_LENGTH:
                raise ValueError(
                    f"tweet {i + 1} exceeds {TWITTER_MAX_TWEET_LENGTH} chars"
                )

        results: list[TweetResult] = []
        last_id: Optional[str] = None

        for i, text in enumerate(tweets):
            result = self.post_tweet(text, reply_to=last_id)
            last_id = result.tweet_id
            results.append(result)
            if i < len(tweets) - 1:
                time.sleep(0.5)

        logger.info("thread posted: %d tweets", len(results))
        return results

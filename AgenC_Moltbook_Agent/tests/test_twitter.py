"""Tests for TwitterClient."""

import pytest
from agenc_agent.clients.twitter import TwitterClient, TweetResult
from agenc_agent.config import TWITTER_MAX_TWEET_LENGTH


class TestTruncateToLimit:
    def test_short_text_unchanged(self):
        assert TwitterClient.truncate_to_limit("hello") == "hello"

    def test_exact_limit_unchanged(self):
        text = "x" * TWITTER_MAX_TWEET_LENGTH
        assert TwitterClient.truncate_to_limit(text) == text

    def test_over_limit_truncated(self):
        text = "x" * 300
        result = TwitterClient.truncate_to_limit(text)
        assert len(result) == TWITTER_MAX_TWEET_LENGTH
        assert result.endswith("\u2026")

    def test_custom_limit(self):
        text = "hello world"
        result = TwitterClient.truncate_to_limit(text, limit=5)
        assert result == "hell\u2026"
        assert len(result) == 5

    def test_empty_string(self):
        assert TwitterClient.truncate_to_limit("") == ""


class TestTweetResult:
    def test_dataclass(self):
        r = TweetResult(tweet_id="123", url="https://twitter.com/i/status/123")
        assert r.tweet_id == "123"
        assert "123" in r.url

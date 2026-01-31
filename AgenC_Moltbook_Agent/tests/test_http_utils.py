"""Tests for HTTP retry utilities."""

import pytest
from agenc_agent.config import RETRYABLE_STATUS_CODES


class TestRetryConfig:
    def test_retryable_codes(self):
        assert 429 in RETRYABLE_STATUS_CODES  # rate limit
        assert 500 in RETRYABLE_STATUS_CODES  # internal server error
        assert 502 in RETRYABLE_STATUS_CODES  # bad gateway
        assert 503 in RETRYABLE_STATUS_CODES  # service unavailable
        assert 504 in RETRYABLE_STATUS_CODES  # gateway timeout
        assert 200 not in RETRYABLE_STATUS_CODES
        assert 404 not in RETRYABLE_STATUS_CODES

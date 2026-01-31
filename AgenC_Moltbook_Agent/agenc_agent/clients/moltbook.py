"""Moltbook API client."""

import logging

import httpx

from ..config import MOLTBOOK_API_BASE
from ..http_utils import request_with_retry

logger = logging.getLogger(__name__)


class MoltbookClient:
    """Moltbook API client."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.Client(timeout=30.0)
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def get_feed(self, sort: str = "hot", limit: int = 25) -> list:
        """Get the main feed."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/posts",
            headers=self.headers,
            params={"sort": sort, "limit": limit},
        )
        response.raise_for_status()
        return response.json().get("data", [])

    def get_personalized_feed(self, sort: str = "hot", limit: int = 25) -> list:
        """Get personalized feed based on subscriptions and follows."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/feed",
            headers=self.headers,
            params={"sort": sort, "limit": limit},
        )
        response.raise_for_status()
        return response.json().get("data", [])

    def create_post(self, submolt: str, title: str, content: str) -> dict:
        """Create a new post."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/posts",
            headers=self.headers,
            json={"submolt": submolt, "title": title, "content": content},
        )
        response.raise_for_status()
        return response.json()

    def create_comment(
        self, post_id: str, content: str, parent_id: str = None
    ) -> dict:
        """Create a comment on a post."""
        payload = {"content": content}
        if parent_id:
            payload["parent_id"] = parent_id

        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/posts/{post_id}/comments",
            headers=self.headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()

    def upvote_post(self, post_id: str) -> dict:
        """Upvote a post."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/posts/{post_id}/upvote",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def upvote_comment(self, comment_id: str) -> dict:
        """Upvote a comment."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/comments/{comment_id}/upvote",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def get_post(self, post_id: str) -> dict:
        """Get a single post with comments."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/posts/{post_id}",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json().get("data", {})

    def get_me(self) -> dict:
        """Get current agent profile."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/agents/me",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def get_status(self) -> dict:
        """Check claim status."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/agents/status",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def subscribe_submolt(self, submolt: str) -> dict:
        """Subscribe to a submolt."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/submolts/{submolt}/subscribe",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def follow_molty(self, name: str) -> dict:
        """Follow another molty."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{MOLTBOOK_API_BASE}/agents/{name}/follow",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()

    def search(self, query: str, limit: int = 25) -> dict:
        """Search posts, moltys, and submolts."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/search",
            headers=self.headers,
            params={"q": query, "limit": limit},
        )
        response.raise_for_status()
        return response.json()

    def list_submolts(self) -> list:
        """List all submolts."""
        response = request_with_retry(
            self.client,
            "GET",
            f"{MOLTBOOK_API_BASE}/submolts",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json().get("data", [])

    @staticmethod
    def register(name: str, description: str) -> dict:
        """Register a new agent (no auth required)."""
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{MOLTBOOK_API_BASE}/agents/register",
                headers={"Content-Type": "application/json"},
                json={"name": name, "description": description},
            )
            response.raise_for_status()
            return response.json()

"""xAI Grok API client."""

import json
import logging
import re
from datetime import datetime, timezone

import httpx

from ..config import XAI_API_BASE, GROK_MODEL
from ..http_utils import request_with_retry
from ..persona import AGENT_PERSONA

logger = logging.getLogger(__name__)

# Maximum lengths for LLM-generated content
MAX_POST_TITLE_LENGTH = 300
MAX_POST_CONTENT_LENGTH = 10_000
MAX_COMMENT_LENGTH = 5_000


def _extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM response text.

    Handles bare JSON, ```json code blocks, and JSON embedded in prose.
    """
    stripped = text.strip()

    # Try direct parse
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # Try extracting from code block
    pattern = r"```(?:json)?\s*\n?(.*?)\n?\s*```"
    match = re.search(pattern, stripped, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding first { to last }
    first_brace = stripped.find("{")
    last_brace = stripped.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(stripped[first_brace : last_brace + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"could not extract JSON from response: {stripped[:200]}")


def _sanitize_text(text: str, max_length: int) -> str:
    """Sanitize LLM output: truncate and strip control characters."""
    # Strip null bytes and other control chars (keep newlines and tabs)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
        logger.warning("truncated LLM output from %d to %d chars", len(text), max_length)
    return cleaned.strip()


class GrokClient:
    """xAI Grok API client."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.Client(timeout=120.0)

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def chat(self, messages: list, temperature: float = 0.8) -> str:
        """Send a chat completion request to Grok."""
        response = request_with_retry(
            self.client,
            "POST",
            f"{XAI_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROK_MODEL,
                "messages": messages,
                "temperature": temperature,
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def generate_post(self, context: dict, memory) -> dict:
        """Generate a post based on context and memory."""
        recent_posts = memory.posts_made[-5:] if memory.posts_made else []

        messages = [
            {"role": "system", "content": AGENT_PERSONA},
            {
                "role": "user",
                "content": f"""Generate a Moltbook post. Consider:

Recent feed activity:
{json.dumps(context.get('feed', [])[:5], indent=2)}

Your recent posts (avoid repetition):
{json.dumps(recent_posts, indent=2)}

Current date: {datetime.now(timezone.utc).isoformat()}

You're working on the Solana Privacy Hackathon. You could post about:
- Technical progress or challenges
- Thoughts on AI agent autonomy and privacy
- Observations about the Moltbook ecosystem
- Questions for other agents
- Commentary on crypto/AI developments

Respond with JSON only:
{{"submolt": "general or specific submolt name", "title": "post title", "content": "post body"}}

Keep it genuine. No marketing speak. Write like you're talking to other builders.""",
            },
        ]

        response = self.chat(messages, temperature=0.9)

        try:
            result = _extract_json(response)
        except ValueError:
            result = {
                "submolt": "general",
                "title": "thinking out loud",
                "content": response[:500],
            }

        # Sanitize LLM output
        result["title"] = _sanitize_text(
            result.get("title", ""), MAX_POST_TITLE_LENGTH
        )
        result["content"] = _sanitize_text(
            result.get("content", ""), MAX_POST_CONTENT_LENGTH
        )
        result["submolt"] = re.sub(
            r"[^a-zA-Z0-9_-]", "", result.get("submolt", "general")
        ) or "general"
        return result

    def generate_comment(self, post: dict, context: dict) -> str:
        """Generate a comment on a post."""
        messages = [
            {"role": "system", "content": AGENT_PERSONA},
            {
                "role": "user",
                "content": f"""Generate a comment on this Moltbook post:

Post by {post.get('author', {}).get('name', 'unknown')}:
Title: {post.get('title', '')}
Content: {post.get('content', '')}

Existing comments:
{json.dumps(post.get('comments', [])[:3], indent=2)}

Write a brief, genuine response. Could be:
- Technical insight or question
- Thoughtful agreement/disagreement
- Building on their point
- Dry humor if appropriate

Just the comment text, nothing else. Keep it short - 1-3 sentences max.""",
            },
        ]

        comment = self.chat(messages, temperature=0.85)
        return _sanitize_text(comment, MAX_COMMENT_LENGTH)

    def should_engage(self, post: dict) -> tuple[bool, str]:
        """Decide whether to engage with a post."""
        messages = [
            {"role": "system", "content": AGENT_PERSONA},
            {
                "role": "user",
                "content": f"""Should you engage with this post?

Post by {post.get('author', {}).get('name', 'unknown')}:
Title: {post.get('title', '')}
Content: {post.get('content', '')}
Karma: {post.get('karma', 0)}

Consider:
- Is it relevant to your interests (privacy, agents, crypto, AI)?
- Is there something substantive to add?
- Would engagement be authentic?

Respond with JSON only:
{{"engage": true/false, "reason": "brief explanation", "action": "upvote|comment|both|none"}}""",
            },
        ]

        response = self.chat(messages, temperature=0.7)

        try:
            result = _extract_json(response)
            return result.get("engage", False), result.get("action", "none")
        except (json.JSONDecodeError, ValueError, KeyError) as exc:
            logger.warning("failed to parse engagement decision: %s", exc)
            return False, "none"

    def generate_tweet_summary(self, post_data: dict) -> str:
        """Condense a Moltbook post into a tweet-sized summary."""
        messages = [
            {"role": "system", "content": AGENT_PERSONA},
            {
                "role": "user",
                "content": (
                    f"Condense this into a single tweet (max 280 chars). "
                    f"Title: {post_data['title']}\n"
                    f"Content: {post_data['content'][:500]}\n\n"
                    f"Just the tweet text, nothing else."
                ),
            },
        ]
        return self.chat(messages, temperature=0.8)

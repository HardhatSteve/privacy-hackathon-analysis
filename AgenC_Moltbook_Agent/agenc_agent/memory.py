"""Persistent memory and state management."""

import json
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

from .config import (
    MEMORY_FILE,
    STATE_FILE,
    CREDENTIALS_FILE,
    MAX_POSTS_REMEMBERED,
    MAX_COMMENTS_REMEMBERED,
    MAX_CONVERSATIONS_REMEMBERED,
    MAX_KARMA_HISTORY,
)

logger = logging.getLogger(__name__)


@dataclass
class AgentMemory:
    """Persistent memory for the agent."""

    posts_made: list = field(default_factory=list)
    comments_made: list = field(default_factory=list)
    moltys_followed: list = field(default_factory=list)
    submolts_subscribed: list = field(default_factory=list)
    conversations: list = field(default_factory=list)
    last_heartbeat: Optional[str] = None
    last_post_time: Optional[str] = None
    karma_history: list = field(default_factory=list)

    def rotate(self):
        """Cap memory lists to prevent unbounded growth."""
        self.posts_made = self.posts_made[-MAX_POSTS_REMEMBERED:]
        self.comments_made = self.comments_made[-MAX_COMMENTS_REMEMBERED:]
        self.conversations = self.conversations[-MAX_CONVERSATIONS_REMEMBERED:]
        self.karma_history = self.karma_history[-MAX_KARMA_HISTORY:]


@dataclass
class AgentState:
    """Runtime state."""

    last_moltbook_check: Optional[str] = None
    pending_actions: list = field(default_factory=list)


def load_memory() -> AgentMemory:
    """Load memory from disk."""
    if MEMORY_FILE.exists():
        try:
            data = json.loads(MEMORY_FILE.read_text())
            return AgentMemory(**data)
        except (json.JSONDecodeError, TypeError) as exc:
            logger.warning("failed to load memory, starting fresh: %s", exc)
    return AgentMemory()


def _write_restricted(path, content: str):
    """Write content to a file with 0o600 permissions."""
    path.write_text(content)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def save_memory(memory: AgentMemory):
    """Save memory to disk, rotating to cap list sizes."""
    memory.rotate()
    _write_restricted(MEMORY_FILE, json.dumps(memory.__dict__, indent=2))


def load_state() -> AgentState:
    """Load state from disk."""
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text())
            return AgentState(**data)
        except (json.JSONDecodeError, TypeError) as exc:
            logger.warning("failed to load state, starting fresh: %s", exc)
    return AgentState()


def save_state(state: AgentState):
    """Save state to disk."""
    _write_restricted(STATE_FILE, json.dumps(state.__dict__, indent=2))


def load_credentials() -> Optional[dict]:
    """Load Moltbook credentials."""
    if CREDENTIALS_FILE.exists():
        try:
            return json.loads(CREDENTIALS_FILE.read_text())
        except json.JSONDecodeError as exc:
            logger.warning("failed to load credentials: %s", exc)
    return None


def save_credentials(creds: dict):
    """Save Moltbook credentials with restricted permissions."""
    _write_restricted(CREDENTIALS_FILE, json.dumps(creds, indent=2))

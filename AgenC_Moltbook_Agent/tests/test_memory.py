"""Tests for memory persistence and rotation."""

import json
import os
import stat

import pytest
from agenc_agent.memory import (
    AgentMemory,
    AgentState,
    load_memory,
    save_memory,
    load_state,
    save_state,
    load_credentials,
    save_credentials,
)
from agenc_agent.config import MAX_POSTS_REMEMBERED, MAX_COMMENTS_REMEMBERED


class TestAgentMemory:
    def test_default_memory(self):
        m = AgentMemory()
        assert m.posts_made == []
        assert m.last_post_time is None

    def test_rotate_caps_posts(self):
        m = AgentMemory(posts_made=[{"id": i} for i in range(500)])
        m.rotate()
        assert len(m.posts_made) == MAX_POSTS_REMEMBERED
        # Keeps most recent
        assert m.posts_made[0]["id"] == 500 - MAX_POSTS_REMEMBERED

    def test_rotate_caps_comments(self):
        m = AgentMemory(comments_made=[{"id": i} for i in range(1000)])
        m.rotate()
        assert len(m.comments_made) == MAX_COMMENTS_REMEMBERED

    def test_rotate_noop_when_under_limit(self):
        m = AgentMemory(posts_made=[{"id": 1}])
        m.rotate()
        assert len(m.posts_made) == 1


class TestPersistence:
    def test_save_and_load_memory(self, tmp_config_dir):
        m = AgentMemory(posts_made=[{"id": "test"}], last_post_time="2024-01-01")
        save_memory(m)
        loaded = load_memory()
        assert loaded.posts_made == [{"id": "test"}]
        assert loaded.last_post_time == "2024-01-01"

    def test_load_memory_missing_file(self, tmp_config_dir):
        m = load_memory()
        assert m.posts_made == []

    def test_save_and_load_state(self, tmp_config_dir):
        s = AgentState(last_moltbook_check="2024-01-01")
        save_state(s)
        loaded = load_state()
        assert loaded.last_moltbook_check == "2024-01-01"

    def test_load_credentials_missing(self, tmp_config_dir):
        assert load_credentials() is None

    def test_save_credentials_permissions(self, tmp_config_dir):
        save_credentials({"api_key": "test-key"})
        creds_file = tmp_config_dir / "credentials.json"
        assert creds_file.exists()
        mode = creds_file.stat().st_mode & 0o777
        assert mode == 0o600

    def test_save_and_load_credentials(self, tmp_config_dir):
        save_credentials({"api_key": "abc123", "agent_name": "AgenC"})
        loaded = load_credentials()
        assert loaded["api_key"] == "abc123"
        assert loaded["agent_name"] == "AgenC"

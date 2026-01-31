"""Shared test fixtures."""

import pytest


@pytest.fixture
def tmp_config_dir(tmp_path, monkeypatch):
    """Redirect config files to a temp directory."""
    monkeypatch.setattr("agenc_agent.config.CONFIG_DIR", tmp_path)
    monkeypatch.setattr("agenc_agent.config.CREDENTIALS_FILE", tmp_path / "credentials.json")
    monkeypatch.setattr("agenc_agent.config.MEMORY_FILE", tmp_path / "memory.json")
    monkeypatch.setattr("agenc_agent.config.STATE_FILE", tmp_path / "state.json")
    monkeypatch.setattr("agenc_agent.memory.CREDENTIALS_FILE", tmp_path / "credentials.json")
    monkeypatch.setattr("agenc_agent.memory.MEMORY_FILE", tmp_path / "memory.json")
    monkeypatch.setattr("agenc_agent.memory.STATE_FILE", tmp_path / "state.json")
    return tmp_path

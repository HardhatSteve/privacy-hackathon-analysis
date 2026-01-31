"""Tests for GrokClient JSON extraction."""

import pytest
from agenc_agent.clients.grok import _extract_json


class TestExtractJson:
    def test_bare_json(self):
        assert _extract_json('{"engage": true}') == {"engage": True}

    def test_json_with_whitespace(self):
        assert _extract_json('  {"a": 1}  ') == {"a": 1}

    def test_code_block_json(self):
        text = '```json\n{"engage": true, "action": "comment"}\n```'
        result = _extract_json(text)
        assert result["engage"] is True
        assert result["action"] == "comment"

    def test_code_block_no_lang(self):
        text = '```\n{"a": 1}\n```'
        assert _extract_json(text) == {"a": 1}

    def test_embedded_in_prose(self):
        text = 'Here is my response: {"engage": true, "action": "comment"} done.'
        result = _extract_json(text)
        assert result["engage"] is True

    def test_json_with_newlines(self):
        text = '```json\n{\n  "engage": true,\n  "action": "upvote"\n}\n```'
        result = _extract_json(text)
        assert result["action"] == "upvote"

    def test_invalid_raises(self):
        with pytest.raises(ValueError, match="could not extract JSON"):
            _extract_json("no json here at all")

    def test_empty_string_raises(self):
        with pytest.raises(ValueError):
            _extract_json("")

    def test_nested_json(self):
        text = '{"outer": {"inner": true}}'
        result = _extract_json(text)
        assert result["outer"]["inner"] is True

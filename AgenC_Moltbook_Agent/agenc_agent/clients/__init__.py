"""API client modules."""

__all__ = ["GrokClient", "MoltbookClient"]


def __getattr__(name):
    if name == "GrokClient":
        from .grok import GrokClient

        return GrokClient
    if name == "MoltbookClient":
        from .moltbook import MoltbookClient

        return MoltbookClient
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

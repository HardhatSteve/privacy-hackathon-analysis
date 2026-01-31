"""Bags fee collection client - stub implementation."""

import logging

logger = logging.getLogger(__name__)


class BagsClient:
    """Placeholder for Bags API integration.

    All methods raise NotImplementedError until the Bags API is available.
    Wire configuration now so it's ready when the API goes live.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        logger.info("BagsClient initialized (stub - API not yet available)")

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def collect_fees(self) -> dict:
        """Collect accumulated fees from the protocol."""
        raise NotImplementedError("Bags API not yet available")

    def get_balance(self) -> dict:
        """Get current Bags balance."""
        raise NotImplementedError("Bags API not yet available")

    def withdraw(self, amount: float, destination: str) -> dict:
        """Withdraw from Bags balance to destination address."""
        raise NotImplementedError("Bags API not yet available")

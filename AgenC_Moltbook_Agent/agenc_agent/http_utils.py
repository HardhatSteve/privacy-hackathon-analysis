"""HTTP retry utilities."""

import logging
import time

import httpx

from .config import MAX_RETRIES, RETRY_BASE_DELAY, RETRYABLE_STATUS_CODES

logger = logging.getLogger(__name__)


def request_with_retry(
    client: httpx.Client,
    method: str,
    url: str,
    max_retries: int = MAX_RETRIES,
    **kwargs,
) -> httpx.Response:
    """Execute an HTTP request with exponential backoff on transient errors.

    Retries on status codes 429, 500, 502, 503, 504 and transport errors.
    Respects Retry-After header when present.
    """
    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            response = client.request(method, url, **kwargs)
            if response.status_code not in RETRYABLE_STATUS_CODES:
                return response
            if attempt == max_retries:
                response.raise_for_status()
                return response  # unreachable, raise_for_status throws
            delay = RETRY_BASE_DELAY * (2 ** attempt)
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                try:
                    delay = max(delay, float(retry_after))
                except ValueError:
                    pass
            logger.warning(
                "retryable status %d on %s %s, attempt %d/%d, retrying in %.1fs",
                response.status_code,
                method.upper(),
                url,
                attempt + 1,
                max_retries,
                delay,
            )
            time.sleep(delay)
        except httpx.TransportError as exc:
            last_exc = exc
            if attempt == max_retries:
                raise
            delay = RETRY_BASE_DELAY * (2 ** attempt)
            logger.warning(
                "transport error on %s %s: %s, attempt %d/%d, retrying in %.1fs",
                method.upper(),
                url,
                exc,
                attempt + 1,
                max_retries,
                delay,
            )
            time.sleep(delay)
    raise last_exc  # type: ignore[misc]

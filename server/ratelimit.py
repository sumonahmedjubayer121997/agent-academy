"""In-memory per-IP rate limiter (sliding 60s window).

Protects the LLM-backed endpoints from runaway clients (and cost). Per-IP state
lives in memory — right for single-instance deployments; move to Redis when the
API scales horizontally.
"""
from __future__ import annotations

import time
from collections import deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from . import config

EXEMPT_PATHS = {"/health", "/docs", "/openapi.json"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, per_minute: int | None = None) -> None:  # type: ignore[no-untyped-def]
        super().__init__(app)
        self.per_minute = per_minute if per_minute is not None else config.RATE_LIMIT_PER_MIN
        self.buckets: dict[str, deque[float]] = {}

    async def dispatch(self, request, call_next):  # type: ignore[no-untyped-def]
        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)
        ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        bucket = self.buckets.setdefault(ip, deque())
        while bucket and bucket[0] <= now - 60:
            bucket.popleft()
        if len(bucket) >= self.per_minute:
            return JSONResponse({"detail": "rate limit exceeded — slow down"}, status_code=429)
        bucket.append(now)
        return await call_next(request)

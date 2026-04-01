"""
AGENMATICA - Middleware
Global error handling, request logging, and basic rate limiting.
"""

import time
import logging
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("agenmatica")


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Catches unhandled exceptions and returns clean JSON errors."""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            print(f"DEBUG: Unhandled error in middleware: {e}")
            import traceback
            traceback.print_exc()
            logger.exception(f"Unhandled error: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error": str(e) if not _is_production() else "An unexpected error occurred",
                },
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs request method, path, status, and duration."""

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)

        # Skip health checks and docs from logging
        path = request.url.path
        if path not in ("/health", "/", "/api/v1/docs", "/api/v1/openapi.json"):
            logger.info(
                f"{request.method} {path} → {response.status_code} ({duration_ms}ms)"
            )

        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter.
    In production, use Redis-backed rate limiting.

    Limits:
    - Auth endpoints: 10 req/min per IP
    - API endpoints: 60 req/min per user token
    - Generation endpoints: 10 req/min per user
    """

    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._limits = {
            "/auth/": {"max": 10, "window": 60},    # 10/min
            "/posts/": {"max": 60, "window": 60},    # 60/min
            "/networks/": {"max": 30, "window": 60},  # 30/min
            "default": {"max": 120, "window": 60},    # 120/min
        }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        path = request.url.path
        if path in ("/health", "/", "/api/v1/docs", "/api/v1/redoc", "/api/v1/openapi.json"):
            return await call_next(request)

        # Determine rate limit based on path
        limit_config = self._limits["default"]
        for prefix, config in self._limits.items():
            if prefix != "default" and prefix in path:
                limit_config = config
                break

        # Use IP + path prefix as key
        client_ip = request.client.host if request.client else "unknown"
        key = f"{client_ip}:{path.split('/')[3] if len(path.split('/')) > 3 else 'root'}"

        now = time.time()
        window = limit_config["window"]
        max_requests = limit_config["max"]

        # Clean old entries
        self._requests[key] = [
            t for t in self._requests[key] if now - t < window
        ]

        if len(self._requests[key]) >= max_requests:
            retry_after = int(window - (now - self._requests[key][0]))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        self._requests[key].append(now)
        response = await call_next(request)

        # Add rate limit headers
        remaining = max_requests - len(self._requests[key])
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response


def _is_production() -> bool:
    try:
        from app.core.config import get_settings
        return get_settings().is_production
    except Exception:
        return False

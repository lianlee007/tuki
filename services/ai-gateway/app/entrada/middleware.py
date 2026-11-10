"""Middleware HTTP: request-id, métricas, cabeceras y logs JSON.

Es un adaptador de entrada. No conoce rutas concretas ni el caso de uso; solo
mide y decora la respuesta.
"""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI, Request

from app.observability import (
    HTTP_DURATION,
    HTTP_INFLIGHT,
    HTTP_REQUESTS,
    reset_request_id,
    set_request_id,
)

logger = logging.getLogger(__name__)

_EXCLUDED_ROUTES = {
    "/healthz",
    "/api/healthz",
    "/readyz",
    "/api/readyz",
    "/metrics",
}


def valid_request_id(value: str) -> str:
    """Reutiliza el `X-Request-Id` del cliente solo si es seguro; si no, genera uno."""
    candidate = (value or "").strip()
    if 1 <= len(candidate) <= 64 and all(
        char.isalnum() or char in "._-" for char in candidate
    ):
        return candidate
    return uuid.uuid4().hex


def register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def observability(request: Request, call_next):  # noqa: ANN001
        request_id = valid_request_id(request.headers.get("x-request-id", ""))
        token = set_request_id(request_id)
        started = time.perf_counter()
        HTTP_INFLIGHT.inc()
        status = 500
        try:
            try:
                response = await call_next(request)
                status = response.status_code
            finally:
                duration = time.perf_counter() - started
                HTTP_INFLIGHT.dec()
                route = request.scope.get("route")
                route_path = getattr(route, "path", None) or "unmatched"
                method = request.method
                if request.url.path not in _EXCLUDED_ROUTES:
                    HTTP_REQUESTS.labels(
                        method=method, route=route_path, status=str(status)
                    ).inc()
                    HTTP_DURATION.labels(
                        method=method, route=route_path
                    ).observe(duration)
                    identity = getattr(request.state, "identity", None)
                    logger.info(
                        "http_request",
                        extra={
                            "event": "http_request",
                            "method": method,
                            "path": request.url.path,
                            "route": route_path,
                            "status": status,
                            "duration_ms": round(duration * 1000, 2),
                            "identity": getattr(identity, "kind", "anonymous"),
                        },
                    )
                else:
                    logger.debug(
                        "probe",
                        extra={
                            "event": "probe",
                            "path": request.url.path,
                            "status": status,
                        },
                    )
        finally:
            reset_request_id(token)

        # Los manejadores de excepciones también devuelven JSONResponse y pasan
        # por este punto al no propagar la excepción.
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        decision = getattr(request.state, "rate", None)
        if decision is not None:
            response.headers["X-RateLimit-Limit"] = str(decision.limit)
            response.headers["X-RateLimit-Remaining"] = str(decision.remaining)
        return response

"""Punto de entrada del AI Gateway de Tuki.

Expone:
- ``POST /api/v1/ai/chat``: generación de texto con Groq.
- ``GET  /api/v1/ai/models``: modelos configurados.
- ``GET  /healthz`` y ``/readyz``: sondas.
- ``GET  /metrics``: métricas Prometheus (red interna).
"""

from __future__ import annotations

import logging
import math
import time
import uuid
from contextlib import asynccontextmanager
from typing import Annotated

import httpx
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.adaptadores.groq import GroqClient
from app.adaptadores.memoria import RateLimiter
from app.adaptadores.supabase import AuthError, resolve_identity
from app.config import Settings, get_settings
from app.dominio.errores import ErrorIA
from app.dominio.modelos import Identity, RateDecision
from app.observability import (
    AUTH_FAILURES,
    HTTP_DURATION,
    HTTP_INFLIGHT,
    HTTP_REQUESTS,
    RATE_LIMITED,
    current_request_id,
    instrument_fastapi,
    instrument_httpx,
    reset_request_id,
    set_request_id,
    setup_logging,
    setup_telemetry,
)
from app.schemas import ChatRequest, ChatResponse, HealthResponse, Usage
from app.servicios.chat import ServicioChat

logger = logging.getLogger(__name__)

SISTEMA_POR_DEFECTO = (
    "Eres un experto en marketing gastronómico de lujo y copywriting persuasivo. "
    "Respondes siempre en español, de forma breve y concreta, sin comillas, "
    "sin markdown y sin explicaciones."
)

_EXCLUDED_ROUTES = {
    "/healthz",
    "/api/healthz",
    "/readyz",
    "/api/readyz",
    "/metrics",
}


def _valid_request_id(value: str) -> str:
    candidate = (value or "").strip()
    if 1 <= len(candidate) <= 64 and all(
        char.isalnum() or char in "._-" for char in candidate
    ):
        return candidate
    return uuid.uuid4().hex


def _error_content(code: str, message: str) -> dict:
    return {
        "detail": {"code": code, "message": message},
        "request_id": current_request_id(),
    }


def _settings_from(request: Request) -> Settings:
    return request.app.state.settings


def _limiter_from(request: Request) -> RateLimiter:
    return request.app.state.limiter


async def current_identity(
    request: Request,
    settings: Annotated[Settings, Depends(_settings_from)],
) -> Identity:
    try:
        identity = resolve_identity(
            request,
            request.headers.get("authorization"),
            settings,
        )
    except AuthError as exc:
        AUTH_FAILURES.labels(reason=exc.reason).inc()
        headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": exc.message},
            headers=headers,
        ) from exc
    request.state.identity = identity
    return identity


async def enforce_rate_limit(
    request: Request,
    identity: Annotated[Identity, Depends(current_identity)],
    limiter: Annotated[RateLimiter, Depends(_limiter_from)],
) -> RateDecision:
    decision = limiter.check(identity.kind, identity.key)
    request.state.rate = decision
    if not decision.allowed:
        RATE_LIMITED.labels(identity_type=identity.kind).inc()
        retry_after = max(1, math.ceil(decision.retry_after))
        raise HTTPException(
            status_code=429,
            detail={
                "code": "rate_limited",
                "message": (
                    "Demasiadas solicitudes a la IA. "
                    "Espera unos segundos e inténtalo de nuevo."
                ),
            },
            headers={"Retry-After": str(retry_after)},
        )
    return decision


def _register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def observability(request: Request, call_next):  # noqa: ANN001
        request_id = _valid_request_id(request.headers.get("x-request-id", ""))
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


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ErrorIA)
    async def ai_error_handler(request: Request, exc: ErrorIA) -> JSONResponse:
        headers = None
        if exc.retry_after:
            headers = {"Retry-After": str(exc.retry_after)}
        logger.warning(
            "ai_request_failed",
            extra={
                "event": "ai_error",
                "code": exc.code,
                "status": exc.status_code,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_content(exc.code, exc.message),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        location = ".".join(str(part) for part in first.get("loc", []) if part != "body")
        message = str(first.get("msg", "La solicitud no es válida."))
        return JSONResponse(
            status_code=422,
            content=_error_content(
                "validation_error",
                f"{location}: {message}" if location else message,
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            code = str(detail.get("code", "http_error"))
            message = str(detail.get("message", "Error"))
        else:
            code = "http_error"
            message = str(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_content(code, message),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unexpected_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled_error",
            extra={"event": "unhandled_error", "path": request.url.path},
        )
        return JSONResponse(
            status_code=500,
            content=_error_content(
                "internal_error",
                "Ocurrió un error inesperado. Inténtalo de nuevo.",
            ),
        )


def _register_routes(app: FastAPI) -> None:
    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        settings: Settings = app.state.settings
        return {
            "service": settings.app_name,
            "version": settings.version,
            "environment": settings.environment,
            "docs": "/docs" if settings.environment != "production" else None,
        }

    @app.get("/healthz", response_model=HealthResponse, include_in_schema=False)
    @app.get("/api/healthz", response_model=HealthResponse, include_in_schema=False)
    async def healthz() -> HealthResponse:
        settings: Settings = app.state.settings
        return HealthResponse(
            status="ok",
            service=settings.app_name,
            version=settings.version,
            environment=settings.environment,
        )

    @app.get("/readyz", include_in_schema=False)
    @app.get("/api/readyz", include_in_schema=False)
    async def readyz() -> JSONResponse:
        settings: Settings = app.state.settings
        errors = settings.readiness_errors()
        payload = {
            "status": "ok" if not errors else "degraded",
            "checks": {
                "groq_api_key": settings.groq_key_configured,
                "auth_mode": settings.auth_mode,
                "models": len(settings.models),
            },
            **({"errors": errors} if errors else {}),
        }
        return JSONResponse(status_code=200 if not errors else 503, content=payload)

    @app.get("/metrics", include_in_schema=False)
    async def metrics() -> Response:
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.post("/api/v1/ai/chat", response_model=ChatResponse)
    async def chat(
        payload: ChatRequest,
        request: Request,
        identity: Annotated[Identity, Depends(current_identity)],
        _: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> ChatResponse:
        servicio: ServicioChat = request.app.state.chat
        result = await servicio.generar(
            prompt=payload.prompt,
            system=payload.system or SISTEMA_POR_DEFECTO,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
            request_id=current_request_id(),
        )
        logger.info(
            "ai_request_ok",
            extra={
                "event": "ai_request",
                "identity": identity.kind,
                "model": result.model,
                "attempts": result.attempts,
                "latency_ms": result.latency_ms,
                "total_tokens": result.total_tokens,
            },
        )
        return ChatResponse(
            content=result.content,
            model=result.model,
            usage=Usage(
                prompt_tokens=result.prompt_tokens,
                completion_tokens=result.completion_tokens,
                total_tokens=result.total_tokens,
            ),
            attempts=result.attempts,
            latency_ms=result.latency_ms,
            request_id=current_request_id(),
        )

    @app.get("/api/v1/ai/models")
    async def models(
        settings: Annotated[Settings, Depends(_settings_from)],
        _: Annotated[Identity, Depends(current_identity)],
        __: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> dict:
        return {"models": settings.models, "default": settings.models[0]}


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    telemetry_ready = setup_telemetry(settings)

    app = FastAPI(
        title="Tuki AI Gateway",
        version=settings.version,
        description="Gateway que protege la clave de Groq de Tuki.",
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.environment != "production" else None,
    )

    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_methods=["GET", "POST"],
            allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
            expose_headers=["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
            max_age=600,
        )

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        setup_logging(settings.log_level)
        settings.validate_or_raise()
        application.state.settings = settings
        application.state.limiter = RateLimiter.from_settings(settings)
        application.state.started_at = time.time()

        timeout = httpx.Timeout(
            connect=5.0,
            read=settings.groq_timeout_seconds,
            write=10.0,
            pool=5.0,
        )
        client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            headers={"User-Agent": f"{settings.app_name}/{settings.version}"},
        )
        application.state.http = client
        application.state.chat = ServicioChat(
            GroqClient(settings, client),
            max_chars=settings.request_max_chars,
        )
        if telemetry_ready:
            instrument_httpx(client)

        if not settings.groq_key_configured:
            logger.error(
                "groq_key_missing",
                extra={
                    "event": "startup_error",
                    "detail": "GROQ_API_KEY no configurada; /readyz devolverá 503.",
                },
            )
        logger.info(
            "gateway_started",
            extra={
                "event": "startup",
                "environment": settings.environment,
                "auth_mode": settings.auth_mode,
                "allow_anon": settings.allow_anon,
                "models": ",".join(settings.models),
            },
        )
        try:
            yield
        finally:
            await client.aclose()
            logger.info("gateway_stopped", extra={"event": "shutdown"})

    app.router.lifespan_context = lifespan
    _register_middleware(app)
    _register_exception_handlers(app)
    _register_routes(app)
    if telemetry_ready:
        instrument_fastapi(app)
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_config=None)

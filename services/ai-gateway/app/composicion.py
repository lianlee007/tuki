"""Ensamblado de la aplicación del gateway.

Aquí se eligen los adaptadores (Groq, limitador en memoria, Supabase para JWT),
se crea el caso de uso y se conectan middleware, errores y rutas. `main.py` solo
publica la instancia; así se puede probar `create_app` con otra configuración
sin tocar el contrato HTTP.
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

import httpx
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adaptadores.memoria import RateLimiter
from app.adaptadores.ollama import OllamaClient
from app.adaptadores.restaurantes import ExtractorRestaurantes
from app.config import Settings, get_settings
from app.entrada.errores import register_exception_handlers
from app.entrada.middleware import register_middleware
from app.entrada.rutas import register_routes
from app.observability import (
    instrument_fastapi,
    instrument_httpx,
    setup_logging,
    setup_telemetry,
)
from app.servicios.chat import ServicioChat
from app.servicios.conocimiento import ServicioConocimiento
from app.servicios.recomendador import ServicioRecomendador

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    telemetry_ready = setup_telemetry(settings)

    app = FastAPI(
        title="Tuki AI Gateway",
        version=settings.version,
        description="Gateway de IA local de Tuki con RAG sobre el catálogo real.",
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
            read=settings.ollama_timeout_seconds,
            write=30.0,
            pool=5.0,
        )
        client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            headers={"User-Agent": f"{settings.app_name}/{settings.version}"},
            # Ollama y los servicios de Tuki son locales. Ignorar ALL_PROXY
            # evita que un proxy SOCKS del sistema tumbe el arranque.
            trust_env=False,
        )
        application.state.http = client
        proveedor = OllamaClient(settings, client)
        extractor = ExtractorRestaurantes(settings, client)
        conocimiento = ServicioConocimiento(extractor, proveedor, settings)
        application.state.chat = ServicioChat(
            proveedor,
            max_chars=settings.request_max_chars,
        )
        application.state.conocimiento = conocimiento
        application.state.recomendador = ServicioRecomendador(
            conocimiento,
            proveedor,
            proveedor,
            settings,
        )
        if telemetry_ready:
            instrument_httpx(client)

        logger.info(
            "gateway_started",
            extra={
                "event": "startup",
                "environment": settings.environment,
                "auth_mode": settings.auth_mode,
                "allow_anon": settings.allow_anon,
                "modelo_chat": settings.modelo_chat,
                "modelo_embeddings": settings.modelo_embeddings,
            },
        )
        try:
            yield
        finally:
            await client.aclose()
            logger.info("gateway_stopped", extra={"event": "shutdown"})

    app.router.lifespan_context = lifespan
    register_middleware(app)
    register_exception_handlers(app)
    register_routes(app)
    if telemetry_ready:
        instrument_fastapi(app)
    return app


def run() -> None:
    """Arranque directo con uvicorn (usado por `python -m app.main`)."""
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_config=None)

"""Rutas HTTP del gateway.

El contrato público es ``POST /api/v1/ai/chat``; el resto son sondas, métricas y
metadatos. Las rutas delegan en `state.chat` (caso de uso) y no construyen
clientes: el ensamblado vive en `app.composicion`.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, FastAPI, Request, Response
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.config import Settings
from app.dominio.modelos import Identity, RateDecision
from app.entrada.dependencias import (
    current_identity,
    enforce_rate_limit,
    settings_from,
)
from app.observability import current_request_id
from app.schemas import ChatRequest, ChatResponse, HealthResponse, Usage
from app.servicios.chat import ServicioChat

logger = logging.getLogger(__name__)

SISTEMA_POR_DEFECTO = (
    "Eres un experto en marketing gastronómico de lujo y copywriting persuasivo. "
    "Respondes siempre en español, de forma breve y concreta, sin comillas, "
    "sin markdown y sin explicaciones."
)


def register_routes(app: FastAPI) -> None:
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
        settings: Annotated[Settings, Depends(settings_from)],
        _: Annotated[Identity, Depends(current_identity)],
        __: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> dict:
        return {"models": settings.models, "default": settings.models[0]}

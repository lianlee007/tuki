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
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ConocimientoResponse,
    FuenteResponse,
    HealthResponse,
    RecomendarRequest,
    RecomendarResponse,
    Usage,
)
from app.servicios.chat import ServicioChat
from app.servicios.recomendador import ServicioRecomendador

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
        estado = (
            app.state.conocimiento.estado()
            if hasattr(app.state, "conocimiento")
            else {}
        )
        payload = {
            "status": "ok" if not errors else "degraded",
            "checks": {
                "ollama_url": bool(settings.ollama_url),
                "modelo_chat": settings.modelo_chat,
                "modelo_embeddings": settings.modelo_embeddings,
                "auth_mode": settings.auth_mode,
                "documentos_conocimiento": estado.get("documentos", 0),
                "embeddings_conocimiento": estado.get("embeddings", 0),
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

    @app.post("/api/v1/ai/recomendar", response_model=RecomendarResponse)
    async def recomendar(
        payload: RecomendarRequest,
        request: Request,
        identity: Annotated[Identity, Depends(current_identity)],
        _: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> RecomendarResponse:
        servicio: ServicioRecomendador = request.app.state.recomendador
        resultado = await servicio.recomendar(
            mensaje=payload.mensaje,
            historial=[turno.model_dump() for turno in payload.historial],
            ciudad=payload.ciudad,
            restaurante_slug=payload.restaurante_slug,
            request_id=current_request_id(),
        )
        logger.info(
            "ai_recomendacion_ok",
            extra={
                "event": "ai_recommendation",
                "identity": identity.kind,
                "model": resultado.model,
                "fuentes": len(resultado.fuentes),
                "recuperacion_ms": resultado.recuperacion_ms,
                "latency_ms": resultado.latency_ms,
                "total_tokens": resultado.total_tokens,
            },
        )
        return RecomendarResponse(
            respuesta=resultado.content,
            fuentes=[
                FuenteResponse(
                    id=fuente.id,
                    tipo=fuente.tipo,
                    nombre=fuente.nombre,
                    restaurante=fuente.restaurante,
                    restaurante_slug=fuente.restaurante_slug,
                    ciudad=fuente.ciudad,
                    categoria=fuente.categoria,
                    precio=fuente.precio,
                    moneda=fuente.moneda,
                    imagen_url=fuente.imagen_url,
                    vegetariano=fuente.vegetariano,
                    vegano=fuente.vegano,
                    picante=fuente.picante,
                    alergenos=list(fuente.alergenos),
                )
                for fuente in resultado.fuentes
            ],
            modelo=resultado.model,
            usage=Usage(
                prompt_tokens=resultado.prompt_tokens,
                completion_tokens=resultado.completion_tokens,
                total_tokens=resultado.total_tokens,
            ),
            attempts=resultado.attempts,
            latency_ms=resultado.latency_ms,
            recuperacion_ms=resultado.recuperacion_ms,
            contexto_tokens=resultado.contexto_tokens,
            request_id=current_request_id(),
        )

    @app.get("/api/v1/ai/conocimiento", response_model=ConocimientoResponse)
    async def conocimiento(
        request: Request,
        _: Annotated[Identity, Depends(current_identity)],
        __: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> ConocimientoResponse:
        estado = request.app.state.conocimiento.estado()
        return ConocimientoResponse(**estado)

    @app.post("/api/v1/ai/conocimiento/recargar", response_model=ConocimientoResponse)
    async def recargar_conocimiento(
        request: Request,
        _: Annotated[Identity, Depends(current_identity)],
        __: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> ConocimientoResponse:
        estado = await request.app.state.conocimiento.recargar()
        return ConocimientoResponse(**estado)

    @app.get("/api/v1/ai/models")
    async def models(
        settings: Annotated[Settings, Depends(settings_from)],
        _: Annotated[Identity, Depends(current_identity)],
        __: Annotated[RateDecision, Depends(enforce_rate_limit)],
    ) -> dict:
        return {
            "models": settings.models,
            "default": settings.modelo_chat,
            "embeddings": settings.modelo_embeddings,
        }

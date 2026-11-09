"""Dependencias HTTP compartidas por las rutas del gateway.

La identidad (JWT de Supabase o anónimo con cuota) y el limitador se resuelven
aquí. Son adaptadores de entrada: dependen de FastAPI, pero no de `main`.
"""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import Depends, HTTPException, Request

from app.adaptadores.memoria import RateLimiter
from app.adaptadores.supabase import AuthError, resolve_identity
from app.config import Settings
from app.dominio.modelos import Identity, RateDecision
from app.observability import AUTH_FAILURES, RATE_LIMITED


def settings_from(request: Request) -> Settings:
    """Configuración cargada en el `lifespan` de la aplicación."""
    return request.app.state.settings


def limiter_from(request: Request) -> RateLimiter:
    """Limitador en memoria creado a partir de la configuración."""
    return request.app.state.limiter


async def current_identity(
    request: Request,
    settings: Annotated[Settings, Depends(settings_from)],
) -> Identity:
    """Resuelve quién llama: usuario con JWT válido o anónimo con cuota."""
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
    limiter: Annotated[RateLimiter, Depends(limiter_from)],
) -> RateDecision:
    """Aplica la cuota por IP o por usuario antes de llegar al caso de uso."""
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

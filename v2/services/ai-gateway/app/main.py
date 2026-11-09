"""Punto de entrada del AI Gateway de Tuki.

Expone:
- ``POST /api/v1/ai/chat``: generación de texto con Groq.
- ``GET  /api/v1/ai/models``: modelos configurados.
- ``GET  /healthz`` y ``/readyz``: sondas.
- ``GET  /metrics``: métricas Prometheus (red interna).

El ensamblado vive en `app.composicion` y las rutas en `app.entrada.rutas`; este
archivo solo publica la instancia que consume uvicorn.
"""

from __future__ import annotations

from app.composicion import create_app, run
from app.entrada.rutas import SISTEMA_POR_DEFECTO

__all__ = ["app", "create_app", "run", "SISTEMA_POR_DEFECTO"]

app = create_app()


if __name__ == "__main__":
    run()

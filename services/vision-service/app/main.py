"""Punto de entrada del servicio de visión de Tuki.

Expone:
- ``POST /api/v1/vision/clasificar``: dice si una foto es comida.
- ``GET  /api/v1/vision/modelo``: metadatos y métricas del modelo cargado.
- ``GET  /healthz`` y ``/readyz``: sondas de vida y disponibilidad.

La inferencia es local: Ultralytics carga los pesos desde disco y no se envía
ninguna imagen a servicios de terceros.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.dominio.clasificador import ClasificadorComida, ClasificadorYolo
from app.entrada.rutas import register_routes

logger = logging.getLogger(__name__)


def crear_app(
    settings: Settings | None = None,
    clasificador: ClasificadorComida | None = None,
) -> FastAPI:
    """Ensambla la aplicación.

    ``clasificador`` permite inyectar un doble en las pruebas sin cargar torch.
    """
    ajustes = settings or get_settings()

    app = FastAPI(
        title="Tuki Vision",
        version=ajustes.version,
        description="Clasificador local de fotos de platos (comida / no comida).",
        docs_url="/docs" if ajustes.environment != "production" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if ajustes.environment != "production" else None,
    )

    if ajustes.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=ajustes.cors_origin_list,
            allow_methods=["GET", "POST"],
            allow_headers=["Content-Type"],
            max_age=600,
        )

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        logging.basicConfig(
            level=getattr(logging, ajustes.log_level, logging.INFO),
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
        application.state.settings = ajustes
        application.state.clasificador = clasificador
        application.state.error_modelo = None

        if application.state.clasificador is None:
            try:
                application.state.clasificador = ClasificadorYolo(
                    ajustes.model_path,
                    umbral=ajustes.umbral_comida,
                    etiqueta_comida=ajustes.etiqueta_comida,
                    imgsz=ajustes.imgsz,
                    device=ajustes.device,
                )
                logger.info(
                    "vision_modelo_cargado",
                    extra={
                        "event": "startup",
                        "modelo": application.state.clasificador.nombre_modelo,
                        "umbral": ajustes.umbral_comida,
                    },
                )
            except Exception as exc:  # noqa: BLE001 - el servicio sigue vivo sin modelo
                application.state.error_modelo = f"{type(exc).__name__}: {exc}"
                logger.error(
                    "vision_modelo_no_disponible",
                    extra={"event": "startup", "detail": application.state.error_modelo},
                )

        yield
        logger.info("vision_detenido", extra={"event": "shutdown"})

    app.router.lifespan_context = lifespan
    register_routes(app)
    return app


app = crear_app()


def run() -> None:
    """Arranque directo con uvicorn (usado por `python -m app.main`)."""
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_config=None)


if __name__ == "__main__":
    run()

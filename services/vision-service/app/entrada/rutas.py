"""Rutas HTTP del servicio de visión.

El contrato público es ``POST /api/v1/vision/clasificar``. La imagen viaja como
multipart en el campo ``imagen`` y la respuesta siempre es 200 cuando la imagen
es válida: el veredicto vive en ``es_comida`` para que el frontend decida qué
mostrar. Un 503 significa que el modelo no está cargado.
"""

from __future__ import annotations

import io
import json
import logging
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

from app.config import Settings
from app.dominio.clasificador import ErrorModelo
from app.entrada.esquemas import ModeloRespuesta, SaludRespuesta, VeredictoRespuesta

logger = logging.getLogger(__name__)

# Una foto de menú no necesita más; evita bombs de descompresión y picos de RAM.
MAX_PIXELES = 40_000_000


def _leer_metricas(ruta: Path) -> dict | None:
    if not ruta.exists():
        return None
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return datos if isinstance(datos, dict) else None


def _abrir_imagen(datos: bytes) -> Image.Image:
    try:
        with Image.open(io.BytesIO(datos)) as original:
            if original.width * original.height > MAX_PIXELES:
                raise HTTPException(
                    status_code=400,
                    detail="La imagen tiene demasiados píxeles. Redúcela antes de subirla.",
                )
            # Las fotos de móvil llegan giradas por EXIF; el modelo se entrenó
            # con imágenes ya orientadas.
            imagen = ImageOps.exif_transpose(original)
            return imagen.convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            status_code=400,
            detail="El archivo no es una imagen válida (JPG, PNG o WebP).",
        ) from exc


def register_routes(app: FastAPI) -> None:
    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        ajustes: Settings = app.state.settings
        return {
            "service": ajustes.app_name,
            "version": ajustes.version,
            "environment": ajustes.environment,
            "docs": "/docs" if ajustes.environment != "production" else None,
        }

    @app.get("/healthz", response_model=SaludRespuesta, include_in_schema=False)
    @app.get("/api/healthz", response_model=SaludRespuesta, include_in_schema=False)
    async def healthz() -> SaludRespuesta:
        ajustes: Settings = app.state.settings
        return SaludRespuesta(
            status="ok",
            service=ajustes.app_name,
            version=ajustes.version,
            environment=ajustes.environment,
        )

    @app.get("/readyz", include_in_schema=False)
    @app.get("/api/readyz", include_in_schema=False)
    async def readyz(request: Request) -> JSONResponse:
        clasificador = request.app.state.clasificador
        error = request.app.state.error_modelo
        if clasificador is None:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "degraded",
                    "checks": {"modelo": False},
                    **({"error": error} if error else {}),
                },
            )
        return JSONResponse(
            status_code=200,
            content={
                "status": "ok",
                "checks": {
                    "modelo": True,
                    "nombre": clasificador.nombre_modelo,
                    "etiquetas": clasificador.etiquetas,
                    "umbral": clasificador.umbral,
                },
            },
        )

    @app.get("/api/v1/vision/modelo", response_model=ModeloRespuesta)
    async def modelo(request: Request) -> ModeloRespuesta:
        clasificador = request.app.state.clasificador
        ajustes: Settings = request.app.state.settings
        if clasificador is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "El clasificador no está cargado. "
                    "Entrena el modelo o revisa VISION_MODEL_PATH."
                ),
            )
        return ModeloRespuesta(
            modelo=clasificador.nombre_modelo,
            etiquetas=clasificador.etiquetas,
            umbral=clasificador.umbral,
            imgsz=ajustes.imgsz,
            metricas=_leer_metricas(ajustes.ruta_metricas),
        )

    @app.post("/api/v1/vision/clasificar", response_model=VeredictoRespuesta)
    async def clasificar(
        request: Request,
        imagen: UploadFile = File(..., description="Foto del plato"),
    ) -> VeredictoRespuesta:
        clasificador = request.app.state.clasificador
        ajustes: Settings = request.app.state.settings
        if clasificador is None:
            raise HTTPException(
                status_code=503,
                detail="El clasificador no está disponible: falta el modelo entrenado.",
            )

        if imagen.content_type and not imagen.content_type.startswith("image/"):
            raise HTTPException(
                status_code=415,
                detail="Sube una imagen JPG, PNG o WebP.",
            )

        datos = await imagen.read(ajustes.max_imagen_bytes + 1)
        if not datos:
            raise HTTPException(status_code=400, detail="La imagen llegó vacía.")
        if len(datos) > ajustes.max_imagen_bytes:
            limite = ajustes.max_imagen_bytes // (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"La imagen supera el máximo de {limite} MB.",
            )

        foto = _abrir_imagen(datos)
        try:
            veredicto = await run_in_threadpool(clasificador.clasificar, foto)
        except ErrorModelo as exc:
            logger.error("modelo_error", extra={"event": "inferencia", "detail": str(exc)})
            raise HTTPException(
                status_code=500,
                detail="El clasificador falló al procesar la imagen.",
            ) from exc
        except Exception as exc:  # noqa: BLE001 - la API no filtra trazas internas
            logger.exception("inferencia_error", extra={"event": "inferencia"})
            raise HTTPException(
                status_code=500,
                detail="No se pudo clasificar la imagen. Inténtalo de nuevo.",
            ) from exc

        logger.info(
            "clasificacion_ok",
            extra={
                "event": "clasificacion",
                "es_comida": veredicto.es_comida,
                "etiqueta": veredicto.etiqueta,
                "probabilidad_comida": round(veredicto.probabilidad_comida, 4),
            },
        )
        return VeredictoRespuesta(
            es_comida=veredicto.es_comida,
            etiqueta=veredicto.etiqueta,
            confianza=veredicto.confianza,
            probabilidad_comida=veredicto.probabilidad_comida,
            umbral=veredicto.umbral,
            modelo=clasificador.nombre_modelo,
        )

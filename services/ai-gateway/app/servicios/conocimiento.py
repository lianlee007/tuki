"""Caso de uso: mantener el índice de conocimiento al día.

El índice se construye a partir del catálogo real y se refresca cada
``AI_CONOCIMIENTO_TTL_SECONDS``. Si la extracción falla, se conserva la última
copia válida: el chat puede seguir respondiendo con datos aunque el servicio de
restaurantes esté caído un momento.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

from app.adaptadores.ollama import OllamaClient
from app.config import Settings
from app.dominio.conocimiento import (
    Documento,
    documento_a_dict,
    documento_desde_dict,
)
from app.dominio.errores import ErrorIA
from app.dominio.recuperacion import IndiceRAG

logger = logging.getLogger(__name__)

_VERSION_CACHE = 1


class ExtractorConocimiento(Protocol):
    async def extraer(self) -> list[Documento]: ...


class ProveedorEmbeddings(Protocol):
    async def embed(self, textos: list[str]) -> list[list[float]]: ...


class ServicioConocimiento:
    def __init__(
        self,
        extractor: ExtractorConocimiento,
        embeddings: ProveedorEmbeddings | OllamaClient,
        settings: Settings,
    ) -> None:
        self._extractor = extractor
        self._embeddings = embeddings
        self._settings = settings
        self._lock = asyncio.Lock()
        self._indice: IndiceRAG | None = None
        self._actualizado: float = 0.0
        self._fuente = "vacio"
        self._error: str | None = None
        self._error_embeddings: str | None = None
        self._directorio = Path(
            settings.conocimiento_directorio
            or Path(__file__).resolve().parents[2] / ".datos"
        )
        self._cache = self._directorio / "indice-rag.json"
        self._cargar_cache()

    async def obtener(self) -> IndiceRAG:
        if self._indice is not None and not self._esta_vencido():
            return self._indice
        async with self._lock:
            if self._indice is not None and not self._esta_vencido():
                return self._indice
            try:
                await self._reconstruir()
            except Exception as exc:  # noqa: BLE001 - se degrada a la copia anterior
                self._error = str(exc)[:300]
                if self._indice is not None:
                    logger.warning(
                        "conocimiento_refresco_fallido",
                        extra={"event": "knowledge_stale", "error": self._error},
                    )
                    return self._indice
                raise
        assert self._indice is not None
        return self._indice

    async def recargar(self) -> dict[str, Any]:
        async with self._lock:
            await self._reconstruir()
        return self.estado()

    async def _reconstruir(self) -> None:
        documentos = await self._extractor.extraer()
        if not documentos:
            raise ErrorIA(
                "El catálogo no tiene platos disponibles para recomendar.",
                status_code=503,
                code="knowledge_empty",
            )
        vectores: list[list[float]] = []
        self._error_embeddings = None
        try:
            vectores = await self._embeddings.embed([documento.texto for documento in documentos])
        except Exception as exc:  # noqa: BLE001 - BM25 sigue funcionando
            self._error_embeddings = str(exc)[:300]
            logger.warning(
                "embeddings_no_disponibles",
                extra={"event": "embeddings_error", "error": self._error_embeddings},
            )

        self._indice = IndiceRAG(documentos, vectores)
        self._actualizado = time.time()
        self._fuente = "catalogo"
        self._error = None
        self._guardar_cache()
        logger.info(
            "conocimiento_actualizado",
            extra={
                "event": "knowledge_refresh",
                "documentos": len(documentos),
                "embeddings": len(vectores),
            },
        )

    def _esta_vencido(self) -> bool:
        return (time.time() - self._actualizado) > self._settings.conocimiento_ttl_seconds

    def estado(self) -> dict[str, Any]:
        estadisticas = (
            self._indice.estadisticas()
            if self._indice is not None
            else {
                "documentos": 0,
                "platos": 0,
                "restaurantes": 0,
                "embeddings": 0,
                "ciudades": [],
            }
        )
        return {
            **estadisticas,
            "actualizado_en": (
                datetime.fromtimestamp(self._actualizado, tz=UTC).isoformat()
                if self._actualizado
                else None
            ),
            "ttl_segundos": self._settings.conocimiento_ttl_seconds,
            "fresco": bool(self._indice is not None and not self._esta_vencido()),
            "fuente": self._fuente,
            "modelo_chat": self._settings.modelo_chat,
            "modelo_embeddings": self._settings.modelo_embeddings,
            "error": self._error,
            "error_embeddings": self._error_embeddings,
        }

    def _cargar_cache(self) -> None:
        if not self._cache.exists():
            return
        try:
            datos = json.loads(self._cache.read_text(encoding="utf-8"))
            if int(datos.get("version") or 0) != _VERSION_CACHE:
                return
            if datos.get("modelo_embeddings") != self._settings.modelo_embeddings:
                return
            documentos = [
                documento_desde_dict(item) for item in datos.get("documentos") or []
            ]
            if not documentos:
                return
            embeddings = datos.get("embeddings") or []
            self._indice = IndiceRAG(documentos, embeddings)
            self._actualizado = float(datos.get("actualizado") or 0)
            self._fuente = "disco"
        except (OSError, ValueError, KeyError, TypeError):
            logger.warning("cache_conocimiento_ilegible", extra={"event": "knowledge_cache"})

    def _guardar_cache(self) -> None:
        if self._indice is None:
            return
        try:
            self._directorio.mkdir(parents=True, exist_ok=True)
            datos = {
                "version": _VERSION_CACHE,
                "actualizado": self._actualizado,
                "modelo_embeddings": self._settings.modelo_embeddings,
                "documentos": [
                    documento_a_dict(documento) for documento in self._indice.documentos
                ],
                "embeddings": self._indice.embeddings,
            }
            temporal = self._cache.with_suffix(".tmp")
            temporal.write_text(
                json.dumps(datos, ensure_ascii=False),
                encoding="utf-8",
            )
            temporal.replace(self._cache)
        except OSError as exc:
            logger.warning(
                "cache_conocimiento_no_guardada",
                extra={"event": "knowledge_cache", "error": str(exc)[:200]},
            )

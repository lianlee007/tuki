"""Extractor compuesto: catálogo de restaurantes + conocimiento de plataforma."""

from __future__ import annotations

import asyncio
import logging

from app.dominio.conocimiento import Documento

logger = logging.getLogger(__name__)


class ExtractorCompuesto:
    """Ejecuta varios extractores y tolera que uno falle.

    Si el servicio de restaurantes no responde, las preguntas sobre la
    plataforma siguen funcionando; si falta el markdown, el catálogo sigue
    funcionando.
    """

    def __init__(self, extractores: list) -> None:
        self._extractores = extractores

    async def extraer(self) -> list[Documento]:
        resultados = await asyncio.gather(
            *(extractor.extraer() for extractor in self._extractores),
            return_exceptions=True,
        )
        documentos: list[Documento] = []
        for resultado in resultados:
            if isinstance(resultado, Exception):
                logger.warning(
                    "extractor_omitido",
                    extra={
                        "event": "knowledge_extractor_error",
                        "error": str(resultado)[:200],
                    },
                )
                continue
            documentos.extend(resultado)
        return documentos

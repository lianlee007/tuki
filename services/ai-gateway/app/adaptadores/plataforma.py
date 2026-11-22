"""Conocimiento propio de la plataforma TukiTuki.

El catálogo responde "qué comer"; este extractor responde "cómo funciona
TukiTuki": cuentas, panel, pedidos, reseñas, privacidad, IA local y soporte.
Se lee de un markdown que viaja dentro de la imagen, así que no necesita
servicios adicionales ni otra base de datos.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

from app.dominio.conocimiento import Documento

logger = logging.getLogger(__name__)

_RUTA = Path(__file__).resolve().parents[1] / "conocimiento" / "plataforma.md"
_SECCION = re.compile(r"^##\s+(.+)$", re.MULTILINE)


def _slug(texto: str) -> str:
    limpio = re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-")
    return limpio or "seccion"


class ExtractorPlataforma:
    """Convierte el markdown de plataforma en documentos indexables."""

    def __init__(self, ruta: Path | None = None) -> None:
        self._ruta = ruta or _RUTA

    async def extraer(self) -> list[Documento]:
        try:
            texto = self._ruta.read_text(encoding="utf-8")
        except OSError as exc:
            logger.warning(
                "plataforma_sin_documento",
                extra={"event": "knowledge_platform_missing", "error": str(exc)[:200]},
            )
            return []

        partes = _SECCION.split(texto)
        documentos: list[Documento] = []

        intro = partes[0].strip()
        if intro:
            documentos.append(
                Documento(
                    id="plataforma:inicio",
                    tipo="plataforma",
                    texto=intro,
                    metadata={
                        "id": "plataforma:inicio",
                        "tipo": "plataforma",
                        "nombre": "TukiTuki",
                        "restaurante": "TukiTuki",
                        "restaurante_slug": "",
                    },
                )
            )

        # `re.split` con un grupo deja [intro, titulo, cuerpo, titulo, cuerpo...]
        for indice in range(1, len(partes) - 1, 2):
            titulo = partes[indice].strip()
            cuerpo = partes[indice + 1].strip()
            if not titulo or not cuerpo:
                continue
            documentos.append(
                Documento(
                    id=f"plataforma:{_slug(titulo)}",
                    tipo="plataforma",
                    texto=f"{titulo}. {cuerpo}",
                    metadata={
                        "id": f"plataforma:{_slug(titulo)}",
                        "tipo": "plataforma",
                        "nombre": titulo,
                        "restaurante": "TukiTuki",
                        "restaurante_slug": "",
                    },
                )
            )

        return documentos

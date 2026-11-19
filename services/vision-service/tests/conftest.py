"""Dobles de prueba para no cargar torch en cada ejecución."""

from __future__ import annotations

import io
from pathlib import Path

import pytest
from PIL import Image

from app.config import Settings
from app.dominio.clasificador import Veredicto


class ClasificadorFalso:
    etiquetas = ["comida", "no-comida"]
    umbral = 0.5
    nombre_modelo = "falso.pt"

    def __init__(self, probabilidad_comida: float = 0.9) -> None:
        self.probabilidad_comida = probabilidad_comida
        self.llamadas = 0

    def clasificar(self, imagen: Image.Image) -> Veredicto:
        self.llamadas += 1
        return Veredicto(
            es_comida=self.probabilidad_comida >= self.umbral,
            etiqueta="comida" if self.probabilidad_comida >= self.umbral else "no-comida",
            confianza=max(self.probabilidad_comida, 1 - self.probabilidad_comida),
            probabilidad_comida=self.probabilidad_comida,
            umbral=self.umbral,
        )


def imagen_png(color: str = "orange") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (64, 64), color).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def ajustes(tmp_path: Path) -> Settings:
    return Settings(
        model_path=tmp_path / "falso.pt",
        environment="test",
        umbral_comida=0.5,
        max_imagen_bytes=1024 * 1024,
    )

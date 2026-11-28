"""Clasificación de una foto como comida o no comida.

El modelo es un YOLO de clasificación de Ultralytics (por ejemplo
``yolo11n-cls``) afinado con las etiquetas de Label Studio. El dominio no sabe
nada de FastAPI ni de archivos: recibe una imagen PIL y devuelve un veredicto.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from PIL import Image


class ErrorModelo(RuntimeError):
    """El modelo no se pudo cargar o no tiene la clase esperada."""


@dataclass(frozen=True)
class Veredicto:
    """Resultado de revisar una imagen."""

    es_comida: bool
    etiqueta: str
    confianza: float
    probabilidad_comida: float
    umbral: float


class ClasificadorComida(Protocol):
    """Contrato que consumen las rutas (y los dobles de prueba)."""

    etiquetas: list[str]
    umbral: float
    nombre_modelo: str

    def clasificar(self, imagen: Image.Image) -> Veredicto: ...


def _normalizar(nombre: str) -> str:
    """Compara etiquetas sin depender de tildes, mayúsculas ni guiones."""
    sin_tildes = "".join(
        caracter
        for caracter in unicodedata.normalize("NFKD", nombre)
        if not unicodedata.combining(caracter)
    )
    return " ".join(sin_tildes.lower().replace("-", " ").replace("_", " ").split())


def buscar_indice_comida(etiquetas: list[str], etiqueta_comida: str) -> int | None:
    """Índice de la clase positiva; ``None`` si el modelo no la tiene."""
    for indice, nombre in enumerate(etiquetas):
        if _normalizar(nombre) == _normalizar(etiqueta_comida):
            return indice
    return None


class ClasificadorYolo:
    """Envoltura mínima sobre ``ultralytics.YOLO`` para clasificación."""

    def __init__(
        self,
        ruta_modelo: Path,
        *,
        umbral: float = 0.65,
        etiqueta_comida: str = "comida",
        imgsz: int = 224,
        device: str = "cpu",
    ) -> None:
        if not ruta_modelo.exists():
            raise ErrorModelo(f"No se encontró el modelo en {ruta_modelo}")
        try:
            from ultralytics import YOLO
        except ImportError as exc:  # pragma: no cover - depende del entorno
            raise ErrorModelo(
                "Falta ultralytics. Instala las dependencias del servicio: "
                "pip install -r requirements.txt"
            ) from exc

        try:
            self._modelo = YOLO(str(ruta_modelo))
        except Exception as exc:  # noqa: BLE001 - se traduce a error de dominio
            raise ErrorModelo(f"No se pudo cargar el modelo: {exc}") from exc

        nombres = getattr(self._modelo, "names", None) or {}
        self.etiquetas = [str(nombres[indice]) for indice in sorted(nombres)]
        indice = buscar_indice_comida(self.etiquetas, etiqueta_comida)
        if indice is None:
            raise ErrorModelo(
                f"El modelo no tiene la clase {etiqueta_comida!r}; "
                f"clases disponibles: {', '.join(self.etiquetas) or 'ninguna'}"
            )
        self._indice_comida = indice

        self.umbral = umbral
        self.nombre_modelo = ruta_modelo.name
        self._imgsz = imgsz
        self._device = device

    def clasificar(self, imagen: Image.Image) -> Veredicto:
        resultado = self._modelo.predict(
            source=imagen,
            imgsz=self._imgsz,
            device=self._device,
            verbose=False,
        )[0]
        probabilidades = resultado.probs
        if probabilidades is None:  # pragma: no cover - salvaguarda
            raise ErrorModelo("El modelo no devolvió probabilidades de clasificación")

        valores = [float(valor) for valor in probabilidades.data.tolist()]
        indice_ganador = int(probabilidades.top1)
        probabilidad_comida = valores[self._indice_comida]
        return Veredicto(
            es_comida=probabilidad_comida >= self.umbral,
            etiqueta=self.etiquetas[indice_ganador],
            confianza=valores[indice_ganador],
            probabilidad_comida=probabilidad_comida,
            umbral=self.umbral,
        )

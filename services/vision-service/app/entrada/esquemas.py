"""Contratos HTTP del servicio de visión."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SaludRespuesta(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class VeredictoRespuesta(BaseModel):
    """Resultado de revisar una foto.

    ``es_comida`` es la decisión final ya comparada con ``umbral``. El cliente
    puede mostrar ``probabilidad_comida`` como porcentaje de seguridad.
    """

    es_comida: bool
    etiqueta: str
    confianza: float = Field(ge=0.0, le=1.0)
    probabilidad_comida: float = Field(ge=0.0, le=1.0)
    umbral: float = Field(ge=0.0, le=1.0)
    modelo: str


class ModeloRespuesta(BaseModel):
    modelo: str
    etiquetas: list[str]
    umbral: float
    imgsz: int
    metricas: dict[str, Any] | None = None

"""Configuración del servicio de visión, validada al arrancar.

Todas las variables usan el prefijo ``VISION_``. El modelo se carga desde disco
y no se llama a ningún proveedor externo: la inferencia ocurre en este proceso.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Raíz del servicio (services/vision-service). Así el modelo por defecto se
# encuentra aunque uvicorn se arranque desde otro directorio.
RAIZ_SERVICIO = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VISION_",
        env_file=None,
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "tuki-vision"
    version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"

    # --- Modelo ------------------------------------------------------------
    # Pesos de Ultralytics (YOLO de clasificación). Se generan con
    # `entrenamiento/entrenar.py`.
    model_path: Path = RAIZ_SERVICIO / "modelos" / "comida-v1.pt"
    # Probabilidad mínima de "comida" para aceptar la foto. Se puede ajustar
    # sin reentrenar; `entrenamiento/evaluar.py` propone el mejor umbral. Con el
    # modelo v1, 0.65 deja fuera las fotos que no son platos (plantas, mascotas,
    # hojas) sin rechazar platos reales: en test da precisión 1.0 y recall 0.973.
    umbral_comida: float = Field(default=0.65, ge=0.0, le=1.0)
    # Nombre de la clase positiva dentro del modelo.
    etiqueta_comida: str = "comida"
    # Resolución de inferencia. El entrenamiento usa la misma.
    imgsz: int = Field(default=224, ge=64, le=1024)
    device: str = "cpu"

    # --- Límites de la API -------------------------------------------------
    max_imagen_bytes: int = Field(default=8 * 1024 * 1024, ge=1)
    cors_origins: str = ""

    @field_validator("model_path")
    @classmethod
    def _resolver_ruta(cls, value: Path) -> Path:
        return value.expanduser()

    @field_validator("log_level")
    @classmethod
    def _nivel_en_mayusculas(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("etiqueta_comida")
    @classmethod
    def _etiqueta_no_vacia(cls, value: str) -> str:
        limpia = value.strip()
        if not limpia:
            raise ValueError("VISION_ETIQUETA_COMIDA no puede estar vacía")
        return limpia

    @model_validator(mode="after")
    def _resolver_modelo_relativo(self) -> Settings:
        if not self.model_path.is_absolute():
            self.model_path = (RAIZ_SERVICIO / self.model_path).resolve()
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def ruta_metricas(self) -> Path:
        """Informe que escribe `entrenamiento/evaluar.py` junto al modelo."""
        return self.model_path.with_suffix(".metricas.json")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

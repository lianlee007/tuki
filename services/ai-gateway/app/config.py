"""Configuración del AI Gateway, validada al arrancar.

Todas las variables usan el prefijo ``AI_`` salvo las credenciales, que se leen
con su nombre estándar para integrarse con los secretos de Docker/Kubernetes:
``GROQ_API_KEY`` y ``SUPABASE_URL``.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AI_",
        env_file=None,
        extra="ignore",
        populate_by_name=True,
        case_sensitive=False,
    )

    app_name: str = "tuki-ai-gateway"
    version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"

    # --- Autenticación -----------------------------------------------------
    auth_mode: Literal["disabled", "supabase"] = "supabase"
    # La corrección de barrio del carrito la usa un cliente anónimo. Si se
    # desactiva, toda llamada exige un JWT de Supabase.
    allow_anon: bool = True
    supabase_url: str = Field(
        "",
        validation_alias=AliasChoices("SUPABASE_URL", "AI_SUPABASE_URL"),
    )
    supabase_jwks_url: str = ""
    supabase_audience: str = "authenticated"
    supabase_issuer: str = ""
    jwt_algorithms: str = "RS256,ES256,EdDSA,HS256"
    jwks_cache_seconds: int = 600
    trust_proxy_headers: bool = True
    # Los proyectos antiguos de Supabase firman los JWT con HS256 y su endpoint
    # JWKS no publica claves, así que la firma no se puede comprobar en local.
    # En ese caso el token se valida contra GoTrue con la clave pública `anon`.
    supabase_anon_key: SecretStr = Field(
        default=SecretStr(""),
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "AI_SUPABASE_ANON_KEY"),
    )
    supabase_userinfo_url: str = ""
    legacy_token_cache_seconds: int = 60

    # --- Groq --------------------------------------------------------------
    groq_api_key: SecretStr = Field(
        default=SecretStr(""),
        validation_alias=AliasChoices("GROQ_API_KEY", "AI_GROQ_API_KEY"),
    )
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_models: str = "openai/gpt-oss-120b,openai/gpt-oss-20b,allam-2-7b"
    groq_timeout_seconds: float = 30.0
    groq_total_timeout_seconds: float = 40.0
    groq_max_attempts: int = 3
    groq_backoff_seconds: float = 0.5
    groq_max_backoff_seconds: float = 4.0

    # --- Límites de la API -------------------------------------------------
    request_max_chars: int = 4000
    max_output_tokens: int = 1024
    rate_limit_anon_per_minute: int = 10
    rate_limit_anon_burst: int = 4
    rate_limit_auth_per_minute: int = 30
    rate_limit_auth_burst: int = 8

    # --- Observabilidad / CORS --------------------------------------------
    cors_origins: str = ""
    otel_enabled: bool = False
    otel_service_name: str = "tuki-ai-gateway"
    otel_endpoint: str = ""

    @field_validator("groq_base_url", "supabase_url")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.strip().rstrip("/")

    @field_validator("log_level")
    @classmethod
    def _upper_level(cls, value: str) -> str:
        return value.strip().upper()

    @model_validator(mode="after")
    def _derive_supabase_urls(self) -> Settings:
        if self.supabase_url and not self.supabase_jwks_url:
            self.supabase_jwks_url = (
                f"{self.supabase_url}/auth/v1/.well-known/jwks.json"
            )
        if self.supabase_url and not self.supabase_userinfo_url:
            self.supabase_userinfo_url = f"{self.supabase_url}/auth/v1/user"
        if self.supabase_url and not self.supabase_issuer:
            self.supabase_issuer = f"{self.supabase_url}/auth/v1"
        return self

    @property
    def models(self) -> list[str]:
        return [item.strip() for item in self.groq_models.split(",") if item.strip()]

    @property
    def algorithms(self) -> list[str]:
        return [item.strip() for item in self.jwt_algorithms.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def groq_key_configured(self) -> bool:
        return bool(self.groq_api_key.get_secret_value().strip())

    @property
    def supabase_anon_configured(self) -> bool:
        return bool(self.supabase_anon_key.get_secret_value().strip())

    def validate_or_raise(self) -> None:
        """Falla rápido ante errores que no se pueden corregir en caliente."""
        errors: list[str] = []
        if self.auth_mode == "supabase" and not self.supabase_url:
            errors.append("SUPABASE_URL es obligatoria con AI_AUTH_MODE=supabase")
        if self.auth_mode == "supabase" and "TU_PROYECTO" in self.supabase_url.upper():
            errors.append("SUPABASE_URL sigue siendo el placeholder de ejemplo")
        if self.auth_mode == "disabled" and self.environment.lower() == "production":
            errors.append("AI_AUTH_MODE=disabled no se permite en producción")
        for name in (
            "rate_limit_anon_per_minute",
            "rate_limit_anon_burst",
            "rate_limit_auth_per_minute",
            "rate_limit_auth_burst",
            "request_max_chars",
            "max_output_tokens",
        ):
            if getattr(self, name) < 1:
                errors.append(f"{name} debe ser mayor que cero")
        if not self.models:
            errors.append("AI_GROQ_MODELS no puede estar vacío")
        if errors:
            raise RuntimeError("Configuración inválida: " + "; ".join(errors))

    def readiness_errors(self) -> list[str]:
        """Comprobaciones que no deben tumbar el proceso, solo quitar readiness."""
        errors: list[str] = []
        if not self.groq_key_configured:
            errors.append("GROQ_API_KEY no configurada")
        if self.auth_mode == "supabase" and not self.supabase_jwks_url:
            errors.append("JWKS de Supabase no configurado")
        return errors


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
